import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const paymentSchema = new mongoose.Schema({
    booking: { type: ObjectId, ref: "Booking", required: true, unique: true },
    user: { type: ObjectId, ref: "User", required: true },
    provider: { type: String, enum: ["razorpay"], default: "razorpay" },
    providerOrderId: { type: String, unique: true, sparse: true },
    providerPaymentId: { type: String, unique: true, sparse: true },
    providerRefundId: { type: String, unique: true, sparse: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["pending", "paid", "failed", "refund_pending", "refund_failed", "partially_refunded", "refunded"], default: "pending" },
    failureReason: { type: String, default: "" },
    paidAt: { type: Date },
    refundedAmount: { type: Number, default: 0, min: 0 },
    requestedRefundAmount: { type: Number, default: 0, min: 0 },
    refundedAt: { type: Date },
}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
