const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const { getAllPendingKYC, approveKYC, rejectKYC } = require('../models/KYC');
const { updateKYCStatus, incrementTotalRejections, findUserById } = require('../models/User');
const { sendKYCRejectionEmail, sendKYCApprovalEmail, sendBalanceCreditEmail, sendTransferApprovalEmail } = require('../utils/mailer');
const { body, validationResult } = require('express-validator');
const {
  getAllAccountsWithUsers, getAccountById, getAccountByUserId,
  freezeAccount, unfreezeAccount, creditBalance, createAccount, addCurrencyBalance
} = require('../models/Account');
const { getAllTransactions, getTransactionById, updateTransactionStatus, updateTransactionAdmin, getTransactionsByAccountIdWithDateRange } = require('../models/Transaction');
const { getAllPendingFundingRequests, updateFundingRequestStatus, getAllPendingBankDeposits, updateBankDepositStatus } = require('../models/Funding');
const { getAllPendingPhysicalCards, getCardByIdAdmin, updateCardStatus } = require('../models/Card');
const { createAuditLog } = require('../models/AuditLog');

const MAX_AMOUNT = parseFloat(process.env.MAX_TRANSACTION_AMOUNT) || 5000000;
const MIN_AMOUNT = parseFloat(process.env.MIN_TRANSACTION_AMOUNT) || 0.01;

// ─── KYC ROUTES ────────────────────────────────────────────────────────────────

