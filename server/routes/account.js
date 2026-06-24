const express = require('express');
const router = express.Router();
const { protect, requireKYCApproved } = require('../middleware/auth');
const { getAccountByUserId, addCurrencyBalance, setDefaultCurrency, createAccount } = require('../models/Account');

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'NGN', 'GHS', 'KES', 'ZAR'];

// GET /api/account — get logged-in user's account and all balances
router.get('/', protect, requireKYCApproved, async (req, res) => {
  try {
    const account = await getAccountByUserId(req.user.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found. Please complete account setup.' });
    }
    return res.status(200).json({ account });
  } catch (error) {
    console.error('Get account error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// POST /api/account/setup — called once after KYC approval to choose default currency
router.post('/setup', protect, requireKYCApproved, async (req, res) => {
  try {
    const { currency } = req.body;
    if (!currency || !SUPPORTED_CURRENCIES.includes(currency.toUpperCase())) {
      return res.status(400).json({ message: 'Please select a valid currency.' });
    }

    // Check if account already exists
    const existing = await getAccountByUserId(req.user.id);
    if (existing) {
      return res.status(409).json({ message: 'Account already set up.', account: existing });
    }

    const currencyCode = currency.toUpperCase();
    const account = await createAccount(req.user.id, currencyCode);
    await addCurrencyBalance(account.id, currencyCode);
    const fullAccount = await getAccountByUserId(req.user.id);

    return res.status(201).json({ message: 'Account created successfully.', account: fullAccount });
  } catch (error) {
    console.error('Account setup error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// POST /api/account/currency — add a new currency wallet
router.post('/currency', protect, requireKYCApproved, async (req, res) => {
  try {
    const { currency } = req.body;
    if (!currency || !SUPPORTED_CURRENCIES.includes(currency.toUpperCase())) {
      return res.status(400).json({ message: 'Please select a valid currency.' });
    }

    const account = await getAccountByUserId(req.user.id);
    if (!account) return res.status(404).json({ message: 'Account not found.' });
    if (account.is_frozen) return res.status(403).json({ message: 'Your account is frozen.' });

    const currencyCode = currency.toUpperCase();
    const existing = account.balances && account.balances.find(b => b.currency_code === currencyCode);
    if (existing) return res.status(409).json({ message: `You already have a ${currencyCode} wallet.` });

    await addCurrencyBalance(account.id, currencyCode);
    const updated = await getAccountByUserId(req.user.id);
    return res.status(201).json({ message: `${currencyCode} wallet added.`, account: updated });
  } catch (error) {
    console.error('Add currency error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

module.exports = router;
