const { pool } = require('../config/db');

const createAuditLog = async ({ adminId, action, targetId, targetTable, oldValue, newValue, details }) => {
  const result = await pool.query(
    `INSERT INTO admin_audit_logs (admin_id, action, target_id, target_table, old_value, new_value, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [adminId, action, targetId || null, targetTable || null, oldValue || null, newValue || null, details || null]
  );
  return result.rows[0];
};

const getAuditLogs = async (filters = {}) => {
  let query = `
    SELECT al.*, u.full_name AS admin_name, u.email AS admin_email
    FROM admin_audit_logs al
    LEFT JOIN users u ON u.id = al.admin_id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  if (filters.adminId) {
    query += ` AND al.admin_id = $${idx++}`;
    params.push(filters.adminId);
  }
  if (filters.action) {
    query += ` AND al.action = $${idx++}`;
    params.push(filters.action);
  }
  if (filters.targetTable) {
    query += ` AND al.target_table = $${idx++}`;
    params.push(filters.targetTable);
  }

  query += ` ORDER BY al.created_at DESC`;
  if (filters.limit) {
    query += ` LIMIT $${idx++}`;
    params.push(filters.limit);
  }

  const result = await pool.query(query, params);
  return result.rows;
};

module.exports = { createAuditLog, getAuditLogs };
