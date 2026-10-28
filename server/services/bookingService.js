import Booking from "../models/Booking.js";

const DAY_MS = 1000 * 60 * 60 * 24;

export const blockingBookingStatuses = [
    "pending",
    "pending_payment",
    "confirmed",
    "active",
];

const toDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? null : date;
};

export const getRentalDays = (pickupDate, returnDate) => {
    const pickup = toDate(pickupDate);
    const returned = toDate(returnDate);
    if (!pickup || !returned || returned <= pickup) return null;
    return Math.ceil((returned - pickup) / DAY_MS);
};

export const calculateBookingQuote = (car, pickupDate, returnDate, handoverOption = "renter_pickup") => {
    const rentalDays = getRentalDays(pickupDate, returnDate);
    if (!rentalDays) {
        return { error: "Return date must be after pickup date" };
    }

    if (rentalDays < car.minRentalDays || rentalDays > car.maxRentalDays) {
        return { error: `This vehicle can be rented for ${car.minRentalDays} to ${car.maxRentalDays} days` };
    }

    const pickup = toDate(pickupDate);
    const returned = toDate(returnDate);
    if (car.availableFrom && pickup < new Date(car.availableFrom)) {
        return { error: "This vehicle is not available on the selected pickup date" };
    }
    if (car.availableUntil && returned > new Date(car.availableUntil)) {
        return { error: "This vehicle is not available for the selected return date" };
    }

    if (!["renter_pickup", "owner_delivery"].includes(handoverOption)) {
        return { error: "Choose a valid handover option" };
    }
    if (handoverOption === "owner_delivery" && !car.deliveryAvailable) {
        return { error: "Owner delivery is not available for this vehicle" };
    }

    const baseAmount = Number(car.pricePerDay || 0) * rentalDays;
    let discountRate = 0;
    if (rentalDays >= 30) discountRate = Number(car.monthlyDiscount || 0);
    else if (rentalDays >= 7) discountRate = Number(car.weeklyDiscount || 0);

    const discountAmount = Math.round(baseAmount * Math.max(0, discountRate) / 100);
    const deliveryFee = handoverOption === "owner_delivery" ? Math.max(0, Number(car.deliveryFee || 0)) : 0;
    const rentalAmount = Math.max(0, baseAmount - discountAmount);
    const securityDeposit = Math.max(0, Number(car.securityDeposit || 0));

    return {
        rentalDays,
        baseAmount,
        discountRate,
        discountAmount,
        handoverOption,
        deliveryFee,
        rentalAmount,
        securityDeposit,
        totalAmount: rentalAmount + deliveryFee + securityDeposit,
        currency: "INR",
    };
};

export const findConflictingBookings = (carId, pickupDate, returnDate, excludeId) => {
    const query = {
        car: carId,
        status: { $in: blockingBookingStatuses },
        pickupDate: { $lt: returnDate },
        returnDate: { $gt: pickupDate },
    };
    if (excludeId) query._id = { $ne: excludeId };
    return Booking.find(query).select("_id status pickupDate returnDate");
};

export const acquireBookingLock = async (Car, carId, token, now, lockUntil) => Car.findOneAndUpdate(
    {
        _id: carId,
        isAvaliable: true,
        $or: [{ bookingLockUntil: { $exists: false } }, { bookingLockUntil: null }, { bookingLockUntil: { $lte: now } }],
    },
    { $set: { bookingLockToken: token, bookingLockUntil: lockUntil } },
    { new: true }
);

export const releaseBookingLock = (Car, carId, token) => Car.updateOne(
    { _id: carId, bookingLockToken: token },
    { $set: { bookingLockToken: '', bookingLockUntil: null } }
);

export const normalizeBookingMode = (car) => {
    const instantBooking = Boolean(car.instantBooking);
    car.instantBooking = instantBooking;
    car.approvalRequired = !instantBooking;
    return car;
};

export const canTransitionBooking = (currentStatus, nextStatus) => {
    const transitions = {
        pending: ["confirmed", "cancelled", "rejected"],
        pending_payment: ["pending", "confirmed", "payment_failed", "cancelled"],
        confirmed: ["active", "cancelled", "completed"],
        active: ["completed", "cancelled"],
        payment_failed: ["pending_payment", "cancelled"],
        cancelled: [],
        rejected: [],
        completed: [],
        refunded: [],
    };
    return transitions[currentStatus]?.includes(nextStatus) || false;
};
