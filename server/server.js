import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import trackingRouter from "./routes/trackingRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import pricingRouter from "./routes/pricingRoutes.js";
import locationRouter from "./routes/locationRoutes.js";
import invoiceRouter from "./routes/invoiceRoutes.js";
import { startPricingJob } from "./jobs/pricingJob.js";
import { refreshAllPricingSuggestions } from "./services/pricingService.js";

// Initialize Express App
const app = express()

// Connect Database
await connectDB()

// Middleware
app.use(cors())
app.use(express.json({ verify: (req, _res, buffer) => { req.rawBody = buffer } }))

app.get('/', (req, res)=> res.send("Server is running"))
app.use('/api/user', userRouter)
app.use('/api/owner', ownerRouter)
app.use('/api/bookings', bookingRouter)
app.use('/api/admin', adminRouter)
app.use('/api/payments', paymentRouter)
app.use('/api/notifications', notificationRouter)
app.use('/api/reviews', reviewRouter)
app.use('/api/tracking', trackingRouter)
app.use('/api/ai', aiRouter)
app.use('/api/pricing', pricingRouter)
app.use('/api/locations', locationRouter)
app.use('/api/invoices', invoiceRouter)

app.get('/api/cron/pricing', async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const authorization = req.headers.authorization;
    if (process.env.VERCEL && (!cronSecret || authorization !== `Bearer ${cronSecret}`)) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const count = await refreshAllPricingSuggestions();
        res.json({ success: true, refreshed: count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
    startPricingJob();
    app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
}

export default app;
