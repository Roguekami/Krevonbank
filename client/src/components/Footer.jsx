import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-brand-navy border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-brand-gold flex items-center justify-center font-bold text-brand-navy rounded-sm text-xs">K</div>
              <span className="text-xl font-bold text-white tracking-wide">Krevon</span>
            </div>
            <p className="text-gray-400 text-sm">
              Global Banking, Elevated.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Products</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/login" className="hover:text-brand-gold transition-colors">Banking</Link></li>
              <li><Link to="/login" className="hover:text-brand-gold transition-colors">Transfers</Link></li>
              <li><Link to="/login" className="hover:text-brand-gold transition-colors">Crypto</Link></li>
              <li><Link to="/login" className="hover:text-brand-gold transition-colors">Cards</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-brand-gold transition-colors">About Us</Link></li>
              <li><Link to="/support" className="hover:text-brand-gold transition-colors">Contact Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/terms" className="hover:text-brand-gold transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-brand-gold transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Krevon Ltd. All rights reserved. Authorized and regulated by the Financial Conduct Authority.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {/* Social Icons would go here */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
