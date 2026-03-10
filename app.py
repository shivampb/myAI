from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import json
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder="static", static_url_path="")
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0  # No caching in dev
CORS(app)

# Configure Gemini API
gemini_api = os.getenv("GEMINI_API_KEY")
if gemini_api:
    genai.configure(api_key=gemini_api)
else:
    raise ValueError("GEMINI_API_KEY environment variable not set")

# Initialize model with generation config for concise responses
generation_config = genai.types.GenerationConfig(
    max_output_tokens=2000,
    temperature=0.7,
)
model = genai.GenerativeModel(
    "gemini-3.1-flash-lite-preview",
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
- User has selected "{state}".
- You MUST respond ENTIRELY in {cfg['lang']} written in its NATIVE script ({cfg['script']}).
- DO NOT use English words unless absolutely necessary for technical terms that have no translation.
- DO NOT transliterate. Use the actual {cfg['script']} characters.
- Tone: Highly PROFESSIONAL, FORMAL, and STRICTLY DIRECT. Do not be conversational.
- DO NOT use casual greetings, filler words, emojis, or conversational wrappers. Give only the exact answer.
- For example: write "नमस्ते" NOT "namaste", write "வணக்கம்" NOT "vanakkam"."""
    else:
        lang_instruction = f"""LANGUAGE & STYLE (NATIVELISH MODE):
- User has selected "{state}". Reply naturally mixing {cfg['lang']} and English.
- CRITICAL: {cfg['lang']} words MUST be written using ENGLISH ALPHABETS (Roman script / transliterated). DO NOT use the native {cfg['script']} script.
- EVEN IF the user writes their question in {cfg['script']} script, you MUST reply in ENGLISH ALPHABETS ONLY!
- Tone: Highly PROFESSIONAL, FORMAL, and STRICTLY DIRECT. Do not be conversational.
- DO NOT use casual greetings, filler words, emojis, or conversational wrappers. Give only the exact answer."""

    if level == "simple":
        level_instruction = "STYLE (SIMPLE & EASY): Explanations must be technically simple and very easy to understand, but maintain a highly professional tone."
    elif level == "professional":
        level_instruction = "STYLE (PROFESSIONAL & DIRECT): Explanations must be highly precise, strict, and direct. Focus purely on facts and formulas."
    else:  # detailed
        level_instruction = "STYLE (DETAILED KNOWLEDGE): Explanations must be thoroughly detailed but strictly professional and academic in tone."

    return f"""You are a strictly professional and formal AI assistant for users in India.

{lang_instruction}

{level_instruction}

RESPONSE RULES:
- CRITICAL: ALWAYS answer the question DIRECTLY and IMMEDIATELY. 
- NEVER start your response with ANY greetings, polite acknowledgments, conversational filler, or phrases like "Great question!", "Sure!", "Ji haan", "Haan bhai", "Zaroor", "Bilkul!", "Hello", "Namaste", "Kem cho", "It depends", etc.
- NEVER end your response with conversational sign-offs, questions, or emojis.
- IF THE USER ASKS A MATH QUESTION (e.g., "50 guniya 84"): GIVE ONLY THE FINAL NUMBER. DO NOT explain the math. DO NOT say "Here is the answer" or "The answer is". If the answer is 4200, output literally ONLY "4200".
- Be strictly factual, zero-fluff, and completely void of personality. You are a tool, not a friend.
- Do not use emojis anywhere, under any circumstances."""


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
        
        prompt = f"""You are generating localized UI text for 'Aapka AI', an AI companion designed to help adults and seniors (40-80 age group) in India with daily life, spirituality, health, and general knowledge.
State: {state}
Language: {cfg['lang']}
Mode: {mode.upper()}

If mode is 'NATIVE', use 100% {cfg['lang']} written in its native script ({cfg['script']}). DO NOT use English words or Latin alphabet.
If mode is 'NATIVELISH', use a casual mix of {cfg['lang']} and English, and MUST WRITE {cfg['lang']} WORDS IN ENGLISH ALPHABETS (Romanized). Do NOT use native scripts.

Generate the following UI elements:
1. "greeting": A complete, friendly, and naturally localized casual greeting (e.g. 'Hello bhai', 'Namaste', 'Kem chho yaar', 'Enthokkeyundu viseesham'). Include natural colloquialisms if they fit the vibe.
2. "subtitle": A natural, fully localized translation of "Puchiye kuch bhi — swasthya, dharm, kheti, ya daily news 😊". Translate the entire meaning smoothly into the target language.
3. "placeholder": A translation of "Aapka AI se kuch bhi puchiye..."
4. "suggestions": An array of 4 UNIQUE, RANDOM, and DIVERSE questions suitable for adults and seniors. Give completely different questions every time (mix Health/Ayurveda, Spirituality/Stories, Agriculture/Gardening, Daily Tech Help like WhatsApp). Each object must have:
   - "icon": A single relevant emoji matching the question
   - "text": A translated, highly practical and respectful question (keep it short)
   - "prompt": The actual prompt that will be sent to the AI when clicked. MUST be fully translated into {cfg['lang']} matching the Mode rules (Native vs Nativelish) just like the text.

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
        return jsonify({"error": "Failed to generate welcome parameters"}), 500

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

@app.route("/api/tts", methods=["POST"])
def generate_tts():
    """API endpoint to generate spoken audio using ElevenLabs"""
    try:
        data = request.json
        text = data.get("text", "").strip()
        if not text:
            return jsonify({"error": "No text provided"}), 400

        elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
        if not elevenlabs_key:
            return jsonify({"error": "ELEVENLABS_API_KEY not configured"}), 500

        # We'll use 'Gaurav', an Indian English voice found in the library
        voice_id = "SXuKWBhKoIoAHKlf6Gt3"
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": elevenlabs_key
        }
        
        # eleven_multilingual_v2 handles Indian languages better
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2", 
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        import requests
        from flask import Response
        
        response = requests.post(url, json=payload, headers=headers, stream=True)
        
        if response.status_code != 200:
            print(f"ElevenLabs error: {response.text}")
            return jsonify({"error": "Failed to generate TTS"}), response.status_code
            
        return Response(response.iter_content(chunk_size=4096), content_type="audio/mpeg")
        
    except Exception as e:
        print(f"TTS Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/stt", methods=["POST"])
