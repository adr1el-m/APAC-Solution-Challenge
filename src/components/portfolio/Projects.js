import React from 'react';
import { motion } from 'framer-motion';

const Projects = () => {
  const projects = [
    {
      title: 'Crop Disease Detection',
      description: 'Advanced AI-powered system that identifies crop diseases in real-time using computer vision. Helps farmers take immediate action to protect their yields.',
      tech: ['TensorFlow', 'Computer Vision', 'React Native', 'Cloud API'],
      image: '/projects/crop-disease.jpg',
      link: '#disease-detection'
    },
    {
      title: 'Smart Irrigation System',
      description: 'IoT-based irrigation management system that optimizes water usage based on soil conditions, weather forecasts, and crop requirements.',
      tech: ['IoT Sensors', 'Machine Learning', 'Weather API', 'MongoDB'],
      image: '/projects/smart-irrigation.jpg',
      link: '#smart-irrigation'
    },
    {
      title: 'Yield Prediction',
      description: 'Machine learning model that predicts crop yields based on historical data, weather patterns, and soil conditions to help farmers make informed decisions.',
      tech: ['Python', 'Scikit-learn', 'Data Analytics', 'PostgreSQL'],
      image: '/projects/yield-prediction.jpg',
      link: '#yield-prediction'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <section id="projects" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Smart Agricultural Solutions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Innovative technology solutions designed to revolutionize farming practices
            and improve agricultural productivity
          </p>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {projects.map((project, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300"
            >
              <div className="h-48 bg-green-100 relative">
                {project.image && (
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {project.title}
                </h3>
                <p className="text-gray-600 mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tech.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <a
                  href={project.link}
                  className="inline-flex items-center text-green-700 hover:text-green-800 transition duration-300"
                >
                  Learn More
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Projects; 