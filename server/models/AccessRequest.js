import mongoose from "mongoose";

const accessRequestSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        reviewedAt: { type: Date },
        reviewedBy: { type: String },
        reviewNote: { type: String, trim: true },
    },
    { timestamps: true }
);

accessRequestSchema.index({ email: 1, status: 1 });

export default mongoose.model("AccessRequest", accessRequestSchema);
