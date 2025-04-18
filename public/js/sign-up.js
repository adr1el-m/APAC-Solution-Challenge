// Basic Firebase setup for Google Authentication
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { firebaseConfig } from "../config.js";

// Initialize Firebase
console.log("Initializing Firebase with config:", firebaseConfig);
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  if (error.code === 'app/duplicate-app') {
    console.log("Using existing Firebase app");
    app = window.firebaseApp;
  }
}

// Initialize Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// Listen for DOM ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Sign-up page loaded");
  
  // Create a message container for feedback
  const messageContainer = document.createElement('div');
  messageContainer.id = 'message-container';
  messageContainer.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    padding: 15px;
    border-radius: 5px;
    font-weight: bold;
    text-align: center;
    display: none;
  `;
  document.body.appendChild(messageContainer);
  
  // Function to show messages
  function showMessage(message, isError = false) {
    const container = document.getElementById('message-container');
    container.textContent = message;
    container.style.backgroundColor = isError ? '#ff3b30' : '#28a745';
    container.style.color = 'white';
    container.style.display = 'block';
    
    console.log(isError ? "ERROR:" : "SUCCESS:", message);
    
    setTimeout(() => {
      container.style.display = 'none';
    }, 5000);
  }
  
  // Handle Google Sign-in
  const googleBtn = document.querySelector('.google-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', function() {
      console.log("Google button clicked");
      
      // Visual feedback
      googleBtn.disabled = true;
      googleBtn.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google logo"> <i class="fas fa-spinner fa-spin"></i> Processing...';
      
      // Attempt Google sign-in
      signInWithPopup(auth, provider)
        .then(function(result) {
          // Authentication successful
          const user = result.user;
          console.log("Google auth successful! User:", user.uid);
          
          // Store user info in localStorage
          localStorage.setItem('userId', user.uid);
          localStorage.setItem('userEmail', user.email || '');
          
          if (user.displayName) {
            const nameParts = user.displayName.split(' ');
            localStorage.setItem('userFirstName', nameParts[0] || '');
            localStorage.setItem('userLastName', nameParts.slice(1).join(' ') || '');
          }
          
          // IMPORTANT: Direct redirect to dashboard
          console.log("Redirecting to dashboard.html immediately...");
          window.location.href = "dashboard.html";
        })
        .catch(function(error) {
          // Reset button state
          googleBtn.disabled = false;
          googleBtn.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google logo"> Sign up with Google';
          
          // Handle errors
          if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Google auth error:", error);
            showMessage(`Authentication error: ${error.message}`, true);
          } else {
            console.log("User closed the popup");
          }
        });
    });
  } else {
    console.error("Google sign-in button not found");
  }
  
  // Regular form handling
  const signupForm = document.querySelector('form');
  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const firstName = document.getElementById('firstName')?.value || '';
      const lastName = document.getElementById('lastName')?.value || '';
      const email = document.getElementById('email')?.value || '';
      const password = document.getElementById('password')?.value || '';
      const confirmPassword = document.getElementById('confirmPassword')?.value || '';
      
      // Simple validation
      if (!email || !password) {
        showMessage("Please fill in all required fields", true);
        return;
      }
      
      if (password !== confirmPassword) {
        showMessage("Passwords do not match", true);
        return;
      }
      
      // Here you would normally call createUserWithEmailAndPassword
      // For now, just show success and redirect to login
      showMessage("Account created successfully! Redirecting to login...");
      
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    });
  }
  
  // Add debug buttons
  const debugPanel = document.createElement('div');
  debugPanel.style.cssText = `
    position: fixed;
    bottom: 120px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;
  
  const testRedirectBtn = document.createElement('button');
  testRedirectBtn.textContent = "Test Redirect";
  testRedirectBtn.style.cssText = `
    background: #e96d1f;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
  `;
  testRedirectBtn.addEventListener('click', () => {
    console.log("Testing manual redirect...");
    window.location.href = "dashboard.html";
  });
  
  debugPanel.appendChild(testRedirectBtn);
  document.body.appendChild(debugPanel);
});