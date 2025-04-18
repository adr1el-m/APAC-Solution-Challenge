// Import Firebase Firestore functions
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { firebaseConfig } from "../config.js";

console.log("Firestore module loaded, config:", firebaseConfig);

// Initialize Firestore with the app
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized in firestoredb.js");
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.log("Firebase app already initialized, reusing existing app");
    app = window.firebaseApp;
  } else {
    console.error("Error initializing Firebase app:", error);
  }
}

// Store the app instance globally so it can be reused
window.firebaseApp = app;

// Initialize Firestore
let db = getFirestore(app);
console.log("Firestore initialized");

/**
 * Initialize the Firestore database
 * @param {Object} app - Firebase app instance (optional, uses global app if not provided)
 */
export function initFirestore(app) {
  if (!db) {
    const appInstance = app || window.firebaseApp;
    if (appInstance) {
      db = getFirestore(appInstance);
      console.log("Firestore initialized");
    } else {
      console.error("No Firebase app available to initialize Firestore");
    }
  }
  return db;
}

/**
 * Get Firebase app from any module that might have initialized it
 * This helps avoid re-initialization errors
 */
export function getFirebaseApp() {
  // Look for the Firebase app instance in the global scope
  const existingApp = window.firebaseApp;
  if (existingApp) {
    console.log("Using existing Firebase app");
    // Initialize Firestore with existing app if needed
    if (!db) {
      db = getFirestore(existingApp);
    }
    return existingApp;
  }
  
  // If no existing app, return null - caller should initialize
  return null;
}

/**
 * Store user data in Firestore
 * @param {string} userId - Firebase Auth user ID
 * @param {Object} userData - User data to store
 * @returns {Promise} - Promise that resolves when data is stored
 */
export async function storeUserData(userId, userData) {
  if (!db) {
    console.error("Firestore not initialized");
    return Promise.reject("Firestore not initialized");
  }
  
  try {
    console.log("Storing user data for:", userId, userData);
    
    // Add timestamp
    userData.updatedAt = serverTimestamp();
    
    // If new user, also set createdAt timestamp
    if (!userData.createdAt) {
      userData.createdAt = serverTimestamp();
    }
    
    // Set user data in Firestore
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, userData, { merge: true });
    console.log("User data stored successfully");
    return true;
  } catch (error) {
    console.error("Error storing user data: ", error);
    return Promise.reject(error);
  }
}

/**
 * Create user data in Firestore - alternative name for storeUserData
 * @param {string} userId - Firebase Auth user ID
 * @param {Object} userData - User data to store
 * @returns {Promise} - Promise that resolves when data is stored
 */
export async function createUserData(userId, userData) {
  return storeUserData(userId, userData);
}

/**
 * Get user data from Firestore
 * @param {string} userId - Firebase Auth user ID
 * @returns {Promise} - Promise that resolves with user data
 */
export async function getUserData(userId) {
  if (!db) {
    console.error("Firestore not initialized");
    return Promise.reject("Firestore not initialized");
  }
  
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log("User data retrieved successfully");
      return userSnap.data();
    } else {
      console.log("No user data found");
      return null;
    }
  } catch (error) {
    console.error("Error getting user data: ", error);
    return Promise.reject(error);
  }
}

/**
 * Record login activity
 * @param {string} userId - Firebase Auth user ID
 * @param {Object} activityData - Login activity data
 * @returns {Promise} - Promise that resolves when activity is recorded
 */
export async function recordLoginActivity(userId, activityData) {
  if (!db) {
    console.error("Firestore not initialized");
    return Promise.reject("Firestore not initialized");
  }
  
  try {
    // Create activity record with timestamp
    const loginData = {
      ...activityData,
      timestamp: serverTimestamp(),
      userId: userId
    };
    
    // Add login activity to collection
    const activityRef = collection(db, "users", userId, "loginActivity");
    await addDoc(activityRef, loginData);
    
    // Update last login timestamp in user document
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp()
    });
    
    console.log("Login activity recorded successfully");
    return true;
  } catch (error) {
    console.error("Error recording login activity: ", error);
    return Promise.reject(error);
  }
}

/**
 * Record failed login attempt for security monitoring
 * @param {string} email - Email address that failed login
 * @returns {Promise} - Promise that resolves when attempt is recorded
 */
