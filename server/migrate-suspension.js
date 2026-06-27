require('dotenv').config();
const { pool } = require('./config/db');

const migrate = async () => {
  try {
    console.log('Connecting to database...');
    // Create the new is_suspended column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
    `);
    console.log('Successfully added is_suspended column to users table.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
};

migrate();
