import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, UploadCloud, CheckCircle, ArrowRight, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const steps = [
  'Account Setup',
  'Personal Details',
  'Identity Verification',
  'Review & Confirm',
  'Complete'
];

const KYCOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(2); // Identity Verification is index 2

  const [formData, setFormData] = useState({
    tier1DocType: 'Passport',
    tier2DocType: 'Utility Bill',
  });
  
  const [tier1File, setTier1File] = useState(null);
  const [tier2File, setTier2File] = useState(null);
  const [tier1Preview, setTier1Preview] = useState(null);
  const [tier2Preview, setTier2Preview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e, tier) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

    if (tier === 'tier1') {
      setTier1File(file);
      setTier1Preview(previewUrl);
    } else {
      setTier2File(file);
      setTier2Preview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tier1File || !tier2File) {
      toast.error('Please upload both required documents.');
      return;
    }

    setIsSubmitting(true);
    const data = new FormData();
    data.append('tier1DocType', formData.tier1DocType);
    data.append('tier2DocType', formData.tier2DocType);
    data.append('tier1Doc', tier1File);
    data.append('tier2Doc', tier2File);

    try {
      await api.post('/kyc/submit', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Documents submitted successfully!');
      setCurrentStep(4); // Move to "Complete" step
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1221] text-white pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Stepper */}
        <div className="flex items-center justify-between mb-16 overflow-x-auto pb-4 custom-scrollbar">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center whitespace-nowrap">
              <div className="flex flex-col items-center">
                <div className={`
                  flex items-center justify-center h-10 px-6 rounded-full border-2 text-sm font-semibold
                  ${idx < currentStep ? 'bg-[#152336] border-[#152336] text-gray-400' : ''}
                  ${idx === currentStep ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0B1221]' : ''}
                  ${idx > currentStep ? 'border-[#152336] text-gray-500' : ''}
                `}>
                  {idx < currentStep && <CheckCircle className="w-4 h-4 mr-2" />}
                  {step}
                </div>
                {idx === currentStep && <span className="text-[#D4AF37] text-xs mt-2 font-medium">Current Step</span>}
              </div>
              {idx < steps.length - 1 && (
                <div className="w-12 md:w-20 lg:w-32 h-[2px] mx-2 bg-[#152336]"></div>
              )}
            </div>
          ))}
        </div>

        {currentStep === 4 ? (
          /* Success / Pending Review State */
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto bg-[#152336] rounded-2xl p-10 border border-white/5 shadow-2xl text-center"
          >
            <div className="w-24 h-24 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-[#D4AF37]" />
            </div>
            <h2 className="text-3xl font-serif text-white mb-4">Documents Received</h2>
            <p className="text-gray-300 text-lg mb-8">
              Thank you for verifying your identity. Your application is currently under review by our compliance team. This usually takes between 1-24 hours.
            </p>
            <div className="bg-[#0B1221] p-6 rounded-xl border border-white/5 text-left mb-8">
              <h3 className="text-white font-medium mb-2">What happens next?</h3>
              <ul className="text-gray-400 space-y-2 text-sm">
                <li>â€¢ Our team will securely verify your uploaded documents.</li>
                <li>â€¢ You will receive an email notification once your account is approved.</li>
                <li>â€¢ Once approved, you will gain full access to your banking dashboard.</li>
              </ul>
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-4 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
            >
              Return to Homepage
            </button>
          </motion.div>
        ) : (
          /* Upload Form State */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Context */}
            <div className="lg:col-span-5">
              <h1 className="text-4xl md:text-5xl font-serif text-[#D4AF37] mb-6">
                Identity<br/>Verification
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                As a regulated financial institution, we require proof of identity to ensure the security of your account. Please provide a valid government-issued photo ID and a proof of address.
              </p>
              <div className="flex items-center gap-4 text-gray-400 bg-[#152336]/50 p-4 rounded-lg border border-[#152336]">
                <div className="bg-[#D4AF37]/10 p-2 rounded-full">
                  <Shield className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <p className="font-medium">Your data is encrypted and secure.</p>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="lg:col-span-7">
              <div className="bg-[#152336] rounded-2xl p-8 border border-white/5 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Tier 1 Document */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">Government Photo ID (Tier 1)</label>
                    <select 
                      className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                      value={formData.tier1DocType}
                      onChange={(e) => setFormData({...formData, tier1DocType: e.target.value})}
                    >
                      <option value="Passport">International Passport</option>
                      <option value="National ID">National ID Card</option>
                      <option value="Drivers License">Driver's License</option>
                    </select>

                    <div className="border-2 border-dashed border-white/20 rounded-xl p-6 flex items-center justify-between bg-[#0B1221]/50 hover:border-[#D4AF37]/50 transition-colors">
                      <div className="flex-1 text-center border-r border-white/10 pr-6">
                        <UploadCloud className="w-10 h-10 text-[#D4AF37] mx-auto mb-3" />
                        <p className="text-sm text-gray-300 mb-4">Drag and drop your file here or</p>
                        <label className="bg-[#D4AF37] text-[#0B1221] px-6 py-2 rounded-md font-semibold cursor-pointer hover:bg-[#F3D566] transition-colors inline-block">
                          Select File
                          <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(e, 'tier1')} />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">Max size 5MB. JPG, PNG, PDF.</p>
                      </div>
                      <div className="flex-1 pl-6 flex items-center justify-center">
                        {tier1Preview ? (
                          <div className="text-center">
                            <img src={tier1Preview} alt="Preview" className="h-24 object-cover rounded-md border border-white/10 mx-auto" />
                            <p className="text-xs text-gray-400 mt-2 truncate w-32 mx-auto">{tier1File.name}</p>
                          </div>
                        ) : tier1File && tier1File.type === 'application/pdf' ? (
                          <div className="text-center">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                            <p className="text-xs text-gray-400 mt-2 truncate w-32 mx-auto">{tier1File.name}</p>
                          </div>
                        ) : (
                          <div className="w-32 h-24 bg-white/5 rounded-md flex items-center justify-center border border-white/5">
                            <span className="text-xs text-gray-500">No file selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tier 2 Document */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <label className="block text-sm font-medium text-gray-300">Proof of Address (Tier 2)</label>
                    <select 
                      className="w-full bg-[#0B1221] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                      value={formData.tier2DocType}
                      onChange={(e) => setFormData({...formData, tier2DocType: e.target.value})}
                    >
                      <option value="Utility Bill">Utility Bill</option>
                      <option value="Bank Statement">Bank Statement</option>
                      <option value="Government Address Document">Government Address Document</option>
                    </select>

                    <div className="border-2 border-dashed border-white/20 rounded-xl p-6 flex items-center justify-between bg-[#0B1221]/50 hover:border-[#D4AF37]/50 transition-colors">
                      <div className="flex-1 text-center border-r border-white/10 pr-6">
                        <UploadCloud className="w-10 h-10 text-[#D4AF37] mx-auto mb-3" />
                        <label className="bg-[#D4AF37] text-[#0B1221] px-6 py-2 rounded-md font-semibold cursor-pointer hover:bg-[#F3D566] transition-colors inline-block">
                          Select File
                          <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(e, 'tier2')} />
                        </label>
                      </div>
                      <div className="flex-1 pl-6 flex items-center justify-center">
                        {tier2Preview ? (
                          <div className="text-center">
                            <img src={tier2Preview} alt="Preview" className="h-24 object-cover rounded-md border border-white/10 mx-auto" />
                            <p className="text-xs text-gray-400 mt-2 truncate w-32 mx-auto">{tier2File.name}</p>
                          </div>
                        ) : tier2File && tier2File.type === 'application/pdf' ? (
                          <div className="text-center">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                            <p className="text-xs text-gray-400 mt-2 truncate w-32 mx-auto">{tier2File.name}</p>
                          </div>
                        ) : (
                          <div className="w-32 h-24 bg-white/5 rounded-md flex items-center justify-center border border-white/5">
                            <span className="text-xs text-gray-500">No file selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D566] text-[#0B1221] font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-70"
                    >
                      {isSubmitting ? 'Submitting...' : 'Save and Continue'}
                      {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                    </motion.button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KYCOnboarding;

