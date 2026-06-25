import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="relative pt-20 pb-32 flex items-center min-h-[80vh]">
      {/* Background Image Overlay - we use a placeholder gradient since we don't have the image asset yet */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/90 to-transparent z-0"></div>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-40 z-0"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6 text-gray-900 dark:text-white">
            Krevon: Global <br />
            Banking, Elevated.
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-10 max-w-xl leading-relaxed">
            Seamless international services, instant transfers, and effortless account opening. Your wealth, borderless.
          </p>
          
          <div className="flex items-center gap-6">
            <Link to="/register">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-brand-gold text-brand-navy px-8 py-4 rounded-md font-bold text-lg transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
              >
                Open Account
              </motion.button>
            </Link>
            <Link to="/about">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-white/30 hover:border-white text-gray-900 dark:text-white px-8 py-4 rounded-md font-bold text-lg backdrop-blur-sm transition-all"
              >
                Learn More
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
