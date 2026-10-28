import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const coordinatesSchema = {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
};

const trackingSessionSchema = new mongoose.Schema({
    booking: { type: ObjectId, ref: "Booking", required: true, unique: true },
    startCoordinates: { type: coordinatesSchema, required: true },
    destinationCoordinates: { type: coordinatesSchema, required: true },
    currentCoordinates: { type: coordinatesSchema, required: true },
    routeCoordinates: { type: [{ latitude: Number, longitude: Number }], default: [] },
    routeProvider: { type: String, default: "" },
    routeDistanceKm: { type: Number, default: 0 },
    routeDurationMinutes: { type: Number, default: 0 },
    progress: { type: Number, default: 0, min: 0, max: 1 },
    distanceKm: { type: Number, default: 0 },
    etaMinutes: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "completed", "stopped"], default: "active" },
    isSimulated: { type: Boolean, default: true },
    startedAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
}, { timestamps: true });

const TrackingSession = mongoose.model("TrackingSession", trackingSessionSchema);

export default TrackingSession;
