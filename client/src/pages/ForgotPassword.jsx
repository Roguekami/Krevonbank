import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.devResetLink) {
        console.log('%c[DEV MODE] Password Reset Link:', 'color: #D4AF37; font-weight: bold; font-size: 14px;', res.data.devResetLink);
      }
      toast.success(res.data.message);
      setSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request reset link.');
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
          <h2 className="text-3xl font-serif text-white">Reset Password</h2>
          <p className="text-gray-400 mt-2">Enter your email to receive a reset link</p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Email Address</label>
              <input required type="email" className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} type="submit" className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold shadow-lg disabled:opacity-70">
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </motion.button>
          </form>
        ) : (
          <div className="text-center bg-[#0B1221] p-6 rounded-xl border border-white/5">
            <svg className="w-16 h-16 text-[#D4AF37] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            <h3 className="text-xl text-white font-medium mb-2">Check your inbox</h3>
            <p className="text-gray-400 text-sm mb-4">We've sent a password reset link to <br/><span className="text-white font-medium">{email}</span></p>
          </div>
        )}

        <p className="text-center text-gray-400 mt-6 text-sm">
          Remember your password? <Link to="/login" className="text-[#D4AF37] hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
