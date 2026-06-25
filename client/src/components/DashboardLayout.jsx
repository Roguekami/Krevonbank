import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, Plus, CreditCard, Clock, Users, LogOut, Menu, X, Settings as SettingsIcon, MessageCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const DashboardLayout = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set Tawk.to visitor attributes so support agents see the user's identity
  useEffect(() => {
    if (!user) return;
    const setTawkAttributes = () => {
      if (window.Tawk_API && typeof window.Tawk_API.setAttributes === 'function') {
        window.Tawk_API.setAttributes(
          {
            name: user.fullName || user.full_name || 'Krevon User',
            email: user.email || '',
          },
          function (error) {
            if (error) console.warn('Tawk.to setAttributes error:', error);
          }
        );
      }
    };
    // If widget already loaded, set immediately; otherwise wait for onLoad
    if (window.Tawk_API && window.Tawk_API.getStatus) {
      setTawkAttributes();
    } else {
      window.Tawk_API = window.Tawk_API || {};
      const prevOnLoad = window.Tawk_API.onLoad;
      window.Tawk_API.onLoad = function () {
        if (prevOnLoad) prevOnLoad();
        setTawkAttributes();
      };
    }
  }, [user]);

  const handleOpenLiveChat = () => {
    setMobileMenuOpen(false);
    if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
      window.Tawk_API.maximize();
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) { /* ignore */ }
    logoutUser();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transfers', path: '/transfers', icon: ArrowRightLeft },
    { name: 'Fund Account', path: '/fund-account', icon: Plus },
    { name: 'Cards', path: '/cards', icon: CreditCard },
    { name: 'Transaction History', path: '/history', icon: Clock },
    { name: 'Beneficiaries', path: '/beneficiaries', icon: Users },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const liveChatItem = { name: 'Live Chat', icon: MessageCircle };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-8 h-8 bg-[#D4AF37] flex items-center justify-center font-bold text-[#0B1221] rounded-sm">K</div>
          <span className="text-2xl font-bold text-white tracking-wide">Krevon</span>
        </Link>
      </div>

      {/* Nav Items */}
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

        {/* Live Chat Button */}
        <button
          onClick={handleOpenLiveChat}
          className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium w-full text-left text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <MessageCircle size={20} />
          Live Chat
          <span className="ml-auto flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">Online</span>
          </span>
        </button>
      </div>

      {/* User Info & Sign Out */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#152336] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
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
      {/* ===== Desktop Sidebar (md+) ===== */}
      <aside className="w-64 bg-[#111A2C] border-r border-gray-800 flex-col hidden md:flex">
        {sidebarContent}
      </aside>

      {/* ===== Mobile Overlay Backdrop ===== */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* ===== Mobile Slide-out Sidebar ===== */}
      <aside
        className="fixed top-0 left-0 z-50 h-full w-64 bg-[#111A2C] border-r border-gray-800 flex flex-col md:hidden"
        style={{
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms ease-in-out',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
        {sidebarContent}
      </aside>

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0B1221]">
        {/* Mobile Header */}
        <header className="md:hidden bg-[#111A2C] border-b border-gray-800 p-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4AF37] flex items-center justify-center font-bold text-[#0B1221] rounded-sm">K</div>
            <span className="text-xl font-bold text-white tracking-wide">Krevon</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-gray-300 hover:text-white p-2"
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

export default DashboardLayout;
