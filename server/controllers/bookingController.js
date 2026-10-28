import Booking from "../models/Booking.js"
import Car from "../models/Car.js";
import User from "../models/User.js";
import { acquireBookingLock, calculateBookingQuote, canTransitionBooking, findConflictingBookings, releaseBookingLock } from "../services/bookingService.js";
import { createNotification } from "../services/notificationService.js";
import { startTrackingSession, stopTrackingSession } from "../services/trackingService.js";
import { refundCapturedPayment } from "../services/paymentService.js";
import { settleBooking } from "../services/settlementService.js";
import { normalizeCoordinates } from "../services/locationService.js";
import crypto from "crypto";
import BookingCharge from "../models/BookingCharge.js";


// Function to Check Availability of Car for a given Date
const checkAvailability = async (car, pickupDate, returnDate)=>{
    const bookings = await findConflictingBookings(car, pickupDate, returnDate)
    return bookings.length === 0;
}

const startCancellationRefund = async (booking, action = 'cancelled') => {
    if (booking.paymentStatus !== 'paid') return { status: 'not_required', amount: 0 };

    try {
        const refund = await refundCapturedPayment(booking);
        if (refund.status === 'refund_pending') {
            booking.cancellationRefundAmount = Number(refund.amount || booking.totalAmount || booking.price || 0);
            booking.cancellationRefundStatus = 'pending';
            booking.cancellationRefundFailureReason = '';
            booking.cancellationRefundInitiatedAt = new Date();
            await booking.save();
            await createNotification({
                recipient: booking.user,
                type: 'refund_pending',
                title: 'Refund initiated',
                message: `A refund of ₹${booking.cancellationRefundAmount} has been initiated for your ${action} booking. Your payment provider will return it to the original payment method.`,
                booking: booking._id,
            });
            return { status: 'refund_pending', amount: booking.cancellationRefundAmount };
        }

        const reason = refund.status === 'not_configured'
            ? 'Online refunds are not configured.'
            : 'The captured payment could not be matched to a refundable transaction.';
        booking.paymentStatus = 'refund_failed';
        booking.cancellationRefundStatus = 'failed';
        booking.cancellationRefundFailureReason = reason;
        await booking.save();
        await createNotification({
            recipient: booking.user,
            type: 'refund_failed',
            title: 'Refund needs review',
            message: `Your booking was ${action}, but the refund could not be started automatically. ${reason} Support will review it.`,
            booking: booking._id,
        });
        return { status: 'refund_failed', amount: 0, message: reason };
    } catch (error) {
        booking.paymentStatus = 'refund_failed';
        booking.cancellationRefundStatus = 'failed';
        booking.cancellationRefundFailureReason = error.message || 'Refund request failed';
        await booking.save();
        await createNotification({
            recipient: booking.user,
            type: 'refund_failed',
            title: 'Refund needs review',
            message: `Your booking was ${action}, but the refund request could not be completed automatically. Support will review it.`,
            booking: booking._id,
        });
        console.error('Could not initiate booking refund:', error.message);
        return { status: 'refund_failed', amount: 0, message: error.message };
    }
};

