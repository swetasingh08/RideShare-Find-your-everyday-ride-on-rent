import Invoice from "../models/Invoice.js";

const invoiceNumberFor = booking => `RS-${new Date().getFullYear()}-${String(booking._id).slice(-10).toUpperCase()}`;

export const ensureInvoice = async booking => {
    const invoiceNumber = booking.invoiceNumber || invoiceNumberFor(booking);
    const invoice = await Invoice.findOneAndUpdate(
        { booking: booking._id },
        {
            booking: booking._id,
            invoiceNumber,
            user: booking.user?._id || booking.user,
            owner: booking.owner?._id || booking.owner,
            rentalAmount: Number(booking.rentalAmount || 0),
            deliveryFee: Number(booking.deliveryFee || 0),
            securityDeposit: Number(booking.securityDeposit || 0),
            extraKmAmount: Number(booking.extraKmAmount || 0),
            lateReturnAmount: Number(booking.lateReturnAmount || 0),
            totalAdditionalCharges: Number(booking.totalAdditionalCharges || 0),
            depositAppliedAmount: Number(booking.depositAppliedAmount || 0),
            depositRefundAmount: Number(booking.depositRefundAmount || 0),
            totalAmount: Number(booking.totalAmount || booking.price || 0) + Number(booking.totalAdditionalCharges || 0),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (booking.invoiceNumber !== invoiceNumber) {
        booking.invoiceNumber = invoiceNumber;
        await booking.save();
    }
    return invoice;
};
