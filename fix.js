require("dotenv").config({ path: "./backend/.env" });
const pool = require("./backend/config/db");

async function fix() {
    try {
        console.log("Fixing database inconsistencies...");
        
        // Find all assignments where parcel is 'Delivered' but assignment is not 'Completed'
        const res = await pool.query(`
            SELECT a.id as assignment_id, a.driver_id 
            FROM assignments a
            JOIN parcels p ON a.parcel_id = p.id
            WHERE p.status = 'Delivered' AND a.assignment_status != 'Completed'
        `);
        
        console.log(`Found ${res.rows.length} stuck assignments.`);
        
        for (const row of res.rows) {
            console.log(`Fixing assignment ${row.assignment_id} and driver ${row.driver_id}`);
            await pool.query(
                "UPDATE assignments SET assignment_status='Completed', completed_at=CURRENT_TIMESTAMP WHERE id=$1",
                [row.assignment_id]
            );
            await pool.query(
                "UPDATE drivers SET status='Available' WHERE id=$1",
                [row.driver_id]
            );
        }
        
        console.log("Done fixing!");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        pool.end();
    }
}

fix();
