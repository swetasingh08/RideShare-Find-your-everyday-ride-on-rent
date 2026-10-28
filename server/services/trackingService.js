import Booking from "../models/Booking.js";
import TrackingSession from "../models/TrackingSession.js";
import { getDrivingRoute, normalizeCoordinates } from "./locationService.js";

const SIMULATION_DURATION_MS = Number(process.env.TRACKING_SIMULATION_DURATION_MS) || 120000;
const EARTH_RADIUS_KM = 6371;
const MIN_TRACKING_UPDATE_DISTANCE_KM = Number(process.env.MIN_TRACKING_UPDATE_DISTANCE_KM) || 0.02;
const MIN_TRACKING_UPDATE_INTERVAL_MS = Number(process.env.MIN_TRACKING_UPDATE_INTERVAL_MS) || 15000;

const validCoordinates = value => Boolean(normalizeCoordinates(value));

const distanceKm = (first, second) => {
    const toRadians = value => value * Math.PI / 180;
    const dLatitude = toRadians(second.latitude - first.latitude);
    const dLongitude = toRadians(second.longitude - first.longitude);
    const a = Math.sin(dLatitude / 2) ** 2 + Math.cos(toRadians(first.latitude)) * Math.cos(toRadians(second.latitude)) * Math.sin(dLongitude / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const pointOnRoute = (routeCoordinates, progress, fallbackStart, fallbackDestination) => {
    if (!routeCoordinates?.length) {
        return {
            latitude: fallbackStart.latitude + (fallbackDestination.latitude - fallbackStart.latitude) * progress,
            longitude: fallbackStart.longitude + (fallbackDestination.longitude - fallbackStart.longitude) * progress,
        };
    }
    const position = Math.min(routeCoordinates.length - 1, (routeCoordinates.length - 1) * progress);
    const index = Math.floor(position);
    const nextIndex = Math.min(routeCoordinates.length - 1, index + 1);
    const ratio = position - index;
    const current = routeCoordinates[index];
    const next = routeCoordinates[nextIndex];
    return {
        latitude: current.latitude + (next.latitude - current.latitude) * ratio,
        longitude: current.longitude + (next.longitude - current.longitude) * ratio,
    };
};

const estimateLiveTrip = (session) => {
    const current = normalizeCoordinates(session.currentCoordinates);
    const destination = normalizeCoordinates(session.destinationCoordinates);
    if (!current || !destination) return;
    const remainingDistance = distanceKm(current, destination);
    session.distanceKm = Math.round(remainingDistance * 10) / 10;
    session.etaMinutes = Math.ceil(remainingDistance / 0.5);
    session.lastUpdatedAt = new Date();
};

export const startTrackingSession = async (bookingId) => {
    const booking = await Booking.findById(bookingId).populate("car", "coordinates");
    if (!booking) return null;

    const start = validCoordinates(booking.pickupCoordinates) ? normalizeCoordinates(booking.pickupCoordinates) : normalizeCoordinates(booking.car?.coordinates);
    const destination = validCoordinates(booking.dropCoordinates) ? normalizeCoordinates(booking.dropCoordinates) : null;
    if (!start || !destination) return null;
    let route = null;
    try {
        route = await getDrivingRoute(start, destination);
    } catch {
        route = null;
    }
    const totalDistance = route?.distanceKm || distanceKm(start, destination);
    const totalDuration = route?.durationMinutes || Math.max(1, Math.ceil(totalDistance / 0.5));
    const routeCoordinates = (route?.coordinates || []).map(([latitude, longitude]) => ({ latitude, longitude }));

    return TrackingSession.findOneAndUpdate(
        { booking: bookingId },
        { booking: bookingId, startCoordinates: start, destinationCoordinates: destination, currentCoordinates: start, routeCoordinates, routeProvider: route?.provider || "straight-line fallback", routeDistanceKm: totalDistance, routeDurationMinutes: totalDuration, distanceKm: totalDistance, etaMinutes: totalDuration, progress: 0, status: "active", isSimulated: true, startedAt: new Date(), lastUpdatedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

export const updateTrackingLocation = async (bookingId, value) => {
    const coordinates = normalizeCoordinates(value);
    if (!coordinates) return null;
    const session = await TrackingSession.findOne({ booking: bookingId, status: "active" });
    if (!session) return null;
    const previous = normalizeCoordinates(session.currentCoordinates);
    const lastUpdatedAt = new Date(session.lastUpdatedAt || 0).valueOf();
    if (previous && Date.now() - lastUpdatedAt < MIN_TRACKING_UPDATE_INTERVAL_MS && distanceKm(previous, coordinates) < MIN_TRACKING_UPDATE_DISTANCE_KM) {
        return session;
    }
    session.currentCoordinates = coordinates;
    session.isSimulated = false;
    session.lastUpdatedAt = new Date();
    estimateLiveTrip(session);
    const totalDistance = Number(session.routeDistanceKm) || distanceKm(session.startCoordinates, session.destinationCoordinates);
    session.progress = totalDistance > 0 ? Math.min(1, Math.max(0, 1 - session.distanceKm / totalDistance)) : 0;
    return session.save();
};

export const stopTrackingSession = async (bookingId) => {
    await TrackingSession.findOneAndUpdate({ booking: bookingId }, { status: "stopped", lastUpdatedAt: new Date() });
};

export const getTrackingSnapshot = async (bookingId) => {
    const session = await TrackingSession.findOne({ booking: bookingId });
    if (!session) return null;
    if (session.status !== "active") return session;

    if (!session.isSimulated) {
        estimateLiveTrip(session);
    } else {
        const elapsed = Date.now() - new Date(session.startedAt).valueOf();
        const progress = Math.min(1, Math.max(0, elapsed / SIMULATION_DURATION_MS));
        const totalDistance = Number(session.routeDistanceKm) || distanceKm(session.startCoordinates, session.destinationCoordinates);
        const totalDuration = Number(session.routeDurationMinutes) || Math.max(1, Math.ceil(totalDistance / 0.5));
        const currentCoordinates = pointOnRoute(session.routeCoordinates, progress, session.startCoordinates, session.destinationCoordinates);
        const remainingDistance = totalDistance * (1 - progress);
        session.progress = progress;
        session.currentCoordinates = currentCoordinates;
        session.distanceKm = Math.round(remainingDistance * 10) / 10;
        session.etaMinutes = Math.ceil(totalDuration * (1 - progress));
        session.lastUpdatedAt = new Date();
        if (progress >= 1) {
            session.status = "completed";
            session.completedAt = new Date();
        }
    }
    await session.save();
    return session;
};
