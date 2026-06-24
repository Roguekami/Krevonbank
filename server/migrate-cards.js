// Run from: C:\Users\USER\Documents\International Banking\server
require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
  const queries = [
    `ALTER TABLE cards ADD COLUMN IF NOT EXISTS delivery_name TEXT`,
    `ALTER TABLE cards ADD COLUMN IF NOT EXISTS delivery_address TEXT`,
    `ALTER TABLE cards ADD COLUMN IF NOT EXISTS delivery_city TEXT`,
    `ALTER TABLE cards ADD COLUMN IF NOT EXISTS delivery_country TEXT`,
    `ALTER TABLE cards ADD COLUMN IF NOT EXISTS delivery_postal TEXT`,
    `ALTER TABLE cards ADD COLUMN IF NOT EXISTS delivery_phone TEXT`,
    `ALTER TABLE cards ADD COLUMN IF NOT EXISTS tracking_number TEXT`,
  ];

  for (const q of queries) {
    try {
      await pool.query(q);
      console.log('OK:', q.substring(0, 70));
    } catch (e) {
      console.error('FAIL:', e.message);
    }
  }
  console.log('Migration complete.');
  process.exit(0);
}

migrate();
