const { pool } = require('../config/db');

const createBeneficiary = async ({ userId, fullName, bankName, accountNumber, swiftIban, currencyCode }) => {
  const result = await pool.query(
    `INSERT INTO beneficiaries (user_id, full_name, bank_name, account_number, swift_iban, currency_code)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, fullName, bankName, accountNumber, swiftIban, currencyCode]
  );
  return result.rows[0];
};

const getBeneficiariesByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM beneficiaries WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

const deleteBeneficiary = async (id, userId) => {
  const result = await pool.query(
    `DELETE FROM beneficiaries WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return result.rows[0];
};

module.exports = { createBeneficiary, getBeneficiariesByUserId, deleteBeneficiary };
