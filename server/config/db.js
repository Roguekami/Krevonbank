const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

const connectDB = async () => {
  try {
    // Attempting connection
    const client = await pool.connect();
    console.log('PostgreSQL (Supabase) Database Connected successfully.');
    client.release();
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
    console.log('Since this is Phase 1 with mocked credentials, this error is expected.');
    // We do not exit process here so the server can still start with mocked DB
    // process.exit(1); 
  }
};

module.exports = {
  pool,
  connectDB
};
