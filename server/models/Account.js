const { pool } = require('../config/db');

const createAccount = async (userId, defaultCurrency) => {
  const accountNumber = 'KRV' + Math.floor(100000000 + Math.random() * 900000000).toString();
  const result = await pool.query(
    `INSERT INTO accounts (user_id, account_number, default_currency)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, accountNumber, defaultCurrency]
  );
  return result.rows[0];
};

const getAccountByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT a.*, json_agg(json_build_object('id', ab.id, 'currency_code', ab.currency_code, 'balance', ab.balance) ORDER BY ab.created_at ASC) FILTER (WHERE ab.id IS NOT NULL) AS balances
     FROM accounts a
     LEFT JOIN account_balances ab ON ab.account_id = a.id
     WHERE a.user_id = $1
     GROUP BY a.id`,
    [userId]
  );
  return result.rows[0];
};

const getAccountById = async (accountId) => {
  const result = await pool.query(
    `SELECT * FROM accounts WHERE id = $1`,
    [accountId]
  );
  return result.rows[0];
};

const addCurrencyBalance = async (accountId, currencyCode) => {
  const result = await pool.query(
    `INSERT INTO account_balances (account_id, currency_code, balance)
     VALUES ($1, $2, 0.00)
     ON CONFLICT (account_id, currency_code) DO NOTHING
     RETURNING *`,
    [accountId, currencyCode]
  );
  return result.rows[0];
};

const getBalanceByCurrency = async (accountId, currencyCode) => {
  const result = await pool.query(
    `SELECT * FROM account_balances WHERE account_id = $1 AND currency_code = $2`,
    [accountId, currencyCode]
  );
  return result.rows[0];
};

const updateBalance = async (accountId, currencyCode, newBalance) => {
  const result = await pool.query(
    `UPDATE account_balances SET balance = $1 WHERE account_id = $2 AND currency_code = $3 RETURNING *`,
    [newBalance, accountId, currencyCode]
  );
  return result.rows[0];
};

const getAllAccountsWithUsers = async () => {
  const result = await pool.query(
    `SELECT a.*, u.full_name, u.email, u.country, u.kyc_status, u.is_admin,
     json_agg(json_build_object('currency_code', ab.currency_code, 'balance', ab.balance) ORDER BY ab.created_at ASC) FILTER (WHERE ab.id IS NOT NULL) AS balances
     FROM accounts a
     JOIN users u ON u.id = a.user_id
     LEFT JOIN account_balances ab ON ab.account_id = a.id
     GROUP BY a.id, u.id
     ORDER BY a.created_at DESC`
  );
  return result.rows;
};

const freezeAccount = async (accountId) => {
  await pool.query(`UPDATE accounts SET is_frozen = TRUE WHERE id = $1`, [accountId]);
};

const unfreezeAccount = async (accountId) => {
  await pool.query(`UPDATE accounts SET is_frozen = FALSE WHERE id = $1`, [accountId]);
};

const creditBalance = async (accountId, currencyCode, amount) => {
  // Upsert — insert 0 balance if currency doesn't exist, then add amount
  await pool.query(
    `INSERT INTO account_balances (account_id, currency_code, balance)
     VALUES ($1, $2, $3)
     ON CONFLICT (account_id, currency_code) DO UPDATE
     SET balance = account_balances.balance + $3`,
    [accountId, currencyCode, amount]
  );
};

const setDefaultCurrency = async (accountId, currencyCode) => {
  await pool.query(`UPDATE accounts SET default_currency = $1 WHERE id = $2`, [currencyCode, accountId]);
};

module.exports = {
  createAccount,
  getAccountByUserId,
  getAccountById,
  addCurrencyBalance,
  getBalanceByCurrency,
  updateBalance,
  getAllAccountsWithUsers,
  freezeAccount,
  unfreezeAccount,
  creditBalance,
  setDefaultCurrency,
};
