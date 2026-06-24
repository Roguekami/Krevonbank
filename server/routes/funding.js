const express = require('express');
const router = express.Router();
const { protect, requireKYCApproved } = require('../middleware/auth');
const { createFundingRequest, getFundingRequestsByUserId, createBankDeposit, getBankDepositsByUser } = require('../models/Funding');
const { transactionLimiter } = require('../middleware/rateLimiter');
const { sendAdminAlertEmail } = require('../utils/mailer');
const { body, validationResult } = require('express-validator');

const MAX_AMOUNT = parseFloat(process.env.MAX_TRANSACTION_AMOUNT) || 5000000;
const MIN_AMOUNT = parseFloat(process.env.MIN_TRANSACTION_AMOUNT) || 0.01;

// Supported cryptos and their networks
const SUPPORTED_CRYPTOS = {
  BTC: {
    networks: {
      BTC: process.env.WALLET_BTC || 'BTC_ADDRESS_PLACEHOLDER'
    }
  },
  ETH: {
    networks: {
      BEP20: process.env.WALLET_ETH_BEP20 || 'ETH_BEP20_ADDRESS_PLACEHOLDER'
    }
  },
  USDT: {
    networks: {
      BEP20: process.env.WALLET_USDT_BEP20 || 'USDT_BEP20_ADDRESS_PLACEHOLDER'
    }
  }
};

// GET /api/funding/crypto/wallets?crypto=BTC&network=BTC
router.get('/crypto/wallets', protect, requireKYCApproved, (req, res) => {
  const { crypto, network } = req.query;

  if (crypto && network) {
    const upperCrypto = crypto.toUpperCase();
    const upperNetwork = network.toUpperCase();

    const cryptoData = SUPPORTED_CRYPTOS[upperCrypto];
    if (!cryptoData) {
      return res.status(400).json({ message: 'Unsupported cryptocurrency.' });
    }

    const address = cryptoData.networks[upperNetwork];
    if (!address) {
      return res.status(400).json({ message: 'Unsupported network for this cryptocurrency.' });
    }

    return res.status(200).json({ crypto: upperCrypto, network: upperNetwork, address });
  }

  // Return all config for frontend
  return res.status(200).json({ supported: SUPPORTED_CRYPTOS });
});

