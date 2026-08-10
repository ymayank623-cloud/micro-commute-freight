const pool = require("../config/db");

const getDashboardStats = async (req, res) => {
    try {
        const parcels = await pool.query(
            "SELECT COUNT(*) FROM parcels"
        );

        const drivers = await pool.query(
            "SELECT COUNT(*) FROM drivers"
        );

        const assignments = await pool.query(
            "SELECT COUNT(*) FROM assignments"
        );

        const delivered = await pool.query(
            "SELECT COUNT(*) FROM parcels WHERE status='Delivered'"
        );

        const pending = await pool.query(
            "SELECT COUNT(*) FROM parcels WHERE status='Pending'"
        );

        res.json({
            totalParcels: Number(parcels.rows[0].count),
            totalDrivers: Number(drivers.rows[0].count),
            totalAssignments: Number(assignments.rows[0].count),
            delivered: Number(delivered.rows[0].count),
            pending: Number(pending.rows[0].count),
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
};

module.exports = {
    getDashboardStats
};