const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function resetPassword() {
  const email = 'ymayank623@gmail.com';
  const newPassword = 'Mayank@8492';
  
  const hash = await bcrypt.hash(newPassword, 10);
  const result = await pool.query(
    'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email, role',
    [hash, email]
  );
  
  if (result.rows.length === 0) {
    console.log('❌ User not found:', email);
  } else {
    console.log('✅ Password reset successfully for:', result.rows[0].email, '| Role:', result.rows[0].role);
  }
  
  await pool.end();
}

resetPassword().catch(console.error);
