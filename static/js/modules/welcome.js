// ── Welcome Screen Module ──
import { escapeHtml } from './utils.js';
import { getSelectedState, getStateConfig, STATE_SUGGESTIONS, STATE_SUBTITLES, DEFAULT_SUGGESTIONS, DEFAULT_SUBTITLE } from '../states/index.js';

export function showWelcome(container, welcomeData = null) {
    container.innerHTML = '';
    const state = getSelectedState();
    const cfg = getStateConfig(state);

    // Use dynamic welcome data if available, fallback to static defaults
    const greeting = welcomeData?.greeting || (cfg ? cfg.greeting : "Hello");
    const subtitle = welcomeData?.subtitle || STATE_SUBTITLES[state] || DEFAULT_SUBTITLE;
    const cards = welcomeData?.suggestions || STATE_SUGGESTIONS[state] || DEFAULT_SUGGESTIONS;

    const ws = document.createElement("div");
    ws.id = "welcomeScreen";
    ws.className = "welcome-screen";

    const cardsHtml = cards.map(c =>
        `<button class="suggestion-card" data-prompt="${escapeHtml(c.prompt)}"><span class="card-icon">${c.icon}</span><span class="card-text">${c.text}</span></button>`
    ).join("");
    const badgeHtml = cfg ? `<div class="state-badge-welcome">${cfg.emoji} ${state}</div>` : "";

    ws.innerHTML = `<img src="images/logo.png" class="welcome-logo" alt="Aapka AI Logo"><h1 class="welcome-title">${greeting} 😄</h1><p class="welcome-subtitle">${subtitle}</p>${badgeHtml}<div class="suggestion-grid" id="suggestionGrid">${cardsHtml}</div>`;
    container.appendChild(ws);
    return ws;
}

export function updateUIForState(stateName, elements, welcomeData = null) {
    const cfg = getStateConfig(stateName);
    if (!cfg) return;

    const { userInput, currentStateName, currentStateFlag } = elements;

    if (userInput) userInput.placeholder = welcomeData?.placeholder || cfg.placeholder;
    if (currentStateName) currentStateName.textContent = stateName;
    if (currentStateFlag) currentStateFlag.textContent = cfg.emoji;
}

export function attachSuggestionCards(root, userInput, autoResize, chatForm) {
    root.querySelectorAll(".suggestion-card").forEach(card => {
        card.addEventListener("click", () => {
            const p = card.dataset.prompt;
            if (p) {
                userInput.value = p;
                autoResize();
                userInput.focus();
                chatForm.dispatchEvent(new Event("submit"));
            }
        });
    });
}
