/**
 * Plant Disease Detection Module for Pulsohana
 * 
 * This module handles the plant disease detection functionality
 * using machine learning models and image processing.
 */

import { AI_CONFIG, GEMINI_API_KEY, GEMINI_MODEL } from '../config.js';
import { saveDiseaseDetection } from './firestoredb.js';

// DOM Elements
const imageUploadInput = document.getElementById('disease-image-upload');
const captureButton = document.getElementById('disease-capture-button');
const previewContainer = document.getElementById('disease-image-preview');
const previewImage = document.getElementById('preview-image');
const resultContainer = document.getElementById('disease-result-container');
const resultText = document.getElementById('disease-result-text');
const loadingIndicator = document.getElementById('disease-loading');
const treatmentInfo = document.getElementById('disease-treatment');
const preventionInfo = document.getElementById('disease-prevention');

let currentFarmId = null;
let capturedImage = null;

// Initialize the disease detection module
export function initDiseaseDection(farmId) {
  currentFarmId = farmId;
  
  if (imageUploadInput) {
    imageUploadInput.addEventListener('change', handleImageUpload);
  }
  
  if (captureButton) {
    captureButton.addEventListener('click', activateCamera);
  }
  
  console.log('Plant disease detection module initialized for farm:', farmId);
}

// Handle image upload from file
function handleImageUpload(event) {
  const file = event.target.files[0];
  
  if (file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      previewImage.src = e.target.result;
      capturedImage = e.target.result;
      
      // Show preview
      previewContainer.classList.remove('hidden');
      
      // Clear previous results
      clearResults();
    };
    
    reader.readAsDataURL(file);
  }
}

// Activate camera for capturing image
function activateCamera() {
  // Check if camera access is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Camera access is not supported by your browser');
    return;
  }
  
  // Create video element for camera preview
  const videoElement = document.createElement('video');
  videoElement.id = 'camera-preview';
  videoElement.autoplay = true;
  videoElement.width = 400;
  
  const canvasElement = document.createElement('canvas');
  canvasElement.style.display = 'none';
  
  // Replace preview with camera
  previewContainer.innerHTML = '';
  previewContainer.appendChild(videoElement);
  previewContainer.appendChild(canvasElement);
  
  // Add capture button
  const snapButton = document.createElement('button');
  snapButton.className = 'btn btn-primary mt-2';
  snapButton.innerText = 'Take Photo';
  previewContainer.appendChild(snapButton);
  
  // Show preview
  previewContainer.classList.remove('hidden');
  
  // Access camera
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function(stream) {
      videoElement.srcObject = stream;
      
      // Add event listener to capture button
      snapButton.addEventListener('click', function() {
        // Draw the current video frame on the canvas
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        canvasElement.getContext('2d').drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        
        // Get the image data
        capturedImage = canvasElement.toDataURL('image/jpeg');
        
        // Stop the camera stream
        stream.getTracks().forEach(track => track.stop());
        
        // Replace video with captured image
        previewContainer.innerHTML = '';
        const img = document.createElement('img');
        img.id = 'preview-image';
        img.src = capturedImage;
        img.style.maxWidth = '100%';
        previewContainer.appendChild(img);
        
        // Add analyze button
        const analyzeButton = document.createElement('button');
        analyzeButton.className = 'btn btn-success mt-2';
        analyzeButton.innerText = 'Analyze Disease';
        analyzeButton.addEventListener('click', function() {
          detectDisease(capturedImage);
        });
        previewContainer.appendChild(analyzeButton);
      });
    })
    .catch(function(error) {
      alert('Error accessing camera: ' + error.message);
      console.error('Error accessing camera:', error);
    });
}

// Clear previous results
function clearResults() {
  resultText.innerHTML = '';
  treatmentInfo.innerHTML = '';
  preventionInfo.innerHTML = '';
  resultContainer.classList.add('hidden');
}

// Detect disease from image
export async function detectDisease(imageDataUrl) {
  if (!imageDataUrl) {
    alert('Please select or capture an image first');
    return;
  }
  
  // Show loading indicator
  loadingIndicator.classList.remove('hidden');
  clearResults();
  
  try {
    // Prepare base64 image for the API
    const base64Image = imageDataUrl.split(',')[1];
    
    // Create payload for the API
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `${AI_CONFIG.diseaseDetection.prompt}\n\nRespond with a JSON object containing:\n- diseaseName: the detected disease or "healthy"\n- confidence: confidence level (high, medium, low)\n- description: brief description of the disease\n- treatment: 3-5 treatment steps\n- prevention: 3-5 prevention steps`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ]
    };
    
    // Call the Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      throw new Error('Unexpected API response format');
    }
    
    const responseText = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON object from the response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }
    
    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (e) {
      // If direct JSON parsing fails, try to clean the string
      const cleanedJson = jsonMatch[0].replace(/\n/g, ' ').replace(/\r/g, ' ');
      result = JSON.parse(cleanedJson);
    }
    
    displayResults(result);
    
    // Save the detection result to the database
    if (currentFarmId) {
      const detectionData = {
        diseaseName: result.diseaseName,
        confidence: result.confidence,
        description: result.description,
        imageUrl: imageDataUrl, // Store the image with the detection
        timestamp: new Date().toISOString()
      };
      
      await saveDiseaseDetection(currentFarmId, detectionData);
    }
    
  } catch (error) {
    console.error('Error detecting disease:', error);
    resultText.innerHTML = `<div class="alert alert-danger">
      Error: ${error.message || 'Failed to analyze the image'}
    </div>`;
    resultContainer.classList.remove('hidden');
  } finally {
    // Hide loading indicator
    loadingIndicator.classList.add('hidden');
  }
}

// Display the disease detection results
function displayResults(result) {
  // Create result HTML
  const confidenceClass = 
    result.confidence === 'high' ? 'text-success' :
    result.confidence === 'medium' ? 'text-warning' : 'text-danger';
  
  const isHealthy = result.diseaseName.toLowerCase() === 'healthy';
  const resultClass = isHealthy ? 'alert-success' : 'alert-warning';
  
  resultText.innerHTML = `
    <div class="alert ${resultClass}">
      <h4>${isHealthy ? 'Plant is Healthy' : result.diseaseName}</h4>
      <p><strong>Confidence:</strong> <span class="${confidenceClass}">${result.confidence}</span></p>
      <p>${result.description}</p>
    </div>
  `;
  
  // Create treatment steps
  if (!isHealthy && result.treatment && Array.isArray(result.treatment)) {
    let treatmentHTML = '<h5>Treatment Recommendations</h5><ol>';
    result.treatment.forEach(step => {
      treatmentHTML += `<li>${step}</li>`;
    });
    treatmentHTML += '</ol>';
    treatmentInfo.innerHTML = treatmentHTML;
  } else if (!isHealthy && result.treatment) {
    treatmentInfo.innerHTML = `<h5>Treatment Recommendations</h5><p>${result.treatment}</p>`;
  }
  
  // Create prevention steps
  if (!isHealthy && result.prevention && Array.isArray(result.prevention)) {
    let preventionHTML = '<h5>Prevention Measures</h5><ol>';
    result.prevention.forEach(step => {
      preventionHTML += `<li>${step}</li>`;
    });
    preventionHTML += '</ol>';
    preventionInfo.innerHTML = preventionHTML;
  } else if (!isHealthy && result.prevention) {
    preventionInfo.innerHTML = `<h5>Prevention Measures</h5><p>${result.prevention}</p>`;
  }
  
  // Show result container
  resultContainer.classList.remove('hidden');
} 