import React, { useState, useEffect, useContext } from 'react';
import { ArrowRightLeft, Plus, CreditCard, Activity, ArrowUpRight, ArrowDownRight, LogOut, Wallet, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const rates = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0064,
  CHF: 1.11,
  AUD: 0.66,
  CAD: 0.73,
  NGN: 0.00067,
  BTC: 60000,
  ETH: 3000,
  USDT: 1.0
};

const calculateTotalBalance = (balances, currentRates) => {
  if (!balances || !Array.isArray(balances)) return 0;
  return balances.reduce((sum, wallet) => {
    const code = (wallet.currency_code || 'USD').toUpperCase();
    const balance = parseFloat(wallet.balance) || 0;
    const rate = currentRates[code] || 1.0;
    return sum + (balance * rate);
  }, 0);
};

const AVAILABLE_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', type: 'fiat' },
  { code: 'EUR', name: 'Euro', symbol: '€', type: 'fiat' },
  { code: 'GBP', name: 'British Pound', symbol: '£', type: 'fiat' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', type: 'fiat' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', type: 'fiat' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', type: 'fiat' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', type: 'fiat' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', type: 'fiat' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', type: 'fiat' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', type: 'fiat' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', type: 'fiat' },
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', type: 'crypto' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', type: 'crypto' },
  { code: 'USDT', name: 'Tether', symbol: '₮', type: 'crypto' },
];

