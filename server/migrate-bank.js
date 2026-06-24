const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log("Creating bank_deposits table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bank_deposits (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        currency VARCHAR(10) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        sender_name VARCHAR(100) NOT NULL,
        sender_bank VARCHAR(100) NOT NULL,
        reference_code VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Done!");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

migrate();
