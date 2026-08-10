const pool = require("../config/db");

// ===============================
// Driver Status
// ===============================
const getDriverStatus = async (driver_id) => {
    const result = await pool.query(
        "SELECT status FROM drivers WHERE id=$1",
        [driver_id]
    );
    return result.rows[0];
};

// ===============================
// Update Driver Status
// ===============================
const updateDriverStatus = async (driver_id, status) => {
    await pool.query(
        "UPDATE drivers SET status=$1 WHERE id=$2",
        [status, driver_id]
    );
};

// ===============================
// Update Parcel Status
// ===============================
const updateParcelStatus = async (parcel_id, status) => {
    await pool.query(
        "UPDATE parcels SET status=$1 WHERE id=$2",
        [status, parcel_id]
    );
};

// ===============================
// Assign Driver
// ===============================
const assignDriver = async (parcel_id, driver_id) => {
    const result = await pool.query(
        `INSERT INTO assignments
        (parcel_id, driver_id)
        VALUES($1,$2)
        RETURNING *`,
        [parcel_id, driver_id]
    );
    return result.rows[0];
};

// ===============================
// Get All Assignments
// ===============================
const getAllAssignments = async () => {
    const result = await pool.query(`
        SELECT
        a.id,
        a.assignment_status,
        a.assigned_at,
        a.completed_at,
        p.id AS parcel_id,
        p.pickup_address,
        p.drop_address,
        p.status AS parcel_status,
        p.price,
        p.delivery_tier,
        p.weight,
        p.parcel_type,
        p.pickup_lat,
        p.pickup_lng,
        p.drop_lat,
        p.drop_lng,
        p.estimated_time,
        p.contact_name,
        p.contact_phone,
        p.is_pickup_verified,
        d.id AS driver_id,
        d.full_name,
        d.vehicle_number,
        d.status AS driver_status
        FROM assignments a
        JOIN parcels p ON a.parcel_id=p.id
        JOIN drivers d ON a.driver_id=d.id
        ORDER BY a.id DESC
    `);
    return result.rows;
};

// ===============================
// Driver Assignments
// ===============================
const getAssignmentsByDriver = async (driver_id) => {
    const result = await pool.query(`
        SELECT
        a.id,
        a.assignment_status,
        a.assigned_at,
        a.completed_at,
        p.id AS parcel_id,
        p.pickup_address,
        p.drop_address,
        p.status AS parcel_status,
        p.price,
        p.delivery_tier,
        p.weight,
        p.parcel_type,
        p.pickup_lat,
        p.pickup_lng,
        p.drop_lat,
        p.drop_lng,
        p.estimated_time,
        p.contact_name,
        p.contact_phone,
        p.is_pickup_verified,
        d.id AS driver_id,
        d.full_name,
        d.vehicle_number
        FROM assignments a
        JOIN parcels p ON a.parcel_id=p.id
        JOIN drivers d ON a.driver_id=d.id
        WHERE d.id=$1
        ORDER BY a.id DESC
    `, [driver_id]);
    return result.rows;
};

// ===============================
// Complete Delivery
// ===============================
const completeDelivery = async (assignment_id) => {
    const assignment = await pool.query(
        "SELECT * FROM assignments WHERE id=$1",
        [assignment_id]
    );

    if (assignment.rows.length === 0) {
        return null;
    }

    const parcel_id = assignment.rows[0].parcel_id;
    const driver_id = assignment.rows[0].driver_id;

    await pool.query(
        `UPDATE assignments
        SET assignment_status='Completed',
        completed_at=CURRENT_TIMESTAMP
        WHERE id=$1`,
        [assignment_id]
    );

    await pool.query(
        "UPDATE parcels SET status='Delivered' WHERE id=$1",
        [parcel_id]
    );

    await pool.query(
        "UPDATE drivers SET status='Available' WHERE id=$1",
        [driver_id]
    );

    return {
        assignment_id,
        parcel_id,
        driver_id
    };
};

// ===============================
// Assignment History
// ===============================
const getAssignmentHistory = async () => {
    const result = await pool.query(`
        SELECT
        a.id,
        a.assignment_status,
        a.assigned_at,
        a.completed_at,
        p.id AS parcel_id,
        p.pickup_address,
        p.drop_address,
        p.status AS parcel_status,
        d.id AS driver_id,
        d.full_name,
        d.vehicle_number
        FROM assignments a
        JOIN parcels p ON a.parcel_id=p.id
        JOIN drivers d ON a.driver_id=d.id
        ORDER BY a.assigned_at DESC
    `);
    return result.rows;
};

// ===============================
// Dashboard Analytics
// ===============================
const getAnalytics = async () => {
    const result = await pool.query(`
        SELECT
        (SELECT COUNT(*)::int FROM parcels) as total_parcels,
        (SELECT COUNT(*)::int FROM parcels WHERE status='Delivered') as delivered,
        (SELECT COUNT(*)::int FROM parcels WHERE status='Assigned' OR status='In Transit') as assigned,
        (SELECT COUNT(*)::int FROM parcels WHERE status='In Transit') as in_transit,
        (SELECT COUNT(*)::int FROM parcels WHERE status='Pending') as pending,
        (SELECT COUNT(*)::int FROM drivers WHERE status='Available') as available_drivers,
        (SELECT COUNT(*)::int FROM drivers WHERE status='Busy') as busy_drivers
    `);
    return result.rows[0];
};

module.exports = {
    getDriverStatus,
    updateDriverStatus,
    updateParcelStatus,
    assignDriver,
    getAllAssignments,
    getAssignmentsByDriver,
    completeDelivery,
    getAssignmentHistory,
    getAnalytics
};