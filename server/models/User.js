const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

const createUser = async ({ fullName, email, password, country, verificationToken }) => {
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, country, verification_token)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, full_name, email, country, is_verified, kyc_status, created_at`,
    [fullName, email, passwordHash, country, verificationToken]
  );
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, full_name, email, password_hash, country, phone_number, address, is_verified, kyc_status, is_admin, login_attempts, lock_until, submission_count_today, last_submission_date, reset_password_token, reset_password_expires, created_at FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, full_name, email, country, phone_number, address, is_verified, kyc_status, is_admin, login_attempts, lock_until, submission_count_today, last_submission_date, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

const verifyUserEmail = async (token) => {
  const result = await pool.query(
    `UPDATE users SET is_verified = TRUE, verification_token = NULL
     WHERE verification_token = $1
     RETURNING id, email, full_name`,
    [token]
  );
  return result.rows[0];
};

const incrementLoginAttempts = async (userId) => {
  await pool.query(
    `UPDATE users SET login_attempts = login_attempts + 1 WHERE id = $1`,
    [userId]
  );
};

const lockUserAccount = async (userId) => {
  // Lock for 30 minutes
  await pool.query(
    `UPDATE users SET lock_until = NOW() + INTERVAL '30 minutes', login_attempts = 0 WHERE id = $1`,
    [userId]
  );
};

const resetLoginAttempts = async (userId) => {
  await pool.query(
    `UPDATE users SET login_attempts = 0, lock_until = NULL WHERE id = $1`,
    [userId]
  );
};

const updateKYCStatus = async (userId, status) => {
  await pool.query(
    `UPDATE users SET kyc_status = $1 WHERE id = $2`,
    [status, userId]
  );
};

const incrementTotalRejections = async (userId) => {
  await pool.query(
    `UPDATE users SET total_rejections_count = COALESCE(total_rejections_count, 0) + 1 WHERE id = $1`,
    [userId]
  );
};

const updatePhoneNumber = async (userId, phoneNumber) => {
  await pool.query(
    `UPDATE users SET phone_number = $1 WHERE id = $2`,
    [phoneNumber, userId]
  );
};

const updateAddress = async (userId, address) => {
  await pool.query(
    `UPDATE users SET address = $1 WHERE id = $2`,
    [address, userId]
  );
};

const updateUserPassword = async (userId, newPasswordHash) => {
  await pool.query(
    `UPDATE users SET password_hash = $1 WHERE id = $2`,
    [newPasswordHash, userId]
  );
};

const updateSubmissionCount = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  // Reset count if last submission was on a different day
  const result = await pool.query(
    `SELECT last_submission_date, submission_count_today FROM users WHERE id = $1`,
    [userId]
  );
  const user = result.rows[0];
  const lastDate = user.last_submission_date ? user.last_submission_date.toISOString().split('T')[0] : null;

  if (lastDate !== today) {
    await pool.query(
      `UPDATE users SET submission_count_today = 1, last_submission_date = $1 WHERE id = $2`,
      [today, userId]
    );
  } else {
    await pool.query(
      `UPDATE users SET submission_count_today = submission_count_today + 1 WHERE id = $1`,
      [userId]
    );
  }
};

const saveResetToken = async (userId, token, expires) => {
  await pool.query(
    `UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3`,
    [token, expires, userId]
  );
};

const findUserByResetToken = async (token) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()`,
    [token]
  );
  return result.rows[0];
};

const updatePassword = async (userId, newPasswordHash) => {
  await pool.query(
    `UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2`,
    [newPasswordHash, userId]
  );
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  verifyUserEmail,
  incrementLoginAttempts,
  lockUserAccount,
  resetLoginAttempts,
  updateKYCStatus,
  incrementTotalRejections,
  updatePhoneNumber,
  updateAddress,
  updateUserPassword,
  updateSubmissionCount,
  saveResetToken,
  findUserByResetToken,
  updatePassword,
};
