const express = require('express');
const router = express.Router();
const { globalLimiter } = require('../middleware/rateLimiter');
const { sendAdminAlertEmail } = require('../utils/mailer');
const { body, validationResult } = require('express-validator');

// POST /api/support/contact
router.post('/contact', globalLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }).escape(),
  body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('subject').trim().notEmpty().withMessage('Subject is required.').isLength({ max: 150 }).escape(),
  body('message').trim().notEmpty().withMessage('Message is required.').isLength({ max: 2000 }).escape(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { name, email, subject, message } = req.body;

    // Send an alert to the admin email with the contact details
    await sendAdminAlertEmail(
      `Support Contact: ${subject}`,
      `<h3 style="color: #1a1f36;">New Support Message</h3>
       <p><strong>From:</strong> ${name} (${email})</p>
       <p><strong>Subject:</strong> ${subject}</p>
       <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
       <p style="white-space: pre-wrap;">${message}</p>`
    );

    return res.status(200).json({ message: 'Your message has been sent successfully. Our support team will get back to you shortly.' });
  } catch (error) {
    console.error('Support contact error:', error);
    return res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router;
