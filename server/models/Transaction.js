const { pool } = require('../config/db');

const createTransaction = async ({
  senderAccountId, receiverAccountId, type, amount, currencyCode,
  exchangeRate, convertedAmount, convertedCurrency,
  recipientName, recipientBankName, recipientAccountNumber, recipientSwiftIban, description
}) => {
  const result = await pool.query(
    `INSERT INTO transactions
     (sender_account_id, receiver_account_id, type, amount, currency_code, exchange_rate,
      converted_amount, converted_currency, recipient_name, recipient_bank_name,
      recipient_account_number, recipient_swift_iban, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      senderAccountId, receiverAccountId, type, amount, currencyCode,
      exchangeRate || null, convertedAmount || null, convertedCurrency || null,
      recipientName || null, recipientBankName || null,
      recipientAccountNumber || null, recipientSwiftIban || null, description || null
    ]
  );
  return result.rows[0];
};

const getTransactionsByAccountId = async (accountId, filters = {}) => {
  let query = `
    SELECT t.*, 
      sa.account_number AS sender_account_number,
      ra.account_number AS receiver_account_number
    FROM transactions t
    LEFT JOIN accounts sa ON sa.id = t.sender_account_id
    LEFT JOIN accounts ra ON ra.id = t.receiver_account_id
    WHERE (t.sender_account_id = $1 OR t.receiver_account_id = $1)
  `;
  const params = [accountId];
  let idx = 2;

  if (filters.type) {
    query += ` AND t.type = $${idx++}`;
    params.push(filters.type);
  }
  if (filters.status) {
    query += ` AND t.status = $${idx++}`;
    params.push(filters.status);
  }

  query += ` ORDER BY t.created_at DESC`;
  if (filters.limit) {
    query += ` LIMIT $${idx++}`;
    params.push(filters.limit);
  }

  const result = await pool.query(query, params);
  return result.rows;
};

const getAllTransactions = async (filters = {}) => {
  let query = `
    SELECT t.*, u.full_name AS sender_name, u.email AS sender_email,
      sa.account_number AS sender_account_number
    FROM transactions t
    LEFT JOIN accounts sa ON sa.id = t.sender_account_id
    LEFT JOIN users u ON u.id = sa.user_id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  if (filters.type) {
    query += ` AND t.type = $${idx++}`;
    params.push(filters.type);
  }
  if (filters.status) {
    query += ` AND t.status = $${idx++}`;
    params.push(filters.status);
  }

  query += ` ORDER BY t.created_at DESC`;
  const result = await pool.query(query, params);
  return result.rows;
};

const getTransactionById = async (id) => {
  const result = await pool.query(
    `SELECT t.*, sa.account_number AS sender_account_number, sa.user_id AS sender_user_id
     FROM transactions t
     LEFT JOIN accounts sa ON sa.id = t.sender_account_id
     WHERE t.id = $1`,
    [id]
  );
  return result.rows[0];
};

const updateTransactionStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE transactions SET status = $1, processed_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0];
};

const updateTransactionAdmin = async (id, updates) => {
  const { amount, status, description, recipientName, recipientBankName, recipientAccountNumber, recipientSwiftIban, date } = updates;
  
  let query = 'UPDATE transactions SET ';
  const params = [];
  let idx = 1;
  const setClauses = [];

  if (amount !== undefined) {
    setClauses.push(`amount = $${idx++}`);
    params.push(amount);
  }
  if (status !== undefined) {
    setClauses.push(`status = $${idx++}`);
    params.push(status);
  }
  if (description !== undefined) {
    setClauses.push(`description = $${idx++}`);
    params.push(description);
  }
  if (recipientName !== undefined) {
    setClauses.push(`recipient_name = $${idx++}`);
    params.push(recipientName);
  }
  if (recipientBankName !== undefined) {
    setClauses.push(`recipient_bank_name = $${idx++}`);
    params.push(recipientBankName);
  }
  if (recipientAccountNumber !== undefined) {
    setClauses.push(`recipient_account_number = $${idx++}`);
    params.push(recipientAccountNumber);
  }
  if (recipientSwiftIban !== undefined) {
    setClauses.push(`recipient_swift_iban = $${idx++}`);
    params.push(recipientSwiftIban);
  }
  if (date !== undefined) {
    setClauses.push(`created_at = $${idx++}`);
    params.push(date);
  }

  if (setClauses.length === 0) return null;

  query += setClauses.join(', ') + ` WHERE id = $${idx++} RETURNING *`;
  params.push(id);

  const result = await pool.query(query, params);
  return result.rows[0];
};

const getTransactionsByAccountIdWithDateRange = async (accountId, startDate, endDate) => {
  let query = `
    SELECT t.*, 
      sa.account_number AS sender_account_number,
      ra.account_number AS receiver_account_number
    FROM transactions t
    LEFT JOIN accounts sa ON sa.id = t.sender_account_id
    LEFT JOIN accounts ra ON ra.id = t.receiver_account_id
    WHERE (t.sender_account_id = $1 OR t.receiver_account_id = $1)
  `;
  const params = [accountId];
  let idx = 2;

  if (startDate) {
    query += ` AND t.created_at >= $${idx++}`;
    params.push(startDate);
  }
  if (endDate) {
    // Use ::date + 1 day to make the end date inclusive
    query += ` AND t.created_at < $${idx++}::date + integer '1'`;
    params.push(endDate);
  }

  query += ` ORDER BY t.created_at DESC`;
  const result = await pool.query(query, params);
  return result.rows;
};

module.exports = {
  createTransaction,
  getTransactionsByAccountId,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatus,
  updateTransactionAdmin,
  getTransactionsByAccountIdWithDateRange,
};