export async function recordFailedLoginAttempt(email) {
  if (!db) {
    console.error("Firestore not initialized");
    return Promise.reject("Firestore not initialized");
  }
  
  if (!email) return Promise.resolve(false);
  
  try {
    // Normalize email to use as document ID (remove special chars)
    const normalizedEmail = email.toLowerCase().replace(/[.#$]/g, '_');
    
    // Get reference to failed logins document
    const failedLoginRef = doc(db, "failedLogins", normalizedEmail);
    const failedLoginSnap = await getDoc(failedLoginRef);
    
    if (failedLoginSnap.exists()) {
      // Update existing record
      const data = failedLoginSnap.data();
      const attempts = data.attempts || [];
      attempts.push(serverTimestamp());
      
      // Keep only the last 10 attempts
      const recentAttempts = attempts.slice(-10);
      
      await updateDoc(failedLoginRef, {
        attempts: recentAttempts,
        count: (data.count || 0) + 1,
        lastAttempt: serverTimestamp()
      });
    } else {
      // Create new record
      await setDoc(failedLoginRef, {
        email: email,
        attempts: [serverTimestamp()],
        count: 1,
        lastAttempt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    }
    
    console.log("Failed login attempt recorded");
    return true;
  } catch (error) {
    console.error("Error recording failed login attempt: ", error);
    return Promise.reject(error);
  }
}

/**
 * Check if login is allowed (not rate limited)
 * @param {string} email - Email address to check
 * @returns {Promise} - Promise that resolves with login status
 */
export async function checkLoginStatus(email) {
  // Default response (allowed)
  const defaultResponse = {
    allowed: true,
    attemptsRemaining: 5,
    remainingMinutes: 0
  };
  
  if (!db || !email) return Promise.resolve(defaultResponse);
  
  try {
    // Normalize email
    const normalizedEmail = email.toLowerCase().replace(/[.#$]/g, '_');
    
    // Get reference to failed logins document
    const failedLoginRef = doc(db, "failedLogins", normalizedEmail);
    const failedLoginSnap = await getDoc(failedLoginRef);
    
    if (!failedLoginSnap.exists()) {
      return defaultResponse;
    }
    
    const data = failedLoginSnap.data();
    const attempts = data.attempts || [];
    
    // If less than 5 attempts, login is allowed
    if (attempts.length < 5) {
      return {
        allowed: true,
        attemptsRemaining: 5 - attempts.length,
        remainingMinutes: 0
      };
    }
    
    // Get the timestamp of the 5th most recent attempt
    const fifthMostRecentAttempt = attempts[attempts.length - 5];
    
    // If no timestamp available, allow login
    if (!fifthMostRecentAttempt) {
      return defaultResponse;
    }
    
    // Convert to JavaScript Date
    const fifthMostRecentTime = fifthMostRecentAttempt.toDate ? 
      fifthMostRecentAttempt.toDate() : new Date(fifthMostRecentAttempt);
    
    // Calculate time difference in minutes
    const now = new Date();
    const diffMinutes = Math.floor((now - fifthMostRecentTime) / (1000 * 60));
    
    // If more than 15 minutes have passed since 5th attempt, allow login
    if (diffMinutes > 15) {
      return defaultResponse;
    }
    
    // Login is not allowed, return remaining time
    return {
      allowed: false,
      attemptsRemaining: 0,
      remainingMinutes: 15 - diffMinutes
    };
  } catch (error) {
    console.error("Error checking login status: ", error);
    // On error, allow login
    return defaultResponse;
  }
}

/**
 * Reset failed login attempts counter
 * @param {string} email - Email address to reset
 * @returns {Promise} - Promise that resolves when counter is reset
 */
export async function resetFailedLoginAttempts(email) {
  if (!db || !email) return Promise.resolve(false);
  
  try {
    // Normalize email
    const normalizedEmail = email.toLowerCase().replace(/[.#$]/g, '_');
    
    // Get reference to failed logins document
    const failedLoginRef = doc(db, "failedLogins", normalizedEmail);
    
    // Reset attempts
    await updateDoc(failedLoginRef, {
      attempts: [],
      count: 0,
      lastReset: serverTimestamp()
    });
    
    console.log("Failed login attempts reset");
    return true;
  } catch (error) {
    console.error("Error resetting failed login attempts: ", error);
    return Promise.reject(error);
  }
}
