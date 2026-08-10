const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'micro_commute',
    password: 'Mayank8492',
    port: 5432,
});

async function checkTables() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
        console.log(res.rows);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

checkTables();
