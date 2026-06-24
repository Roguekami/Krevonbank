require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
  try {
    console.log('Creating admin_audit_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        target_id UUID,
        target_table VARCHAR(100),
        old_value JSONB,
        new_value JSONB,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('admin_audit_logs table created successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
