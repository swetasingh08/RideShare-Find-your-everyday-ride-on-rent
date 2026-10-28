const DEFAULT_GEOCODER_URL = "https://nominatim.openstreetmap.org";
const DEFAULT_ROUTER_URL = "https://router.project-osrm.org";
const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const GOOGLE_ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";
const cache = new Map();
const googleApiKey = () => process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

const getJson = async (url, options = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                Accept: "application/json",
                "Accept-Language": "en-IN,en;q=0.9",
                "User-Agent": process.env.LOCATION_USER_AGENT || "RideShare/1.0 location features",
                ...(options.headers || {}),
            },
        });
        if (!response.ok) {
            const error = new Error(`Location provider returned ${response.status}`);
            error.httpStatus = response.status;
            throw error;
        }
        return response.json();
    } finally {
        clearTimeout(timeout);
    }
};

const cached = async (key, loader) => {
    if (cache.has(key)) return cache.get(key);
    const value = await loader();
    cache.set(key, value);
    if (cache.size > 100) cache.delete(cache.keys().next().value);
    return value;
};

const distanceKm = (first, second) => {
    const toRadians = value => value * Math.PI / 180;
    const dLatitude = toRadians(second.latitude - first.latitude);
    const dLongitude = toRadians(second.longitude - first.longitude);
    const a = Math.sin(dLatitude / 2) ** 2 + Math.cos(toRadians(first.latitude)) * Math.cos(toRadians(second.latitude)) * Math.sin(dLongitude / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const straightLineRoute = (origin, destination) => {
    const distance = distanceKm(origin, destination);
    return {
        distanceKm: Math.round(distance * 10) / 10,
        durationMinutes: Math.max(1, Math.ceil(distance / 0.5)),
        coordinates: [[origin.latitude, origin.longitude], [destination.latitude, destination.longitude]],
        provider: "straight-line fallback",
    };
};

export const normalizeCoordinates = (value) => {
    const latitude = Number(value?.latitude);
    const longitude = Number(value?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
    return { latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) };
};

const googleAddress = components => {
    const address = {};
    for (const component of components || []) {
        const type = component.types?.[0];
        if (!type) continue;
        const value = component.long_name;
        if (type === "street_number") address.house_number = value;
        if (type === "route") address.road = value;
        if (["premise", "subpremise", "building"].includes(type)) address.building = value;
        if (["sublocality", "sublocality_level_1", "sublocality_level_2", "neighborhood"].includes(type) && !address.neighbourhood) address.neighbourhood = value;
        if (["locality", "postal_town"].includes(type)) address.city = value;
        if (type === "administrative_area_level_2") address.state_district = value;
        if (type === "administrative_area_level_1") address.state = value;
        if (type === "postal_code") address.postcode = value;
        if (type === "country") address.country = value;
    }
    return address;
};

const addressLabel = (result) => {
    if (!result) return "";
    const address = result.address || {};
    const houseAndRoad = [address.house_number, address.road].filter(Boolean).join(" ");
    const parts = [
        houseAndRoad,
        address.building,
        address.house,
        address.neighbourhood,
        address.suburb,
        address.residential,
        address.city_district,
        address.city || address.town || address.village || address.municipality,
        address.state_district,
        address.state,
        address.postcode,
        address.country,
    ].filter(Boolean);
    const uniqueParts = parts.filter((part, index) => parts.indexOf(part) === index);
    return uniqueParts.length > 1 ? uniqueParts.join(", ") : result.display_name || "";
};

const resultScore = (result, query) => {
    const address = result?.address || {};
    const searchable = `${result?.display_name || result?.displayName || ""} ${Object.values(address).join(" ")}`.toLowerCase();
    const queryText = String(query || "").toLowerCase();
    const queryTokens = queryText.split(/[^a-z0-9]+/).filter(token => token.length > 2);
    const queryPostcode = queryText.match(/\b\d{6}\b/)?.[0];
    const matchedTokens = queryTokens.filter(token => searchable.includes(token)).length;

    return matchedTokens * 4
        + (queryPostcode && String(address.postcode || "").replace(/\s/g, "") === queryPostcode ? 30 : 0)
        + (address.house_number ? 18 : 0)
        + (address.road ? 10 : 0)
        + (address.neighbourhood || address.suburb || address.residential ? 8 : 0)
        + (address.postcode ? 5 : 0)
        + Number(result?.importance || 0);
};

const normalizeGeocodeResult = result => {
    const coordinates = normalizeCoordinates({ latitude: result?.lat, longitude: result?.lon });
    if (!coordinates) return null;
    return {
        ...coordinates,
        displayName: addressLabel(result) || result.display_name,
        type: result.type,
        address: result.address || {},
        provider: "nominatim",
    };
};

const normalizeGoogleResult = result => {
    const coordinates = normalizeCoordinates({ latitude: result?.geometry?.location?.lat, longitude: result?.geometry?.location?.lng });
    if (!coordinates || !result?.formatted_address) return null;
    return {
        ...coordinates,
        displayName: result.formatted_address,
        type: result.types?.[0] || "address",
        address: googleAddress(result.address_components),
        provider: "google",
    };
};

const googleGeocode = async (query, reverse = false) => {
    const apiKey = googleApiKey();
    if (!apiKey) return [];
    const params = new URLSearchParams({ language: "en", region: "in", key: apiKey });
    if (reverse) params.set("latlng", `${query.latitude},${query.longitude}`);
    else {
        params.set("address", query);
        params.set("components", "country:IN");
    }
    const data = await getJson(`${GOOGLE_GEOCODE_URL}?${params.toString()}`);
    if (!['OK', 'ZERO_RESULTS'].includes(data?.status)) {
        const error = new Error(data?.error_message || `Google Geocoding returned ${data?.status || 'an unknown error'}`);
        error.code = data?.status;
        throw error;
    }
    return (data.results || []).map(normalizeGoogleResult).filter(Boolean);
};

const searchNominatim = async query => {
    const baseUrl = process.env.GEOCODER_URL || DEFAULT_GEOCODER_URL;
    const data = await getJson(`${baseUrl}/search?format=jsonv2&limit=8&addressdetails=1&namedetails=1&dedupe=1&countrycodes=in&q=${encodeURIComponent(query)}`);
    return (Array.isArray(data) ? data : []).map(normalizeGeocodeResult).filter(Boolean);
};

export const geocodeLocation = async (query) => {
    const cleanQuery = String(query || "").trim();
    if (cleanQuery.length < 2) return null;
    const cacheKey = `geocode:v2:${cleanQuery.toLowerCase()}`;
    const locations = await cached(cacheKey, async () => {
        let results = [];
        let googleError = null;
        try {
            results = await googleGeocode(cleanQuery);
        } catch (error) {
            googleError = error;
        }
        try {
            if (!results.length) results = await searchNominatim(cleanQuery);
        } catch {
            // Keep an empty result when both providers are unavailable.
        }

        if (!results.length && googleError && googleApiKey()) throw googleError;

        const uniqueResults = [...new Map(results.map(result => [`${result.latitude}:${result.longitude}:${result.displayName}`, result])).values()];
        return uniqueResults
        .sort((first, second) => resultScore(second, cleanQuery) - resultScore(first, cleanQuery));
    });
    if (!locations.length) return null;
    return { ...locations[0], locations };
};

export const reverseGeocode = async (coordinates) => {
    const point = normalizeCoordinates(coordinates);
    if (!point) return null;
    const key = `reverse:${point.latitude}:${point.longitude}`;
    return cached(key, async () => {
        try {
            const googleResults = await googleGeocode(point, true);
            if (googleResults[0]) return googleResults[0];
        } catch (error) {
            if (googleApiKey() && error.code === "REQUEST_DENIED") throw error;
            // Fall back to the existing provider when Google is unavailable.
        }
        try {
            const baseUrl = process.env.GEOCODER_URL || DEFAULT_GEOCODER_URL;
            const data = await getJson(`${baseUrl}/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${point.latitude}&lon=${point.longitude}`);
            return data?.display_name ? { ...point, displayName: addressLabel(data) || data.display_name, address: data.address || {}, type: data.type, provider: "nominatim" } : null;
        } catch {
            return null;
        }
    });
};

const decodePolyline = encoded => {
    const coordinates = [];
    let index = 0;
    let latitude = 0;
    let longitude = 0;
    while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        latitude += result & 1 ? ~(result >> 1) : result >> 1;
        shift = 0;
        result = 0;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        longitude += result & 1 ? ~(result >> 1) : result >> 1;
        coordinates.push([latitude / 1e5, longitude / 1e5]);
    }
    return coordinates;
};

const googleRoute = async (start, end) => {
    const apiKey = googleApiKey();
    if (!apiKey) return null;
    const data = await getJson(GOOGLE_ROUTES_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
            origin: { location: { latLng: { latitude: start.latitude, longitude: start.longitude } } },
            destination: { location: { latLng: { latitude: end.latitude, longitude: end.longitude } } },
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_AWARE",
            polylineQuality: "OVERVIEW",
            polylineEncoding: "ENCODED_POLYLINE",
            languageCode: "en-IN",
            units: "METRIC",
        }),
    });
    const route = data?.routes?.[0];
    if (!route?.polyline?.encodedPolyline) throw new Error("Google Routes returned no route");
    return {
        distanceKm: Math.round((Number(route.distanceMeters) / 1000) * 10) / 10,
        durationMinutes: Math.max(1, Math.ceil(Number.parseFloat(String(route.duration || "0").replace("s", "")) / 60)),
        coordinates: decodePolyline(route.polyline.encodedPolyline),
        provider: "Google Routes",
    };
};

export const getDrivingRoute = async (origin, destination) => {
    const start = normalizeCoordinates(origin);
    const end = normalizeCoordinates(destination);
    if (!start || !end) throw new Error("A valid origin and destination are required");
    const key = `route:${start.latitude},${start.longitude}:${end.latitude},${end.longitude}`;
    return cached(key, async () => {
        try {
            const google = await googleRoute(start, end);
            if (google) return google;
        } catch (error) {
            if (googleApiKey() && error.httpStatus === 403) throw error;
            // Keep the existing route fallback when Google Routes is unavailable.
        }
        try {
            const baseUrl = process.env.ROUTER_URL || DEFAULT_ROUTER_URL;
            const data = await getJson(`${baseUrl}/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson&steps=false`);
            const route = data?.routes?.[0];
            if (!route?.geometry?.coordinates?.length) throw new Error("No driving route was found");
            return {
                distanceKm: Math.round((Number(route.distance) / 1000) * 10) / 10,
                durationMinutes: Math.max(1, Math.ceil(Number(route.duration) / 60)),
                coordinates: route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
                provider: "OpenStreetMap/OSRM",
            };
        } catch {
            return straightLineRoute(start, end);
        }
    });
};
