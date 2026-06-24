import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Users, FileCheck, DollarSign, Activity, CreditCard, LogOut, Menu, X, History } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const AdminLayout = () => {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) { /* ignore */ }
    setUser(null);
    navigate('/');
  };

  const navItems = [
    { name: 'User Management', path: '/admin', icon: Users },
    { name: 'KYC Reviews', path: '/admin/kyc', icon: FileCheck },
    { name: 'Funding Requests', path: '/admin/funding', icon: DollarSign },
    { name: 'Pending Transfers', path: '/admin/transactions', icon: Activity },
    { name: 'All Transactions', path: '/admin/all-transactions', icon: History },
    { name: 'Card Requests', path: '/admin/cards', icon: CreditCard },
  ];

  /* Shared sidebar content used by both desktop and mobile */
  const sidebarContent = (onNavClick) => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link to="/admin" className="flex items-center gap-3" onClick={onNavClick}>
          <div className="w-8 h-8 bg-[#D4AF37] flex items-center justify-center font-bold text-[#0B1221] rounded-sm">K</div>
          <span className="text-2xl font-bold text-white tracking-wide">Admin</span>
        </Link>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* User info & sign out */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#152336] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold">
            {user?.full_name?.charAt(0) || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#0B1221] font-sans">
      {/* ── Desktop Sidebar (md+) ── */}
      <aside className="w-64 bg-[#111A2C] border-r border-gray-800 flex-col hidden md:flex">
        {sidebarContent(undefined)}
      </aside>

      {/* ── Mobile Overlay Sidebar (<md) ── */}
      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Slide-out panel */}
      <aside
        className="md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-[#111A2C] border-r border-gray-800 flex flex-col"
        style={{
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Close button in mobile sidebar header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <Link to="/admin" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-8 h-8 bg-[#D4AF37] flex items-center justify-center font-bold text-[#0B1221] rounded-sm">K</div>
            <span className="text-2xl font-bold text-white tracking-wide">Admin</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* User info & sign out */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#152336] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0B1221]">
        {/* Mobile Header with hamburger */}
        <header className="md:hidden bg-[#111A2C] border-b border-gray-800 p-4 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4AF37] flex items-center justify-center font-bold text-[#0B1221] rounded-sm">K</div>
            <span className="text-xl font-bold text-white tracking-wide">Admin</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-gray-400 hover:text-white transition-colors p-2"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
