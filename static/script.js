// DOM Elements
const messagesContainer = document.getElementById("messagesContainer");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const messageBubbleTemplate = document.getElementById("messageBubbleTemplate");
const assistantMessageTemplate = document.getElementById(
  "assistantMessageTemplate",
);
const loadingTemplate = document.getElementById("loadingTemplate");

let isLoading = false;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  if (userInput) {
    userInput.focus();
  }
});

// Form submission
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();

  if (!message || isLoading) return;

  // Add user message
  addUserMessage(message);
  userInput.value = "";

  // Show loading indicator
  const loadingElement = loadingTemplate.content.cloneNode(true);
  messagesContainer.appendChild(loadingElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Send message to backend
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: message }),
    });

    // Remove loading indicator
    const loadingGroup = messagesContainer.querySelector(".loading-group");
    if (loadingGroup) {
      loadingGroup.remove();
    }

    if (response.ok) {
      const data = await response.json();
      addAssistantMessage(data.response);
    } else {
      const errorData = await response.json();
      addErrorMessage(errorData.error || "Network error. Please try again.");
    }
  } catch (error) {
    console.error("Error:", error);

    // Remove loading indicator
    const loadingGroup = messagesContainer.querySelector(".loading-group");
    if (loadingGroup) {
      loadingGroup.remove();
    }

    addErrorMessage(
      "Connection error. Please check your network and try again.",
    );
  }

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  userInput.focus();
});

// Add user message to UI
function addUserMessage(message) {
  const messageElement = messageBubbleTemplate.content.cloneNode(true);
  const messageText = messageElement.querySelector(".message p");
  messageText.textContent = message;
  messagesContainer.appendChild(messageElement);
}

// Add assistant message to UI
function addAssistantMessage(message) {
  const messageElement = assistantMessageTemplate.content.cloneNode(true);
  const messageText = messageElement.querySelector(".message p");
  messageText.textContent = message;
  messagesContainer.appendChild(messageElement);
}

// Add error message to UI
function addErrorMessage(message) {
  const messageElement = assistantMessageTemplate.content.cloneNode(true);
  const messageDiv = messageElement.querySelector(".message");
  const messageText = messageElement.querySelector(".message p");
  messageText.textContent = `❌ Error: ${message}`;
  messageDiv.classList.add("error-message");
  messagesContainer.appendChild(messageElement);
}

// Handle multi-line input with Ctrl+Enter
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (e.ctrlKey || e.metaKey) {
      // Allow new line with Ctrl+Enter
      e.preventDefault();
      const start = userInput.selectionStart;
      const end = userInput.selectionEnd;
      userInput.value =
        userInput.value.substring(0, start) +
        "\n" +
        userInput.value.substring(end);
      userInput.selectionStart = userInput.selectionEnd = start + 1;
    } else if (!e.shiftKey) {
      // Send message with Enter
      e.preventDefault();
      chatForm.dispatchEvent(new Event("submit"));
    }
  }
});

// Auto-scroll to latest message
const observer = new MutationObserver(() => {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

observer.observe(messagesContainer, {
  childList: true,
  subtree: true,
});

// Remove welcome message when first real message arrives
function removeWelcomeMessage() {
  const welcomeMsg = messagesContainer.querySelector(".welcome-message");
  if (welcomeMsg) {
    welcomeMsg.style.animation = "fadeOut 0.3s ease-out forwards";
    setTimeout(() => welcomeMsg.remove(), 300);
  }
}

// Update remove welcome on first user message
const originalAddUserMessage = addUserMessage;
addUserMessage = function (message) {
  removeWelcomeMessage();
  return originalAddUserMessage.call(this, message);
};
