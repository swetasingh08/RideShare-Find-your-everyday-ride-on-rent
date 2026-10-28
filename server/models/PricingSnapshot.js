import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const pricingSnapshotSchema = new mongoose.Schema({
    car: { type: ObjectId, ref: "Car", required: true },
    owner: { type: ObjectId, ref: "User", required: true },
    dateKey: { type: String, required: true },
    currentPrice: { type: Number, required: true },
    suggestedPrice: { type: Number, required: true },
    marketAverage: { type: Number, default: 0 },
    bookingsLast30Days: { type: Number, default: 0 },
    utilizationPercent: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    recommendation: { type: String, default: "" },
}, { timestamps: true });

pricingSnapshotSchema.index({ car: 1, dateKey: 1 }, { unique: true });

const PricingSnapshot = mongoose.model("PricingSnapshot", pricingSnapshotSchema);

export default PricingSnapshot;
