import cron from "node-cron";
import { refreshAllPricingSuggestions } from "../services/pricingService.js";

let scheduled = false;

export const startPricingJob = () => {
    if (scheduled) return;
    scheduled = true;
    const expression = process.env.PRICING_JOB_CRON || "0 3 * * *";
    const timezone = process.env.PRICING_TIMEZONE || "Asia/Kolkata";
    cron.schedule(expression, async () => {
        try {
            const count = await refreshAllPricingSuggestions();
            console.log(`Pricing suggestions refreshed for ${count} vehicles`);
        } catch (error) {
            console.error("Scheduled pricing refresh failed:", error.message);
        }
    }, { timezone });
    console.log(`Pricing suggestion job scheduled with ${expression} (${timezone})`);
};