// POST /api/funding/crypto/submit
router.post('/crypto/submit', protect, requireKYCApproved, transactionLimiter, [
  body('cryptoType').trim().notEmpty().isLength({ max: 10 }).withMessage('Invalid crypto type.'),
  body('network').trim().notEmpty().isLength({ max: 10 }).withMessage('Invalid network.'),
  body('transactionHash').trim().notEmpty().isLength({ min: 10, max: 200 }).withMessage('Transaction hash must be 10-200 characters.'),
  body('amountSent').isFloat({ min: MIN_AMOUNT, max: MAX_AMOUNT }).withMessage(`Amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT}.`),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { cryptoType, network, transactionHash, amountSent } = req.body;

    const upperCrypto = cryptoType.toUpperCase();
    const upperNetwork = network.toUpperCase();

    const cryptoData = SUPPORTED_CRYPTOS[upperCrypto];
    if (!cryptoData || !cryptoData.networks[upperNetwork]) {
      return res.status(400).json({ message: 'Unsupported cryptocurrency or network.' });
    }

    const request = await createFundingRequest({
      userId: req.user.id,
      cryptoType: upperCrypto,
      network: upperNetwork,
      transactionHash: transactionHash.trim(),
      amountSent: parseFloat(amountSent),
    });

    // Notify admin via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('funding:new_request', {
        userId: req.user.id,
        userName: req.user.full_name,
        cryptoType: upperCrypto,
        network: upperNetwork,
        amountSent,
        transactionHash: transactionHash.trim(),
        submittedAt: new Date(),
      });
    }

    // Email alert to admin
    try {
      await sendAdminAlertEmail(
        'New Crypto Funding Request',
        `<h3 style="color: #1a1f36;">New Crypto Funding Submission</h3>
         <p><strong>User:</strong> ${req.user.full_name} (${req.user.email})</p>
         <p><strong>Crypto:</strong> ${upperCrypto} (${upperNetwork})</p>
         <p><strong>Amount Sent:</strong> ${amountSent}</p>
         <p><strong>TX Hash:</strong> <code>${transactionHash.trim()}</code></p>
         <p style="margin-top: 16px;">Please verify this transaction in the <a href="${process.env.CLIENT_URL}/admin" style="color: #D4AF37;">Admin Dashboard</a>.</p>`
      );
    } catch (emailErr) {
      console.warn('[DEV] Admin funding alert email failed:', emailErr.message);
    }

    return res.status(201).json({
      message: 'Funding request submitted successfully. Our team will verify your transaction within 24 hours.',
      request,
    });
  } catch (error) {
    console.error('Crypto submit error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// GET /api/funding/bank/instructions?currency=USD
router.get('/bank/instructions', protect, requireKYCApproved, (req, res) => {
  const { currency } = req.query;
  if (!currency) return res.status(400).json({ message: 'Currency is required.' });

  const upperCurr = currency.toUpperCase();
  const iban = process.env[`BANK_${upperCurr}_IBAN`];
  const swift = process.env[`BANK_${upperCurr}_SWIFT`];
  const accountName = process.env.BANK_ACCOUNT_NAME || 'Krevon International Bank';

  if (!iban || !swift) {
    return res.status(400).json({ message: `Bank instructions for ${upperCurr} are not currently available.` });
  }

  return res.status(200).json({
    currency: upperCurr,
    accountName,
    iban,
    swift
  });
});

// POST /api/funding/bank/submit
router.post('/bank/submit', protect, requireKYCApproved, transactionLimiter, [
  body('currency').trim().notEmpty().isLength({ max: 5 }).withMessage('Invalid currency.'),
  body('amount').isFloat({ min: MIN_AMOUNT, max: MAX_AMOUNT }).withMessage(`Amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT}.`),
  body('senderName').trim().notEmpty().isLength({ max: 100 }).withMessage('Sender name must be under 100 characters.').escape(),
  body('senderBank').trim().notEmpty().isLength({ max: 100 }).withMessage('Sender bank must be under 100 characters.').escape(),
  body('referenceCode').trim().notEmpty().isLength({ max: 100 }).withMessage('Reference code must be under 100 characters.').escape(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { currency, amount, senderName, senderBank, referenceCode } = req.body;

    const deposit = await createBankDeposit({
      userId: req.user.id,
      currency: currency.toUpperCase(),
      amount: parseFloat(amount),
      senderName,
      senderBank,
      referenceCode
    });

    // Notify admin via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('funding:new_bank_request', {
        userId: req.user.id,
        userName: req.user.full_name,
        currency: currency.toUpperCase(),
        amount: parseFloat(amount),
        submittedAt: new Date(),
      });
    }

    // Email alert to admin
    try {
      await sendAdminAlertEmail(
        'New Bank Deposit Request',
        `<h3 style="color: #1a1f36;">New Bank Wire Deposit Submission</h3>
         <p><strong>User:</strong> ${req.user.full_name} (${req.user.email})</p>
         <p><strong>Currency:</strong> ${currency.toUpperCase()}</p>
         <p><strong>Amount Sent:</strong> ${amount}</p>
         <p><strong>Sender Name:</strong> ${senderName}</p>
         <p><strong>Sender Bank:</strong> ${senderBank}</p>
         <p><strong>Reference Code:</strong> <code>${referenceCode}</code></p>
         <p style="margin-top: 16px;">Please verify this deposit in the <a href="${process.env.CLIENT_URL}/admin" style="color: #D4AF37;">Admin Dashboard</a>.</p>`
      );
    } catch (emailErr) {
      console.warn('[DEV] Admin bank alert email failed:', emailErr.message);
    }

    return res.status(201).json({
      message: 'Bank deposit request submitted successfully. Our team will verify it within 1-3 business days.',
      deposit,
    });
  } catch (error) {
    console.error('Bank submit error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// GET /api/funding/my — user's own funding history
router.get('/my', protect, requireKYCApproved, async (req, res) => {
  try {
    const cryptoRequests = await getFundingRequestsByUserId(req.user.id);
    const bankRequests = await getBankDepositsByUser(req.user.id);
    return res.status(200).json({ cryptoRequests, bankRequests });
  } catch (error) {
    console.error('Get funding history error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

module.exports = router;
