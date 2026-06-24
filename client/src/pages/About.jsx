import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Globe, Award, Zap, Wallet, Bitcoin, Eye, Lock, Users, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const stats = [
  { value: '150+', label: 'Countries Served' },
  { value: '$1T+', label: 'Transactions Processed' },
  { value: '10M+', label: 'Active Users' },
  { value: '99.9%', label: 'Platform Uptime' }
];

const features = [
  {
    icon: <Globe className="w-6 h-6 text-brand-gold" />,
    title: 'Global Reach',
    description: 'Access your funds and transfer money seamlessly across borders with minimal fees and real-time exchange rates. Wherever you are in the world, your money moves with you.'
  },
  {
    icon: <Shield className="w-6 h-6 text-brand-gold" />,
    title: 'Bank-Grade Security',
    description: 'Your assets are protected with military-grade encryption, secure document storage, and comprehensive audit logging across every account action. Your security is our responsibility.'
  },
  {
    icon: <Zap className="w-6 h-6 text-brand-gold" />,
    title: 'Lightning Fast',
    description: 'Experience rapid international transfers and real-time notifications for every transaction. Our operations team works around the clock to process your requests as quickly as possible.'
  },
  {
    icon: <Award className="w-6 h-6 text-brand-gold" />,
    title: 'Premium Support',
    description: 'Get access to our dedicated support team for any assistance you need. From account queries to transaction disputes, we are always here to help.'
  },
  {
    icon: <Wallet className="w-6 h-6 text-brand-gold" />,
    title: 'Multi-Currency Accounts',
    description: 'Hold, send, and receive in multiple currencies from a single account. No more juggling multiple bank accounts across different countries.'
  },
  {
    icon: <Bitcoin className="w-6 h-6 text-brand-gold" />,
    title: 'Crypto Enabled',
    description: 'Fund your account using Bitcoin, Ethereum, or USDT across multiple networks. Krevon bridges the gap between traditional banking and the crypto economy.'
  }
];

const values = [
  {
    icon: <Eye className="w-6 h-6 text-brand-gold" />,
    title: 'Transparency',
    description: 'We believe banking should be clear and straightforward. No hidden fees, no confusing terms, no surprises.'
  },
  {
    icon: <Lock className="w-6 h-6 text-brand-gold" />,
    title: 'Security',
    description: 'The safety of your funds and personal information is our highest priority. We implement industry-leading security practices across every layer of our platform.'
  },
  {
    icon: <Users className="w-6 h-6 text-brand-gold" />,
    title: 'Inclusion',
    description: 'We built Krevon so that anyone, anywhere in the world, can access premium banking services regardless of where they live or who they bank with.'
  },
  {
    icon: <Lightbulb className="w-6 h-6 text-brand-gold" />,
    title: 'Innovation',
    description: 'We are constantly evolving our platform to bring you faster, smarter, and more powerful financial tools.'
  }
];

const About = () => {
  return (
    <div className="min-h-screen bg-brand-navy flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-gold/10 via-brand-navy to-brand-navy pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                Elevating Global Banking
              </h1>
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-10">
                Krevon was founded on a single mission to make premium international banking accessible to everyone, everywhere. We combine the trust of traditional banking with the speed and innovation of modern fintech, delivering a seamless financial experience across borders.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="pb-20 px-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center backdrop-blur-sm"
                >
                  <div className="text-3xl md:text-4xl font-bold text-brand-gold mb-2">{stat.value}</div>
                  <div className="text-sm md:text-base text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20 px-8 bg-[#0B1221]">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Our Story</h2>
              <div className="text-lg text-gray-300 space-y-6 text-left md:text-center leading-relaxed">
                <p>
                  Krevon was established in London with a vision to break down the barriers of traditional banking. We recognised that millions of individuals and businesses around the world were underserved by legacy financial institutions facing high fees, slow transfers, and limited access to global markets.
                </p>
                <p>
                  We built Krevon to change that. From our headquarters in the heart of London, we serve customers across the globe, offering multi-currency accounts, instant international transfers, crypto-enabled funding, and premium card services all within a single secure platform.
                </p>
                <p>
                  Our platform is built on a foundation of trust, transparency, and technology. Every feature we build, every decision we make, is guided by one question: does this make banking better for our customers?
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Choose Krevon Section */}
        <section className="py-20 px-8 bg-[#0f172a]/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Why Choose <span className="text-brand-gold">Krevon</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Discover the features that make Krevon the preferred choice for forward-thinking individuals and businesses worldwide.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 p-8 rounded-xl hover:bg-white/10 transition-colors h-full flex flex-col"
                >
                  <div className="w-12 h-12 bg-brand-gold/10 rounded-lg flex items-center justify-center mb-6 shrink-0">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed flex-grow">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 px-8 bg-brand-navy">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What We Stand For</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center px-4"
                >
                  <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Section */}
        <section className="py-24 px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-gold/5 pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Experience Global Banking?
              </h2>
              <p className="text-xl text-gray-300 mb-10">
                Join thousands of customers who trust Krevon with their finances every day.
              </p>
              <Link to="/register">
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  className="bg-brand-gold text-brand-navy px-10 py-4 rounded-md font-bold text-lg transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                >
                  Open Your Account
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default About;
