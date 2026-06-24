import React, { useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Globe, ArrowRightLeft, Bitcoin, Wallet, ShieldCheck, CreditCard } from 'lucide-react';

const stats = [
  { value: '150+', label: 'Countries Served' },
  { value: '$1T+', label: 'Transactions Processed' },
  { value: '10M+', label: 'Active Users' },
  { value: '99.9%', label: 'Platform Uptime' }
];

const features = [
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Manage accounts and assets worldwide from one secure platform. Send and receive money across borders with competitive exchange rates and minimal fees.'
  },
  {
    icon: ArrowRightLeft,
    title: 'Instant Transfers',
    description: 'Move funds internationally with speed and precision. Our operations team processes transfers swiftly with real-time status updates every step of the way.'
  },
  {
    icon: Bitcoin,
    title: 'Crypto Enabled',
    description: 'Fund your Krevon account using Bitcoin, Ethereum, or USDT across multiple networks. Bridging the gap between traditional banking and the crypto economy.'
  },
  {
    icon: Wallet,
    title: 'Multi-Currency Accounts',
    description: 'Hold balances in multiple currencies from a single account. Switch between USD, GBP, EUR, and more without the hassle of managing multiple bank accounts.'
  },
  {
    icon: ShieldCheck,
    title: 'Secure KYC Onboarding',
    description: 'Open your account entirely online in minutes. Our streamlined identity verification process gets you banking faster with no branch visits required.'
  },
  {
    icon: CreditCard,
    title: 'Premium Cards',
    description: 'Request virtual and physical debit cards instantly. Freeze, unfreeze, and set spending limits directly from your dashboard at any time.'
  }
];

const steps = [
  {
    number: '01',
    title: 'Create Your Account',
    description: 'Register online in minutes. Provide your basic details and verify your email address to get started.'
  },
  {
    number: '02',
    title: 'Verify Your Identity',
    description: 'Complete our secure KYC process by uploading your identity documents. Our compliance team reviews submissions within 24 to 48 hours.'
  },
  {
    number: '03',
    title: 'Start Banking',
    description: 'Fund your account, make transfers, request your card, and manage your finances from anywhere in the world.'
  }
];

const LandingPage = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.is_admin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-brand-navy font-sans">
      <Navbar />
      <main className="flex-grow">
        
        {/* Hero Section */}
        <section className="relative pt-20 pb-20 flex items-center min-h-[75vh]">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/90 to-transparent z-0"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-60 z-0"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-8 w-full text-left">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-white tracking-tight">
                Krevon: Global <br />
                Banking, Elevated.
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-xl leading-relaxed">
                Seamless international services, instant transfers, and effortless account opening. Your wealth, borderless.
              </p>
              
              <div className="flex flex-wrap items-center gap-6">
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
                    className="border border-white/30 hover:border-white text-white px-8 py-4 rounded-md font-bold text-lg backdrop-blur-sm transition-all"
                  >
                    Learn More
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="bg-[#111A2C] py-12 border-y border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-brand-gold mb-2">{stat.value}</div>
                  <div className="text-sm md:text-base text-gray-400 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-8 bg-brand-navy">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Everything You Need in One Platform</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Krevon brings together the best of traditional banking and modern fintech into a single powerful platform.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex flex-col items-start p-8 bg-[#111A2C] rounded-xl border border-white/5 hover:border-brand-gold/30 transition-colors shadow-lg"
                  >
                    <div className="w-14 h-14 rounded-lg bg-brand-gold/10 flex items-center justify-center mb-6 text-brand-gold">
                      <Icon size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-8 bg-[#0f172a]/80">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Banking Made Simple</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Get started with Krevon in three easy steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[1px] bg-white/10 w-[68%] mx-auto z-0"></div>

              {steps.map((step, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.5 }}
                  className="relative z-10 flex flex-col items-center text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-brand-navy border-2 border-brand-gold flex items-center justify-center text-3xl font-bold text-brand-gold mb-8 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed max-w-xs">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-8 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-gold/10 via-brand-navy to-brand-navy">
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Ready to Experience Global Banking?</h2>
              <p className="text-xl text-gray-300 mb-10 leading-relaxed">
                Join thousands of customers who trust Krevon with their finances every day. Open your account in minutes, no branch visit required.
              </p>
              <Link to="/register">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-brand-gold text-brand-navy px-10 py-4 rounded-md font-bold text-lg transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                >
                  Open Your Account Today
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

export default LandingPage;
