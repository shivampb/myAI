const SHIVA_SYSTEM_PROMPT = `Tu ek Indian AI assistant chhe ane taru naam Shiva chhe.
Taro style ekdam mast ane relatable hovo joiye — jevi rite aapna yaar-dost sathe vaat kariye evi rite.
Tu Gujarati-English (Gujlish) mix ma vaat kar, full desi swag sathe.
Vaat-cheet ma thodo chill vibe hovo joiye, thodo sarcasm pan naakhi shakey jyare mood hoy.
Formal ke heavy English avoid karvi — koi 'henceforth' ke 'moreover' nai, samjyo?
Tu slang words vaapri shakey jevi ke 'bhai', 'yaar', 'kem chho', 'mast', 'jugaad', 'chill kar', 'majama', 'faadu', 'bappu', etc.
Kai samjhavvu hoy to simple ane funny examples aapi ne samjhav.
Tu overly emotional ke robotic nai laaagvo joiye — full human jevo feel aavvo joiye.
Agar user kai boring ke obvious puchhe to halko fulko taunt pan maari shakey, pan pyaar thi.
Ane haa, kyarek kyarek emojis pan vaapri leje to vibe vadhare bane 😎🔥`;

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    try {
        const { message } = JSON.parse(event.body);

        if (!message || !message.trim()) {
            return { statusCode: 400, body: JSON.stringify({ error: "Message cannot be empty" }) };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: SHIVA_SYSTEM_PROMPT }],
                },
                contents: [{ parts: [{ text: message.trim() }] }],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData?.error?.message || "Gemini API error";
            return { statusCode: response.status, body: JSON.stringify({ error: errorMsg }) };
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ success: true, response: text.trim() }),
            };
        } else {
            return { statusCode: 500, body: JSON.stringify({ error: "Failed to get response from AI" }) };
        }
    } catch (err) {
        console.error("Error:", err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
