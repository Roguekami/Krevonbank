const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { authLimiter } = require('../middleware/rateLimiter');
const jwt = require('jsonwebtoken');
const {
  createUser, findUserByEmail, verifyUserEmail,
  incrementLoginAttempts, lockUserAccount, resetLoginAttempts,
  saveResetToken, findUserByResetToken, updatePassword
} = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { createSession, deactivateSessionByJti } = require('../models/Session');


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  maxAge: 24 * 60 * 60 * 1000,
};

const issueToken = async (req, res, userId) => {
  const jti = uuidv4();
  const token = jwt.sign({ id: userId, jti }, process.env.JWT_SECRET, { expiresIn: '24h' });
  // Set httpOnly cookie (works on desktop)
  res.cookie('token', token, cookieOptions);
  // Save session
  try {
    const device = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.headers['x-forwarded-for'] || req.ip || 'Unknown';
    await createSession({ userId, jti, device, ipAddress, location: 'Unknown' });
  } catch (err) {
    console.warn('Failed to save session:', err.message);
  }
  // Return token so frontend can store in localStorage (for mobile)
  return token;
};


// POST /api/auth/register
router.post('/register', [
  body('fullName').trim().notEmpty().withMessage('Full name is required.').escape(),
  body('email').isEmail().withMessage('Please provide a valid email.').normalizeEmail(),
  body('password').isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }).withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special symbol.'),
  body('country').trim().notEmpty().withMessage('Country is required.').escape(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { fullName, email, password, country } = req.body;

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await createUser({ fullName, email, password, country, verificationToken });

    // Try to send verification email
    let emailSent = false;
    try {
      await sendVerificationEmail(email, fullName, verificationToken);
      emailSent = true;
    } catch (emailError) {
      console.warn('[DEV] Email sending failed (SMTP not configured):', emailError.message);
    }

    if (emailSent) {
      return res.status(201).json({
        message: 'Account created! Please check your email (and spam folder) to verify your account.',
      });
    }

    // DEV MODE: SMTP not configured — auto-verify the account so users can log in immediately
    if (process.env.NODE_ENV !== 'production') {
      const { pool } = require('../config/db');
      await pool.query(
        `UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1`,
        [user.id]
      );
      console.log('\n╔══════════════════════════════════════════════════════════╗');
      console.log('║  ✅ DEV MODE: Account auto-verified (no SMTP configured)  ║');
      console.log(`║  User: ${email.padEnd(50)}║`);
      console.log('╚══════════════════════════════════════════════════════════╝\n');
      return res.status(201).json({
        message: 'Account created and verified! You can now log in.',
        autoVerified: true,
      });
    }

    return res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check if account is locked
    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      return res.status(403).json({ message: 'Your account is temporarily locked. Please try again later or contact support.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      await incrementLoginAttempts(user.id);
      if (user.login_attempts + 1 >= 5) {
        await lockUserAccount(user.id);
        return res.status(403).json({ message: 'Too many failed attempts. Your account has been locked for 30 minutes.' });
      }
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    await resetLoginAttempts(user.id);
    const token = await issueToken(req, res, user.id);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        country: user.country,
        phoneNumber: user.phone_number,
        address: user.address,
        isVerified: user.is_verified,
        kycStatus: user.kyc_status,
        is_admin: user.is_admin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// GET /api/auth/verify-email?token=...
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: 'Invalid verification link.' });
  }

  try {
    const user = await verifyUserEmail(token);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link.' });
    }

    await issueToken(req, res, user.id);
    return res.status(200).json({ message: 'Email verified successfully. Redirecting to KYC setup...' });
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, [
  body('email').isEmail().withMessage('Please provide a valid email.').normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { email } = req.body;
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      // Don't leak whether the email exists for security
      return res.status(200).json({ message: 'If an account with that email exists, a link has been sent (please check your spam folder).' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await saveResetToken(user.id, resetToken, expires);

    try {
      await sendPasswordResetEmail(email, user.full_name, resetToken);
      return res.status(200).json({ message: 'If an account with that email exists, a link has been sent (please check your spam folder).' });
    } catch (emailError) {
      console.warn('Reset email sending failed:', emailError.message);
      if (process.env.NODE_ENV !== 'production') {
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║  🔑 PASSWORD RESET EMAIL (DEV MODE)                      ║');
        console.log('╠══════════════════════════════════════════════════════════╣');
        console.log(`║  User: ${email}`);
        console.log(`║  Link: ${resetUrl}`);
        console.log('╚══════════════════════════════════════════════════════════╝\n');
        return res.status(200).json({
          message: 'Password reset link generated. Check your console.',
          devResetLink: resetUrl
        });
      }
      throw emailError;
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, [
  body('token').notEmpty().withMessage('Token is required.'),
  body('password').isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }).withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special symbol.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { token, password } = req.body;

  try {
    const user = await findUserByResetToken(token);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await updatePassword(user.id, passwordHash);

    return res.status(200).json({ message: 'Password has been successfully reset. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.jti) {
        await deactivateSessionByJti(decoded.jti);
      }
    }
  } catch (err) {
    // Token might be expired, that's fine
  }
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  });
  return res.status(200).json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').protect, (req, res) => {
  const u = req.user;
  return res.status(200).json({
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    country: u.country,
    phoneNumber: u.phone_number,
    address: u.address,
    isVerified: u.is_verified,
    kycStatus: u.kyc_status,
    is_admin: u.is_admin,
  });
});

module.exports = router;
