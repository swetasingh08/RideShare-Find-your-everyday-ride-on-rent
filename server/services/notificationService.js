import Notification from "../models/Notification.js";

export const createNotification = async ({ recipient, type, title, message, booking }) => {
    if (!recipient) return null;
    try {
        return await Notification.create({ recipient, type, title, message, booking });
    } catch (error) {
        // Notifications must never make a booking or payment request fail.
        console.error("Could not create notification:", error.message);
        return null;
    }
};

export const notifyBookingParty = async ({ booking, recipient, type, title, message }) =>
    createNotification({ recipient, type, title, message, booking: booking?._id || booking });
