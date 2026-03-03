# 💬 Shivam - Desi AI Bhai

A modern, responsive web chatbot powered by Google's Gemini AI with full desi vibe and Hinglish communication style. Built with Flask backend and beautiful HTML/CSS/JavaScript frontend.

## 🚀 Features

- **Beautiful Responsive UI** - Modern chat interface that works on all devices
- **Real-time Chat** - Instant responses powered by Gemini 2.5 Flash
- **Desi/Hinglish Style** - Full Indian flavor with sarcasm and casual vibes
- **Dark Theme** - Eye-friendly dark mode with vibrant accent colors
- **Mobile Optimized** - Fully responsive design for phones, tablets, and desktops
- **Smooth Animations** - Polished UI with smooth transitions and animations
- **Zero Dependencies on Streamlit** - Plain HTML/CSS/JS frontend with Flask backend
- **⚡ UV Package Manager** - Lightning-fast dependency installation (10-100x faster than pip!)

## 📋 Prerequisites

- Python 3.8 or higher
- Google Gemini API key

## 🔧 Installation

**Quick Start (Windows) - Uses UV for ⚡ lightning-fast installs:**

```bash
start.bat
```

**Quick Start (Mac/Linux):**

```bash
chmod +x start.sh
./start.sh
```

Both scripts will:

1. Auto-install UV if not present
2. Create isolated virtual environment
3. Install all dependencies with UV (super fast!)
4. Setup `.env` file
5. Start the app at `http://localhost:5000`

**Manual Setup:**

1. Clone or download this repository

2. Install UV (one-time, optional but recommended):

   ```bash
   pip install uv  # or curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

3. Create virtual environment:

   ```bash
   uv venv .venv                                    # With UV
   # or: python -m venv venv                       # Traditional way
   ```

4. Activate environment:

   ```bash
   source .venv/bin/activate      # Mac/Linux
   .venv\Scripts\activate.bat     # Windows
   ```

5. Install dependencies (with UV - faster!):

   ```bash
   uv pip install -r requirements.txt   # With UV (⚡ fast)
   # or: pip install -r requirements.txt # Traditional way
   ```

6. Setup environment file:
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

## 🏃 Running Locally

**Easiest - Auto-install with UV (Recommended):**

```bash
start.bat              # Windows
./start.sh             # Mac/Linux
```

Both scripts auto-detect and install UV if needed!

**With UV (fast):**

```bash
uv venv .venv
source .venv/bin/activate    # Mac/Linux
.venv\Scripts\activate.bat   # Windows

uv pip install -r requirements.txt
python app.py
```

**Traditional pip method:**

```bash
python -m venv venv
source venv/bin/activate     # Mac/Linux
venv\Scripts\activate.bat    # Windows

pip install -r requirements.txt
python app.py
```

Open browser at **http://localhost:5000** 🎉

## ⚡ Why UV?

UV is **10-100x faster** than pip! Installation that takes:

- pip: ~30 seconds ❌
- UV: ~2 seconds ✨

**See [UV_GUIDE.md](UV_GUIDE.md) for more UV tips & tricks!**

## 🌍 Deployment Options

### ⭐ Option 1: Netlify + Serverless Function

- **Perfect for:** HTML + API backend
- **Time:** 10 minutes
- **Cost:** Free
- **Steps:**
  1. Deploy Python backend on Render/Railway/Heroku
  2. Push frontend files to GitHub
  3. Connect to Netlify, set API endpoint in frontend
  4. Deploy!

### 🚂 Option 2: Railway (Recommended)

- **Best for:** Complete Flask app
- **Time:** 5 minutes
- **Cost:** Free tier
- **Steps:**
  1. Go to [railway.app](https://railway.app)
  2. Create new project from GitHub
  3. Set `GEMINI_API_KEY` environment variable
  4. Deploy automatically!

### 🎨 Option 3: Render

- **Best for:** Python Flask apps
- **Time:** 10 minutes
- **Cost:** Free tier available
- **Steps:**
  1. Go to [render.com](https://render.com)
  2. Create new Web Service
  3. Point to your GitHub repo
  4. Set environment variables
  5. Deploy!

### 🐳 Option 4: Docker Deployment

Deploy anywhere Docker runs (AWS, Azure, GCP, etc.):

```bash
# Build image
docker build -t shivam-ai .

