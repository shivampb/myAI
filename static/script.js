// ── API ──
const API_CHAT_URL = "/api/chat";
let isLoading = false;
let currentUtterance = null;

document.addEventListener("DOMContentLoaded", () => {
  const messagesContainer = document.getElementById("messagesContainer");
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");
  const newChatBtn = document.getElementById("newChatBtn");
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");

  const userBubbleTemplate = document.getElementById("userBubbleTemplate");
  const aiBubbleTemplate = document.getElementById("aiBubbleTemplate");
  const loadingTemplate = document.getElementById("loadingTemplate");

  // Configure marked
  if (typeof marked !== "undefined") {
    marked.setOptions({ breaks: true, gfm: true, headerIds: false });
  }

  if (userInput) userInput.focus();

  // ────── SIDEBAR ──────
  function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("open");
  }
  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("open");
  }

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openSidebar();
  });
  sidebarCloseBtn.addEventListener("click", closeSidebar);
  sidebarOverlay.addEventListener("click", closeSidebar);

  // ────── NEW CHAT ──────
  newChatBtn.addEventListener("click", () => {
    messagesContainer.querySelectorAll(".msg-row").forEach(r => r.remove());
    const ws = document.getElementById("welcomeScreen");
    if (ws) ws.style.display = "";
    window.speechSynthesis?.cancel();
    currentUtterance = null;
    userInput.value = "";
    userInput.style.height = "auto";
    closeSidebar();
  });

  // ────── SUGGESTION CARDS ──────
  document.body.querySelectorAll(".suggestion-card").forEach(card => {
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

  // ────── TEXTAREA ──────
  function autoResize() {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 180) + "px";
  }
  userInput.addEventListener("input", autoResize);
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event("submit"));
    }
  });

  // ────── SUBMIT ──────
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message || isLoading) return;

    const ws = document.getElementById("welcomeScreen");
    if (ws) ws.style.display = "none";

    addUserMessage(message);
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        addAiError(err?.error || "API error.");
        return;
      }
      const data = await res.json();
      if (!data.success || !data.response) {
        addAiError(data.error || "Failed.");
        return;
      }
      await addAiMessage(data.response);
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

  // ────── HELPERS ──────
  function addUserMessage(text) {
    const el = userBubbleTemplate.content.cloneNode(true);
    el.querySelector("p").textContent = text;
    messagesContainer.appendChild(el);
    scrollToBottom();
  }

  function renderMarkdown(text) {
    if (typeof marked !== "undefined") return marked.parse(text);
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  }

  async function addAiMessage(fullText) {
    const el = aiBubbleTemplate.content.cloneNode(true);
    messagesContainer.appendChild(el);
    const rows = messagesContainer.querySelectorAll(".msg-row--ai");
    const lastRow = rows[rows.length - 1];
    const textEl = lastRow.querySelector(".ai-text");
    const actionsEl = lastRow.querySelector(".msg-actions");
    const ttsBtn = lastRow.querySelector(".tts-btn");
    const copyBtn = lastRow.querySelector(".copy-btn");

    // Typewriter on raw text
    let i = 0;
    await new Promise((resolve) => {
      const timer = setInterval(() => {
        if (i < fullText.length) {
          textEl.textContent += fullText[i++];
          scrollToBottom();
        } else {
          clearInterval(timer);
          // Render rich markdown
          textEl.innerHTML = renderMarkdown(fullText);
          actionsEl.classList.remove("hidden");
          attachTtsButton(ttsBtn, fullText);
          attachCopyButton(copyBtn, fullText);
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

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // ────── COPY ──────
  function attachCopyButton(btn, text) {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        const label = btn.querySelector("span");
        label.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => { label.textContent = "Copy"; btn.classList.remove("copied"); }, 2000);
      } catch { }
    });
  }

  // ────── TTS ──────
  function getIndianVoice() {
    return new Promise((resolve) => {
      const pick = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) return null;
        for (const lang of ["gu-IN", "gu", "hi-IN", "hi", "en-IN"]) {
          const m = voices.find(v => v.lang === lang || v.lang.startsWith(lang));
          if (m) return m;
        }
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
      if (window.speechSynthesis.speaking && btn.classList.contains("tts-playing")) {
        window.speechSynthesis.cancel(); reset();
      } else { start(); }
    });
  }

}); // end DOMContentLoaded
