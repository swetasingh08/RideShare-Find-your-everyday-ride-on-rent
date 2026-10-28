import express from "express";
import { createReview, getBookingReview, getCarReviews, respondToReview } from "../controllers/reviewController.js";
import { protect, requireUser } from "../middleware/auth.js";

const reviewRouter = express.Router();

reviewRouter.get("/car/:carId", getCarReviews);
reviewRouter.get("/booking/:bookingId", protect, requireUser, getBookingReview);
reviewRouter.post("/", protect, requireUser, createReview);
reviewRouter.post("/:id/response", protect, requireUser, respondToReview);

export default reviewRouter;
