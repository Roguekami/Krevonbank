const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  try {
    console.log("Creating cards table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
        cardholder_name VARCHAR(100) NOT NULL,
        card_number_masked VARCHAR(20) NOT NULL,
        expiry_date VARCHAR(5) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('virtual', 'physical')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'frozen')),
        spending_limit DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Creating funding_requests table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS funding_requests (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        crypto_type VARCHAR(20) NOT NULL,
        network VARCHAR(50) NOT NULL,
        transaction_hash VARCHAR(200) NOT NULL,
        amount_sent DECIMAL(20, 8) NOT NULL,
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

setup();
