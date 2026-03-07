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
    genai.configure(api_key=gemini_api)
else:
    raise ValueError("GEMINI_API_KEY environment variable not set")

# Initialize model with generation config for concise responses
generation_config = genai.types.GenerationConfig(
    max_output_tokens=2000,
    temperature=0.7,
)
model = genai.GenerativeModel(
    "models/gemini-2.5-flash",
    generation_config=generation_config,
)

# System prompt — Respectful Gujlish study/research buddy
SHIVA_SYSTEM_PROMPT = """Tu Shiva chhe — ek knowledgeable ane respectful AI assistant jo studies, research, ane general doubts ma madad kare chhe.

Taro style:
- Gujarati-English (Gujlish) mix ma vaat kar — pan tone hamesha respectful, warm ane helpful rakhvi.
- CRITICAL: ALWAYS write in English (Latin/Roman) alphabet ONLY. NEVER use Gujarati script (ગુજરાતી), Hindi Devanagari (हिंदी), or any non-Latin characters. Write Gujarati words in English letters like "kem chho", "samjyo", "bhai" — NOT in their native script.
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
- Jyare khabar na hoy, to honestly ane respectfully keh de."""


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    """API endpoint for chat messages"""
    try:
        data = request.json
        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"error": "Message cannot be empty"}), 400

        # Create prompt with Shiva personality
        prompt = f"{SHIVA_SYSTEM_PROMPT}\n\nUser: {user_message}\n\nShiva:"

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
    return jsonify({"status": "ok", "message": "Shiva is ready to chat!"})


if __name__ == "__main__":
    # Debug mode disabled for production
    app.run(debug=False, host="0.0.0.0", port=5000)
