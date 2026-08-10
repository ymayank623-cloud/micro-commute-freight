const pool = require('./config/db');

async function main() {
    // Delete assignments referencing these parcels first (foreign key)
    await pool.query("DELETE FROM assignments WHERE parcel_id IN (1, 2, 3)");
    console.log("✅ Deleted assignments for parcels 1, 2, 3");

    // Delete tracking records for these parcels
    await pool.query("DELETE FROM tracking WHERE parcel_id IN (1, 2, 3)");
    console.log("✅ Deleted tracking for parcels 1, 2, 3");

    // Delete the parcels above 40km
    const result = await pool.query("DELETE FROM parcels WHERE id IN (1, 2, 3) RETURNING id, pickup_address, drop_address");
    console.log("✅ Deleted parcels above 40km:");
    console.log(result.rows);

    // Show remaining
    const remaining = await pool.query("SELECT id, pickup_address, drop_address, status FROM parcels ORDER BY id");
    console.log("\n=== REMAINING PARCELS ===");
    console.log(remaining.rows);

    await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
