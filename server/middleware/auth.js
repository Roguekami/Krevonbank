const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/User');
const { getSessionByJti, updateSessionActivity } = require('../models/Session');

const protect = async (req, res, next) => {
  try {
    // Accept token from Authorization header (mobile) or cookie (desktop)
    let token = req.cookies.token;
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ message: 'Not authorised. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.jti) {
      const session = await getSessionByJti(decoded.jti);
      if (!session) {
        return res.status(401).json({ message: 'Session has been terminated.' });
      }
      updateSessionActivity(decoded.jti).catch(e => console.warn('Failed to update session activity:', e.message));
      req.jti = decoded.jti;
    }

    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Not authorised. User not found.' });
    }

    if (user.is_suspended) {
      return res.status(401).json({ message: 'Session terminated. Your account has been suspended.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorised. Invalid session.' });
  }
};

const requireVerified = (req, res, next) => {
  if (!req.user.is_verified) {
    return res.status(403).json({ message: 'Please verify your email address to continue.' });
  }
  next();
};

const requireKYCApproved = (req, res, next) => {
  if (req.user.kyc_status !== 'approved') {
    return res.status(403).json({ message: 'Your identity verification (KYC) must be approved before accessing banking features.' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  next();
};

module.exports = { protect, requireVerified, requireKYCApproved, requireAdmin };
