/**
 * Firestore Database Integration for Pulsohana
 * 
 * This module handles the integration with Firebase Firestore for storing
 * and retrieving agricultural data, user profiles, and farm data.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { firebaseConfig } from '../config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Fetch user's farms data
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of farm objects
 */
export async function getUserFarms(userId) {
  try {
    const farmsQuery = query(
      collection(db, "farms"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(farmsQuery);
    const farms = [];
    
    querySnapshot.forEach((doc) => {
      farms.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return farms;
  } catch (error) {
    console.error("Error getting farms:", error);
    throw error;
  }
}

/**
 * Add a new farm
 * @param {Object} farmData - Farm data object
 * @returns {Promise<string>} ID of the created farm
 */
export async function addFarm(farmData) {
  try {
    const farmWithTimestamp = {
      ...farmData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "farms"), farmWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error adding farm:", error);
    throw error;
  }
}

/**
 * Update farm data
 * @param {string} farmId - Farm ID
 * @param {Object} farmData - Updated farm data
 * @returns {Promise<void>}
 */
export async function updateFarm(farmId, farmData) {
  try {
    const farmRef = doc(db, "farms", farmId);
    
    const updateData = {
      ...farmData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(farmRef, updateData);
  } catch (error) {
    console.error("Error updating farm:", error);
    throw error;
  }
}

/**
 * Delete a farm
 * @param {string} farmId - Farm ID
 * @returns {Promise<void>}
 */
export async function deleteFarm(farmId) {
  try {
    await deleteDoc(doc(db, "farms", farmId));
  } catch (error) {
    console.error("Error deleting farm:", error);
    throw error;
  }
}

/**
 * Get farm by ID
 * @param {string} farmId - Farm ID
 * @returns {Promise<Object|null>} Farm object or null if not found
 */
export async function getFarmById(farmId) {
  try {
    const farmRef = doc(db, "farms", farmId);
    const farmSnap = await getDoc(farmRef);
    
    if (farmSnap.exists()) {
      return {
        id: farmSnap.id,
        ...farmSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting farm:", error);
    throw error;
  }
}

/**
 * Add crop data to a farm
 * @param {string} farmId - Farm ID
 * @param {Object} cropData - Crop data
 * @returns {Promise<string>} ID of the created crop document
 */
export async function addCropToFarm(farmId, cropData) {
  try {
    const cropWithTimestamp = {
      ...cropData,
      farmId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "crops"), cropWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error adding crop:", error);
    throw error;
  }
}

/**
 * Get all crops for a farm
 * @param {string} farmId - Farm ID
 * @returns {Promise<Array>} Array of crop objects
 */
export async function getFarmCrops(farmId) {
  try {
    const cropsQuery = query(
      collection(db, "crops"),
      where("farmId", "==", farmId),
      orderBy("plantingDate", "desc")
    );
    
    const querySnapshot = await getDocs(cropsQuery);
    const crops = [];
    
    querySnapshot.forEach((doc) => {
      crops.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return crops;
  } catch (error) {
    console.error("Error getting crops:", error);
    throw error;
  }
}

/**
 * Save sensor data
 * @param {string} farmId - Farm ID
 * @param {Object} sensorData - Sensor data
 * @returns {Promise<string>} ID of the created sensor data document
 */
export async function saveSensorData(farmId, sensorData) {
  try {
    const dataWithTimestamp = {
      ...sensorData,
      farmId,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "sensorData"), dataWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error saving sensor data:", error);
    throw error;
  }
}

/**
 * Get recent sensor data for a farm
 * @param {string} farmId - Farm ID
 * @param {number} limit - Maximum number of records to retrieve
 * @returns {Promise<Array>} Array of sensor data objects
 */
export async function getRecentSensorData(farmId, limitCount = 100) {
  try {
    const dataQuery = query(
      collection(db, "sensorData"),
      where("farmId", "==", farmId),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(dataQuery);
    const sensorData = [];
    
    querySnapshot.forEach((doc) => {
      sensorData.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return sensorData;
  } catch (error) {
    console.error("Error getting sensor data:", error);
    throw error;
  }
}

/**
 * Save a disease detection result
 * @param {string} farmId - Farm ID
 * @param {Object} detectionData - Disease detection data
 * @returns {Promise<string>} ID of the created detection document
 */
export async function saveDiseaseDetection(farmId, detectionData) {
  try {
    const dataWithTimestamp = {
      ...detectionData,
      farmId,
      detectedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "diseaseDetections"), dataWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error saving disease detection:", error);
    throw error;
  }
}

/**
 * Get recent disease detections for a farm
 * @param {string} farmId - Farm ID
 * @returns {Promise<Array>} Array of disease detection objects
 */
export async function getRecentDiseaseDetections(farmId) {
  try {
    const detectionsQuery = query(
      collection(db, "diseaseDetections"),
      where("farmId", "==", farmId),
      orderBy("detectedAt", "desc"),
      limit(20)
    );
    
    const querySnapshot = await getDocs(detectionsQuery);
    const detections = [];
    
    querySnapshot.forEach((doc) => {
      detections.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return detections;
  } catch (error) {
    console.error("Error getting disease detections:", error);
    throw error;
  }
}

/**
 * Save user settings
 * @param {string} userId - User ID
 * @param {Object} settings - User settings
 * @returns {Promise<void>}
 */
export async function saveUserSettings(userId, settings) {
  try {
    const userRef = doc(db, "users", userId);
    
    const updateData = {
      settings: settings,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error("Error saving user settings:", error);
    throw error;
  }
}

/**
 * Get user settings
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User settings or null if not found
 */
export async function getUserSettings(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists() && userSnap.data().settings) {
      return userSnap.data().settings;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user settings:", error);
    throw error;
  }
}

/**
 * Save a crop analysis record to the user's history
 * @param {string} userId - User ID
 * @param {Object} analysisData - Analysis data to save
 * @returns {Promise<string>} ID of the created analysis record
 */
export async function saveCropAnalysis(userId, analysisData) {
  try {
    const analysisWithTimestamp = {
      ...analysisData,
      userId,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "cropAnalysis"), analysisWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error saving crop analysis:", error);
    throw error;
  }
}

/**
 * Get crop analysis history for a user
 * @param {string} userId - User ID
 * @param {number} limitCount - Maximum number of records to retrieve
 * @returns {Promise<Array>} Array of analysis history objects
 */
export async function getCropAnalysisHistory(userId, limitCount = 10) {
  try {
    const historyQuery = query(
      collection(db, "cropAnalysis"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(historyQuery);
    const history = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firebase timestamp to regular date if it exists
      const createdAt = data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date();
      
      history.push({
        id: doc.id,
        ...data,
        createdAt: createdAt
      });
    });
    
    return history;
  } catch (error) {
    console.error("Error getting crop analysis history:", error);
    throw error;
  }
}

/**
 * Get a specific crop analysis by ID
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<Object|null>} Analysis object or null if not found
 */
export async function getCropAnalysisById(analysisId) {
  try {
    const analysisRef = doc(db, "cropAnalysis", analysisId);
    const analysisSnap = await getDoc(analysisRef);
    
    if (analysisSnap.exists()) {
      const data = analysisSnap.data();
      // Convert Firebase timestamp to regular date if it exists
      const createdAt = data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date();
      
      return {
        id: analysisSnap.id,
        ...data,
        createdAt: createdAt
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting crop analysis:", error);
    throw error;
  }
}

/**
 * Delete a crop analysis from history
 * @param {string} analysisId - Analysis ID
 * @returns {Promise<void>}
 */
export async function deleteCropAnalysis(analysisId) {
  try {
    await deleteDoc(doc(db, "cropAnalysis", analysisId));
  } catch (error) {
    console.error("Error deleting crop analysis:", error);
    throw error;
  }
} 