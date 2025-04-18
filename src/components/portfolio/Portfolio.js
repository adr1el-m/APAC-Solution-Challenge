import React, { useEffect } from 'react';
import Hero from './Hero';
import Projects from './Projects';
import Contact from './Contact';

const Portfolio = () => {
  useEffect(() => {
    // Load chatbot script
    const script = document.createElement('script');
    script.src = '/chatbot.js';
    script.type = 'module';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      // Clean up on unmount
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Projects />
      <Contact />
    </div>
  );
};

export default Portfolio; 