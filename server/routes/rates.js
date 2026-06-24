const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getRates } = require('../utils/rateService');

// GET /api/rates — fetch live exchange rates (Redis cached, dual-API fallback)
router.get('/', protect, async (req, res) => {
  try {
    const { rates, source, cached } = await getRates();
    return res.status(200).json({
      base: 'USD',
      timestamp: Date.now(),
      rates,
      // Informational headers (not shown to user but useful for debugging)
      _meta: { source, cached },
    });
  } catch (error) {
    console.error('[GET /api/rates] Error:', error.message);
    return res.status(503).json({
      message: error.message || 'Exchange rate services are temporarily unavailable.',
    });
  }
});

module.exports = router;
