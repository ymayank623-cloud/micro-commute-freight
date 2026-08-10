const pool = require("../config/db");

// Get All City Managers with optional zone / query search + real system KPIs
const getAllCityManagers = async (req, res) => {
    try {
        const { zone, search } = req.query;
        let query = "SELECT * FROM city_managers";
        const params = [];

        const conditions = [];
        if (zone && zone !== "All Zones") {
            params.push(zone);
            conditions.push(`zone = $${params.length}`);
        }

        if (search && search.trim()) {
            params.push(`%${search.trim()}%`);
            conditions.push(`(full_name ILIKE $${params.length} OR city ILIKE $${params.length} OR hub_name ILIKE $${params.length} OR employee_id ILIKE $${params.length})`);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY id ASC";

        const result = await pool.query(query, params);

        // Fetch real database KPIs
        const driversRes = await pool.query("SELECT COUNT(*) FROM drivers");
        const parcelsRes = await pool.query("SELECT COUNT(*) FROM parcels");
        const activeParcelsRes = await pool.query("SELECT COUNT(*) FROM parcels WHERE status IN ('Pending', 'In Transit')");

        res.json({
            managers: result.rows,
            kpis: {
                totalHubs: result.rows.length,
                totalDrivers: parseInt(driversRes.rows[0]?.count || 0, 10),
                totalParcels: parseInt(parcelsRes.rows[0]?.count || 0, 10),
                activeParcels: parseInt(activeParcelsRes.rows[0]?.count || 0, 10)
            }
        });
    } catch (error) {
        console.error("Error fetching city managers:", error);
        res.status(500).json({ error: "Server error fetching city managers" });
    }
};

// Add New City Manager
const addCityManager = async (req, res) => {
    try {
        const {
            full_name,
            email,
            phone,
            city,
            state,
            hub_name,
            zone,
            corridor_radius_km,
            active_drivers_count,
            employee_id
        } = req.body;

        if (!full_name || !email || !phone || !city || !state || !hub_name || !zone || !employee_id) {
            return res.status(400).json({ error: "All required fields must be provided" });
        }

        const result = await pool.query(`
            INSERT INTO city_managers 
            (full_name, email, phone, city, state, hub_name, zone, corridor_radius_km, active_drivers_count, employee_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            full_name,
            email,
            phone,
            city,
            state,
            hub_name,
            zone,
            corridor_radius_km || 80,
            active_drivers_count || 10,
            employee_id
        ]);

        res.status(201).json({
            message: "City Hub Manager assigned successfully",
            manager: result.rows[0]
        });
    } catch (error) {
        console.error("Error adding city manager:", error);
        res.status(500).json({ error: error.message || "Server error adding city manager" });
    }
};

// Update City Manager
const updateCityManager = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, phone, city, state, hub_name, zone, corridor_radius_km, status } = req.body;

        const result = await pool.query(`
            UPDATE city_managers 
            SET full_name = COALESCE($1, full_name),
                email = COALESCE($2, email),
                phone = COALESCE($3, phone),
                city = COALESCE($4, city),
                state = COALESCE($5, state),
                hub_name = COALESCE($6, hub_name),
                zone = COALESCE($7, zone),
                corridor_radius_km = COALESCE($8, corridor_radius_km),
                status = COALESCE($9, status)
            WHERE id = $10
            RETURNING *
        `, [full_name, email, phone, city, state, hub_name, zone, corridor_radius_km, status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "City manager not found" });
        }

        res.json({ message: "City manager updated successfully", manager: result.rows[0] });
    } catch (error) {
        console.error("Error updating city manager:", error);
        res.status(500).json({ error: "Server error updating city manager" });
    }
};

// Delete City Manager
const deleteCityManager = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM city_managers WHERE id = $1", [id]);
        res.json({ message: "City manager removed successfully" });
    } catch (error) {
        console.error("Error deleting city manager:", error);
        res.status(500).json({ error: "Server error deleting city manager" });
    }
};

module.exports = {
    getAllCityManagers,
    addCityManager,
    updateCityManager,
    deleteCityManager
};
