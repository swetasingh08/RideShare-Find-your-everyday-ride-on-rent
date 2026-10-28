import express from "express";
import { getOwnerPricingSuggestion } from "../controllers/pricingController.js";
import { protect, requireUser } from "../middleware/auth.js";

const pricingRouter = express.Router();

pricingRouter.get("/:carId", protect, requireUser, getOwnerPricingSuggestion);

export default pricingRouter;
