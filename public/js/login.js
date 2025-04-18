// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getUserData, recordLoginActivity, recordFailedLoginAttempt, checkLoginStatus, resetFailedLoginAttempts } from "./firestoredb.js";
import { firebaseConfig } from "../config.js";

console.log("Login.js loaded, config:", firebaseConfig);

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized in login.js");
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.log("Firebase app already initialized, reusing existing app");
    app = window.firebaseApp;
  } else {
    console.error("Error initializing Firebase app:", error);
  }
}

const analytics = getAnalytics(app);
const auth = getAuth(app);  // Initialize auth instance

// Add Google Auth provider initialization
const provider = new GoogleAuthProvider();

// Configure Google Auth provider to improve sign-in reliability
provider.setCustomParameters({
  prompt: 'select_account'
});

document.addEventListener('DOMContentLoaded', function() {
  console.log("Login script loaded");
  console.log("Auth state:", auth ? "Auth initialized" : "Auth not initialized");
  
  // Parallax effect
  const parallaxBg = document.querySelector('.parallax-bg');
  document.addEventListener('mousemove', function(e) {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    parallaxBg.style.transform = `translate(${-x * 10}px, ${-y * 10}px)`;
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  const authButtons = document.querySelector('.auth-buttons');
  
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      authButtons.classList.toggle('active');
    });
  }

  // Login form
  const loginForm = document.querySelector('form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberInput = document.getElementById('remember');
  const loginButton = document.querySelector('.login-btn') || document.querySelector('button[type="submit"]');
  
  if (!loginForm || !loginButton || !emailInput || !passwordInput) {
    console.error("Required login form elements not found");
    return;
  }
  
  // Function to show error message
  function showError(message) {
    // Remove any existing error message
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();

    // Create and insert error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      color: #ff3b30;
      background: rgba(255, 59, 48, 0.1);
      border-left: 3px solid #ff3b30;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 4px;
      font-size: 0.9rem;
    `;
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    // Insert before the login button or at the end of the form
    const insertBefore = loginButton ? loginButton.parentElement : null;
    if (insertBefore) {
      loginForm.insertBefore(errorDiv, insertBefore);
    } else {
      loginForm.appendChild(errorDiv);
    }

    // Animate error message
    errorDiv.style.animation = 'slideIn 0.3s ease-out';
    
    // Log error to console as well
    console.error("Form error:", message);
  }

  // Function to show success message
  function showSuccess(message) {
    // Remove any existing messages
    const existingError = document.querySelector('.error-message');
    const existingSuccess = document.querySelector('.success-message');
    if (existingError) existingError.remove();
    if (existingSuccess) existingSuccess.remove();

    // Create and insert success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
      color: #28a745;
      background: rgba(40, 167, 69, 0.1);
      border-left: 3px solid #28a745;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 4px;
      font-size: 0.9rem;
    `;
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    // Insert before the login button or at the end of the form
    const insertBefore = loginButton ? loginButton.parentElement : null;
    if (insertBefore) {
      loginForm.insertBefore(successDiv, insertBefore);
    } else {
      loginForm.appendChild(successDiv);
    }

    // Animate success message
    successDiv.style.animation = 'slideIn 0.3s ease-out';
    
    // Log success to console as well
    console.log("Success:", message);
  }

  // Function to set loading state
  function setLoading(isLoading) {
    if (!loginButton) return;
    
    if (isLoading) {
      loginButton.disabled = true;
      loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
      loginButton.style.opacity = '0.8';
      console.log("Loading state activated");
    } else {
      loginButton.disabled = false;
      loginButton.innerHTML = 'Sign In';
      loginButton.style.opacity = '1';
      console.log("Loading state deactivated");
    }
  }
  
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log("Login form submitted");
      
      // Clear any existing error messages
      const existingError = document.querySelector('.error-message');
      if (existingError) existingError.remove();
      
      // Basic validation
      if (!emailInput.value || !passwordInput.value) {
        showError('Please enter both email and password');
        return;
      }
      
      // Check if login is allowed (not rate limited)
      try {
        const loginStatus = await checkLoginStatus(emailInput.value);
        if (!loginStatus.allowed) {
          showError(`For security reasons, this account has been temporarily locked. Please try again in ${loginStatus.remainingMinutes} minute(s).`);
          return;
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        // Continue with login attempt anyway if there's an error checking status
      }
      
      // Show loading state
      setLoading(true);
      
      console.log("Attempting login with email:", emailInput.value);
      console.log("Auth instance:", auth ? "Valid" : "Invalid");
      
      // Sign in with Firebase Authentication
      try {
        signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
          .then(async (userCredential) => {
            // Signed in 
            const user = userCredential.user;
            console.log("User signed in successfully:", user.uid);
            
            // Reset failed login attempts counter on successful login
            try {
              await resetFailedLoginAttempts(emailInput.value);
            } catch (error) {
              console.error("Error resetting failed login attempts:", error);
              // Continue login process anyway
            }
            
            // Get user data from Firestore
            getUserData(user.uid)
              .then(async userData => {
                if (userData) {
                  console.log("Retrieved user data:", userData);
                  // Store minimal user data for app use
                  localStorage.setItem('userFirstName', userData.firstName || '');
                  localStorage.setItem('userLastName', userData.lastName || '');
                  localStorage.setItem('userEmail', userData.email || '');
                  localStorage.setItem('userId', user.uid);
                  
                  // If remember me is checked, extend session persistence
                  if (rememberInput && rememberInput.checked) {
                    localStorage.setItem('rememberMe', 'true');
                  } else {
                    localStorage.removeItem('rememberMe');
                  }
                  
                  // Record login activity
                  try {
                    await recordLoginActivity(user.uid, { 
                      method: 'email',
                      device: navigator.userAgent,
                      timestamp: new Date().toISOString()
                    });
                  } catch (error) {
                    console.error("Error recording login activity:", error);
                    // Continue login process anyway
                  }
                  
                  // Show success message and redirect
                  showSuccess('Login successful! Redirecting to dashboard...');
                  
                  // Redirect to dashboard after brief delay
                  setTimeout(() => {
                    window.location.href = "dashboard.html";
                  }, 1500);
                } else {
                  console.log("No user data found, redirecting to dashboard");
                  showSuccess('Login successful! Redirecting to dashboard...');
                  
                  // Redirect to dashboard after brief delay
                  setTimeout(() => {
                    window.location.href = "dashboard.html";
                  }, 1500);
                }
              })
              .catch(error => {
                console.error("Error getting user data:", error);
                // Redirect anyway since authentication was successful
                showSuccess('Login successful! Redirecting to dashboard...');
                
                // Redirect to dashboard after brief delay
                setTimeout(() => {
                  window.location.href = "dashboard.html";
                }, 1500);
              });
          })
          .catch(async (error) => {
            setLoading(false);
            console.error("Firebase auth error:", error);
            
            // Record failed login attempt
            try {
              await recordFailedLoginAttempt(emailInput.value);
            } catch (recordError) {
              console.error("Error recording failed login attempt:", recordError);
            }
            
            // Handle specific Firebase auth errors
            const errorMessages = {
              'auth/wrong-password': "Incorrect password. Please try again.",
              'auth/user-not-found': "No account found with this email. Please check the email or sign up.",
              'auth/invalid-credential': "Invalid login credentials. Please check your email and password.",
              'auth/user-disabled': "This account has been disabled. Please contact support.",
              'auth/too-many-requests': "Too many failed attempts. Please try again later.",
              'auth/network-request-failed': "Network error. Please check your internet connection."
            };
            
            const errorMessage = errorMessages[error.code] || `An error occurred during login: ${error.message}`;
            showError(errorMessage);
          });
      } catch (error) {
        setLoading(false);
        console.error("Exception during signInWithEmailAndPassword:", error);
        showError(`Critical error: ${error.message}`);
      }
    });
  }

  // Google login button
  const googleBtn = document.querySelector('.google-btn');
  if (googleBtn) {
    const originalGoogleText = googleBtn.innerHTML;
    
    googleBtn.addEventListener('click', function() {
      console.log("Google login button clicked");
      // Show loading state
      googleBtn.disabled = true;
      googleBtn.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google logo"> <i class="fas fa-spinner fa-spin"></i> Signing in...';
      googleBtn.style.opacity = '0.8';
      
      try {
        signInWithPopup(auth, provider)
          .then(async (result) => {
            const user = result.user;
            console.log("Google sign-in successful for user:", user.uid);
            
            // Set minimal data from Google account
            localStorage.setItem('userFirstName', user.displayName ? user.displayName.split(' ')[0] : '');
            localStorage.setItem('userLastName', user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '');
            localStorage.setItem('userEmail', user.email || '');
            localStorage.setItem('userId', user.uid);
            
            // Record login activity asynchronously - don't wait for it
            recordLoginActivity(user.uid, { 
              method: 'google',
              device: navigator.userAgent,
              timestamp: new Date().toISOString()
            }).catch(error => console.error("Error recording login activity:", error));
            
            // Fetch user data asynchronously - don't wait for it
            getUserData(user.uid).catch(error => console.error("Error getting user data:", error));
            
            // Redirect immediately to dashboard
            console.log("Redirecting to dashboard.html immediately");
            window.location.href = "dashboard.html";
          })
          .catch((error) => {
            googleBtn.disabled = false;
            googleBtn.innerHTML = originalGoogleText;
            googleBtn.style.opacity = '1';
            console.error("Google sign-in error:", error);
            
            if (error.code !== 'auth/popup-closed-by-user') {
              showError(`Error signing in with Google: ${error.message}`);
              
              // Log additional information for debugging
              if (error.code === 'auth/network-request-failed') {
                console.warn("Network error during authentication. Check your internet connection.");
              } else if (error.code === 'auth/popup-blocked') {
                console.warn("Popup was blocked by the browser. Please allow popups for this site.");
                showError("Google sign-in popup was blocked. Please allow popups for this site and try again.");
              }
            }
          });
      } catch (error) {
        googleBtn.disabled = false;
        googleBtn.innerHTML = originalGoogleText;
        googleBtn.style.opacity = '1';
        console.error("Exception during Google sign-in:", error);
        showError(`Critical error with Google sign-in: ${error.message}`);
      }
    });
  }
  
  // Add a test button to verify Firebase is working
  const testElement = document.createElement('div');
  testElement.innerHTML = `
    <div style="position:fixed; bottom:20px; right:20px; z-index:1000">
      <button id="test-firebase" style="background:#10df6f; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer">
        Test Firebase Auth
      </button>
    </div>
  `;
  document.body.appendChild(testElement);
  
  document.getElementById('test-firebase').addEventListener('click', () => {
    console.log("Testing Firebase connection...");
    
    if (auth) {
      console.log("Auth instance exists:", auth);
      auth.onAuthStateChanged(user => {
        console.log("Auth state changed. User:", user ? "Signed in" : "Not signed in");
      });
      showSuccess("Firebase auth instance is available. Check console for details.");
    } else {
      console.error("Auth instance not available");
      showError("Firebase auth instance not available. See console for details.");
    }
  });
});