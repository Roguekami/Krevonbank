import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Eye, Snowflake, Sun, Sliders, Loader2, ChevronRight, Trash2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const CARD_GRADIENTS = {
  physical: 'from-[#D4AF37] via-[#C9A227] to-[#A07D1C]',
  virtual: 'from-[#1e3a5f] via-[#234b7a] to-[#122847]',
};

const CardVisual = ({ card, index, onRevealCVV, cvv, revealingCVV }) => {
  const gradient = CARD_GRADIENTS[card.type] || CARD_GRADIENTS.virtual;
  const isFrozen = card.status === 'frozen';
  const isInactive = card.status === 'requested' || card.status === 'shipped';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} p-6 shadow-2xl flex flex-col justify-between`}
      style={{ aspectRatio: '1.586' }}
    >
      {card.type === 'virtual' && (
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      )}

      {isFrozen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
          <div className="text-center">
            <Snowflake className="w-12 h-12 text-blue-300 mx-auto mb-2" />
            <p className="text-gray-900 dark:text-white font-bold text-lg">Card Frozen</p>
          </div>
        </div>
      )}

      {isInactive && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-2xl">
          <div className="text-center px-4 py-2 bg-black/60 rounded-full border border-gray-200 dark:border-white/10">
            <p className="text-gray-900 dark:text-white font-medium text-sm">
              {card.status === 'requested' ? 'Card Requested - Processing' : 'Card Shipped - In Transit'}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start relative z-10">
        <div className="w-10 h-7 bg-yellow-300/80 rounded-md shadow-inner" />
        <span className={`text-xs font-semibold uppercase tracking-widest px-2 py-1 rounded-full ${
          card.type === 'virtual' ? 'bg-white/10 text-gray-900 dark:text-white border border-white/20' : 'bg-white/20 text-gray-900 dark:text-white shadow-sm'
        }`}>
          {card.type}
        </span>
      </div>

      <div className="relative z-10">
        <p className="text-gray-900 dark:text-white/95 font-mono text-[1.15rem] tracking-[0.2em] mb-4">{card.card_number_masked}</p>
        
        <div className="flex justify-between items-end">
          <div>
            <p className="text-gray-900 dark:text-white/60 text-[10px] uppercase tracking-wider mb-0.5">Cardholder</p>
            <p className="text-gray-900 dark:text-white font-semibold text-sm tracking-wide truncate max-w-[120px]">{card.cardholder_name}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-900 dark:text-white/60 text-[10px] uppercase tracking-wider mb-0.5">Expires</p>
            <p className="text-gray-900 dark:text-white font-semibold text-sm tracking-widest">{card.expiry_date}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-900 dark:text-white/60 text-[10px] uppercase tracking-wider mb-0.5">CVV</p>
            {isInactive ? (
              <p className="text-gray-900 dark:text-white/40 font-mono text-sm tracking-widest">***</p>
            ) : cvv ? (
              <p className="text-gray-900 dark:text-white font-mono font-bold text-sm tracking-widest">{cvv}</p>
            ) : (
              <button
                onClick={() => onRevealCVV(card.id)}
                disabled={revealingCVV || isFrozen}
                className="text-gray-900 dark:text-white/70 hover:text-gray-900 dark:text-white transition-colors"
              >
                {revealingCVV ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 right-4 -translate-y-1/2 z-0 opacity-10">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-bold text-black text-3xl">K</div>
      </div>
    </motion.div>
  );
};

const LimitModal = ({ card, onClose, onSave }) => {
  const [limit, setLimit] = useState(card.spending_limit || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/cards/${card.id}/limit`, { limit: parseFloat(limit) });
      toast.success('Spending limit updated!');
      onSave();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update limit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-[#152336] rounded-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-white/10 shadow-2xl"
      >
        <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-4">Set Spending Limit</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Set a daily spending limit for this card. Enter 0 for no limit.</p>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1.5">Limit Amount (USD)</label>
          <input
            type="number"
            min="0"
            value={limit}
            onChange={e => setLimit(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37]"
            placeholder="e.g. 1000"
          />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Save Limit'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const DeliveryModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', address: '', city: '', country: '', postal: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/cards/request', { type: 'physical', deliveryInfo: formData });
      toast.success('Physical card requested successfully.');
      onSave();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to request card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-[#152336] rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-white/10 shadow-2xl"
      >
        <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Request Physical Card</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Where should we ship your new card?</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1.5">Full Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37]" />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1.5">Delivery Address</label>
            <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1.5">City</label>
              <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37]" />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1.5">Postal Code</label>
              <input required type="text" value={formData.postal} onChange={e => setFormData({...formData, postal: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1.5">Country</label>
              <input required type="text" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37]" />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1.5">Phone Number</label>
              <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37]" />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold disabled:opacity-70">
              {loading ? 'Submitting...' : 'Request Card'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Cards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [cvvMap, setCvvMap] = useState({});
  const [revealingCVV, setRevealingCVV] = useState(null);
  const [limitCard, setLimitCard] = useState(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchCards = async () => {
    try {
      const res = await api.get('/cards');
      setCards(res.data.cards);
    } catch (e) {
      toast.error('Failed to load cards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCards(); }, []);

  const handleRevealCVV = async (cardId) => {
    if (cvvMap[cardId]) { setCvvMap(p => ({ ...p, [cardId]: null })); return; }
    setRevealingCVV(cardId);
    try {
      const res = await api.get(`/cards/${cardId}/cvv`);
      setCvvMap(p => ({ ...p, [cardId]: res.data.cvv }));
      setTimeout(() => setCvvMap(p => ({ ...p, [cardId]: null })), 30000);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to reveal CVV.');
    } finally {
      setRevealingCVV(null);
    }
  };

  const handleToggleFreeze = async (card) => {
    setActionLoading(card.id);
    try {
      const action = card.status === 'frozen' ? 'unfreeze' : 'freeze';
      const res = await api.put(`/cards/${card.id}/${action}`);
      toast.success(res.data.message);
      fetchCards();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCard = async (card) => {
    if (!window.confirm("Are you sure you want to permanently delete your virtual card?")) return;
    setActionLoading(`delete-${card.id}`);
    try {
      const res = await api.delete(`/cards/${card.id}`);
      toast.success(res.data.message);
      fetchCards();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestVirtualCard = async () => {
    setRequesting(true);
    try {
      const res = await api.post('/cards/request', { type: 'virtual' });
      toast.success(res.data.message);
      fetchCards();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to request card.');
    } finally {
      setRequesting(false);
    }
  };

  const hasVirtual = cards.some(c => c.type === 'virtual');
  const hasPhysical = cards.some(c => c.type === 'physical');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1221]">
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif text-gray-900 dark:text-white">My Cards</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your virtual and physical cards</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={!hasVirtual ? { scale: 1.02 } : {}} 
              whileTap={!hasVirtual ? { scale: 0.98 } : {}}
              onClick={handleRequestVirtualCard}
              disabled={requesting || hasVirtual}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                hasVirtual 
                  ? 'bg-white dark:bg-[#152336] text-[#D4AF37] border border-[#D4AF37]/30 shadow-lg cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] hover:shadow-lg shadow-[#D4AF37]/20'
              }`}
            >
              {requesting ? <Loader2 size={16} className="animate-spin" /> : hasVirtual ? <CheckCircle size={16} /> : <Plus size={16} />}
              {hasVirtual ? 'Virtual Card Active' : 'Virtual Card'}
            </motion.button>
            <motion.button
              whileHover={!hasPhysical ? { scale: 1.02 } : {}} 
              whileTap={!hasPhysical ? { scale: 0.98 } : {}}
              onClick={() => setDeliveryModalOpen(true)}
              disabled={requesting || hasPhysical}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                hasPhysical 
                  ? 'bg-white dark:bg-[#152336] text-[#D4AF37] border border-[#D4AF37]/30 shadow-lg cursor-not-allowed' 
                  : 'border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10'
              }`}
            >
              {hasPhysical ? <CheckCircle size={16} /> : <CreditCard size={16} />}
              {hasPhysical ? 'Physical Card Requested' : 'Physical Card'}
            </motion.button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 bg-white dark:bg-[#152336] rounded-2xl border border-white/5"
          >
            <CreditCard className="w-16 h-16 text-[#D4AF37]/50 mx-auto mb-4" />
            <h3 className="text-gray-900 dark:text-white text-xl font-medium mb-2">No cards yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Request your first virtual card instantly</p>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleRequestVirtualCard}
              disabled={requesting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold"
            >
              {requesting ? 'Creating...' : 'Get Virtual Card'}
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {cards.map((card, i) => {
              const isInactive = card.status === 'requested' || card.status === 'shipped';
              
              return (
                <div key={card.id} className="space-y-4 max-w-sm mx-auto w-full">
                  <CardVisual
                    card={card}
                    index={i}
                    onRevealCVV={handleRevealCVV}
                    cvv={cvvMap[card.id]}
                    revealingCVV={revealingCVV === card.id}
                  />

                  <div className="bg-white dark:bg-[#152336] rounded-2xl border border-white/5 p-2 flex flex-col gap-1 shadow-lg w-full">
                    <div className="px-4 py-3 bg-white/5 rounded-xl mb-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Status</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${card.status === 'active' ? 'bg-green-400' : card.status === 'frozen' ? 'bg-blue-400' : 'bg-yellow-400'}`}></span>
                          <span className={card.status === 'active' ? 'text-green-400 font-medium' : card.status === 'frozen' ? 'text-blue-300 font-medium' : 'text-yellow-400 font-medium capitalize'}>
                            {card.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {card.spending_limit > 0 && (
                      <div className="px-4 py-3 bg-white/5 rounded-xl mb-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Spending Limit</span>
                          <span className="text-gray-900 dark:text-white font-medium">${Number(card.spending_limit).toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleToggleFreeze(card)}
                      disabled={actionLoading === card.id || isInactive}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 rounded-xl transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                          {card.status === 'frozen' ? <Sun size={16} className="text-yellow-400" /> : <Snowflake size={16} className="text-blue-400" />}
                        </div>
                        <span className="text-gray-200 text-sm font-medium">{card.status === 'frozen' ? 'Unfreeze Card' : 'Freeze Card'}</span>
                      </div>
                      {actionLoading === card.id ? <Loader2 size={16} className="animate-spin text-gray-500" /> : <ChevronRight size={16} className="text-gray-500 group-hover:text-gray-900 dark:text-white transition-colors" />}
                    </button>

                    <button
                      onClick={() => setLimitCard(card)}
                      disabled={isInactive}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 rounded-xl transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                          <Sliders size={16} className="text-[#D4AF37]" />
                        </div>
                        <span className="text-gray-200 text-sm font-medium">Set Spending Limit</span>
                      </div>
                      <ChevronRight size={16} className="text-gray-500 group-hover:text-gray-900 dark:text-white transition-colors" />
                    </button>

                    {card.type === 'virtual' && (
                      <button
                        onClick={() => handleDeleteCard(card)}
                        disabled={actionLoading === `delete-${card.id}`}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-red-500/10 rounded-xl transition-colors group mt-2 border border-transparent hover:border-red-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                            <Trash2 size={16} className="text-red-400" />
                          </div>
                          <span className="text-red-400 text-sm font-medium">Delete Virtual Card</span>
                        </div>
                        {actionLoading === `delete-${card.id}` ? <Loader2 size={16} className="animate-spin text-red-400" /> : <ChevronRight size={16} className="text-red-400/50 group-hover:text-red-400 transition-colors" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {limitCard && (
          <LimitModal card={limitCard} onClose={() => setLimitCard(null)} onSave={fetchCards} />
        )}
        {deliveryModalOpen && (
          <DeliveryModal onClose={() => setDeliveryModalOpen(false)} onSave={fetchCards} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cards;

