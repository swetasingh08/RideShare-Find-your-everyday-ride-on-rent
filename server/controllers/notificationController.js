import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
    try {
        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(40).populate("booking", "_id status"),
            Notification.countDocuments({ recipient: req.user._id, read: false }),
        ]);
        res.json({ success: true, notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { read: true, readAt: new Date() },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { read: true, readAt: new Date() }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
