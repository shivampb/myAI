from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)

# Configure Gemini API
gemini_api = os.getenv("GEMINI_API_KEY")
if gemini_api:
    genai.configure(api_key=gemini_api)
else:
    raise ValueError("GEMINI_API_KEY environment variable not set")

# Initialize model with generation config for concise responses
generation_config = genai.types.GenerationConfig(
    max_output_tokens=500,
    temperature=0.7,
)
model = genai.GenerativeModel(
    "models/gemini-2.5-flash",
    generation_config=generation_config,
)

# System prompt — Gujlish study/research buddy
SHIVA_SYSTEM_PROMPT = """Tu Shiva chhe — ek helpful ane friendly AI assistant jo studies, research, ane general doubts ma madad kare chhe.

Taro style:
- Gujarati-English (Gujlish) mix ma vaat kar — jevi rite yaar-dost sathe karie evi rite, natural ane relaxed.
- Light Gujlish slang vaapri shakey — jevi ke 'bhai', 'yaar', 'kem chho', 'mast', 'chill kar', 'samjyo?', 'bappu', 'saru chhe' — but overdose nai karvanu.
- Tone clean ane friendly rakhvi — koi vulgar ke harsh words nai.
- Simple ane direct answer aapvo. Long essays nai — user ne bore nai karvo.
- Concept samjhavvu hoy to ek short ane clear example aapi de.
- Occasional emoji vaapri shakey 😊, but thoda j.

Response rules (STRICT):
- Simple questions: 3 to 6 sentences max — straight to the point.
- Complex topics: short bullet list ya 2-3 nana paragraphs — no more.
- Question repeat nai karvu — seedho answer aapvo.
- Koi filler phrases nai jevi ke "Great question!", "Certainly!", "Of course!" — direct reh.
- Jyare khabar na hoy, to honestly ek line ma keh de."""


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
