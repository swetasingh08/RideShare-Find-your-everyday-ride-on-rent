import Car from "../models/Car.js";
import { findConflictingBookings } from "./bookingService.js";
import { extractRentalPreferences } from "./aiService.js";

export const supportedCities = ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad"];
const categories = ["Hatchback", "Sedan", "SUV", "MUV", "Luxury", "Van", "Scooter", "Motorcycle", "Three-wheeler", "Bicycle"];
const fuels = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid", "Gas"];
const transmissions = ["Automatic", "Manual", "AMT", "CVT", "DCT"];

const searchTerms = /\b(car|cars|vehicle|vehicles|auto|rickshaw|tuk[\s-]?tuk|three[\s-]?wheeler|3[\s-]?wheeler|bike|bikes|motorcycle|scooter|scooty|bicycle|cycle|suv|sedan|hatchback|muv|luxury|van|electric|hybrid|petrol|diesel|cng|automatic|manual|amt|cvt|dct|rent|rental|available|availability|booking|book|under|below|budget|seater|seats?|weekend|today|tomorrow|near)\b/i;

export const classifyAssistantIntent = (query = "") => {
    const text = String(query).trim().toLowerCase();
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you|thank you so much|bye|goodbye)[!.\s]*$/i.test(text)) return "conversation";
    if (/^(help|what can you do|how can you help)[?!.\s]*$/i.test(text)) return "help";
    return searchTerms.test(text) ? "search" : "clarification";
};

const dateOnly = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const upcomingWeekend = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const saturday = new Date(today);
    const daysToSaturday = today.getDay() === 6 ? 0 : today.getDay() === 0 ? 6 : 6 - today.getDay();
    saturday.setDate(today.getDate() + daysToSaturday);
    const monday = new Date(saturday);
    monday.setDate(saturday.getDate() + 2);
    return { pickupDate: dateOnly(saturday), returnDate: dateOnly(monday) };
};

const parseRelativeDates = text => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (/weekend/.test(text)) return upcomingWeekend();
    if (/tomorrow/.test(text)) {
        const pickup = new Date(today);
        pickup.setDate(today.getDate() + 1);
        const returned = new Date(pickup);
        returned.setDate(pickup.getDate() + 1);
        return { pickupDate: dateOnly(pickup), returnDate: dateOnly(returned) };
    }
    if (/today/.test(text)) {
        const returned = new Date(today);
        returned.setDate(today.getDate() + 1);
        return { pickupDate: dateOnly(today), returnDate: dateOnly(returned) };
    }
    return {};
};

const canonical = (value, allowed) => {
    if (value === undefined || value === null || value === "") return undefined;
    const normalized = String(value).trim().toLowerCase();
    return allowed.find(item => item.toLowerCase() === normalized);
};

const canonicalCity = value => {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "bangalore") return "Bengaluru";
    if (normalized === "delhi" || normalized === "new delhi") return "Delhi NCR";
    return canonical(value, supportedCities);
};

const categoryFromText = text => {
    const direct = categories.find(value => text.includes(value.toLowerCase()));
    if (direct) return direct;
    if (/\b(auto|rickshaw|tuk[\s-]?tuk|three[\s-]?wheeler|3[\s-]?wheeler)\b/i.test(text)) return "Three-wheeler";
    if (/\b(scooter|scooty)\b/i.test(text)) return "Scooter";
    if (/\b(bike|motorcycle)\b/i.test(text)) return "Motorcycle";
    if (/\b(bicycle|cycle)\b/i.test(text)) return "Bicycle";
    return undefined;
};

export const normalizePreferences = input => {
    const preferences = {};
    if (input.location) preferences.location = canonicalCity(input.location);
    if (input.category) preferences.category = canonical(input.category, categories);
    if (input.fuel_type || input.fuel) preferences.fuel_type = canonical(input.fuel_type || input.fuel, fuels);
    if (input.transmission) preferences.transmission = canonical(input.transmission, transmissions);
    const maxPrice = Number(String(input.maxPrice ?? input.max_price ?? "").replace(/[^\d.]/g, ""));
    if (Number.isFinite(maxPrice) && maxPrice > 0) preferences.maxPrice = maxPrice;
    const seats = Number(input.seats);
    if (Number.isFinite(seats) && seats > 0) preferences.seats = Math.floor(seats);
    for (const key of ["pickupDate", "returnDate"]) {
        if (input[key] && /^\d{4}-\d{2}-\d{2}$/.test(String(input[key]))) preferences[key] = String(input[key]);
    }
    return preferences;
};

