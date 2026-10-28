import Booking from "../models/Booking.js";
import { getTrackingSnapshot, startTrackingSession, stopTrackingSession, updateTrackingLocation } from "../services/trackingService.js";

const findParticipantBooking = (bookingId, userId) => Booking.findOne({ _id: bookingId, $or: [{ user: userId }, { owner: userId }] }).populate("car", "brand model coordinates");

export const getTracking = async (req, res) => {
    try {
        const booking = await findParticipantBooking(req.params.bookingId, req.user._id);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
        const session = await getTrackingSnapshot(booking._id);
        if (!session) return res.json({ success: true, tracking: null, message: booking.status === "active" ? "Tracking is preparing" : "Tracking starts when the trip becomes active" });
        res.json({ success: true, tracking: session });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const startTracking = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.bookingId, owner: req.user._id });
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
        if (booking.status !== "active") return res.status(400).json({ success: false, message: "Start tracking after marking the trip active" });
        const tracking = await startTrackingSession(booking._id);
        if (!tracking) return res.status(400).json({ success: false, message: "Valid pickup and drop coordinates are required before starting live tracking" });
        res.json({ success: true, tracking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const stopTracking = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.bookingId, owner: req.user._id });
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
        await stopTrackingSession(booking._id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateLocation = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.bookingId, owner: req.user._id, status: "active" });
        if (!booking) return res.status(404).json({ success: false, message: "Active booking not found" });
        const tracking = await updateTrackingLocation(booking._id, req.body?.coordinates);
        if (!tracking) return res.status(400).json({ success: false, message: "Tracking session is not active or coordinates are invalid" });
        res.json({ success: true, tracking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
