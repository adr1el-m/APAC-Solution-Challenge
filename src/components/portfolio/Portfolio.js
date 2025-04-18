import React from 'react';
import Hero from './Hero';
import Projects from './Projects';
import Contact from './Contact';

const Portfolio = () => {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Projects />
      <Contact />
    </div>
  );
};

export default Portfolio; 