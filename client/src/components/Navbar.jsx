import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';

  return (
    <nav className="w-full px-8 py-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1221]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-gold flex items-center justify-center font-bold text-brand-navy rounded-sm">K</div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide">Krevon</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-200">
          <Link to="/" className="hover:text-brand-gold transition-colors">Banking</Link>
          <Link to="/transfers" className="hover:text-brand-gold transition-colors">Transfers</Link>
          <Link to="/fund-account" className="hover:text-brand-gold transition-colors">Crypto</Link>
          <Link to="/about" className="hover:text-brand-gold transition-colors">About Us</Link>
          <Link to="/support" className="hover:text-brand-gold transition-colors">Support</Link>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium text-gray-200 hover:text-brand-gold transition-colors">
            Sign In
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/register"
              className="bg-brand-gold text-brand-navy px-6 py-2.5 rounded-md font-semibold text-sm hover:shadow-lg hover:shadow-brand-gold/20 transition-shadow"
            >
              Open Account
            </Link>
          </motion.div>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-gray-900 dark:text-white flex flex-col gap-1.5"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-4 px-4 pb-4 text-sm font-medium text-gray-200 border-t border-gray-200 dark:border-white/10 pt-4">
          <Link to="/" onClick={() => setMenuOpen(false)} className="hover:text-brand-gold transition-colors">Banking</Link>
          <Link to="/transfers" onClick={() => setMenuOpen(false)} className="hover:text-brand-gold transition-colors">Transfers</Link>
          <Link to="/fund-account" onClick={() => setMenuOpen(false)} className="hover:text-brand-gold transition-colors">Crypto</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)} className="hover:text-brand-gold transition-colors">About Us</Link>
          <Link to="/support" onClick={() => setMenuOpen(false)} className="hover:text-brand-gold transition-colors">Support</Link>
          <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex flex-col gap-4">
            <Link to="/login" onClick={() => setMenuOpen(false)} className="hover:text-brand-gold transition-colors">Sign In</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="bg-brand-gold text-brand-navy px-4 py-2 rounded-md font-semibold text-center">
              Open Account
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;