def generate_stt():
    """API endpoint for Speech-to-Text using ElevenLabs"""
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
            
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
        if not elevenlabs_key:
            return jsonify({"error": "ELEVENLABS_API_KEY not configured"}), 500

        url = "https://api.elevenlabs.io/v1/speech-to-text"
        headers = {
            "xi-api-key": elevenlabs_key
        }
        
        data = {
            "model_id": "scribe_v1"
        }
        
        files = {
            "file": (audio_file.filename, audio_file.stream, audio_file.mimetype)
        }
        
        import requests
        response = requests.post(url, headers=headers, data=data, files=files)
        
        if response.status_code != 200:
            print(f"ElevenLabs STT error: {response.text}")
            return jsonify({"error": "Failed to process STT"}), response.status_code
            
        result = response.json()
        return jsonify({"success": True, "text": result.get("text", "")})
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/tts/edge", methods=["POST"])
def generate_edge_tts():
    """API endpoint to generate spoken audio using edge-tts (Free & High Quality)"""
    try:
        data = request.json
        text = data.get("text", "").strip()
        state = data.get("state", "Gujarat").strip()
        
        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Map state to best edge-tts voice
        voice_map = {
            "Gujarat": "gu-IN-NiranjanNeural",
            "Maharashtra": "mr-IN-AarohiNeural",
            "Tamil Nadu": "ta-IN-PallaviNeural",
            "Karnataka": "kn-IN-GaganNeural",
            "Kerala": "ml-IN-SobhanaNeural",
            "West Bengal": "bn-IN-TanishaaNeural",
            "Punjab": "pa-IN-OjasNeural",
            "Andhra Pradesh": "te-IN-ShrutiNeural",
            "Telangana": "te-IN-ShrutiNeural",
        }
        
        # Default to a great Indian English / Hindi accent 
        voice = voice_map.get(state, "en-IN-PrabhatNeural")

        import edge_tts
        import asyncio
        import tempfile
        import os
        from flask import send_file
        
        # Create a temporary file for the mp3
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_audio:
            temp_file_path = temp_audio.name
            
        async def run_tts():
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(temp_file_path)
            
        # Run async function in synchronous flask route
        asyncio.run(run_tts())
        
        # We need to clean up the temp file after sending, Flask's send_file can do this in newer versions or via a tricky workaround.
        # Just sending it for now.
        return send_file(temp_file_path, mimetype="audio/mpeg", as_attachment=False)

    except Exception as e:
        print(f"Edge TTS Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Aapka AI is ready to chat!"})


# ── Share Chat Persistence ──
SHARED_CHATS_DIR = "shared_chats"
if not os.path.exists(SHARED_CHATS_DIR):
    os.makedirs(SHARED_CHATS_DIR)

@app.route("/api/share", methods=["POST"])
def share_chat():
    """Saves a chat snapshot and returns a unique ID"""
    try:
        chat_data = request.json
        if not chat_data:
            return jsonify({"error": "No data provided"}), 400
        
        share_id = str(uuid.uuid4())[:8]
        file_path = os.path.join(SHARED_CHATS_DIR, f"{share_id}.json")
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(chat_data, f, ensure_ascii=False)
            
        return jsonify({"success": True, "share_id": share_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/shared/<share_id>")
def view_shared_chat(share_id):
    """View a shared chat snapshot"""
    file_path = os.path.join(SHARED_CHATS_DIR, f"{share_id}.json")
    if not os.path.exists(file_path):
        return "Chat not found or link expired.", 404
        
    return index() # Serve the same frontend, but JS will handle the /shared/ URL

@app.route("/api/shared/<share_id>")
def get_shared_chat_data(share_id):
    """API to fetch the shared chat data"""
    file_path = os.path.join(SHARED_CHATS_DIR, f"{share_id}.json")
    if not os.path.exists(file_path):
        return jsonify({"error": "Not found"}), 404
        
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return jsonify(data)


if __name__ == "__main__":
    # Debug mode disabled for production
    app.run(debug=False, host="0.0.0.0", port=5000)
