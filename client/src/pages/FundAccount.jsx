import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bitcoin, Copy, CheckCircle, Loader2, Clock, XCircle, Send, AlertTriangle, Building2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import QRCode from 'qrcode';

const CRYPTOS = [
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A', icon: '₿', networks: ['BTC'] },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', icon: 'Ξ', networks: ['BEP20'] },
  { id: 'USDT', name: 'Tether', symbol: 'USDT', color: '#26A17B', icon: '₮', networks: ['BEP20'] },
];

const FIAT_CURRENCIES = ['USD', 'EUR', 'GBP'];

const STATUS_STYLES = {
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock, label: 'Pending' },
  verified: { color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle, label: 'Verified' },
  rejected: { color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle, label: 'Rejected' },
};

const FundAccount = () => {
  const [activeTab, setActiveTab] = useState('crypto'); // 'crypto' or 'bank'
  
  // Crypto State
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [cryptoTxHash, setCryptoTxHash] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  
  // Bank State
  const [selectedFiat, setSelectedFiat] = useState('USD');
  const [bankInstructions, setBankInstructions] = useState(null);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankForm, setBankForm] = useState({ amount: '', senderName: '', senderBank: '', referenceCode: '' });

  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/funding/my');
      // Combine and sort
      const allReqs = [...res.data.cryptoRequests, ...res.data.bankRequests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setHistory(allReqs);
    } catch (e) {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  // --- Crypto Methods ---
  const fetchWallet = async (cryptoId, network) => {
    if (!cryptoId || !network) return;
    setWalletAddress('');
    setQrDataUrl('');
    setLoadingWallet(true);
    try {
      const res = await api.get(`/funding/crypto/wallets?crypto=${cryptoId}&network=${network}`);
      const addr = res.data.address;
      setWalletAddress(addr);
      const qr = await QRCode.toDataURL(addr, { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
      setQrDataUrl(qr);
    } catch (e) {
      toast.error('Failed to load wallet address for this network.');
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleSelectCrypto = (crypto) => {
    setSelectedCrypto(crypto);
    setSelectedNetwork('');
    setWalletAddress('');
    setQrDataUrl('');
    if (crypto && crypto.networks.length === 1) {
      const defaultNetwork = crypto.networks[0];
      setSelectedNetwork(defaultNetwork);
      fetchWallet(crypto.id, defaultNetwork);
    }
  };

  const handleSelectNetwork = (network) => {
    setSelectedNetwork(network);
    fetchWallet(selectedCrypto.id, network);
  };

  const handleCryptoSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCrypto) return toast.error('Please select a cryptocurrency.');
    if (!selectedNetwork) return toast.error('Please select a network.');
    if (!cryptoTxHash.trim()) return toast.error('Please enter the transaction hash.');
    if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) return toast.error('Please enter a valid amount.');
    setSubmitting(true);
    try {
      await api.post('/funding/crypto/submit', {
        cryptoType: selectedCrypto.id,
        network: selectedNetwork,
        transactionHash: cryptoTxHash.trim(),
        amountSent: parseFloat(cryptoAmount),
      });
      toast.success('Funding request submitted! We will verify within 24 hours.');
      setCryptoTxHash('');
      setCryptoAmount('');
      fetchHistory();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Bank Methods ---
  const fetchBankInstructions = async (currency) => {
    setLoadingBank(true);
    setBankInstructions(null);
    try {
      const res = await api.get(`/funding/bank/instructions?currency=${currency}`);
      setBankInstructions(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load bank instructions.');
    } finally {
      setLoadingBank(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bank') {
      fetchBankInstructions(selectedFiat);
    }
  }, [activeTab, selectedFiat]);

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    const { amount, senderName, senderBank, referenceCode } = bankForm;
    if (!amount || parseFloat(amount) <= 0) return toast.error('Please enter a valid amount.');
    if (!senderName || !senderBank || !referenceCode) return toast.error('Please fill in all bank details.');
    
    setSubmitting(true);
    try {
      await api.post('/funding/bank/submit', {
        currency: selectedFiat,
        amount: parseFloat(amount),
        senderName,
        senderBank,
        referenceCode
      });
      toast.success('Bank deposit request submitted! We will verify within 1-3 business days.');
      setBankForm({ amount: '', senderName: '', senderBank: '', referenceCode: '' });
      fetchHistory();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0B1221]">
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif text-white">Fund Account</h1>
            <p className="text-gray-400 mt-1">Deposit funds via Crypto or External Bank Wire</p>
          </div>
          <div className="flex bg-[#152336] p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveTab('crypto')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'crypto' ? 'bg-[#D4AF37] text-[#0B1221] shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Bitcoin size={18} /> Crypto Deposit
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'bank' ? 'bg-[#D4AF37] text-[#0B1221] shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Building2 size={18} /> Bank Transfer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Instructions */}
          <div className="space-y-6">
            {activeTab === 'crypto' ? (
              // Crypto Instructions
              <>
                <div className="bg-[#152336] rounded-2xl p-6 border border-white/5">
                  <h2 className="text-white font-semibold mb-4">1. Select Cryptocurrency</h2>
                  <div className="space-y-3">
                    {CRYPTOS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCrypto(c)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          selectedCrypto?.id === c.id
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                            : 'border-white/10 hover:border-white/20 bg-[#0B1221]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: c.color }}>
                          {c.icon}
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{c.name}</p>
                          <p className="text-gray-400 text-sm">{c.symbol}</p>
                        </div>
                        {selectedCrypto?.id === c.id && <CheckCircle size={18} className="ml-auto text-[#D4AF37]" />}
                      </button>
                    ))}
                  </div>

                  {selectedCrypto && selectedCrypto.networks.length > 1 && (
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <h3 className="text-sm font-medium text-gray-300 mb-3">Select Network</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {selectedCrypto.networks.map(net => (
                          <button
                            key={net}
                            onClick={() => handleSelectNetwork(net)}
                            className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                              selectedNetwork === net
                                ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]'
                                : 'border-white/10 bg-[#0B1221] text-gray-400 hover:border-white/30'
                            }`}
                          >
                            {net}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {selectedNetwork && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#152336] rounded-2xl p-6 border border-white/5"
                    >
                      <h2 className="text-white font-semibold mb-4">2. Send {selectedCrypto.name}</h2>
                      {loadingWallet ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                        </div>
                      ) : walletAddress ? (
                        <>
                          {qrDataUrl && (
                            <div className="flex justify-center mb-4">
                              <div className="bg-white p-3 rounded-xl">
                                <img src={qrDataUrl} alt="Wallet QR" className="w-40 h-40" />
                              </div>
                            </div>
                          )}
                          
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 flex items-start gap-3">
                            <AlertTriangle className="text-yellow-400 shrink-0 mt-0.5" size={16} />
                            <p className="text-yellow-400/90 text-xs">
                              Ensure you are sending on the <strong>{selectedNetwork}</strong> network. Funds sent to the wrong network cannot be recovered.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 bg-[#0B1221] rounded-xl px-4 py-3 border border-white/10">
                            <p className="text-white font-mono text-xs flex-1 break-all">{walletAddress}</p>
                            <button onClick={() => handleCopy(walletAddress)} className="shrink-0 text-[#D4AF37] hover:text-white transition-colors">
                              <Copy size={18} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-400 text-sm text-center">Wallet address not configured for this network.</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              // Bank Instructions
              <div className="bg-[#152336] rounded-2xl p-6 border border-white/5">
                <h2 className="text-white font-semibold mb-4">1. Wire Transfer Details</h2>
                <div className="mb-6">
                  <label className="block text-gray-300 text-sm mb-2">Select Currency to Deposit</label>
                  <div className="flex gap-3">
                    {FIAT_CURRENCIES.map(curr => (
                      <button
                        key={curr}
                        onClick={() => setSelectedFiat(curr)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedFiat === curr
                            ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]'
                            : 'border-white/10 bg-[#0B1221] text-gray-400 hover:border-white/30'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingBank ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" /></div>
                ) : bankInstructions ? (
                  <div className="bg-[#0B1221] rounded-xl p-5 border border-white/10 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Beneficiary Name</p>
                      <p className="text-white font-medium">{bankInstructions.accountName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                      <p className="text-white font-medium">Krevon International Bank PLC</p>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">IBAN / Account Number</p>
                        <p className="text-[#D4AF37] font-mono font-medium">{bankInstructions.iban}</p>
                      </div>
                      <button onClick={() => handleCopy(bankInstructions.iban)} className="text-gray-400 hover:text-white p-2">
                        <Copy size={16} />
                      </button>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">SWIFT / BIC Code</p>
                        <p className="text-[#D4AF37] font-mono font-medium">{bankInstructions.swift}</p>
                      </div>
                      <button onClick={() => handleCopy(bankInstructions.swift)} className="text-gray-400 hover:text-white p-2">
                        <Copy size={16} />
                      </button>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-4">
                      <p className="text-yellow-400/90 text-xs">
                        Please include your Krevon account name in the transfer reference to expedite processing.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6 text-sm">
                    Bank instructions are currently unavailable for {selectedFiat}.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Submission & History */}
          <div className="space-y-6">
            <div className="bg-[#152336] rounded-2xl p-6 border border-white/5">
              <h2 className="text-white font-semibold mb-2">
                2. Submit Proof of Payment
              </h2>
              <p className="text-gray-400 text-sm mb-5">
                After sending, submit your transfer details below so our team can verify and credit your account.
              </p>
              
              {activeTab === 'crypto' ? (
                <form onSubmit={handleCryptoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-1.5">Cryptocurrency Sent</label>
                    <select
                      value={selectedCrypto?.id || ''}
                      onChange={e => handleSelectCrypto(CRYPTOS.find(c => c.id === e.target.value))}
                      className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="">Select crypto...</option>
                      {CRYPTOS.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
                    </select>
                  </div>
                  
                  {selectedCrypto && selectedCrypto.networks.length > 1 && (
                    <div>
                      <label className="block text-gray-300 text-sm mb-1.5">Network Used</label>
                      <select
                        value={selectedNetwork}
                        onChange={e => handleSelectNetwork(e.target.value)}
                        className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                      >
                        <option value="">Select network...</option>
                        {selectedCrypto.networks.map(net => <option key={net} value={net}>{net}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-300 text-sm mb-1.5">Amount Sent</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={cryptoAmount}
                      onChange={e => setCryptoAmount(e.target.value)}
                      placeholder="e.g. 0.005"
                      className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1.5">Transaction Hash / TXID</label>
                    <textarea
                      rows={3}
                      value={cryptoTxHash}
                      onChange={e => setCryptoTxHash(e.target.value)}
                      placeholder="Paste your transaction hash here..."
                      className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] font-mono text-sm resize-none"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {submitting ? 'Submitting...' : 'Submit Crypto Proof'}
                  </motion.button>
                </form>
              ) : (
                <form onSubmit={handleBankSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-1.5">Amount Sent ({selectedFiat})</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={bankForm.amount}
                      onChange={e => setBankForm({...bankForm, amount: e.target.value})}
                      placeholder="e.g. 5000"
                      className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1.5">Your Full Name (Sender)</label>
                    <input
                      type="text"
                      value={bankForm.senderName}
                      onChange={e => setBankForm({...bankForm, senderName: e.target.value})}
                      placeholder="Name on bank account"
                      className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1.5">Sender Bank Name</label>
                    <input
                      type="text"
                      value={bankForm.senderBank}
                      onChange={e => setBankForm({...bankForm, senderBank: e.target.value})}
                      placeholder="e.g. Chase Bank, Barclays"
                      className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1.5">Reference / Receipt Number</label>
                    <input
                      type="text"
                      value={bankForm.referenceCode}
                      onChange={e => setBankForm({...bankForm, referenceCode: e.target.value})}
                      placeholder="Transfer reference code"
                      className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {submitting ? 'Submitting...' : 'Submit Bank Deposit Proof'}
                  </motion.button>
                </form>
              )}
            </div>

            <div className="bg-[#152336] rounded-2xl p-6 border border-white/5">
              <h2 className="text-white font-semibold mb-4">My Submissions</h2>
              {loadingHistory ? (
                <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" /></div>
              ) : history.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No submissions yet.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.map(req => {
                    const style = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
                    const Icon = style.icon;
                    const isCrypto = !!req.crypto_type;
                    return (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-[#0B1221] rounded-xl border border-white/5">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-1.5 rounded-lg ${isCrypto ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {isCrypto ? <Bitcoin size={16} /> : <Building2 size={16} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white text-sm font-medium">
                                {isCrypto ? req.crypto_type : req.currency} â€” {isCrypto ? req.amount_sent : req.amount}
                              </p>
                            </div>
                            <p className="text-gray-500 text-xs font-mono mt-1">
                              {isCrypto ? req.transaction_hash.slice(0, 16) + '...' : req.reference_code}
                            </p>
                            <p className="text-gray-500 text-[10px] mt-0.5">{new Date(req.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${style.color} ${style.bg}`}>
                          <Icon size={12} /> {style.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundAccount;

