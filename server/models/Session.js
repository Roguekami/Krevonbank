const { pool } = require('../config/db');

const createSession = async ({ userId, jti, device, ipAddress, location }) => {
  await pool.query(
    `INSERT INTO user_sessions (user_id, jwt_jti, device, ip_address, location)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, jti, device, ipAddress, location]
  );
};

const getActiveSessionsByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM user_sessions WHERE user_id = $1 AND is_active = TRUE ORDER BY last_active DESC`,
    [userId]
  );
  return result.rows;
};

const getSessionByJti = async (jti) => {
  const result = await pool.query(
    `SELECT * FROM user_sessions WHERE jwt_jti = $1 AND is_active = TRUE`,
    [jti]
  );
  return result.rows[0];
};

const deactivateSession = async (sessionId) => {
  await pool.query(
    `UPDATE user_sessions SET is_active = FALSE WHERE id = $1`,
    [sessionId]
  );
};

const deactivateAllSessionsExcept = async (userId, currentJti) => {
  await pool.query(
    `UPDATE user_sessions SET is_active = FALSE WHERE user_id = $1 AND jwt_jti != $2`,
    [userId, currentJti]
  );
};

const updateSessionActivity = async (jti) => {
  await pool.query(
    `UPDATE user_sessions SET last_active = NOW() WHERE jwt_jti = $1 AND is_active = TRUE`,
    [jti]
  );
};

const deactivateSessionByJti = async (jti) => {
  await pool.query(
    `UPDATE user_sessions SET is_active = FALSE WHERE jwt_jti = $1`,
    [jti]
  );
};

module.exports = {
  createSession,
  getActiveSessionsByUserId,
  getSessionByJti,
  deactivateSession,
  deactivateAllSessionsExcept,
  updateSessionActivity,
  deactivateSessionByJti,
};
