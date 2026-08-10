const pool = require("../config/db");
const { getAssignmentsByDriver, completeDelivery } = require("../models/assignmentModel");

// Get driver assignments
const getMyAssignments = async (req, res) => {
    try {
        const driverId = req.user.id;
        const assignments = await getAssignmentsByDriver(driverId);
        res.json(assignments);
    } catch (error) {
        console.error("Error fetching driver assignments:", error);
        res.status(500).json({ error: "Server error fetching assignments." });
    }
};

// Verify Customer Pickup OTP before starting delivery
const verifyPickupOtp = async (req, res) => {
    try {
        const { assignment_id, otp } = req.body;
        const driverId = req.user.id;

        if (!otp || !otp.trim()) {
            return res.status(400).json({ error: "Please enter the 4-digit pickup OTP." });
        }

        // Verify assignment belongs to this driver
        const assignmentRes = await pool.query(
            "SELECT a.*, p.pickup_otp, p.id as parcel_id, p.pickup_address, p.drop_address, p.price FROM assignments a JOIN parcels p ON a.parcel_id = p.id WHERE a.id = $1 AND a.driver_id = $2",
            [assignment_id, driverId]
        );

        if (assignmentRes.rows.length === 0) {
            return res.status(404).json({ error: "Assignment not found or unauthorized." });
        }

        const parcel = assignmentRes.rows[0];

        // Check OTP match
        if (parcel.pickup_otp && parcel.pickup_otp.trim() !== otp.trim()) {
            return res.status(400).json({ 
                error: `Incorrect OTP! Ask the sender for their 4-digit pickup verification code.` 
            });
        }

        // OTP is correct -> mark pickup verified and set to In Transit
        await pool.query("UPDATE parcels SET status = 'In Transit', is_pickup_verified = TRUE WHERE id = $1", [parcel.parcel_id]);
        await pool.query("UPDATE assignments SET assignment_status = 'In Transit' WHERE id = $1", [assignment_id]);
        await pool.query("UPDATE drivers SET status = 'Busy' WHERE id = $1", [driverId]);

        // Add tracking event
        await pool.query(
            "INSERT INTO tracking (parcel_id, status, location, remarks) VALUES ($1, $2, $3, $4)",
            [
                parcel.parcel_id,
                "Parcel Picked Up — In Transit",
                parcel.pickup_address,
                `Security OTP (${otp.trim()}) verified with sender. Driver started transit to destination.`
            ]
        );

        res.json({
            success: true,
            message: "OTP Verified successfully! Pickup confirmed, delivery in transit.",
            parcel_id: parcel.parcel_id
        });

    } catch (error) {
        console.error("Error verifying pickup OTP:", error);
        res.status(500).json({ error: "Server error verifying OTP." });
    }
};

// Update Driver Live GPS Location
const updateLiveLocation = async (req, res) => {
    try {
        const { assignment_id, lat, lng } = req.body;
        const driverId = req.user.id;

        if (!lat || !lng) {
            return res.status(400).json({ error: "Coordinates required" });
        }

        // Update driver's active parcels coordinates
        const assignmentRes = await pool.query(
            "SELECT parcel_id FROM assignments WHERE id = $1 AND driver_id = $2",
            [assignment_id, driverId]
        );

        if (assignmentRes.rows.length > 0) {
            const parcelId = assignmentRes.rows[0].parcel_id;
            await pool.query("UPDATE parcels SET driver_lat = $1, driver_lng = $2 WHERE id = $3", [lat, lng, parcelId]);
        }

        res.json({ success: true, message: "Location updated" });
    } catch (error) {
        console.error("Error updating live location:", error);
        res.status(500).json({ error: "Server error updating location" });
    }
};

