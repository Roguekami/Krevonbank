require('dotenv').config();
const { pool } = require('./config/db');
const { deleteCard } = require('./models/Card');

async function testDelete() {
  try {
    const res = await pool.query(`SELECT * FROM cards WHERE type = 'virtual' LIMIT 1`);
    if (res.rows.length === 0) {
      console.log('No virtual card found to test delete.');
      return;
    }
    const card = res.rows[0];
    console.log('Attempting to delete card:', card.id, 'for user:', card.user_id);
    
    const deleted = await deleteCard(card.id, card.user_id);
    console.log('Deleted result:', deleted);
  } catch (err) {
    console.error('Error deleting:', err);
  } finally {
    process.exit(0);
  }
}

testDelete();
