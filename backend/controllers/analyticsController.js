const pool = require("../config/db");

const getAnalyticsData = async (req, res) => {
    try {
        const { filter } = req.query;
        let dateCondition = "";
        let dateConditionAnd = "";

        if (filter === "today") {
            dateCondition = "WHERE created_at >= CURRENT_DATE";
            dateConditionAnd = "AND created_at >= CURRENT_DATE";
        } else if (filter === "this_week") {
            dateCondition = "WHERE created_at >= date_trunc('week', CURRENT_DATE)";
            dateConditionAnd = "AND created_at >= date_trunc('week', CURRENT_DATE)";
        } else if (filter === "last_week") {
            dateCondition = "WHERE created_at >= date_trunc('week', CURRENT_DATE - interval '1 week') AND created_at < date_trunc('week', CURRENT_DATE)";
            dateConditionAnd = "AND created_at >= date_trunc('week', CURRENT_DATE - interval '1 week') AND created_at < date_trunc('week', CURRENT_DATE)";
        } else if (filter === "this_month") {
            dateCondition = "WHERE created_at >= date_trunc('month', CURRENT_DATE)";
            dateConditionAnd = "AND created_at >= date_trunc('month', CURRENT_DATE)";
        }

        const statsQuery = await pool.query(`
            SELECT
                (SELECT COUNT(*)::int FROM parcels ${dateCondition}) as total_parcels,
                (SELECT COUNT(*)::int FROM parcels WHERE status='Delivered' ${dateConditionAnd}) as delivered_parcels,
                (SELECT COUNT(*)::int FROM parcels WHERE status='Pending' ${dateConditionAnd}) as pending_parcels,
                (SELECT COUNT(*)::int FROM parcels WHERE status='Assigned' OR status='In Transit' ${dateConditionAnd}) as assigned_parcels,
                (SELECT COUNT(*)::int FROM drivers) as total_drivers,
                (SELECT COUNT(*)::int FROM drivers WHERE status='Available') as available_drivers,
                (SELECT COUNT(*)::int FROM drivers WHERE status='Busy') as busy_drivers,
                (SELECT COUNT(*)::int FROM assignments ${dateCondition}) as total_assignments
        `);

        const typeQuery = await pool.query(`
            SELECT COALESCE(parcel_type, 'Standard') as name, COUNT(*)::int as value
            FROM parcels
            ${dateCondition}
            GROUP BY parcel_type
        `);

        const statusQuery = await pool.query(`
            SELECT status as name, COUNT(*)::int as value
            FROM parcels
            ${dateCondition}
            GROUP BY status
        `);

        res.json({
            stats: statsQuery.rows[0],
            types: typeQuery.rows,
            statuses: statusQuery.rows
        });
    } catch (error) {
        console.error("Analytics Controller Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getAnalyticsData };
