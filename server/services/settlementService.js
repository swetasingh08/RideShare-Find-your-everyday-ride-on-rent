import BookingCharge from "../models/BookingCharge.js";
import { refundPaymentAmount } from "./paymentService.js";

const HOUR_MS = 60 * 60 * 1000;

const validDate = (value, fallback) => {
    const date = value ? new Date(value) : fallback;
    return Number.isNaN(date.valueOf()) ? fallback : date;
};

export const calculateBookingSettlement = (booking, car, input = {}) => {
    const actualReturnDate = validDate(input.actualReturnDate, new Date());
    const startOdometerKm = Math.max(0, Number(booking.startOdometerKm || 0));
    const actualReturnOdometerKm = input.actualReturnOdometerKm === undefined || input.actualReturnOdometerKm === ""
        ? null
        : Math.max(0, Number(input.actualReturnOdometerKm));
    const actualKm = actualReturnOdometerKm === null ? 0 : Math.max(0, actualReturnOdometerKm - startOdometerKm);
    const includedKmTotal = Math.max(0, Number(car.includedKmPerDay || 0) * Number(booking.rentalDays || 1));
    const extraKm = Math.max(0, actualKm - includedKmTotal);
    const extraKmAmount = Math.round(extraKm * Math.max(0, Number(car.extraKmCharge || 0)));
    const lateHours = Math.max(0, Math.ceil((actualReturnDate.valueOf() - new Date(booking.returnDate).valueOf()) / HOUR_MS));
    const lateReturnAmount = Math.round(lateHours * Math.max(0, Number(car.lateReturnCharge || 0)));
    const totalAdditionalCharges = extraKmAmount + lateReturnAmount;
    const securityDeposit = Math.max(0, Number(booking.securityDeposit || 0));
    const depositAppliedAmount = Math.min(securityDeposit, totalAdditionalCharges);
    const depositRefundAmount = Math.max(0, securityDeposit - depositAppliedAmount);
    const additionalAmountDue = Math.max(0, totalAdditionalCharges - securityDeposit);

    return {
        actualReturnDate,
        actualReturnOdometerKm,
        actualKm,
        includedKmTotal,
        extraKm,
        extraKmAmount,
        lateHours,
        lateReturnAmount,
        totalAdditionalCharges,
        depositAppliedAmount,
        depositRefundAmount,
        additionalAmountDue,
    };
};

export const settleBooking = async (booking, car, input = {}) => {
    if (booking.settlementStatus === "settled") return { booking, charge: null, alreadySettled: true };

    const settlement = calculateBookingSettlement(booking, car, input);
    Object.assign(booking, settlement, {
        status: "completed",
        completedAt: booking.completedAt || new Date(),
        settledAt: new Date(),
        settlementStatus: "settled",
        securityDepositStatus: booking.securityDeposit > 0 ? (settlement.depositRefundAmount > 0 ? "refund_pending" : "forfeited") : "not_applicable",
        additionalPaymentStatus: settlement.additionalAmountDue > 0 && process.env.PAYMENTS_ENABLED === "true" ? "pending" : "not_required",
    });
    await booking.save();

    let charge = null;
    if (settlement.additionalAmountDue > 0) {
        charge = await BookingCharge.findOneAndUpdate(
            { booking: booking._id },
            {
                booking: booking._id,
                user: booking.user,
                amount: settlement.additionalAmountDue,
                currency: "INR",
                extraKmAmount: settlement.extraKmAmount,
                lateReturnAmount: settlement.lateReturnAmount,
                status: "pending",
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    if (settlement.depositRefundAmount > 0 && booking.paymentStatus === "paid") {
        try {
            const refund = await refundPaymentAmount(booking, settlement.depositRefundAmount, "security deposit release");
            if (refund.status === "not_required" || refund.status === "not_configured") booking.securityDepositStatus = "refund_failed";
            else booking.securityDepositStatus = "refund_pending";
        } catch (error) {
            booking.securityDepositStatus = "refund_failed";
            booking.ownerNote = `${booking.ownerNote || ""}\nDeposit refund error: ${error.message}`.trim().slice(0, 500);
        }
        await booking.save();
    }

    return { booking, charge };
};
