// API endpoint that injects environment variables
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Set content type to JavaScript
  res.setHeader('Content-Type', 'application/javascript');
  
  // Create JavaScript with environment variables
  const jsContent = `
    window.__ENV = {
      FIREBASE_API_KEY: '${process.env.FIREBASE_API_KEY || ''}',
      FIREBASE_AUTH_DOMAIN: '${process.env.FIREBASE_AUTH_DOMAIN || ''}',
      FIREBASE_PROJECT_ID: '${process.env.FIREBASE_PROJECT_ID || ''}',
      FIREBASE_STORAGE_BUCKET: '${process.env.FIREBASE_STORAGE_BUCKET || ''}',
      FIREBASE_MESSAGING_SENDER_ID: '${process.env.FIREBASE_MESSAGING_SENDER_ID || ''}',
      FIREBASE_APP_ID: '${process.env.FIREBASE_APP_ID || ''}',
      FIREBASE_MEASUREMENT_ID: '${process.env.FIREBASE_MEASUREMENT_ID || ''}',
      GEMINI_API_KEY: '${process.env.GEMINI_API_KEY || ''}',
      GEMINI_MODEL: '${process.env.GEMINI_MODEL || 'gemini-1.5-pro'}'
    };
  `;
  
  // Send the JavaScript content
  res.status(200).send(jsContent);
} 