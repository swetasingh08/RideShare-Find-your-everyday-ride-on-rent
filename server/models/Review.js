import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const reviewSchema = new mongoose.Schema({
    booking: { type: ObjectId, ref: "Booking", required: true, unique: true },
    reviewer: { type: ObjectId, ref: "User", required: true },
    reviewerLocation: { type: String, default: "", maxlength: 80, trim: true },
    reviewee: { type: ObjectId, ref: "User", required: true },
    car: { type: ObjectId, ref: "Car", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 1000, trim: true },
    status: { type: String, enum: ["published", "hidden"], default: "published" },
    ownerResponse: { type: String, default: "", maxlength: 1000, trim: true },
    ownerRespondedAt: { type: Date },
    moderationNote: { type: String, default: "", maxlength: 500, trim: true },
    moderatedAt: { type: Date },
    moderatedBy: { type: ObjectId, ref: "User" },
}, { timestamps: true });

reviewSchema.index({ car: 1, status: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
