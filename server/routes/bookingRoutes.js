import express from "express";
import { cancelBooking, changeBookingStatus, checkAvailabilityOfCar, createBooking, getBookingQuote, getOwnerBookings, getUserBookings, updateCoordination } from "../controllers/bookingController.js";
import { protect, requireUser } from "../middleware/auth.js";

const bookingRouter = express.Router();

// Browsing availability stays public so the catalogue works while signed out.
bookingRouter.post('/check-availability', checkAvailabilityOfCar)
bookingRouter.post('/quote', getBookingQuote)
bookingRouter.post('/create', protect, requireUser, createBooking)
bookingRouter.get('/user', protect, requireUser, getUserBookings)
bookingRouter.post('/cancel', protect, requireUser, cancelBooking)
bookingRouter.get('/owner', protect, requireUser, getOwnerBookings)
bookingRouter.post('/change-status', protect, requireUser, changeBookingStatus)
bookingRouter.post('/coordination', protect, updateCoordination)

export default bookingRouter;
