require("dotenv").config();
const pool = require("./config/db");

async function fix() {
    try {
        await pool.query("UPDATE drivers SET status='Available' WHERE id NOT IN (SELECT driver_id FROM assignments WHERE assignment_status != 'Completed')");
        console.log("Reset drivers to Available!");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

fix();
