import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Calendar, Download, X, Check } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { generateStatementPDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Export states
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  
  // Search & Filter states for the view
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, deposit, transfer, etc
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, pending, failed

  const { user } = React.useContext(AuthContext);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await api.get('/transfers/history');
        setTransactions(data.transactions || []);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get(`/transfers/statement?startDate=${exportStartDate}&endDate=${exportEndDate}`);
      if (!data.transactions || data.transactions.length === 0) {
        toast.error('No transactions found in this date range.');
        setExporting(false);
        return;
      }
      generateStatementPDF(data.transactions, user, exportStartDate, exportEndDate);
      toast.success('Statement generated successfully!');
    } catch (error) {
      console.error("Export error:", error);
      toast.error('Failed to generate statement.');
    } finally {
      setExporting(false);
    }
  };

  // Compute active filters count
  let activeFiltersCount = 0;
  if (filterType !== 'all') activeFiltersCount++;
  if (filterStatus !== 'all') activeFiltersCount++;

  let activeDateFiltersCount = 0;
  if (filterStartDate) activeDateFiltersCount++;
  if (filterEndDate) activeDateFiltersCount++;

  // Apply filters locally
  const filteredTransactions = transactions.filter(tx => {
    // 1. Search text
    const searchMatch = 
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tx.currency_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.status?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!searchMatch) return false;

    // 2. Type filter
    if (filterType !== 'all') {
      const type = tx.type || tx.transferType || '';
      if (type !== filterType) return false;
    }

    // 3. Status filter
    if (filterStatus !== 'all') {
      const stat = tx.status || '';
      if (stat !== filterStatus) return false;
    }

    // 4. Date filter
    if (filterStartDate || filterEndDate) {
      const txDate = new Date(tx.created_at || tx.createdAt);
      if (filterStartDate) {
        const sDate = new Date(filterStartDate);
        if (txDate < sDate) return false;
      }
      if (filterEndDate) {
        const eDate = new Date(filterEndDate);
        // Add 1 day to make end date inclusive
        eDate.setDate(eDate.getDate() + 1);
        if (txDate >= eDate) return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1221] text-gray-900 dark:text-white p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header section (Export Statement) */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">Transaction History</h1>
            <p className="text-gray-600 dark:text-gray-400">View and download your account activity</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-end bg-white dark:bg-[#152336] p-3 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex gap-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-500 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="bg-gray-50 dark:bg-[#0B1221] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37] text-sm [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-600 dark:text-gray-500 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="bg-gray-50 dark:bg-[#0B1221] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37] text-sm [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] px-4 py-2 rounded-lg font-bold transition-all text-sm disabled:opacity-50 h-[38px] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-[#0B1221] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download size={16} />
              )}
              {exporting ? 'Generating...' : 'Export Statement'}
            </button>
          </div>
        </header>

        {/* View Filters & Search */}
        <div className="bg-white dark:bg-[#152336] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-center justify-between relative">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by description, currency, status..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-[#D4AF37] transition-colors text-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto relative">
            
            {/* DATE RANGE FILTER BUTTON */}
            <div className="relative">
              <button 
                onClick={() => { setShowDateFilter(!showDateFilter); setShowTypeFilter(false); }}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 border px-4 py-2.5 rounded-xl font-medium transition-colors text-sm ${showDateFilter || activeDateFiltersCount > 0 ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-gray-50 dark:bg-[#0B1221] border-gray-700 hover:border-gray-500 text-gray-900 dark:text-white'}`}
              >
                <Calendar size={16} className={showDateFilter || activeDateFiltersCount > 0 ? 'text-[#D4AF37]' : 'text-gray-600 dark:text-gray-400'} />
                Date Range
                {activeDateFiltersCount > 0 && <span className="bg-[#D4AF37] text-[#0B1221] text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold ml-1">{activeDateFiltersCount}</span>}
              </button>

              {/* DATE RANGE DROPDOWN */}
              {showDateFilter && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-gray-100 dark:bg-[#111A2C] border border-gray-700 rounded-xl shadow-2xl z-20 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Filter by Date</h3>
                    <button onClick={() => setShowDateFilter(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white"><X size={16}/></button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">From</label>
                      <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To</label>
                      <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37] outline-none" />
                    </div>
                    <button 
                      onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setShowDateFilter(false); }}
                      className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white mt-2 py-1"
                    >
                      Clear Dates
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* FILTERS BUTTON */}
            <div className="relative">
              <button 
                onClick={() => { setShowTypeFilter(!showTypeFilter); setShowDateFilter(false); }}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 border px-4 py-2.5 rounded-xl font-medium transition-colors text-sm ${showTypeFilter || activeFiltersCount > 0 ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-gray-50 dark:bg-[#0B1221] border-gray-700 hover:border-gray-500 text-gray-900 dark:text-white'}`}
              >
                <Filter size={16} className={showTypeFilter || activeFiltersCount > 0 ? 'text-[#D4AF37]' : 'text-gray-600 dark:text-gray-400'} />
                Filters
                {activeFiltersCount > 0 && <span className="bg-[#D4AF37] text-[#0B1221] text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold ml-1">{activeFiltersCount}</span>}
              </button>

              {/* FILTERS DROPDOWN */}
              {showTypeFilter && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-gray-100 dark:bg-[#111A2C] border border-gray-700 rounded-xl shadow-2xl z-20 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Status & Type</h3>
                    <button onClick={() => setShowTypeFilter(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white"><X size={16}/></button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-600 dark:text-gray-500 mb-2">Status</label>
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37] outline-none">
                        <option value="all">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-600 dark:text-gray-500 mb-2">Type</label>
                      <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37] outline-none">
                        <option value="all">All Types</option>
                        <option value="deposit">Deposit</option>
                        <option value="internal_transfer">Internal Transfer</option>
                        <option value="international_wire">Wire Transfer</option>
                      </select>
                    </div>
                    <button 
                      onClick={() => { setFilterStatus('all'); setFilterType('all'); setShowTypeFilter(false); }}
                      className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white mt-1 py-1"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Transactions Table/List */}
        <div className="bg-white dark:bg-[#152336] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-10 h-10 border-4 border-[#0B1221] border-t-[#D4AF37] rounded-full animate-spin"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-gray-600 dark:text-gray-500">
              <Calendar size={48} className="mb-4 text-gray-700" />
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No transactions found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#0B1221] text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Description</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {filteredTransactions.map((tx) => {
                    const isPositive = tx.type === 'deposit' || tx.type === 'bank_funding' || tx.amount > 0;
                    return (
                      <tr key={tx.id || tx._id} className="hover:bg-gray-50 dark:bg-[#0B1221]/40 transition-colors">
                        <td className="p-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {new Date(tx.created_at || tx.createdAt).toLocaleDateString(undefined, { 
                            year: 'numeric', month: 'short', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg shrink-0 ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {isPositive ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-200">{tx.description || tx.type || 'Transaction'}</p>
                              {tx.reference && <p className="text-xs text-gray-600 dark:text-gray-500 font-mono mt-0.5">Ref: {tx.reference}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="text-xs font-medium px-2.5 py-1 bg-gray-50 dark:bg-[#0B1221] text-gray-700 dark:text-gray-300 rounded-md border border-gray-700 capitalize">
                            {(tx.transferType || tx.type || 'Transfer').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                            tx.status === 'completed' || tx.status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                            tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                            tx.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                            'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
                          } capitalize`}>
                            {tx.status || 'Completed'}
                          </span>
                        </td>
                        <td className={`p-4 whitespace-nowrap text-right font-mono font-medium ${isPositive ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                          {isPositive ? '+' : ''}{tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.currency_code}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
