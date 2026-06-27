import React, { useState, useEffect, useContext, useMemo } from 'react';
import { 
  Users, FileText, Send, CheckCircle, XCircle, CreditCard, 
  Lock, Unlock, RefreshCw, Loader2, DollarSign, Edit3, Search,
  AlertTriangle, ShieldCheck, User, LogOut, Bitcoin, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { generateStatementPDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

const AdminDashboard = ({ tab }) => {
  const activeTab = tab || 'users';
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  
  // Data States
  const [kycData, setKycData] = useState([]);
  const [transfersData, setTransfersData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [fundingData, setFundingData] = useState([]);
  const [bankFundingData, setBankFundingData] = useState([]);
  const [cardsData, setCardsData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState('all');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  // Modals / Inputs
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  
  // Edit Transaction Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editFormData, setEditFormData] = useState({
    amount: '', status: '', description: '', date: '',
    recipientName: '', recipientBankName: '', recipientAccountNumber: '', recipientSwiftIban: ''
  });
  
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');
  const [exportingStatementId, setExportingStatementId] = useState(null);
  const [expandedBalances, setExpandedBalances] = useState({});

  const toggleBalances = (id) => {
    setExpandedBalances(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchKYC = async () => {
    try {
      const { data } = await api.get('/admin/kyc/pending');
      setKycData(data.submissions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransfers = async () => {
    try {
      const { data } = await api.get('/admin/transactions?status=pending');
      setTransfersData(data.transactions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsersData(data.accounts || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFunding = async () => {
    try {
      const { data } = await api.get('/admin/funding/pending');
      setFundingData(data.requests || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBankFunding = async () => {
    try {
      const { data } = await api.get('/admin/funding/bank/pending');
      setBankFundingData(data.deposits || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCards = async () => {
    try {
      const { data } = await api.get('/admin/cards/pending');
      setCardsData(data.cards || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/admin/transactions');
      setHistoryData(data.transactions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchKYC(), fetchTransfers(), fetchUsers(), fetchFunding(), fetchBankFunding(), fetchCards(), fetchHistory()]);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) { /* ignore */ }
    setUser(null);
    navigate('/login');
  };

  // Actions
  const handleKYCAction = async (id, action) => {
    let payload = {};
    if (action === 'reject') {
      const reason = window.prompt("Please enter the reason for rejection:");
      if (reason === null) return; // User cancelled the prompt
      if (!reason.trim()) {
        setError("Rejection reason is required.");
        return;
      }
      payload = { reason };
    }

    setActionLoading(`kyc-${id}`);
    try {
      await api.post(`/admin/kyc/${id}/${action}`, payload);
      fetchKYC();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransferAction = async (id, action) => {
    let payload = {};
    if (action === 'reject') {
      const reason = window.prompt('Please enter the reason for rejection:');
      if (reason === null) return; // User cancelled
      if (!reason.trim()) {
        setError('Rejection reason is required.');
        return;
      }
      payload = { reason };
    }

    setActionLoading(`transfer-${id}`);
    try {
      await api.put(`/admin/transactions/${id}/${action}`, payload);
      fetchTransfers();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserStatus = async (id, action) => {
    setActionLoading(`user-${id}`);
    try {
      await api.put(`/admin/account/${id}/${action}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const [creditCurrency, setCreditCurrency] = useState('USD');

  const handleCreditAccount = async (e) => {
    e.preventDefault();
    if (!selectedUser || !creditAmount) return;
    
    setActionLoading('credit');
    try {
      await api.put(`/admin/account/${selectedUser.id}/credit`, {
        currency: creditCurrency,
        amount: parseFloat(creditAmount),
        note: `Manual credit by admin`,
      });
      setCreditModalOpen(false);
      setCreditAmount('');
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCardShip = async (id) => {
    const trackingNumber = window.prompt("Enter tracking number (optional):");
    if (trackingNumber === null) return;

    setActionLoading(`card-${id}`);
    try {
      await api.put(`/admin/cards/${id}/ship`, { trackingNumber });
      fetchCards();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCardActivate = async (id) => {
    if (!window.confirm("Confirm card has been delivered and activate it?")) return;

    setActionLoading(`card-${id}`);
    try {
      await api.put(`/admin/cards/${id}/activate`);
      fetchCards();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openCreditModal = (user) => {
    setSelectedUser(user);
    setCreditModalOpen(true);
  };

  const handleExportStatement = async (user) => {
    const userId = user.user_id || user.id;
    setExportingStatementId(user.id);
    try {
      const { data } = await api.get(`/admin/users/${userId}/statement?startDate=${statementStartDate}&endDate=${statementEndDate}`);
      if (!data.transactions || data.transactions.length === 0) {
        toast.error('No transactions found in this date range.');
        setExportingStatementId(null);
        return;
      }
      generateStatementPDF(data.transactions, user, statementStartDate, statementEndDate);
      toast.success('Statement generated successfully!');
    } catch (error) {
      console.error("Export error:", error);
      toast.error('Failed to generate statement.');
    } finally {
      setExportingStatementId(null);
    }
  };

  // Filtered transactions for All Transactions tab
  const filteredHistory = useMemo(() => {
    return historyData.filter(item => {
      // Text search
      if (txSearchQuery.trim()) {
        const q = txSearchQuery.toLowerCase();
        const matchesSearch = 
          (item.sender_name || '').toLowerCase().includes(q) ||
          (item.sender_email || '').toLowerCase().includes(q) ||
          (item.recipient_name || '').toLowerCase().includes(q) ||
          (item.recipient_account_number || '').toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          String(item.id).includes(q) ||
          String(item.amount).includes(q);
        if (!matchesSearch) return false;
      }
      // Status filter
      if (txStatusFilter !== 'all' && item.status !== txStatusFilter) return false;
      // Type filter
      if (txTypeFilter !== 'all' && item.type !== txTypeFilter) return false;
      return true;
    });
  }, [historyData, txSearchQuery, txStatusFilter, txTypeFilter]);

  const openEditModal = (tx) => {
    setSelectedTransaction(tx);
    // Format date for datetime-local (YYYY-MM-DDThh:mm)
    let formattedDate = '';
    if (tx.created_at) {
      const d = new Date(tx.created_at);
      formattedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    setEditFormData({
      amount: tx.amount || '',
      status: tx.status || 'pending',
      description: tx.description || '',
      date: formattedDate,
      recipientName: tx.recipient_name || '',
      recipientBankName: tx.recipient_bank_name || '',
      recipientAccountNumber: tx.recipient_account_number || '',
      recipientSwiftIban: tx.recipient_swift_iban || ''
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    setActionLoading('edit-tx');
    try {
      await api.put(`/admin/transactions/${selectedTransaction.id}/edit`, {
        ...editFormData,
        amount: parseFloat(editFormData.amount)
      });
      setEditModalOpen(false);
      setSelectedTransaction(null);
      fetchHistory();
      toast.success('Transaction updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Render Helpers
  const TabButton = ({ id, label, icon: Icon, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
        activeTab === id 
          ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' 
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-200 hover:bg-white/5'
      }`}
    >
      <Icon size={18} />
      {label}
      {count !== undefined && count > 0 && (
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          activeTab === id ? 'bg-[#D4AF37] text-[#0B1221]' : 'bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="p-6 md:p-8 text-gray-100 w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
          {activeTab === 'kyc' && 'KYC Approvals'}
          {activeTab === 'transfers' && 'Pending Transfers'}
          {activeTab === 'all-transactions' && 'All Transactions'}
          {activeTab === 'users' && 'Manage Users'}
          {activeTab === 'funding' && 'Funding Requests'}
          {activeTab === 'cards' && 'Physical Cards'}
        </h2>
        <button 
          onClick={fetchAllData}
          className="flex items-center gap-2 bg-white dark:bg-[#152336] hover:bg-[#1e3048] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Content Area */}
        <div className="bg-white dark:bg-[#152336] rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl min-h-[500px]">
          {loading ? (
            <div className="h-full flex items-center justify-center py-32">
              <Loader2 className="animate-spin text-[#D4AF37]" size={48} />
            </div>
          ) : (
            <div className="p-6">
              
              {/* KYC TAB */}
              {activeTab === 'kyc' && (
                <div className="space-y-4">
                  {kycData.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-500 py-12">No pending KYC applications.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">
                            <th className="p-4 font-medium">User</th>
                            <th className="p-4 font-medium">Documents</th>
                            <th className="p-4 font-medium">Submitted</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                          {kycData.map((item) => (
                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-4">
                                <div className="font-medium text-gray-900 dark:text-white">{item.full_name || 'Unknown User'}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-500">{item.email || ''}</div>
                              </td>
                              <td className="p-4">
                                <div className="text-gray-700 dark:text-gray-300 text-sm mb-1">{item.tier1_doc_type || 'Passport'}</div>
                                <div className="flex gap-2">
                                  {item.tier1_doc_url && (
                                    <a href={item.tier1_doc_url} target="_blank" rel="noreferrer" className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 bg-[#D4AF37]/10 px-2 py-1 rounded">
                                      <FileText size={12} /> ID
                                    </a>
                                  )}
                                  {item.tier2_doc_url && (
                                    <a href={item.tier2_doc_url} target="_blank" rel="noreferrer" className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 bg-[#D4AF37]/10 px-2 py-1 rounded">
                                      <FileText size={12} /> Proof of Address
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">{new Date(item.created_at).toLocaleDateString()}</td>
                              <td className="p-4 flex justify-end gap-2">
                                <button 
                                  onClick={() => handleKYCAction(item.id, 'approve')}
                                  disabled={actionLoading === `kyc-${item.id}`}
                                  className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors disabled:opacity-50"
                                  title="Approve"
                                >
                                  <CheckCircle size={20} />
                                </button>
                                <button 
                                  onClick={() => handleKYCAction(item.id, 'reject')}
                                  disabled={actionLoading === `kyc-${item.id}`}
                                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                                  title="Reject"
                                >
                                  <XCircle size={20} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TRANSFERS TAB */}
              {activeTab === 'transfers' && (
                <div className="space-y-4">
                  {transfersData.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-500 py-12">No pending wire transfers.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">
                            <th className="p-4 font-medium">Sender</th>
                            <th className="p-4 font-medium">Beneficiary</th>
                            <th className="p-4 font-medium">Amount</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                          {transfersData.map((item) => (
                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-4">
                                <div className="font-medium text-gray-900 dark:text-white">{item.sender_name || 'Unknown'}</div>
                              </td>
                              <td className="p-4">
                                <div className="text-gray-700 dark:text-gray-300">{item.recipient_name || 'Unknown Bank'}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-500 font-mono">{item.recipient_account_number}</div>
                              </td>
                              <td className="p-4 font-mono text-[#D4AF37] font-medium">
                                ${parseFloat(item.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                              </td>
                              <td className="p-4 flex justify-end gap-2">
                                <button 
                                  onClick={() => handleTransferAction(item.id, 'approve')}
                                  disabled={actionLoading === `transfer-${item.id}`}
                                  className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors disabled:opacity-50"
                                  title="Approve Transfer"
                                >
                                  <CheckCircle size={20} />
                                </button>
                                <button 
                                  onClick={() => handleTransferAction(item.id, 'reject')}
                                  disabled={actionLoading === `transfer-${item.id}`}
                                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                                  title="Reject Transfer"
                                >
                                  <XCircle size={20} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ALL TRANSACTIONS TAB */}
              {activeTab === 'all-transactions' && (
                <div className="space-y-4">
                  {/* Search & Filter Bar */}
                  <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                    <div className="relative flex-1 w-full">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-500" />
                      <input
                        type="text"
                        value={txSearchQuery}
                        onChange={(e) => setTxSearchQuery(e.target.value)}
                        placeholder="Search by name, email, account number, amount..."
                        className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-[#D4AF37] outline-none placeholder-gray-500"
                      />
                    </div>
                    <select
                      value={txStatusFilter}
                      onChange={(e) => setTxStatusFilter(e.target.value)}
                      className="bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:border-[#D4AF37] outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                      value={txTypeFilter}
                      onChange={(e) => setTxTypeFilter(e.target.value)}
                      className="bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:border-[#D4AF37] outline-none"
                    >
                      <option value="all">All Types</option>
                      <option value="internal_transfer">Internal Transfer</option>
                      <option value="wire_transfer">Wire Transfer</option>
                      <option value="deposit">Deposit</option>
                      <option value="bank_funding">Bank Funding</option>
                    </select>
                    <span className="text-xs text-gray-600 dark:text-gray-500 whitespace-nowrap">
                      {filteredHistory.length} of {historyData.length} transactions
                    </span>
                  </div>

                  {filteredHistory.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-500 py-12">{txSearchQuery || txStatusFilter !== 'all' || txTypeFilter !== 'all' ? 'No transactions match your filters.' : 'No transactions found.'}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">
                            <th className="p-4 font-medium">Date</th>
                            <th className="p-4 font-medium">User/Sender</th>
                            <th className="p-4 font-medium">Details</th>
                            <th className="p-4 font-medium">Type</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Amount</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                          {filteredHistory.map((item) => (
                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {new Date(item.created_at).toLocaleDateString(undefined, { 
                                  year: 'numeric', month: 'short', day: 'numeric', 
                                  hour: '2-digit', minute: '2-digit' 
                                })}
                              </td>
                              <td className="p-4">
                                <div className="font-medium text-gray-900 dark:text-white">{item.sender_name || 'System / External'}</div>
                                {item.sender_email && <div className="text-xs text-gray-600 dark:text-gray-500">{item.sender_email}</div>}
                              </td>
                              <td className="p-4">
                                <div className="text-gray-700 dark:text-gray-300 text-sm max-w-[200px] truncate" title={item.description || item.recipient_name}>
                                  {item.recipient_name || item.description || '-'}
                                </div>
                                {item.recipient_account_number && <div className="text-xs text-gray-600 dark:text-gray-500 font-mono">{item.recipient_account_number}</div>}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className="text-xs font-medium px-2.5 py-1 bg-gray-50 dark:bg-[#0B1221] text-gray-700 dark:text-gray-300 rounded-md border border-gray-700 capitalize">
                                  {(item.type || 'transfer').replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                                  item.status === 'completed' || item.status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                  item.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                                  item.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                  'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
                                } capitalize`}>
                                  {item.status || 'completed'}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-[#D4AF37] font-medium text-right">
                                {parseFloat(item.amount).toLocaleString(undefined, {minimumFractionDigits: 2})} {item.currency_code}
                              </td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => openEditModal(item)}
                                  className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors inline-flex"
                                  title="Edit Transaction"
                                >
                                  <Edit3 size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* USERS TAB */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  {usersData.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-500 py-12">No users found.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {usersData.map((user) => (
                        <div key={user.id} className="bg-gray-50 dark:bg-[#0B1221] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300">
                                <User size={20} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{user.full_name || 'User'}</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-500">{user.email}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              user.is_frozen ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                              {user.is_frozen ? 'Frozen' : 'Active'}
                            </span>
                          </div>

                          <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                              <span>Account Balances</span>
                              {user.balances && user.balances.length > 1 && (
                                <button 
                                  onClick={() => toggleBalances(user.id)}
                                  className="text-[#D4AF37] hover:underline text-xs"
                                >
                                  {expandedBalances[user.id] ? 'Hide' : `+${user.balances.length - 1} more`}
                                </button>
                              )}
                            </div>
                            
                            {user.balances && user.balances.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {user.balances.slice(0, expandedBalances[user.id] ? user.balances.length : 1).map((b, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm font-mono bg-gray-50 dark:bg-[#0B1221] px-3 py-1.5 rounded">
                                    <span className="text-gray-500 dark:text-gray-400">{b.currency_code}</span>
                                    <span className="text-[#D4AF37] font-semibold">
                                      {parseFloat(b.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex justify-between items-center text-sm font-mono bg-gray-50 dark:bg-[#0B1221] px-3 py-1.5 rounded">
                                <span className="text-gray-500 dark:text-gray-400">USD</span>
                                <span className="text-[#D4AF37] font-semibold">0.00</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => openCreditModal(user)}
                              className="flex-1 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <DollarSign size={16} /> Credit
                            </button>
                            {user.is_frozen ? (
                              <button
                                onClick={() => handleUserStatus(user.id, 'unfreeze')}
                                disabled={actionLoading === `user-${user.id}`}
                                className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                <Unlock size={16} /> Unfreeze
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserStatus(user.id, 'freeze')}
                                disabled={actionLoading === `user-${user.id}`}
                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                <Lock size={16} /> Freeze
                              </button>
                            )}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                            <div className="flex gap-2 text-xs">
                              <input 
                                type="date" 
                                value={statementStartDate}
                                onChange={(e) => setStatementStartDate(e.target.value)}
                                className="w-1/2 bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#D4AF37]"
                              />
                              <input 
                                type="date" 
                                value={statementEndDate}
                                onChange={(e) => setStatementEndDate(e.target.value)}
                                className="w-1/2 bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#D4AF37]"
                              />
                            </div>
                            <button
                              onClick={() => handleExportStatement(user)}
                              disabled={exportingStatementId === user.id}
                              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-[#152336] hover:bg-[#1e3048] border border-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {exportingStatementId === user.id ? (
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <FileText size={16} />
                              )}
                              {exportingStatementId === user.id ? 'Generating...' : 'Export Statement'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
                            {/* FUNDING TAB */}
              {activeTab === 'funding' && (
                <div className="space-y-8">
                  {/* CRYPTO FUNDING TABLE */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Bitcoin className="text-[#D4AF37]" size={20} />
                      Crypto Funding
                    </h3>
                    {fundingData.length === 0 ? (
                      <p className="text-center text-gray-600 dark:text-gray-500 py-6 bg-gray-50 dark:bg-[#0B1221] rounded-xl border border-white/5">No crypto funding requests.</p>
                    ) : (
                      <div className="overflow-x-auto bg-gray-50 dark:bg-[#0B1221] rounded-xl border border-white/5">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">
                              <th className="p-4 font-medium">User</th>
                              <th className="p-4 font-medium">Crypto</th>
                              <th className="p-4 font-medium">Network</th>
                              <th className="p-4 font-medium">Amount Sent</th>
                              <th className="p-4 font-medium">Tx Hash</th>
                              <th className="p-4 font-medium">Status</th>
                              <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/50">
                            {fundingData.map((item) => (
                              <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-4">
                                  <div className="font-medium text-gray-900 dark:text-white">{item.full_name}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-500">{item.email}</div>
                                  {item.account_id && (
                                    <button
                                      onClick={() => openCreditModal({ id: item.account_id, full_name: item.full_name })}
                                      className="text-xs text-[#D4AF37] hover:underline mt-1 flex items-center gap-1"
                                    >
                                      <DollarSign size={10}/> Credit Account
                                    </button>
                                  )}
                                </td>
                                <td className="p-4">
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400">
                                    {item.crypto_type}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className="text-gray-600 dark:text-gray-400 text-xs font-mono">{item.network}</span>
                                </td>
                                <td className="p-4 font-mono text-[#D4AF37]">{item.amount_sent}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 dark:text-gray-400 text-xs font-mono">{item.transaction_hash.slice(0, 16)}...</span>
                                    <a
                                      href={`https://blockchair.com/search?q=${item.transaction_hash}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[#D4AF37] hover:text-gray-900 dark:text-white"
                                      title="Verify on blockchain"
                                    >
                                      <ExternalLink size={14} />
                                    </a>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                    item.status === 'verified' ? 'bg-green-500/10 text-green-400' :
                                    'bg-red-500/10 text-red-400'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex justify-end gap-2">
                                    {item.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={async () => {
                                            setActionLoading(`funding-${item.id}`);
                                            try {
                                              await api.put(`/admin/funding/${item.id}/status`, { status: 'verified' });
                                              fetchFunding();
                                            } catch(e) { setError(e.response?.data?.message || 'Failed'); }
                                            finally { setActionLoading(null); }
                                          }}
                                          disabled={actionLoading === `funding-${item.id}`}
                                          className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors disabled:opacity-50"
                                          title="Mark Verified"
                                        >
                                          <CheckCircle size={18} />
                                        </button>
                                        <button
                                          onClick={async () => {
                                            setActionLoading(`funding-${item.id}`);
                                            try {
                                              await api.put(`/admin/funding/${item.id}/status`, { status: 'rejected' });
                                              fetchFunding();
                                            } catch(e) { setError(e.response?.data?.message || 'Failed'); }
                                            finally { setActionLoading(null); }
                                          }}
                                          disabled={actionLoading === `funding-${item.id}`}
                                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                                          title="Mark Rejected"
                                        >
                                          <XCircle size={18} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* BANK FUNDING TABLE */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FileText className="text-[#D4AF37]" size={20} />
                      Bank Wires
                    </h3>
                    {bankFundingData.length === 0 ? (
                      <p className="text-center text-gray-600 dark:text-gray-500 py-6 bg-gray-50 dark:bg-[#0B1221] rounded-xl border border-white/5">No bank wire requests.</p>
                    ) : (
                      <div className="overflow-x-auto bg-gray-50 dark:bg-[#0B1221] rounded-xl border border-white/5">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">
                              <th className="p-4 font-medium">User</th>
                              <th className="p-4 font-medium">Bank Details</th>
                              <th className="p-4 font-medium">Reference Code</th>
                              <th className="p-4 font-medium">Amount</th>
                              <th className="p-4 font-medium">Status</th>
                              <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/50">
                            {bankFundingData.map((item) => (
                              <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-4">
                                  <div className="font-medium text-gray-900 dark:text-white">{item.full_name}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-500">{item.email}</div>
                                  {item.account_id && (
                                    <button
                                      onClick={() => openCreditModal({ id: item.account_id, full_name: item.full_name })}
                                      className="text-xs text-[#D4AF37] hover:underline mt-1 flex items-center gap-1"
                                    >
                                      <DollarSign size={10}/> Credit Account
                                    </button>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="font-medium text-gray-700 dark:text-gray-300">{item.sender_bank}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-500">{item.sender_name}</div>
                                </td>
                                <td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-400">{item.reference_code}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">{item.currency}</span>
                                    <span className="font-mono text-[#D4AF37]">{item.amount}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                    item.status === 'verified' ? 'bg-green-500/10 text-green-400' :
                                    'bg-red-500/10 text-red-400'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex justify-end gap-2">
                                    {item.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={async () => {
                                            setActionLoading(`bank-${item.id}`);
                                            try {
                                              await api.put(`/admin/funding/bank/${item.id}/status`, { status: 'verified' });
                                              fetchBankFunding();
                                            } catch(e) { setError(e.response?.data?.message || 'Failed'); }
                                            finally { setActionLoading(null); }
                                          }}
                                          disabled={actionLoading === `bank-${item.id}`}
                                          className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors disabled:opacity-50"
                                          title="Mark Verified"
                                        >
                                          <CheckCircle size={18} />
                                        </button>
                                        <button
                                          onClick={async () => {
                                            setActionLoading(`bank-${item.id}`);
                                            try {
                                              await api.put(`/admin/funding/bank/${item.id}/status`, { status: 'rejected' });
                                              fetchBankFunding();
                                            } catch(e) { setError(e.response?.data?.message || 'Failed'); }
                                            finally { setActionLoading(null); }
                                          }}
                                          disabled={actionLoading === `bank-${item.id}`}
                                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                                          title="Mark Rejected"
                                        >
                                          <XCircle size={18} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CARDS TAB */}
              {activeTab === 'cards' && (
                <div className="space-y-4">
                  {cardsData.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-500 py-12">No pending physical card requests.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">
                            <th className="p-4 font-medium">User</th>
                            <th className="p-4 font-medium">Card Info</th>
                            <th className="p-4 font-medium">Delivery Address</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                          {cardsData.map((item) => (
                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-4">
                                <div className="font-medium text-gray-900 dark:text-white">{item.full_name}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-500">{item.email}</div>
                              </td>
                              <td className="p-4">
                                <div className="text-gray-700 dark:text-gray-300 text-sm mb-1">{item.card_number_masked}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-500">Exp: {item.expiry_date}</div>
                              </td>
                              <td className="p-4">
                                <div className="text-gray-900 dark:text-white text-sm">{item.delivery_name} <span className="text-gray-500">({item.delivery_phone})</span></div>
                                <div className="text-gray-600 dark:text-gray-400 text-sm">{item.delivery_address}</div>
                                <div className="text-gray-600 dark:text-gray-400 text-sm">{item.delivery_city}, {item.delivery_postal}, {item.delivery_country}</div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.status === 'requested' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                                  'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                  {item.status.toUpperCase()}
                                </span>
                                {item.tracking_number && (
                                  <div className="text-xs text-gray-600 dark:text-gray-500 mt-1">Tracking: {item.tracking_number}</div>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  {item.status === 'requested' && (
                                    <button
                                      onClick={() => handleCardShip(item.id)}
                                      disabled={actionLoading === `card-${item.id}`}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                      {actionLoading === `card-${item.id}` ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                      Mark Shipped
                                    </button>
                                  )}
                                  {item.status === 'shipped' && (
                                    <button
                                      onClick={() => handleCardActivate(item.id)}
                                      disabled={actionLoading === `card-${item.id}`}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                      {actionLoading === `card-${item.id}` ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                      Confirm Delivered
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      {/* Credit Account Modal */}
      {creditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#152336] rounded-xl border border-gray-700 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Credit Account</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Add funds to <span className="text-[#D4AF37] font-medium">{selectedUser.full_name}'s</span> account.
              </p>
              
              <form onSubmit={handleCreditAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Currency</label>
                  <select
                    value={creditCurrency}
                    onChange={(e) => setCreditCurrency(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none"
                  >
                    {['USD','EUR','GBP','NGN','CAD','JPY','CHF','AUD','BTC','ETH','USDT'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={18} className="text-gray-500" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg pl-10 py-3 focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all outline-none font-mono text-lg"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreditModalOpen(false);
                      setCreditAmount('');
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'credit'}
                    className="flex-1 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#b5952f] text-[#0B1221] rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {actionLoading === 'credit' ? <Loader2 className="animate-spin" size={18} /> : 'Add Funds'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Edit Transaction Modal */}
      {editModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#152336] rounded-xl border border-gray-700 shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-100 dark:bg-[#111A2C]">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Transaction</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ID: <span className="font-mono text-[#D4AF37]">{selectedTransaction.id}</span>
                </p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white"><XCircle size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="editTxForm" onSubmit={handleEditSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Details */}
                  <div className="space-y-4">
                    <h3 className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider mb-2">Basic Info</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Date & Time</label>
                      <input
                        type="datetime-local"
                        value={editFormData.date}
                        onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.amount}
                        onChange={(e) => setEditFormData({...editFormData, amount: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 focus:border-[#D4AF37] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 focus:border-[#D4AF37] outline-none capitalize"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                      <textarea
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                        rows="2"
                        className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:border-[#D4AF37] outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Recipient Details */}
                  <div className="space-y-4">
                    <h3 className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider mb-2">Recipient Details</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Recipient Name</label>
                      <input
                        type="text"
                        value={editFormData.recipientName}
                        onChange={(e) => setEditFormData({...editFormData, recipientName: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 focus:border-[#D4AF37] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={editFormData.recipientBankName}
                        onChange={(e) => setEditFormData({...editFormData, recipientBankName: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 focus:border-[#D4AF37] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={editFormData.recipientAccountNumber}
                        onChange={(e) => setEditFormData({...editFormData, recipientAccountNumber: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 focus:border-[#D4AF37] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">SWIFT / IBAN</label>
                      <input
                        type="text"
                        value={editFormData.recipientSwiftIban}
                        onChange={(e) => setEditFormData({...editFormData, recipientSwiftIban: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 focus:border-[#D4AF37] outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-[#111A2C] flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="editTxForm"
                disabled={actionLoading === 'edit-tx'}
                className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#b5952f] text-[#0B1221] rounded-lg font-bold transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {actionLoading === 'edit-tx' && <Loader2 className="animate-spin" size={18} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

