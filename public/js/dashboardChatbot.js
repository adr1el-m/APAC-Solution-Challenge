// Simplified version of the main chatbot specifically for the dashboard
import { GEMINI_API_KEY, GEMINI_MODEL, AI_CONFIG } from '../config.js';

// DOM Elements
let chatContainer;
let chatMessages;
let userInput;
let sendButton;
let aiTypingIndicator;

// Chat state
const chatHistory = [];
let isProcessing = false;

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeChatbot();
});

function initializeChatbot() {
  // Get elements from dashboard
  chatContainer = document.getElementById('dashboard-chatbot');
  chatMessages = document.getElementById('dashboard-chat-messages');
  userInput = document.getElementById('dashboard-chat-input');
  sendButton = document.getElementById('dashboard-chat-send');
  aiTypingIndicator = document.getElementById('dashboard-typing-indicator');
  
  if (!chatContainer || !chatMessages || !userInput || !sendButton) {
    console.error('Dashboard chatbot elements not found');
    return;
  }
  
  // Set up event listeners
  sendButton.addEventListener('click', handleSendMessage);
  
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  
  // Welcome message
  displayAIMessage("How can I help with your agricultural data today?");
}

async function handleSendMessage() {
  const message = userInput.value.trim();
  
  if (!message) return;
  
  // Display user message
  displayUserMessage(message);
  
  // Clear input
  userInput.value = '';
  
  // Show AI typing indicator
  aiTypingIndicator.classList.remove('hidden');
  
  try {
    // Process the query
    const response = await processQuery(message);
    
    // Hide AI typing indicator
    aiTypingIndicator.classList.add('hidden');
    
    // Display AI response
    displayAIMessage(response);
    
  } catch (error) {
    console.error('Processing error:', error);
    aiTypingIndicator.classList.add('hidden');
    displayAIMessage("I couldn't process your request. Please try again.");
  }
}

async function processQuery(message) {
  isProcessing = true;
  
  try {
    const payload = {
      contents: [
        {
          parts: [
            {
              text: message
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
      }
    };
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`API error (${response.status})`);
    }
    
    const data = await response.json();
    
    if (data.candidates && 
        data.candidates[0] && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Query processing error:', error);
    return "I'm having trouble accessing my knowledge base. Could you try again?";
  } finally {
    isProcessing = false;
  }
}

function displayUserMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'user-message';
  messageElement.textContent = message;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayAIMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'ai-message';
  
  // Convert markdown-like formatting to HTML
  let formattedMessage = message
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  
  messageElement.innerHTML = formattedMessage;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}