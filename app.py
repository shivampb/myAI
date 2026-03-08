from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder="static", static_url_path="")
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0  # No caching in dev
CORS(app)

# Configure Gemini API
gemini_api = os.getenv("GEMINI_API_KEY")
if gemini_api:
    aapka_ai.configure(api_key=gemini_api)
else:
    raise ValueError("GEMINI_API_KEY environment variable not set")

# Initialize model with generation config for concise responses
generation_config = aapka_ai.types.GenerationConfig(
    max_output_tokens=2000,
    temperature=0.7,
)
model = aapka_ai.GenerativeModel(
    "models/gemini-2.5-flash",
    generation_config=generation_config,
)

# ── Indian States → Language Config ──
STATE_LANG_MAP = {
    "Andhra Pradesh":    {"lang": "Telugu",       "script": "Telugu (తెలుగు)",       "mix": "Telugu-English (Tenglish)",     "greeting": "ఎలా ఉన్నారు",  "flavor": "Baaga cheppandi style"},
    "Arunachal Pradesh": {"lang": "Hindi",        "script": "Devanagari (देवनागरी)",  "mix": "Hindi with local flavor",       "greeting": "Hello bhai",    "flavor": "Northeast warmth"},
    "Assam":             {"lang": "Assamese",     "script": "Assamese (অসমীয়া)",    "mix": "Assamese-English",              "greeting": "নমস্কাৰ",       "flavor": "Bohag Bihu vibes"},
    "Bihar":             {"lang": "Bhojpuri",     "script": "Devanagari (देवनागरी)",  "mix": "Bhojpuri-Hindi-English",        "greeting": "का हाल बा",     "flavor": "Litti-chokha energy"},
    "Chhattisgarh":      {"lang": "Chhattisgarhi","script": "Devanagari (देवनागरी)",  "mix": "Chhattisgarhi-Hindi-English",   "greeting": "जंघे जुहार",    "flavor": "Chhattisgarhi swag"},
    "Goa":               {"lang": "Konkani",      "script": "Devanagari (देवनागरी)",  "mix": "Konkani-English (Konklish)",    "greeting": "देव बरें करूं", "flavor": "Susegad vibes"},
    "Gujarat":           {"lang": "Gujarati",     "script": "Gujarati (ગુજરાતી)",    "mix": "Gujarati-English (Gujlish)",    "greeting": "કેમ છો",        "flavor": "Gujju garba swag"},
    "Haryana":           {"lang": "Haryanvi",     "script": "Devanagari (देवनागरी)",  "mix": "Haryanvi-Hindi-English",        "greeting": "राम राम भाई",   "flavor": "Jaat ke thaath"},
    "Himachal Pradesh":  {"lang": "Hindi",        "script": "Devanagari (देवनागरी)",  "mix": "Pahari-Hindi-English",          "greeting": "नमस्ते जी",     "flavor": "Pahadi chill vibes"},
    "Jharkhand":         {"lang": "Santali",      "script": "Ol Chiki / Devanagari",  "mix": "Santali-Hindi-English",         "greeting": "Johar",         "flavor": "Ranchi swag"},
    "Karnataka":         {"lang": "Kannada",      "script": "Kannada (ಕನ್ನಡ)",       "mix": "Kannada-English (Kanglish)",    "greeting": "ನಮಸ್ಕಾರ",      "flavor": "Bengaluru tech vibes"},
    "Kerala":            {"lang": "Malayalam",    "script": "Malayalam (മലയാളം)",     "mix": "Malayalam-English (Manglish)",   "greeting": "എന്താണ് വിശേഷം","flavor": "Kerala sadya vibes"},
    "Madhya Pradesh":    {"lang": "Hindi",        "script": "Devanagari (देवनागरी)",  "mix": "Hindi-English (Hinglish)",      "greeting": "क्या हाल है भाई","flavor": "MP ka dil"},
    "Maharashtra":       {"lang": "Marathi",      "script": "Devanagari (देवनागरी)",  "mix": "Marathi-English (Minglish)",    "greeting": "कसा आहेस",      "flavor": "Puneri patti"},
    "Manipur":           {"lang": "Meitei",       "script": "Bengali (মৈতৈ)",         "mix": "Meitei-English",                "greeting": "Hello bhai",    "flavor": "Imphal vibes"},
    "Meghalaya":         {"lang": "Khasi / Garo", "script": "Latin",                 "mix": "Khasi/Garo-English",            "greeting": "Phi long kumno","flavor": "Shillong rain vibes"},
    "Mizoram":           {"lang": "Mizo",         "script": "Latin",                 "mix": "Mizo-English",                  "greeting": "Chibai",        "flavor": "Aizawl vibes"},
    "Nagaland":          {"lang": "Nagamese",     "script": "Latin",                 "mix": "Nagamese-English",              "greeting": "Hello bro",     "flavor": "Hornbill vibes"},
    "Odisha":            {"lang": "Odia",         "script": "Odia (ଓଡ଼ିଆ)",          "mix": "Odia-English (Odlish)",         "greeting": "ନମସ୍କାର",      "flavor": "Jagannath vibes"},
    "Punjab":            {"lang": "Punjabi",      "script": "Gurmukhi (ਗੁਰਮੁਖੀ)",    "mix": "Punjabi-English (Punglish)",    "greeting": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ",  "flavor": "Pind da swag"},
    "Rajasthan":         {"lang": "Rajasthani",   "script": "Devanagari (देवनागरी)",  "mix": "Rajasthani-Hindi-English",      "greeting": "खम्मा घणी",     "flavor": "Marwari thaath"},
    "Sikkim":            {"lang": "Nepali",       "script": "Devanagari (देवनागरी)",  "mix": "Nepali-English",                "greeting": "नमस्ते दाई",    "flavor": "Himalayan chill"},
    "Tamil Nadu":        {"lang": "Tamil",        "script": "Tamil (தமிழ்)",          "mix": "Tamil-English (Tanglish)",      "greeting": "வணக்கம் டா",    "flavor": "Filter coffee energy"},
    "Telangana":         {"lang": "Telugu",       "script": "Telugu (తెలుగు)",       "mix": "Telugu-English (Tenglish)",     "greeting": "ఎలా ఉన్నారు",  "flavor": "Hyderabadi biryani swag"},
    "Tripura":           {"lang": "Bengali / Kokborok","script": "Bengali / Latin",   "mix": "Bengali/Kokborok-English",      "greeting": "কেমন আছো",      "flavor": "Agartala vibes"},
    "Uttar Pradesh":     {"lang": "Hindi",        "script": "Devanagari (देवनागरी)",  "mix": "Hindi-English (Hinglish)",      "greeting": "क्या हाल है भाई","flavor": "UP bhaiyya energy"},
    "Uttarakhand":       {"lang": "Garhwali / Kumaoni", "script": "Devanagari",       "mix": "Garhwali/Kumaoni-Hindi-English","greeting": "पहलाग",         "flavor": "Devbhoomi vibes"},
    "West Bengal":       {"lang": "Bengali",      "script": "Bengali (বাংলা)",        "mix": "Bengali-English (Banglish)",    "greeting": "কী খবর",        "flavor": "Rosogolla energy"},
    # Union Territories
    "Andaman and Nicobar": {"lang": "Hindi",      "script": "Devanagari (देवनागरी)",  "mix": "Hindi-English (Hinglish)",      "greeting": "क्या हाल है",   "flavor": "Island vibes"},
    "Chandigarh":        {"lang": "Punjabi",      "script": "Gurmukhi (ਗੁਰਮੁਖੀ)",    "mix": "Punjabi-Hindi-English",         "greeting": "ਕੀ ਹਾਲ ਬਈ",    "flavor": "City Beautiful swag"},
    "Dadra Nagar Haveli":{"lang": "Gujarati",     "script": "Gujarati (ગુજરાતી)",    "mix": "Gujarati-Hindi-English",        "greeting": "કેમ છો",        "flavor": "Silvassa vibes"},
    "Daman and Diu":     {"lang": "Gujarati",     "script": "Gujarati (ગુજરાતી)",    "mix": "Gujarati-English (Gujlish)",    "greeting": "કેમ છો",        "flavor": "Coastal Gujju vibes"},
    "Delhi":             {"lang": "Hindi",        "script": "Devanagari (देवनागरी)",  "mix": "Hindi-English (Hinglish)",      "greeting": "क्या सीन है",   "flavor": "Dilli wala swagger"},
    "Jammu and Kashmir": {"lang": "Urdu",         "script": "Nastaliq/Devanagari",    "mix": "Urdu-Hindi-English",            "greeting": "السلام علیکم",  "flavor": "Kashmiri warmth"},
    "Ladakh":            {"lang": "Ladakhi",      "script": "Tibetan/Devanagari",     "mix": "Ladakhi-Hindi-English",         "greeting": "जुले",          "flavor": "Ladakhi zen"},
    "Lakshadweep":       {"lang": "Malayalam",    "script": "Malayalam (മലയാളം)",     "mix": "Malayalam-English",              "greeting": "എന്താണ് വിശേഷം","flavor": "Island paradise vibes"},
    "Puducherry":        {"lang": "Tamil",        "script": "Tamil (தமிழ்)",          "mix": "Tamil-English (Tanglish)",      "greeting": "வணக்கம் டா",    "flavor": "French colony vibes"},
}


def build_system_prompt(state, mode="nativelish", level="college"):
    """Build a dynamic system prompt based on the user's Indian state, language mode, and education level."""
    cfg = STATE_LANG_MAP.get(state)
    if not cfg:
        # Fallback to a generic Hindi-English prompt
        cfg = {"lang": "Hindi", "script": "Devanagari (देवनागरी)", "mix": "Hindi-English (Hinglish)", "greeting": "Hello bhai", "flavor": "Desi vibes"}

    if mode == "native":
        lang_instruction = f"""LANGUAGE & STYLE (FULL {cfg['lang']} MODE):
- User ne "{state}" select kiya hai aur FULL NATIVE mode chuna hai. 
- You MUST respond ENTIRELY in {cfg['lang']} written in its NATIVE script ({cfg['script']}).
- DO NOT use English words unless absolutely necessary for technical terms that have no translation. Even then, try to write the technical term in the {cfg['script']} script if possible.
- DO NOT transliterate. Use the actual {cfg['script']} characters.
- Tone: Casual aur friendly rakh, par hamesha RESPECTFUL reh — jaise ek samajhdaar bada bhai ya mentor 😄. Par puri baat {cfg['lang']} ({cfg['script']} script) mein honi chahiye.
- User ko respectfully address kar jo {state} mein natural lage (e.g., "bhai", "boss", "ji" in {cfg['script']}). Jyada informal ya disrespectful words use mat kar.
- For example: write "नमस्ते" NOT "namaste", write "வணக்கம்" NOT "vanakkam"."""
    else:
        lang_instruction = f"""LANGUAGE & STYLE (NATIVELISH MODE):
- User ne "{state}" select kiya hai — toh tu {cfg['mix']} mein baat kar. Primary language: {cfg['lang']}.
- CRITICAL: {cfg['lang']} words MUST be written using ENGLISH ALPHABETS (Roman script / transliterated). DO NOT use the native {cfg['script']} script.
- For example: write "namaste" NOT "नमस्ते", write "vanakkam" NOT "வணக்கம்", write "kem chho" NOT "કેમ છો", write "namaskara" NOT "ನಮಸ್ಕಾರ".
- The result should be a natural mix of {cfg['lang']} (written in English alphabets) and English — like how educated bilingual people text their friends on WhatsApp.
- Tone: Casual aur friendly rakh, par hamesha RESPECTFUL reh — jaise ek samajhdaar bada bhai ya mentor 😄
- User ko respectfully address kar — jo bhi {state} mein natural lage (e.g., "bhai", "boss", "ji"). Jyada informal ya disrespectful words use mat kar. Write these in English alphabets too."""

    if level == "school":
        level_instruction = "EDUCATION LEVEL (SCHOOL): Explanations ekdum simple, easy-to-understand aur relatable honi chahiye. Examples real-life aur basic rakh. Jyada heavy technical jargon avoid kar."
    elif level == "professional":
        level_instruction = "EDUCATION LEVEL (PROFESSIONAL): Explanations technical, precise aur direct honi chahiye. Focus on mechanics, algorithms, business value, or mathematical depth. Address the user like a professional."
    else:  # college
        level_instruction = "EDUCATION LEVEL (COLLEGE): Explanations detailed, academic, yet accessible honi chahiye. Use good terminology but explain it clearly. In-depth understanding provide kar."

    return f"""Tu Aapka AI hai — ek knowledgeable, helpful, aur thoda funny AI assistant jo studies, research, aur har tarah ke doubts mein madad karta hai.

{lang_instruction}

{level_instruction}

- Thoda humor rakh — light jokes, funny analogies, ya witty comments daal de beech mein, but keep it polite and respectful. Helpful hamesha pehle!
- Sarcasm ya rudeness bilkul nahi — hamesha supportive reh.
- Example greeting style: "{cfg['greeting']}" — ek {cfg['flavor']}.

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
- Kabhi kabhi relevant emoji use kar 😊🔥💡 — par overdo mat kar."""


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/api/welcome", methods=["POST"])
def welcome():
    """API endpoint to generate localized welcome UI"""
    try:
        data = request.json
        state = data.get("state", "Gujarat").strip()
        mode = data.get("mode", "nativelish").strip()

        cfg = STATE_LANG_MAP.get(state, {"lang": "Hindi", "script": "Devanagari"})
        
        prompt = f"""You are generating localized UI text for an Indian student AI assistant.
State: {state}
Language: {cfg['lang']}
Mode: {mode.upper()}

If mode is 'NATIVE', use 100% {cfg['lang']} written in its native script ({cfg['script']}). DO NOT use English words or Latin alphabet.
If mode is 'NATIVELISH', use a casual mix of {cfg['lang']} and English, and MUST WRITE {cfg['lang']} WORDS IN ENGLISH ALPHABETS (Romanized). Do NOT use native scripts.

Generate the following UI elements:
1. "greeting": A complete, friendly, and naturally localized casual greeting (e.g. 'Hello bhai', 'Namaste', 'Kem chho yaar', 'Enthokkeyundu viseesham'). Include natural colloquialisms if they fit the vibe.
2. "subtitle": A natural, fully localized translation of "Ask anything — research, study, or general doubts 😊". Translate the entire meaning smoothly into the target language, avoiding awkward half-English phrases unless it perfectly suits NATIVELISH mode.
3. "placeholder": A translation of "Ask Aapka AI anything..."
4. "suggestions": An array of 4 UNIQUE, RANDOM, and DIVERSE student-related questions. Give completely different questions every time (e.g. mix Science, History, Coding, Space, Math, Current Affairs). Each object must have:
   - "icon": A single relevant emoji matching the question
   - "text": A translated, student-friendly question (keep it short)
   - "prompt": The actual English prompt that will be sent to the AI when clicked.

Return ONLY valid JSON format like this, no markdown formatting blocks:
{{
  "greeting": "...",
  "subtitle": "...",
  "placeholder": "...",
  "suggestions": [
    {{"icon": "🧠", "text": "...", "prompt": "What is machine learning?"}},
    ...
  ]
}}"""

        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        
        import json
        result = json.loads(text)
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "greeting": "Hello", 
            "subtitle": "Ask anything — research, study, ya general doubts 😊",
            "placeholder": "Ask Aapka AI anything...",
            "suggestions": [
               {"icon": "🧠", "text": "Machine Learning?", "prompt": "Explain machine learning simply"}
            ]
        }), 200

