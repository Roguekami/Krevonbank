import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Mail, Phone, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';

const faqs = [
  { question: "How do I open a Krevon account?", answer: "Opening a Krevon account is simple. Click the Open Account button on our homepage, complete the registration form with your personal details, verify your email address, and then complete our identity verification process by uploading a valid government-issued ID and proof of address. Once our compliance team reviews and approves your documents, your account will be fully activated." },
  { question: "How long does KYC verification take?", answer: "Our compliance team typically reviews KYC submissions within 24 to 48 business hours. You will receive an email notification once your verification is complete. If additional documents are required, we will contact you with clear instructions on what to provide." },
  { question: "Are there any hidden fees?", answer: "No. Krevon is committed to full transparency. All applicable fees are clearly displayed before you confirm any transaction. There are no hidden charges, maintenance fees, or surprise deductions on your account." },
  { question: "How do I fund my Krevon account?", answer: "You can fund your account in two ways. The first is via international bank wire transfer we will provide you with Krevon's official receiving bank details and you send funds directly from your external bank. The second is via cryptocurrency deposit you select your preferred crypto and network, send funds to our designated wallet address, and submit your transaction hash as proof. Our team will verify and credit your account once confirmed." },
  { question: "How long does it take for my account to be credited after a funding request?", answer: "Funding requests are processed manually by our operations team. Bank wire transfers are typically credited within 1 to 3 business days after we confirm receipt. Cryptocurrency deposits are credited after sufficient blockchain confirmations are received and verified by our team, usually within a few hours." },
  { question: "How do I send an international wire transfer?", answer: "Navigate to the Transfers section of your dashboard, select Wire Transfer, enter the recipient's full name, bank name, account number, and SWIFT or IBAN code, select the currency and amount, and submit your request. Our team will review and process your transfer, and you will receive an email notification once it is completed." },
  { question: "What cryptocurrencies does Krevon support for deposits?", answer: "We currently support Bitcoin (BTC), Ethereum (ETH on ERC20), and Tether USDT on TRC20, ERC20, and BEP20 networks. It is critical that you send funds only on the exact network displayed for your selected crypto. Funds sent on the wrong network cannot be recovered." },
  { question: "How do I get a virtual or physical card?", answer: "Log into your dashboard and navigate to the Cards section. You can request a virtual card instantly. For a physical card, you will be asked to provide your delivery address and contact details. Physical cards are dispatched by our team and activated once delivery is confirmed." },
  { question: "How do I freeze my card?", answer: "You can freeze your card instantly from the Cards section of your dashboard. Simply click Freeze Card on the card you want to suspend. Your card will be immediately disabled and can be unfrozen at any time from the same page." },
  { question: "What should I do if I notice a suspicious transaction on my account?", answer: "Contact our support team immediately at support@krevon.com or through the Contact Support form below. You should also freeze any associated cards immediately from your dashboard. Our fraud team will investigate and respond within 24 hours." },
  { question: "How do I close my Krevon account?", answer: "To close your account, please contact our support team at support@krevon.com with your registered email address and a written request for account closure. Please ensure your account balance is withdrawn before submitting a closure request. Account closure requests are processed within 5 to 7 business days." },
  { question: "Is Krevon regulated?", answer: "Yes. Krevon International Bank is authorised and regulated by the Financial Conduct Authority (FCA) in the United Kingdom. We operate in full compliance with UK financial regulations, international anti-money laundering (AML) laws, and applicable data protection legislation." }
];

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-gray-200 dark:border-white/10 rounded-lg bg-white/5 overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none">
        <span className="font-medium text-gray-900 dark:text-white pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-brand-gold shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="px-6 pb-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Support = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');
    try {
      await api.post('/support/contact', formData);
      setSuccessMsg('Thank you for reaching out. We have received your message and will respond to your registered email within 2 to 4 business hours.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-8 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-gold/10 via-brand-navy to-brand-navy">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">How Can We Help?</h1>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-10">
                Browse our most frequently asked questions or send us a message directly. Our premium support team is available 24 hours a day, 7 days a week to assist you with any questions or concerns.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Details Strip */}
        <section className="border-y border-gray-200 dark:border-white/10 bg-[#0f172a]/50">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-brand-gold" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white mb-0.5">Email</div>
                  <a href="mailto:support@krevon.com" className="hover:text-brand-gold transition-colors block">support@krevon.com</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-brand-gold" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white mb-0.5">Phone</div>
                  <span>+44 20 0000 0000</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-brand-gold" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white mb-0.5">Address</div>
                  <span>Krevon International Bank, London, UK</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-brand-gold" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white mb-0.5">Response Time</div>
                  <span>2 to 4 business hours</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content (FAQ + Form) */}
        <section className="py-20 px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 relative">
            
            {/* FAQ Section */}
            <div className="lg:col-span-7">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <FAQItem key={index} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>

            {/* Contact Form Section */}
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Send Us a Message</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  Can't find what you're looking for? Fill out the form below and a member of our support team will get back to you within 2 to 4 business hours.
                </p>

                {successMsg ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-green-400 font-medium leading-relaxed">{successMsg}</p>
                    <button 
                      onClick={() => setSuccessMsg('')} 
                      className="mt-6 text-sm text-brand-gold hover:text-gray-900 dark:text-white transition-colors font-medium"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                      <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-brand-navy border border-gray-200 dark:border-white/10 rounded-md px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-brand-gold transition-colors" placeholder="John Doe" />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-brand-navy border border-gray-200 dark:border-white/10 rounded-md px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-brand-gold transition-colors" placeholder="john@example.com" />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                      <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required className="w-full bg-brand-navy border border-gray-200 dark:border-white/10 rounded-md px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-brand-gold transition-colors" placeholder="How can we help you?" />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                      <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows="5" className="w-full bg-brand-navy border border-gray-200 dark:border-white/10 rounded-md px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-brand-gold transition-colors resize-none" placeholder="Describe your issue..." />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-brand-gold text-brand-navy font-bold py-3.5 rounded-md hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-4">We typically respond within 2 to 4 business hours.</p>
                  </form>
                )}
              </div>
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Support;
