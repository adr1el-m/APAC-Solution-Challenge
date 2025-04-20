import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { firebaseConfig } from '../config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

// Log Firebase config for debugging
console.log("Firebase Auth Domain:", firebaseConfig.authDomain);
console.log("Current URL:", window.location.hostname);

document.addEventListener('DOMContentLoaded', function() {
  // Regular sign in form submission
  const loginForm = document.querySelector('form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleFormSubmit);
  }
  
  // Google sign in button
  const googleButton = document.getElementById('googleLogin');
  if (googleButton) {
    googleButton.addEventListener('click', handleGoogleSignIn);
  }
  
  // Check if user is already authenticated
  checkAuthState();
});

// Form submission handler
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('remember').checked;
  
  if (!email || !password) {
    showError('Please enter both email and password');
    return;
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store user info
    storeUserInfo(user, rememberMe);
    
    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  } catch (error) {
    showError('Login failed: ' + error.message);
  }
}

// Handle Google Sign In
async function handleGoogleSignIn() {
  try {
    // Show loading state
    const googleButton = document.getElementById('googleLogin');
    if (googleButton) {
      googleButton.disabled = true;
      googleButton.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google logo"> <i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Store basic user info
    storeUserInfo(user);
    
    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  } catch (error) {
    // Reset button state
    const googleButton = document.getElementById('googleLogin');
    if (googleButton) {
      googleButton.disabled = false;
      googleButton.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google logo"> Sign in with Google';
    }
    
    console.error("Google sign-in error details:", error);
    
    // Special handling for auth domain errors
    if (error.code === 'auth/unauthorized-domain') {
      showError(`This domain (${window.location.hostname}) is not authorized for Firebase authentication. Please add it to your Firebase console's authorized domains.`);
    } else {
      showError('Google login failed: ' + error.message);
    }
  }
}

// Check if user is already authenticated
function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, redirect to dashboard
      window.location.href = 'dashboard.html';
    }
  });
}

// Store user info to localStorage
function storeUserInfo(user, rememberMe = false) {
  if (rememberMe) {
    localStorage.setItem('rememberMe', 'true');
  }
  
  // Store basic user data for use in other pages
  localStorage.setItem('userId', user.uid);
  localStorage.setItem('userEmail', user.email || '');
  
  if (user.displayName) {
    const nameParts = user.displayName.split(' ');
    localStorage.setItem('userFirstName', nameParts[0] || '');
    localStorage.setItem('userLastName', nameParts.slice(1).join(' ') || '');
  }
}

// Show error message
function showError(message) {
  console.error(message);
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  
  // Add to page
  const container = document.querySelector('.login-card');
  if (container) {
    // Remove any existing error message
    const existingError = container.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    container.appendChild(errorElement);
  }
} 