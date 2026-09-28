const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'micro_commute',
    password: 'Mayank8492',
    port: 5432,
});

async function updateAdmin() {
    try {
        const res = await pool.query("UPDATE users SET role = 'admin' WHERE email = 'mayank@1122.flowlink' RETURNING *;");
        console.log("Update successful. Affected rows:", res.rowCount);
        if (res.rowCount > 0) {
            console.log("Updated user:", res.rows[0]);
        } else {
            console.log("User not found!");
        }
    } catch (err) {
        console.error("Error updating user:", err);
    } finally {
        pool.end();
    }
}

updateAdmin();
