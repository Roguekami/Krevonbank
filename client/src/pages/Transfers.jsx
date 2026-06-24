import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCcw, Send, Building2, User, ArrowRight, TrendingUp,
  Wallet, CheckCircle, AlertCircle, Loader2, ChevronDown, Clock, X, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ─── Constants ─────────────────────────────────────────────────────────────
const RATES_CACHE_KEY = 'krevon_fx_rates';
const RATES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LOCK_SECONDS = 30;              // Rate valid for 30s after preview locks

const CURRENCY_FLAGS = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
  CHF: '🇨🇭', AUD: '🇦🇺', CAD: '🇨🇦', NGN: '🇳🇬',
  GHS: '🇬🇭', KES: '🇰🇪', ZAR: '🇿🇦',
};

const CURRENCY_NAMES = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
  CHF: 'Swiss Franc', AUD: 'Australian Dollar', CAD: 'Canadian Dollar',
  NGN: 'Nigerian Naira', GHS: 'Ghanaian Cedi', KES: 'Kenyan Shilling', ZAR: 'South African Rand',
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatBalance = (amount, currency) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency,
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(parseFloat(amount) || 0);
  } catch {
    return `${currency} ${parseFloat(amount || 0).toFixed(2)}`;
  }
};

/**
 * Compute exchange rate between two currencies.
 * The Open Exchange Rates API returns all rates with USD as the base (USD = 1).
 * Formula: rate = rates[to] / rates[from]
 * Example: USD→EUR = 0.92/1 = 0.92  |  EUR→GBP = 0.79/0.92 ≈ 0.859
 */
const computeRate = (rates, from, to) => {
  if (!rates || !from || !to || from === to) return null;
  const rFrom = rates[from];
  const rTo   = rates[to];
  if (!rFrom || !rTo) return null;
  return rTo / rFrom;
};

// ─── Cached rate fetcher ─────────────────────────────────────────────────────
const getCachedRates = () => {
  try {
    const cached = localStorage.getItem(RATES_CACHE_KEY);
    if (!cached) return null;
    const { rates, fetchedAt } = JSON.parse(cached);
    if (Date.now() - fetchedAt < RATES_CACHE_TTL_MS) return rates;
  } catch { /* ignore */ }
  return null;
};

const setCachedRates = (rates) => {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates, fetchedAt: Date.now() }));
  } catch { /* ignore */ }
};

