const express = require('express');
const router = express.Router();
const { protect, requireKYCApproved } = require('../middleware/auth');
const { getAccountByUserId, getBalanceByCurrency, updateBalance } = require('../models/Account');
const { createTransaction, getTransactionsByAccountId, getTransactionsByAccountIdWithDateRange } = require('../models/Transaction');
const { transactionLimiter } = require('../middleware/rateLimiter');
const { sendAdminAlertEmail } = require('../utils/mailer');
const { body, validationResult } = require('express-validator');

const MAX_AMOUNT = parseFloat(process.env.MAX_TRANSACTION_AMOUNT) || 5000000;
const MIN_AMOUNT = parseFloat(process.env.MIN_TRANSACTION_AMOUNT) || 0.01;

// POST /api/transfers/internal — transfer between own currency balances
router.post('/internal', protect, requireKYCApproved, transactionLimiter, [
  body('fromCurrency').trim().notEmpty().isLength({ max: 5 }).withMessage('Invalid source currency.'),
  body('toCurrency').trim().notEmpty().isLength({ max: 5 }).withMessage('Invalid target currency.'),
  body('amount').isFloat({ min: MIN_AMOUNT, max: MAX_AMOUNT }).withMessage(`Amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT}.`),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { fromCurrency, toCurrency, amount, exchangeRate } = req.body;

    if (fromCurrency === toCurrency) {
      return res.status(400).json({ message: 'Cannot transfer between the same currency.' });
    }

    const account = await getAccountByUserId(req.user.id);
    if (!account) return res.status(404).json({ message: 'Account not found.' });
    if (account.is_frozen) return res.status(403).json({ message: 'Your account is frozen. Please contact support.' });

    const fromBalance = await getBalanceByCurrency(account.id, fromCurrency.toUpperCase());
    if (!fromBalance) return res.status(400).json({ message: `You do not have a ${fromCurrency} wallet.` });
    if (parseFloat(fromBalance.balance) < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient balance.' });
    }

    const toBalance = await getBalanceByCurrency(account.id, toCurrency.toUpperCase());
    if (!toBalance) return res.status(400).json({ message: `You do not have a ${toCurrency} wallet.` });

    const rate = parseFloat(exchangeRate) || 1;
    const convertedAmount = (parseFloat(amount) * rate).toFixed(2);

    // Deduct from source and credit destination
    await updateBalance(account.id, fromCurrency.toUpperCase(), (parseFloat(fromBalance.balance) - parseFloat(amount)).toFixed(2));
    await updateBalance(account.id, toCurrency.toUpperCase(), (parseFloat(toBalance.balance) + parseFloat(convertedAmount)).toFixed(2));

    // Record transaction
    const transaction = await createTransaction({
      senderAccountId: account.id,
      receiverAccountId: account.id,
      type: 'internal_transfer',
      status: 'completed',
      amount: parseFloat(amount),
      currencyCode: fromCurrency.toUpperCase(),
      exchangeRate: rate,
      convertedAmount: parseFloat(convertedAmount),
      convertedCurrency: toCurrency.toUpperCase(),
      description: `Internal transfer: ${fromCurrency} → ${toCurrency}`,
    });

    return res.status(200).json({ message: 'Transfer completed successfully.', transaction });
  } catch (error) {
    console.error('Internal transfer error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// POST /api/transfers/wire — submit international wire transfer (starts as pending)
router.post('/wire', protect, requireKYCApproved, transactionLimiter, [
  body('currency').trim().notEmpty().isLength({ max: 5 }).withMessage('Invalid currency.'),
  body('amount').isFloat({ min: MIN_AMOUNT, max: MAX_AMOUNT }).withMessage(`Amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT}.`),
  body('recipientName').trim().notEmpty().isLength({ max: 100 }).withMessage('Recipient name must be under 100 characters.').escape(),
  body('recipientBankName').trim().notEmpty().isLength({ max: 100 }).withMessage('Bank name must be under 100 characters.').escape(),
  body('recipientAccountNumber').trim().notEmpty().isLength({ max: 50 }).withMessage('Account number must be under 50 characters.').escape(),
  body('recipientSwiftIban').trim().notEmpty().isLength({ max: 50 }).withMessage('SWIFT/IBAN must be under 50 characters.').escape(),
  body('description').optional().trim().isLength({ max: 250 }).withMessage('Description must be under 250 characters.').escape(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { currency, amount, recipientName, recipientBankName, recipientAccountNumber, recipientSwiftIban, description } = req.body;

    const account = await getAccountByUserId(req.user.id);
    if (!account) return res.status(404).json({ message: 'Account not found.' });
    if (account.is_frozen) return res.status(403).json({ message: 'Your account is frozen. Please contact support.' });

    const balance = await getBalanceByCurrency(account.id, currency.toUpperCase());
    if (!balance) return res.status(400).json({ message: `You do not have a ${currency} wallet.` });
    if (parseFloat(balance.balance) < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient balance.' });
    }

    // Deduct immediately and hold funds pending admin approval
    await updateBalance(account.id, currency.toUpperCase(), (parseFloat(balance.balance) - parseFloat(amount)).toFixed(2));

    const transaction = await createTransaction({
      senderAccountId: account.id,
      receiverAccountId: null,
      type: 'international_wire',
      amount: parseFloat(amount),
      currencyCode: currency.toUpperCase(),
      recipientName,
      recipientBankName,
      recipientAccountNumber,
      recipientSwiftIban,
      description: description || null,
    });

    // Notify admin via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('wire:new_submission', {
        userId: req.user.id,
        userName: req.user.full_name,
        transactionId: transaction.id,
        amount,
        currency,
        submittedAt: new Date(),
      });
    }

    // Email alert to admin
    try {
      await sendAdminAlertEmail(
        'New Wire Transfer Submitted',
        `<h3 style="color: #1a1f36;">New International Wire Transfer</h3>
         <p><strong>User:</strong> ${req.user.full_name} (${req.user.email})</p>
         <p><strong>Amount:</strong> ${amount} ${currency}</p>
         <p><strong>Recipient:</strong> ${recipientName}</p>
         <p><strong>Bank:</strong> ${recipientBankName}</p>
         <p><strong>Account:</strong> ${recipientAccountNumber}</p>
         <p><strong>SWIFT/IBAN:</strong> ${recipientSwiftIban}</p>
         <p style="margin-top: 16px;">Please review this transfer in the <a href="${process.env.CLIENT_URL}/admin" style="color: #D4AF37;">Admin Dashboard</a>.</p>`
      );
    } catch (emailErr) {
      console.warn('[DEV] Admin wire alert email failed:', emailErr.message);
    }

    return res.status(200).json({ message: 'Wire transfer submitted. Pending admin approval.', transaction });
  } catch (error) {
    console.error('Wire transfer error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// GET /api/transfers/history — get transaction history with optional filters
router.get('/history', protect, requireKYCApproved, async (req, res) => {
  try {
    const account = await getAccountByUserId(req.user.id);
    if (!account) return res.status(404).json({ message: 'Account not found.' });

    const { type, status, limit } = req.query;
    const transactions = await getTransactionsByAccountId(account.id, {
      type: type || null,
      status: status || null,
      limit: limit ? parseInt(limit) : null,
    });

    return res.status(200).json({ transactions });
  } catch (error) {
    console.error('Transaction history error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// GET /api/transfers/statement — get all transactions in a date range for statement generation
router.get('/statement', protect, requireKYCApproved, async (req, res) => {
  try {
    const account = await getAccountByUserId(req.user.id);
    if (!account) return res.status(404).json({ message: 'Account not found.' });

    const { startDate, endDate } = req.query;
    const transactions = await getTransactionsByAccountIdWithDateRange(account.id, startDate, endDate);

    return res.status(200).json({ transactions });
  } catch (error) {
    console.error('Statement error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

module.exports = router;
