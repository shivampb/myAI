// ── Aapka AI App — Main Entry Point ──
import { genId, saveChats, loadChats, renderMd, scrollBottom } from './modules/utils.js';
import { getSelectedState, getStateConfig, STATE_SUGGESTIONS, DEFAULT_SUGGESTIONS, getSelectedMode, setSelectedMode, getSelectedLevel, setSelectedLevel, getWelcomeData, setWelcomeData } from './states/index.js';
import { initSidebar, renderSidebarTabs } from './modules/sidebar.js';
import { initStateSelector, initModeSelector, initLevelSelector, initSettings } from './modules/state-selector.js';
import { showWelcome, updateUIForState, attachSuggestionCards } from './modules/welcome.js';
import { addUserBubble, addAiTypewriter, addAiBubble, addError, removeLoading, sendMessage, attachCopy } from './modules/chat.js';
import { attachTts, cancelTts } from './modules/tts.js';
import { initVoiceInput, voiceState } from './modules/voice.js';

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
    const micButton = document.getElementById("micButton");
    const shareChatBtn = document.getElementById("shareChatBtn");
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

    // ── Init Voice Input ──
    if (micButton) {
        initVoiceInput(micButton, userInput);
    }

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

    async function fetchAndApplyWelcomeData() {
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

        if (welcomeData && !welcomeData.error) {
            setWelcomeData(welcomeData);
        } else {
            // If failed, clear welcome data to force static fallback
            localStorage.removeItem("aapka_ai_welcome_data");
        }

        setupLoader.style.animation = "modalFadeOut 0.3s forwards";
        setTimeout(() => {
            setupLoader.style.display = "none";
            setupLoader.style.animation = ""; // reset

            // Now fully finish state/mode init
            updateUIForState(state, { userInput, currentStateName, currentStateFlag }, welcomeData || null);
            renderWelcome();
            userInput.focus();

            // Auto start listening once setup is complete
            if (micButton && voiceState && !voiceState.isVoice) {
                setTimeout(() => micButton.click(), 500);
            }
        }, 300);
    }

    async function handleShareChat() {
        const chat = chats.find(c => c.id === activeChatId);
        if (!chat || chat.messages.length === 0) {
            alert("No messages to share!");
            return;
        }

        // Show loading state on button
        const originalContent = shareChatBtn.innerHTML;
        shareChatBtn.innerHTML = "⏳";
        shareChatBtn.disabled = true;

        try {
            // 1. Generate a "snapshot" of the chat session
            const snapshot = {
                title: chat.title,
                messages: chat.messages,
                isVoice: chat.isVoice,
                timestamp: new Date().toISOString()
            };

            // 2. Upload to the server to get a unique shareable ID
            const res = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(snapshot)
            });

            const data = await res.json();
            if (!data.success) throw new Error("Share failed");

            // 3. Create the direct URL
            const shareUrl = `${window.location.origin}/shared/${data.share_id}`;

            // 4. Use native share OR fallback to clipboard
            if (navigator.share) {
                await navigator.share({
                    title: `Aapka AI Chat: ${chat.title}`,
                    text: `Check out this conversation with Aapka AI 🇮🇳`,
                    url: shareUrl
                });
                shareChatBtn.innerHTML = originalContent;
            } else {
                await navigator.clipboard.writeText(shareUrl);
                alert("Deep Link copied! You can now paste it in WhatsApp.");
                shareChatBtn.innerHTML = "✅";
                setTimeout(() => shareChatBtn.innerHTML = originalContent, 2000);
            }
        } catch (err) {
            console.error("Share failed:", err);
            alert("Sorry, could not generate a share link.");
            shareChatBtn.innerHTML = "❌";
            setTimeout(() => shareChatBtn.innerHTML = originalContent, 2000);
        } finally {
            shareChatBtn.disabled = false;
        }
    }

    if (shareChatBtn) shareChatBtn.addEventListener("click", handleShareChat);

    // ── State selection callbacks ──
    const levelApi = initLevelSelector({
        levelSelector,
        levelCards,
        onLevelSelected: async (level) => {
            setSelectedLevel(level);
            await fetchAndApplyWelcomeData();
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
        onModeChange: async (mode) => {
            setSelectedMode(mode);
            settingsOverlay.style.display = "none";
            await fetchAndApplyWelcomeData();
        },
        educationLevelSelect,
        currentLevel: getSelectedLevel,
        onLevelChange: async (level) => {
            setSelectedLevel(level);
            // Re-fetch chat config not necessary here, but we can update UI
        }
    });

    // ── Form submit ──
    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message || isLoading) return;

        const isVoiceQuery = voiceState ? voiceState.isVoice : false;
        // Don't reset voiceState.isTwoWay here; let it continue until user interrupts
        if (voiceState) voiceState.isVoice = false;

        if (!activeChatId) {
            const chat = { id: genId(), title: message.slice(0, 40), messages: [], isVoice: isVoiceQuery };
            chats.unshift(chat);
            activeChatId = chat.id;
        }
        const ws = document.getElementById("welcomeScreen");
        if (ws) ws.remove();

        const chat = chats.find(c => c.id === activeChatId);
        if (chat.messages.length === 0) {
            chat.title = message.slice(0, 40) + (message.length > 40 ? "…" : "");
            if (isVoiceQuery) chat.isVoice = true;
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

            if (isVoiceQuery) {
                const rows = messagesContainer.querySelectorAll(".msg-row--ai");
                const lastRow = rows[rows.length - 1];
                const ttsBtn = lastRow?.querySelector(".tts-btn");
                if (ttsBtn) ttsBtn.click();
            }
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

    // ── Resuming STT for Two-Way Communication ──
    window.addEventListener('tts-ended', (e) => {
        // If the TTS was stopped manually, break the two-way loop
        if (e.detail?.manuallyStopped) {
            if (voiceState) voiceState.isTwoWay = false;
            return;
        }

        // If we are still in two-way mode, restart speech recognition after a brief pause
        if (voiceState && voiceState.isTwoWay && !isLoading) {
            setTimeout(() => {
                // Ensure the user hasn't typed anything or manually stopped in the delay
                if (!voiceState.isTwoWay) return;
                if (micButton) micButton.click();
            }, 800);
        }
    });

    // ── Init ──
    // Check if we are viewing a shared chat
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'shared' && pathParts[2]) {
        const shareId = pathParts[2];
        const loadingRow = document.createElement('div');
        loadingRow.style.cssText = "text-align:center; padding: 2rem; color: #888;";
        loadingRow.innerHTML = "⌛ Loading shared conversation...";
        messagesContainer.appendChild(loadingRow);

        fetch(`/api/shared/${shareId}`)
            .then(res => res.json())
            .then(data => {
                loadingRow.remove();
                if (data.error) throw new Error("Not found");

                // Set up a temporary active view
                const sharedChat = {
                    id: 'shared-' + shareId,
                    title: `Shared: ${data.title}`,
                    messages: data.messages,
                    readOnly: true
                };

                // Inject into local state for rendering
                activeChatId = sharedChat.id;
                // Add to chats list ONLY if not already there (visual session)
                if (!chats.find(c => c.id === sharedChat.id)) {
                    chats.unshift(sharedChat);
                }

                renderChatMessages();
                // Disable input for shared read-only chats
                userInput.disabled = true;
                userInput.placeholder = "Viewing a shared conversation";
                sendButton.disabled = true;
                micButton.disabled = true;
            })
            .catch(err => {
                loadingRow.innerHTML = "❌ Failed to load shared chat.";
            });
    }

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

    if (savedState && userInput) {
        userInput.focus();
        // Auto start listening on initial page load
        if (micButton && voiceState && !voiceState.isVoice) {
            setTimeout(() => micButton.click(), 1000);
        }
    }
});
