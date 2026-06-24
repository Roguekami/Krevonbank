const { pool } = require('../config/db');
const crypto = require('crypto');

const createCard = async ({ userId, accountId, cardholderName, type, deliveryInfo = {} }) => {
  // Generate random 16-digit card number (store only masked last 4)
  const rawNum = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
  const last4 = rawNum.slice(-4);
  const cardNumberMasked = `**** **** **** ${last4}`;

  // Expiry: 3 years for physical, 1 year for virtual
  const now = new Date();
  const addYears = type === 'virtual' ? 1 : 3;
  const expYear = String(now.getFullYear() + addYears).slice(-2);
  const expMonth = String(now.getMonth() + 1).padStart(2, '0');
  const expiryDate = `${expMonth}/${expYear}`;

  // Physical cards start as 'requested', virtual cards as 'active'
  const initialStatus = type === 'physical' ? 'requested' : 'active';

  const result = await pool.query(
    `INSERT INTO cards 
     (user_id, account_id, cardholder_name, card_number_masked, expiry_date, type, status,
      delivery_name, delivery_address, delivery_city, delivery_country, delivery_postal, delivery_phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
    [
      userId, accountId, cardholderName, cardNumberMasked, expiryDate, type, initialStatus,
      deliveryInfo.name || null,
      deliveryInfo.address || null,
      deliveryInfo.city || null,
      deliveryInfo.country || null,
      deliveryInfo.postal || null,
      deliveryInfo.phone || null,
    ]
  );
  return result.rows[0];
};

const getCardsByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM cards WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

const getCardById = async (id, userId) => {
  const result = await pool.query(
    `SELECT * FROM cards WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0];
};

const getCardByIdAdmin = async (id) => {
  const result = await pool.query(
    `SELECT c.*, u.full_name, u.email FROM cards c
     JOIN users u ON u.id = c.user_id
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0];
};

const getAllPendingPhysicalCards = async () => {
  const result = await pool.query(
    `SELECT c.*, u.full_name, u.email FROM cards c
     JOIN users u ON u.id = c.user_id
     WHERE c.type = 'physical' AND c.status IN ('requested', 'shipped')
     ORDER BY c.created_at ASC`
  );
  return result.rows;
};

const updateCardStatus = async (id, status, trackingNumber = null) => {
  let query, params;
  if (trackingNumber !== null) {
    query = `UPDATE cards SET status = $1, tracking_number = $2 WHERE id = $3 RETURNING *`;
    params = [status, trackingNumber, id];
  } else {
    query = `UPDATE cards SET status = $1 WHERE id = $2 RETURNING *`;
    params = [status, id];
  }
  const result = await pool.query(query, params);
  return result.rows[0];
};

const updateSpendingLimit = async (id, limit) => {
  const result = await pool.query(
    `UPDATE cards SET spending_limit = $1 WHERE id = $2 RETURNING *`,
    [limit, id]
  );
  return result.rows[0];
};

const deleteCard = async (id, userId) => {
  const result = await pool.query(
    `DELETE FROM cards WHERE id = $1 AND user_id = $2 AND type = 'virtual' RETURNING *`,
    [id, userId]
  );
  return result.rows[0];
};

// Generate CVV deterministically from card id + secret — NEVER stored
const generateCVV = (cardId) => {
  const secret = process.env.JWT_SECRET || 'krevon-cvv-secret';
  const hash = crypto.createHmac('sha256', secret).update(cardId).digest('hex');
  // Take first 3 digits from hash (as decimal)
  const num = parseInt(hash.substring(0, 6), 16) % 1000;
  return String(num).padStart(3, '0');
};

module.exports = {
  createCard,
  getCardsByUserId,
  getCardById,
  getCardByIdAdmin,
  getAllPendingPhysicalCards,
  updateCardStatus,
  updateSpendingLimit,
  deleteCard,
  generateCVV,
};
