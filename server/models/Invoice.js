import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const invoiceSchema = new mongoose.Schema({
    booking: { type: ObjectId, ref: "Booking", required: true, unique: true },
    invoiceNumber: { type: String, required: true, unique: true },
    user: { type: ObjectId, ref: "User", required: true },
    owner: { type: ObjectId, ref: "User", required: true },
    currency: { type: String, default: "INR" },
    rentalAmount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },
    extraKmAmount: { type: Number, default: 0 },
    lateReturnAmount: { type: Number, default: 0 },
    totalAdditionalCharges: { type: Number, default: 0 },
    depositAppliedAmount: { type: Number, default: 0 },
    depositRefundAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    issuedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
