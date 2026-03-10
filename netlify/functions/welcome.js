const { GoogleGenerativeAI } = require("@google/generative-ai");

const STATE_LANG_MAP = {
    "Andhra Pradesh": { lang: "Telugu", script: "Telugu (తెలుగు)" },
    "Arunachal Pradesh": { lang: "Hindi", script: "Devanagari (देवनागरी)" },
    "Assam": { lang: "Assamese", script: "Assamese (অসমীয়া)" },
    "Bihar": { lang: "Bhojpuri", script: "Devanagari (देवनागरी)" },
    "Chhattisgarh": { lang: "Chhattisgarhi", script: "Devanagari (देवनागरी)" },
    "Goa": { lang: "Konkani", script: "Devanagari (देवनागरी)" },
    "Gujarat": { lang: "Gujarati", script: "Gujarati (ગુજરાતી)" },
    "Haryana": { lang: "Haryanvi", script: "Devanagari (देवनागरी)" },
    "Himachal Pradesh": { lang: "Hindi", script: "Devanagari (देवनागरी)" },
    "Jharkhand": { lang: "Santali", script: "Ol Chiki / Devanagari" },
    "Karnataka": { lang: "Kannada", script: "Kannada (ಕನ್ನಡ)" },
    "Kerala": { lang: "Malayalam", script: "Malayalam (മലയാളം)" },
    "Madhya Pradesh": { lang: "Hindi", script: "Devanagari (देवनागरी)" },
    "Maharashtra": { lang: "Marathi", script: "Devanagari (देवनागरी)" },
    "Manipur": { lang: "Meitei", script: "Bengali (মৈতৈ)" },
    "Meghalaya": { lang: "Khasi / Garo", script: "Latin" },
    "Mizoram": { lang: "Mizo", script: "Latin" },
    "Nagaland": { lang: "Nagamese", script: "Latin" },
    "Odisha": { lang: "Odia", script: "Odia (ଓଡ଼ିଆ)" },
    "Punjab": { lang: "Punjabi", script: "Gurmukhi (ਗੁਰਮੁਖੀ)" },
    "Rajasthan": { lang: "Rajasthani", script: "Devanagari (देवनागरी)" },
    "Sikkim": { lang: "Nepali", script: "Devanagari (देवनागरी)" },
    "Tamil Nadu": { lang: "Tamil", script: "Tamil (தமிழ்)" },
    "Telangana": { lang: "Telugu", script: "Telugu (తెలుగు)" },
    "Tripura": { lang: "Bengali / Kokborok", script: "Bengali / Latin" },
    "Uttar Pradesh": { lang: "Hindi", script: "Devanagari (देवनागरी)" },
    "Uttarakhand": { lang: "Garhwali / Kumaoni", script: "Devanagari" },
    "West Bengal": { lang: "Bengali", script: "Bengali (বাংলা)" },
    // Union Territories
    "Andaman & Nicobar": { lang: "Hindi", script: "Devanagari (देवनागरी)" },
    "Chandigarh": { lang: "Punjabi", script: "Gurmukhi (ਗੁਰਮੁਖੀ)" },
    "Dadra & Nagar Haveli": { lang: "Gujarati", script: "Gujarati (ગુજરાતી)" },
    "Daman & Diu": { lang: "Gujarati", script: "Gujarati (ગુજરાતી)" },
    "Delhi": { lang: "Hindi", script: "Devanagari (देवनागरी)" },
    "Jammu & Kashmir": { lang: "Kashmiri", script: "Perso-Arabic" },
    "Ladakh": { lang: "Ladakhi", script: "Tibetan" },
    "Lakshadweep": { lang: "Malayalam", script: "Malayalam (മലയാളം)" },
    "Puducherry": { lang: "Tamil", script: "Tamil (தமிழ்)" },
};

// Standard CORS headers for all responses
const CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

exports.handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers: CORS_HEADERS, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    try {
        const { state, mode } = JSON.parse(event.body);
        const userState = (state || "Gujarat").trim();
        const userMode = (mode || "nativelish").trim();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
        }

        const cfg = STATE_LANG_MAP[userState] || { lang: "Hindi", script: "Devanagari" };

        const prompt = `You are generating localized UI text for an Indian student AI assistant.
State: ${userState}
Language: ${cfg.lang}
Mode: ${userMode.toUpperCase()}

If mode is 'NATIVE', use 100% ${cfg.lang} written in its native script (${cfg.script}). DO NOT use English words or Latin alphabet.
If mode is 'NATIVELISH', use a casual mix of ${cfg.lang} and English, and MUST WRITE ${cfg.lang} WORDS IN ENGLISH ALPHABETS (Romanized). Do NOT use native scripts.

Generate the following UI elements:
1. "greeting": A complete, friendly, and naturally localized casual greeting (e.g. 'Hello bhai', 'Namaste', 'Kem chho yaar', 'Enthokkeyundu viseesham'). Include natural colloquialisms if they fit the vibe.
2. "subtitle": A natural, fully localized translation of "Ask anything — research, study, or general doubts 😊". Translate the entire meaning smoothly into the target language, avoiding awkward half-English phrases unless it perfectly suits NATIVELISH mode.
3. "placeholder": A translation of "Ask Aapka AI anything..."
4. "suggestions": An array of 4 UNIQUE, RANDOM, and DIVERSE student-related questions. Give completely different questions every time (e.g. mix Science, History, Coding, Space, Math, Current Affairs). Each object must have:
   - "icon": A single relevant emoji matching the question
   - "text": A translated, student-friendly question (keep it short)
   - "prompt": The actual English prompt that will be sent to the AI when clicked.

Return ONLY valid JSON format like this, no markdown formatting blocks:
{
  "greeting": "...",
  "subtitle": "...",
  "placeholder": "...",
  "suggestions": [
    {"icon": "🧠", "text": "...", "prompt": "What is machine learning?"}
  ]
}`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

        const jsonResult = JSON.parse(text);
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify(jsonResult),
        };
    } catch (error) {
        console.error("Welcome API Error:", error);
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                greeting: "Hello",
                subtitle: "Ask anything — research, study, ya general doubts 😊",
                placeholder: "Ask Aapka AI anything...",
                suggestions: [
                    { icon: "🧠", text: "Machine Learning?", prompt: "Explain machine learning simply" }
                ]
            }),
        };
    }
};