// ─── Confirmation Modal ──────────────────────────────────────────────────────
const ConfirmModal = ({ fromCurrency, toCurrency, amount, convertedAmount, rate, secondsLeft, onConfirm, onCancel, submitting }) => {
  const rateStale = secondsLeft <= 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        className="bg-[#111A2C] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#D4AF37]" /> Confirm Transfer
          </h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Summary */}
        <div className="bg-[#0B1221] rounded-xl p-5 mb-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">You Send</span>
            <span className="text-white font-bold font-mono">{formatBalance(amount, fromCurrency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">You Receive</span>
            <span className="text-[#D4AF37] font-bold font-mono">≈ {formatBalance(convertedAmount, toCurrency)}</span>
          </div>
          <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs">
            <span className="text-gray-500">Exchange Rate</span>
            <span className="text-gray-300 font-mono">1 {fromCurrency} = {rate.toFixed(6)} {toCurrency}</span>
          </div>
        </div>

        {/* Rate timer */}
        <div className={`flex items-center gap-2 text-xs rounded-lg p-3 mb-5 ${rateStale ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'}`}>
          <Clock size={13} />
          {rateStale
            ? 'Rate expired. Please close and re-confirm to get a fresh rate.'
            : `Rate locked for ${secondsLeft}s — will expire if not confirmed.`
          }
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={rateStale || submitting}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
          >
            {submitting ? <><Loader2 className="animate-spin" size={16} /> Processing...</> : 'Confirm Transfer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const Transfers = () => {
  const [activeTab, setActiveTab] = useState('internal');

  // Account & rates
  const [account, setAccount]       = useState(null);
  const [rates, setRates]           = useState(null);
  const [ratesAge, setRatesAge]     = useState(null); // timestamp rates were fetched
  const [loadingData, setLoadingData] = useState(true);

  // Internal transfer
  const [fromCurrency, setFromCurrency] = useState('');
  const [toCurrency, setToCurrency]     = useState('');
  const [amount, setAmount]             = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [internalSuccess, setInternalSuccess] = useState(false);

  // Confirmation modal
  const [showConfirm, setShowConfirm]     = useState(false);
  const [lockedRate, setLockedRate]       = useState(null);  // rate at preview time
  const [secondsLeft, setSecondsLeft]     = useState(RATE_LOCK_SECONDS);
  const timerRef                          = useRef(null);

  // Wire transfer
  const [wireForm, setWireForm] = useState({
    currency: 'USD', amount: '',
    recipientName: '', recipientBankName: '',
    recipientAccountNumber: '', recipientSwiftIban: '', description: '',
  });
  const [wireLoading, setWireLoading] = useState(false);

  // ─── Load account + rates ───────────────────────────────────────────────
  const fetchRates = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCachedRates();
      if (cached) { setRates(cached); return; }
    }
    try {
      const res = await api.get('/rates');
      setCachedRates(res.data.rates);
      setRates(res.data.rates);
      setRatesAge(Date.now());
    } catch {
      toast.error('Could not load exchange rates.');
    }
  }, []);

  const fetchAccount = useCallback(async () => {
    try {
      const res = await api.get('/account');
      const acc = res.data.account;
      setAccount(acc);
      const wallets = acc?.balances || [];
      if (wallets.length >= 1) setFromCurrency(c => c || wallets[0].currency_code);
      if (wallets.length >= 2) setToCurrency(c => c || wallets[1].currency_code);
    } catch {
      toast.error('Failed to load account data.');
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchAccount(), fetchRates()]).finally(() => setLoadingData(false));
  }, [fetchAccount, fetchRates]);

  // ─── Rate-lock countdown ────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    setSecondsLeft(RATE_LOCK_SECONDS);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ─── Derived values ─────────────────────────────────────────────────────
  const wallets       = account?.balances || [];
  const getBalance    = (c) => parseFloat(wallets.find(b => b.currency_code === c)?.balance || 0);
  const liveRate      = computeRate(rates, fromCurrency, toCurrency);
  const parsedAmount  = parseFloat(amount) || 0;
  const convertedAmt  = liveRate ? (parsedAmount * liveRate).toFixed(2) : null;
  const fromBalance   = getBalance(fromCurrency);
  const sameCurrency  = fromCurrency === toCurrency && !!fromCurrency;
  const insufficient  = parsedAmount > 0 && parsedAmount > fromBalance;
  const canPreview    = parsedAmount > 0.009 && !insufficient && !sameCurrency && !!liveRate;

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleSwap = () => { setFromCurrency(toCurrency); setToCurrency(fromCurrency); setAmount(''); };

  const openConfirm = () => {
    if (!canPreview) return;
    setLockedRate(liveRate);
    setShowConfirm(true);
    startCountdown();
  };

  const handleConfirm = async () => {
    if (secondsLeft <= 0) return;
    setSubmitting(true);
    try {
      await api.post('/transfers/internal', {
        fromCurrency,
        toCurrency,
        amount: parsedAmount,
        // Send the rate that was locked at preview time (not live rate at submission)
        exchangeRate: lockedRate,
      });
      setShowConfirm(false);
      setInternalSuccess(true);
      setAmount('');
      toast.success(`Converted ${formatBalance(parsedAmount, fromCurrency)} → ${formatBalance(parsedAmount * lockedRate, toCurrency)}`);
      await fetchAccount(); // Refresh wallet balances
      setTimeout(() => setInternalSuccess(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed. Please try again.');
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
      clearInterval(timerRef.current);
    }
  };

  const submitWireTransfer = async (e) => {
    e.preventDefault();
    setWireLoading(true);
    await new Promise(r => setTimeout(r, 6000));
    try {
      await api.post('/transfers/wire', { ...wireForm, amount: parseFloat(wireForm.amount) });
      toast.success('Wire transfer submitted. Pending admin approval.');
      setWireForm({ currency: 'USD', amount: '', recipientName: '', recipientBankName: '', recipientAccountNumber: '', recipientSwiftIban: '', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed. Please try again.');
    } finally {
      setWireLoading(false);
    }
  };

  // ─── Shared style ────────────────────────────────────────────────────────
  const inputCls = 'w-full bg-[#0B1221] border border-gray-700 text-white rounded-xl p-3.5 focus:outline-none focus:border-[#D4AF37] transition-colors';
  const selectCls = `${inputCls} appearance-none`;

  // ─── Wallet Cards (max 5 visible, horizontally scrollable, fade-right) ───
  const WalletCards = () => (
    <div className="mb-8">
      <p className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold flex items-center gap-2">
        <Wallet size={13} /> Your Wallets
        {ratesAge && (
          <span className="ml-auto text-[10px] text-gray-600 normal-case tracking-normal font-normal">
            Rates updated {Math.round((Date.now() - ratesAge) / 60000)}m ago
          </span>
        )}
      </p>
      {/* Relative wrapper with right-side gradient fade when >5 wallets */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2 pr-2" style={{ scrollbarWidth: 'thin', maxHeight: 120 }}>
          {wallets.map(w => (
            <motion.button
              key={w.currency_code}
              type="button"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFromCurrency(w.currency_code)}
              className={`flex-shrink-0 rounded-xl p-4 border text-left transition-all w-36 ${
                fromCurrency === w.currency_code
                  ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/20'
                  : toCurrency === w.currency_code
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-[#0B1221] border-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{CURRENCY_FLAGS[w.currency_code] || '🌐'}</span>
                {fromCurrency === w.currency_code && (
                  <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wide bg-[#D4AF37]/10 px-1.5 py-0.5 rounded-full">FROM</span>
                )}
                {toCurrency === w.currency_code && fromCurrency !== w.currency_code && (
                  <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wide bg-blue-500/10 px-1.5 py-0.5 rounded-full">TO</span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-semibold">{w.currency_code}</p>
              <p className="text-sm font-bold text-white mt-0.5 truncate">{formatBalance(w.balance, w.currency_code)}</p>
            </motion.button>
          ))}
        </div>
        {/* Fade-out gradient for overflow hint */}
        {wallets.length > 4 && (
          <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-[#152336] to-transparent pointer-events-none rounded-r-xl" />
        )}
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B1221] text-white p-6 md:p-10 font-sans">
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && lockedRate && (
          <ConfirmModal
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            amount={parsedAmount}
            convertedAmount={(parsedAmount * lockedRate).toFixed(2)}
            rate={lockedRate}
            secondsLeft={secondsLeft}
            onConfirm={handleConfirm}
            onCancel={() => { setShowConfirm(false); clearInterval(timerRef.current); }}
            submitting={submitting}
          />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">Transfers</h1>
          <p className="text-gray-400">Move funds between wallets or send wire transfers globally</p>
        </header>

        <div className="bg-[#152336] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {[
              { id: 'internal', icon: RefreshCcw, label: 'Internal Transfer' },
              { id: 'wire',     icon: Send,        label: 'Wire Transfer'     },
            ].map(tab => (
              <button
                key={tab.id}
                className={`flex-1 py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-[#1e3048] text-[#D4AF37] border-b-2 border-[#D4AF37]'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#0B1221]/50'
                }`}
                onClick={() => { setActiveTab(tab.id); setAmount(''); }}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">

            {/* ════ INTERNAL TRANSFER ════ */}
            {activeTab === 'internal' && (
              <div>
                {loadingData ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="animate-spin text-[#D4AF37]" size={36} />
                    <p className="text-gray-400 text-sm">Loading your wallets...</p>
                  </div>
                ) : wallets.length < 2 ? (
                  <div className="text-center py-12">
                    <Wallet size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-white font-semibold text-lg mb-2">You need at least 2 currency wallets</p>
                    <p className="text-gray-400 text-sm">Go to your dashboard and add another currency wallet to enable internal transfers.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <WalletCards />

                    {/* FROM / SWAP / TO row */}
                    <div className="flex items-end gap-3">
                      {/* FROM wallet */}
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">From</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3.5 flex items-center text-lg pointer-events-none">{CURRENCY_FLAGS[fromCurrency] || '🌐'}</span>
                          <select
                            value={fromCurrency}
                            onChange={e => { setFromCurrency(e.target.value); setAmount(''); }}
                            className={`${selectCls} pl-11 pr-8`}
                          >
                            {wallets.map(w => (
                              <option key={w.currency_code} value={w.currency_code}>
                                {w.currency_code} — {formatBalance(w.balance, w.currency_code)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                        <p className="text-xs pl-1 text-gray-500">
                          Balance:{' '}
                          <span className={`font-semibold ${insufficient ? 'text-red-400' : 'text-gray-300'}`}>
                            {formatBalance(fromBalance, fromCurrency)}
                          </span>
                        </p>
                      </div>

                      {/* Swap */}
                      <div className="pb-8">
                        <motion.button
                          type="button"
                          onClick={handleSwap}
                          whileHover={{ rotate: 180 }}
                          transition={{ duration: 0.3 }}
                          className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors"
                        >
                          <ArrowRight size={18} />
                        </motion.button>
                      </div>

                      {/* TO wallet */}
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">To</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3.5 flex items-center text-lg pointer-events-none">{CURRENCY_FLAGS[toCurrency] || '🌐'}</span>
                          <select
                            value={toCurrency}
                            onChange={e => setToCurrency(e.target.value)}
                            className={`${selectCls} pl-11 pr-8`}
                          >
                            {wallets.map(w => (
                              <option key={w.currency_code} value={w.currency_code}>
                                {w.currency_code} — {CURRENCY_NAMES[w.currency_code] || w.currency_code}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                        <p className="text-xs pl-1 text-gray-500">
                          Balance: <span className="font-semibold text-gray-300">{formatBalance(getBalance(toCurrency), toCurrency)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Same-currency warning */}
                    <AnimatePresence>
                      {sameCurrency && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm"
                        >
                          <AlertCircle size={15} /> Source and destination wallets must be different currencies.
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Amount input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">Amount to Convert</label>
                        <button
                          type="button"
                          onClick={() => setAmount(fromBalance.toFixed(2))}
                          className="text-xs text-[#D4AF37] hover:text-white transition-colors font-semibold"
                        >
                          Use Max
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 font-semibold text-sm pointer-events-none">{fromCurrency}</span>
                        <input
                          type="number" min="0.01" step="0.01" required
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="0.00"
                          className={`${inputCls} pl-16 font-mono text-2xl py-5 ${insufficient ? 'border-red-500/60 focus:border-red-500' : ''}`}
                        />
                      </div>
                      <AnimatePresence>
                        {insufficient && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-xs text-red-400 pl-1 flex items-center gap-1"
                          >
                            <AlertCircle size={12} /> Insufficient balance. Available: {formatBalance(fromBalance, fromCurrency)}.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Live Conversion Preview */}
                    <AnimatePresence>
                      {parsedAmount > 0 && liveRate && !sameCurrency && (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="rounded-xl bg-gradient-to-r from-[#D4AF37]/5 to-transparent border border-[#D4AF37]/20 p-5"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest flex items-center gap-1.5">
                              <TrendingUp size={13} className="text-[#D4AF37]" /> Live Preview
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              1 {fromCurrency} = {liveRate.toFixed(6)} {toCurrency}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center flex-1">
                              <p className="text-xs text-gray-400 mb-1">You Send</p>
                              <p className="text-xl font-bold text-white font-mono">{formatBalance(parsedAmount, fromCurrency)}</p>
                            </div>
                            <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                              <ArrowRight className="text-[#D4AF37]" size={22} />
                            </motion.div>
                            <div className="text-center flex-1">
                              <p className="text-xs text-gray-400 mb-1">You Receive</p>
                              <p className="text-xl font-bold text-[#D4AF37] font-mono">≈ {formatBalance(convertedAmt, toCurrency)}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit → opens confirmation modal */}
                    <div className="pt-2">
                      <motion.button
                        type="button"
                        onClick={openConfirm}
                        disabled={!canPreview || internalSuccess}
                        whileHover={canPreview ? { scale: 1.01 } : {}}
                        whileTap={canPreview ? { scale: 0.99 } : {}}
                        className={`w-full font-bold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-3 ${
                          canPreview && !internalSuccess
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]'
                            : internalSuccess
                            ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                            : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          {internalSuccess ? (
                            <motion.span key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                              <CheckCircle size={20} /> Transfer Complete!
                            </motion.span>
                          ) : (
                            <motion.span key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                              <RefreshCcw size={20} />
                              {canPreview
                                ? `Review & Convert ${formatBalance(parsedAmount, fromCurrency)}`
                                : 'Convert & Transfer Funds'
                              }
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                      <p className="text-center text-xs text-gray-600 mt-3">
                        Rates cached for up to 5 minutes · Conversions are instant · No fees applied
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════ WIRE TRANSFER ════ */}
            {activeTab === 'wire' && (
              <form onSubmit={submitWireTransfer} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">Transfer Amount</label>
                  <div className="flex gap-3">
                    <div className="relative w-36 flex-shrink-0">
                      <select
                        name="currency" value={wireForm.currency}
                        onChange={e => setWireForm({ ...wireForm, currency: e.target.value })}
                        className={`${selectCls} pr-7`}
                      >
                        {(wallets.length > 0 ? wallets.map(w => w.currency_code) : ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD']).map(c => (
                          <option key={c} value={c}>{CURRENCY_FLAGS[c]} {c}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                    <input
                      type="number" min="0.01" step="0.01" required
                      value={wireForm.amount}
                      onChange={e => setWireForm({ ...wireForm, amount: e.target.value })}
                      placeholder="0.00"
                      className={`${inputCls} flex-1 font-mono text-xl`}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 space-y-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <User size={18} className="text-[#D4AF37]" /> Recipient Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs text-gray-500 font-medium block">Full Name / Company Name</label>
                      <input type="text" required value={wireForm.recipientName}
                        onChange={e => setWireForm({ ...wireForm, recipientName: e.target.value })}
                        placeholder="John Doe" className={inputCls} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs text-gray-500 font-medium flex items-center gap-1"><Building2 size={12} /> Bank Name</label>
                      <input type="text" required value={wireForm.recipientBankName}
                        onChange={e => setWireForm({ ...wireForm, recipientBankName: e.target.value })}
                        placeholder="e.g. JPMorgan Chase" className={inputCls} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500 font-medium block">Account Number</label>
                      <input type="text" required value={wireForm.recipientAccountNumber}
                        onChange={e => setWireForm({ ...wireForm, recipientAccountNumber: e.target.value })}
                        placeholder="Account Number" className={`${inputCls} font-mono`} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500 font-medium block">SWIFT / IBAN Code</label>
                      <input type="text" required value={wireForm.recipientSwiftIban}
                        onChange={e => setWireForm({ ...wireForm, recipientSwiftIban: e.target.value.toUpperCase() })}
                        placeholder="SWIFT / IBAN" className={`${inputCls} font-mono uppercase`} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs text-gray-500 font-medium block">Description (optional)</label>
                      <input type="text" value={wireForm.description}
                        onChange={e => setWireForm({ ...wireForm, description: e.target.value })}
                        placeholder="Payment reference, invoice number..." className={inputCls} />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit" disabled={wireLoading}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold text-lg py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]"
                  >
                    {wireLoading
                      ? <><Loader2 className="animate-spin" size={20} /> Processing Secure Transfer...</>
                      : <><Send size={20} /> Initiate Wire Transfer</>
                    }
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-3">
                    Wire transfers are reviewed by our compliance team and may take 1–3 business days.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfers;
