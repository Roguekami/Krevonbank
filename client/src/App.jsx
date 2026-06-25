import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GlobalProvider } from './context/GlobalState';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import KYCOnboarding from './pages/KYCOnboarding';
import About from './pages/About';
import Support from './pages/Support';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import { PublicRoute, ProtectedRoute, VerifiedRoute, KYCApprovedRoute, AdminRoute } from './components/ProtectedRoutes';
import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './components/AdminLayout';
import CurrencySelector from './pages/CurrencySelector';
import Dashboard from './pages/Dashboard';
import Transfers from './pages/Transfers';
import TransactionHistory from './pages/TransactionHistory';
import Beneficiaries from './pages/Beneficiaries';
import AdminDashboard from './pages/AdminDashboard';
import Cards from './pages/Cards';
import FundAccount from './pages/FundAccount';
import Settings from './pages/Settings';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <GlobalProvider>
        <AuthProvider>
          <Router>
            <Routes>
            {/* Public Routes - Redirect to dashboard if logged in */}
            <Route element={<PublicRoute />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/about" element={<About />} />
              <Route path="/support" element={<Support />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
            </Route>

            {/* Verification & KYC - Minimal Layouts */}
            <Route element={<ProtectedRoute />}>
              <Route path="/verify-email" element={<VerifyEmail />} />
            </Route>
            
            <Route element={<VerifiedRoute />}>
              <Route path="/kyc-onboarding" element={<KYCOnboarding />} />
            </Route>

            {/* Dashboard Routes - Protected by KYC, uses DashboardLayout */}
            <Route element={<KYCApprovedRoute />}>
              <Route path="/currency-setup" element={<CurrencySelector />} />
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transfers" element={<Transfers />} />
                <Route path="/history" element={<TransactionHistory />} />
                <Route path="/beneficiaries" element={<Beneficiaries />} />
                <Route path="/cards" element={<Cards />} />
                <Route path="/fund-account" element={<FundAccount />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Admin Routes - uses AdminLayout */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard tab="users" />} />
                <Route path="/admin/kyc" element={<AdminDashboard tab="kyc" />} />
                <Route path="/admin/transactions" element={<AdminDashboard tab="transfers" />} />
                <Route path="/admin/all-transactions" element={<AdminDashboard tab="all-transactions" />} />
                <Route path="/admin/funding" element={<AdminDashboard tab="funding" />} />
                <Route path="/admin/cards" element={<AdminDashboard tab="cards" />} />
              </Route>
            </Route>
          </Routes>
        </Router>
        <Toaster 
          position="top-center" 
          toastOptions={{ 
            style: { background: '#152336', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } 
          }} 
        />
        </AuthProvider>
      </GlobalProvider>
    </ThemeProvider>
  );
}

export default App;