export const parseRentalRequest = (query = "", requestedPreferences = {}) => {
    const text = query.toLowerCase();
    const preferences = normalizePreferences(requestedPreferences);
    const priceMatch = text.match(/(?:under|below|less than|up to|max(?:imum)?|budget(?: of)?)\s*₹?\s*([\d,.]+)\s*(k|thousand)?/i);
    if (priceMatch && !preferences.maxPrice) {
        const multiplier = priceMatch[2] ? 1000 : 1;
        preferences.maxPrice = Number(priceMatch[1].replace(/,/g, "")) * multiplier;
    }

    const city = supportedCities.find(value => text.includes(value.toLowerCase())) || (text.includes("bangalore") ? "Bengaluru" : null);
    if (city && !preferences.location) preferences.location = city;
    const category = categoryFromText(text);
    if (category && !preferences.category) preferences.category = category;
    const fuel = fuels.find(value => text.includes(value.toLowerCase()));
    if (fuel && !preferences.fuel_type) preferences.fuel_type = fuel;
    const transmission = transmissions.find(value => text.includes(value.toLowerCase()));
    if (transmission && !preferences.transmission) preferences.transmission = transmission;
    const seatsMatch = text.match(/(\d+)\s*(?:seater|seats?)/i);
    if (seatsMatch && !preferences.seats) preferences.seats = Number(seatsMatch[1]);
    if (!preferences.pickupDate && !preferences.returnDate) Object.assign(preferences, parseRelativeDates(text));

    return preferences;
};

const isAvailable = async (car, preferences) => {
    if (!preferences.pickupDate || !preferences.returnDate) return true;
    if (Number.isNaN(new Date(preferences.pickupDate).valueOf()) || Number.isNaN(new Date(preferences.returnDate).valueOf())) return false;
    const days = Math.ceil((new Date(preferences.returnDate) - new Date(preferences.pickupDate)) / (1000 * 60 * 60 * 24));
    if (days <= 0 || days < car.minRentalDays || days > car.maxRentalDays) return false;
    if (car.availableFrom && new Date(preferences.pickupDate) < new Date(car.availableFrom)) return false;
    if (car.availableUntil && new Date(preferences.returnDate) > new Date(car.availableUntil)) return false;
    const conflicts = await findConflictingBookings(car._id, preferences.pickupDate, preferences.returnDate);
    return conflicts.length === 0;
};

const scoreCar = (car, preferences) => {
    let score = Number(car.owner?.averageRating || 0);
    if (preferences.location && car.location === preferences.location) score += 30;
    if (preferences.category && car.category === preferences.category) score += 25;
    if (preferences.fuel_type && car.fuel_type === preferences.fuel_type) score += 20;
    if (preferences.transmission && car.transmission === preferences.transmission) score += 20;
    if (preferences.seats && car.seating_capacity >= preferences.seats) score += 10;
    if (preferences.maxPrice) score += Math.max(0, 20 - (car.pricePerDay / preferences.maxPrice) * 20);
    if (car.verificationStatus === "verified") score += 5;
    return Math.round(score * 10) / 10;
};

export const recommendCars = async (query, requestedPreferences = {}, history = []) => {
    const deterministicPreferences = parseRentalRequest(query, requestedPreferences);
    const aiPreferences = await extractRentalPreferences(query, history);
    const aiValues = Object.fromEntries(Object.entries(aiPreferences || {}).filter(([, value]) => value !== null && value !== undefined && value !== ""));
    const preferences = normalizePreferences({ ...deterministicPreferences, ...aiValues });
    const cars = await Car.find({ isAvaliable: true, verificationStatus: 'verified', owner: { $ne: null } })
        .select("-documents -vin -registrationNumber -insuranceProvider -insuranceExpiry -pucExpiry")
        .populate("owner", "name image totalTrips averageRating responseRate responseTime");
    const matches = [];
    for (const car of cars) {
        if (!car.owner) continue;
        if (preferences.location && car.location !== preferences.location) continue;
        if (preferences.category && car.category !== preferences.category) continue;
        if (preferences.fuel_type && car.fuel_type !== preferences.fuel_type) continue;
        if (preferences.transmission && car.transmission !== preferences.transmission) continue;
        if (preferences.maxPrice && Number(car.pricePerDay) > Number(preferences.maxPrice)) continue;
        if (preferences.seats && Number(car.seating_capacity) < Number(preferences.seats)) continue;
        if (!(await isAvailable(car, preferences))) continue;
        const vehicle = car.toObject();
        vehicle.recommendationScore = scoreCar(vehicle, preferences);
        matches.push(vehicle);
    }
    matches.sort((first, second) => second.recommendationScore - first.recommendationScore || first.pricePerDay - second.pricePerDay);
    return { preferences, vehicles: matches.slice(0, 12), aiUsed: Boolean(aiPreferences) };
};
