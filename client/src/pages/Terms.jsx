import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1221] text-gray-700 dark:text-gray-300 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-6 py-16 md:py-24 max-w-4xl">
        <div className="bg-[#0f172a] rounded-2xl p-8 md:p-12 shadow-2xl border border-gray-200 dark:border-gray-800">
          <h1 className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-6 tracking-tight">
            Terms of Service
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 italic">Last updated: June 15, 2026</p>
          
          <div className="space-y-10 text-lg leading-relaxed">
            <section>
              <p>
                Welcome to Krevon Banking. These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and Krevon International Bank ("Krevon", "we", "us", or "our"). Please read these Terms carefully before using our platform or services. By registering an account or using any of our services, you confirm that you have read, understood, and agreed to be bound by these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the Krevon Banking platform through our website or any associated application, you agree to comply with and be bound by these Terms of Service, our Privacy Policy, and any additional terms and conditions that may apply to specific features or services. If you do not agree with any part of these Terms, you must immediately discontinue use of our platform and services.
              </p>
              <p className="mt-2">
                These Terms apply to all visitors, registered users, and any other person who accesses or uses our services in any capacity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Eligibility</h2>
              <p className="mb-4">To register for and use Krevon's services, you must meet the following eligibility requirements:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years of age</li>
                <li>You must be a human individual — accounts registered by automated means or bots are not permitted</li>
                <li>You must have the legal capacity to enter into a binding agreement in your country of residence</li>
                <li>You must not be located in, or be a national or resident of, any country subject to international sanctions or trade restrictions</li>
                <li>You must not have been previously suspended or banned from using Krevon's services</li>
              </ul>
              <p className="mt-4">
                By registering an account, you represent and warrant that you meet all of the above eligibility requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Account Registration and Security</h2>
              <p className="mb-4">To access the features of our banking platform, you must complete our registration process and pass identity verification. During registration you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information about yourself</li>
                <li>Maintain and promptly update your account information to keep it accurate and complete</li>
                <li>Keep your login credentials confidential and not share them with any third party</li>
                <li>Notify us immediately at <a href="mailto:support@krevon.com" className="text-[#D4AF37] hover:underline">support@krevon.com</a> if you suspect any unauthorised access to or use of your account</li>
                <li>Accept full responsibility for all activity that occurs under your account</li>
              </ul>
              <p className="mt-4">
                Krevon will never ask you for your password via email, phone, or any channel outside of the official platform. If you receive such a request, treat it as fraudulent and report it to us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Identity Verification (KYC)</h2>
              <p className="mb-4">As a regulated financial platform, Krevon is legally required to verify the identity of all account holders before granting access to banking services. This process is known as Know Your Customer (KYC) verification.</p>
              <p className="mb-4">You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Submit valid, unaltered government-issued identification documents when requested</li>
                <li>Submit valid proof of address documentation when requested</li>
                <li>Cooperate fully with any additional verification requests our compliance team may make</li>
                <li>Accept that access to all banking features will remain restricted until your KYC submission has been reviewed and approved</li>
              </ul>
              <p className="mt-4 text-red-400 font-medium">
                Submitting false, forged, or misleading documentation during the KYC process is a criminal offence. Krevon reserves the right to immediately terminate your account and report such conduct to the relevant law enforcement and regulatory authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Banking Services</h2>
              <p className="mb-4">Subject to these Terms and successful KYC approval, Krevon provides the following services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Multi-currency account management</li>
                <li>Internal transfers between your own currency balances</li>
                <li>International wire transfers to external bank accounts</li>
                <li>Account funding via external bank wire transfers</li>
                <li>Account funding via cryptocurrency deposits</li>
                <li>Virtual and physical debit card issuance and management</li>
                <li>Beneficiary management for saved recipients</li>
              </ul>
              <p className="mt-4">
                All services are subject to availability and may be modified, suspended, or discontinued at any time with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Transactions and Transfers</h2>
              <p className="mb-4">All transactions processed through Krevon are subject to the following conditions:</p>
              <ul className="space-y-4">
                <li><strong className="text-gray-900 dark:text-white">Processing Times:</strong> International wire transfers and account funding requests are processed manually by our operations team. Processing times may vary and are not guaranteed. Krevon is not liable for delays caused by third-party banks, payment networks, or blockchain congestion.</li>
                <li><strong className="text-gray-900 dark:text-white">Transaction Limits:</strong> Minimum and maximum transaction limits apply to all transfers and funding requests. These limits may vary based on your account status and are subject to change. Current limits are displayed within the platform at the time of transaction.</li>
                <li><strong className="text-gray-900 dark:text-white">Verification and Approval:</strong> All funding requests, whether via cryptocurrency or bank wire, require manual review and approval by a Krevon administrator before your account balance is credited. Submission of a funding request does not guarantee that your balance will be credited.</li>
                <li><strong className="text-gray-900 dark:text-white">Fraud Prevention:</strong> We reserve the right to delay, hold, or cancel any transaction that we reasonably suspect to be fraudulent, unauthorised, related to money laundering, or in violation of these Terms or applicable law. We will notify you where legally permitted to do so.</li>
                <li><strong className="text-gray-900 dark:text-white">Exchange Rates:</strong> Currency conversions are subject to live exchange rates at the time of processing. Krevon is not responsible for fluctuations in exchange rates between the time of submission and the time of processing.</li>
                <li><strong className="text-gray-900 dark:text-white">Irreversibility:</strong> Completed transactions cannot be reversed. If you believe a transaction has been processed in error, contact our support team immediately. Krevon will investigate but cannot guarantee recovery of funds in all cases.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Cryptocurrency Deposits</h2>
              <p className="mb-4">When funding your account using cryptocurrency, you acknowledge and agree to the following:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must send cryptocurrency only to the exact wallet address and network specified on the platform</li>
                <li className="text-red-400 font-medium">Sending funds to an incorrect wallet address or on an incorrect network will result in permanent and irreversible loss of funds</li>
                <li>Krevon is not responsible for funds sent to incorrect addresses or networks</li>
                <li>The fiat value credited to your account will be determined by the exchange rate at the time of processing by a Krevon administrator, not at the time of your submission</li>
                <li>Cryptocurrency deposits are subject to blockchain confirmation times which are outside Krevon's control</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Debit Cards</h2>
              <p className="mb-4">Krevon offers virtual and physical debit cards subject to the following terms:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Each user is entitled to a maximum of one virtual card and one physical card</li>
                <li>Virtual cards are issued instantly upon request</li>
                <li>Physical card requests require you to provide a valid delivery address and are subject to processing and delivery times</li>
                <li>Physical cards become active only after delivery is confirmed by a Krevon administrator</li>
                <li>You are responsible for the security of your card details</li>
                <li>Lost, stolen, or compromised cards must be reported and frozen immediately through your account dashboard</li>
                <li>Krevon is not liable for any unauthorised transactions made before a card is reported and frozen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Prohibited Activities</h2>
              <p className="mb-4">You agree not to use Krevon's services for any of the following:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Money laundering, terrorist financing, or any other illegal financial activity</li>
                <li>Funding or receiving payments for illegal goods or services</li>
                <li>Fraud, identity theft, or impersonation of another person</li>
                <li>Circumventing any security, verification, or access control measures on the platform</li>
                <li>Submitting false or misleading information to Krevon or its administrators</li>
                <li>Using automated scripts, bots, or other tools to access the platform without our written permission</li>
                <li>Any activity that violates applicable local, national, or international laws or regulations</li>
              </ul>
              <p className="mt-4 text-red-400 font-medium">
                Violation of any of the above may result in immediate account suspension, termination, and referral to the relevant authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Account Suspension and Termination</h2>
              <p className="mb-4">Krevon reserves the right to suspend or permanently terminate your account at any time, with or without prior notice, for any of the following reasons:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violation of these Terms of Service</li>
                <li>Suspected fraudulent, criminal, or suspicious activity</li>
                <li>Failure to complete or pass identity verification</li>
                <li>Inactivity for an extended period as determined by our operations team</li>
                <li>Legal or regulatory requirements</li>
                <li>Any conduct deemed harmful to Krevon, its users, or third parties</li>
              </ul>
              <p className="mt-4">
                Upon termination, your access to the platform and all associated services will be revoked. Any remaining balance in your account at the time of termination will be handled in accordance with applicable law and our internal procedures. You may contact <a href="mailto:support@krevon.com" className="text-[#D4AF37] hover:underline">support@krevon.com</a> to initiate a balance withdrawal request before termination is finalised where applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Limitation of Liability</h2>
              <p className="mb-4">To the fullest extent permitted by applicable law, Krevon International Bank and its directors, employees, agents, and service providers shall not be liable for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Any indirect, incidental, consequential, punitive, or special damages arising from your use of or inability to use our services</li>
                <li>Loss of funds resulting from unauthorised account access due to your failure to maintain the security of your credentials</li>
                <li>Delays or failures in transaction processing caused by third-party banks, payment networks, or blockchain systems</li>
                <li>Service interruptions, outages, or errors on the platform</li>
                <li>Losses resulting from cryptocurrency sent to incorrect addresses or networks</li>
                <li>Any actions taken by Krevon in good faith compliance with applicable law or regulatory requirements</li>
              </ul>
              <p className="mt-4">
                Our total liability to you for any claim arising from the use of our services shall not exceed the total amount of funds held in your Krevon account at the time the claim arose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Krevon International Bank and its officers, directors, employees, agents, and service providers from and against any claims, damages, losses, liabilities, costs, and expenses (including legal fees) arising out of or related to your use of our services, your violation of these Terms, or your violation of any applicable law or the rights of any third party.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">13. Governing Law and Dispute Resolution</h2>
              <p className="mb-4">
                These Terms of Service shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising out of or in connection with these Terms or your use of our services shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
              <p>
                Before initiating any formal legal proceedings, you agree to first contact Krevon's support team at <a href="mailto:support@krevon.com" className="text-[#D4AF37] hover:underline">support@krevon.com</a> to attempt to resolve the dispute informally. Krevon will make reasonable efforts to resolve disputes within 30 days of receiving written notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">14. Intellectual Property</h2>
              <p>
                All content on the Krevon platform including but not limited to the brand name, logo, design, text, graphics, software, and user interface elements are the exclusive intellectual property of Krevon International Bank. You may not reproduce, distribute, modify, or create derivative works from any of our content without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">15. Third Party Services</h2>
              <p>
                Our platform may integrate with or reference third-party services and providers. Krevon is not responsible for the content, privacy practices, or reliability of any third-party services. Links to third-party websites do not constitute an endorsement of those services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">16. Changes to These Terms</h2>
              <p>
                Krevon reserves the right to modify these Terms of Service at any time. When we make material changes, we will notify you by email to the address registered on your account and by displaying a prominent notice on the platform at least 30 days before the changes take effect. Your continued use of our services after the effective date of the revised Terms constitutes your acceptance of the changes. If you do not agree to the updated Terms, you must stop using our services and may request account closure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">17. Contact Us</h2>
              <p className="mb-4">If you have any questions, concerns, or complaints regarding these Terms of Service, please contact us through any of the following channels:</p>
              <ul className="space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Email:</strong> <a href="mailto:support@krevon.com" className="text-[#D4AF37] hover:underline">support@krevon.com</a></li>
                <li><strong className="text-gray-900 dark:text-white">Legal Enquiries:</strong> <a href="mailto:legal@krevon.com" className="text-[#D4AF37] hover:underline">legal@krevon.com</a></li>
                <li><strong className="text-gray-900 dark:text-white">Support Dashboard:</strong> Log into your account and visit the Support section</li>
                <li><strong className="text-gray-900 dark:text-white">Registered Address:</strong> Krevon International Bank, London, United Kingdom</li>
              </ul>
            </section>
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