// Calculate the current server-side price before a renter creates a booking.
export const getBookingQuote = async (req, res) => {
    try {
        const { car, pickupDate, returnDate, handoverOption = "renter_pickup" } = req.body;
        const carData = await Car.findOne({ _id: car, isAvaliable: true, verificationStatus: 'verified', owner: { $ne: null } });
        if (!carData) return res.status(404).json({ success: false, message: "Vehicle is not available" });

        const quote = calculateBookingQuote(carData, pickupDate, returnDate, handoverOption);
        if (quote.error) return res.status(400).json({ success: false, message: quote.error });
        if (!(await checkAvailability(carData._id, pickupDate, returnDate))) {
            return res.status(409).json({ success: false, message: "Vehicle is not available for these dates" });
        }

        res.json({ success: true, quote });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to Check Availability of Cars for the given Date and location
export const checkAvailabilityOfCar = async (req, res)=>{
    try {
        const {location, pickupDate, returnDate} = req.body

        if (!pickupDate || !returnDate || Number.isNaN(new Date(pickupDate).valueOf()) || Number.isNaN(new Date(returnDate).valueOf()) || new Date(returnDate) <= new Date(pickupDate)) {
            return res.status(400).json({ success: false, message: "Choose a valid date range" })
        }

        // fetch all available cars for the given location
        const carFilter = { isAvaliable: true, $and: [
            { $or: [{ availableFrom: { $exists: false } }, { availableFrom: null }, { availableFrom: { $lte: new Date(pickupDate) } }] },
            { $or: [{ availableUntil: { $exists: false } }, { availableUntil: null }, { availableUntil: { $gte: new Date(returnDate) } }] },
        ] };
        carFilter.verificationStatus = 'verified';
        carFilter.owner = { $ne: null };
        if (location?.trim()) {
            const escapedLocation = location.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const locationPattern = new RegExp(escapedLocation, 'i');
            carFilter.$and.push({ $or: [
                { location: locationPattern },
                { pickupLocality: locationPattern },
                { pickupAddress: locationPattern },
                { landmark: locationPattern },
            ] });
        }
        const cars = await Car.find(carFilter).select('+bookingLockUntil')

        // check car availability for the given date range using promise
        const availableCarsPromises = cars.map(async (car)=>{
           const isLocked = car.bookingLockUntil && new Date(car.bookingLockUntil) > new Date();
           const isAvailable = !isLocked && await checkAvailability(car._id, pickupDate, returnDate)
           const { bookingLockUntil, ...publicCar } = car._doc;
           return {...publicCar, isAvailable, availabilityStatus: isLocked ? 'booking_in_progress' : isAvailable ? 'available' : 'already_booked'}
        })

        const carsWithAvailability = await Promise.all(availableCarsPromises);
        const availableCars = carsWithAvailability.filter(car => car.isAvailable === true)

        res.json({success: true, availableCars, cars: carsWithAvailability})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to Create Booking
export const createBooking = async (req, res)=>{
    try {
        const {_id, role} = req.user;
        const {car, pickupDate, returnDate, renterNote, pickupLocation, dropLocation, pickupCoordinates, dropCoordinates, routeDistanceKm, routeDurationMinutes, handoverOption = 'renter_pickup'} = req.body;

        if (role !== 'user') {
            return res.status(403).json({success: false, message: "Only user accounts can create bookings"})
        }
        if (!req.user.profileCompleted) {
            return res.status(400).json({ success: false, message: "Complete your profile with your name, mobile number, city, occupation, and age before booking" })
        }

        const bookingLockToken = crypto.randomUUID();
        const now = new Date();
        const bookingLockUntil = new Date(now.valueOf() + 15000);
        const carData = await acquireBookingLock(Car, car, bookingLockToken, now, bookingLockUntil);
        if (!carData || !carData.owner || !carData.isAvaliable || carData.verificationStatus !== 'verified') {
            return res.status(409).json({success: false, message: "Vehicle is currently being booked or is unavailable"})
        }
        try {
            const quote = calculateBookingQuote(carData, pickupDate, returnDate, handoverOption);
            if (quote.error) return res.status(400).json({ success: false, message: quote.error });

            const pickupPoint = normalizeCoordinates(pickupCoordinates) || normalizeCoordinates(carData.coordinates);
            const dropPoint = normalizeCoordinates(dropCoordinates);
            if (!pickupPoint) return res.status(400).json({ success: false, message: "Pickup coordinates are required and must be valid" });
            if (!dropPoint || !String(dropLocation || '').trim()) return res.status(400).json({ success: false, message: "Choose and resolve a valid drop location" });

            const isAvailable = await checkAvailability(car, pickupDate, returnDate)
            if(!isAvailable) return res.status(409).json({success: false, message: "Vehicle is not available"})

            const paymentRequired = process.env.PAYMENTS_ENABLED === 'true';
            const booking = await Booking.create({
            car,
            owner: carData.owner,
            user: _id,
            pickupDate,
            returnDate,
            price: quote.rentalAmount,
            rentalDays: quote.rentalDays,
            baseAmount: quote.baseAmount,
            discountAmount: quote.discountAmount,
            rentalAmount: quote.rentalAmount,
            securityDeposit: quote.securityDeposit,
            totalAmount: quote.totalAmount,
            handoverOption: quote.handoverOption,
            deliveryFee: quote.deliveryFee,
            startOdometerKm: Number(carData.odometerKm || 0),
            securityDepositStatus: quote.securityDeposit > 0 ? (paymentRequired ? 'pending' : 'not_applicable') : 'not_applicable',
            renterNote: renterNote || '',
            pickupLocation: pickupLocation || carData.pickupAddress || carData.location,
            dropLocation: dropLocation || pickupLocation || carData.pickupAddress || carData.location,
            pickupCoordinates: pickupPoint,
            dropCoordinates: dropPoint,
            routeDistanceKm: Number.isFinite(Number(routeDistanceKm)) ? Number(routeDistanceKm) : 0,
            routeDurationMinutes: Number.isFinite(Number(routeDurationMinutes)) ? Number(routeDurationMinutes) : 0,
            paymentStatus: paymentRequired ? 'pending' : 'not_required',
                // Every booking is an owner request. Payment, when enabled, is
                // captured before approval and refunded if the owner rejects it.
                status: paymentRequired ? 'pending_payment' : 'pending',
            })
            if (booking.status === 'confirmed') await User.findByIdAndUpdate(carData.owner, { $inc: { totalTrips: 1 } });
            await createNotification({
            recipient: carData.owner,
            type: booking.status === 'confirmed' ? 'booking_confirmed' : 'booking_request',
            title: booking.status === 'confirmed' ? 'Booking confirmed' : 'New booking request',
            message: `${carData.brand} ${carData.model} is requested from ${new Date(pickupDate).toLocaleDateString()} to ${new Date(returnDate).toLocaleDateString()}. Handover: ${quote.handoverOption === 'owner_delivery' ? `owner delivery (₹${quote.deliveryFee})` : 'renter pickup (free)'}.`,
            booking: booking._id,
            });

            res.json({success: true, message: paymentRequired ? "Booking created. Complete payment to continue." : "Booking Created", bookingId: booking._id, paymentRequired})
        } finally {
            await releaseBookingLock(Car, car, bookingLockToken);
        }

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to List User Bookings 
export const getUserBookings = async (req, res)=>{
    try {
        const {_id} = req.user;
        const bookings = await Booking.find({ user: _id }).populate("car").populate("owner", "name email phone image").sort({createdAt: -1})
        const charges = await BookingCharge.find({ user: _id }).select("booking _id amount status extraKmAmount lateReturnAmount").lean();
        const chargeByBooking = new Map(charges.map(charge => [charge.booking.toString(), charge]));
        const bookingsWithCharges = bookings.map(booking => ({ ...booking.toObject(), additionalCharge: chargeByBooking.get(booking._id.toString()) || null }));
        res.json({success: true, bookings: bookingsWithCharges})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Renters may cancel only their own pending or confirmed bookings.
export const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.body.bookingId, user: req.user._id });
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
        if (booking.status === 'cancelled') return res.json({ success: true, message: "Booking is already cancelled" });
        if (!['pending', 'pending_payment', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({ success: false, message: "This booking can no longer be cancelled" });
        }
        if (new Date(booking.pickupDate) <= new Date()) {
            return res.status(400).json({ success: false, message: "Bookings can only be cancelled before pickup" });
        }
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        await booking.save();
        const refund = await startCancellationRefund(booking);
        const refundMessage = refund.status === 'refund_pending'
            ? ` Refund of ₹${refund.amount} initiated.`
            : refund.status === 'refund_failed'
                ? ' Cancellation recorded; refund requires support review.'
                : '';
        await createNotification({
            recipient: booking.user,
            type: 'booking_cancelled',
            title: 'Booking cancelled',
            message: refund.status === 'refund_pending'
                ? `Your booking was cancelled. A refund of ₹${refund.amount} has been initiated.`
                : 'Your booking was cancelled successfully.',
            booking: booking._id,
        });
        await createNotification({ recipient: booking.owner, type: 'booking_cancelled', title: 'Booking cancelled', message: 'A renter cancelled this booking.', booking: booking._id });
        res.json({ success: true, message: `Booking cancelled.${refundMessage}`, refundStatus: refund.status, refundAmount: refund.amount || 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Both parties can update only their own coordination fields.
export const updateCoordination = async (req, res) => {
    try {
        const { _id, role } = req.user;
        const { bookingId, note, ready } = req.body;
        const booking = await Booking.findById(bookingId).populate('car', 'pickupAddress location');
        if (!booking) return res.json({ success: false, message: "Booking not found" });
        const isOwner = booking.owner.toString() === _id.toString();
        const isRenter = booking.user.toString() === _id.toString();
        if (!isOwner && !isRenter) return res.status(403).json({ success: false, message: "You cannot update this booking" });
        if (typeof note === 'string') {
            if (note.length > 500) return res.json({ success: false, message: "Note must be 500 characters or less" });
            isOwner ? booking.ownerNote = note.trim() : booking.renterNote = note.trim();
        }
        if (typeof ready === 'boolean') isOwner ? booking.ownerReady = ready : booking.renterReady = ready;
        await booking.save();
        res.json({ success: true, message: "Coordination details updated", booking });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

// API to get Owner Bookings

export const getOwnerBookings = async (req, res)=>{
    try {
        if(req.user.role !== 'user'){
            return res.json({ success: false, message: "Unauthorized" })
        }
        const bookings = await Booking.find({owner: req.user._id}).populate('car').populate('user', 'name email phone image').sort({createdAt: -1 })
        res.json({success: true, bookings})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to change booking status
export const changeBookingStatus = async (req, res)=>{
    try {
        const {_id, role} = req.user;
        const {bookingId, status} = req.body

        const booking = await Booking.findById(bookingId)

        if(role !== 'user' || !booking || booking.owner.toString() !== _id.toString()){
            return res.json({ success: false, message: "Unauthorized"})
        }

        if(!['pending', 'pending_payment', 'confirmed', 'active', 'completed', 'cancelled', 'rejected'].includes(status)) {
            return res.json({ success: false, message: "Invalid booking status"})
        }

        if (!canTransitionBooking(booking.status, status) && booking.status !== status) {
            return res.json({ success: false, message: `Cannot change a ${booking.status} booking to ${status}` });
        }
        if (status === 'confirmed' && process.env.PAYMENTS_ENABLED === 'true' && booking.paymentStatus !== 'paid') {
            return res.json({ success: false, message: "Payment is required before confirming this booking" });
        }

        if (status === 'active') {
            const tracking = await startTrackingSession(booking._id);
            if (!tracking) return res.status(400).json({ success: false, message: "Valid pickup and drop coordinates are required before starting live tracking" });
        }

        const wasConfirmed = booking.status === 'confirmed';
        booking.status = status;
        if (status === 'completed') {
            const car = await Car.findById(booking.car).select('includedKmPerDay extraKmCharge lateReturnCharge odometerKm');
            if (!car) return res.json({ success: false, message: "Vehicle not found for settlement" });
            await settleBooking(booking, car, {
                actualReturnDate: req.body.actualReturnDate,
                actualReturnOdometerKm: req.body.actualReturnOdometerKm,
            });
        } else {
            if (status === 'cancelled' || status === 'rejected') booking.cancelledAt = new Date();
            await booking.save();
        }
        if (status === 'completed' || status === 'cancelled' || status === 'rejected') await stopTrackingSession(booking._id);
        const refund = ['cancelled', 'rejected'].includes(status) ? await startCancellationRefund(booking, status) : { status: 'not_required', amount: 0 };
        const refundMessage = refund.status === 'refund_pending'
            ? ` Refund of ₹${refund.amount} initiated.`
            : refund.status === 'refund_failed'
                ? ' Refund requires support review.'
                : '';
        await createNotification({
            recipient: booking.user,
            type: status === 'confirmed' ? 'booking_confirmed' : status === 'completed' ? 'trip_completed' : `booking_${status}`,
            title: status === 'confirmed' ? 'Booking confirmed' : status === 'completed' ? 'Trip completed' : `Booking ${status.replace('_', ' ')}`,
            message: status === 'confirmed' ? 'The owner confirmed your booking.' : status === 'completed' ? 'Your trip is complete. You can now leave a review.' : `Your booking status changed to ${status.replace('_', ' ')}.${refundMessage}`,
            booking: booking._id,
        });
        if (!wasConfirmed && status === 'confirmed') await User.findByIdAndUpdate(booking.owner, { $inc: { totalTrips: 1 } });
        if (wasConfirmed && status === 'cancelled') await User.findByIdAndUpdate(booking.owner, { $inc: { totalTrips: -1 } });

        res.json({ success: true, message: `Status Updated.${refundMessage}`, refundStatus: refund.status, refundAmount: refund.amount || 0 })
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}
