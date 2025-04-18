import { GEMINI_API_KEY, GEMINI_MODEL, AI_CONFIG, FEATURES, DATABASE } from './config.js';

/* Pulsohana AI-powered Chatbot with Google Gemini/Gemma Integration */

// Initialize conversation memory
const conversationMemory = {
  messages: [],
  context: {
    lastTopic: null,
    userFocus: null,
    cropType: null,
    knowledgeLevel: "beginner",
    preferredLanguage: "en"
  },
  addMessage: function(role, content) {
    this.messages.push({ role, content, timestamp: Date.now() });
    // Keep conversation history manageable
    if (this.messages.length > 15) this.messages.shift();
  },
  getHistory: function(maxMessages = 10) {
    return this.messages.slice(-maxMessages);
  },
  updateContext: function(updates) {
    Object.assign(this.context, updates);
  }
};

// Load agricultural databases
const databases = {};
const databasePromises = Object.entries(DATABASE).map(([key, path]) => {
  return fetch(path)
    .then(response => response.json())
    .then(data => {
      databases[key] = data;
      console.log(`Loaded ${key} database`);
    })
    .catch(err => console.error(`Failed to load ${key} database:`, err));
});

// Create chatbot container with enhanced UI
const chatbotContainer = document.createElement('div');
chatbotContainer.id = 'chatbot-widget';
chatbotContainer.innerHTML = `
  <div id="chatbot-header">
    <div id="chatbot-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" class="bi bi-robot">
        <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219V8.062Zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a24.767 24.767 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25.286 25.286 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135Z"/>
        <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2V1.866ZM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5Z"/>
      </svg>
      <span>Pulsohana AI</span>
    </div>
    <div id="chatbot-controls">
      <button id="chatbot-upload" title="Upload an image for analysis">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
        </svg>
      </button>
      <button id="chatbot-clear" title="Clear conversation">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Zm-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5ZM4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528ZM8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5Z"/>
        </svg>
      </button>
      <span id="chatbot-close">×</span>
    </div>
  </div>
  <div id="chatbot-messages"></div>
  <div id="chatbot-tools">
    <div id="image-preview" class="hidden">
      <img id="preview-img" src="" alt="Preview">
      <button id="cancel-image">×</button>
    </div>
    <div id="suggestion-chips"></div>
  </div>
  <form id="chatbot-form">
    <input id="chatbot-input" type="text" placeholder="Type a message..." autocomplete="off" />
    <button type="submit">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
      </svg>
    </button>
  </form>
  <input type="file" id="image-upload" accept="image/*" class="hidden">
`;
document.body.appendChild(chatbotContainer);

