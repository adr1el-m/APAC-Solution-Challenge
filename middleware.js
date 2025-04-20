import { NextResponse } from 'next/server';

export default function middleware(request) {
  // Get response for the request
  let response = NextResponse.next();
  
  // If the request is for env.js, replace placeholders with actual environment variables
  if (request.nextUrl.pathname === '/env.js') {
    const envContent = `
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
    
    return new NextResponse(envContent, {
      headers: {
        'Content-Type': 'application/javascript'
      }
    });
  }
  
  return response;
} 