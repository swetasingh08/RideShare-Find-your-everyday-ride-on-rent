import crypto from "crypto";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import BookingCharge from "../models/BookingCharge.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import { getPaymentGateway } from "../services/paymentService.js";

const paymentsEnabled = () => process.env.PAYMENTS_ENABLED === "true";

const sign = (value, secret) => crypto.createHmac("sha256", secret).update(value).digest("hex");

const sameSignature = (actual, expected) => {
    if (!actual || !expected || actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
};

const confirmBookingAfterPayment = async (booking, providerPaymentId) => {
    const previousStatus = booking.status;
    booking.paymentStatus = "paid";
    if (booking.securityDeposit > 0) booking.securityDepositStatus = "held";
    booking.paymentId = providerPaymentId || booking.paymentId;
    // Payment does not rent the vehicle by itself. The owner must approve the
    // request before it becomes confirmed and the trip can start.
    booking.status = "pending";
    await booking.save();

    if (previousStatus !== "confirmed" && booking.status === "confirmed") {
        await User.findByIdAndUpdate(booking.owner, { $inc: { totalTrips: 1 } });
    }
    await Promise.all([
        createNotification({ recipient: booking.user, type: "payment_success", title: "Payment successful", message: "Your booking payment was verified.", booking: booking._id }),
        createNotification({ recipient: booking.owner, type: "payment_success", title: "Booking payment received", message: "A renter completed payment for your vehicle.", booking: booking._id }),
    ]);
};

export const createPaymentOrder = async (req, res) => {
    try {
        if (!paymentsEnabled()) {
            return res.status(503).json({ success: false, message: "Online payments are not enabled" });
        }

        const gateway = getPaymentGateway();
        if (!gateway) return res.status(503).json({ success: false, message: "Payment gateway is not configured" });

        const booking = await Booking.findOne({ _id: req.body.bookingId, user: req.user._id });
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
        if (["cancelled", "completed", "refunded"].includes(booking.status)) {
            return res.status(400).json({ success: false, message: "This booking cannot be paid" });
        }
        if (booking.paymentStatus === "paid") {
            return res.status(400).json({ success: false, message: "This booking is already paid" });
        }

        const amount = Math.round(Number(booking.totalAmount ?? booking.price) * 100);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: "Booking has an invalid payment amount" });
        }

        const existingPayment = await Payment.findOne({ booking: booking._id });
        if (existingPayment?.status === "pending" && existingPayment.providerOrderId) {
            return res.json({
                success: true,
                keyId: process.env.RAZORPAY_KEY_ID,
                order: { id: existingPayment.providerOrderId, amount, currency: existingPayment.currency },
            });
        }

        const order = await gateway.orders.create({
            amount,
            currency: "INR",
            receipt: `rideshare_${booking._id}`.slice(0, 40),
            notes: { bookingId: booking._id.toString() },
        });

        await Payment.findOneAndUpdate(
            { booking: booking._id },
            { booking: booking._id, user: booking.user, amount: amount / 100, currency: "INR", providerOrderId: order.id, status: "pending" },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        booking.paymentStatus = "pending";
        booking.status = "pending_payment";
        await booking.save();

        res.json({ success: true, keyId: process.env.RAZORPAY_KEY_ID, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        if (!paymentsEnabled()) return res.status(503).json({ success: false, message: "Online payments are not enabled" });
        const gateway = getPaymentGateway();
        if (!gateway) return res.status(503).json({ success: false, message: "Payment gateway is not configured" });

        const { bookingId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
        const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
        const payment = await Payment.findOne({ booking: bookingId, providerOrderId: orderId });
        if (!booking || !payment) return res.status(404).json({ success: false, message: "Payment order not found" });

        const expected = sign(`${orderId}|${paymentId}`, process.env.RAZORPAY_KEY_SECRET);
        if (!sameSignature(signature, expected)) {
            payment.status = "failed";
            payment.failureReason = "Signature verification failed";
            await payment.save();
            booking.paymentStatus = "failed";
            booking.status = "payment_failed";
            await booking.save();
            await createNotification({ recipient: booking.user, type: "payment_failed", title: "Payment verification failed", message: "Your payment could not be verified. You can retry from your booking.", booking: booking._id });
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        const order = await gateway.orders.fetch(orderId);
        if (order.status !== "paid" || Number(order.amount) !== Math.round(Number(payment.amount) * 100)) {
            return res.status(400).json({ success: false, message: "Payment amount does not match the booking" });
        }

        const providerPayment = await gateway.payments.fetch(paymentId);
        if (
            providerPayment.order_id !== orderId ||
            Number(providerPayment.amount) !== Number(order.amount) ||
            providerPayment.status !== "captured"
        ) {
            payment.status = providerPayment.status === "failed" ? "failed" : "pending";
            payment.failureReason = providerPayment.status === "failed" ? (providerPayment.error_description || "Payment failed") : "Payment has not been captured";
            await payment.save();
            return res.status(400).json({ success: false, message: "Payment has not been captured by Razorpay" });
        }

        payment.status = "paid";
        payment.providerPaymentId = paymentId;
        payment.paidAt = new Date();
        await payment.save();
        await confirmBookingAfterPayment(booking, paymentId);

        res.json({ success: true, message: "Payment verified", status: booking.status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const markChargePaid = async (charge, providerPaymentId) => {
    charge.status = "paid";
    charge.providerPaymentId = providerPaymentId;
    charge.paidAt = new Date();
    await charge.save();
    await Booking.findByIdAndUpdate(charge.booking, { additionalPaymentStatus: "paid" });
};

export const createAdditionalChargeOrder = async (req, res) => {
    try {
        if (!paymentsEnabled()) return res.status(503).json({ success: false, message: "Online payments are not enabled" });
        const gateway = getPaymentGateway();
        if (!gateway) return res.status(503).json({ success: false, message: "Payment gateway is not configured" });

        const charge = await BookingCharge.findOne({ _id: req.body.chargeId, user: req.user._id }).populate("booking");
        if (!charge) return res.status(404).json({ success: false, message: "Additional charge not found" });
        if (charge.status === "paid") return res.status(400).json({ success: false, message: "This charge is already paid" });
        if (!charge.amount || charge.amount <= 0) return res.status(400).json({ success: false, message: "There is no additional amount due" });

        if (charge.status === "pending" && charge.providerOrderId) {
            return res.json({ success: true, keyId: process.env.RAZORPAY_KEY_ID, order: { id: charge.providerOrderId, amount: Math.round(charge.amount * 100), currency: charge.currency } });
        }

        const order = await gateway.orders.create({
            amount: Math.round(charge.amount * 100),
            currency: charge.currency || "INR",
            receipt: `charge_${charge._id}`.slice(0, 40),
            notes: { bookingId: charge.booking._id.toString(), chargeId: charge._id.toString(), type: "booking_settlement" },
        });
        charge.providerOrderId = order.id;
        charge.status = "pending";
        await charge.save();
        await Booking.findByIdAndUpdate(charge.booking._id, { additionalPaymentStatus: "pending" });
        res.json({ success: true, keyId: process.env.RAZORPAY_KEY_ID, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyAdditionalCharge = async (req, res) => {
    try {
        if (!paymentsEnabled()) return res.status(503).json({ success: false, message: "Online payments are not enabled" });
        const gateway = getPaymentGateway();
        if (!gateway) return res.status(503).json({ success: false, message: "Payment gateway is not configured" });
        const { chargeId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
        const charge = await BookingCharge.findOne({ _id: chargeId, user: req.user._id, providerOrderId: orderId });
        if (!charge) return res.status(404).json({ success: false, message: "Additional charge order not found" });
        const expected = sign(`${orderId}|${paymentId}`, process.env.RAZORPAY_KEY_SECRET);
        if (!sameSignature(signature, expected)) {
            charge.status = "failed";
            charge.failureReason = "Signature verification failed";
            await charge.save();
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }
        const [order, providerPayment] = await Promise.all([gateway.orders.fetch(orderId), gateway.payments.fetch(paymentId)]);
        if (order.status !== "paid" || providerPayment.order_id !== orderId || providerPayment.status !== "captured" || Number(providerPayment.amount) !== Math.round(charge.amount * 100)) {
            charge.status = providerPayment.status === "failed" ? "failed" : "pending";
            charge.failureReason = "Payment has not been captured or the amount does not match";
            await charge.save();
            return res.status(400).json({ success: false, message: "Additional charge has not been captured by Razorpay" });
        }
        await markChargePaid(charge, paymentId);
        res.json({ success: true, message: "Additional charge paid" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const handlePaymentWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers["x-razorpay-signature"];
        const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
        if (!webhookSecret || /^https?:\/\//i.test(webhookSecret) || !sameSignature(signature, sign(rawBody, webhookSecret))) {
            return res.status(400).json({ success: false, message: "Invalid webhook signature" });
        }

        if (req.body?.event === "refund.processed") {
            const refundEntity = req.body?.payload?.refund?.entity;
            const payment = refundEntity?.payment_id ? await Payment.findOne({ providerPaymentId: refundEntity.payment_id }) : null;
            if (payment) {
                const refundAmount = Number(refundEntity.amount || 0) / 100;
                const alreadyRecorded = payment.providerRefundId === refundEntity.id;
                const booking = await Booking.findById(payment.booking);
                if (!alreadyRecorded) {
                    payment.refundedAmount = Number(payment.refundedAmount || 0) + refundAmount;
                    payment.status = Number(payment.refundedAmount || 0) >= Number(payment.amount || 0) ? "refunded" : "partially_refunded";
                    payment.providerRefundId = refundEntity.id || payment.providerRefundId;
                    payment.refundedAt = new Date();
                    await payment.save();
                    if (booking) {
                        booking.paymentStatus = payment.status;
                        if (["cancelled", "rejected"].includes(booking.status)) {
                            booking.cancellationRefundAmount = Number(booking.cancellationRefundAmount || 0) || refundAmount;
                            booking.cancellationRefundStatus = payment.status === "refunded" ? "processed" : "pending";
                            booking.cancellationRefundProcessedAt = payment.status === "refunded" ? new Date() : undefined;
                            booking.cancellationRefundFailureReason = "";
                        }
                        if (booking.status === "completed" && booking.depositRefundAmount > 0) {
                            booking.securityDepositStatus = Number(payment.refundedAmount || 0) >= Number(booking.depositRefundAmount || 0) ? "refunded" : "partially_refunded";
                        }
                        await booking.save();
                        await createNotification({
                            recipient: booking.user,
                            type: "refund_processed",
                            title: "Refund processed",
                            message: `Your refund of ₹${refundAmount} has been processed back to your original payment method.`,
                            booking: booking._id,
                        });
                    }
                }
            }
            return res.json({ success: true });
        }

        if (req.body?.event === "refund.failed") {
            const refundEntity = req.body?.payload?.refund?.entity;
            const payment = refundEntity?.payment_id ? await Payment.findOne({ providerPaymentId: refundEntity.payment_id }) : null;
            if (payment) {
                const alreadyFailed = payment.status === "refund_failed" && payment.failureReason === (refundEntity.error_description || "Refund failed");
                payment.status = "refund_failed";
                payment.failureReason = refundEntity.error_description || "Refund failed";
                await payment.save();
                const booking = await Booking.findById(payment.booking);
                if (booking && ["cancelled", "rejected"].includes(booking.status)) {
                    booking.cancellationRefundStatus = "failed";
                    booking.cancellationRefundFailureReason = payment.failureReason;
                    await booking.save();
                } else if (booking && booking.status === "completed" && booking.securityDeposit > 0) {
                    booking.securityDepositStatus = "refund_failed";
                    await booking.save();
                }
                if (booking && !alreadyFailed) {
                    booking.paymentStatus = "refund_failed";
                    await booking.save();
                    await createNotification({ recipient: booking.user, type: "refund_failed", title: "Refund needs review", message: "The payment provider could not complete your refund automatically. Support will review it.", booking: booking._id });
                }
            }
            return res.json({ success: true });
        }

        const entity = req.body?.payload?.payment?.entity;
        if (entity?.id) {
            const charge = entity.order_id ? await BookingCharge.findOne({ providerOrderId: entity.order_id }) : null;
            if (charge) {
                if (entity.status === "captured" && charge.status !== "paid") await markChargePaid(charge, entity.id);
                if (entity.status === "failed") {
                    charge.status = "failed";
                    charge.failureReason = entity.error_description || "Payment failed";
                    await charge.save();
                    await Booking.findByIdAndUpdate(charge.booking, { additionalPaymentStatus: "failed" });
                }
                return res.json({ success: true });
            }
            const payment = entity.order_id
                ? await Payment.findOne({ providerOrderId: entity.order_id })
                : entity.notes?.bookingId ? await Payment.findOne({ booking: entity.notes.bookingId }) : null;
            if (payment) {
                const booking = await Booking.findById(payment.booking);
                if (booking && entity.status === "captured" && payment.status !== "paid") {
                    payment.status = "paid";
                    payment.providerPaymentId = entity.id;
                    payment.paidAt = new Date();
                    await payment.save();
                    await confirmBookingAfterPayment(booking, entity.id);
                }
                if (entity.status === "failed") {
                    payment.status = "failed";
                    payment.failureReason = entity.error_description || "Payment failed";
                    await payment.save();
                    if (booking) {
                        booking.paymentStatus = "failed";
                        booking.status = "payment_failed";
                        await booking.save();
                        await createNotification({ recipient: booking.user, type: "payment_failed", title: "Payment failed", message: "Your payment could not be completed.", booking: booking._id });
                    }
                }
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