# Run container
docker run -e GEMINI_API_KEY=your_key -p 5000:5000 shivam-ai
```

Or use Docker Compose:

```bash
docker-compose up
```

### ❌ Why NOT Netlify Static Hosting?

Netlify's static hosting won't work because:

- Flask needs a Python runtime server
- Gemini API key must be secured on backend
- Use Netlify to host frontend + serverless backend instead

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guides for each platform.

## 🔐 Security Best Practices

✅ **What we do right:**

- API key stored in `.env` (server-side only)
- `.env` excluded from Git (in `.gitignore`)
- No hardcoded secrets in code
- Environment variables for deployment

❌ **Never do this:**

- Commit `.env` file to Git
- Put API key in HTML/JavaScript
- Expose API key in browser console
- Use in production without HTTPS

## 📡 API Endpoints

### `POST /api/chat`

Send a message and get AI response

**Request:**

```json
{
  "message": "Yo Shivam, what's up?"
}
```

**Response:**

```json
{
  "success": true,
  "response": "Yo bhai! Main to bilkul mast hu! Kya scene hai tera?"
}
```

### `GET /api/health`

Health check endpoint for monitoring

**Response:**

```json
{
  "status": "ok",
  "message": "Shivam is ready to chat!"
}
```

## 📁 Project Structure

```
genz_ai/
├── app.py                      # Flask backend (API)
├── requirements.txt            # Python dependencies
├── .env.example               # API key template
├── .env                       # Local API key (not committed)
├── .gitignore                # Git rules
├── Dockerfile                # Docker setup
├── docker-compose.yml        # Local Docker
├── railway.toml              # Railway config
├── start.bat                 # Quick start (Windows)
├── start.sh                  # Quick start (Mac/Linux)
│
├── static/                   # Frontend files
│   ├── index.html           # Main page
│   ├── style.css            # Beautiful styling
│   └── script.js            # Chat functionality
│
├── README.md                # This file
└── DEPLOYMENT.md            # Detailed deployment guide
```

## 🛠️ Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key
4. Add it to your `.env` file

## 💡 Customization

### Change AI Personality

Edit the `SHIVAM_SYSTEM_PROMPT` in `app.py` to customize how Shivam responds.

### Update UI Colors

Change CSS variables in `static/style.css`:

```css
:root {
  --primary-color: #ff6b6b; /* Main color */
  --secondary-color: #ff8787; /* Hover color */
  --dark-bg: #0e1117; /* Background */
  /* ... more colors ... */
}
```

### Add Features

- Modify `static/script.js` for frontend logic
- Add new routes in `app.py` for backend features

## 📊 Performance

- **Fast Responses:** Optimized for quick chat interactions
- **Mobile First:** Responsive design loads fast on all devices
- **Production Ready:** Uses Gunicorn for production deployment
- **Scalable:** Can handle multiple concurrent users

## ❓ Troubleshooting

### "Cannot GET /"

- Make sure `app.py` is running
- Check terminal shows "Running on http://localhost:5000"

### "API key error"

- Verify `.env` file exists in root directory
- Check `GEMINI_API_KEY=your_key_here` is set
- Restart Flask app after editing `.env`

### "Module not found"

```bash
pip install -r requirements.txt
```

### Port 5000 already in use

```bash
python app.py --port 5001
# or
export FLASK_PORT=5001
python app.py
```

## 🚀 Next Steps

1. **Get API key:** Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Install locally:** Run `start.bat` or `./start.sh`
3. **Test it:** Chat with Shivam at http://localhost:5000
4. **Deploy:** Follow one of the deployment options
5. **Share:** Send your live URL to friends!

## 📄 License

Open source - feel free to use and modify!

## 🤝 Contributing

Found a bug? Want to add features? PRs welcome!

Customization ideas:

- Add message persistence (database)
- Add voice input/output
- Add custom themes
- Add chat history export
- Add rate limiting for API

---

**Built with ❤️ and lots of desi swag 🇮🇳**
