import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import PricingSnapshot from "../models/PricingSnapshot.js";

const DAY_MS = 1000 * 60 * 60 * 24;
const activeStatuses = ["pending", "pending_payment", "confirmed", "active", "completed"];

const overlapDays = (start, end, windowStart, windowEnd) => {
    const from = Math.max(new Date(start).valueOf(), windowStart.valueOf());
    const to = Math.min(new Date(end).valueOf(), windowEnd.valueOf());
    return to > from ? Math.ceil((to - from) / DAY_MS) : 0;
};

export const getPricingSuggestion = async (carId, ownerId) => {
    const car = await Car.findOne({ _id: carId, owner: ownerId }).select("brand model category location pricePerDay isAvaliable");
    if (!car) return { error: "Vehicle not found" };

    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.valueOf() - 30 * DAY_MS);
    const bookings = await Booking.find({ car: car._id, status: { $in: activeStatuses }, createdAt: { $gte: windowStart } }).select("pickupDate returnDate");
    const bookedDays = bookings.reduce((total, booking) => total + overlapDays(booking.pickupDate, booking.returnDate, windowStart, windowEnd), 0);
    const utilizationPercent = Math.min(100, Math.round((bookedDays / 30) * 100));

    const comparableCars = await Car.find({ location: car.location, category: car.category, isAvaliable: true, _id: { $ne: car._id } }).select("pricePerDay");
    const marketAverage = comparableCars.length ? Math.round(comparableCars.reduce((sum, item) => sum + Number(item.pricePerDay || 0), 0) / comparableCars.length) : Number(car.pricePerDay);
    const demandMultiplier = 1 + Math.min(0.2, bookings.length * 0.04) + (utilizationPercent >= 70 ? 0.1 : utilizationPercent >= 40 ? 0.05 : 0);
    const marketAdjustedPrice = Math.round(marketAverage * demandMultiplier);
    const suggestedPrice = Math.max(1, Math.round((marketAdjustedPrice * 0.6) + (Number(car.pricePerDay) * 0.4)));
    const changePercent = Math.round(((suggestedPrice - Number(car.pricePerDay)) / Number(car.pricePerDay || 1)) * 100);

    let recommendation = "Your current price is reasonable for recent demand.";
    if (changePercent >= 5) recommendation = "Demand is strong. Consider raising your daily price during busy periods.";
    if (changePercent <= -5) recommendation = "Demand is soft. A lower daily price may improve booking conversion.";

    const suggestion = {
        car: { _id: car._id, brand: car.brand, model: car.model },
        currentPrice: Number(car.pricePerDay),
        suggestedPrice,
        marketAverage,
        bookingsLast30Days: bookings.length,
        utilizationPercent,
        changePercent,
        recommendation,
        generatedAt: new Date(),
    };
    await PricingSnapshot.findOneAndUpdate(
        { car: car._id, dateKey: windowEnd.toISOString().slice(0, 10) },
        { car: car._id, owner: ownerId, dateKey: windowEnd.toISOString().slice(0, 10), ...suggestion, car: car._id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return suggestion;
};

export const refreshAllPricingSuggestions = async () => {
    const cars = await Car.find({ owner: { $ne: null }, isAvaliable: true }).select("_id owner");
    let refreshed = 0;
    for (const car of cars) {
        try {
            await getPricingSuggestion(car._id, car.owner);
            refreshed += 1;
        } catch (error) {
            console.error(`Pricing suggestion failed for ${car._id}:`, error.message);
        }
    }
    return refreshed;
};