// Add enhanced styles with animations
const style = document.createElement('style');
style.textContent = `
#chatbot-widget {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 350px;
  max-width: 90vw;
  background: rgba(15, 20, 25, 0.98);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.35);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  z-index: 10000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-origin: bottom right;
  transform: scale(1);
  max-height: 600px;
  border: 1px solid rgba(255,255,255,0.05);
}
#chatbot-widget.hide {
  transform: scale(0.1);
  opacity: 0;
  pointer-events: none;
}
#chatbot-header {
  background: linear-gradient(90deg, #0bcf5d, #10df6f);
  color: #060e21;
  padding: 14px 16px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
#chatbot-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}
#chatbot-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
#chatbot-controls button {
  background: transparent;
  border: none;
  color: #060e21;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
#chatbot-controls button:hover {
  background: rgba(0,0,0,0.1);
}
#chatbot-close {
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
#chatbot-close:hover {
  transform: scale(1.2);
}
#chatbot-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: transparent;
  min-height: 200px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
}
#chatbot-tools {
  padding: 0 16px;
}
#image-preview {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
}
#image-preview img {
  max-width: 100%;
  max-height: 150px;
  object-fit: contain;
}
#image-preview.hidden, #image-upload.hidden {
  display: none;
}
#cancel-image {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0,0,0,0.5);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
#suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  overflow-x: auto;
  padding-bottom: 5px;
}
.suggestion-chip {
  background: rgba(16, 223, 111, 0.15);
  color: #10df6f;
  border: 1px solid rgba(16, 223, 111, 0.3);
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  animation: chipAppear 0.3s forwards;
}
@keyframes chipAppear {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.suggestion-chip:hover {
  background: rgba(16, 223, 111, 0.25);
}
#chatbot-form {
  display: flex;
  border-top: 1px solid rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.03);
  padding: 10px 16px;
}
#chatbot-input {
  flex: 1;
  border: none;
  padding: 12px;
  background: rgba(255,255,255,0.06);
  color: #fff;
  font-size: 14px;
  border-radius: 24px;
  outline: none;
  transition: all 0.2s;
}
#chatbot-input:focus {
  background: rgba(255,255,255,0.08);
  box-shadow: 0 0 0 2px rgba(16, 223, 111, 0.3);
}
#chatbot-form button {
  background: #10df6f;
  border: none;
  color: #060e21;
  margin-left: 8px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
#chatbot-form button:hover {
  background: #0bcf5d;
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(11, 207, 93, 0.3);
}
#chatbot-form button:active {
  transform: translateY(1px);
}
.chatbot-message {
  margin-bottom: 12px;
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 85%;
  word-break: break-word;
  font-size: 14px;
  animation: messageAppear 0.3s forwards;
  opacity: 0;
  transform: translateY(10px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  position: relative;
  line-height: 1.5;
}
@keyframes messageAppear {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.chatbot-message.user {
  background: #10df6f;
  color: #060e21;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
  margin-left: 20%;
}
.chatbot-message.bot {
  background: rgba(255,255,255,0.08);
  color: #fff;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
  margin-right: 20%;
}
.chatbot-message img {
  max-width: 100%;
  border-radius: 8px;
  margin-top: 8px;
}
.chatbot-thinking {
  display: flex;
  align-items: center;
  padding-left: 16px;
}
.chatbot-thinking span {
  width: 8px;
  height: 8px;
  margin: 0 2px;
  background-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: thinking 1.4s infinite ease-in-out both;
}
.chatbot-thinking span:nth-child(1) {
  animation-delay: 0s;
}
.chatbot-thinking span:nth-child(2) {
  animation-delay: 0.2s;
}
.chatbot-thinking span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes thinking {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
#chatbot-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10df6f, #0bcf5d);
  color: #060e21;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(11, 207, 93, 0.4);
  z-index: 9999;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s;
  border: none;
}
#chatbot-toggle:hover {
  transform: scale(1.1) rotate(5deg);
}
#chatbot-toggle svg {
  width: 28px;
  height: 28px;
  transition: transform 0.5s;
}
#chatbot-toggle.active svg {
  transform: rotate(360deg);
}
.message-with-image {
  display: flex;
  flex-direction: column;
}
.image-caption {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  margin-top: 4px;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  #chatbot-widget {
    width: 100%;
    max-width: 100%;
    height: 70%;
    bottom: 0;
    right: 0;
    border-radius: 16px 16px 0 0;
  }
  #chatbot-toggle {
    bottom: 20px;
    right: 20px;
  }
}
`;
document.head.appendChild(style);

// Create toggle button
const toggleBtn = document.createElement('button');
toggleBtn.id = 'chatbot-toggle';
toggleBtn.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" class="bi bi-robot">
    <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219V8.062Zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a24.767 24.767 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25.286 25.286 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135Z"/>
    <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2V1.866ZM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5Z"/>
  </svg>
