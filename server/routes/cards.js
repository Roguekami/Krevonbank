const express = require('express');
const router = express.Router();
const { protect, requireKYCApproved } = require('../middleware/auth');
const {
  createCard, getCardsByUserId, getCardById, updateCardStatus,
  updateSpendingLimit, generateCVV, deleteCard
} = require('../models/Card');
const { getAccountByUserId } = require('../models/Account');
const { cvvLimiter, transactionLimiter } = require('../middleware/rateLimiter');
const { sendAdminAlertEmail } = require('../utils/mailer');

// POST /api/cards/request — request a new virtual or physical card
router.post('/request', protect, requireKYCApproved, transactionLimiter, async (req, res) => {
  try {
    const { type = 'virtual', deliveryInfo } = req.body;
    if (!['virtual', 'physical'].includes(type)) {
      return res.status(400).json({ message: 'Card type must be virtual or physical.' });
    }

    // Physical card requires delivery info
    if (type === 'physical') {
      if (!deliveryInfo || !deliveryInfo.name || !deliveryInfo.address || !deliveryInfo.city || !deliveryInfo.country || !deliveryInfo.postal || !deliveryInfo.phone) {
        return res.status(400).json({ message: 'Delivery information is required for a physical card.' });
      }
    }

    const account = await getAccountByUserId(req.user.id);
    if (!account) return res.status(404).json({ message: 'Account not found.' });
    if (account.is_frozen) return res.status(403).json({ message: 'Your account is frozen.' });

    // Limit: max 1 virtual and 1 physical card
    const existing = await getCardsByUserId(req.user.id);
    const existingVirtual = existing.filter(c => c.type === 'virtual').length;
    const existingPhysical = existing.filter(c => c.type === 'physical').length;

    if (type === 'virtual' && existingVirtual >= 1) {
      return res.status(400).json({ message: 'You already have a virtual card.' });
    }
    if (type === 'physical' && existingPhysical >= 1) {
      return res.status(400).json({ message: 'You already have a physical card on order.' });
    }

    const card = await createCard({
      userId: req.user.id,
      accountId: account.id,
      cardholderName: req.user.full_name,
      type,
      deliveryInfo: deliveryInfo || {},
    });

    const message = type === 'virtual'
      ? 'Virtual card created successfully.'
      : 'Physical card request submitted. Allow 7-14 business days for delivery.';

    // Email alert to admin for physical card requests
    if (type === 'physical') {
      try {
        await sendAdminAlertEmail(
          'New Physical Card Request',
          `<h3 style="color: #1a1f36;">Physical Card Requested</h3>
           <p><strong>User:</strong> ${req.user.full_name} (${req.user.email})</p>
           <p><strong>Delivery Name:</strong> ${deliveryInfo.name}</p>
           <p><strong>Address:</strong> ${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.country} ${deliveryInfo.postal}</p>
           <p><strong>Phone:</strong> ${deliveryInfo.phone}</p>
           <p style="margin-top: 16px;">Please process this request in the <a href="${process.env.CLIENT_URL}/admin" style="color: #D4AF37;">Admin Dashboard</a>.</p>`
        );
      } catch (emailErr) {
        console.warn('[DEV] Admin card alert email failed:', emailErr.message);
      }
    }

    return res.status(201).json({ message, card });
  } catch (error) {
    console.error('Card request error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// GET /api/cards — get all cards for logged-in user
router.get('/', protect, requireKYCApproved, async (req, res) => {
  try {
    const cards = await getCardsByUserId(req.user.id);
    return res.status(200).json({ cards });
  } catch (error) {
    console.error('Get cards error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// GET /api/cards/:id/cvv — generate CVV on the fly, never stored
router.get('/:id/cvv', protect, requireKYCApproved, cvvLimiter, async (req, res) => {
  try {
    const card = await getCardById(req.params.id, req.user.id);
    if (!card) return res.status(404).json({ message: 'Card not found.' });
    if (card.status === 'frozen') return res.status(403).json({ message: 'Card is frozen.' });
    if (card.status === 'requested' || card.status === 'shipped') {
      return res.status(403).json({ message: 'CVV is not available until your card is activated.' });
    }
    const cvv = generateCVV(card.id);
    return res.status(200).json({ cvv });
  } catch (error) {
    console.error('Get CVV error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/cards/:id/freeze
router.put('/:id/freeze', protect, requireKYCApproved, async (req, res) => {
  try {
    const card = await getCardById(req.params.id, req.user.id);
    if (!card) return res.status(404).json({ message: 'Card not found.' });
    if (card.status === 'frozen') return res.status(400).json({ message: 'Card is already frozen.' });
    if (card.status === 'requested' || card.status === 'shipped') {
      return res.status(400).json({ message: 'Card cannot be frozen until it is activated.' });
    }
    const updated = await updateCardStatus(card.id, 'frozen');
    return res.status(200).json({ message: 'Card frozen successfully.', card: updated });
  } catch (error) {
    console.error('Freeze card error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/cards/:id/unfreeze
router.put('/:id/unfreeze', protect, requireKYCApproved, async (req, res) => {
  try {
    const card = await getCardById(req.params.id, req.user.id);
    if (!card) return res.status(404).json({ message: 'Card not found.' });
    if (card.status !== 'frozen') return res.status(400).json({ message: 'Card is not frozen.' });
    const updated = await updateCardStatus(card.id, 'active');
    return res.status(200).json({ message: 'Card unfrozen successfully.', card: updated });
  } catch (error) {
    console.error('Unfreeze card error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/cards/:id/limit
router.put('/:id/limit', protect, requireKYCApproved, async (req, res) => {
  try {
    const { limit } = req.body;
    const parsedLimit = parseFloat(limit);
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      return res.status(400).json({ message: 'Please provide a valid spending limit (0 or more).' });
    }
    const card = await getCardById(req.params.id, req.user.id);
    if (!card) return res.status(404).json({ message: 'Card not found.' });
    const updated = await updateSpendingLimit(card.id, parsedLimit);
    return res.status(200).json({ message: 'Spending limit updated.', card: updated });
  } catch (error) {
    console.error('Update limit error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// DELETE /api/cards/:id — delete virtual card only
router.delete('/:id', protect, requireKYCApproved, async (req, res) => {
  try {
    const card = await getCardById(req.params.id, req.user.id);
    if (!card) return res.status(404).json({ message: 'Card not found.' });
    if (card.type !== 'virtual') {
      return res.status(403).json({ message: 'Physical cards cannot be deleted. Contact support.' });
    }
    const deleted = await deleteCard(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ message: 'Card not found or already deleted.' });
    return res.status(200).json({ message: 'Virtual card deleted successfully.' });
  } catch (error) {
    console.error('Delete card error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

module.exports = router;
