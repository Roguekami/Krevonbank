import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', country: 'United Kingdom'
  });
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen bg-[#0B1221] flex items-center justify-center p-6 pt-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#152336] p-8 rounded-2xl border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#D4AF37] flex items-center justify-center font-bold text-[#0B1221] rounded-lg text-2xl mx-auto mb-4">K</div>
          <h2 className="text-3xl font-serif text-white">Create Account</h2>
          <p className="text-gray-400 mt-2">Join the global banking revolution</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Full Legal Name</label>
            <input required type="text" className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]" placeholder="John Arthur Smith" onChange={e => setFormData({...formData, fullName: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Email Address</label>
            <input required type="email" className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]" placeholder="john@example.com" onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Password</label>
            <input required type="password" minLength={8} className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]" placeholder="Minimum 8 characters" onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Country of Residence</label>
            <select required className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}>
              <option value="United Kingdom">United Kingdom</option>
              <option value="United States">United States</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Canada">Canada</option>
            </select>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} type="submit" className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold shadow-lg disabled:opacity-70">
            {loading ? 'Creating Account...' : 'Continue'}
          </motion.button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account? <Link to="/login" className="text-[#D4AF37] hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
