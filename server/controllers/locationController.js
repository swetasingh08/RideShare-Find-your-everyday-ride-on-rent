import { geocodeLocation, getDrivingRoute, normalizeCoordinates, reverseGeocode } from "../services/locationService.js";

export const geocode = async (req, res) => {
    try {
        const result = await geocodeLocation(req.body?.query);
        if (!result) return res.status(404).json({ success: false, message: "Location could not be found" });
        const { locations, ...selectedLocation } = result;
        res.json({ success: true, location: selectedLocation, locations: locations || [selectedLocation] });
    } catch (error) {
        const providerMessage = error?.message?.includes("referer restrictions")
            ? "Google Maps server key is restricted to browser referrers. Create a separate server key with IP restrictions for Geocoding and Routes."
            : error?.message;
        res.status(502).json({ success: false, message: providerMessage || "Location search is temporarily unavailable" });
    }
};

export const reverseGeocodeController = async (req, res) => {
    try {
        const coordinates = normalizeCoordinates(req.body?.coordinates);
        if (!coordinates) return res.status(400).json({ success: false, message: "Valid coordinates are required" });
        const result = await reverseGeocode(coordinates);
        if (!result) return res.status(404).json({ success: false, message: "Address could not be found" });
        res.json({ success: true, location: result });
    } catch (error) {
        const providerMessage = error?.message?.includes("referer restrictions")
            ? "Google Maps server key is restricted to browser referrers. Create a separate server key with IP restrictions for Geocoding and Routes."
            : error?.message;
        res.status(502).json({ success: false, message: providerMessage || "Address lookup is temporarily unavailable" });
    }
};

export const route = async (req, res) => {
    try {
        const origin = normalizeCoordinates(req.body?.origin);
        const destination = normalizeCoordinates(req.body?.destination);
        if (!origin || !destination) return res.status(400).json({ success: false, message: "Valid origin and destination coordinates are required" });
        const result = await getDrivingRoute(origin, destination);
        res.json({ success: true, route: result });
    } catch (error) {
        const providerMessage = error?.message?.includes("referer restrictions") || error?.httpStatus === 403
            ? "Google Maps server key is restricted to browser referrers. Create a separate server key with IP restrictions for Geocoding and Routes."
            : error?.message;
        res.status(502).json({ success: false, message: providerMessage || "Route lookup is temporarily unavailable" });
    }
};
