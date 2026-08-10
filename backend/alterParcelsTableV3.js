const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/MicroCommuteFreightNetwork/backend/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function alterTable() {
  try {
    await pool.query(`
      ALTER TABLE parcels
      ADD COLUMN IF NOT EXISTS estimated_time VARCHAR(50) DEFAULT 'N/A'
    `);
    console.log("Table 'parcels' altered successfully. Added estimated_time.");
  } catch (err) {
    console.error("Error altering table:", err);
  } finally {
    await pool.end();
  }
}

alterTable();
