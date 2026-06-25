import React from 'react';
import { Globe, ArrowRightLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="flex flex-col items-center text-center p-8 bg-brand-navy/50 rounded-xl border border-white/5 hover:border-brand-gold/30 transition-colors"
  >
    <div className="w-16 h-16 rounded-full bg-brand-navy border border-brand-gold/30 flex items-center justify-center mb-6 text-brand-gold">
      <Icon size={32} strokeWidth={1.5} />
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
  </motion.div>
);

const Features = () => {
  return (
    <div className="py-24 bg-brand-dark/40 border-t border-brand-gold/20">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-center mb-16">
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-brand-gold to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <FeatureCard 
            icon={Globe}
            title="Global Reach."
            description="Manage accounts and assets worldwide from one secure platform. Seamlessly connect your finances across borders."
            delay={0.1}
          />
          <FeatureCard 
            icon={ArrowRightLeft}
            title="Instant Transfers."
            description="Move funds internationally with competitive rates and zero hidden fees. Experience the speed of modern banking."
            delay={0.2}
          />
          <FeatureCard 
            icon={Shield}
            title="Premium Services."
            description="Dedicated concierge and exclusive financial solutions tailored for your unique wealth management needs."
            delay={0.3}
          />
        </div>
      </div>
    </div>
  );
};

export default Features;
