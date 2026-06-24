const { pool } = require('../config/db');

const createKYCSubmission = async ({ userId, tier1DocType, tier1DocUrl, tier2DocType, tier2DocUrl }) => {
  // If there is an existing pending/rejected submission, update it; otherwise insert new
  const existing = await pool.query(
    `SELECT id FROM kyc_submissions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (existing.rows.length > 0) {
    const result = await pool.query(
      `UPDATE kyc_submissions
       SET tier1_doc_type = $1, tier1_doc_url = $2, tier2_doc_type = $3, tier2_doc_url = $4,
           status = 'pending', rejection_reason = NULL, created_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [tier1DocType, tier1DocUrl, tier2DocType, tier2DocUrl, existing.rows[0].id]
    );
    return result.rows[0];
  } else {
    const result = await pool.query(
      `INSERT INTO kyc_submissions (user_id, tier1_doc_type, tier1_doc_url, tier2_doc_type, tier2_doc_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, tier1DocType, tier1DocUrl, tier2DocType, tier2DocUrl]
    );
    return result.rows[0];
  }
};

const getKYCByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM kyc_submissions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return result.rows[0];
};

const getAllPendingKYC = async () => {
  const result = await pool.query(
    `SELECT ks.*, u.full_name, u.email, u.country
     FROM kyc_submissions ks
     JOIN users u ON ks.user_id = u.id
     WHERE ks.status = 'pending'
     ORDER BY ks.created_at ASC`
  );
  return result.rows;
};

const approveKYC = async (submissionId) => {
  const result = await pool.query(
    `UPDATE kyc_submissions SET status = 'approved' WHERE id = $1 RETURNING *`,
    [submissionId]
  );
  return result.rows[0];
};

const rejectKYC = async (submissionId, reason) => {
  const result = await pool.query(
    `UPDATE kyc_submissions SET status = 'rejected', rejection_reason = $1 WHERE id = $2 RETURNING *`,
    [reason, submissionId]
  );
  return result.rows[0];
};

module.exports = {
  createKYCSubmission,
  getKYCByUserId,
  getAllPendingKYC,
  approveKYC,
  rejectKYC,
};
