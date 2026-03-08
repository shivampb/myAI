// ── TTS Module ──
import { getSelectedState } from '../states/index.js';

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

let currentUtterance = null;

function getVoice() {
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

export function attachTts(btn, text) {
    const playIcon = btn.querySelector(".tts-icon-play");
    const stopIcon = btn.querySelector(".tts-icon-stop");
    const label = btn.querySelector(".tts-label");

    const reset = () => {
        currentUtterance = null;
        playIcon.style.display = "inline";
        stopIcon.style.display = "none";
        label.textContent = "Listen";
        btn.classList.remove("tts-playing");
    };

    async function start() {
        if (currentUtterance) window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const v = await getVoice();
        if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-IN";
        u.onstart = () => {
            currentUtterance = u;
            playIcon.style.display = "none";
            stopIcon.style.display = "inline";
            label.textContent = "Stop";
            btn.classList.add("tts-playing");
        };
        u.onend = reset;
        u.onerror = reset;
        window.speechSynthesis.speak(u);
    }

    btn.addEventListener("click", () => {
        if (window.speechSynthesis.speaking && btn.classList.contains("tts-playing")) {
            window.speechSynthesis.cancel();
            reset();
        } else {
            start();
        }
    });
}

export function cancelTts() {
    window.speechSynthesis?.cancel();
    currentUtterance = null;
}
