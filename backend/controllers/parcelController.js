const {
    createParcel,
    getAllParcels,
    getParcelById,
    updateParcel,
    updateParcelStatus,
    deleteParcel
} = require("../models/parcelModel");

const { addTracking } = require("../models/trackingModel");
const { notifyAdmins } = require("./notificationController");
const pool = require("../config/db");

// Haversine distance in KM
function getDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// =========================================================================
// SMART DUAL PRICING CALCULATION HELPER
// =========================================================================
async function calculateDualQuote(distKm, weight, senderId) {
    const wt = Math.max(0.5, parseFloat(weight || 1));

    // Weight fee: ₹6 per every 0.5 kg slab
    const weightSlabs = Math.max(1, Math.ceil(wt / 0.5));
    const weightFee = weightSlabs * 6.00;

    // 1. Calculate Saver / Shared Route Pricing:
    const saverMinBase = 28.00;
    const saverWeightFee = weightFee;
    const saverExtraDistKm = Math.max(0, distKm - 2.0);
    const saverDistanceFee = saverExtraDistKm * 4.00;
    const saverEstimatedMins = Math.max(10, Math.round((distKm / 28) * 60) + 6);
    const saverSubtotal = saverMinBase + saverWeightFee + saverDistanceFee;

    // 2. Calculate Priority Direct Pricing:
    const priorityMinBase = 38.00;
    const priorityWeightFee = weightFee;
    const priorityExtraDistKm = Math.max(0, distKm - 2.0);
    const priorityDistanceFee = priorityExtraDistKm * 6.00;
    const priorityEstimatedMins = Math.max(6, Math.round((distKm / 35) * 60));
    const prioritySubtotal = priorityMinBase + priorityWeightFee + priorityDistanceFee;

    // 3. Surge multiplier check
    let surgeMultiplier = 1.0;
    try {
        const demandRes = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM parcels WHERE status='Pending') as pending_count,
                (SELECT COUNT(*) FROM drivers WHERE status='Available') as free_drivers
        `);
        const pending = parseInt(demandRes.rows[0]?.pending_count || 0, 10);
        const freeDrivers = parseInt(demandRes.rows[0]?.free_drivers || 0, 10);
        if (freeDrivers === 0 && pending > 0) surgeMultiplier = 1.25;
        else if (pending > freeDrivers * 2) surgeMultiplier = 1.15;
    } catch (e) {
        surgeMultiplier = 1.0;
    }

    // 4. Personalization loyalty discount
    let personalization = 1.0;
    if (senderId) {
        try {
            const userHistory = await pool.query(
                "SELECT COUNT(*) as completed_count FROM parcels WHERE sender_id = $1 AND status='Delivered'",
                [senderId]
            );
            const trips = parseInt(userHistory.rows[0]?.completed_count || 0, 10);
            if (trips >= 5) personalization = 0.90;
            else if (trips >= 2) personalization = 0.95;
        } catch (e) {
            personalization = 1.0;
        }
    }

    const saverFinal = Math.round(saverSubtotal * surgeMultiplier * personalization);
    const priorityFinal = Math.round(prioritySubtotal * surgeMultiplier * personalization);
    const savings = Math.max(30, priorityFinal - saverFinal);

    return {
        distanceKm: distKm.toFixed(1),
        saver: {
            tier: 'saver',
            title: 'Shared Route',
            badge: 'Best Value',
            badgeClass: 'saver',
            price: saverFinal.toFixed(2),
            originalPrice: (saverFinal + savings).toFixed(2),
            savingsAmount: savings.toFixed(2),
            savingsTag: `SAVE ₹${savings}`,
            estimated_time: `${saverEstimatedMins - 10}–${saverEstimatedMins + 10} min`,
            pickupTimeline: 'Delivered after driver completes current drop-off',
            explanation: `Save ₹${savings} because your parcel shares a commuter driver's existing route. Delivered after driver's current delivery.`
        },
        priority: {
            tier: 'priority',
            title: 'Priority Direct',
            badge: 'Fastest',
            badgeClass: 'priority',
            price: priorityFinal.toFixed(2),
            savingsAmount: '0.00',
            savingsTag: 'FASTEST',
            estimated_time: `${priorityEstimatedMins - 5}–${priorityEstimatedMins + 5} min`,
            pickupTimeline: 'Driver comes directly to you immediately',
            explanation: `Pay ₹${savings} more for direct pickup and priority delivery with zero intermediate stops.`
        }
    };
}

// =====================================
// Get Pricing Quote Endpoint (POST /api/parcels/quote)
// =====================================
const getPricingQuote = async (req, res) => {
    try {
        const { pickup_lat, pickup_lng, drop_lat, drop_lng, weight } = req.body;
        const senderId = req.user ? req.user.id : null;

        if (!pickup_lat || !pickup_lng || !drop_lat || !drop_lng) {
            return res.status(400).json({ message: "Coordinates required for quote" });
        }

        const distKm = getDistance(pickup_lat, pickup_lng, drop_lat, drop_lng);
        if (distKm > 80) {
            return res.status(400).json({ message: "Distance exceeds maximum 80 km radius limit" });
        }

        const quote = await calculateDualQuote(distKm, weight || 1, senderId);
        return res.json(quote);
    } catch (error) {
        console.error("Quote error:", error);
        return res.status(500).json({ message: "Failed to calculate pricing quote" });
    }
};

// =====================================
// Book Parcel
// =====================================
const bookParcel = async (req, res) => {
    try {
        const sender_id = req.user.id;

        const {
            pickup_address,
            drop_address,
            weight,
            parcel_type,
            pickup_date,
            pickup_lat,
            pickup_lng,
            drop_lat,
            drop_lng,
            delivery_tier,
            contact_name,
            contact_phone,
            preferred_pickup_time,
            selected_price
        } = req.body;

        if (
            !pickup_address ||
            !drop_address ||
            !weight ||
            !parcel_type ||
            !pickup_date
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const distKm = getDistance(pickup_lat, pickup_lng, drop_lat, drop_lng);
        
        // Enforce 80 km limit
        if (distKm > 80) {
            return res.status(400).json({
                message: "Delivery distance exceeds our 80 km limit. Please choose a closer destination."
            });
        }

        const quote = await calculateDualQuote(distKm, weight, sender_id);
        const chosenTier = delivery_tier === 'priority' ? 'priority' : 'saver';
        const tierDetails = quote[chosenTier];
        const estimatedTime = req.body.estimated_time || tierDetails.estimated_time;
        const savingsAmount = req.body.savings_amount !== undefined ? parseFloat(req.body.savings_amount).toFixed(2) : (chosenTier === 'saver' ? tierDetails.savingsAmount : '0.00');
        const matchReason = req.body.match_reason || (chosenTier === 'saver' 
            ? "Shared commuter corridor matched (Detour: ~2.1 km)" 
            : "Priority direct point-to-point courier matched");

        const parcel = await createParcel(
            sender_id,
            pickup_address,
            drop_address,
            weight,
            parcel_type,
            pickup_date,
            pickup_lat,
            pickup_lng,
            drop_lat,
            drop_lng,
            finalPrice,
            estimatedTime,
            chosenTier,
            contact_name || '',
            contact_phone || '',
            preferred_pickup_time || 'ASAP',
            savingsAmount,
            2.1,
            matchReason
        );

        // Auto-insert initial tracking record based on tier
        const initialStatus = chosenTier === 'saver'
            ? "Booking Confirmed — Matching with commuter driver completing prior route"
            : "Priority Booking Confirmed — Dispatching nearest direct courier";

        await addTracking(
            parcel.id,
            initialStatus,
            pickup_address,
            "Shipment booked and pending pickup"
        );

        // Notify Admins
        try {
            await notifyAdmins(
                `📦 New ${chosenTier.toUpperCase()} Shipment Booked!`,
                `Parcel #${parcel.id} (${chosenTier === 'saver' ? 'Saver Route' : 'Priority Direct'}) booked from ${pickup_address.substring(0, 30)}... for ₹${finalPrice}`,
                "info"
            );
        } catch (e) {
            console.error("Failed to notify admins", e);
        }

        res.status(201).json({
            message: "Parcel booked successfully",
            parcel,
            tierDetails
        });

    } catch (error) {
        console.error("Book parcel error:", error);
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// =====================================
// Get All Parcels
// =====================================
const getAll = async (req, res) => {
    try {

        const parcels = await getAllParcels();

        res.status(200).json(parcels);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }
};

// =====================================
// Get Parcel By ID
// =====================================
const getById = async (req, res) => {
    try {

        const parcel = await getParcelById(req.params.id);

        if (!parcel) {
            return res.status(404).json({
                message: "Parcel not found"
            });
        }

        res.status(200).json(parcel);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }
};

// =====================================
// Update Parcel Details
// =====================================
const editParcel = async (req, res) => {

    try {

        const {
            pickup_address,
            drop_address,
            weight,
            parcel_type,
            pickup_date,
            pickup_lat,
            pickup_lng,
            drop_lat,
            drop_lng
        } = req.body;

        // Calculate dynamic price
        const distKm = getDistance(pickup_lat, pickup_lng, drop_lat, drop_lng);
        
        // Enforce 80 km limit
        if (distKm > 80) {
            return res.status(400).json({
                message: "Delivery distance exceeds our 80 km limit. Please choose a closer destination."
            });
        }

        // 1. Base Fare & Fees (in ₹)
        const flatBaseFare = 40.00;
        const bookingFee = 15.00;
        const tollSurcharge = 10.00;
        const baseAndFees = flatBaseFare + bookingFee + tollSurcharge; // ₹65.00

        // 2. Variable Rates (Per KM, Per Minute with traffic condition, Per KG)
        const perKmRate = 12.00; // ₹12.00 per km
        const distanceFee = distKm * perKmRate;

        const estimatedMinutes = Math.max(12, Math.round((distKm / 30) * 60));
        const estimated_time = `${estimatedMinutes} mins`;
        const perMinuteRate = 2.00; // ₹2.00 per minute
        const timeFee = estimatedMinutes * perMinuteRate;

        const perKgRate = 5.00; // ₹5.00 per kg
        const weightFee = parseFloat(weight || 1) * perKgRate;

        const subtotal = baseAndFees + distanceFee + timeFee + weightFee;
        const calculatedPrice = subtotal.toFixed(2);

        const parcel = await updateParcel(
            req.params.id,
            pickup_address,
            drop_address,
            weight,
            parcel_type,
            pickup_date,
            pickup_lat,
            pickup_lng,
            drop_lat,
            drop_lng,
            calculatedPrice,
            estimated_time
        );

        if (!parcel) {
            return res.status(404).json({
                message: "Parcel not found"
            });
        }

        res.status(200).json({
            message: "Parcel updated successfully",
            parcel
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

// =====================================
// Update Parcel Status
// =====================================
const updateStatus = async (req, res) => {

    try {

        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required"
            });
        }

        // PRE-SYNC LOGIC: If parcel is marked Assigned, ensure a driver is available before proceeding
        let dispatchedDriverId = null;
        if (status === "Assigned") {
            const existingAssignment = await pool.query(
                "SELECT id FROM assignments WHERE parcel_id=$1 AND assignment_status != 'Completed'",
                [req.params.id]
            );
            
            if (existingAssignment.rows.length === 0) {
                const availDriver = await pool.query("SELECT id FROM drivers WHERE status='Available' LIMIT 1");
                
                if (availDriver.rows.length === 0) {
                    return res.status(400).json({
                        message: "No free drivers available right now. Please wait for a driver to finish their delivery."
                    });
                }
                dispatchedDriverId = availDriver.rows[0].id;
            }
        }

        const parcel = await updateParcelStatus(
            req.params.id,
            status
        );

        if (!parcel) {
            return res.status(404).json({
                message: "Parcel not found"
            });
        }

        // Auto-insert tracking record on status change
        await addTracking(
            parcel.id,
            status,
            parcel.pickup_address, // Or a more specific location if provided
            `Status updated to ${status}`
        );

        // SYNC LOGIC: If parcel is marked Delivered, free up the assigned driver
        if (status === "Delivered") {
            const assignmentRes = await pool.query(
                "SELECT id, driver_id FROM assignments WHERE parcel_id=$1 AND assignment_status != 'Completed'",
                [req.params.id]
            );
            
            if (assignmentRes.rows.length > 0) {
                const { id: assignment_id, driver_id } = assignmentRes.rows[0];
                // Complete the assignment
                await pool.query(
                    "UPDATE assignments SET assignment_status='Completed', completed_at=CURRENT_TIMESTAMP WHERE id=$1",
                    [assignment_id]
                );
                // Free the driver
                await pool.query(
                    "UPDATE drivers SET status='Available' WHERE id=$1",
                    [driver_id]
                );
            }
        }
        
        // POST-SYNC LOGIC: If parcel was successfully assigned, dispatch the driver
        if (status === "Assigned" && dispatchedDriverId) {
            await pool.query(
                "INSERT INTO assignments (parcel_id, driver_id) VALUES($1, $2)",
                [req.params.id, dispatchedDriverId]
            );
            
            await pool.query(
                "UPDATE drivers SET status='Busy' WHERE id=$1",
                [dispatchedDriverId]
            );
        }

        res.status(200).json({
            message: "Parcel status updated successfully",
            parcel
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

// =====================================
// Delete Parcel
// =====================================
const removeParcel = async (req, res) => {

    try {

        const parcel = await deleteParcel(req.params.id);

        if (!parcel) {
            return res.status(404).json({
                message: "Parcel not found"
            });
        }

        res.status(200).json({
            message: "Parcel deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

module.exports = {
    bookParcel,
    getPricingQuote,
    getAllParcels: getAll,
    getParcelById: getById,
    updateParcel: editParcel,
    updateParcelStatus: updateStatus,
    deleteParcel: removeParcel
};