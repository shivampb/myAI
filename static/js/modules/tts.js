// ── TTS Module ──
import { getSelectedState } from '../states/index.js';

// Set to 'true' to use premium ElevenLabs API, or 'false' for free browser speech synthesis
const USE_ELEVENLABS = false;

// --- Browser SpeechSynthesis Setup --- //
const LANG_MAP = {
    "Gujarat": ["gu-IN", "gu", "hi-IN", "hi", "en-IN"],
    "Maharashtra": ["mr-IN", "mr", "hi-IN", "hi", "en-IN"],
    "Tamil Nadu": ["ta-IN", "ta", "en-IN"],
    "Karnataka": ["kn-IN", "kn", "en-IN"],
    "Kerala": ["ml-IN", "ml", "en-IN"],
    "West Bengal": ["bn-IN", "bn", "hi-IN", "en-IN"],
    "Punjab": ["pa-IN", "pa", "hi-IN", "en-IN"],
    "Telangana": ["te-IN", "te", "hi-IN", "en-IN"],
    "Andhra Pradesh": ["te-IN", "te", "hi-IN", "en-IN"],
};

function getBrowserVoice() {
    const state = getSelectedState();
    const preferredLangs = LANG_MAP[state] || ["hi-IN", "hi", "en-IN"];

    return new Promise(r => {
        const pick = () => {
            const v = window.speechSynthesis.getVoices();
            if (!v.length) return null;
            for (const l of preferredLangs) {
                const m = v.find(x => x.lang === l || x.lang.startsWith(l));
                if (m) return m;
            }
            return null;
        };
        const v = pick();
        if (v !== null || window.speechSynthesis.getVoices().length > 0) r(v);
        else window.speechSynthesis.onvoiceschanged = () => r(pick());
    });
}
// ------------------------------------ //

let currentAudio = null; // Used for ElevenLabs Audio object
let currentUtterance = null; // Used for Browser SpeechSynthesis
let currentBtn = null;

export function attachTts(btn, text) {
    const playIcon = btn.querySelector(".tts-icon-play");
    const stopIcon = btn.querySelector(".tts-icon-stop");
    const label = btn.querySelector(".tts-label");

    const reset = (manuallyStopped = false) => {
        // Reset ElevenLabs Audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }

        // Reset Browser SpeechSynthesis
        if (currentUtterance) {
            window.speechSynthesis.cancel();
            currentUtterance = null;
        }

        if (currentBtn) {
            currentBtn.classList.remove("tts-playing");
            currentBtn.querySelector(".tts-icon-play").style.display = "inline";
            currentBtn.querySelector(".tts-icon-stop").style.display = "none";
            currentBtn.querySelector(".tts-label").textContent = "Listen";
            const avatar = currentBtn.closest(".msg-row--ai")?.querySelector(".ai-avatar");
            if (avatar) avatar.classList.remove("speaking");
        }

        currentBtn = null;
        window.dispatchEvent(new CustomEvent('tts-ended', { detail: { manuallyStopped } }));
    };

    async function startElevenLabs() {
        label.textContent = "Loading...";
        btn.classList.add("tts-playing");

        try {
            const response = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error("Failed to load TTS");

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);

            if (currentBtn === btn) {
                playIcon.style.display = "none";
                stopIcon.style.display = "inline";
                label.textContent = "Stop";

                const avatar = btn.closest(".msg-row--ai")?.querySelector(".ai-avatar");
                if (avatar) avatar.classList.add("speaking");

                currentAudio = new Audio(audioUrl);
                currentAudio.onended = () => reset(false);
                currentAudio.onerror = () => reset(false);
                currentAudio.play();
            }
        } catch (e) {
            console.error(e);
            reset(false);
        }
    }

    async function startBrowserTTS() {
        if (currentUtterance) window.speechSynthesis.cancel();

        currentUtterance = new SpeechSynthesisUtterance(text);

        // Fetch optimal voice for the user's state
        const v = await getBrowserVoice();
        if (v) {
            currentUtterance.voice = v;
            currentUtterance.lang = v.lang;
        } else {
            currentUtterance.lang = "hi-IN"; // generic fallback
        }

        currentUtterance.onstart = () => {
            playIcon.style.display = "none";
            stopIcon.style.display = "inline";
            label.textContent = "Stop";
            btn.classList.add("tts-playing");
            const avatar = btn.closest(".msg-row--ai")?.querySelector(".ai-avatar");
            if (avatar) avatar.classList.add("speaking");
        };

        currentUtterance.onend = () => reset(false);
        currentUtterance.onerror = () => reset(false);

        window.speechSynthesis.speak(currentUtterance);
    }

    async function start() {
        // Clear any old instances before playing either TTS
        reset(true);
        currentBtn = btn;

        if (USE_ELEVENLABS) {
            await startElevenLabs();
        } else {
            await startBrowserTTS();
        }
    }

    btn.addEventListener("click", () => {
        // If clicking the currently playing button, we stop it
        if (currentBtn === btn) {
            reset(true);
        } else {
            start();
        }
    });
}

export function cancelTts() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    if (currentUtterance) {
        window.speechSynthesis?.cancel();
        currentUtterance = null;
    }
    if (currentBtn) {
        currentBtn.classList.remove("tts-playing");
        currentBtn.querySelector(".tts-icon-play").style.display = "inline";
        currentBtn.querySelector(".tts-icon-stop").style.display = "none";
        currentBtn.querySelector(".tts-label").textContent = "Listen";
        const avatar = currentBtn.closest(".msg-row--ai")?.querySelector(".ai-avatar");
        if (avatar) avatar.classList.remove("speaking");
        currentBtn = null;
    }
}
