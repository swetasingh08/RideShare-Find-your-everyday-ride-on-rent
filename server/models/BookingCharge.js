import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const bookingChargeSchema = new mongoose.Schema({
    booking: { type: ObjectId, ref: "Booking", required: true, index: true },
    user: { type: ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["razorpay"], default: "razorpay" },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    extraKmAmount: { type: Number, default: 0, min: 0 },
    lateReturnAmount: { type: Number, default: 0, min: 0 },
    providerOrderId: { type: String, unique: true, sparse: true },
    providerPaymentId: { type: String, unique: true, sparse: true },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    failureReason: { type: String, default: "" },
    paidAt: { type: Date },
}, { timestamps: true });

const BookingCharge = mongoose.model("BookingCharge", bookingChargeSchema);

export default BookingCharge;
