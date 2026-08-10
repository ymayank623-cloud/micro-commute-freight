const express = require("express");
const router = express.Router();

const {
    createTracking,
    viewTrackingHistory,
    latestTracking
} = require("../controllers/trackingController");

const authMiddleware = require("../middleware/authMiddleware");


// Add Tracking Event
router.post(
    "/",
    authMiddleware,
    createTracking
);


// Get Tracking History of Parcel
router.get(
    "/:parcelId",
    authMiddleware,
    viewTrackingHistory
);


// Get Latest Tracking Status
router.get(
    "/latest/:parcelId",
    authMiddleware,
    latestTracking
);


module.exports = router;