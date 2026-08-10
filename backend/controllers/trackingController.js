const {
    addTracking,
    getTrackingHistory,
    getLatestTracking
} = require("../models/trackingModel");


// ==========================================
// Add Tracking Event
// ==========================================
const createTracking = async (req, res) => {

    try {

        const {
            parcel_id,
            status,
            location,
            remarks
        } = req.body;

        const tracking = await addTracking(
            parcel_id,
            status,
            location,
            remarks
        );

        res.status(201).json({
            message: "Tracking updated successfully",
            tracking
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};


// ==========================================
// Get Tracking History
// ==========================================
const viewTrackingHistory = async (req, res) => {

    try {

        const history = await getTrackingHistory(
            req.params.parcelId
        );

        res.status(200).json(history);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};


// ==========================================
// Get Latest Tracking Status
// ==========================================
const latestTracking = async (req, res) => {

    try {

        const latest = await getLatestTracking(
            req.params.parcelId
        );

        if (!latest) {

            return res.status(404).json({
                message: "Tracking not found"
            });

        }

        res.status(200).json(latest);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};


module.exports = {
    createTracking,
    viewTrackingHistory,
    latestTracking
};