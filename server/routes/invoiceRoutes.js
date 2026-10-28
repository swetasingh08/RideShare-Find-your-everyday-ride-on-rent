import express from "express";
import { downloadInvoice, getInvoice } from "../controllers/invoiceController.js";
import { protect, requireUser } from "../middleware/auth.js";

const invoiceRouter = express.Router();

invoiceRouter.get("/booking/:bookingId", protect, requireUser, getInvoice);
invoiceRouter.get("/booking/:bookingId/download", protect, requireUser, downloadInvoice);

export default invoiceRouter;
