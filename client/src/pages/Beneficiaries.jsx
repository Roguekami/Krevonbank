import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Building2, CreditCard, Loader2, Globe, AlertCircle, XCircle } from 'lucide-react';
import api from '../services/api';

const Beneficiaries = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    accountNumber: '',
    bankName: '',
    swiftIban: '',
    currencyCode: 'USD'
  });

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/beneficiaries');
      setBeneficiaries(data.beneficiaries || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post('/beneficiaries', formData);
      setFormData({ fullName: '', accountNumber: '', bankName: '', swiftIban: '', currencyCode: 'USD' });
      setIsAdding(false);
      fetchBeneficiaries();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this beneficiary?')) return;
    try {
      await api.delete(`/beneficiaries/${id}`);
      setBeneficiaries(beneficiaries.filter(b => b.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1221] text-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Beneficiaries</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your saved accounts for quick transfers.</p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#b5952f] text-[#0B1221] px-5 py-2.5 rounded-lg font-semibold transition-colors duration-200"
          >
            {isAdding ? <XCircle size={20} /> : <Plus size={20} />}
            {isAdding ? 'Cancel' : 'Add Beneficiary'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {/* Add Beneficiary Form */}
        {isAdding && (
          <div className="bg-white dark:bg-[#152336] rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <User className="text-[#D4AF37]" size={24} />
              New Beneficiary Details
            </h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Holder Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg pl-10 py-2.5 focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="accountNumber"
                    required
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg pl-10 py-2.5 focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all outline-none"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Bank Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="bankName"
                    required
                    value={formData.bankName}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg pl-10 py-2.5 focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all outline-none"
                    placeholder="Chase Bank"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">SWIFT / IBAN Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="swiftIban"
                    required
                    value={formData.swiftIban}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg pl-10 py-2.5 focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all outline-none uppercase"
                    placeholder="SWIFT or IBAN Code"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Currency</label>
                <select
                  name="currencyCode"
                  value={formData.currencyCode}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-[#0B1221] border border-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none"
                >
                  {['USD','EUR','GBP','NGN','CAD','JPY','CHF','AUD'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#D4AF37] hover:bg-[#b5952f] text-[#0B1221] px-8 py-3 rounded-lg font-bold transition-colors duration-200 flex items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Save Beneficiary'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Beneficiaries List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
          </div>
        ) : beneficiaries.length === 0 ? (
          <div className="bg-white dark:bg-[#152336] rounded-xl p-12 text-center border border-gray-200 dark:border-gray-800">
            <User size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No beneficiaries found</h3>
            <p className="text-gray-600 dark:text-gray-400">Add a beneficiary to easily make transfers later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beneficiaries.map((b) => (
              <div key={b.id} className="bg-white dark:bg-[#152336] rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-[#D4AF37]/50 transition-colors duration-300 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                    <User size={24} />
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-2 opacity-0 group-hover:opacity-100"
                    title="Delete Beneficiary"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{b.full_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-3">
                  <Building2 size={14} /> {b.bank_name}
                </p>
                
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Account</span>
                    <span className="text-gray-700 dark:text-gray-300 font-mono">{b.account_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">SWIFT/IBAN</span>
                    <span className="text-gray-700 dark:text-gray-300 font-mono">{b.swift_iban}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Currency</span>
                    <span className="text-[#D4AF37] font-medium">{b.currency_code}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Beneficiaries;

