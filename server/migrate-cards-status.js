require('dotenv').config();
const { pool } = require('./config/db');

const migrate = async () => {
  try {
    console.log('Connecting to database to fix cards status constraint...');
    // Drop the check constraint on status
    await pool.query(`ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_status_check;`);
    
    // Update any existing 'requested' to 'pending'
    await pool.query(`UPDATE cards SET status = 'pending' WHERE status = 'requested';`);
    
    console.log('Successfully updated cards table constraints and data.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
};

migrate();
