import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Monitor, Smartphone, Globe, Clock, Trash2, Shield, Phone, MapPin, Loader2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const parseUserAgent = (uaString) => {
  if (!uaString) return { browser: 'Unknown', os: 'Unknown', isMobile: false };
  let browser = 'Unknown';
  let os = 'Unknown';

  if (uaString.includes('Firefox')) browser = 'Firefox';
  else if (uaString.includes('SamsungBrowser')) browser = 'Samsung Internet';
  else if (uaString.includes('Opera') || uaString.includes('OPR')) browser = 'Opera';
  else if (uaString.includes('Edg')) browser = 'Edge';
  else if (uaString.includes('Chrome')) browser = 'Chrome';
  else if (uaString.includes('Safari')) browser = 'Safari';

  if (uaString.includes('Win')) os = 'Windows';
  else if (uaString.includes('Mac')) os = 'MacOS';
  else if (uaString.includes('Linux')) os = 'Linux';
  else if (uaString.includes('Android')) os = 'Android';
  else if (uaString.includes('iPhone') || uaString.includes('iPad')) os = 'iOS';

  const isMobile = /Mobi|Android|iPhone/i.test(uaString);

  return { browser, os, isMobile };
};

const Settings = () => {
  const { user, fetchUser } = useContext(AuthContext);
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [sessions, setSessions] = useState([]);
  const [currentJti, setCurrentJti] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [updatingAddress, setUpdatingAddress] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setPhoneNumber(user.phoneNumber || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const res = await api.get('/settings/sessions');
      setSessions(res.data.sessions || []);
      setCurrentJti(res.data.currentJti);
    } catch (err) {
      toast.error('Failed to load active sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    setUpdatingPhone(true);
    try {
      await api.patch('/settings/phone', { phoneNumber });
      toast.success('Phone number updated successfully');
      await fetchUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update phone number');
    } finally {
      setUpdatingPhone(false);
    }
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    setUpdatingAddress(true);
    try {
      await api.patch('/settings/address', { address });
      toast.success('Address updated successfully');
      await fetchUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update address');
    } finally {
      setUpdatingAddress(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    setUpdatingPassword(true);
    try {
      await api.patch('/settings/password', { password });
      toast.success('Password updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleTerminateSession = async (id) => {
    try {
      await api.delete(`/settings/sessions/${id}`);
      toast.success('Session terminated');
      loadSessions();
    } catch (err) {
      toast.error('Failed to terminate session');
    }
  };

  const handleTerminateAllOtherSessions = async () => {
    try {
      await api.delete('/settings/sessions');
      toast.success('All other sessions terminated');
      loadSessions();
    } catch (err) {
      toast.error('Failed to terminate sessions');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile & Security Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your personal information, security preferences, and active sessions.</p>
      </div>

      {/* Personal Information Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#152336] border border-white/5 rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]">
            <User size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Full Name</label>
              <div className="bg-gray-50 dark:bg-[#0B1221]/50 border border-white/5 rounded-lg px-4 py-3 text-gray-900 dark:text-white/50 cursor-not-allowed">
                {user?.fullName}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Email Address</label>
              <div className="bg-gray-50 dark:bg-[#0B1221]/50 border border-white/5 rounded-lg px-4 py-3 text-gray-900 dark:text-white/50 cursor-not-allowed">
                {user?.email}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Country of Residence</label>
              <div className="bg-gray-50 dark:bg-[#0B1221]/50 border border-white/5 rounded-lg px-4 py-3 text-gray-900 dark:text-white/50 cursor-not-allowed flex items-center gap-2">
                <Globe size={18} />
                {user?.country}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <form onSubmit={handleUpdatePhone} className="flex flex-col md:flex-row items-end gap-4 mb-6">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                  <Phone size={16} /> Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <button 
                type="submit" 
                disabled={updatingPhone}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {updatingPhone ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Save Phone'}
              </button>
            </form>

            <form onSubmit={handleUpdateAddress} className="flex flex-col items-end gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                  <MapPin size={16} /> Residential Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows="3"
                  className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition-colors resize-none"
                  placeholder="Enter your full residential address"
                />
              </div>
              <button 
                type="submit"
                disabled={updatingAddress}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {updatingAddress ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Save Address'}
              </button>
            </form>
          </div>
        </div>
      </motion.section>

      {/* Security Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#152336] border border-white/5 rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]">
            <Shield size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security</h2>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Lock size={16} /> New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="Min. 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Lock size={16} /> Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="Confirm new password"
              />
            </div>
            <div className="pt-2">
              <button 
                type="submit"
                disabled={updatingPassword || !password || !confirmPassword}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {updatingPassword ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </motion.section>

      {/* Active Sessions Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#152336] border border-white/5 rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]">
              <Monitor size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Sessions</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Devices currently logged into your account</p>
            </div>
          </div>
          
          {sessions.length > 1 && (
            <button 
              onClick={handleTerminateAllOtherSessions}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg font-medium hover:bg-red-500/20 transition-colors text-sm"
            >
              <LogOut size={16} />
              Terminate All Other Sessions
            </button>
          )}
        </div>
        
        <div className="p-0">
          {sessionsLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 size={24} className="animate-spin text-[#D4AF37]" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
              No active sessions found.
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {sessions.map(session => {
                const isCurrent = session.jwt_jti === currentJti;
                const { browser, os, isMobile } = parseUserAgent(session.device);
                const activeDate = new Date(session.last_active).toLocaleString();
                
                return (
                  <div key={session.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-50 dark:bg-[#0B1221] rounded-lg text-gray-600 dark:text-gray-400 shrink-0">
                        {isMobile ? <Smartphone size={24} /> : <Monitor size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{os} • {browser}</h3>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full">
                              Current Session
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <p className="flex items-center gap-1">
                            <MapPin size={14} /> {session.location || 'Unknown Location'} ({session.ip_address})
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock size={14} /> Last active: {activeDate}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {!isCurrent && (
                      <button 
                        onClick={() => handleTerminateSession(session.id)}
                        className="self-start md:self-center flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                        Terminate
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default Settings;
