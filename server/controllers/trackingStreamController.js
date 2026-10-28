import Booking from "../models/Booking.js";
import { getTrackingSnapshot } from "../services/trackingService.js";

const sendEvent = (res, event, payload) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
};

export const streamTracking = async (req, res) => {
    const booking = await Booking.findOne({ _id: req.params.bookingId, $or: [{ user: req.user._id }, { owner: req.user._id }] }).select("_id status");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    res.status(200).set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();

    let closed = false;
    let inFlight = false;
    const publish = async () => {
        if (closed || inFlight) return;
        inFlight = true;
        try {
            const tracking = await getTrackingSnapshot(booking._id);
            sendEvent(res, "tracking", { success: true, tracking, message: tracking ? "Tracking updated" : booking.status === "active" ? "Tracking is preparing" : "Tracking starts when the trip becomes active" });
        } catch {
            sendEvent(res, "tracking-error", { success: false, message: "Tracking is temporarily unavailable" });
        } finally {
            inFlight = false;
        }
    };

    await publish();
    const interval = setInterval(publish, 5000);
    const heartbeat = setInterval(() => { if (!closed) res.write(": heartbeat\n\n"); }, 15000);
    req.on("close", () => {
        closed = true;
        clearInterval(interval);
        clearInterval(heartbeat);
    });
};
