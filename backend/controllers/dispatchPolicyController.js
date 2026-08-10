const pool = require("../config/db");

// Get Active Dispatch Policies
const getDispatchPolicies = async (req, res) => {
    try {
        let result = await pool.query("SELECT * FROM dispatch_policies ORDER BY id ASC LIMIT 1");
        if (result.rows.length === 0) {
            // Insert default if missing
            await pool.query(`
                INSERT INTO dispatch_policies (
                    route_match_min_overlap,
                    max_commuter_detour_km,
                    commuter_discount_percent,
                    commuter_driver_commission,
                    direct_priority_surge,
                    direct_driver_commission,
                    platform_commission,
                    cancellation_fee,
                    cancellation_grace_mins,
                    max_parcel_weight_kg,
                    max_corridor_radius_km,
                    estimated_delivery_buffer_mins,
                    driver_assignment_mode,
                    require_otp_verification
                ) VALUES (70, 2.5, 30, 85, 1.4, 80, 15, 40.0, 3, 15.0, 40.0, 8, 'hybrid_smart_match', true);
            `);
            result = await pool.query("SELECT * FROM dispatch_policies ORDER BY id ASC LIMIT 1");
        }

        res.json({ success: true, policies: result.rows[0] });
    } catch (error) {
        console.error("Error getting dispatch policies:", error);
        res.status(500).json({ error: "Failed to fetch dispatch policies" });
    }
};

// Update Dispatch Policies
const updateDispatchPolicies = async (req, res) => {
    try {
        const {
            route_match_min_overlap,
            max_commuter_detour_km,
            commuter_discount_percent,
            commuter_driver_commission,
            direct_priority_surge,
            direct_driver_commission,
            platform_commission,
            cancellation_fee,
            cancellation_grace_mins,
            max_parcel_weight_kg,
            max_corridor_radius_km,
            estimated_delivery_buffer_mins,
            driver_assignment_mode,
            require_otp_verification
        } = req.body;

        const result = await pool.query(`
            UPDATE dispatch_policies SET
                route_match_min_overlap = COALESCE($1, route_match_min_overlap),
                max_commuter_detour_km = COALESCE($2, max_commuter_detour_km),
                commuter_discount_percent = COALESCE($3, commuter_discount_percent),
                commuter_driver_commission = COALESCE($4, commuter_driver_commission),
                direct_priority_surge = COALESCE($5, direct_priority_surge),
                direct_driver_commission = COALESCE($6, direct_driver_commission),
                platform_commission = COALESCE($7, platform_commission),
                cancellation_fee = COALESCE($8, cancellation_fee),
                cancellation_grace_mins = COALESCE($9, cancellation_grace_mins),
                max_parcel_weight_kg = COALESCE($10, max_parcel_weight_kg),
                max_corridor_radius_km = COALESCE($11, max_corridor_radius_km),
                estimated_delivery_buffer_mins = COALESCE($12, estimated_delivery_buffer_mins),
                driver_assignment_mode = COALESCE($13, driver_assignment_mode),
                require_otp_verification = COALESCE($14, require_otp_verification),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = (SELECT id FROM dispatch_policies ORDER BY id ASC LIMIT 1)
            RETURNING *;
        `, [
            route_match_min_overlap,
            max_commuter_detour_km,
            commuter_discount_percent,
            commuter_driver_commission,
            direct_priority_surge,
            direct_driver_commission,
            platform_commission,
            cancellation_fee,
            cancellation_grace_mins,
            max_parcel_weight_kg,
            max_corridor_radius_km,
            estimated_delivery_buffer_mins,
            driver_assignment_mode,
            require_otp_verification
        ]);

        res.json({
            success: true,
            message: "Dispatch rules and policies updated successfully!",
            policies: result.rows[0]
        });
    } catch (error) {
        console.error("Error updating dispatch policies:", error);
        res.status(500).json({ error: "Failed to update dispatch policies" });
    }
};

// Get All Disputes
const getDisputes = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM disputes ORDER BY created_at DESC");
        res.json({ success: true, disputes: result.rows });
    } catch (error) {
        console.error("Error fetching disputes:", error);
        res.status(500).json({ error: "Failed to fetch disputes" });
    }
};

// Resolve Dispute
const resolveDispute = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution_notes } = req.body;

        const result = await pool.query(`
            UPDATE disputes SET
                status = $1,
                resolution_notes = $2,
                resolved_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *;
        `, [status || "Resolved", resolution_notes || "Admin resolution applied", id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Dispute ticket not found" });
        }

        res.json({
            success: true,
            message: "Dispute resolved successfully!",
            dispute: result.rows[0]
        });
    } catch (error) {
        console.error("Error resolving dispute:", error);
        res.status(500).json({ error: "Failed to resolve dispute" });
    }
};

module.exports = {
    getDispatchPolicies,
    updateDispatchPolicies,
    getDisputes,
    resolveDispute
};
