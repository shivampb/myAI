const API_CHAT_URL = "/api/chat";
let isLoading = false;
let currentUtterance = null;

// Chat sessions
let chats = [];
let activeChatId = null;

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function saveChats() { try { localStorage.setItem("shiva_chats", JSON.stringify(chats)); } catch { } }
function loadChats() { try { const d = localStorage.getItem("shiva_chats"); if (d) chats = JSON.parse(d); } catch { } }

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

  if (typeof marked !== "undefined") marked.setOptions({ breaks: true, gfm: true, headerIds: false });
  loadChats();
  if (userInput) userInput.focus();

  // ── SIDEBAR: display-based toggle ──
  function openSidebar() {
    sidebar.style.display = "flex";
    sidebarOverlay.style.display = "block";
  }
  function closeSidebar() {
    sidebar.style.display = "none";
    sidebarOverlay.style.display = "none";
  }

  sidebarToggle.addEventListener("click", (e) => { e.stopPropagation(); openSidebar(); });
  sidebarClose.addEventListener("click", closeSidebar);
  sidebarOverlay.addEventListener("click", closeSidebar);

  // ── NEW CHAT ──
  function createNewChat() {
    const chat = { id: genId(), title: "New Chat", messages: [] };
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

  // ── SIDEBAR TABS ──
  function renderSidebarTabs() {
    sidebarTabs.innerHTML = "";
    if (chats.length === 0) {
      sidebarTabs.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#555;font-size:0.82rem;text-align:center;padding:2rem;gap:0.3rem;"><span style="font-size:1.4rem;opacity:0.5;">💬</span><span>No chats yet</span></div>';
      return;
    }
    chats.forEach(chat => {
      const tab = document.createElement("button");
      tab.style.cssText = "display:flex;align-items:center;gap:0.5rem;padding:0.55rem 0.7rem;border-radius:8px;cursor:pointer;border:none;background:none;width:100%;text-align:left;font-family:inherit;color:#8e8e8e;font-size:0.82rem;transition:background 0.15s;";
      if (chat.id === activeChatId) tab.style.cssText += "background:#1a1a1a;color:#ececec;border:1px solid #2a2a2a;";
      tab.innerHTML = '<span>💬</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(chat.title) + '</span><span class="del-btn" style="opacity:0;background:none;border:none;color:#555;cursor:pointer;font-size:0.8rem;padding:2px 6px;">✕</span>';

      tab.addEventListener("mouseenter", () => { tab.style.background = "#222"; tab.querySelector(".del-btn").style.opacity = "1"; });
      tab.addEventListener("mouseleave", () => { tab.style.background = chat.id === activeChatId ? "#1a1a1a" : "none"; tab.querySelector(".del-btn").style.opacity = "0"; });

      tab.addEventListener("click", (e) => {
        if (e.target.classList.contains("del-btn")) {
          deleteChat(chat.id);
          return;
        }
        switchToChat(chat.id);
        closeSidebar();
      });
      sidebarTabs.appendChild(tab);
    });
  }

  function switchToChat(id) {
    activeChatId = id;
    renderSidebarTabs();
    renderChatMessages();
  }

  function deleteChat(id) {
    chats = chats.filter(c => c.id !== id);
    saveChats();
    if (activeChatId === id) activeChatId = chats.length > 0 ? chats[0].id : null;
    renderSidebarTabs();
    if (activeChatId) renderChatMessages(); else showWelcome();
  }

  // ── WELCOME ──
  function showWelcome() {
    messagesContainer.innerHTML = '';
    const ws = document.createElement("div");
    ws.id = "welcomeScreen";
    ws.className = "welcome-screen";
    ws.innerHTML = '<div class="welcome-logo">🤓</div><h1 class="welcome-title">Kem chho, yaar?</h1><p class="welcome-subtitle">Kuch bhi pooch — research, study, ya general doubts 😊</p><div class="suggestion-grid"><button class="suggestion-card" data-prompt="What is machine learning and how does it work?"><span class="card-icon">🧠</span><span class="card-text">Machine Learning explain kar</span></button><button class="suggestion-card" data-prompt="Explain the difference between RAM and ROM simply."><span class="card-icon">💻</span><span class="card-text">RAM vs ROM — samjhav bhai</span></button><button class="suggestion-card" data-prompt="What are the best study techniques for students?"><span class="card-icon">📚</span><span class="card-text">Best study techniques?</span></button><button class="suggestion-card" data-prompt="How does the internet work in simple terms?"><span class="card-icon">🌐</span><span class="card-text">Internet kevi rite kaam kare?</span></button></div>';
    messagesContainer.appendChild(ws);
    attachSuggestionCards(ws);
  }

  function renderChatMessages() {
    messagesContainer.innerHTML = "";
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat || chat.messages.length === 0) { showWelcome(); return; }
    chat.messages.forEach(msg => {
      if (msg.role === "user") {
        const el = userBubbleTemplate.content.cloneNode(true);
        el.querySelector("p").textContent = msg.text;
        messagesContainer.appendChild(el);
      } else {
        const el = aiBubbleTemplate.content.cloneNode(true);
        messagesContainer.appendChild(el);
        const rows = messagesContainer.querySelectorAll(".msg-row--ai");
        const last = rows[rows.length - 1];
        last.querySelector(".ai-text").innerHTML = renderMd(msg.text);
        last.querySelector(".msg-actions").classList.remove("hidden");
        attachTts(last.querySelector(".tts-btn"), msg.text);
        attachCopy(last.querySelector(".copy-btn"), msg.text);
      }
    });
    scrollBottom();
  }

  // ── SUGGESTION CARDS ──
  function attachSuggestionCards(root) {
    root.querySelectorAll(".suggestion-card").forEach(card => {
      card.addEventListener("click", () => {
        const p = card.dataset.prompt;
        if (p) { userInput.value = p; autoResize(); userInput.focus(); chatForm.dispatchEvent(new Event("submit")); }
      });
    });
  }
  attachSuggestionCards(document.body);

  // ── TEXTAREA ──
  function autoResize() { userInput.style.height = "auto"; userInput.style.height = Math.min(userInput.scrollHeight, 150) + "px"; }
  userInput.addEventListener("input", autoResize);
  userInput.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chatForm.dispatchEvent(new Event("submit")); } });

  // ── SUBMIT ──
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
    if (chat.messages.length === 0) { chat.title = message.slice(0, 40) + (message.length > 40 ? "…" : ""); renderSidebarTabs(); }

    chat.messages.push({ role: "user", text: message });
    saveChats();
    addUserBubble(message);
    userInput.value = ""; userInput.style.height = "auto";
    isLoading = true; sendButton.disabled = true;

    messagesContainer.appendChild(loadingTemplate.content.cloneNode(true));
    scrollBottom();

    try {
      const res = await fetch(API_CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      removeLoading();
      if (!res.ok) { const err = await res.json().catch(() => ({})); addError(err?.error || "API error."); return; }
      const data = await res.json();
      if (!data.success || !data.response) { addError(data.error || "Failed."); return; }
      chat.messages.push({ role: "ai", text: data.response });
      saveChats();
      await addAiTypewriter(data.response);
    } catch (err) { console.error(err); removeLoading(); addError("Connection error."); }
    finally { isLoading = false; sendButton.disabled = false; userInput.focus(); scrollBottom(); }
  });

  // ── HELPERS ──
  function addUserBubble(t) { const el = userBubbleTemplate.content.cloneNode(true); el.querySelector("p").textContent = t; messagesContainer.appendChild(el); scrollBottom(); }
  function renderMd(t) { return typeof marked !== "undefined" ? marked.parse(t) : t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>"); }

  async function addAiTypewriter(text) {
    const el = aiBubbleTemplate.content.cloneNode(true);
    messagesContainer.appendChild(el);
    const rows = messagesContainer.querySelectorAll(".msg-row--ai");
    const last = rows[rows.length - 1];
    const textEl = last.querySelector(".ai-text");
    const acts = last.querySelector(".msg-actions");
    let i = 0;
    let buf = "";
    await new Promise(r => {
      const t = setInterval(() => {
        if (i < text.length) {
          const chunk = Math.min(3, text.length - i);
          buf += text.substring(i, i + chunk);
          i += chunk;
          textEl.innerHTML = renderMd(buf);
          scrollBottom();
        } else {
          clearInterval(t);
          textEl.innerHTML = renderMd(text);
          acts.classList.remove("hidden");
          attachTts(last.querySelector(".tts-btn"), text);
          attachCopy(last.querySelector(".copy-btn"), text);
          scrollBottom();
          r();
        }
      }, 18);
    });
  }

  function addError(msg) {
    const el = aiBubbleTemplate.content.cloneNode(true);
    el.querySelector(".ai-text").textContent = "❌ " + msg;
    el.querySelector(".ai-text").classList.add("error-text");
    el.querySelector(".msg-actions").style.display = "none";
    messagesContainer.appendChild(el); scrollBottom();
  }

  function removeLoading() { const el = messagesContainer.querySelector("#loadingRow"); if (el) el.closest(".msg-row")?.remove(); }
  function scrollBottom() { messagesContainer.scrollTop = messagesContainer.scrollHeight; }
  function escapeHtml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  // ── COPY ──
  function attachCopy(btn, text) {
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(text); const l = btn.querySelectorAll("span")[1]; l.textContent = "Copied!"; btn.classList.add("copied"); setTimeout(() => { l.textContent = "Copy"; btn.classList.remove("copied"); }, 2000); } catch { }
    });
  }

  // ── TTS ──
  function getVoice() {
    return new Promise(r => {
      const pick = () => { const v = window.speechSynthesis.getVoices(); if (!v.length) return null; for (const l of ["gu-IN", "gu", "hi-IN", "hi", "en-IN"]) { const m = v.find(x => x.lang === l || x.lang.startsWith(l)); if (m) return m; } return null; };
      const v = pick(); if (v !== null || window.speechSynthesis.getVoices().length > 0) r(v); else window.speechSynthesis.onvoiceschanged = () => r(pick());
    });
  }

  function attachTts(btn, text) {
    const playIcon = btn.querySelector(".tts-icon-play");
    const stopIcon = btn.querySelector(".tts-icon-stop");
    const label = btn.querySelector(".tts-label");
    const reset = () => { currentUtterance = null; playIcon.style.display = "inline"; stopIcon.style.display = "none"; label.textContent = "Listen"; btn.classList.remove("tts-playing"); };
    async function start() {
      if (currentUtterance) window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = await getVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-IN";
      u.onstart = () => { currentUtterance = u; playIcon.style.display = "none"; stopIcon.style.display = "inline"; label.textContent = "Stop"; btn.classList.add("tts-playing"); };
      u.onend = reset; u.onerror = reset;
      window.speechSynthesis.speak(u);
    }
    btn.addEventListener("click", () => { if (window.speechSynthesis.speaking && btn.classList.contains("tts-playing")) { window.speechSynthesis.cancel(); reset(); } else start(); });
  }

  // ── INIT ──
  renderSidebarTabs();
  if (activeChatId && chats.find(c => c.id === activeChatId)) renderChatMessages();
  else showWelcome();
});
