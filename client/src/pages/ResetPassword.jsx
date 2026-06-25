import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match.');
    }
    if (password.length < 8) {
      return toast.error('Password must be at least 8 characters.');
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      toast.success(res.data.message);
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1221] flex items-center justify-center p-6 pt-24 transition-colors duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-[#152336] p-8 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl dark:shadow-2xl transition-colors duration-200"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#D4AF37] flex items-center justify-center font-bold text-[#0B1221] rounded-lg text-2xl mx-auto mb-4">K</div>
          <h2 className="text-3xl font-serif text-gray-900 dark:text-white transition-colors duration-200">Create New Password</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 transition-colors duration-200">Please enter your new secure password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-200">New Password</label>
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] transition-colors duration-200" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-200">Confirm New Password</label>
            <div className="relative">
              <input required type={showConfirmPassword ? "text" : "password"} className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] transition-colors duration-200" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} type="submit" className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold shadow-lg disabled:opacity-70">
            {loading ? 'Resetting...' : 'Reset Password'}
          </motion.button>
        </form>

        <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-sm transition-colors duration-200">
          Remembered it? <Link to="/login" className="text-[#D4AF37] hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
