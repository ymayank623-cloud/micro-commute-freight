const pool = require('./config/db');

async function checkUsers() {
    try {
        const result = await pool.query('SELECT id, full_name, email, role FROM users;');
        console.table(result.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
checkUsers();
