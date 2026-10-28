import express from "express";
import { getTracking, startTracking, stopTracking, updateLocation } from "../controllers/trackingController.js";
import { streamTracking } from "../controllers/trackingStreamController.js";
import { protect, requireUser } from "../middleware/auth.js";

const trackingRouter = express.Router();

trackingRouter.get("/:bookingId", protect, requireUser, getTracking);
trackingRouter.get("/:bookingId/stream", protect, requireUser, streamTracking);
trackingRouter.post("/:bookingId/start", protect, requireUser, startTracking);
trackingRouter.post("/:bookingId/stop", protect, requireUser, stopTracking);
trackingRouter.post("/:bookingId/location", protect, requireUser, updateLocation);

export default trackingRouter;
