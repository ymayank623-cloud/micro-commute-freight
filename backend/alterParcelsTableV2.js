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
      ADD COLUMN IF NOT EXISTS drop_lat DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS drop_lng DECIMAL(11, 8),
      ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0.00
    `);
    console.log("Table 'parcels' altered successfully.");
  } catch (err) {
    console.error("Error altering table:", err);
  } finally {
    await pool.end();
  }
}

alterTable();
