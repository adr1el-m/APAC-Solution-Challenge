/**
 * Pulsohana AI Chatbot Implementation
 * 
 * This script implements a conversational assistant for the Pulsohana platform
 * that leverages Google's Gemini API to provide agricultural AI assistance.
 * 
 * Features:
 * - Natural language understanding for agricultural queries
 * - Image-based disease detection
 * - Context-aware conversations with memory of previous exchanges
 * - Smart recommendations for farming practices
 * 
 * @version 1.0.0
 * @author Pulsohana Team
 */

import { GEMINI_API_KEY, GEMINI_MODEL, AI_CONFIG, FEATURES, AI_MODELS } from './config.js';

// DOM Elements
let chatContainer;
let chatMessages;
let userInput;
let sendButton;
let fileInput;
let aiTypingIndicator;

// Chat state
const chatHistory = [];
let isProcessing = false;
let currentSessionId = generateSessionId();

// Current selected model - not user configurable anymore
let currentModel = GEMINI_MODEL;

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initChatElements();
  setupEventListeners();
  addWelcomeMessage();
  initializeImageUpload();
});

/**
 * Initialize chat UI elements
 */
function initChatElements() {
  // Create chat container
  chatContainer = document.createElement('div');
  chatContainer.id = 'pulsohana-chat';
  chatContainer.className = 'pulsohana-chat-container';
  chatContainer.style.opacity = '0';
  chatContainer.style.transform = 'translateY(20px)';
  
  // Create chat header
  const chatHeader = document.createElement('div');
  chatHeader.className = 'pulsohana-chat-header';
  chatHeader.innerHTML = `
    <div class="pulsohana-chat-title">
      <img src="/images/logo-small.png" alt="Pulsohana" class="pulsohana-chat-logo" />
      <span>Pulsohana Assistant</span>
    </div>
    <button class="pulsohana-chat-minimize">−</button>
  `;
  
  // Create chat messages container
  chatMessages = document.createElement('div');
  chatMessages.className = 'pulsohana-chat-messages';
  
  // Create AI typing indicator
  aiTypingIndicator = document.createElement('div');
  aiTypingIndicator.className = 'pulsohana-ai-typing-indicator hidden';
  aiTypingIndicator.innerHTML = '<span></span><span></span><span></span>';
  
  // Create chat input area
  const chatInputArea = document.createElement('div');
  chatInputArea.className = 'pulsohana-chat-input-area';
  
  userInput = document.createElement('textarea');
  userInput.className = 'pulsohana-chat-input';
  userInput.placeholder = 'Ask about crops, diseases, or farming practices...';
  userInput.rows = 1;
  
  // File input for image upload
  const fileInputContainer = document.createElement('div');
  fileInputContainer.className = 'pulsohana-file-input-container';
  
  fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.className = 'pulsohana-file-input';
  fileInput.id = 'pulsohana-file-input';
  
  const fileInputLabel = document.createElement('label');
  fileInputLabel.htmlFor = 'pulsohana-file-input';
  fileInputLabel.className = 'pulsohana-file-input-label';
  fileInputLabel.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"></path><path fill-rule="evenodd" d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 15a5 5 0 110-10 5 5 0 010 10z"></path></svg>';
  
  fileInputContainer.appendChild(fileInput);
  fileInputContainer.appendChild(fileInputLabel);
  
  // Send button with ripple effect
  sendButton = document.createElement('button');
  sendButton.className = 'pulsohana-chat-send';
  sendButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>';
  
  // Add ripple effect to send button
  sendButton.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    this.appendChild(ripple);
    
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size/2}px`;
    ripple.style.top = `${e.clientY - rect.top - size/2}px`;
    
    ripple.classList.add('active');
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
  
  chatInputArea.appendChild(fileInputContainer);
  chatInputArea.appendChild(userInput);
  chatInputArea.appendChild(sendButton);
  
  // Assemble chat container
  chatContainer.appendChild(chatHeader);
  chatContainer.appendChild(chatMessages);
  chatContainer.appendChild(aiTypingIndicator);
  chatContainer.appendChild(chatInputArea);
  
  // Add styles
  addChatStyles();
  
  // Append to document with animation
  document.body.appendChild(chatContainer);
  
  // Trigger animation after a short delay
  setTimeout(() => {
    chatContainer.style.opacity = '1';
    chatContainer.style.transform = 'translateY(0)';
    chatContainer.style.transition = 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
  }, 100);
}

/**
 * Add CSS styles for the chat UI
 */
function addChatStyles() {
  const styleSheet = document.createElement('style');
  styleSheet.innerHTML = `
    @keyframes slide-in-right {
      from { transform: translateX(30px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slide-in-left {
      from { transform: translateX(-30px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    @keyframes typing-dot {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    
    .pulsohana-chat-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 360px;
      height: 520px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      z-index: 1000;
      overflow: hidden;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    
    .pulsohana-chat-container.minimized {
      height: 60px;
    }
    
    .pulsohana-chat-header {
      padding: 18px;
      background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid rgba(255,255,255,0.1);
      transition: all 0.3s ease;
    }
    
    .pulsohana-chat-title {
      display: flex;
      align-items: center;
      font-weight: 600;
      animation: fade-in 0.5s ease-out;
    }
    
    .pulsohana-chat-logo {
      width: 28px;
      height: 28px;
      margin-right: 10px;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
      animation: pulse 2s infinite;
    }
    
    .pulsohana-chat-minimize {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      font-size: 20px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .pulsohana-chat-minimize:hover {
      background: rgba(255,255,255,0.3);
      transform: scale(1.1);
    }
    
    .pulsohana-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #F9F9F9;
      transition: all 0.3s ease;
      scroll-behavior: smooth;
    }
    
    .pulsohana-message {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 18px;
      line-height: 1.5;
      font-size: 14px;
      word-break: break-word;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      position: relative;
      transition: all 0.3s ease;
    }
    
    .pulsohana-message:hover {
      box-shadow: 0 3px 8px rgba(0,0,0,0.15);
    }
    
    .pulsohana-user-message {
      background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
      color: #1B5E20;
      align-self: flex-end;
      border-bottom-right-radius: 5px;
      animation: slide-in-right 0.3s ease-out;
    }
    
    .pulsohana-ai-message {
      background: white;
      color: #212121;
      align-self: flex-start;
      border-bottom-left-radius: 5px;
      animation: slide-in-left 0.3s ease-out;
    }
    
    .pulsohana-ai-typing-indicator {
      align-self: flex-start;
      background: white;
      padding: 14px 20px;
      border-radius: 18px;
      border-bottom-left-radius: 5px;
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.3s ease;
    }
    
    .pulsohana-ai-typing-indicator.hidden {
      opacity: 0;
      transform: translateY(10px);
      height: 0;
      padding: 0;
      margin: 0;
    }
    
    .pulsohana-ai-typing-indicator span {
      width: 8px;
      height: 8px;
      background: #2E7D32;
      border-radius: 50%;
      display: inline-block;
      animation: typing-dot 1s infinite;
    }
    
    .pulsohana-ai-typing-indicator span:nth-child(1) {
      animation-delay: 0s;
    }
    
    .pulsohana-ai-typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .pulsohana-ai-typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    .pulsohana-chat-input-area {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 16px;
      background: white;
      border-top: 1px solid #E0E0E0;
      transition: all 0.3s ease;
      position: relative;
    }
    
    .pulsohana-chat-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #E0E0E0;
      border-radius: 24px;
      resize: none;
      font-family: inherit;
      font-size: 14px;
      max-height: 120px;
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    
    .pulsohana-chat-input:focus {
      outline: none;
      border-color: #2E7D32;
      box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
    }
    
    .pulsohana-chat-send {
      background: #2E7D32;
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .pulsohana-chat-send:hover {
      background: #1B5E20;
      transform: scale(1.05);
    }
    
    .pulsohana-chat-send:active {
      transform: scale(0.95);
    }
    
    .pulsohana-chat-send svg {
      width: 20px;
      height: 20px;
      fill: white;
    }
    
    .pulsohana-file-input-container {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    
    .pulsohana-file-input {
      position: absolute;
      width: 0.1px;
      height: 0.1px;
      opacity: 0;
      overflow: hidden;
      z-index: -1;
    }
    
    .pulsohana-file-input-label {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #F5F5F5;
      cursor: pointer;
      color: #757575;
      transition: all 0.2s ease;
    }
    
    .pulsohana-file-input-label:hover {
      background: #E0E0E0;
      transform: scale(1.05);
    }
    
    .pulsohana-file-input-label.file-selected {
      color: #2E7D32;
      background: #E8F5E9;
    }
    
    .pulsohana-file-input-label svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    
    .pulsohana-image-container {
      margin-top: 8px;
      max-width: 100%;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .pulsohana-image-preview {
      max-width: 100%;
      max-height: 200px;
      object-fit: cover;
      display: block;
    }
    
    .file-preview-container {
      position: absolute;
      top: -60px;
      left: 0;
      width: 50px;
      height: 50px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: fade-in 0.3s ease-out;
    }
    
    .file-preview-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .file-preview-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .file-preview-container:hover .file-preview-overlay {
      opacity: 1;
    }
    
    .file-preview-overlay span {
      color: white;
      font-size: 9px;
      max-width: 90%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .remove-file-btn {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 16px;
      height: 16px;
      background: rgba(255,255,255,0.8);
      border: none;
      border-radius: 50%;
      color: #F44336;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .remove-file-btn:hover {
      background: white;
      transform: scale(1.1);
    }
    
    /* Quick suggestion buttons */
    .pulsohana-quick-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
      padding-left: 4px;
    }
    
    .pulsohana-suggestion-btn {
      background: white;
      border: 1px solid #E0E0E0;
      border-radius: 18px;
      padding: 8px 16px;
      font-size: 13px;
      color: #2E7D32;
      cursor: pointer;
      transition: all 0.2s ease;
      animation: fade-in-up 0.5s ease forwards;
      opacity: 0;
      transform: translateY(10px);
    }
    
    @keyframes fade-in-up {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .pulsohana-suggestion-btn:hover {
      background: #E8F5E9;
      border-color: #2E7D32;
      transform: translateY(-2px);
      box-shadow: 0 3px 6px rgba(0,0,0,0.1);
    }
    
    .pulsohana-suggestion-btn:active {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    /* Ripple effect for buttons */
    .pulsohana-chat-send {
      position: relative;
      overflow: hidden;
    }
    
    .ripple {
      position: absolute;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
    }
    
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    /* Chat input area focused state */
    .pulsohana-chat-input-area.focused .pulsohana-chat-input {
      border-color: #2E7D32;
      box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
    }
    
    /* Improved scrollbar styling */
    .pulsohana-chat-messages::-webkit-scrollbar {
      width: 6px;
    }
    
    .pulsohana-chat-messages::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
    }
    
    .pulsohana-chat-messages::-webkit-scrollbar-thumb {
      background: rgba(46, 125, 50, 0.3);
      border-radius: 3px;
      transition: background 0.2s ease;
    }
    
    .pulsohana-chat-messages::-webkit-scrollbar-thumb:hover {
      background: rgba(46, 125, 50, 0.5);
    }
    
    /* Improved image display in chat */
    .pulsohana-image-container {
      margin-top: 12px;
      max-width: 100%;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    
    .pulsohana-image-container:hover {
      transform: scale(1.02);
      box-shadow: 0 6px 16px rgba(0,0,0,0.15);
    }
    
    .pulsohana-image-preview {
      max-width: 100%;
      max-height: 200px;
      object-fit: cover;
      display: block;
      transition: all 0.3s ease;
    }
    
    /* Image upload preview */
    .file-preview-container {
      position: absolute;
      top: -60px;
      left: 0;
      width: 50px;
      height: 50px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    @keyframes bounce-in {
      0% { opacity: 0; transform: scale(0.5); }
      70% { transform: scale(1.1); }
      100% { opacity: 1; transform: scale(1); }
    }
    
    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .pulsohana-chat-container {
        width: 90%;
        right: 5%;
        left: 5%;
        max-width: 400px;
      }
      
      .pulsohana-message {
        max-width: 90%;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

/**
 * Set up event listeners for chat interactions
 */
function setupEventListeners() {
  // Send message on button click
  sendButton.addEventListener('click', handleSendMessage);
  
  // Send message on Enter key (but allow Shift+Enter for new lines)
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    
    // Auto-resize the textarea
    setTimeout(() => {
      userInput.style.height = 'auto';
      userInput.style.height = (userInput.scrollHeight > 100 ? 100 : userInput.scrollHeight) + 'px';
    }, 0);
  });
  
  // Animate input focus
  userInput.addEventListener('focus', () => {
    userInput.parentElement.classList.add('focused');
  });
  
  userInput.addEventListener('blur', () => {
    userInput.parentElement.classList.remove('focused');
  });
  
  // Minimize/maximize chat with animation
  const minimizeButton = document.querySelector('.pulsohana-chat-minimize');
  minimizeButton.addEventListener('click', () => {
    if (chatContainer.classList.contains('minimized')) {
      // Expand
      chatContainer.classList.remove('minimized');
      minimizeButton.textContent = '−';
      
      // Animate contents back in
      setTimeout(() => {
        chatMessages.style.display = 'flex';
        chatMessages.style.opacity = '1';
        
        document.querySelector('.pulsohana-chat-input-area').style.display = 'flex';
        document.querySelector('.pulsohana-chat-input-area').style.opacity = '1';
        
        if (isProcessing) {
          aiTypingIndicator.style.display = 'flex';
          aiTypingIndicator.classList.remove('hidden');
        }
      }, 300); // Wait for container animation to complete
    } else {
      // Minimize
      // First hide contents with animation
      chatMessages.style.opacity = '0';
      document.querySelector('.pulsohana-chat-input-area').style.opacity = '0';
      aiTypingIndicator.classList.add('hidden');
      
      // Then collapse container after animations finish
      setTimeout(() => {
        chatContainer.classList.add('minimized');
        minimizeButton.textContent = '+';
        chatMessages.style.display = 'none';
        document.querySelector('.pulsohana-chat-input-area').style.display = 'none';
        aiTypingIndicator.style.display = 'none';
      }, 300);
    }
  });
  
  // Add bouncing animation to send button on hover
  sendButton.addEventListener('mouseenter', () => {
    sendButton.style.animation = 'bounce 0.5s';
    setTimeout(() => {
      sendButton.style.animation = '';
    }, 500);
  });
}

/**
 * Handle sending a message
 */
async function handleSendMessage() {
  // Get message text and image (if any)
  const message = userInput.value.trim();
  const imageFile = fileInput.files.length > 0 ? fileInput.files[0] : null;
  
  // Validate input
  if (!message && !imageFile) {
    return;
  }
  
  // Disable input during processing
  userInput.disabled = true;
  sendButton.disabled = true;
  isProcessing = true;
  
  try {
    // Display user message
    displayUserMessage(message, imageFile);
    
    // Clear input
    userInput.value = '';
    fileInput.value = '';
    document.querySelector('.pulsohana-file-input-label').style.color = '#757575';
    document.querySelector('.pulsohana-file-input-label').classList.remove('file-selected');
    
    // Remove any file preview
    const previewContainer = document.querySelector('.file-preview-container');
    if (previewContainer) {
      previewContainer.parentNode.removeChild(previewContainer);
    }
    
    // Process based on input type
    if (imageFile) {
      // For image + text, use multimodal processing with Vision model
      const imageData = await readFileAsDataURL(imageFile);
      await processMultimodalQuery(message, imageData);
    } else {
      // For text-only, use text processing with regular Gemini Pro
      await processTextQuery(message);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    displayAIMessage('Sorry, something went wrong. Please try again.');
  } finally {
    // Re-enable input
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
    isProcessing = false;
  }
}

/**
 * Process a text-only query
 */
async function processTextQuery(message) {
  try {
    showAITyping();
    
    // Format previous conversations for context
    const previousMessages = formatChatHistoryForAPI(chatHistory);
    
    // Always use Gemini Pro for text queries
    const textModel = AI_MODELS.GEMINI_PRO;
    
    // Standard Gemini payload format
    const payload = {
      contents: [
        ...previousMessages,
        {
          parts: [{ text: message }],
          role: "user"
        }
      ],
      generationConfig: AI_CONFIG,
      model: textModel // Explicitly use text model
    };
    
    const response = await callGeminiAPI(payload);
    const aiResponse = extractResponseText(response);
    
    displayAIMessage(aiResponse);
    updateChatHistory(message, aiResponse);
    
  } catch (error) {
    console.error('Error processing text query:', error);
    displayAIMessage(`Sorry, I encountered an error: ${error.message}`);
  } finally {
    hideAITyping();
  }
}

/**
 * Process a multimodal query with both text and image
 */
async function processMultimodalQuery(message, imageData) {
  try {
    showAITyping();
    
    // Check if vision features are enabled
    if (!FEATURES.visionEnabled || !FEATURES.multimodalEnabled) {
      throw new Error("Image processing is currently unavailable. Please try a text-only query.");
    }
    
    // Always use vision model for image analysis
    const visionModel = AI_MODELS.GEMINI_PRO_VISION;
    console.log(`Using vision model: ${visionModel}`);
    
    // Format previous conversations for context
    const previousMessages = formatChatHistoryForAPI(chatHistory);
    
    // Default message if none provided
    const promptText = message || "What do you see in this image? If it's a plant, please identify any diseases or issues.";
    
    // Make sure image data is properly formatted
    let formattedImageData = imageData;
    if (imageData.startsWith('data:')) {
      formattedImageData = imageData.split(',')[1]; // Extract base64 data without the prefix
    }
    
    // Debug info - truncated to avoid excessive logging
    console.log(`Image data length: ${formattedImageData.length} bytes`);
    console.log(`Prompt: ${promptText}`);
    
    // Prepare the payload with both text and image
    const payload = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: formattedImageData
              }
            }
          ],
          role: "user"
        }
      ],
      generationConfig: {
        temperature: AI_CONFIG.temperature,
        maxOutputTokens: AI_CONFIG.maxOutputTokens,
        topP: AI_CONFIG.topP,
        topK: AI_CONFIG.topK
      },
      model: visionModel // Always use vision model for image processing
    };
    
    // Log payload info for debugging
    console.log(`API payload info: Using model ${visionModel} with ${payload.contents[0].parts.length} parts`);
    
    const response = await callGeminiAPI(payload);
    const aiResponse = extractResponseText(response);
    
    displayAIMessage(aiResponse);
    updateChatHistory(message, aiResponse, true);
    
  } catch (error) {
    console.error('Error processing multimodal query:', error);
    
    // Show a more helpful error message with debug info
    let errorMessage = `Sorry, I couldn't process the image: ${error.message}`;
    
    // If it's a 404 error, suggest specific solutions
    if (error.message.includes('404')) {
      errorMessage = `Sorry, there was an issue processing your image. The vision model might be unavailable or deprecated. Please try again or contact support with this error: "${error.message}"`;
    }
    
    displayAIMessage(errorMessage);
  } finally {
    hideAITyping();
  }
}

/**
 * Call the Gemini API with the given payload
 */
async function callGeminiAPI(payload) {
  // Get the model from the payload
  const model = payload.model || GEMINI_MODEL;
  
  // Determine the correct API version based on model
  // Gemini 1.5 models use v1beta
  const apiVersion = model.includes('gemini-1.5') ? 'v1beta' : 'v1';
  
  // Construct the API URL
  const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  console.log(`Calling Gemini API (${apiVersion}) with model: ${model}`);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API error response:`, errorData);
      throw new Error(`API error (${response.status}): ${errorData}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

/**
 * Extract response text from the Gemini API response
 */
function extractResponseText(response) {
  // Check for direct text field (not used anymore but keep for backward compatibility)
  if (response.text) {
    return response.text;
  }
  
  // Check for standard Gemini response format
  if (response.candidates && 
      response.candidates[0] && 
      response.candidates[0].content && 
      response.candidates[0].content.parts && 
      response.candidates[0].content.parts.length > 0) {
    return response.candidates[0].content.parts[0].text || '';
  }
  
  // Log the unexpected response format for debugging
  console.error('Unexpected API response format:', JSON.stringify(response, null, 2));
  throw new Error('Unexpected response format from API');
}

/**
 * Format chat history for the API
 */
function formatChatHistoryForAPI(history) {
  // We'll include up to the last 5 exchanges to stay within context limits
  const recentHistory = history.slice(-5);
  
  return recentHistory.flatMap(exchange => [
    {
      parts: [{ text: exchange.userMessage }],
      role: "user"
    },
    {
      parts: [{ text: exchange.aiResponse }],
      role: "model"
    }
  ]);
}

/**
 * Display user message in the chat
 */
function displayUserMessage(message, imageFile = null) {
  const messageElement = document.createElement('div');
  messageElement.className = 'pulsohana-message pulsohana-user-message';
  messageElement.style.opacity = '0';
  messageElement.style.transform = 'translateX(20px)';
  
  let content = '';
  
  if (message) {
    content += `<div>${escapeHTML(message)}</div>`;
  }
  
  if (imageFile) {
    const imagePreview = document.createElement('div');
    imagePreview.className = 'pulsohana-image-container';
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'pulsohana-image-preview';
      img.alt = 'Uploaded image';
      imagePreview.appendChild(img);
    };
    reader.readAsDataURL(imageFile);
    
    content += imagePreview.outerHTML;
  }
  
  messageElement.innerHTML = content;
  chatMessages.appendChild(messageElement);
  
  // Trigger reflow for animation
  messageElement.offsetHeight;
  
  // Apply animation
  messageElement.style.opacity = '1';
  messageElement.style.transform = 'translateX(0)';
  messageElement.style.transition = 'all 0.3s ease-out';
  
  scrollToBottom();
}

/**
 * Display AI message in the chat
 */
function displayAIMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'pulsohana-message pulsohana-ai-message';
  messageElement.style.opacity = '0';
  messageElement.style.transform = 'translateX(-20px)';
  
  // Convert markdown-like formatting
  let formattedMessage = message
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert line breaks to <br>
    .replace(/\n/g, '<br>');
  
  messageElement.innerHTML = formattedMessage;
  chatMessages.appendChild(messageElement);
  
  // Trigger reflow for animation
  messageElement.offsetHeight;
  
  // Apply animation
  messageElement.style.opacity = '1';
  messageElement.style.transform = 'translateX(0)';
  messageElement.style.transition = 'all 0.3s ease-out';
  
  scrollToBottom();
}

/**
 * Show AI typing indicator
 */
function showAITyping() {
  aiTypingIndicator.classList.remove('hidden');
  aiTypingIndicator.innerHTML = '<span></span><span></span><span></span>';
  scrollToBottom();
}

/**
 * Hide AI typing indicator
 */
function hideAITyping() {
  aiTypingIndicator.classList.add('hidden');
}

/**
 * Update chat history with a new exchange
 */
function updateChatHistory(userMessage, aiResponse, hadImage = false) {
  chatHistory.push({
    userMessage: userMessage + (hadImage ? " [Included an image]" : ""),
    aiResponse: aiResponse,
    timestamp: new Date().toISOString()
  });
  
  // Persist chat history to sessionStorage
  try {
    sessionStorage.setItem(`pulsohana_chat_${currentSessionId}`, JSON.stringify(chatHistory));
  } catch (error) {
    console.warn('Failed to save chat history to session storage:', error);
  }
}

/**
 * Add welcome message when the chat initializes
 */
function addWelcomeMessage() {
  // Add a typing indicator first
  showAITyping();
  
  // Then show the welcome message after a delay to simulate typing
  setTimeout(() => {
    hideAITyping();
    
    const welcomeMessage = "👋 Hello! I'm your Pulsohana AI Assistant powered by advanced AI. I can help with identifying crop diseases using image analysis or providing farming recommendations. How can I assist you today?";
    
    // Display welcome message with typewriter effect
    const messageElement = document.createElement('div');
    messageElement.className = 'pulsohana-message pulsohana-ai-message';
    chatMessages.appendChild(messageElement);
    
    let i = 0;
    const speed = 20; // typing speed in milliseconds
    
    function typeWriter() {
      if (i < welcomeMessage.length) {
        // Use innerHTML to render emojis properly
        messageElement.innerHTML += welcomeMessage.charAt(i);
        i++;
        scrollToBottom();
        setTimeout(typeWriter, speed);
      } else {
        // Add quick suggestion buttons after welcome message is complete
        addQuickSuggestions();
      }
    }
    
    typeWriter();
  }, 1200);
}

/**
 * Add quick suggestion buttons
 */
function addQuickSuggestions() {
  const suggestions = [
    "How to identify tomato leaf disease?",
    "What crops grow best in rainy season?",
    "Upload image of my plant"
  ];
  
  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.className = 'pulsohana-quick-suggestions';
  
  suggestions.forEach((suggestion, index) => {
    const button = document.createElement('button');
    button.className = 'pulsohana-suggestion-btn';
    button.textContent = suggestion;
    button.style.animationDelay = `${index * 0.1}s`;
    
    button.addEventListener('click', () => {
      // If it's the upload image suggestion
      if (suggestion.includes("Upload")) {
        // Click the file input
        fileInput.click();
      } else {
        // Otherwise use the suggestion text
        userInput.value = suggestion;
        handleSendMessage();
      }
    });
    
    suggestionsContainer.appendChild(button);
  });
  
  chatMessages.appendChild(suggestionsContainer);
  scrollToBottom();
}

/**
 * Initialize image upload functionality
 */
function initializeImageUpload() {
  fileInput.addEventListener('change', (e) => {
    if (fileInput.files.length > 0) {
      const fileName = fileInput.files[0].name;
      // Visual feedback that a file is selected
      const label = document.querySelector('.pulsohana-file-input-label');
      label.style.color = '#2E7D32';
      label.classList.add('file-selected');
      
      // Show preview thumbnail
      const previewContainer = document.createElement('div');
      previewContainer.className = 'file-preview-container';
      previewContainer.innerHTML = `
        <div class="file-preview-overlay">
          <span>${fileName}</span>
          <button class="remove-file-btn">×</button>
        </div>
      `;
      
      // Create preview thumbnail
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'file-preview-thumbnail';
        img.alt = fileName;
        previewContainer.prepend(img);
        
        // Add the preview to the input container
        const inputContainer = document.querySelector('.pulsohana-file-input-container');
        // Remove any existing previews
        const existingPreview = inputContainer.querySelector('.file-preview-container');
        if (existingPreview) {
          inputContainer.removeChild(existingPreview);
        }
        inputContainer.appendChild(previewContainer);
        
        // Add remove button functionality
        const removeBtn = previewContainer.querySelector('.remove-file-btn');
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fileInput.value = '';
          inputContainer.removeChild(previewContainer);
          label.style.color = '#757575';
          label.classList.remove('file-selected');
        });
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      document.querySelector('.pulsohana-file-input-label').style.color = '#757575';
      document.querySelector('.pulsohana-file-input-label').classList.remove('file-selected');
      
      // Remove preview if exists
      const previewContainer = document.querySelector('.file-preview-container');
      if (previewContainer) {
        previewContainer.parentNode.removeChild(previewContainer);
      }
    }
  });
}

/**
 * Read a file as a Data URL
 */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => {
      console.error('Error reading file:', e);
      reject(new Error('Failed to read the image file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Scroll the chat messages to the bottom
 */
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
} 