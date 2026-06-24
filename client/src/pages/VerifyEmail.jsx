import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verifying your email address...');
  const navigate = useNavigate();
  const { fetchUser } = useContext(AuthContext);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.data.message);
        await fetchUser();
        // Redirect to KYC after 3 seconds
        setTimeout(() => {
          navigate('/kyc-onboarding');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may be expired.');
      }
    };

    verify();
  }, [token, navigate, fetchUser]);

  return (
    <div className="min-h-screen bg-[#0B1221] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#152336] p-8 rounded-2xl border border-white/10 text-center shadow-2xl"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader className="w-16 h-16 text-[#D4AF37] animate-spin mb-6" />
            <h2 className="text-2xl font-serif text-white mb-2">Verifying</h2>
            <p className="text-gray-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-green-500/20 p-4 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </motion.div>
            <h2 className="text-2xl font-serif text-white mb-2">Email Verified!</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to Identity Verification...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-red-500/20 p-4 rounded-full mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </motion.div>
            <h2 className="text-2xl font-serif text-white mb-2">Verification Failed</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <button 
              onClick={() => navigate('/login')}
              className="bg-[#D4AF37] text-[#0B1221] px-6 py-2 rounded-md font-semibold"
            >
              Go to Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;

