import Razorpay from "razorpay";
import Payment from "../models/Payment.js";

export const getPaymentGateway = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
    return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

export const refundCapturedPayment = async (booking) => {
    if (booking.paymentStatus !== "paid") return { status: "not_required" };
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return { status: "not_configured" };
    const payment = await Payment.findOne({ booking: booking._id, status: { $in: ["paid", "refund_failed", "partially_refunded", "refund_pending"] } });
    if (!payment?.providerPaymentId) return { status: "not_available" };
    return refundPaymentAmount(booking, payment.amount, "booking cancellation");
};

export const refundPaymentAmount = async (booking, amount, reason = "booking settlement") => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return { status: "not_configured" };
    const payment = await Payment.findOne({ booking: booking._id, status: { $in: ["paid", "refund_failed", "partially_refunded", "refund_pending"] } });
    if (!payment?.providerPaymentId) return { status: "not_available" };

    const totalAmount = Number(payment.amount || 0);
    const alreadyRefunded = Number(payment.refundedAmount || 0);
    const refundAmount = Math.min(Math.max(0, Number(amount || 0)), Math.max(0, totalAmount - alreadyRefunded));
    if (!refundAmount) return { status: "not_required" };
    if (payment.status === "refund_pending") return { status: payment.status, amount: payment.requestedRefundAmount };

    const gateway = getPaymentGateway();
    if (!gateway) return { status: "not_configured" };

    const refund = await gateway.payments.refund(payment.providerPaymentId, {
        amount: Math.round(refundAmount * 100),
        notes: { bookingId: booking._id.toString(), reason },
    });
    payment.status = "refund_pending";
    payment.providerRefundId = refund.id;
    payment.requestedRefundAmount = refundAmount;
    await payment.save();
    booking.paymentStatus = "refund_pending";
    await booking.save();
    return { status: "refund_pending", refundId: refund.id, amount: refundAmount };
};
