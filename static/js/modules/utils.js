// ── Utility functions ──

export function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderMd(t) {
    return typeof marked !== "undefined"
        ? marked.parse(t)
        : t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
}

export function scrollBottom(container) {
    container.scrollTop = container.scrollHeight;
}

// ── Chat Storage ──
const STORAGE_KEY = "aapka_ai_chats";

export function saveChats(chats) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); } catch { }
}

export function loadChats() {
    try {
        const d = localStorage.getItem(STORAGE_KEY);
        return d ? JSON.parse(d) : [];
    } catch { return []; }
}
