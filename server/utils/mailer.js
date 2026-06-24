const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendVerificationEmail = async (email, fullName, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"Krevon Bank" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Krevon Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1f36;">Welcome to Krevon, ${fullName}!</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#d4af37;color:#1a1f36;font-weight:bold;border-radius:6px;text-decoration:none;">
          Verify Email Address
        </a>
        <p style="margin-top:24px;color:#666;">This link expires in 24 hours. If you did not create an account, please ignore this email.</p>
      </div>
    `,
  });
};

const sendKYCRejectionEmail = async (email, fullName, reason) => {
  await transporter.sendMail({
    from: `"Krevon Bank Compliance" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'KYC Verification Update – Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1f36;">KYC Verification Unsuccessful</h2>
        <p>Dear ${fullName},</p>
        <p>Unfortunately, your KYC submission could not be approved for the following reason:</p>
        <div style="background:#fff3cd;border-left:4px solid #d4af37;padding:16px;margin:16px 0;">
          <strong>${reason}</strong>
        </div>
        <p>Please log in to your account and resubmit your documents addressing the above issue.</p>
        <p>If you believe this is an error, please contact our support team.</p>
        <p style="color:#666;">— Krevon Compliance Team</p>
      </div>
    `,
  });
};

const sendKYCApprovalEmail = async (email, fullName) => {
  await transporter.sendMail({
    from: `"Krevon Bank" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Krevon Account is Verified!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1f36;">Congratulations, ${fullName}!</h2>
        <p>Your identity has been successfully verified. You now have full access to all Krevon banking features.</p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#d4af37;color:#1a1f36;font-weight:bold;border-radius:6px;text-decoration:none;">
          Go to Dashboard
        </a>
        <p style="color:#666;margin-top:24px;">— Krevon Team</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, fullName, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"Krevon Bank Security" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1f36;">Password Reset, ${fullName}</h2>
        <p>We received a request to reset the password for your Krevon Bank account.</p>
        <p>Click the button below to choose a new password:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#d4af37;color:#1a1f36;font-weight:bold;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
        <p style="margin-top:24px;color:#666;">This link expires in 1 hour. If you did not request this, please ignore this email and your password will remain unchanged.</p>
      </div>
    `,
  });
};

const sendAdminAlertEmail = async (subject, bodyHtml) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  await transporter.sendMail({
    from: `"Krevon Bank System" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `[Krevon Admin] ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0B1221; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #D4AF37; margin: 0;">Krevon Admin Alert</h2>
        </div>
        <div style="background: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
          ${bodyHtml}
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 16px;">This is an automated alert from Krevon Banking System.</p>
      </div>
    `,
  });
};

const sendBalanceCreditEmail = async (email, fullName, currency, amount, note) => {
  await transporter.sendMail({
    from: `"Krevon Bank" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Balance Credited — Krevon Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1f36;">Balance Update, ${fullName}</h2>
        <p>Your Krevon account has been credited with:</p>
        <div style="background:#e8f5e9;border-left:4px solid #4caf50;padding:16px;margin:16px 0;">
          <strong style="font-size: 1.2em;">${currency} ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
        </div>
        ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
        <p>If you did not expect this transaction, please contact our support team immediately.</p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#d4af37;color:#1a1f36;font-weight:bold;border-radius:6px;text-decoration:none;">
          View Dashboard
        </a>
        <p style="color:#666;margin-top:24px;">— Krevon Team</p>
      </div>
    `,
  });
};

const sendTransferApprovalEmail = async (email, fullName, amount, currency, recipientName, status) => {
  const isApproved = status === 'approved' || status === 'completed';
  const statusLabel = isApproved ? 'Approved & Completed' : 'Rejected';
  const statusColor = isApproved ? '#4caf50' : '#f44336';
  const statusBg = isApproved ? '#e8f5e9' : '#ffebee';

  await transporter.sendMail({
    from: `"Krevon Bank" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Wire Transfer ${statusLabel} — Krevon Account`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1f36;">Transfer Update, ${fullName}</h2>
        <p>Your international wire transfer has been processed:</p>
        <div style="background:${statusBg};border-left:4px solid ${statusColor};padding:16px;margin:16px 0;">
          <p style="margin: 0;"><strong>Status:</strong> <span style="color:${statusColor};">${statusLabel}</span></p>
          <p style="margin: 8px 0 0;"><strong>Amount:</strong> ${currency} ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p style="margin: 8px 0 0;"><strong>Recipient:</strong> ${recipientName}</p>
        </div>
        ${!isApproved ? '<p>The transfer amount has been refunded to your account balance.</p>' : ''}
        <p>If you have any questions about this transaction, please contact our support team.</p>
        <a href="${process.env.CLIENT_URL}/history" style="display:inline-block;padding:12px 24px;background:#d4af37;color:#1a1f36;font-weight:bold;border-radius:6px;text-decoration:none;">
          View Transaction History
        </a>
        <p style="color:#666;margin-top:24px;">— Krevon Team</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendKYCRejectionEmail, sendKYCApprovalEmail, sendPasswordResetEmail, sendAdminAlertEmail, sendBalanceCreditEmail, sendTransferApprovalEmail };
