import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const PublicRoute = () => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="min-h-screen bg-[#0B1221] flex items-center justify-center text-[#D4AF37]">Loading...</div>;
  if (user) {
    return user.is_admin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

export const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="min-h-screen bg-[#0B1221] flex items-center justify-center text-[#D4AF37]">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export const VerifiedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="min-h-screen bg-[#0B1221] flex items-center justify-center text-[#D4AF37]">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isVerified) return (
    <div className="min-h-screen bg-[#0B1221] flex flex-col items-center justify-center text-white p-6 text-center">
      <h1 className="text-2xl font-serif text-[#D4AF37] mb-2">Verification Required</h1>
      <p className="text-gray-400">Please verify your email address to continue.</p>
    </div>
  );
  return <Outlet />;
};

export const KYCApprovedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="min-h-screen bg-[#0B1221] flex items-center justify-center text-[#D4AF37]">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isVerified) return <Navigate to="/verify-email" replace />;
  if (user.kycStatus !== 'approved') return <Navigate to="/kyc-onboarding" replace />;
  return <Outlet />;
};

export const AdminRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="min-h-screen bg-[#0B1221] flex items-center justify-center text-[#D4AF37]">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/login" replace />;
  return <Outlet />;
};
