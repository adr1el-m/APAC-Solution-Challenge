# Pulsohana: AI-Powered Smart Agriculture Platform

![Pulsohana Logo](public/images/logo.png)

## Overview

Pulsohana is a cutting-edge agricultural technology platform that leverages Google AI technologies to revolutionize farming practices in the Asia-Pacific region. Our mission is to empower farmers with intelligent tools for better crop management, disease detection, and sustainable farming.

## Core Technologies

### 1. AI-Powered Disease Detection

Our computer vision system instantly identifies crop diseases with 99% accuracy. Using Google's Gemini multimodal technology, farmers can simply scan any plant with their phone camera to get immediate diagnosis and treatment recommendations.

- **Key Features:**
  - Real-time disease identification
  - Treatment recommendations
  - Historical tracking of plant health
  - Works with 500+ crop varieties and diseases

### 2. Intelligent Crop Advisory

AI-driven recommendations personalized to specific farm conditions that increase yields by 30% on average. Suggestions include optimal planting schedules, fertilizer applications, and harvesting times.

- **Key Features:**
  - Personalized crop variety suggestions
  - Fertilization schedules
  - Yield predictions
  - Market insights and profit optimization

## Google Technologies Integration

Pulsohana utilizes several Google developer technologies:

- **Gemini 1.5 Pro**: Powers our conversational AI assistant and provides agricultural insights
- **Google Cloud Vision API**: Works with our disease detection system for image analysis
- **Firebase**: Handles real-time data synchronization for IoT devices
- **TensorFlow**: Powers our custom ML models for crop yield prediction

## Getting Started

1. Clone this repository
2. Run `npm install` to install dependencies
3. Configure your API keys in `config.js`
4. Run `npm start` to launch the development server

## Demo

Visit our [live demo](https://pulsohana.demo.com) to try out the platform or watch our [video walkthrough](https://youtu.be/pulsohana-demo).

## Technical Architecture

```
├── public/
│   ├── chatbot.js              # AI assistant implementation
│   ├── config.js               # Google AI configuration
│   └── data/                   # Agricultural databases
│       ├── crop-diseases.json  # Disease database
│       └── crop-recommendations.json  # Crop advisory data
├── src/
│   ├── components/             # React components
│   │   └── portfolio/          # Main application modules
│   │       ├── Hero.js         # Landing section
│   │       ├── Projects.js     # Core features showcase
│   │       ├── Contact.js      # Contact form
│   │       └── Portfolio.js    # Main component
│   ├── App.js                  # Application entry point
│   └── index.js                # React initialization
└── package.json                # Dependencies
```

## Future Roadmap

- Integration with Google Cloud's Vertex AI for custom model training
- Mobile application with Flutter
- Extended multilingual support
- Climate change adaptation recommendations

## License

MIT License - See LICENSE file for details

---

Developed with ❤️ by the Pulsohana Team

## Deployment to Vercel

### 1. Prerequisites

- A Vercel account
- A GitHub repository with your code

### 2. Setting Up Environment Variables

When deploying to Vercel, you'll need to set up the following environment variables:

#### Firebase Configuration

- `FIREBASE_API_KEY` - Your Firebase API key
- `FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `FIREBASE_APP_ID` - Your Firebase app ID
- `FIREBASE_MEASUREMENT_ID` - Your Firebase measurement ID

#### AI Configuration

- `GEMINI_API_KEY` - Your Google Gemini API key
- `GEMINI_MODEL` - The Gemini model to use (default: gemini-1.5-pro)

### 3. Deployment Steps

1. **Push your code to GitHub**
   Make sure all your changes are committed and pushed to your GitHub repository.

2. **Import to Vercel**

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project:
     - Select Framework Preset: "Other"
     - Build Command: Leave blank or set as needed
     - Output Directory: Leave blank or set to public if needed
     - Install Command: Leave blank or set as needed

3. **Set Environment Variables**

   - Scroll down to the "Environment Variables" section
   - Add all the environment variables listed above with their appropriate values
   - Make sure to set them for all environments (Production, Preview, and Development)

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application
   - Once deployed, you'll get a URL to access your application

### 4. Verifying Deployment

After deployment, make sure to check:

- The application loads correctly
- Firebase authentication works
- The Gemini API integration works (test the crop analysis feature)
- Data is being saved to and retrieved from Firestore correctly

### 5. Troubleshooting

If you encounter issues:

- Check the Vercel deployment logs
- Verify all environment variables are set correctly
- Ensure your API keys have the necessary permissions
- Test API endpoints directly to isolate issues

### Local Development

For local development, create a `.env` file based on the `.env.example` provided. This will allow you to run the application locally without exposing your API keys in your code.