`;
document.body.appendChild(toggleBtn);

// Initial UI setup
let isOpen = false;
chatbotContainer.classList.add('hide');

// UI Element References
const messagesDiv = document.getElementById('chatbot-messages');
const form = document.getElementById('chatbot-form');
const input = document.getElementById('chatbot-input');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const imageUpload = document.getElementById('image-upload');
const suggestionChips = document.getElementById('suggestion-chips');
const cancelImageBtn = document.getElementById('cancel-image');
const clearBtn = document.getElementById('chatbot-clear');
const uploadBtn = document.getElementById('chatbot-upload');
const closeBtn = document.getElementById('chatbot-close');

// Show/hide functionality
toggleBtn.onclick = () => {
  isOpen = !isOpen;
  toggleBtn.classList.toggle('active');
  
  if (isOpen) {
    chatbotContainer.classList.remove('hide');
    setTimeout(() => {
      input.focus();
    }, 300);
  } else {
    chatbotContainer.classList.add('hide');
  }
};

closeBtn.onclick = (e) => {
  e.stopPropagation();
  isOpen = false;
  toggleBtn.classList.remove('active');
  chatbotContainer.classList.add('hide');
};

// Image upload functionality
uploadBtn.onclick = (e) => {
  e.preventDefault();
  imageUpload.click();
};

imageUpload.onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      imagePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
};

cancelImageBtn.onclick = () => {
  imagePreview.classList.add('hidden');
  previewImg.src = '';
  imageUpload.value = '';
};

clearBtn.onclick = (e) => {
  e.preventDefault();
  messagesDiv.innerHTML = '';
  conversationMemory.messages = [];
  imagePreview.classList.add('hidden');
  previewImg.src = '';
  setTimeout(() => {
    appendInitialGreeting();
  }, 300);
};

// Suggestion chips functionality
function showSuggestions(suggestions) {
  suggestionChips.innerHTML = '';
  
  suggestions.forEach((suggestion, index) => {
    const chip = document.createElement('div');
    chip.className = 'suggestion-chip';
    chip.textContent = suggestion;
    chip.style.animationDelay = `${index * 0.1}s`;
    
    chip.onclick = () => {
      input.value = suggestion;
      input.focus();
      
      // Clear suggestions after selection
      suggestionChips.innerHTML = '';
    };
    
    suggestionChips.appendChild(chip);
  });
}

// Enhanced message display
function appendMessage(content, sender, options = {}) {
  const msg = document.createElement('div');
  msg.className = `chatbot-message ${sender}`;
  
  if (content === 'Thinking...') {
    msg.classList.add('chatbot-thinking');
    msg.innerHTML = `<span></span><span></span><span></span>`;
  } else if (options.image) {
    // For messages with image analysis
    msg.classList.add('message-with-image');
    msg.innerHTML = `
      <div>${content}</div>
      <img src="${options.image}" alt="Analyzed image">
      ${options.caption ? `<div class="image-caption">${options.caption}</div>` : ''}
    `;
  } else {
    msg.textContent = content;
  }
  
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  
  // Update conversation memory if not a thinking message
  if (content !== 'Thinking...' && !options.isInternal) {
    conversationMemory.addMessage(sender === 'user' ? 'user' : 'assistant', content);
  }
  
  return msg;
}

// Initial greeting
function appendInitialGreeting() {
  const greeting = "Hi! I'm the Pulsohana AI assistant. I can help with crop disease detection, smart irrigation, and farming recommendations. How can I assist you today?";
  appendMessage(greeting, 'bot', { isInternal: true });
  
  // Show initial suggestion chips after greeting
  setTimeout(() => {
    showSuggestions([
      "How does disease detection work?",
      "Tell me about smart irrigation",
      "Need crop recommendations"
    ]);
  }, 1000);
}

// Form submission handler
form.onsubmit = async (e) => {
  e.preventDefault();
  const userMsg = input.value.trim();
  const hasImage = !imagePreview.classList.contains('hidden');
  
  if (!userMsg && !hasImage) return;
  
  // Clear input and disable until response received
  appendMessage(userMsg, 'user');
  input.value = '';
  input.disabled = true;
  suggestionChips.innerHTML = '';
  
  // Show thinking indicator
  const thinkingMsg = appendMessage('Thinking...', 'bot');
  
  try {
    let botReply;
    let imageData = null;
    
    // Process image if present
    if (hasImage) {
      imageData = previewImg.src;
      // Use image analysis API if multimodal is enabled
      if (FEATURES.multimodalEnabled) {
        botReply = await processImageWithAI(userMsg, imageData);
      } else {
        botReply = await getBotReplyWithContext(userMsg + " [Note: User shared an image]");
      }
      
      // Hide image preview after processing
      imagePreview.classList.add('hidden');
      previewImg.src = '';
      imageUpload.value = '';
      
      // Replace thinking with response that includes the image
      thinkingMsg.classList.remove('chatbot-thinking');
      thinkingMsg.innerHTML = `
        <div>${botReply}</div>
        <img src="${imageData}" alt="Analyzed image">
        <div class="image-caption">Image Analysis</div>
      `;
      thinkingMsg.classList.add('message-with-image');
    } else {
      // Standard text processing
      botReply = await getBotReplyWithContext(userMsg);
      
      // Replace thinking with response
      thinkingMsg.classList.remove('chatbot-thinking');
      thinkingMsg.textContent = botReply;
    }
    
    // Generate follow-up suggestions based on the conversation
    const suggestions = generateSuggestions(userMsg, botReply);
    setTimeout(() => {
      showSuggestions(suggestions);
    }, 500);
    
  } catch (err) {
    console.error('Chatbot error:', err);
    thinkingMsg.classList.remove('chatbot-thinking');
    thinkingMsg.textContent = 'Sorry, I encountered an error. Please try again.';
  } finally {
    input.disabled = false;
    input.focus();
  }
};

// Process user message with conversation context
async function getBotReplyWithContext(userMsg) {
  // Extract insights from the message
  analyzeUserMessage(userMsg);
  
  // Try Google AI first, fall back to local processing if needed
  try {
    if (navigator.onLine) {
      return await callGeminiAPI(userMsg);
    } else {
      throw new Error("Offline mode");
    }
  } catch (error) {
    console.log('AI API error, using local processing:', error);
    return getLocalResponse(userMsg);
  }
}

// Analyze user messages to extract context
function analyzeUserMessage(msg) {
  const lowerMsg = msg.toLowerCase();
  
  // Detect focus on specific crops
  const cropTerms = ['rice', 'corn', 'maize', 'wheat', 'potato', 'cassava', 'tomato'];
  for (const crop of cropTerms) {
    if (lowerMsg.includes(crop)) {
      conversationMemory.updateContext({ cropType: crop });
      break;
    }
  }
  
  // Detect user focus areas
  if (lowerMsg.includes('disease') || lowerMsg.includes('pest') || lowerMsg.includes('infection')) {
    conversationMemory.updateContext({ lastTopic: 'disease', userFocus: 'plant health' });
  } else if (lowerMsg.includes('water') || lowerMsg.includes('irrigation') || lowerMsg.includes('moisture')) {
    conversationMemory.updateContext({ lastTopic: 'irrigation', userFocus: 'water management' });
  } else if (lowerMsg.includes('yield') || lowerMsg.includes('recommend') || lowerMsg.includes('grow')) {
    conversationMemory.updateContext({ lastTopic: 'advisory', userFocus: 'crop recommendations' });
  }
  
  // Detect knowledge level
  if (lowerMsg.includes('beginner') || lowerMsg.includes('new') || lowerMsg.includes('start')) {
    conversationMemory.updateContext({ knowledgeLevel: 'beginner' });
  } else if (lowerMsg.includes('expert') || lowerMsg.includes('advanced') || lowerMsg.includes('detail')) {
    conversationMemory.updateContext({ knowledgeLevel: 'expert' });
  }
}

// Process image with AI (for multimodal models)
async function processImageWithAI(userMsg, imageData) {
  console.log('Processing image with Gemini Vision API');
  console.log('Using model:', GEMINI_MODEL);
  
  try {
    // First try with the standard payload format
    const result = await tryGeminiVisionAPI(userMsg, imageData, false);
    return result;
  } catch (err) {
    console.warn('First API attempt failed, trying with simplified payload:', err.message);
    
    try {
      // Second attempt with a simplified payload format
      const result = await tryGeminiVisionAPI(userMsg, imageData, true);
      return result;
    } catch (secondErr) {
      console.error('Both API attempts failed:', secondErr);
      
      // Analyze the user's message and image to provide context-aware response
      const cropContext = extractCropContext(userMsg, imageData);
      
      // Use database information if available
      if (cropContext.cropType && databases.cropDiseases) {
        return getContextualFallbackResponse(cropContext);
      } else {
        return getGenericFallbackResponse();
      }
    }
  }
}

// Get a contextual fallback response based on crop type and databases
function getContextualFallbackResponse(context) {
  if (!context.cropType) return getGenericFallbackResponse();
  
  // Try to find crop-specific information in our databases
  let response = `I can see you're asking about ${context.cropType}. `;
  
  // Check for diseases related to this crop
  if (databases.cropDiseases) {
    const diseaseInfo = databases.cropDiseases.diseases.find(d => 
      d.crop.toLowerCase() === context.cropType.toLowerCase()
    );
    
    if (diseaseInfo) {
      response += `Common diseases affecting ${context.cropType} include ${diseaseInfo.name}. `;
      response += `Watch for symptoms like ${diseaseInfo.symptoms.join(', ')}. `;
      
      if (context.problemType === 'disease') {
        response += `Treatment options include ${diseaseInfo.treatments.join(' or ')}. `;
        response += `For prevention, consider ${diseaseInfo.prevention.join(' and ')}.`;
        return response;
      }
    }
  }
  
  // Check for irrigation information
  if (databases.irrigationSchedules && context.problemType === 'irrigation') {
    const irrigationInfo = databases.irrigationSchedules.crops.find(c => 
      c.id === context.cropType || c.name.toLowerCase().includes(context.cropType)
    );
    
    if (irrigationInfo) {
      response += `Our smart irrigation system can help you save ${irrigationInfo.smartIrrigationSavings} of water. `;
      response += `Make sure to maintain optimal soil moisture at ${irrigationInfo.soilMoistureTargets.optimal}.`;
      return response;
    }
  }
  
  // Check for crop recommendations
  if (databases.cropRecommendations) {
    const cropInfo = databases.cropRecommendations.crops.find(c => 
      c.id === context.cropType || c.name.toLowerCase().includes(context.cropType)
    );
    
    if (cropInfo && cropInfo.varieties && cropInfo.varieties.length > 0) {
      const variety = cropInfo.varieties[0];
      response += `For optimal growth, we recommend the ${variety.name} variety which performs best in ${variety.optimalConditions.soilType} soil with temperatures around ${variety.optimalConditions.temperature}.`;
      return response;
    }
  }
  
  // If no specific database info found
  return `I can see your ${context.cropType} crop in the image. For more detailed analysis, please upload a clearer image focusing on any problem areas, or describe the specific issues you're observing.`;
}

