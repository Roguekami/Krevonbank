const express = require('express');
const router = express.Router();
const { protect, requireVerified } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');
const { createKYCSubmission, getKYCByUserId } = require('../models/KYC');
const { updateKYCStatus, updateSubmissionCount } = require('../models/User');
const { sendAdminAlertEmail } = require('../utils/mailer');

// POST /api/kyc/submit
router.post(
  '/submit',
  protect,
  requireVerified,
  upload.fields([{ name: 'tier1Doc', maxCount: 1 }, { name: 'tier2Doc', maxCount: 1 }]),
  async (req, res) => {
    try {
      const user = req.user;

      // Check daily submission limit (5 per day)
      const today = new Date().toISOString().split('T')[0];
      const lastDate = user.last_submission_date
        ? new Date(user.last_submission_date).toISOString().split('T')[0]
        : null;
      const todayCount = lastDate === today ? user.submission_count_today : 0;

      if (todayCount >= 5) {
        return res.status(429).json({
          message: 'You have reached the maximum of 5 KYC submissions for today. Please try again after midnight.',
        });
      }

      // Check for consecutive day rejections (5 days in a row = flag for manual review)
      if (user.total_rejections_count >= 5) {
        return res.status(403).json({
          message: 'Your account has been flagged for manual review. Please contact our support team.',
        });
      }

      // Check blocked status
      if (user.kyc_status === 'approved') {
        return res.status(400).json({ message: 'Your KYC is already approved.' });
      }

      const { tier1DocType, tier2DocType } = req.body;

      const validTier1 = ['Passport', 'National ID', 'Drivers License'];
      const validTier2 = ['Utility Bill', 'Bank Statement', 'Government Address Document'];

      if (!validTier1.includes(tier1DocType)) {
        return res.status(400).json({ message: 'Invalid Tier 1 document type.' });
      }
      if (!validTier2.includes(tier2DocType)) {
        return res.status(400).json({ message: 'Invalid Tier 2 document type.' });
      }

      if (!req.files?.tier1Doc || !req.files?.tier2Doc) {
        return res.status(400).json({ message: 'Both Tier 1 and Tier 2 documents are required.' });
      }

      const tier1File = req.files.tier1Doc[0];
      const tier2File = req.files.tier2Doc[0];

      // Upload both documents to Cloudinary with server-generated names
      const [tier1Url, tier2Url] = await Promise.all([
        uploadToCloudinary(tier1File.buffer, tier1File.mimetype, 'tier1'),
        uploadToCloudinary(tier2File.buffer, tier2File.mimetype, 'tier2'),
      ]);

      const submission = await createKYCSubmission({
        userId: user.id,
        tier1DocType,
        tier1DocUrl: tier1Url,
        tier2DocType,
        tier2DocUrl: tier2Url,
      });

      // Update user KYC status and submission count
      await Promise.all([
        updateKYCStatus(user.id, 'pending'),
        updateSubmissionCount(user.id),
      ]);

      // Emit real-time Socket.io notification to admin
      const io = req.app.get('io');
      if (io) {
        io.to('admin-room').emit('kyc:new_submission', {
          userId: user.id,
          userName: user.full_name,
          submissionId: submission.id,
          submittedAt: new Date(),
        });
      }

      // Email alert to admin
      try {
        await sendAdminAlertEmail(
          'New KYC Submission',
          `<h3 style="color: #1a1f36;">New KYC Documents Submitted</h3>
           <p><strong>User:</strong> ${user.full_name} (${user.email})</p>
           <p><strong>Tier 1 Document:</strong> ${tier1DocType}</p>
           <p><strong>Tier 2 Document:</strong> ${tier2DocType}</p>
           <p style="margin-top: 16px;">Please review this submission in the <a href="${process.env.CLIENT_URL}/admin" style="color: #D4AF37;">Admin Dashboard</a>.</p>`
        );
      } catch (emailErr) {
        console.warn('[DEV] Admin KYC alert email failed:', emailErr.message);
      }

      return res.status(200).json({ message: 'Documents submitted successfully. Your KYC is under review.' });
    } catch (error) {
      console.error('KYC submit error:', error);
      return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
  }
);

// GET /api/kyc/status
router.get('/status', protect, requireVerified, async (req, res) => {
  try {
    const submission = await getKYCByUserId(req.user.id);
    return res.status(200).json({
      kycStatus: req.user.kyc_status,
      submissionCountToday: req.user.submission_count_today,
      totalRejections: req.user.total_rejections_count,
      submission: submission
        ? {
            tier1DocType: submission.tier1_doc_type,
            tier2DocType: submission.tier2_doc_type,
            status: submission.status,
            rejectionReason: submission.rejection_reason,
            submittedAt: submission.created_at,
          }
        : null,
    });
  } catch (error) {
    console.error('KYC status error:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
