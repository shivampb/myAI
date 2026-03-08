// ── Aapka AI App — Main Entry Point ──
import { genId, saveChats, loadChats, renderMd, scrollBottom } from './modules/utils.js';
import { getSelectedState, getStateConfig, STATE_SUGGESTIONS, DEFAULT_SUGGESTIONS, getSelectedMode, setSelectedMode, getSelectedLevel, setSelectedLevel, getWelcomeData, setWelcomeData } from './states/index.js';
import { initSidebar, renderSidebarTabs } from './modules/sidebar.js';
import { initStateSelector, initModeSelector, initLevelSelector, initSettings } from './modules/state-selector.js';
import { showWelcome, updateUIForState, attachSuggestionCards } from './modules/welcome.js';
import { addUserBubble, addAiTypewriter, addAiBubble, addError, removeLoading, sendMessage, attachCopy } from './modules/chat.js';
import { attachTts, cancelTts } from './modules/tts.js';

// ── App State ──
let chats = [];
let activeChatId = null;
let isLoading = false;

document.addEventListener("DOMContentLoaded", () => {
    if (typeof marked !== "undefined") marked.setOptions({ breaks: true, gfm: true, headerIds: false });
    chats = loadChats();

    // ── DOM Elements ──
    const messagesContainer = document.getElementById("messagesContainer");
    const chatForm = document.getElementById("chatForm");
    const userInput = document.getElementById("userInput");
    const sendButton = document.getElementById("sendButton");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const sidebarClose = document.getElementById("sidebarClose");
    const sidebarTabsEl = document.getElementById("sidebarTabs");
    const newChatBtn = document.getElementById("newChatBtn");
    const sidebarNewChat = document.getElementById("sidebarNewChat");
    const userBubbleTemplate = document.getElementById("userBubbleTemplate");
    const aiBubbleTemplate = document.getElementById("aiBubbleTemplate");
    const loadingTemplate = document.getElementById("loadingTemplate");

    // State & Mode Modal Elements
    const stateSelector = document.getElementById("stateSelector");
    const stateGrid = document.getElementById("stateGrid");
    const stateSearch = document.getElementById("stateSearch");
    const langModeSelector = document.getElementById("langModeSelector");
    const modeCards = document.querySelectorAll(".lang-mode-card:not(.level-card)");
    const levelSelector = document.getElementById("levelSelector");
    const levelCards = document.querySelectorAll(".level-card");

    // Settings Modal Elements
    const settingsBtn = document.getElementById("settingsBtn");
    const settingsOverlay = document.getElementById("settingsOverlay");
    const settingsClose = document.getElementById("settingsClose");
    const changeStateBtn = document.getElementById("changeStateBtn");
    const currentStateName = document.getElementById("currentStateName");
    const currentStateFlag = document.getElementById("currentStateFlag");
    const educationLevelSelect = document.getElementById("educationLevelSelect");

    // ── Auto-resize textarea ──
    function autoResize() {
        userInput.style.height = "auto";
        userInput.style.height = Math.min(userInput.scrollHeight, 150) + "px";
    }
    userInput.addEventListener("input", autoResize);
    userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chatForm.dispatchEvent(new Event("submit")); }
    });

    // ── Render helpers ──
    function refreshSidebar() {
        renderSidebarTabs(sidebarTabsEl, chats, activeChatId, switchToChat, deleteChat, sidebarApi.closeSidebar);
    }

    function renderWelcome() {
        const welcomeData = getWelcomeData();
        const ws = showWelcome(messagesContainer, welcomeData);
        attachSuggestionCards(ws, userInput, autoResize, chatForm);
    }

    function renderChatMessages() {
        messagesContainer.innerHTML = "";
        const chat = chats.find(c => c.id === activeChatId);
        if (!chat || chat.messages.length === 0) { renderWelcome(); return; }
        chat.messages.forEach(msg => {
            if (msg.role === "user") {
                addUserBubble(messagesContainer, userBubbleTemplate, msg.text);
            } else {
                addAiBubble(messagesContainer, aiBubbleTemplate, msg.text);
            }
        });
        scrollBottom(messagesContainer);
    }

    // ── Chat management ──
    function createNewChat() {
        const chat = { id: genId(), title: "New Chat", messages: [] };
        chats.unshift(chat);
        activeChatId = chat.id;
        saveChats(chats);
        refreshSidebar();
        renderWelcome();
        userInput.value = "";
        userInput.style.height = "auto";
        userInput.focus();
        cancelTts();
    }

    function switchToChat(id) {
        activeChatId = id;
        refreshSidebar();
        renderChatMessages();
    }

    function deleteChat(id) {
        chats = chats.filter(c => c.id !== id);
        saveChats(chats);
        if (activeChatId === id) activeChatId = chats.length > 0 ? chats[0].id : null;
        refreshSidebar();
        if (activeChatId) renderChatMessages(); else renderWelcome();
    }

    // ── State selection callbacks ──
    const levelApi = initLevelSelector({
        levelSelector,
        levelCards,
        onLevelSelected: async (level) => {
            setSelectedLevel(level);
            // Show setup loader
            const setupLoader = document.getElementById("setupLoader");
            const setupGreeting = document.getElementById("setupGreeting");

            const state = getSelectedState();
            const config = getStateConfig(state);
            const mode = getSelectedMode();
            // Default to Namaste if config lacks a greeting
            setupGreeting.textContent = config ? config.greeting : "नमस्ते";

            setupLoader.style.display = "flex";

            // Start the fetching process AND wait a minimum of 2.5s
            const fetchPromise = fetch("/api/welcome", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ state, mode })
            }).then(res => res.json()).catch(() => null);

            const timerPromise = new Promise(res => setTimeout(res, 2500));

            // Wait for BOTH the visual timer and the actual API call to finish
            const [welcomeData] = await Promise.all([fetchPromise, timerPromise]);

            if (welcomeData) {
                setWelcomeData(welcomeData);
            }

            setupLoader.style.animation = "modalFadeOut 0.3s forwards";
            setTimeout(() => {
                setupLoader.style.display = "none";
                setupLoader.style.animation = ""; // reset

                // Now fully finish state/mode init
                updateUIForState(state, { userInput, currentStateName, currentStateFlag }, welcomeData);
                renderWelcome();
                userInput.focus();
            }, 300);
        }
    });

    const modeApi = initModeSelector({
        langModeSelector,
        modeCards,
        onModeSelected: (mode) => {
            setSelectedMode(mode);
            levelApi.showLevelSelector();
        }
    });

    function onStateSelected(name) {
        // State selected, now show mode picker
        modeApi.showModeSelector();
    }

    // ── Init Sidebar ──
    const sidebarApi = initSidebar({
        sidebar, sidebarOverlay, sidebarToggle, sidebarClose, sidebarNewChat,
        onNewChat: createNewChat,
    });

    newChatBtn.addEventListener("click", createNewChat);

    // ── Init State Selector ──
    const { showStateSelector } = initStateSelector({
        stateSelector, stateGrid, stateSearch,
        onSelect: onStateSelected,
    });

    // ── Init Settings ──
    initSettings({
        settingsBtn, settingsOverlay, settingsClose, changeStateBtn,
        currentStateName, currentStateFlag, showStateSelector,
        currentMode: getSelectedMode,
        onModeChange: setSelectedMode,
        educationLevelSelect,
        currentLevel: getSelectedLevel,
        onLevelChange: setSelectedLevel
    });

    // ── Form submit ──
    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message || isLoading) return;

        if (!activeChatId) {
            const chat = { id: genId(), title: message.slice(0, 40), messages: [] };
            chats.unshift(chat);
            activeChatId = chat.id;
        }
        const ws = document.getElementById("welcomeScreen");
        if (ws) ws.remove();

        const chat = chats.find(c => c.id === activeChatId);
        if (chat.messages.length === 0) {
            chat.title = message.slice(0, 40) + (message.length > 40 ? "…" : "");
            refreshSidebar();
        }

        // Extract last 6 messages for context memory
        const history = chat.messages.slice(-6).map(m => ({ role: m.role, text: m.text }));

        chat.messages.push({ role: "user", text: message });
        saveChats(chats);
        addUserBubble(messagesContainer, userBubbleTemplate, message);
        userInput.value = "";
        userInput.style.height = "auto";
        isLoading = true;
        sendButton.disabled = true;

        messagesContainer.appendChild(loadingTemplate.content.cloneNode(true));
        scrollBottom(messagesContainer);

        try {
            const response = await sendMessage(message, history);
            removeLoading(messagesContainer);
            chat.messages.push({ role: "ai", text: response });
            saveChats(chats);
            await addAiTypewriter(messagesContainer, aiBubbleTemplate, response);
        } catch (err) {
            console.error(err);
            removeLoading(messagesContainer);
            addError(messagesContainer, aiBubbleTemplate, err.message || "Connection error.");
        } finally {
            isLoading = false;
            sendButton.disabled = false;
            userInput.focus();
            scrollBottom(messagesContainer);
        }
    });

    // ── Init ──
    const savedState = getSelectedState();
    if (!savedState) {
        showStateSelector();
    } else {
        updateUIForState(savedState, { userInput, currentStateName, currentStateFlag });
    }

    refreshSidebar();
    if (activeChatId && chats.find(c => c.id === activeChatId)) {
        renderChatMessages();
    } else {
        renderWelcome();
    }

    if (savedState && userInput) userInput.focus();
});
