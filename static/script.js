// Gemini API Config
const GEMINI_API_KEY = "AIzaSyCPxrzZPzclqfHeztyPQVgtSAYsj9PncP0";
const GEMINI_STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

const SHIVA_SYSTEM_PROMPT = `Tu ek Indian AI assistant hai jiska naam hai Shiva. 
Tera style ekdum mast aur relatable hona chahiye — jaise apne yaaron ke saath baat karte hain waise. 
Tu Hindi-English (Hinglish) mix me baat karta hai, full desi swag ke saath. 
Baat-cheet me thoda chill vibe hona chahiye, thoda sarcasm bhi daal sakta hai jab mood ho. 
Formal ya heavy English avoid karni hai — koi 'henceforth' ya 'moreover' nahi, samjha? 
Tu slang words use kar sakta hai jaise 'bhai', 'yaar', 'scene kya hai', 'mast', 'jugaad', 'chill kar', etc. 
Kuch cheezein explain karni ho toh simple aur funny examples deke bata. 
Tu overly emotional ya robotic nahi lagna chahiye — full human jaise feel aana chahiye. 
Agar user kuch boring ya obvious pooche toh halka phulka taunt bhi maar sakta hai, par pyaar se. 
Aur haan, kabhi kabhi emojis bhi chala lena toh aur vibe ban jaaye 😎🔥`;

// DOM Elements
const messagesContainer = document.getElementById("messagesContainer");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const messageBubbleTemplate = document.getElementById("messageBubbleTemplate");
const assistantMessageTemplate = document.getElementById("assistantMessageTemplate");
const loadingTemplate = document.getElementById("loadingTemplate");

let isLoading = false;

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
    const response = await fetch(GEMINI_STREAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SHIVA_SYSTEM_PROMPT }],
        },
        contents: [{ parts: [{ text: message }] }],
      }),
    });

    // Remove loading dots
    const loadingGroup = messagesContainer.querySelector(".loading-group");
    if (loadingGroup) loadingGroup.remove();

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      addErrorMessage(errorData?.error?.message || "API error. Try again.");
      isLoading = false;
      sendButton.disabled = false;
      return;
    }

    // Create empty assistant message bubble for streaming
    const messageElement = assistantMessageTemplate.content.cloneNode(true);
    const messageP = messageElement.querySelector(".message p");
    messageP.textContent = "";
    messagesContainer.appendChild(messageElement);

    // Get the actual appended <p> element (template clone loses reference)
    const allMessages = messagesContainer.querySelectorAll(".assistant-message p");
    const streamTarget = allMessages[allMessages.length - 1];

    // Character queue for typewriter effect
    let charQueue = "";
    let charIndex = 0;
    let streamDone = false;

    // Type one character at a time
    const typeInterval = setInterval(() => {
      if (charIndex < charQueue.length) {
        streamTarget.textContent += charQueue[charIndex];
        charIndex++;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } else if (streamDone) {
        clearInterval(typeInterval);
        if (!streamTarget.textContent) {
          streamTarget.textContent = "Yaar, kuch toh gadbad ho gayi 😅";
        }
      }
    }, 15);

    // Read the SSE stream and feed chars into the queue
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const data = JSON.parse(jsonStr);
          const chunk = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunk) charQueue += chunk;
        } catch (parseErr) {
          // Skip malformed chunks
        }
      }
    }

    streamDone = true;
    // Wait for typewriter to finish before unlocking input
    await new Promise((resolve) => {
      const waitType = setInterval(() => {
        if (charIndex >= charQueue.length) {
          clearInterval(waitType);
          resolve();
        }
      }, 50);
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
