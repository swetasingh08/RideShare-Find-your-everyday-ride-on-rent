import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";

const recalculateOwnerRating = async (ownerId) => {
    const [summary] = await Review.aggregate([
        { $match: { reviewee: ownerId, status: "published" } },
        { $group: { _id: "$reviewee", average: { $avg: "$rating" } } },
    ]);
    await User.findByIdAndUpdate(ownerId, { averageRating: summary ? Math.round(summary.average * 10) / 10 : 0 });
};

export const getCarReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ car: req.params.carId, status: "published" })
            .populate("reviewer", "name image location")
            .sort({ createdAt: -1 });
        res.json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBookingReview = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.bookingId, $or: [{ user: req.user._id }, { owner: req.user._id }] }).select("_id");
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
        const review = await Review.findOne({ booking: booking._id }).populate("reviewer", "name image location");
        res.json({ success: true, review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createReview = async (req, res) => {
    try {
        const { bookingId, rating, comment, location } = req.body;
        const numericRating = Number(rating);
        const cleanComment = String(comment || "").trim();
        const cleanLocation = String(location || "").trim().slice(0, 80);
        if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        }
        if (cleanComment.length < 5 || cleanComment.length > 1000) {
            return res.status(400).json({ success: false, message: "Review must be between 5 and 1000 characters" });
        }

        const booking = await Booking.findOne({ _id: bookingId, user: req.user._id, status: "completed" });
        if (!booking) return res.status(400).json({ success: false, message: "Reviews are available after a completed trip" });
        const existing = await Review.findOne({ booking: booking._id });
        if (existing) return res.status(409).json({ success: false, message: "You already reviewed this trip" });

        const reviewerLocation = cleanLocation || req.user.location || "";
        const review = await Review.create({ booking: booking._id, reviewer: req.user._id, reviewerLocation, reviewee: booking.owner, car: booking.car, rating: numericRating, comment: cleanComment });
        if (cleanLocation && cleanLocation !== req.user.location) {
            req.user.location = cleanLocation;
            await req.user.save();
        }
        await recalculateOwnerRating(booking.owner);
        await createNotification({ recipient: booking.owner, type: "review_received", title: "New vehicle review", message: "A renter left a review for your vehicle.", booking: booking._id });
        res.status(201).json({ success: true, review });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ success: false, message: "You already reviewed this trip" });
        res.status(500).json({ success: false, message: error.message });
    }
};

export const respondToReview = async (req, res) => {
    try {
        const response = String(req.body.response || "").trim();
        if (response.length < 2 || response.length > 1000) return res.status(400).json({ success: false, message: "Response must be between 2 and 1000 characters" });
        const review = await Review.findOne({ _id: req.params.id, reviewee: req.user._id });
        if (!review) return res.status(404).json({ success: false, message: "Review not found" });
        review.ownerResponse = response;
        review.ownerRespondedAt = new Date();
        await review.save();
        const booking = await Booking.findById(review.booking).select("user");
        if (booking?.user) {
            await createNotification({ recipient: booking.user, type: "review_response", title: "The owner responded to your review", message: "Open your booking to view the owner response.", booking: booking._id });
        }
        res.json({ success: true, review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const listReviewsForModeration = async (_req, res) => {
    try {
        const reviews = await Review.find()
            .populate("reviewer", "name email")
            .populate("reviewee", "name email")
            .populate("car", "brand model")
            .sort({ createdAt: -1 });
        res.json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const moderateReview = async (req, res) => {
    try {
        const { status, note } = req.body;
        if (!["published", "hidden"].includes(status)) return res.status(400).json({ success: false, message: "Status must be published or hidden" });
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { status, moderationNote: String(note || "").trim().slice(0, 500), moderatedAt: new Date(), moderatedBy: req.user._id },
            { new: true }
        );
        if (!review) return res.status(404).json({ success: false, message: "Review not found" });
        await recalculateOwnerRating(review.reviewee);
        res.json({ success: true, message: `Review ${status}`, review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
