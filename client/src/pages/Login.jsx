import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { fetchUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      toast.success(res.data.message);
      const userData = await fetchUser(); // Update global state
      // Route admins to admin panel, regular users to dashboard
      if (userData?.is_admin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1221] flex items-center justify-center p-6 pt-24">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#152336] p-8 rounded-2xl border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#D4AF37] flex items-center justify-center font-bold text-[#0B1221] rounded-lg text-2xl mx-auto mb-4">K</div>
          <h2 className="text-3xl font-serif text-white">Welcome Back</h2>
          <p className="text-gray-400 mt-2">Sign in to your secure portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Email Address</label>
            <input required type="email" className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]" placeholder="john@example.com" onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm text-gray-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-[#D4AF37] hover:underline">Forgot password?</Link>
            </div>
            <input required type="password" className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]" placeholder="••••••••" onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} type="submit" className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold shadow-lg disabled:opacity-70">
            {loading ? 'Authenticating...' : 'Sign In'}
          </motion.button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Don't have an account? <Link to="/register" className="text-[#D4AF37] hover:underline">Open Account</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
