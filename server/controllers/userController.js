import Car from "../models/Car.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import AccessRequest from "../models/AccessRequest.js";
import { blockingBookingStatuses } from "../services/bookingService.js";

const addBookingState = async (cars, pickupDate, returnDate) => {
    const carIds = cars.map(car => car._id);
    const now = new Date();
    const hasDateRange = pickupDate && returnDate && !Number.isNaN(new Date(pickupDate).valueOf()) && !Number.isNaN(new Date(returnDate).valueOf());
    const bookingQuery = { car: { $in: carIds }, status: { $in: blockingBookingStatuses } };
    if (hasDateRange) {
        bookingQuery.pickupDate = { $lt: new Date(returnDate) };
        bookingQuery.returnDate = { $gt: new Date(pickupDate) };
    } else {
        bookingQuery.pickupDate = { $lte: now };
        bookingQuery.returnDate = { $gt: now };
    }
    const [bookings, lockedCars] = await Promise.all([
        Booking.find(bookingQuery).select("car pickupDate returnDate status").lean(),
        Car.find({ _id: { $in: carIds }, bookingLockUntil: { $gt: now } }).select("+bookingLockUntil").select("_id bookingLockUntil").lean(),
    ]);
    const bookedIds = new Set(bookings.map(booking => booking.car.toString()));
    const lockedIds = new Set(lockedCars.map(car => car._id.toString()));
    return cars.map(car => {
        const value = car.toObject ? car.toObject() : car;
        const id = value._id.toString();
        const availabilityStatus = lockedIds.has(id) ? "booking_in_progress" : bookedIds.has(id) ? "already_booked" : "available";
        const { bookingLockUntil, ...publicValue } = value;
        return { ...publicValue, availabilityStatus };
    });
};


// Get User data for the signed-in Clerk user.
// The user row is created/refreshed by the protect middleware, so this only reports.
export const getUserData = async (req, res) =>{
    try {
        const {user} = req;
        res.json({success: true, user})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

export const updateUserProfile = async (req, res) => {
    try {
        const name = String(req.body.name || '').trim().replace(/\s+/g, ' ');
        const phone = String(req.body.phone || '').trim();
        const city = String(req.body.city || '').trim().replace(/\s+/g, ' ');
        const occupation = String(req.body.occupation || '').trim().replace(/\s+/g, ' ');
        const age = Number(req.body.age);

        if (name.length < 2 || name.length > 80) return res.status(400).json({ success: false, message: 'Enter your full name' });
        if (!/^\+?[0-9][0-9\s()\-]{6,19}$/.test(phone)) return res.status(400).json({ success: false, message: 'Enter a valid mobile number' });
        if (city.length < 2 || city.length > 80) return res.status(400).json({ success: false, message: 'Enter your city' });
        if (occupation.length < 2 || occupation.length > 80) return res.status(400).json({ success: false, message: 'Enter your occupation' });
        if (!Number.isInteger(age) || age < 18 || age > 100) return res.status(400).json({ success: false, message: 'Age must be between 18 and 100' });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { name, phone, city, occupation, age, profileCompleted: true } },
            { new: true, runValidators: true },
        );
        if (!user) return res.status(404).json({ success: false, message: 'User profile not found' });
        res.json({ success: true, user, message: 'Profile saved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get All Cars for the Frontend
export const getCars = async (req, res) =>{
    try {
        const cars = await Car.find({ isAvaliable: true, verificationStatus: 'verified', owner: { $ne: null } }).select('+bookingLockUntil')
            .select('-documents -vin -registrationNumber -insuranceProvider -insuranceExpiry -pucExpiry')
            .populate('owner', 'name image createdAt totalTrips averageRating responseRate responseTime')
        res.json({success: true, cars: await addBookingState(cars.filter(car => car.owner))})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

const distanceInKm = (latitude, longitude, targetLatitude, targetLongitude) => {
    const earthRadius = 6371;
    const toRadians = value => value * Math.PI / 180;
    const dLatitude = toRadians(targetLatitude - latitude);
    const dLongitude = toRadians(targetLongitude - longitude);
    const a = Math.sin(dLatitude / 2) ** 2 + Math.cos(toRadians(latitude)) * Math.cos(toRadians(targetLatitude)) * Math.sin(dLongitude / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getNearbyCars = async (req, res) => {
    try {
        const latitude = Number(req.query.lat);
        const longitude = Number(req.query.lng);
        const radius = Math.min(Math.max(Number(req.query.radius) || 25, 1), 100);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({ success: false, message: "A valid latitude and longitude are required" });
        }

        const cars = await Car.find({ isAvaliable: true, verificationStatus: 'verified', owner: { $ne: null } }).select('+bookingLockUntil')
            .select('-documents -vin -registrationNumber -insuranceProvider -insuranceExpiry -pucExpiry')
            .populate('owner', 'name image createdAt totalTrips averageRating responseRate responseTime');
        const carsWithState = await addBookingState(cars.filter(car => car.owner));
        const nearbyCars = carsWithState.map(car => {
            const carLatitude = Number(car.coordinates?.latitude);
            const carLongitude = Number(car.coordinates?.longitude);
            if (!Number.isFinite(carLatitude) || !Number.isFinite(carLongitude)) return null;
            return { ...car, distanceKm: Math.round(distanceInKm(latitude, longitude, carLatitude, carLongitude) * 10) / 10 };
        }).filter(car => car && car.distanceKm <= radius).sort((first, second) => first.distanceKm - second.distanceKm);

        res.json({ success: true, nearbyCars, radiusKm: radius });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createAccessRequest = async (req, res) => {
    try {
        const name = (req.body.name || "").trim();
        const email = (req.body.email || "").trim().toLowerCase();

        if (name.length < 2) return res.json({ success: false, message: "Please enter your full name" });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.json({ success: false, message: "Please enter a valid email address" });
        }
        const existing = await AccessRequest.findOne({ email, status: "pending" });
        if (existing) return res.json({ success: false, message: "You already have a pending request" });

        const request = await AccessRequest.create({ name, email });
        res.status(201).json({ success: true, request: { id: request._id, name, email } });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "Could not submit your request" });
    }
}
