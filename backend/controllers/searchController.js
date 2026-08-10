const pool = require("../config/db");

const globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === "") {
            return res.status(200).json({ parcels: [], drivers: [] });
        }

        const searchQuery = `%${q}%`;
        const numericQuery = !isNaN(q) ? parseInt(q) : null;

        // Search Parcels
        const parcelResult = await pool.query(
            `SELECT id, pickup_address, drop_address, status 
             FROM parcels 
             WHERE pickup_address ILIKE $1 
             OR drop_address ILIKE $1 
             OR ($2::int IS NOT NULL AND id = $2)
             LIMIT 5`,
            [searchQuery, numericQuery]
        );

        // Search Drivers
        const driverResult = await pool.query(
            `SELECT id, full_name, vehicle_number, status 
             FROM drivers 
             WHERE full_name ILIKE $1 
             OR email ILIKE $1 
             OR phone ILIKE $1 
             OR vehicle_number ILIKE $1 
             LIMIT 5`,
            [searchQuery]
        );

        res.status(200).json({
            parcels: parcelResult.rows,
            drivers: driverResult.rows
        });

    } catch (error) {
        console.error("Global search error:", error);
        res.status(500).json({ message: "Server error during search" });
    }
};

module.exports = {
    globalSearch
};
