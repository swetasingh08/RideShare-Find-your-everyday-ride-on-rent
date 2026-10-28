import express from "express";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const notificationRouter = express.Router();

notificationRouter.get("/", protect, getNotifications);
notificationRouter.post("/read-all", protect, markAllNotificationsRead);
notificationRouter.post("/:id/read", protect, markNotificationRead);

export default notificationRouter;
