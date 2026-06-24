import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#0B1221] text-gray-300 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-6 py-16 md:py-24 max-w-4xl">
        <div className="bg-[#0f172a] rounded-2xl p-8 md:p-12 shadow-2xl border border-gray-800">
          <h1 className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-6 tracking-tight">
            Privacy Policy
          </h1>
          
          <p className="text-gray-400 mb-8 italic">Last updated: June 15, 2026</p>
          
          <div className="space-y-10 text-lg leading-relaxed">
            <section>
              <p>
                Welcome to Krevon Banking. This Privacy Policy explains how Krevon International Bank ("Krevon", "we", "us", or "our") collects, uses, stores, and protects your personal information when you use our platform and services. By opening an account or using our services, you agree to the terms of this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
              <p className="mb-4">We collect information to provide secure, reliable, and personalised banking services. The categories of information we collect include:</p>
              <ul className="space-y-4">
                <li><strong className="text-white">Personal Information:</strong> Your full name, email address, phone number, date of birth, nationality, and physical address collected during registration and account onboarding.</li>
                <li><strong className="text-white">Identity and Verification Documents:</strong> Government-issued identification documents including passports, national identity cards, and driver's licenses, as well as proof of address documents such as utility bills and bank statements. These are collected as part of our mandatory Know Your Customer (KYC) verification process.</li>
                <li><strong className="text-white">Financial Information:</strong> Account balances, transaction history, transfer details, funding requests, beneficiary information, and spending activity across all currencies held on your account.</li>
                <li><strong className="text-white">Device and Usage Data:</strong> IP addresses, browser type and version, operating system, device identifiers, pages visited, time spent on the platform, and access timestamps collected automatically when you use our services.</li>
                <li><strong className="text-white">Communications Data:</strong> Any messages, support requests, or correspondence you send to us through our platform or official contact channels.</li>
                <li><strong className="text-white">Cryptocurrency Transaction Data:</strong> Wallet addresses, transaction hashes, and network information submitted when funding your account through cryptocurrency deposits.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To verify your identity and complete the KYC onboarding process required by law</li>
                <li>To open, manage, and maintain your Krevon account and all associated currency balances</li>
                <li>To process international wire transfers, internal transfers, and account funding requests</li>
                <li>To generate and manage virtual and physical debit cards on your behalf</li>
                <li>To detect, prevent, and investigate fraudulent activity, money laundering, and other financial crimes</li>
                <li>To comply with applicable legal, regulatory, and tax obligations including those under the UK Financial Conduct Authority (FCA) and international anti-money laundering (AML) regulations</li>
                <li>To send you transactional notifications, account alerts, and service updates</li>
                <li>To respond to your support requests and resolve account disputes</li>
                <li>To improve the security, performance, and features of our platform</li>
                <li>To maintain administrative audit records of all account and financial activity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Identity Verification and KYC</h2>
              <p className="mb-4">
                As a financial institution, we are legally required to verify the identity of all account holders before granting access to banking services. This process, known as Know Your Customer (KYC), requires you to submit valid government-issued identification and proof of address.
              </p>
              <p className="mb-4">
                All identity documents are transmitted over encrypted connections and stored securely with our trusted document storage provider, Cloudinary. Documents are accessible only to authorised Krevon administrators for the purpose of identity review and are not shared with any third party beyond what is required by law.
              </p>
              <p className="text-red-400 font-medium">
                Your account will remain restricted until your KYC submission has been reviewed and approved by our compliance team. Submitting false or forged documents is a criminal offence and will result in immediate account termination and referral to the relevant authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing</h2>
              <p className="mb-4">We do not sell, rent, or trade your personal information to any third party for marketing purposes. We may share your information only in the following circumstances:</p>
              <ul className="space-y-4">
                <li><strong className="text-white">Service Providers:</strong> We work with trusted third-party service providers who help us operate our platform. These include Supabase for secure database hosting, Cloudinary for encrypted document storage, and email delivery services for transactional notifications. All service providers are contractually bound to handle your data securely and confidentially.</li>
                <li><strong className="text-white">Legal and Regulatory Obligations:</strong> We may disclose your information to government authorities, law enforcement agencies, or financial regulators when required to do so by law, court order, or regulatory directive.</li>
                <li><strong className="text-white">Fraud Prevention:</strong> We may share information with fraud prevention agencies and financial crime authorities to protect against unauthorised transactions and identity theft.</li>
                <li><strong className="text-white">Business Transfers:</strong> In the event of a merger, acquisition, or sale of Krevon's assets, your information may be transferred to the acquiring entity, who will be bound by the terms of this Privacy Policy.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. International Data Transfers</h2>
              <p className="mb-4">
                Krevon is headquartered in London, United Kingdom, and serves customers globally. As a result, your personal data may be transferred to and processed in countries outside your country of residence, including countries that may have different data protection laws.
              </p>
              <p>
                Where we transfer data internationally, we ensure appropriate safeguards are in place in accordance with applicable data protection legislation, including the UK GDPR and the EU General Data Protection Regulation where applicable. These safeguards include standard contractual clauses approved by the relevant data protection authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Data Retention</h2>
              <p className="mb-4">
                We retain your personal information for as long as your account is active and for a minimum period of six years after account closure, as required by UK financial regulations and anti-money laundering legislation. Identity documents submitted during KYC are retained for the same period.
              </p>
              <p>
                After the applicable retention period, your data will be securely deleted or anonymised. You may request early deletion of certain data by contacting our support team, however we may be legally required to retain specific records regardless of your request.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Security</h2>
              <p className="mb-4">The security of your personal and financial information is our highest priority. We implement the following measures to protect your data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All data transmitted between your device and our servers is encrypted using SSL/TLS encryption</li>
                <li>All identity documents are stored in encrypted cloud storage with restricted access controls</li>
                <li>Passwords are never stored in plain text and are protected using industry-standard bcrypt hashing</li>
                <li>All administrative actions on user accounts are recorded in an immutable audit log</li>
                <li>Account access is protected by secure session tokens stored in httpOnly cookies inaccessible to browser scripts</li>
                <li>Login attempts are rate limited and accounts are temporarily locked after repeated failed attempts</li>
              </ul>
              <p className="mt-4">
                Despite these measures, no method of transmission over the internet or electronic storage is completely secure. We cannot guarantee absolute security and encourage you to use strong unique passwords and report any suspicious activity on your account immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Your Rights</h2>
              <p className="mb-4">Depending on your country of residence, you may have the following rights regarding your personal data:</p>
              <ul className="space-y-2 mb-4">
                <li><strong className="text-white">Right to Access:</strong> You have the right to request a copy of the personal information we hold about you.</li>
                <li><strong className="text-white">Right to Rectification:</strong> You have the right to request correction of any inaccurate or incomplete information we hold about you.</li>
                <li><strong className="text-white">Right to Erasure:</strong> You have the right to request deletion of your personal data, subject to our legal retention obligations.</li>
                <li><strong className="text-white">Right to Restriction:</strong> You have the right to request that we restrict the processing of your personal data in certain circumstances.</li>
                <li><strong className="text-white">Right to Data Portability:</strong> You have the right to receive your personal data in a structured, machine-readable format.</li>
                <li><strong className="text-white">Right to Object:</strong> You have the right to object to certain types of processing of your personal data.</li>
                <li><strong className="text-white">Right to Withdraw Consent:</strong> Where processing is based on your consent, you have the right to withdraw that consent at any time.</li>
              </ul>
              <p className="mb-4">
                To exercise any of these rights, please contact our privacy team at <a href="mailto:privacy@krevon.com" className="text-[#D4AF37] hover:underline">privacy@krevon.com</a> or through your secure account dashboard. We will respond to all legitimate requests within 30 days.
              </p>
              <p>
                If you are located in the European Economic Area or the United Kingdom, you also have the right to lodge a complaint with your local data protection authority.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies and Tracking</h2>
              <p className="mb-4">We use cookies and similar tracking technologies to maintain your session, secure your account, and improve your experience on our platform. The types of cookies we use include:</p>
              <ul className="space-y-2 mb-4">
                <li><strong className="text-white">Essential Cookies:</strong> Required for the platform to function. These include session authentication cookies that keep you securely logged in.</li>
                <li><strong className="text-white">Functional Cookies:</strong> Remember your preferences and settings to personalise your experience.</li>
                <li><strong className="text-white">Analytics Cookies:</strong> Help us understand how users interact with our platform so we can improve performance and usability. No personally identifiable information is included in analytics data.</li>
              </ul>
              <p>
                You can configure your browser to refuse all cookies or to alert you when cookies are being sent. Please note that disabling essential cookies will prevent you from accessing your account and using our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Children's Privacy</h2>
              <p>
                Krevon's services are intended exclusively for individuals aged 18 and over. We do not knowingly collect personal information from anyone under the age of 18. If we become aware that a minor has provided us with personal information, we will immediately delete that information and close the associated account. If you believe a minor has registered on our platform, please contact us immediately at <a href="mailto:privacy@krevon.com" className="text-[#D4AF37] hover:underline">privacy@krevon.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Account Closure</h2>
              <p>
                When you close your Krevon account, we will retain your personal and financial data for the minimum period required by law as outlined in our Data Retention section. During this period your data will not be used for any active purpose beyond legal compliance. After the retention period expires your data will be permanently and securely deleted from our systems.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our services, technology, or legal obligations. When we make significant changes, we will notify you by email to the address registered on your account and by displaying a prominent notice on our platform at least 30 days before the changes take effect. Your continued use of our services after the effective date of the updated policy constitutes your acceptance of the changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Us</h2>
              <p className="mb-4">If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal data, please contact us through any of the following channels:</p>
              <ul className="space-y-2">
                <li><strong className="text-white">Email:</strong> <a href="mailto:privacy@krevon.com" className="text-[#D4AF37] hover:underline">privacy@krevon.com</a></li>
                <li><strong className="text-white">Support Dashboard:</strong> Log into your account and visit the Support section</li>
                <li><strong className="text-white">Registered Address:</strong> Krevon International Bank, London, United Kingdom</li>
              </ul>
            </section>
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
