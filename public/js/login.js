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

// Handle form submission for email/password login
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('remember').checked;
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store user data if remember me is checked
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberMe');
    }
    
    // Store basic user info
    storeUserInfo(user);
    
    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  } catch (error) {
    showError('Login failed: ' + error.message);
  }
}

// Handle Google Sign In
async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Store basic user info
    storeUserInfo(user);
    
    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  } catch (error) {
    showError('Google login failed: ' + error.message);
  }
}

// Check if user is already authenticated
function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (user && localStorage.getItem('rememberMe') === 'true') {
      // User is already signed in and remembering is enabled
      storeUserInfo(user);
      window.location.href = 'dashboard.html';
    }
  });
}

// Store user info in localStorage
function storeUserInfo(user) {
  // Extract display name parts for first and last name
  let firstName = '';
  let lastName = '';
  
  if (user.displayName) {
    const nameParts = user.displayName.split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }
  
  localStorage.setItem('userEmail', user.email || '');
  localStorage.setItem('userId', user.uid || '');
  localStorage.setItem('userFirstName', firstName);
  localStorage.setItem('userLastName', lastName);
}

// Show error message
function showError(message) {
  // Check if error element already exists
  let errorElement = document.querySelector('.login-error');
  
  if (!errorElement) {
    // Create error element if it doesn't exist
    errorElement = document.createElement('div');
    errorElement.className = 'login-error';
    errorElement.style.color = '#ff3e3e';
    errorElement.style.backgroundColor = 'rgba(255, 62, 62, 0.1)';
    errorElement.style.padding = '10px';
    errorElement.style.borderRadius = '8px';
    errorElement.style.marginBottom = '20px';
    errorElement.style.fontSize = '0.9rem';
    
    // Insert before the form
    const form = document.querySelector('form');
    form.parentNode.insertBefore(errorElement, form);
  }
  
  errorElement.textContent = message;
} 