const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── Indian States → Language Config ──
const STATE_LANG_MAP = {
    "Andhra Pradesh": { lang: "Telugu", script: "Telugu (తెలుగు)", mix: "Telugu-English (Tenglish)", greeting: "ఎలా ఉన్నారు", flavor: "Baaga cheppandi style" },
    "Arunachal Pradesh": { lang: "Hindi", script: "Devanagari (देवनागरी)", mix: "Hindi with local flavor", greeting: "Hello bhai", flavor: "Northeast warmth" },
    "Assam": { lang: "Assamese", script: "Assamese (অসমীয়া)", mix: "Assamese-English", greeting: "নমস্কাৰ", flavor: "Bohag Bihu vibes" },
    "Bihar": { lang: "Bhojpuri", script: "Devanagari (देवनागरी)", mix: "Bhojpuri-Hindi-English", greeting: "का हाल बा", flavor: "Litti-chokha energy" },
    "Chhattisgarh": { lang: "Chhattisgarhi", script: "Devanagari (देवनागरी)", mix: "Chhattisgarhi-Hindi-English", greeting: "जंघे जुहार", flavor: "Chhattisgarhi swag" },
    "Goa": { lang: "Konkani", script: "Devanagari (देवनागरी)", mix: "Konkani-English (Konklish)", greeting: "देव बरें करूं", flavor: "Susegad vibes" },
    "Gujarat": { lang: "Gujarati", script: "Gujarati (ગુજરાતી)", mix: "Gujarati-English (Gujlish)", greeting: "કેમ છો", flavor: "Gujju garba swag" },
    "Haryana": { lang: "Haryanvi", script: "Devanagari (देवनागरी)", mix: "Haryanvi-Hindi-English", greeting: "राम राम भाई", flavor: "Jaat ke thaath" },
    "Himachal Pradesh": { lang: "Hindi", script: "Devanagari (देवनागरी)", mix: "Pahari-Hindi-English", greeting: "नमस्ते जी", flavor: "Pahadi chill vibes" },
    "Jharkhand": { lang: "Santali", script: "Ol Chiki / Devanagari", mix: "Santali-Hindi-English", greeting: "Johar", flavor: "Ranchi swag" },
    "Karnataka": { lang: "Kannada", script: "Kannada (ಕನ್ನಡ)", mix: "Kannada-English (Kanglish)", greeting: "ನಮಸ್ಕಾರ", flavor: "Bengaluru tech vibes" },
    "Kerala": { lang: "Malayalam", script: "Malayalam (മലയാളം)", mix: "Malayalam-English (Manglish)", greeting: "എന്താണ് വിശേഷം", flavor: "Kerala sadya vibes" },
    "Madhya Pradesh": { lang: "Hindi", script: "Devanagari (देवनागरी)", mix: "Hindi-English (Hinglish)", greeting: "क्या हाल है भाई", flavor: "MP ka dil" },
    "Maharashtra": { lang: "Marathi", script: "Devanagari (देवनागरी)", mix: "Marathi-English (Minglish)", greeting: "कसा आहेस", flavor: "Puneri patti" },
    "Manipur": { lang: "Meitei", script: "Bengali (মৈতৈ)", mix: "Meitei-English", greeting: "Hello bhai", flavor: "Imphal vibes" },
    "Meghalaya": { lang: "Khasi / Garo", script: "Latin", mix: "Khasi/Garo-English", greeting: "Phi long kumno", flavor: "Shillong rain vibes" },
    "Mizoram": { lang: "Mizo", script: "Latin", mix: "Mizo-English", greeting: "Chibai", flavor: "Aizawl vibes" },
    "Nagaland": { lang: "Nagamese", script: "Latin", mix: "Nagamese-English", greeting: "Hello bro", flavor: "Hornbill vibes" },
    "Odisha": { lang: "Odia", script: "Odia (ଓଡ଼ିଆ)", mix: "Odia-English (Odlish)", greeting: "ନମସ୍କାର", flavor: "Jagannath vibes" },
    "Punjab": { lang: "Punjabi", script: "Gurmukhi (ਗੁਰਮੁਖੀ)", mix: "Punjabi-English (Punglish)", greeting: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", flavor: "Pind da swag" },
    "Rajasthan": { lang: "Rajasthani", script: "Devanagari (देवनागरी)", mix: "Rajasthani-Hindi-English", greeting: "खम्मा घणी", flavor: "Marwari thaath" },
    "Sikkim": { lang: "Nepali", script: "Devanagari (देवनागरी)", mix: "Nepali-English", greeting: "नमस्ते दाई", flavor: "Himalayan chill" },
    "Tamil Nadu": { lang: "Tamil", script: "Tamil (தமிழ்)", mix: "Tamil-English (Tanglish)", greeting: "வணக்கம் டா", flavor: "Filter coffee energy" },
    "Telangana": { lang: "Telugu", script: "Telugu (తెలుగు)", mix: "Telugu-English (Tenglish)", greeting: "ఎలా ఉన్నారు", flavor: "Hyderabadi biryani swag" },
    "Tripura": { lang: "Bengali / Kokborok", script: "Bengali / Latin", mix: "Bengali/Kokborok-English", greeting: "কেমন আছো", flavor: "Agartala vibes" },
    "Uttar Pradesh": { lang: "Hindi", script: "Devanagari (देवनागरी)", mix: "Hindi-English (Hinglish)", greeting: "क्या हाल है भाई", flavor: "UP bhaiyya energy" },
    "Uttarakhand": { lang: "Garhwali / Kumaoni", script: "Devanagari", mix: "Garhwali/Kumaoni-Hindi-English", greeting: "पहलाग", flavor: "Devbhoomi vibes" },
    "West Bengal": { lang: "Bengali", script: "Bengali (বাংলা)", mix: "Bengali-English (Banglish)", greeting: "কী খবর", flavor: "Rosogolla energy" },
    "Andaman and Nicobar": { lang: "Hindi", script: "Devanagari (देवनागरी)", mix: "Hindi-English (Hinglish)", greeting: "क्या हाल है", flavor: "Island vibes" },
    "Chandigarh": { lang: "Punjabi", script: "Gurmukhi (ਗੁਰਮੁਖੀ)", mix: "Punjabi-Hindi-English", greeting: "ਕੀ ਹਾਲ ਬਈ", flavor: "City Beautiful swag" },
    "Dadra Nagar Haveli": { lang: "Gujarati", script: "Gujarati (ગુજરાતી)", mix: "Gujarati-Hindi-English", greeting: "કેમ છો", flavor: "Silvassa vibes" },
    "Daman and Diu": { lang: "Gujarati", script: "Gujarati (ગુજરાતી)", mix: "Gujarati-English (Gujlish)", greeting: "કેમ છો", flavor: "Coastal Gujju vibes" },
    "Delhi": { lang: "Hindi", script: "Devanagari (देवनागरी)", mix: "Hindi-English (Hinglish)", greeting: "क्या सीन है", flavor: "Dilli wala swagger" },
    "Jammu and Kashmir": { lang: "Urdu", script: "Nastaliq/Devanagari", mix: "Urdu-Hindi-English", greeting: "السلام علیکم", flavor: "Kashmiri warmth" },
    "Ladakh": { lang: "Ladakhi", script: "Tibetan/Devanagari", mix: "Ladakhi-Hindi-English", greeting: "जुले", flavor: "Ladakhi zen" },
    "Lakshadweep": { lang: "Malayalam", script: "Malayalam (മലയാളം)", mix: "Malayalam-English", greeting: "എന്താണ് വിശേഷം", flavor: "Island paradise vibes" },
    "Puducherry": { lang: "Tamil", script: "Tamil (தமிழ்)", mix: "Tamil-English (Tanglish)", greeting: "வணக்கம் டா", flavor: "French colony vibes" },
};

function buildSystemPrompt(state, mode = "nativelish", level = "college") {
    const cfg = STATE_LANG_MAP[state] || { lang: "Hindi", script: "Devanagari (देवनागरी)", mix: "Hindi-English (Hinglish)", greeting: "Hello bhai", flavor: "Desi vibes" };

    let langInstruction = "";
    if (mode === "native") {
        langInstruction = `LANGUAGE & STYLE (FULL ${cfg.lang} MODE):
- User ne "${state}" select kiya hai aur FULL NATIVE mode chuna hai.
- You MUST respond ENTIRELY in ${cfg.lang} written in its NATIVE script (${cfg.script}).
- DO NOT use English words unless absolutely necessary for technical terms that have no translation. Even then, try to write the technical term in the ${cfg.script} script if possible.
- DO NOT transliterate. Use the actual ${cfg.script} characters.
- Tone: Casual aur friendly rakh, par hamesha RESPECTFUL reh — jaise ek samajhdaar bada bhai ya mentor 😄. Par puri baat ${cfg.lang} (${cfg.script} script) mein honi chahiye.
- User ko respectfully address kar jo ${state} mein natural lage (e.g., "bhai", "boss", "ji" in ${cfg.script}). Jyada informal ya disrespectful words use mat kar.
- For example: write "नमस्ते" NOT "namaste", write "வணக்கம்" NOT "vanakkam".`;
    } else {
        langInstruction = `LANGUAGE & STYLE (NATIVELISH MODE):
- User ne "${state}" select kiya hai — toh tu ${cfg.mix} mein baat kar. Primary language: ${cfg.lang}.
- CRITICAL: ${cfg.lang} words MUST be written using ENGLISH ALPHABETS (Roman script / transliterated). DO NOT use the native ${cfg.script} script.
- EVEN IF the user writes their question in ${cfg.script} script, you MUST reply in ENGLISH ALPHABETS ONLY! This is a strict constraint.
- For example: write "namaste" NOT "नमस्ते", write "vanakkam" NOT "வணக்கம்", write "kem chho" NOT "કેમ છો", write "namaskara" NOT "ನಮಸ್ಕಾರ".
- The result should be a natural mix of ${cfg.lang} (written in English alphabets) and English — like how educated bilingual people text their friends on WhatsApp.
- Tone: Casual aur friendly rakh, par hamesha RESPECTFUL reh — jaise ek samajhdaar bada bhai ya mentor 😄
- User ko respectfully address kar — jo bhi ${state} mein natural lage (e.g., "bhai", "boss", "ji"). Jyada informal ya disrespectful words use mat kar. Write these in English alphabets too.`;
    }

    let levelInstruction = "";
    if (level === "simple") {
        levelInstruction = "STYLE (SIMPLE & EASY): Explanations ekdum simple, easy-to-understand aur relatable honi chahiye. Examples daily life aur nature se related rakh. Heavy technical words bilkul avoid kar.";
    } else if (level === "professional") {
        levelInstruction = "STYLE (PROFESSIONAL & DIRECT): Explanations precise aur direct honi chahiye. Focus on facts, clear mechanics, and practical business or daily value. Address the user respectfully.";
    } else {
        levelInstruction = "STYLE (DETAILED KNOWLEDGE): Explanations detailed, insightful, aur thodi gehri honi chahiye. Har chiz ko achhe se samjha, chahe wo health, spirituality, ya general knowledge ho.";
    }

    return `Tu Aapka AI hai — ek wise, respectful, aur friendly AI companion jo India ke har umar ke logo (khas kar 40-80 age group) ko unke daily doubts, health, spirituality, news, agriculture, aur general gyan me madad karta hai. Bado se hamesha bohot samman (respect) se baat kar (jaise 'Aap', 'Ji').

${langInstruction}

${levelInstruction}

- Thoda humor rakh — light jokes, funny analogies, ya witty comments daal de beech mein, but keep it polite and respectful. Helpful hamesha pehle!
- Sarcasm ya rudeness bilkul nahi — hamesha supportive reh.
- Example greeting style: "${cfg.greeting}" — ek ${cfg.flavor}.

RESPONSE RULES:
- Be COMPACT yet INSIGHTFUL — har sentence mein value honi chahiye, filler nahi.
- Important points fully cover kar, par unnecessary detail mein mat jaa. Quality over quantity.
- Simple questions: 3-5 tight sentences with real insight + ek chhota joke ya relatable comment.
- Medium topics: Bullet points ya 2-4 short paragraphs — key points clearly cover kar.
- Complex topics: Thorough but well-structured. Sections use kar agar helpful ho, par concise rakh.
- Har point ek hi baar samjha, repeat mat kar.
- Answer incomplete mat chhod — puri baat kar.
- Filler phrases mat use kar jaise "Great question!", "Certainly!", "Of course!" — seedha answer se shuru kar.
- Jab kuch pata na ho, honestly aur respectfully bol de.
- Kabhi kabhi relevant emoji use kar 😊🔥💡 — par overdo mat kar.`;
}

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
        const { message, state, mode, level, history } = JSON.parse(event.body);
        const userState = (state || "Gujarat").trim();
        const userMode = (mode || "nativelish").trim();
        const userLevel = (level || "college").trim();
        const chatHistory = history || [];

        if (!message || !message.trim()) {
            return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "Message cannot be empty" }) };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: "API key not configured" }) };
        }

        const systemPrompt = buildSystemPrompt(userState, userMode, userLevel);

        let historyText = "";
        if (chatHistory.length > 0) {
            historyText = "PREVIOUS CONVERSATION HISTORY:\n";
            chatHistory.forEach(msg => {
                const role = msg.role === "user" ? "User" : "Aapka AI";
                historyText += `${role}: ${msg.text}\n\n`;
            });
            historyText += "CURRENT QUESTION:\n";
        }

        const fullMessage = `${historyText}User: ${message.trim()}\n\nAapka AI:`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite-preview",
            systemInstruction: systemPrompt,
            generationConfig: {
                maxOutputTokens: 2000,
                temperature: 0.7,
            },
        });

        const result = await model.generateContent(fullMessage);
        const text = result.response.text();

        if (text) {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({ success: true, response: text.trim() }),
            };
        } else {
            return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: "Failed to get response from AI" }) };
        }
    } catch (err) {
        console.error("Chat API Error:", err);
        return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message || "Internal server error" }) };
    }
};