// GET /api/admin/kyc/pending
router.get('/kyc/pending', protect, requireAdmin, async (req, res) => {
  try {
    const submissions = await getAllPendingKYC();
    return res.status(200).json({ submissions });
  } catch (error) {
    console.error('Admin KYC list error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// POST /api/admin/kyc/:submissionId/approve
router.post('/kyc/:submissionId/approve', protect, requireAdmin, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await approveKYC(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });

    await updateKYCStatus(submission.user_id, 'approved');

    // Auto-create account record (without any balance yet)
    const user = await findUserById(submission.user_id);

    // Only create account if one doesn't already exist
    const { pool } = require('../config/db');
    const existingAccount = await pool.query('SELECT id FROM accounts WHERE user_id = $1', [submission.user_id]);
    if (existingAccount.rows.length === 0) {
      // Create with placeholder default_currency; user will choose on first login
      await createAccount(submission.user_id, 'USD');
    }

    try {
      await sendKYCApprovalEmail(user.email, user.full_name);
    } catch (e) {
      console.warn('[DEV] KYC approval email failed:', e.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${user.id}`).emit('kyc:approved', { message: 'Your KYC has been approved!' });
    }

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      action: 'kyc_approve',
      targetId: submission.user_id,
      targetTable: 'users',
      oldValue: { kyc_status: 'pending' },
      newValue: { kyc_status: 'approved' },
      details: { submission_id: submissionId },
    });

    return res.status(200).json({ message: `KYC for ${user.full_name} approved successfully.` });
  } catch (error) {
    console.error('Admin KYC approve error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// POST /api/admin/kyc/:submissionId/reject
router.post('/kyc/:submissionId/reject', protect, requireAdmin, [
  body('reason').trim().notEmpty().withMessage('Rejection reason is required.').isLength({ max: 500 }).escape(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { submissionId } = req.params;
    const { reason } = req.body;
    const submission = await rejectKYC(submissionId, reason);
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });

    await updateKYCStatus(submission.user_id, 'rejected');
    await incrementTotalRejections(submission.user_id);

    const user = await findUserById(submission.user_id);
    try {
      await sendKYCRejectionEmail(user.email, user.full_name, reason);
    } catch (e) {
      console.warn('[DEV] KYC rejection email failed:', e.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${user.id}`).emit('kyc:rejected', { reason });
    }

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      action: 'kyc_reject',
      targetId: submission.user_id,
      targetTable: 'users',
      oldValue: { kyc_status: 'pending' },
      newValue: { kyc_status: 'rejected' },
      details: { submission_id: submissionId, reason },
    });

    return res.status(200).json({ message: `KYC for ${user.full_name} rejected.` });
  } catch (error) {
    console.error('Admin KYC reject error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ─── USER / ACCOUNT ROUTES ─────────────────────────────────────────────────────

// GET /api/admin/users — get all users with account and balance info
router.get('/users', protect, requireAdmin, async (req, res) => {
  try {
    const accounts = await getAllAccountsWithUsers();
    return res.status(200).json({ accounts });
  } catch (error) {
    console.error('Admin get users error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// GET /api/admin/users/:id/statement — get all transactions in a date range for a specific user
router.get('/users/:id/statement', protect, requireAdmin, async (req, res) => {
  try {
    const account = await getAccountByUserId(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found.' });

    const { startDate, endDate } = req.query;
    const transactions = await getTransactionsByAccountIdWithDateRange(account.id, startDate, endDate);

    return res.status(200).json({ transactions });
  } catch (error) {
    console.error('Admin get statement error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/admin/account/:id/credit — manually credit a balance
router.put('/account/:id/credit', protect, requireAdmin, [
  body('currency').notEmpty().isLength({ max: 5 }).withMessage('Currency is required.'),
  body('amount').isFloat({ min: MIN_AMOUNT, max: MAX_AMOUNT }).withMessage(`Amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT}.`),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { currency, amount, note } = req.body;
    const account = await getAccountById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found.' });

    // Get old balance for audit
    const { getBalanceByCurrency } = require('../models/Account');
    const oldBalanceRow = await getBalanceByCurrency(account.id, currency.toUpperCase());
    const oldBalance = oldBalanceRow ? parseFloat(oldBalanceRow.balance) : 0;

    await creditBalance(account.id, currency.toUpperCase(), parseFloat(amount));

    // Log as a transaction
    const { createTransaction } = require('../models/Transaction');
    await createTransaction({
      senderAccountId: null,
      receiverAccountId: account.id,
      type: 'bank_funding',
      status: 'completed',
      amount: parseFloat(amount),
      currencyCode: currency.toUpperCase(),
      description: note || `Manual credit by admin`,
    });

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      action: 'credit_balance',
      targetId: account.id,
      targetTable: 'account_balances',
      oldValue: { currency: currency.toUpperCase(), balance: oldBalance },
      newValue: { currency: currency.toUpperCase(), balance: oldBalance + parseFloat(amount) },
      details: { amount: parseFloat(amount), note: note || null },
    });

    // Send notification email to user
    try {
      const user = await findUserById(account.user_id);
      if (user) {
        await sendBalanceCreditEmail(user.email, user.full_name, currency.toUpperCase(), amount, note);
      }
    } catch (e) {
      console.warn('[DEV] Balance credit notification email failed:', e.message);
    }

    return res.status(200).json({ message: `${currency.toUpperCase()} ${amount} credited successfully.` });
  } catch (error) {
    console.error('Admin credit error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/admin/account/:id/freeze
router.put('/account/:id/freeze', protect, requireAdmin, async (req, res) => {
  try {
    const account = await getAccountById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found.' });
    await freezeAccount(account.id);

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      action: 'freeze_account',
      targetId: account.id,
      targetTable: 'accounts',
      oldValue: { is_frozen: false },
      newValue: { is_frozen: true },
    });

    return res.status(200).json({ message: 'Account frozen successfully.' });
  } catch (error) {
    console.error('Admin freeze error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/admin/account/:id/unfreeze
router.put('/account/:id/unfreeze', protect, requireAdmin, async (req, res) => {
  try {
    const account = await getAccountById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found.' });
    await unfreezeAccount(account.id);

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      action: 'unfreeze_account',
      targetId: account.id,
      targetTable: 'accounts',
      oldValue: { is_frozen: true },
      newValue: { is_frozen: false },
    });

    return res.status(200).json({ message: 'Account unfrozen successfully.' });
  } catch (error) {
    console.error('Admin unfreeze error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ─── TRANSACTION ROUTES ────────────────────────────────────────────────────────

// GET /api/admin/transactions
router.get('/transactions', protect, requireAdmin, async (req, res) => {
  try {
    const { type, status } = req.query;
    const transactions = await getAllTransactions({ type, status });
    return res.status(200).json({ transactions });
  } catch (error) {
    console.error('Admin get transactions error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/admin/transactions/:id/approve — approve a pending wire transfer
router.put('/transactions/:id/approve', protect, requireAdmin, async (req, res) => {
  try {
    const transaction = await getTransactionById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending transactions can be approved.' });
    }

    // Set to processing first, then completed
    await updateTransactionStatus(req.params.id, 'processing');
    const completed = await updateTransactionStatus(req.params.id, 'completed');

    // Notify user via Socket.io
    const io = req.app.get('io');
    if (io && transaction.sender_user_id) {
      io.to(`user-${transaction.sender_user_id}`).emit('transaction:approved', {
        transactionId: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency_code,
      });
    }

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      action: 'approve_transaction',
      targetId: transaction.id,
      targetTable: 'transactions',
      oldValue: { status: 'pending' },
      newValue: { status: 'completed' },
    });

    // Send email notification to user
    try {
      if (transaction.sender_user_id) {
        const user = await findUserById(transaction.sender_user_id);
        if (user) {
          await sendTransferApprovalEmail(
            user.email, user.full_name,
            transaction.amount, transaction.currency_code,
            transaction.recipient_name || 'N/A', 'completed'
          );
        }
      }
    } catch (e) {
      console.warn('[DEV] Transfer approval email failed:', e.message);
    }

    return res.status(200).json({ message: 'Transaction approved and completed.', transaction: completed });
  } catch (error) {
    console.error('Admin approve transaction error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/admin/transactions/:id/reject — reject a wire transfer and refund
router.put('/transactions/:id/reject', protect, requireAdmin, [
  body('reason').trim().notEmpty().withMessage('Rejection reason is required.').isLength({ max: 500 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { reason } = req.body;
    const transaction = await getTransactionById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending transactions can be rejected.' });
    }

    // Refund the amount back to sender's account
    const { creditBalance } = require('../models/Account');
    await creditBalance(transaction.sender_account_id, transaction.currency_code, parseFloat(transaction.amount));

    const rejected = await updateTransactionStatus(req.params.id, 'cancelled');

    // Notify user
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${transaction.sender_user_id}`).emit('transaction:rejected', {
        transactionId: transaction.id,
        reason,
      });
    }

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      action: 'reject_transaction',
      targetId: transaction.id,
      targetTable: 'transactions',
      oldValue: { status: 'pending' },
      newValue: { status: 'cancelled' },
      details: { reason, refunded_amount: parseFloat(transaction.amount), currency: transaction.currency_code },
    });

    // Send email notification to user
    try {
      if (transaction.sender_user_id) {
        const user = await findUserById(transaction.sender_user_id);
        if (user) {
          await sendTransferApprovalEmail(
            user.email, user.full_name,
            transaction.amount, transaction.currency_code,
            transaction.recipient_name || 'N/A', 'rejected'
          );
        }
      }
    } catch (e) {
      console.warn('[DEV] Transfer rejection email failed:', e.message);
    }

    return res.status(200).json({ message: 'Transaction rejected and funds refunded.', transaction: rejected });
  } catch (error) {
    console.error('Admin reject transaction error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/admin/transactions/:id/edit — edit any transaction record
router.put('/transactions/:id/edit', protect, requireAdmin, async (req, res) => {
  try {
    const transaction = await getTransactionById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });

    const { amount, status, description, recipientName, recipientBankName, recipientAccountNumber, recipientSwiftIban, date } = req.body;

    // Track old values for auditing
    const oldValue = {
      amount: transaction.amount,
      status: transaction.status,
      description: transaction.description,
      recipient_name: transaction.recipient_name,
      recipient_bank_name: transaction.recipient_bank_name,
      recipient_account_number: transaction.recipient_account_number,
      recipient_swift_iban: transaction.recipient_swift_iban,
      created_at: transaction.created_at
    };

    const updated = await updateTransactionAdmin(req.params.id, {
      amount, status, description, recipientName, recipientBankName, recipientAccountNumber, recipientSwiftIban, date
    });

    if (!updated) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    // Audit log
    const newValue = {
      amount: updated.amount,
      status: updated.status,
      description: updated.description,
      recipient_name: updated.recipient_name,
      recipient_bank_name: updated.recipient_bank_name,
      recipient_account_number: updated.recipient_account_number,
      recipient_swift_iban: updated.recipient_swift_iban,
      created_at: updated.created_at
    };

    await createAuditLog({
      adminId: req.user.id,
      action: 'edit_transaction',
      targetId: updated.id,
      targetTable: 'transactions',
      oldValue,
      newValue,
    });

    return res.status(200).json({ message: 'Transaction updated successfully.', transaction: updated });
  } catch (error) {
    console.error('Admin edit transaction error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ─── CRYPTO FUNDING ROUTES ────────────────────────────────────────────────────

// GET /api/admin/funding/pending
router.get('/funding/pending', protect, requireAdmin, async (req, res) => {
  try {
    const requests = await getAllPendingFundingRequests();
    return res.status(200).json({ requests });
  } catch (error) {
    console.error('Admin funding list error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/admin/funding/:id/status
router.put('/funding/:id/status', protect, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be verified or rejected.' });
    }
    const updated = await updateFundingRequestStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ message: 'Funding request not found.' });

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      action: `funding_crypto_${status}`,
      targetId: updated.id,
      targetTable: 'funding_requests',
      oldValue: { status: 'pending' },
      newValue: { status },
    });

    return res.status(200).json({ message: `Funding request marked as ${status}.`, request: updated });
  } catch (error) {
    console.error('Admin funding status error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// GET /api/admin/funding/bank/pending
router.get('/funding/bank/pending', protect, requireAdmin, async (req, res) => {
  try {
    const deposits = await getAllPendingBankDeposits();
    return res.status(200).json({ deposits });
  } catch (error) {
    console.error('Admin bank deposit list error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/admin/funding/bank/:id/status
router.put('/funding/bank/:id/status', protect, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be verified or rejected.' });
    }
    const updated = await updateBankDepositStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ message: 'Bank deposit request not found.' });

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      action: `funding_bank_${status}`,
      targetId: updated.id,
      targetTable: 'bank_deposits',
      oldValue: { status: 'pending' },
      newValue: { status },
    });

    return res.status(200).json({ message: `Bank deposit request marked as ${status}.`, deposit: updated });
  } catch (error) {
    console.error('Admin bank deposit status error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// ─── CARD MANAGEMENT ROUTES ──────────────────────────────────────────────────

// GET /api/admin/cards/pending — view all pending physical card requests
router.get('/cards/pending', protect, requireAdmin, async (req, res) => {
  try {
    const cards = await getAllPendingPhysicalCards();
    return res.status(200).json({ cards });
  } catch (error) {
    console.error('Admin card list error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/admin/cards/:id/ship — mark card as shipped, optionally save tracking number
router.put('/cards/:id/ship', protect, requireAdmin, async (req, res) => {
  try {
    const card = await getCardByIdAdmin(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found.' });
    if (card.type !== 'physical') return res.status(400).json({ message: 'Only physical cards can be shipped.' });
    if (card.status !== 'requested') return res.status(400).json({ message: `Card is already ${card.status}.` });

    const { trackingNumber } = req.body;
    const updated = await updateCardStatus(card.id, 'shipped', trackingNumber || null);

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      action: 'card_ship',
      targetId: card.id,
      targetTable: 'cards',
      oldValue: { status: 'requested' },
      newValue: { status: 'shipped', tracking_number: trackingNumber || null },
    });

    return res.status(200).json({ message: 'Card marked as shipped.', card: updated });
  } catch (error) {
    console.error('Admin ship card error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/admin/cards/:id/activate — mark card as active after delivery
router.put('/cards/:id/activate', protect, requireAdmin, async (req, res) => {
  try {
    const card = await getCardByIdAdmin(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found.' });
    if (card.type !== 'physical') return res.status(400).json({ message: 'Only physical cards can be activated this way.' });
    if (card.status === 'active') return res.status(400).json({ message: 'Card is already active.' });

    const oldStatus = card.status;
    const updated = await updateCardStatus(card.id, 'active');

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      action: 'card_activate',
      targetId: card.id,
      targetTable: 'cards',
      oldValue: { status: oldStatus },
      newValue: { status: 'active' },
    });

    return res.status(200).json({ message: 'Card activated successfully.', card: updated });
  } catch (error) {
    console.error('Admin activate card error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

module.exports = router;