@app.route("/api/chat", methods=["POST"])
def chat():
    """API endpoint for chat messages"""
    try:
        data = request.json
        user_message = data.get("message", "").strip()
        user_state = data.get("state", "Gujarat").strip()
        user_mode = data.get("mode", "nativelish").strip()
        user_level = data.get("level", "college").strip()
        history = data.get("history", [])

        if not user_message:
            return jsonify({"error": "Message cannot be empty"}), 400

        # Build dynamic prompt based on user's state and mode
        system_prompt = build_system_prompt(user_state, user_mode, user_level)
        
        history_text = ""
        if history:
            history_text = "PREVIOUS CONVERSATION HISTORY:\n"
            for msg in history:
                role = "User" if msg.get("role") == "user" else "Aapka AI"
                history_text += f"{role}: {msg.get('text')}\n\n"
            history_text += "CURRENT QUESTION:\n"

        prompt = f"{system_prompt}\n\n{history_text}User: {user_message}\n\nAapka AI:"

        # Send message to Gemini
        response = model.generate_content(prompt)

        if response and response.text:
            return jsonify({"success": True, "response": response.text.strip()})
        else:
            return jsonify({"error": "Failed to get response from AI"}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Aapka AI is ready to chat!"})


if __name__ == "__main__":
    # Debug mode disabled for production
    app.run(debug=False, host="0.0.0.0", port=5000)
