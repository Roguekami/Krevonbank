import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: 'â‚¬' },
  { code: 'GBP', name: 'British Pound', symbol: 'Â£' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: 'Â¥' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: 'â‚¦' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GHâ‚µ' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
];

const CurrencySelector = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSetup = async () => {
    setLoading(true);
    try {
      await api.post('/account/setup', { currency: selectedCurrency });
      toast.success('Account setup complete!');
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 409) {
        navigate('/dashboard'); // Already setup
      } else {
        toast.error(error.response?.data?.message || 'Failed to setup account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1221] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-white dark:bg-[#152336] p-10 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl text-center"
      >
        <h1 className="text-4xl font-serif text-[#D4AF37] mb-4">Welcome, {user?.full_name?.split(' ')[0]}!</h1>
        <p className="text-gray-700 dark:text-gray-300 text-lg mb-8">
          Your identity verification has been approved. To finalize your account setup, please select your primary operating currency.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 text-left">
          {currencies.map(c => (
            <div 
              key={c.code}
              onClick={() => setSelectedCurrency(c.code)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedCurrency === c.code 
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10' 
                  : 'border-white/5 bg-gray-50 dark:bg-[#0B1221]/50 hover:border-white/20'
              }`}
            >
              <div className="text-[#D4AF37] font-bold text-lg mb-1">{c.symbol} {c.code}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{c.name}</div>
            </div>
          ))}
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          disabled={loading}
          onClick={handleSetup}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold text-lg shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-70"
        >
          {loading ? 'Setting up...' : 'Create My Account'}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default CurrencySelector;