const Dashboard = () => {
  const [account, setAccount] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [addingWallet, setAddingWallet] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const [liveRates, setLiveRates] = useState(rates);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) { /* ignore */ }
    setUser(null);
    navigate('/login');
  };

  const fetchAccount = async () => {
    try {
      const res = await api.get('/account');
      setAccount(res.data.account);
    } catch (err) {
      console.error('Failed to refresh account:', err);
    }
  };

  const handleAddWallet = async (currencyCode) => {
    setAddingWallet(true);
    try {
      await api.post('/account/currency', { currency: currencyCode });
      toast.success(`${currencyCode} wallet created successfully!`);
      await fetchAccount();
      setShowWalletModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add wallet');
    } finally {
      setAddingWallet(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [accountRes, transactionsRes] = await Promise.all([
          api.get('/account'),
          api.get('/transfers/history?limit=5')
        ]);
        
        setAccount(accountRes.data.account);
        setRecentTransactions(transactionsRes.data.transactions || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchLiveRates = async () => {
      try {
        const [fiatRes, cryptoRes] = await Promise.all([
          fetch('https://open.er-api.com/v6/latest/USD').then(res => res.ok ? res.json() : null).catch(() => null),
          fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd').then(res => res.ok ? res.json() : null).catch(() => null)
        ]);
        
        const newRates = { ...rates };
        
        if (fiatRes && fiatRes.rates) {
          Object.keys(fiatRes.rates).forEach(currency => {
            if (fiatRes.rates[currency]) newRates[currency] = 1 / fiatRes.rates[currency];
          });
        }
        
        if (cryptoRes) {
          if (cryptoRes.bitcoin?.usd) newRates['BTC'] = cryptoRes.bitcoin.usd;
          if (cryptoRes.ethereum?.usd) newRates['ETH'] = cryptoRes.ethereum.usd;
          if (cryptoRes.tether?.usd) newRates['USDT'] = cryptoRes.tether.usd;
        }
        
        setLiveRates(newRates);
      } catch (err) {
        console.error("Failed to fetch live rates", err);
      }
    };

    fetchDashboardData();
    fetchLiveRates();
  }, []);

  const fiatWallets = account?.balances?.filter(w => !['BTC', 'ETH', 'USDT'].includes(w.currency_code)) || [];
  const cryptoWallets = account?.balances?.filter(w => ['BTC', 'ETH', 'USDT'].includes(w.currency_code)) || [];
  
  const fiatTotal = calculateTotalBalance(fiatWallets, liveRates);
  const cryptoTotal = calculateTotalBalance(cryptoWallets, liveRates);
  const combinedWealth = fiatTotal + cryptoTotal;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1221] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#152336] border-t-[#D4AF37] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1221] text-gray-900 dark:text-white font-sans">
      <div className="max-w-6xl mx-auto space-y-8 p-6 md:p-10">
        
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">Welcome Back</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your Krevon international accounts</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link to="/transfers" className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-[#D4AF37] hover:bg-[#b5952f] text-[#0B1221] px-4 sm:px-5 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap">
              <ArrowRightLeft size={18} />
              Transfer
            </Link>
            <Link to="/fund-account" className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-white dark:bg-[#152336] hover:bg-[#1e3048] border border-[#1e3048] text-gray-900 dark:text-white px-4 sm:px-5 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap">
              <Plus size={18} />
              Add Funds
            </Link>
            <Link to="/cards" className="w-full sm:w-auto justify-center flex items-center gap-2 bg-white dark:bg-[#152336] hover:bg-[#1e3048] border border-[#1e3048] text-gray-900 dark:text-white px-4 sm:px-5 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap">
              <CreditCard size={18} />
              My Cards
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#152336] rounded-2xl p-6 border border-[#D4AF37]/30 md:col-span-3 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] opacity-10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="relative z-10 mb-4 md:mb-0">
              <p className="text-[#D4AF37] text-sm font-medium mb-1 uppercase tracking-wider">Combined Net Worth</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                ${combinedWealth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 relative z-10 bg-[#0B1221] px-4 py-2 rounded-xl">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              Account: <span className="font-mono text-white">{account?.account_number || '•••• •••• ••••'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#152336] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity size={20} className="text-[#D4AF37]" /> Fiat Accounts
                </h3>
                <p className="text-sm text-gray-500 mt-1">Total: ${fiatTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</p>
              </div>
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-[#D4AF37] hover:text-[#F3D566] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={14} /> Add Fiat
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar" style={{maxHeight: '300px'}}>
              {fiatWallets.length > 0 ? (
                fiatWallets.map((wallet) => (
                  <div key={wallet.currency_code} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-[#0B1221] rounded-xl hover:bg-gray-100 dark:hover:bg-[#0f1929] transition-colors border border-transparent dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-[#152336] flex items-center justify-center text-sm font-bold text-[#D4AF37] shadow-sm">
                        {AVAILABLE_CURRENCIES.find(c => c.code === wallet.currency_code)?.symbol || wallet.currency_code}
                      </div>
                      <div>
                        <span className="block font-semibold text-gray-900 dark:text-gray-200">{wallet.currency_code}</span>
                        <span className="block text-xs text-gray-500">{AVAILABLE_CURRENCIES.find(c => c.code === wallet.currency_code)?.name}</span>
                      </div>
                    </div>
                    <span className="font-mono font-medium text-lg text-gray-900 dark:text-white">
                      {parseFloat(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-8">No fiat wallets found</div>
              )}
            </div>
          </div>

          <div className="bg-[#0B1221] dark:bg-[#0f1929] rounded-2xl p-6 border border-gray-800 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div>
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Wallet size={20} className="text-blue-400" /> Crypto Portfolio
                </h3>
                <p className="text-sm text-gray-400 mt-1">Total: ${cryptoTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</p>
              </div>
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={14} /> Add Crypto
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar" style={{maxHeight: '300px'}}>
              {cryptoWallets.length > 0 ? (
                cryptoWallets.map((wallet) => (
                  <div key={wallet.currency_code} className="flex justify-between items-center p-4 bg-[#152336] rounded-xl hover:bg-[#1e3048] transition-colors border border-transparent border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0B1221] flex items-center justify-center text-sm font-bold text-blue-400 shadow-sm border border-gray-800">
                        {AVAILABLE_CURRENCIES.find(c => c.code === wallet.currency_code)?.symbol || wallet.currency_code}
                      </div>
                      <div>
                        <span className="block font-semibold text-white">{wallet.currency_code}</span>
                        <span className="block text-xs text-gray-400">{AVAILABLE_CURRENCIES.find(c => c.code === wallet.currency_code)?.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block font-mono font-medium text-lg text-white">
                        {parseFloat(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                      </span>
                      {liveRates[wallet.currency_code] && (
                        <span className="block text-xs text-green-400">
                          ${(parseFloat(wallet.balance) * liveRates[wallet.currency_code]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-8">No crypto wallets found</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#152336] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
            <Link to="/history" className="text-[#D4AF37] hover:text-[#b5952f] text-sm font-medium transition-colors">
              View All
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id || tx._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0B1221] rounded-xl hover:bg-[#0f1929] transition-colors border border-transparent hover:border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${tx.type === 'deposit' || tx.amount > 0 || tx.type === 'bank_funding' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {tx.type === 'deposit' || tx.amount > 0 || tx.type === 'bank_funding' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-200">{tx.description || tx.type || 'Transaction'}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-500">{new Date(tx.created_at || tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={`font-mono font-medium ${tx.type === 'deposit' || tx.amount > 0 || tx.type === 'bank_funding' ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                    {tx.amount > 0 && (tx.type === 'deposit' || tx.type === 'bank_funding') ? '+' : ''}{tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.currency_code}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-600 dark:text-gray-500 bg-gray-50 dark:bg-[#0B1221] rounded-xl">
                No recent transactions
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowWalletModal(false)}>
          <div className="bg-white dark:bg-[#152336] rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
                  <Wallet size={20} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Currency Wallet</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Select a currency to create a new wallet</p>
                </div>
              </div>
              <button onClick={() => setShowWalletModal(false)} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-white/5 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Fiat Currencies</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {AVAILABLE_CURRENCIES
                  .filter(c => c.type === 'fiat' && !account?.balances?.some(b => b.currency_code === c.code))
                  .map(c => (
                    <button
                      key={c.code}
                      disabled={addingWallet}
                      onClick={() => handleAddWallet(c.code)}
                      className="p-4 bg-gray-50 dark:bg-[#0B1221] hover:bg-[#0f1929] border border-gray-200 dark:border-gray-800 hover:border-[#D4AF37]/40 rounded-xl text-left transition-all disabled:opacity-50 group"
                    >
                      <div className="text-[#D4AF37] font-bold text-lg mb-1 group-hover:text-[#F3D566] transition-colors">{c.symbol}</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{c.code}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-500">{c.name}</div>
                    </button>
                  ))
                }
              </div>

              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Cryptocurrencies</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AVAILABLE_CURRENCIES
                  .filter(c => c.type === 'crypto' && !account?.balances?.some(b => b.currency_code === c.code))
                  .map(c => (
                    <button
                      key={c.code}
                      disabled={addingWallet}
                      onClick={() => handleAddWallet(c.code)}
                      className="p-4 bg-gray-50 dark:bg-[#0B1221] hover:bg-[#1e3048] border border-gray-200 dark:border-gray-800 hover:border-blue-500/40 rounded-xl text-left transition-all disabled:opacity-50 group"
                    >
                      <div className="text-blue-500 font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors">{c.symbol}</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{c.code}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-500">{c.name}</div>
                    </button>
                  ))
                }
              </div>

              {AVAILABLE_CURRENCIES.filter(c => !account?.balances?.some(b => b.currency_code === c.code)).length === 0 && (
                <div className="text-center py-8 text-gray-600 dark:text-gray-500">
                  You already have wallets for all available currencies.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

