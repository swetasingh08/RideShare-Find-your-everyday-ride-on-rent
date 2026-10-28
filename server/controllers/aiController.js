import { classifyAssistantIntent, recommendCars } from "../services/recommendationService.js";
import { generateAssistantReply } from "../services/aiService.js";
import AIConversation from "../models/AIConversation.js";

const formatMessage = (preferences, vehicles) => {
    if (!vehicles.length) {
        const request = [preferences.category, preferences.location, preferences.maxPrice ? `under ₹${preferences.maxPrice}` : ""].filter(Boolean).join(" ");
        return `I could not find ${request ? `a vehicle matching ${request}` : "a matching vehicle"} right now. Try widening the location, vehicle type, price, or date range.`;
    }
    const first = vehicles[0];
    const details = [preferences.location, preferences.category, preferences.fuel_type, preferences.transmission, preferences.maxPrice ? `under ₹${preferences.maxPrice}` : "", preferences.pickupDate ? `for ${preferences.pickupDate} to ${preferences.returnDate}` : ""].filter(Boolean).join(" ");
    return `I found ${vehicles.length} option${vehicles.length === 1 ? "" : "s"}${details ? ` ${details}` : ""}. My top match is the ${first.brand} ${first.model} at ₹${first.pricePerDay} per day.`;
};

const conversationReply = (intent) => {
    if (intent === "help") return "I can find cars, bikes, scooters, vans, and other listed vehicles by city, dates, type, fuel, transmission, seats, and daily budget. Try: “Find an automatic SUV under ₹2,000 near Bengaluru.”";
    return "Hi! I can help you find cars, bikes, scooters, vans, and other listed vehicles. Tell me your city, dates, preferred type, or budget.";
};

const safeSessionId = value => {
    const sessionId = String(value || "").trim();
    return /^[a-zA-Z0-9_-]{8,100}$/.test(sessionId) ? sessionId : null;
};

const clientHistory = value => Array.isArray(value)
    ? value.filter(item => ["user", "assistant"].includes(item?.role) && typeof item?.text === "string").slice(-8).map(item => ({ role: item.role, content: item.text.slice(0, 1000) }))
    : [];

const findConversation = async (req, sessionId) => {
    if (!req.user || !sessionId) return null;
    return AIConversation.findOne({ user: req.user._id, sessionId });
};

const saveConversation = async (req, sessionId, history, preferences) => {
    if (!req.user || !sessionId) return;
    await AIConversation.findOneAndUpdate(
        { user: req.user._id, sessionId },
        { user: req.user._id, sessionId, messages: history.slice(-40), preferences },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

export const recommend = async (req, res) => {
    try {
        const query = String(req.body.query || "").trim();
        const intent = classifyAssistantIntent(query);
        if (intent !== "search") return res.json({ success: true, preferences: {}, vehicles: [], aiUsed: false, intent, assistantMessage: conversationReply(intent) });
        const result = await recommendCars(query, req.body.preferences || {}, []);
        res.json({ success: true, ...result, assistantMessage: formatMessage(result.preferences, result.vehicles) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const chat = async (req, res) => {
    try {
        const query = String(req.body.message || "").trim();
        if (!query) return res.status(400).json({ success: false, message: "Tell me what kind of vehicle you need" });
        const intent = classifyAssistantIntent(query);
        const sessionId = safeSessionId(req.body.sessionId);
        const conversation = await findConversation(req, sessionId);
        const history = conversation?.messages?.map(item => ({ role: item.role, content: item.content })) || clientHistory(req.body.history);
        if (intent !== "search") {
            const reply = conversationReply(intent);
            const updatedHistory = [...history, { role: "user", content: query }, { role: "assistant", content: reply }].slice(-40);
            try { await saveConversation(req, sessionId, updatedHistory, conversation?.preferences || {}); } catch (error) { console.error("Could not save AI conversation:", error.message); }
            return res.json({ success: true, reply, fallback: true, sessionId, intent, vehicles: [], preferences: {} });
        }
        const result = await recommendCars(query, { ...(conversation?.preferences || {}), ...(req.body.preferences || {}) }, history);
        const fallbackReply = formatMessage(result.preferences, result.vehicles);
        const aiReply = result.aiUsed ? await generateAssistantReply(query, result.preferences, result.vehicles, history) : null;
        const reply = aiReply || fallbackReply;
        const updatedHistory = [...history, { role: "user", content: query }, { role: "assistant", content: reply }].slice(-40);
        try { await saveConversation(req, sessionId, updatedHistory, result.preferences); } catch (error) { console.error("Could not save AI conversation:", error.message); }
        res.json({ success: true, reply, fallback: !aiReply, sessionId, intent, ...result });
    } catch (error) {
        console.error("AI recommendation request failed:", error.message);
        res.status(200).json({ success: true, fallback: true, reply: "I am having trouble searching right now. Please use the vehicle filters, or try again in a moment.", vehicles: [], preferences: {} });
    }
};

export const history = async (req, res) => {
    try {
        if (!req.user) return res.json({ success: true, messages: [] });
        const sessionId = safeSessionId(req.query.sessionId);
        const conversation = await findConversation(req, sessionId);
        res.json({ success: true, messages: conversation?.messages?.map(item => ({ role: item.role, text: item.content })) || [] });
    } catch (error) {
        res.json({ success: true, messages: [] });
    }
};

export const clearHistory = async (req, res) => {
    try {
        if (req.user) {
            const sessionId = safeSessionId(req.query.sessionId || req.body?.sessionId);
            if (sessionId) await AIConversation.deleteOne({ user: req.user._id, sessionId });
        }
        res.json({ success: true });
    } catch (error) {
        res.json({ success: true });
    }
};
