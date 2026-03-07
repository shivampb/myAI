// API Config — calls go through Flask backend (no API key in frontend!)
const API_CHAT_URL = "/api/chat";

// DOM Elements
const messagesContainer = document.getElementById("messagesContainer");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const messageBubbleTemplate = document.getElementById("messageBubbleTemplate");
const assistantMessageTemplate = document.getElementById("assistantMessageTemplate");
const loadingTemplate = document.getElementById("loadingTemplate");

let isLoading = false;
let currentUtterance = null; // Track currently playing TTS

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  if (userInput) userInput.focus();
});

// Form submission
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message || isLoading) return;

  addUserMessage(message);
  userInput.value = "";
  isLoading = true;
  sendButton.disabled = true;

  // Show loading dots
  const loadingElement = loadingTemplate.content.cloneNode(true);
  messagesContainer.appendChild(loadingElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    const response = await fetch(API_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    // Remove loading dots
    const loadingGroup = messagesContainer.querySelector(".loading-group");
    if (loadingGroup) loadingGroup.remove();

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      addErrorMessage(errorData?.error || "API error. Try again.");
      isLoading = false;
      sendButton.disabled = false;
      return;
    }

    const data = await response.json();

    if (!data.success || !data.response) {
      addErrorMessage(data.error || "Failed to get response.");
      isLoading = false;
      sendButton.disabled = false;
      return;
    }

    // Create assistant message bubble
    const messageElement = assistantMessageTemplate.content.cloneNode(true);
    const messageP = messageElement.querySelector(".message p");
    messageP.textContent = "";
    messagesContainer.appendChild(messageElement);

    // Get the actual appended <p> element (template clone loses reference)
    const allMessages = messagesContainer.querySelectorAll(".assistant-message p");
    const streamTarget = allMessages[allMessages.length - 1];

    // Get the TTS button for this message
    const allTtsBtns = messagesContainer.querySelectorAll(".tts-btn");
    const ttsBtn = allTtsBtns[allTtsBtns.length - 1];
    ttsBtn.disabled = true; // Disable until typewriter finishes

    // Typewriter effect on the full response
    const fullText = data.response;
    let charIndex = 0;

    await new Promise((resolve) => {
      const typeInterval = setInterval(() => {
        if (charIndex < fullText.length) {
          streamTarget.textContent += fullText[charIndex];
          charIndex++;
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
          clearInterval(typeInterval);
          if (!streamTarget.textContent) {
            streamTarget.textContent = "Hmm, something went wrong. Try again!";
          }
          // Enable TTS button now that text is complete
          ttsBtn.disabled = false;
          attachTtsButton(ttsBtn, streamTarget.textContent);
          resolve();
        }
      }, 15);
    });

  } catch (error) {
    console.error("Error:", error);
    const loadingGroup = messagesContainer.querySelector(".loading-group");
    if (loadingGroup) loadingGroup.remove();
    addErrorMessage("Connection error. Check your network and try again.");
  }

  isLoading = false;
  sendButton.disabled = false;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  userInput.focus();
});

// Add user message
function addUserMessage(message) {
  removeWelcomeMessage();
  const messageElement = messageBubbleTemplate.content.cloneNode(true);
  messageElement.querySelector(".message p").textContent = message;
  messagesContainer.appendChild(messageElement);
}

// Add error message
function addErrorMessage(message) {
  const messageElement = assistantMessageTemplate.content.cloneNode(true);
  const messageDiv = messageElement.querySelector(".message");
  messageDiv.querySelector("p").textContent = `❌ Error: ${message}`;
  messageDiv.classList.add("error-message");
  messagesContainer.appendChild(messageElement);
}

// Handle Enter key
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event("submit"));
  }
});

// Auto-scroll
const observer = new MutationObserver(() => {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});
observer.observe(messagesContainer, { childList: true, subtree: true });

// Remove welcome message
function removeWelcomeMessage() {
  const welcomeMsg = messagesContainer.querySelector(".welcome-message");
  if (welcomeMsg) {
    welcomeMsg.style.animation = "fadeOut 0.3s ease-out forwards";
    setTimeout(() => welcomeMsg.remove(), 300);
  }
}

// TTS — attach play/stop behavior to a speaker button
function attachTtsButton(btn, text) {
  const iconPlay = btn.querySelector(".tts-icon-play");
  const iconStop = btn.querySelector(".tts-icon-stop");
  const label = btn.querySelector(".tts-label");

  // Pick the best available Indian voice: Gujarati → Hindi → Indian English → default
  function getIndianVoice() {
    return new Promise((resolve) => {
      const pick = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) return null;
        const priority = ["gu-IN", "gu", "hi-IN", "hi", "en-IN"];
        for (const lang of priority) {
          const match = voices.find(
            (v) => v.lang === lang || v.lang.startsWith(lang)
          );
          if (match) return match;
        }
        return null; // let browser pick default
      };

      const voice = pick();
      if (voice !== null || window.speechSynthesis.getVoices().length > 0) {
        resolve(voice);
      } else {
        // Voices not loaded yet — wait for the event (mainly Chrome)
        window.speechSynthesis.onvoiceschanged = () => {
          resolve(pick());
        };
      }
    });
  }

  async function startSpeaking() {
    // Stop any currently playing utterance
    if (currentUtterance) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = await getIndianVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "en-IN"; // safe fallback
    }
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      currentUtterance = utterance;
      iconPlay.style.display = "none";
      iconStop.style.display = "inline";
      label.textContent = "Stop";
      btn.classList.add("tts-playing");
    };

    utterance.onend = () => {
      currentUtterance = null;
      iconPlay.style.display = "inline";
      iconStop.style.display = "none";
      label.textContent = "Listen";
      btn.classList.remove("tts-playing");
    };

    utterance.onerror = () => {
      currentUtterance = null;
      iconPlay.style.display = "inline";
      iconStop.style.display = "none";
      label.textContent = "Listen";
      btn.classList.remove("tts-playing");
    };

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    currentUtterance = null;
    iconPlay.style.display = "inline";
    iconStop.style.display = "none";
    label.textContent = "Listen";
    btn.classList.remove("tts-playing");
  }

  btn.addEventListener("click", () => {
    if (window.speechSynthesis.speaking && btn.classList.contains("tts-playing")) {
      stopSpeaking();
    } else {
      startSpeaking();
    }
  });
}
