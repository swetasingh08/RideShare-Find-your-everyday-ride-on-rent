import PDFDocument from "pdfkit";
import Booking from "../models/Booking.js";
import { ensureInvoice } from "../services/invoiceService.js";

const getAuthorizedBooking = async (req, bookingId) => {
    const booking = await Booking.findById(bookingId).populate("car", "brand model registrationNumber").populate("user", "name email").populate("owner", "name email");
    if (!booking) return { error: { status: 404, message: "Booking not found" } };
    const requesterId = req.user._id.toString();
    if (booking.user._id.toString() !== requesterId && booking.owner._id.toString() !== requesterId) return { error: { status: 403, message: "You cannot access this invoice" } };
    return { booking };
};

export const getInvoice = async (req, res) => {
    try {
        const result = await getAuthorizedBooking(req, req.params.bookingId);
        if (result.error) return res.status(result.error.status).json({ success: false, message: result.error.message });
        const invoice = await ensureInvoice(result.booking);
        res.json({ success: true, invoice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const downloadInvoice = async (req, res) => {
    try {
        const result = await getAuthorizedBooking(req, req.params.bookingId);
        if (result.error) return res.status(result.error.status).json({ success: false, message: result.error.message });
        const { booking } = result;
        const invoice = await ensureInvoice(booking);
        const carName = `${booking.car?.brand || "Vehicle"} ${booking.car?.model || ""}`.trim();
        const renterName = booking.user?.name || "Renter";
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=rideshare-${invoice.invoiceNumber}.pdf`);
        doc.pipe(res);
        doc.fontSize(24).fillColor("#15947c").text("RideShare", { continued: true }).fillColor("#111827").fontSize(12).text("  TAX INVOICE", { align: "right" });
        doc.moveDown();
        doc.fontSize(10).fillColor("#4b5563").text(`Invoice: ${invoice.invoiceNumber}`).text(`Issued: ${new Date(invoice.issuedAt).toLocaleDateString("en-IN")}`);
        doc.moveDown();
        doc.fillColor("#111827").fontSize(13).text("Booking details");
        doc.fontSize(10).fillColor("#4b5563").text(`Renter: ${renterName} (${booking.user?.email || ""})`).text(`Vehicle: ${carName}`).text(`Pickup: ${new Date(booking.pickupDate).toLocaleString("en-IN")}`).text(`Return: ${new Date(booking.returnDate).toLocaleString("en-IN")}`).text(`Status: ${booking.status}`);
        doc.moveDown();
        const line = (label, amount, color = "#111827") => {
            doc.fillColor("#4b5563").text(label, 70, doc.y, { continued: true }).fillColor(color).text(`₹${Number(amount || 0).toLocaleString("en-IN")}`, { align: "right" });
        };
        doc.fillColor("#111827").fontSize(13).text("Charges");
        doc.moveDown(0.4);
        line("Rental amount", invoice.rentalAmount);
        if (invoice.deliveryFee) line("Owner delivery", invoice.deliveryFee);
        line("Security deposit", invoice.securityDeposit);
        if (invoice.extraKmAmount) line("Extra kilometres", invoice.extraKmAmount);
        if (invoice.lateReturnAmount) line("Late return", invoice.lateReturnAmount);
        line("Total charged", invoice.totalAmount, "#15947c");
        if (invoice.depositAppliedAmount) line("Deposit applied to charges", -invoice.depositAppliedAmount);
        if (invoice.depositRefundAmount) line("Deposit refund", -invoice.depositRefundAmount, "#15947c");
        doc.moveDown();
        doc.fontSize(9).fillColor("#6b7280").text("This invoice is generated electronically by RideShare. Security deposit treatment is based on the final vehicle-return settlement.");
        doc.end();
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ success: false, message: error.message });
        else res.end();
    }
};
