import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { countries } from '../utils/countries';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', country: 'United Kingdom'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.autoVerified) {
        toast.success('Account created! You can now log in.', { duration: 5000 });
      } else {
        toast.success(res.data.message || 'Check your email to verify your account.', { duration: 6000 });
      }
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1221] flex items-center justify-center p-6 pt-24 transition-colors duration-200">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-[#152336] p-8 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl dark:shadow-2xl transition-colors duration-200"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#D4AF37] flex items-center justify-center font-bold text-[#0B1221] rounded-lg text-2xl mx-auto mb-4">K</div>
          <h2 className="text-3xl font-serif text-gray-900 dark:text-white transition-colors duration-200">Create Account</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 transition-colors duration-200">Join the global banking revolution</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-200">Full Legal Name</label>
            <input required type="text" className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] transition-colors duration-200" placeholder="John Arthur Smith" onChange={e => setFormData({...formData, fullName: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-200">Email Address</label>
            <input required type="email" className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] transition-colors duration-200" placeholder="john@example.com" onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-200">Password</label>
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} minLength={8} className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] transition-colors duration-200" placeholder="Minimum 8 characters" onChange={e => setFormData({...formData, password: e.target.value})} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-200">Country of Residence</label>
            <select required className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] transition-colors duration-200" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}>
              <option value="" disabled>Select your country</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} type="submit" className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold shadow-lg disabled:opacity-70">
            {loading ? 'Creating Account...' : 'Continue'}
          </motion.button>
        </form>

        <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-sm transition-colors duration-200">
          Already have an account? <Link to="/login" className="text-[#D4AF37] hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