// Generic fallback response when no context is available
function getGenericFallbackResponse() {
  return "I can see your image, but need more information to provide a detailed analysis. Could you please describe what specific concerns you have about the crop, or upload a clearer image focusing on any problem areas?";
}

// Extract context from user message and image data
function extractCropContext(userMsg, imageData) {
  const msg = userMsg.toLowerCase();
  let cropType = null;
  
  // Try to identify crop from user message
  const cropTerms = {
    'corn': ['corn', 'maize'],
    'rice': ['rice', 'paddy'],
    'wheat': ['wheat'],
    'potato': ['potato', 'tuber'],
    'tomato': ['tomato'],
    'soybean': ['soybean', 'soy'],
    'cotton': ['cotton']
  };
  
  for (const [crop, terms] of Object.entries(cropTerms)) {
    if (terms.some(term => msg.includes(term))) {
      cropType = crop;
      break;
    }
  }
  
  // Update global context
  if (cropType) {
    conversationMemory.updateContext({ cropType });
  } else if (conversationMemory.context.cropType) {
    cropType = conversationMemory.context.cropType;
  }
  
  // Detect problem focus
  let problemType = null;
  if (msg.includes('disease') || msg.includes('fungus') || msg.includes('infection') || 
      msg.includes('rot') || msg.includes('blight') || msg.includes('rust')) {
    problemType = 'disease';
  } else if (msg.includes('pest') || msg.includes('insect') || msg.includes('bug')) {
    problemType = 'pest';
  } else if (msg.includes('water') || msg.includes('irrigat') || msg.includes('dry') || 
             msg.includes('drought') || msg.includes('moisture')) {
    problemType = 'irrigation';
  } else if (msg.includes('nutrient') || msg.includes('fertiliz') || 
             msg.includes('deficien') || msg.includes('yellow')) {
    problemType = 'nutrient';
  }
  
  return {
    cropType,
    problemType,
    hasImage: true,
    userExpertise: conversationMemory.context.knowledgeLevel || 'beginner'
  };
}

