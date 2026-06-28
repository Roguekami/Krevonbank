require('dotenv').config();
const { pool } = require('./config/db');

const migrate = async () => {
  try {
    console.log('Connecting to database to revert cards status to requested...');
    
    // Update any existing 'pending' back to 'requested'
    await pool.query(`UPDATE cards SET status = 'requested' WHERE status = 'pending';`);
    
    console.log('Successfully reverted pending cards to requested.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
};

migrate();
