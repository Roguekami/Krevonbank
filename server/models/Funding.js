const { pool } = require('../config/db');

const createFundingRequest = async ({ userId, cryptoType, network, transactionHash, amountSent }) => {
  const result = await pool.query(
    `INSERT INTO funding_requests (user_id, crypto_type, network, transaction_hash, amount_sent)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, cryptoType.toUpperCase(), network, transactionHash, amountSent]
  );
  return result.rows[0];
};

const getFundingRequestsByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM funding_requests WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

const getAllPendingFundingRequests = async () => {
  const result = await pool.query(
    `SELECT fr.*, u.full_name, u.email, a.id AS account_id, a.account_number
     FROM funding_requests fr
     JOIN users u ON u.id = fr.user_id
     LEFT JOIN accounts a ON a.user_id = fr.user_id
     ORDER BY fr.created_at DESC`
  );
  return result.rows;
};

const updateFundingRequestStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE funding_requests SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0];
};

const createBankDeposit = async ({ userId, currency, amount, senderName, senderBank, referenceCode }) => {
  const result = await pool.query(
    `INSERT INTO bank_deposits (user_id, currency, amount, sender_name, sender_bank, reference_code)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, currency.toUpperCase(), amount, senderName, senderBank, referenceCode]
  );
  return result.rows[0];
};

const getBankDepositsByUser = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM bank_deposits WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

const getAllPendingBankDeposits = async () => {
  const result = await pool.query(
    `SELECT bd.*, u.full_name, u.email, a.id AS account_id, a.account_number
     FROM bank_deposits bd
     JOIN users u ON u.id = bd.user_id
     LEFT JOIN accounts a ON a.user_id = bd.user_id
     WHERE bd.status = 'pending'
     ORDER BY bd.created_at DESC`
  );
  return result.rows;
};

const updateBankDepositStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE bank_deposits SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0];
};

module.exports = {
  createFundingRequest,
  getFundingRequestsByUserId,
  getAllPendingFundingRequests,
  updateFundingRequestStatus,
  createBankDeposit,
  getBankDepositsByUser,
  getAllPendingBankDeposits,
  updateBankDepositStatus
};