// Try calling the Gemini Vision API with different payload formats
async function tryGeminiVisionAPI(userMsg, imageData, useSimplifiedFormat) {
  // Format the API URL for vision capabilities
  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  // Create a prompt that guides the vision analysis
  const visionPrompt = `Analyze this plant/crop image and provide:
1. Identification of the crop if visible
2. Any signs of disease, pests, or nutrient deficiencies
3. Growth stage assessment
4. Recommended actions for the farmer

If the image is not clear or doesn't show a plant, explain what would be most helpful for agricultural analysis.`;

  // Log image info for debugging (but not the actual data)
  console.log('Image MIME type:', imageData.split(',')[0].split(':')[1].split(';')[0]);
  console.log('Image data length:', imageData.split(',')[1].length);

  // Create request payload based on format preference
  let requestBody;
  
  if (useSimplifiedFormat) {
    // Simplified payload format
    requestBody = {
      contents: [{
        parts: [
          { text: visionPrompt },
          { 
            inlineData: {
              mimeType: imageData.split(',')[0].split(':')[1].split(';')[0],
              data: imageData.split(',')[1]
            }
          },
          { text: userMsg }
        ]
      }]
    };
    
    // Add generation config if supported by model
    if (!GEMINI_MODEL.includes('gemma')) {
      requestBody.generationConfig = AI_CONFIG;
    }
  } else {
    // Standard payload format
    requestBody = {
      contents: [{
        parts: [
          { text: `${visionPrompt}\n\nUser question or context: ${userMsg}` },
          { 
            inlineData: {
              mimeType: imageData.split(',')[0].split(':')[1].split(';')[0],
              data: imageData.split(',')[1]
            }
          }
        ]
      }],
      generationConfig: AI_CONFIG
    };
  }
  
  console.log(`Sending request to Gemini Vision API with ${useSimplifiedFormat ? 'simplified' : 'standard'} format...`);
  
  try {
    // Call the Gemini API with the image
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    console.log('API response status:', response.status);
    
    // Get the full response text
    const responseText = await response.text();
    
    // Avoid logging excessive data
    if (responseText.length > 400) {
      console.log('API response text:', responseText.substring(0, 200) + '...' + responseText.substring(responseText.length - 200));
    } else {
      console.log('API response text:', responseText);
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${responseText.substring(0, 100)}`);
    }
    
    // Safely parse the response JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse API response:', parseErr);
      throw new Error('Invalid JSON response from API');
    }
    
    // Check for content in various response formats
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        for (const part of candidate.content.parts) {
          if (part.text) {
            console.log('Successfully processed image with Gemini Vision');
            return part.text;
          }
        }
      }
    }
    
    // Check for error response
    if (data.error) {
      throw new Error(`API error: ${data.error.code} - ${data.error.message}`);
    }
    
    throw new Error('No valid text content found in API response');
  } catch (err) {
    console.error('Error calling Gemini Vision API:', err);
    throw err;
  }
}

// Gemini API integration
async function callGeminiAPI(userMsg) {
  console.log('Calling Gemini API with model:', GEMINI_MODEL);
  
  // Determine if using Gemma or Gemini based on model name
  const isGemma = GEMINI_MODEL.includes('gemma');
  const isGemini15 = GEMINI_MODEL.includes('gemini-1.5');
  
  // Different API endpoints for different models
  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  // Create system prompt with contextual information
  const systemPrompt = `You are an agricultural assistant for Pulsohana, focused on our three core technologies:
1. AI Disease Detection: Using computer vision to identify crop diseases with 99% accuracy
2. Smart Irrigation System: IoT sensors that optimize water usage, reducing consumption by up to 60%
3. Intelligent Crop Advisory: Personalized recommendations that increase yields by 30%

${conversationMemory.context.cropType ? `The user is interested in ${conversationMemory.context.cropType} crops.` : ''}
${conversationMemory.context.userFocus ? `The user's focus is on ${conversationMemory.context.userFocus}.` : ''}
Provide ${conversationMemory.context.knowledgeLevel === 'expert' ? 'detailed, technical' : 'accessible, straightforward'} information.
Keep responses concise, practical, and focused on these three technologies.`;
  
  // Prepare conversation history for context
  const recentMessages = conversationMemory.getHistory(5).map(msg => {
    return {
      role: msg.role,
      parts: [{ text: msg.content }]
    };
  });
  
  // Different payload structure based on model
  let apiPayload;
  
  if (isGemma) {
    apiPayload = {
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...recentMessages,
        { role: "user", parts: [{ text: userMsg }] }
      ]
    };
  } else if (isGemini15) {
    apiPayload = {
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "I understand. I'll focus on Pulsohana's three core technologies and provide appropriate agricultural advice." }] },
        ...recentMessages,
        { role: "user", parts: [{ text: userMsg }] }
      ],
      generationConfig: AI_CONFIG
    };
  } else {
    // Standard Gemini format
    apiPayload = {
      contents: [{ 
        parts: [
          { text: systemPrompt + "\n\nUser question: " + userMsg }
        ] 
      }],
      generationConfig: AI_CONFIG
    };
  }
  
  try {
    console.log('Sending request to Gemini API');
    
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload),
    });
    
    // Get the full response text first, to handle potential errors gracefully
    const responseText = await res.text();
    
    // Log a truncated version if it's too large
    if (responseText.length > 400) {
      console.log('API response text:', responseText.substring(0, 200) + '...' + responseText.substring(responseText.length - 200));
    } else {
      console.log('API response text:', responseText);
    }
    
    if (!res.ok) {
      // Check for specific deprecation errors
      if (responseText.includes('deprecated')) {
        console.error('Model has been deprecated, falling back to local processing');
        return getLocalResponse(`${userMsg} (Note: AI processing unavailable, using local database)`);
      }
      
      throw new Error(`API error: ${res.status} - ${responseText.substring(0, 100)}`);
    }
    
    // Safely parse the response JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse API response:', parseErr);
      throw new Error('Invalid JSON response from API');
    }
    
    // Check for valid content in the response
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        for (const part of candidate.content.parts) {
          if (part.text) {
            return part.text;
          }
        }
      }
    }
    
    // Check for error response in the parsed JSON
    if (data.error) {
      // Check for deprecated model message
      if (data.error.message && data.error.message.includes('deprecated')) {
        console.warn('Model is deprecated, falling back to local processing');
        return getLocalResponse(`${userMsg} (Note: AI processing limited, using enhanced database)`);
      }
      
      throw new Error(`API error: ${data.error.code} - ${data.error.message}`);
    }
    
    throw new Error('No valid content found in API response');
    
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // Try again with a different model if possible, or fall back to local processing
    return getLocalResponse(userMsg);
  }
}

// Generate data-driven response using local database
function getLocalResponse(userMsg) {
  const msg = userMsg.toLowerCase();
  const context = conversationMemory.context;
  
  // Use specific crop recommendations if available
  if (context.cropType && databases.cropRecommendations) {
    const cropData = databases.cropRecommendations.crops.find(c => 
      c.id === context.cropType || c.name.toLowerCase().includes(context.cropType)
    );
    
    if (cropData) {
      if (context.lastTopic === 'disease' && databases.cropDiseases) {
        const diseaseForCrop = databases.cropDiseases.diseases.find(d => 
          d.crop.toLowerCase() === context.cropType
        );
        
        if (diseaseForCrop) {
          return `For ${cropData.name}, a common disease is ${diseaseForCrop.name}. Watch for symptoms like ${diseaseForCrop.symptoms.join(', ')}. ${diseaseForCrop.treatments.join(' or ')} can be effective treatments. For prevention, consider ${diseaseForCrop.prevention.join(' and ')}.`;
        }
      }
      
      if (context.lastTopic === 'irrigation' && databases.irrigationSchedules) {
        const irrigationData = databases.irrigationSchedules.crops.find(c => 
          c.id === context.cropType || c.name.toLowerCase().includes(context.cropType)
        );
        
        if (irrigationData) {
          const criticalStage = irrigationData.stages.find(s => s.waterNeeds === "Very High");
          return `For ${irrigationData.name}, our smart irrigation system can save ${irrigationData.smartIrrigationSavings} of water while improving crop health. The ${criticalStage?.name || 'reproductive'} stage is most critical for water needs. Optimal soil moisture should be maintained at ${irrigationData.soilMoistureTargets.optimal}.`;
        }
      }
      
      if (context.lastTopic === 'advisory') {
        const variety = cropData.varieties[0];
        return `For ${cropData.name}, we recommend the ${variety.name} variety with ${variety.yieldPotential} yield potential and ${variety.maturityDays} days to maturity. It performs best in ${variety.optimalConditions.soilType} soil with temperatures around ${variety.optimalConditions.temperature}. Using our AI advisory, you can expect a yield increase of ${cropData.aiYieldPrediction.predictedIncrease}.`;
      }
    }
  }
  
  // Fallback to keyword-based responses
  
  // Crop disease related questions
  if (msg.includes('disease') || msg.includes('pest') || msg.includes('infection') || msg.includes('health')) {
    return "Our AI disease detection system uses computer vision to identify crop diseases with 99% accuracy. Simply take a photo with your phone, and our app will instantly provide identification and treatment recommendations. Early detection helps prevent yield losses of up to 45% and reduces pesticide use by targeting only affected areas.";
  }
  
  // Irrigation related questions
  if (msg.includes('water') || msg.includes('irrigation') || msg.includes('drought')) {
    return "Pulsohana's smart irrigation system reduces water usage by up to 60% while improving crop health. Our IoT sensors monitor soil moisture, weather conditions, and plant needs to deliver precisely the right amount of water at the right time. The system can be automated or controlled remotely through our mobile app.";
  }
  
  // Crop advisory questions
  if (msg.includes('yield') || msg.includes('harvest') || msg.includes('grow') || msg.includes('recommend')) {
    return "Our intelligent crop advisory provides personalized recommendations that increase yields by up to 30%. It analyzes your specific soil conditions, local climate data, and crop varieties to suggest optimal planting schedules, fertilizer applications, and harvesting times for maximum productivity and profit.";
  }
  
  // General questions about the platform
  if ((msg.includes('what') && (msg.includes('offer') || msg.includes('feature') || msg.includes('do'))) || 
      msg.includes('tell me about') || msg.includes('how does it work')) {
    return "Pulsohana offers three integrated technologies: 1) AI-powered disease detection that identifies crop issues with 99% accuracy, 2) Smart irrigation systems that reduce water usage by up to 60%, and 3) Intelligent crop advisory that increases yields by up to 30%. These work together to help farmers produce more with fewer resources.";
  }
  
  // Default response
  return "I'm here to help with our three core technologies: AI disease detection, smart irrigation, and intelligent crop advisory. Could you tell me more about what specific aspect of farming you're interested in?";
}

// Generate contextual suggestions based on conversation
function generateSuggestions(userMsg, botReply) {
  const context = conversationMemory.context;
  const suggestions = [];
  
  // Disease detection follow-ups
  if (context.lastTopic === 'disease') {
    suggestions.push("How accurate is the detection?", "Can it detect early stage diseases?");
    
    if (context.cropType) {
      suggestions.push(`Common diseases in ${context.cropType}`);
    } else {
      suggestions.push("What crops does it work with?");
    }
  }
  
  // Irrigation follow-ups
  if (context.lastTopic === 'irrigation') {
    suggestions.push("How does the system save water?", "Installation process");
    
    if (context.cropType) {
      suggestions.push(`Irrigation schedule for ${context.cropType}`);
    } else {
      suggestions.push("Water savings statistics");
    }
  }
  
  // Advisory follow-ups
  if (context.lastTopic === 'advisory') {
    suggestions.push("How does AI improve yields?", "ROI of the advisory system");
    
    if (context.cropType) {
      suggestions.push(`${context.cropType} variety recommendations`);
    } else {
      suggestions.push("Which crops does it support?");
    }
  }
  
  // Add general suggestions if we have few topic-specific ones
  if (suggestions.length < 2) {
    suggestions.push(
      "Tell me about disease detection",
      "Smart irrigation benefits",
      "How does crop advisory work?"
    );
  }
  
  // Limit to 3 most relevant suggestions
  return suggestions.slice(0, 3);
}

// Initialize the chatbot
Promise.all(databasePromises)
  .then(() => {
    console.log('Pulsohana AI Chatbot initialized with databases');
    // Show initial greeting after databases are loaded
    setTimeout(appendInitialGreeting, 500);
  })
  .catch(err => {
    console.error('Failed to initialize databases:', err);
    // Show greeting even if database loading fails
    appendInitialGreeting();
  });

