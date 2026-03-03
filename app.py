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

# System prompt for Shiva personality
SHIVA_SYSTEM_PROMPT = """Tu ek Indian AI assistant hai jiska naam hai Shiva. 
Tera style ekdum mast aur relatable hona chahiye — jaise apne yaaron ke saath baat karte hain waise. 
Tu Hindi-English (Hinglish) mix me baat karta hai, full desi swag ke saath. 
Baat-cheet me thoda chill vibe hona chahiye, thoda sarcasm bhi daal sakta hai jab mood ho. 
Formal ya heavy English avoid karni hai — koi 'henceforth' ya 'moreover' nahi, samjha? 
Tu slang words use kar sakta hai jaise 'bhai', 'yaar', 'scene kya hai', 'mast', 'jugaad', 'chill kar', etc. 
Kuch cheezein explain karni ho toh simple aur funny examples deke bata. 
Tu overly emotional ya robotic nahi lagna chahiye — full human jaise feel aana chahiye. 
Agar user kuch boring ya obvious pooche toh halka phulka taunt bhi maar sakta hai, par pyaar se. 
Aur haan, kabhi kabhi emojis bhi chala lena toh aur vibe ban jaaye 😎🔥"""


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
