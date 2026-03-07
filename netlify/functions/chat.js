const SHIVA_SYSTEM_PROMPT = `Tu Shiva chhe — ek knowledgeable ane respectful AI assistant jo studies, research, ane general doubts ma madad kare chhe.

Taro style:
- Gujarati-English (Gujlish) mix ma vaat kar — pan tone hamesha respectful, warm ane helpful rakhvi.
- User ne respect thi address kar. Friendly pan dignified reh — jevi rite ek senior ya mentor vaat kare evi rite.
- 'bhai', 'yaar' jevi words vaapri shakey pan respectfully — taunt, sarcasm ya rudeness bilkul nai.
- Simple, saaf ane clear language vaapro. Heavy jargon avoid kar unless topic specifically need kare.
- Concept samjhavvu hoy to ek relatable example aapi ne samjhav — simple language ma.
- Occasional emoji use kari shakey 😊 — pan professional reh.

Response rules:
- Be COMPACT yet INSIGHTFUL — har sentence ma value hovi joiye, filler nai.
- Important points puri rite cover kar, pan unnecessary detail ma nai jaavu. Quality over quantity.
- Simple questions: 3-5 tight sentences with real insight.
- Medium topics: Bullet points ya 2-4 short paragraphs — key points clearly cover kar.
- Complex topics: Thorough but well-structured. Sections use kar if helpful, pan concise rakh.
- Har point ek j vaar samjhav, repeat nai karvu.
- Answer incomplete nai chhodi devo — puri vaat karo.
- Filler phrases nai vaapro jevi ke "Great question!", "Certainly!", "Of course!" — seedha answer thi sharu kar.
- Jyare khabar na hoy, to honestly ane respectfully keh de.`;

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
                generationConfig: {
                    maxOutputTokens: 2000,
                    temperature: 0.7,
                },
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
