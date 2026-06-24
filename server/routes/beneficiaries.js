const express = require('express');
const router = express.Router();
const { protect, requireKYCApproved } = require('../middleware/auth');
const { createBeneficiary, getBeneficiariesByUserId, deleteBeneficiary } = require('../models/Beneficiary');

// POST /api/beneficiaries — save a new beneficiary
router.post('/', protect, requireKYCApproved, async (req, res) => {
  try {
    const { fullName, bankName, accountNumber, swiftIban, currencyCode } = req.body;
    if (!fullName || !bankName || !accountNumber || !swiftIban || !currencyCode) {
      return res.status(400).json({ message: 'All beneficiary fields are required.' });
    }
    const beneficiary = await createBeneficiary({
      userId: req.user.id, fullName, bankName, accountNumber, swiftIban,
      currencyCode: currencyCode.toUpperCase(),
    });
    return res.status(201).json({ message: 'Beneficiary saved.', beneficiary });
  } catch (error) {
    console.error('Create beneficiary error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// GET /api/beneficiaries — get all saved beneficiaries
router.get('/', protect, requireKYCApproved, async (req, res) => {
  try {
    const beneficiaries = await getBeneficiariesByUserId(req.user.id);
    return res.status(200).json({ beneficiaries });
  } catch (error) {
    console.error('Get beneficiaries error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// DELETE /api/beneficiaries/:id — delete a beneficiary
router.delete('/:id', protect, requireKYCApproved, async (req, res) => {
  try {
    const deleted = await deleteBeneficiary(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ message: 'Beneficiary not found.' });
    return res.status(200).json({ message: 'Beneficiary deleted.' });
  } catch (error) {
    console.error('Delete beneficiary error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

module.exports = router;
