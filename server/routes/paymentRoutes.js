import express from "express";
import { createAdditionalChargeOrder, createPaymentOrder, handlePaymentWebhook, verifyAdditionalCharge, verifyPayment } from "../controllers/paymentController.js";
import { protect, requireUser } from "../middleware/auth.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-order", protect, requireUser, createPaymentOrder);
paymentRouter.post("/verify", protect, requireUser, verifyPayment);
paymentRouter.post("/create-charge-order", protect, requireUser, createAdditionalChargeOrder);
paymentRouter.post("/verify-charge", protect, requireUser, verifyAdditionalCharge);
paymentRouter.post("/webhook", handlePaymentWebhook);

export default paymentRouter;