// Update status
const updateAssignmentStatus = async (req, res) => {
    try {
        const { assignment_id, status } = req.body;
        const driverId = req.user.id;

        // Verify assignment belongs to this driver
        const assignment = await pool.query("SELECT * FROM assignments WHERE id = $1 AND driver_id = $2", [assignment_id, driverId]);
        
        if (assignment.rows.length === 0) {
            return res.status(403).json({ error: "Unauthorized or invalid assignment." });
        }

        const parcel_id = assignment.rows[0].parcel_id;

        if (status === "In Transit") {
            await pool.query("UPDATE assignments SET assignment_status = 'In Transit' WHERE id = $1", [assignment_id]);
            await pool.query("UPDATE parcels SET status = 'In Transit' WHERE id = $1", [parcel_id]);
            await pool.query("UPDATE drivers SET status = 'Busy' WHERE id = $1", [driverId]);
            res.json({ message: "Status updated to In Transit." });
        } else if (status === "Delivered") {
            await completeDelivery(assignment_id);
            res.json({ message: "Status updated to Delivered." });
        } else {
            return res.status(400).json({ error: "Invalid status." });
        }

    } catch (error) {
        console.error("Error updating assignment status:", error);
        res.status(500).json({ error: "Server error updating status." });
    }
};

// Get Available Requests
const getAvailableRequests = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM parcels WHERE status = 'Pending' ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching available requests:", error);
        res.status(500).json({ error: "Server error fetching requests." });
    }
};

// Accept a Request
const acceptRequest = async (req, res) => {
    try {
        const { parcel_id } = req.body;
        const driverId = req.user.id;

        // Check if parcel is still pending
        const parcelCheck = await pool.query("SELECT status FROM parcels WHERE id = $1 FOR UPDATE", [parcel_id]);
        if (parcelCheck.rows.length === 0) {
            return res.status(404).json({ error: "Parcel not found." });
        }
        if (parcelCheck.rows[0].status !== 'Pending') {
            return res.status(400).json({ error: "Parcel has already been assigned or is no longer available." });
        }

        // Create assignment
        await pool.query(
            "INSERT INTO assignments (parcel_id, driver_id, assignment_status) VALUES ($1, $2, 'Assigned')",
            [parcel_id, driverId]
        );

        // Update parcel status
        await pool.query("UPDATE parcels SET status = 'Assigned' WHERE id = $1", [parcel_id]);

        // Update driver status
        await pool.query("UPDATE drivers SET status = 'Busy' WHERE id = $1", [driverId]);

        res.json({ message: "Successfully assigned!" });
    } catch (error) {
        console.error("Error accepting request:", error);
        res.status(500).json({ error: "Server error accepting request." });
    }
};

// Toggle Online/Offline Status
const toggleStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'Available' or 'Offline'
        const driverId = req.user.id;
        
        if (!['Available', 'Offline'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        await pool.query("UPDATE drivers SET status = $1 WHERE id = $2", [status, driverId]);
        res.json({ message: `Status updated to ${status}` });
    } catch (error) {
        console.error("Error toggling status:", error);
        res.status(500).json({ error: "Server error toggling status." });
    }
};

// Get Driver Stats with Actual Indian Rupee (₹) Earnings & Status
const getDriverStats = async (req, res) => {
    try {
        const driverId = req.user.id;
        
        // Fetch current driver status from DB
        const driverRes = await pool.query("SELECT status FROM drivers WHERE id = $1", [driverId]);
        const currentStatus = driverRes.rows[0]?.status || 'Available';

        // Count today's completed assignments and sum exact parcel prices for this driver
        const result = await pool.query(`
            SELECT 
                COUNT(*) as trips,
                COALESCE(SUM(p.price), 0) as total_earnings
            FROM assignments a
            JOIN parcels p ON a.parcel_id = p.id
            WHERE a.driver_id = $1 
              AND a.assignment_status = 'Completed' 
              AND a.completed_at::date = CURRENT_DATE
        `, [driverId]);

        const trips = parseInt(result.rows[0]?.trips || 0, 10);
        const earnings = parseFloat(result.rows[0]?.total_earnings || 0).toFixed(2);

        res.json({ trips, earnings, status: currentStatus });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Server error fetching stats." });
    }
};

module.exports = {
    getMyAssignments,
    verifyPickupOtp,
    updateLiveLocation,
    updateAssignmentStatus,
    getAvailableRequests,
    acceptRequest,
    toggleStatus,
    getDriverStats
};
