// Dedicated Google Authentication Module
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { firebaseConfig } from "../config.js";

console.log("Google Auth Handler loaded");

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized in google-auth.js");
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.log("Firebase already initialized elsewhere, reusing");
    app = window.firebaseApp;
  } else {
    console.error("Firebase initialization error:", error);
  }
}

// Get auth instance
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// Function to handle Google sign-in
export function handleGoogleSignIn(successCallback = null, errorCallback = null) {
  console.log("Starting Google sign-in process");
  
  return signInWithPopup(auth, provider)
    .then(result => {
      const user = result.user;
      console.log("Google sign-in successful:", user.uid);
      
      // Store user info in localStorage for use in dashboard
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('userEmail', user.email || '');
      
      if (user.displayName) {
        const nameParts = user.displayName.split(' ');
        localStorage.setItem('userFirstName', nameParts[0] || '');
        localStorage.setItem('userLastName', nameParts.slice(1).join(' ') || '');
      }
      
      // Determine current path and construct correct redirect
      const isInPagesDirectory = window.location.pathname.includes('/pages/');
      const dashboardPath = isInPagesDirectory ? 'dashboard.html' : 'pages/dashboard.html';
      
      // Force redirect to dashboard immediately
      try {
        console.log(`Redirecting to ${dashboardPath}`);
        window.location.href = dashboardPath;
      } catch (e) {
        console.error("Error during redirect:", e);
        // Try alternate method if the first fails
        window.location.replace(dashboardPath);
      }
      
      // If callback provided, call it
      if (typeof successCallback === 'function') {
        successCallback(user);
      }
      
      return user;
    })
    .catch(error => {
      console.error("Google sign-in error:", error);
      
      // If callback provided, call it
      if (typeof errorCallback === 'function') {
        errorCallback(error);
      }
      
      throw error;
    });
}

// Function to show an error message on the page
function showErrorOnPage(message) {
  const messageArea = document.getElementById('message-area');
  if (messageArea) {
    messageArea.innerHTML = `<div class="message error-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
  } else {
    // Fallback to alert if no message area found
    alert(message);
  }
}

// Automatically set up the Google sign-in button on page load
document.addEventListener('DOMContentLoaded', () => {
  const googleBtn = document.querySelector('.google-btn');
  if (googleBtn) {
    console.log("Found Google button, attaching listener");
    
    googleBtn.addEventListener('click', () => {
      console.log("Google button clicked");
      
      // Disable the button and show loading state
      const originalText = googleBtn.innerHTML;
      googleBtn.disabled = true;
      googleBtn.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google logo"> <i class="fas fa-spinner fa-spin"></i> Processing...';
      
      // Attempt Google sign-in
      handleGoogleSignIn(
        // Success callback
        user => {
          console.log("Sign-in successful, redirecting to dashboard");
          // This is a backup redirect in case the one in handleGoogleSignIn fails
          const isInPagesDirectory = window.location.pathname.includes('/pages/');
          const dashboardPath = isInPagesDirectory ? 'dashboard.html' : 'pages/dashboard.html';
          window.location.href = dashboardPath;
        },
        // Error callback
        error => {
          // Reset button state
          googleBtn.disabled = false;
          googleBtn.innerHTML = originalText;
          
          // Only show error if not popup closed
          if (error.code !== 'auth/popup-closed-by-user') {
            // Show error message
            console.error("Google sign-in error:", error.message);
            showErrorOnPage(`Authentication failed: ${error.message}`);
          } else {
            console.log("User closed the sign-in popup");
          }
        }
      );
    });
  }
});

// Add a direct redirect function for testing
export function testDashboardRedirect() {
  console.log("Testing dashboard redirect...");
  window.location.href = "dashboard.html";
}
