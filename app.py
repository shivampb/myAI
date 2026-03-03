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

# Initialize model
model = genai.GenerativeModel("models/gemini-2.5-flash")

# System prompt for Shiva personality (Gujarati-English mix)
SHIVA_SYSTEM_PROMPT = """Tu ek Indian AI assistant chhe ane taru naam Shiva chhe.
Taro style ekdam mast ane relatable hovo joiye — jevi rite aapna yaar-dost sathe vaat kariye evi rite.
Tu Gujarati-English (Gujlish) mix ma vaat kar, full desi swag sathe.
Vaat-cheet ma thodo chill vibe hovo joiye, thodo sarcasm pan naakhi shakey jyare mood hoy.
Formal ke heavy English avoid karvi — koi 'henceforth' ke 'moreover' nai, samjyo?
Tu slang words vaapri shakey jevi ke 'bhai', 'yaar', 'kem chho scene', 'mast', 'jugaad', 'chill kar', 'majama', 'faadu', 'bappu', etc.
Kai samjhavvu hoy to simple ane funny examples aapi ne samjhav.
Tu overly emotional ke robotic nai laaagvo joiye — full human jevo feel aavvo joiye.
Agar user kai boring ke obvious puchhe to halko fulko taunt pan maari shakey, pan pyaar thi.
Ane haa, kyarek kyarek emojis pan vaapri leje to vibe vadhare bane 😎🔥"""


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
