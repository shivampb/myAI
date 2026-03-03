// Gemini API Config
const GEMINI_API_KEY = "AIzaSyCPxrzZPzclqfHeztyPQVgtSAYsj9PncP0";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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

  // Show loading
  const loadingElement = loadingTemplate.content.cloneNode(true);
  messagesContainer.appendChild(loadingElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SHIVA_SYSTEM_PROMPT }],
        },
        contents: [
          {
            parts: [{ text: message }],
          },
        ],
      }),
    });

    // Remove loading
    const loadingGroup = messagesContainer.querySelector(".loading-group");
    if (loadingGroup) loadingGroup.remove();

    if (response.ok) {
      const data = await response.json();
      const aiText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Yaar, kuch toh gadbad ho gayi 😅";
      addAssistantMessage(aiText);
    } else {
      const errorData = await response.json().catch(() => ({}));
      addErrorMessage(
        errorData?.error?.message || "API error. Please try again."
      );
    }
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

// Add user message to UI
function addUserMessage(message) {
  removeWelcomeMessage();
  const messageElement = messageBubbleTemplate.content.cloneNode(true);
  messageElement.querySelector(".message p").textContent = message;
  messagesContainer.appendChild(messageElement);
}

// Add assistant message to UI
function addAssistantMessage(message) {
  const messageElement = assistantMessageTemplate.content.cloneNode(true);
  messageElement.querySelector(".message p").textContent = message;
  messagesContainer.appendChild(messageElement);
}

// Add error message to UI
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
