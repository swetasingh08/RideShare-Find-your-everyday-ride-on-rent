import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const notificationSchema = new mongoose.Schema({
    recipient: { type: ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    booking: { type: ObjectId, ref: "Booking" },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
