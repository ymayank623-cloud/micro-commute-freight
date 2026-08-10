const pool = require("../config/db");

// ===============================
// Add Tracking Event
// ===============================
const addTracking = async (
    parcel_id,
    status,
    location,
    remarks
) => {

    const result = await pool.query(
        `INSERT INTO tracking
        (parcel_id, status, location, remarks)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [
            parcel_id,
            status,
            location,
            remarks
        ]
    );

    return result.rows[0];
};


// ===============================
// Get Tracking History
// ===============================
const getTrackingHistory = async (parcel_id) => {

    const result = await pool.query(
        `
        SELECT
            id,
            parcel_id,
            status,
            location,
            remarks,
            created_at

        FROM tracking

        WHERE parcel_id = $1

        ORDER BY created_at ASC
        `,
        [parcel_id]
    );

    return result.rows;

};


// ===============================
// Get Latest Tracking Status
// ===============================
const getLatestTracking = async (parcel_id) => {

    const result = await pool.query(
        `
        SELECT
            id,
            parcel_id,
            status,
            location,
            remarks,
            created_at

        FROM tracking

        WHERE parcel_id = $1

        ORDER BY created_at DESC

        LIMIT 1
        `,
        [parcel_id]
    );

    return result.rows[0];

};


module.exports = {

    addTracking,
    getTrackingHistory,
    getLatestTracking

};