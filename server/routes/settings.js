const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { protect, requireKYCApproved } = require('../middleware/auth');
const { updatePhoneNumber, updateAddress, updateUserPassword } = require('../models/User');
const { getActiveSessionsByUserId, deactivateSession, deactivateAllSessionsExcept } = require('../models/Session');

// All routes require authentication and KYC
router.use(protect, requireKYCApproved);

// PATCH /api/settings/phone
router.patch('/phone', [
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required.').isLength({ max: 30 }).withMessage('Phone number too long.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  try {
    await updatePhoneNumber(req.user.id, req.body.phoneNumber.trim());
    return res.status(200).json({ message: 'Phone number updated successfully.' });
  } catch (error) {
    console.error('Update phone error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PATCH /api/settings/address
router.patch('/address', [
  body('address').trim().notEmpty().withMessage('Address is required.').isLength({ max: 500 }).withMessage('Address too long.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  try {
    await updateAddress(req.user.id, req.body.address.trim());
    return res.status(200).json({ message: 'Address updated successfully.' });
  } catch (error) {
    console.error('Update address error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PATCH /api/settings/password
router.patch('/password', [
  body('password').isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }).withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special symbol.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  try {
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    // updateUserPassword is used as alias/wrapper for updatePassword per user's prompt
    await updateUserPassword(req.user.id, passwordHash);
    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// GET /api/settings/sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await getActiveSessionsByUserId(req.user.id);
    return res.status(200).json({ sessions, currentJti: req.jti });
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// DELETE /api/settings/sessions/:id
router.delete('/sessions/:id', async (req, res) => {
  try {
    await deactivateSession(req.params.id);
    return res.status(200).json({ message: 'Session terminated.' });
  } catch (error) {
    console.error('Terminate session error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

// DELETE /api/settings/sessions
router.delete('/sessions', async (req, res) => {
  try {
    await deactivateAllSessionsExcept(req.user.id, req.jti);
    return res.status(200).json({ message: 'All other sessions terminated.' });
  } catch (error) {
    console.error('Terminate all sessions error:', error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
});

module.exports = router;
