import { getPricingSuggestion } from "../services/pricingService.js";

export const getOwnerPricingSuggestion = async (req, res) => {
    try {
        const result = await getPricingSuggestion(req.params.carId, req.user._id);
        if (result.error) return res.status(404).json({ success: false, message: result.error });
        res.json({ success: true, suggestion: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
