const API_CHAT_URL = "/api/chat";
let isLoading = false;
let currentUtterance = null;

// ═══════════════════════════
//  CHAT SESSIONS MANAGER
// ═══════════════════════════
let chats = [];       // { id, title, messages: [{role, text}] }
let activeChatId = null;

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function saveChats() {
  try { localStorage.setItem("shiva_chats", JSON.stringify(chats)); } catch { }
}
function loadChats() {
  try {
    const data = localStorage.getItem("shiva_chats");
    if (data) chats = JSON.parse(data);
  } catch { }
}

// ═══════════════════════════
//  DOM READY
// ═══════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  const messagesContainer = document.getElementById("messagesContainer");
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebarClose = document.getElementById("sidebarClose");
  const sidebarTabs = document.getElementById("sidebarTabs");
  const newChatBtn = document.getElementById("newChatBtn");
  const sidebarNewChat = document.getElementById("sidebarNewChat");

  const userBubbleTemplate = document.getElementById("userBubbleTemplate");
  const aiBubbleTemplate = document.getElementById("aiBubbleTemplate");
  const loadingTemplate = document.getElementById("loadingTemplate");

  if (typeof marked !== "undefined") {
    marked.setOptions({ breaks: true, gfm: true, headerIds: false });
  }

  loadChats();
  if (userInput) userInput.focus();

  // ── Sidebar open/close ──
  function openSidebar() { sidebar.classList.add("open"); sidebarOverlay.classList.add("open"); }
  function closeSidebar() { sidebar.classList.remove("open"); sidebarOverlay.classList.remove("open"); }

  sidebarToggle.addEventListener("click", (e) => { e.stopPropagation(); openSidebar(); });
  sidebarClose.addEventListener("click", closeSidebar);
  sidebarOverlay.addEventListener("click", closeSidebar);

  // ── New Chat (both buttons) ──
  function createNewChat() {
    const chat = { id: generateId(), title: "New Chat", messages: [] };
    chats.unshift(chat);
    activeChatId = chat.id;
    saveChats();
    renderSidebarTabs();
    showWelcome();
    closeSidebar();
    userInput.value = "";
    userInput.style.height = "auto";
    userInput.focus();
    window.speechSynthesis?.cancel();
    currentUtterance = null;
  }

  newChatBtn.addEventListener("click", createNewChat);
  sidebarNewChat.addEventListener("click", createNewChat);

  // ── Render sidebar tabs ──
  function renderSidebarTabs() {
    sidebarTabs.innerHTML = "";

    if (chats.length === 0) {
      sidebarTabs.innerHTML = `<div class="sidebar-empty"><span class="sidebar-empty-icon">💬</span><span>No chats yet</span></div>`;
      return;
    }

    chats.forEach(chat => {
      const tab = document.createElement("button");
      tab.className = "chat-tab" + (chat.id === activeChatId ? " active" : "");
      tab.innerHTML = `
        <span class="chat-tab-icon">💬</span>
        <span class="chat-tab-label">${escapeHtml(chat.title)}</span>
        <span class="chat-tab-delete" title="Delete chat">✕</span>
      `;

      // Switch to this chat
      tab.addEventListener("click", (e) => {
        if (e.target.closest(".chat-tab-delete")) return;
        switchToChat(chat.id);
        closeSidebar();
      });

      // Delete chat
      tab.querySelector(".chat-tab-delete").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteChat(chat.id);
      });

      sidebarTabs.appendChild(tab);
    });
  }

  // ── Switch to chat ──
  function switchToChat(chatId) {
    activeChatId = chatId;
    renderSidebarTabs();
    renderChatMessages();
  }

  // ── Delete chat ──
  function deleteChat(chatId) {
    chats = chats.filter(c => c.id !== chatId);
    saveChats();

    if (activeChatId === chatId) {
      activeChatId = chats.length > 0 ? chats[0].id : null;
    }
    renderSidebarTabs();
    if (activeChatId) renderChatMessages();
    else showWelcome();
  }

  // ── Show welcome screen ──
  function showWelcome() {
    messagesContainer.innerHTML = "";
    const ws = document.createElement("div");
    ws.id = "welcomeScreen";
    ws.className = "welcome-screen";
    ws.innerHTML = `
      <div class="welcome-logo">🤓</div>
      <h1 class="welcome-title">Kem chho, yaar?</h1>
      <p class="welcome-subtitle">Kuch bhi pooch — research, study, ya general doubts 😊</p>
      <div class="suggestion-grid">
        <button class="suggestion-card" data-prompt="What is machine learning and how does it work?"><span class="card-icon">🧠</span><span class="card-text">Machine Learning explain kar</span></button>
        <button class="suggestion-card" data-prompt="Explain the difference between RAM and ROM simply."><span class="card-icon">💻</span><span class="card-text">RAM vs ROM — samjhav bhai</span></button>
        <button class="suggestion-card" data-prompt="What are the best study techniques for students?"><span class="card-icon">📚</span><span class="card-text">Best study techniques?</span></button>
        <button class="suggestion-card" data-prompt="How does the internet work in simple terms?"><span class="card-icon">🌐</span><span class="card-text">Internet kevi rite kaam kare chhe?</span></button>
      </div>
    `;
    messagesContainer.appendChild(ws);
    attachSuggestionCards(ws);
  }

  // ── Render messages for active chat ──
  function renderChatMessages() {
    messagesContainer.innerHTML = "";
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat || chat.messages.length === 0) {
      showWelcome();
      return;
    }

    chat.messages.forEach(msg => {
      if (msg.role === "user") {
        const el = userBubbleTemplate.content.cloneNode(true);
        el.querySelector("p").textContent = msg.text;
        messagesContainer.appendChild(el);
      } else {
        const el = aiBubbleTemplate.content.cloneNode(true);
        messagesContainer.appendChild(el);
        const rows = messagesContainer.querySelectorAll(".msg-row--ai");
        const lastRow = rows[rows.length - 1];
        const textEl = lastRow.querySelector(".ai-text");
        textEl.innerHTML = renderMarkdown(msg.text);
        const actionsEl = lastRow.querySelector(".msg-actions");
        actionsEl.classList.remove("hidden");
        attachTtsButton(lastRow.querySelector(".tts-btn"), msg.text);
        attachCopyButton(lastRow.querySelector(".copy-btn"), msg.text);
      }
    });
    scrollToBottom();
  }

  // ── Suggestion cards ──
  function attachSuggestionCards(root) {
    root.querySelectorAll(".suggestion-card").forEach(card => {
      card.addEventListener("click", () => {
        const prompt = card.dataset.prompt;
        if (prompt) {
          userInput.value = prompt;
          autoResize();
          userInput.focus();
          chatForm.dispatchEvent(new Event("submit"));
        }
      });
    });
  }
  attachSuggestionCards(document.body);

  // ── Textarea ──
  function autoResize() {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 180) + "px";
  }
  userInput.addEventListener("input", autoResize);
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chatForm.dispatchEvent(new Event("submit")); }
  });

  // ── Submit ──
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message || isLoading) return;

    // Auto-create chat if none active
    if (!activeChatId) {
      const chat = { id: generateId(), title: message.slice(0, 40), messages: [] };
      chats.unshift(chat);
      activeChatId = chat.id;
    }

    // Hide welcome
    const ws = document.getElementById("welcomeScreen");
    if (ws) ws.remove();

    // Update title if first message
    const chat = chats.find(c => c.id === activeChatId);
    if (chat && chat.messages.length === 0) {
      chat.title = message.slice(0, 40) + (message.length > 40 ? "…" : "");
      renderSidebarTabs();
    }

    // Save user message
    chat.messages.push({ role: "user", text: message });
    saveChats();

    addUserBubble(message);
    userInput.value = "";
    userInput.style.height = "auto";
    isLoading = true;
    sendButton.disabled = true;

    messagesContainer.appendChild(loadingTemplate.content.cloneNode(true));
    scrollToBottom();

    try {
      const res = await fetch(API_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      removeLoading();
      if (!res.ok) { const err = await res.json().catch(() => ({})); addAiError(err?.error || "API error."); return; }
      const data = await res.json();
      if (!data.success || !data.response) { addAiError(data.error || "Failed."); return; }

      // Save AI response
      chat.messages.push({ role: "ai", text: data.response });
      saveChats();

      await addAiMessageTypewriter(data.response);
    } catch (err) {
      console.error(err);
      removeLoading();
      addAiError("Connection error.");
    } finally {
      isLoading = false;
      sendButton.disabled = false;
      userInput.focus();
      scrollToBottom();
    }
  });

  // ── Bubble helpers ──
  function addUserBubble(text) {
    const el = userBubbleTemplate.content.cloneNode(true);
    el.querySelector("p").textContent = text;
    messagesContainer.appendChild(el);
    scrollToBottom();
  }

  function renderMarkdown(text) {
    if (typeof marked !== "undefined") return marked.parse(text);
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  }

  async function addAiMessageTypewriter(fullText) {
    const el = aiBubbleTemplate.content.cloneNode(true);
    messagesContainer.appendChild(el);
    const rows = messagesContainer.querySelectorAll(".msg-row--ai");
    const lastRow = rows[rows.length - 1];
    const textEl = lastRow.querySelector(".ai-text");
    const actionsEl = lastRow.querySelector(".msg-actions");

    let i = 0;
    await new Promise((resolve) => {
      const timer = setInterval(() => {
        if (i < fullText.length) { textEl.textContent += fullText[i++]; scrollToBottom(); }
        else {
          clearInterval(timer);
          textEl.innerHTML = renderMarkdown(fullText);
          actionsEl.classList.remove("hidden");
          attachTtsButton(lastRow.querySelector(".tts-btn"), fullText);
          attachCopyButton(lastRow.querySelector(".copy-btn"), fullText);
          scrollToBottom();
          resolve();
        }
      }, 12);
    });
  }

  function addAiError(msg) {
    const el = aiBubbleTemplate.content.cloneNode(true);
    el.querySelector(".ai-text").textContent = "❌ " + msg;
    el.querySelector(".ai-text").classList.add("error-text");
    el.querySelector(".msg-actions").style.display = "none";
    messagesContainer.appendChild(el);
    scrollToBottom();
  }

  function removeLoading() {
    const el = messagesContainer.querySelector("#loadingRow");
    if (el) el.closest(".msg-row")?.remove();
  }
  function scrollToBottom() { messagesContainer.scrollTop = messagesContainer.scrollHeight; }
  function escapeHtml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  // ── Copy ──
  function attachCopyButton(btn, text) {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        const lbl = btn.querySelector("span");
        lbl.textContent = "Copied!"; btn.classList.add("copied");
        setTimeout(() => { lbl.textContent = "Copy"; btn.classList.remove("copied"); }, 2000);
      } catch { }
    });
  }

  // ── TTS ──
  function getIndianVoice() {
    return new Promise((resolve) => {
      const pick = () => {
        const v = window.speechSynthesis.getVoices();
        if (!v.length) return null;
        for (const l of ["gu-IN", "gu", "hi-IN", "hi", "en-IN"]) { const m = v.find(x => x.lang === l || x.lang.startsWith(l)); if (m) return m; }
        return null;
      };
      const v = pick();
      if (v !== null || window.speechSynthesis.getVoices().length > 0) resolve(v);
      else window.speechSynthesis.onvoiceschanged = () => resolve(pick());
    });
  }

  function attachTtsButton(btn, text) {
    const iconPlay = btn.querySelector(".tts-icon-play");
    const iconStop = btn.querySelector(".tts-icon-stop");
    const label = btn.querySelector(".tts-label");
    const reset = () => {
      currentUtterance = null;
      iconPlay.style.display = "inline"; iconStop.style.display = "none";
      label.textContent = "Listen"; btn.classList.remove("tts-playing");
    };
    async function start() {
      if (currentUtterance) window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const voice = await getIndianVoice();
      if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = "en-IN"; }
      u.rate = 1; u.pitch = 1;
      u.onstart = () => {
        currentUtterance = u;
        iconPlay.style.display = "none"; iconStop.style.display = "inline";
        label.textContent = "Stop"; btn.classList.add("tts-playing");
      };
      u.onend = reset; u.onerror = reset;
      window.speechSynthesis.speak(u);
    }
    btn.addEventListener("click", () => {
      if (window.speechSynthesis.speaking && btn.classList.contains("tts-playing")) { window.speechSynthesis.cancel(); reset(); }
      else { start(); }
    });
  }

  // ── Init: render sidebar and show welcome or last chat ──
  renderSidebarTabs();
  if (activeChatId && chats.find(c => c.id === activeChatId)) {
    renderChatMessages();
  } else {
    showWelcome();
  }

}); // end DOMContentLoaded
