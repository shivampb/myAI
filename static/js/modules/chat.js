// ── Chat Module — message sending, rendering, typewriter ──
import { renderMd, scrollBottom, escapeHtml } from './utils.js';
import { attachTts } from './tts.js';
import { getSelectedState, getSelectedMode, getSelectedLevel } from '../states/index.js';

const API_CHAT_URL = "/api/chat";

export function attachCopy(btn, text) {
    btn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(text);
            const l = btn.querySelectorAll("span")[1];
            l.textContent = "Copied!";
            btn.classList.add("copied");
            setTimeout(() => { l.textContent = "Copy"; btn.classList.remove("copied"); }, 2000);
        } catch { }
    });
}

export function addUserBubble(container, template, text) {
    const el = template.content.cloneNode(true);
    el.querySelector("p").textContent = text;
    container.appendChild(el);
    scrollBottom(container);
}

export function addAiBubble(container, template, text) {
    const el = template.content.cloneNode(true);
    container.appendChild(el);
    const rows = container.querySelectorAll(".msg-row--ai");
    const last = rows[rows.length - 1];
    last.querySelector(".ai-text").innerHTML = renderMd(text);
    last.querySelector(".msg-actions").classList.remove("hidden");
    attachTts(last.querySelector(".tts-btn"), text);
    attachCopy(last.querySelector(".copy-btn"), text);
}

export async function addAiTypewriter(container, template, text) {
    const el = template.content.cloneNode(true);
    container.appendChild(el);
    const rows = container.querySelectorAll(".msg-row--ai");
    const last = rows[rows.length - 1];
    const textEl = last.querySelector(".ai-text");
    const acts = last.querySelector(".msg-actions");
    let i = 0, buf = "";

    await new Promise(resolve => {
        const timer = setInterval(() => {
            if (i < text.length) {
                const chunk = Math.min(3, text.length - i);
                buf += text.substring(i, i + chunk);
                i += chunk;
                textEl.innerHTML = renderMd(buf);
                scrollBottom(container);
            } else {
                clearInterval(timer);
                textEl.innerHTML = renderMd(text);
                acts.classList.remove("hidden");
                attachTts(last.querySelector(".tts-btn"), text);
                attachCopy(last.querySelector(".copy-btn"), text);
                scrollBottom(container);
                resolve();
            }
        }, 18);
    });
}

export function addError(container, template, msg) {
    const el = template.content.cloneNode(true);
    el.querySelector(".ai-text").textContent = "❌ " + msg;
    el.querySelector(".ai-text").classList.add("error-text");
    el.querySelector(".msg-actions").style.display = "none";
    container.appendChild(el);
    scrollBottom(container);
}

export function removeLoading(container) {
    const el = container.querySelector("#loadingRow");
    if (el) el.closest(".msg-row")?.remove();
}

export async function sendMessage(message, history = []) {
    const userState = getSelectedState() || "Gujarat";
    const userMode = getSelectedMode() || "nativelish";
    const userLevel = getSelectedLevel() || "college";
    const res = await fetch(API_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, state: userState, mode: userMode, level: userLevel, history })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "API error.");
    }
    const data = await res.json();
    if (!data.success || !data.response) throw new Error(data.error || "Failed.");
    return data.response;
}
