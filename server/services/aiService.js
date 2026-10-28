const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models";
let unavailableUntil = 0;

const requestJson = async (url, body) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(process.env.AI_TIMEOUT_MS) || 20000);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        const raw = await response.text();
        let payload = null;
        try { payload = raw ? JSON.parse(raw) : null; } catch { /* keep the status error */ }
        if (!response.ok) {
            const providerMessage = payload?.error?.message || `AI provider returned ${response.status}`;
            throw new Error(providerMessage);
        }
        return payload;
    } finally {
        clearTimeout(timeout);
    }
};

const extractText = response => response?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim() || "";

const parseJson = text => {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned);
};

const aiAvailable = () => Boolean(process.env.GEMINI_API_KEY);
const providerAvailable = () => aiAvailable() && Date.now() >= unavailableUntil;
const markUnavailable = () => { unavailableUntil = Date.now() + 30_000; };

const configuredModels = () => [...new Set([
    process.env.GEMINI_MODEL,
    process.env.GEMINI_FALLBACK_MODEL,
    "gemini-2.0-flash",
].filter(Boolean))];

const generateContent = async (body, preferredModel) => {
    let lastError;
    for (const model of [preferredModel, ...configuredModels()].filter(Boolean).filter((value, index, list) => list.indexOf(value) === index)) {
        try {
            return await requestJson(`${GEMINI_API}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, body);
        } catch (error) {
            lastError = error;
            console.error(`Gemini model ${model} failed:`, error.message);
        }
    }
    throw lastError || new Error("No Gemini model is configured");
};

export const extractRentalPreferences = async (query, history = []) => {
    if (!providerAvailable()) return null;
    const model = process.env.GEMINI_MODEL;
    const prompt = `You extract vehicle-rental search filters. Return ONLY valid JSON with these optional keys: location, category, fuel_type, transmission, maxPrice, seats, pickupDate, returnDate. Use null for unknown values. Preserve Indian rupee amounts as numbers. Interpret relative dates using today's date ${new Date().toISOString().split("T")[0]}. Supported categories: Hatchback, Sedan, SUV, MUV, Luxury, Van, Scooter, Motorcycle, Three-wheeler, Bicycle. Map auto, rickshaw, tuk-tuk, and 3 wheeler to Three-wheeler; map bike to Motorcycle; map scooty to Scooter. Supported fuels: Petrol, Diesel, CNG, Electric, Hybrid, Gas. Supported transmissions: Automatic, Manual, AMT, CVT, DCT. User request: ${query}. Recent conversation: ${JSON.stringify(history.slice(-6))}`;
    try {
        const response = await generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0, responseMimeType: "application/json" },
        }, model);
        const parsed = parseJson(extractText(response));
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
        markUnavailable();
        console.error("Gemini preference extraction unavailable:", error.message);
        return null;
    }
};

export const generateAssistantReply = async (query, preferences, vehicles, history = []) => {
    if (!providerAvailable()) return null;
    const model = process.env.GEMINI_MODEL;
    const vehicleSummary = vehicles.slice(0, 8).map(vehicle => ({ brand: vehicle.brand, model: vehicle.model, location: vehicle.location, category: vehicle.category, fuel_type: vehicle.fuel_type, transmission: vehicle.transmission, pricePerDay: vehicle.pricePerDay, recommendationScore: vehicle.recommendationScore }));
    const prompt = `You are RideShare's rental assistant. Answer in 2-4 concise sentences, using ONLY the supplied filters and vehicle results. Do not invent availability, prices, policies, or features. If no vehicles match, politely suggest which filter to widen. User request: ${query}. Parsed filters: ${JSON.stringify(preferences)}. Matching vehicles: ${JSON.stringify(vehicleSummary)}. Recent conversation: ${JSON.stringify(history.slice(-6))}`;
    try {
        const response = await generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 180 },
        }, model);
        return extractText(response) || null;
    } catch (error) {
        markUnavailable();
        console.error("Gemini assistant reply unavailable:", error.message);
        return null;
    }
};
