const express = require("express");
const router = express.Router();
const { 
    getMyAssignments, 
    verifyPickupOtp, 
    updateLiveLocation, 
    updateAssignmentStatus, 
    getAvailableRequests, 
    acceptRequest, 
    toggleStatus, 
    getDriverStats 
} = require("../controllers/driverPortalController");
const authMiddleware = require("../middleware/authMiddleware");

// Ensure the user is a driver
const driverMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'driver') {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Driver portal only." });
    }
};

// GET /api/driver-portal/assignments
router.get("/assignments", authMiddleware, driverMiddleware, getMyAssignments);

// POST /api/driver-portal/verify-otp (Verify customer's 4-digit pickup OTP)
router.post("/verify-otp", authMiddleware, driverMiddleware, verifyPickupOtp);

// POST /api/driver-portal/location (Broadcast driver live coordinates)
router.post("/location", authMiddleware, driverMiddleware, updateLiveLocation);

// PUT /api/driver-portal/update-status
router.put("/update-status", authMiddleware, driverMiddleware, updateAssignmentStatus);

router.get("/available", authMiddleware, driverMiddleware, getAvailableRequests);
router.post("/accept", authMiddleware, driverMiddleware, acceptRequest);
router.post("/status", authMiddleware, driverMiddleware, toggleStatus);
router.get("/stats", authMiddleware, driverMiddleware, getDriverStats);

module.exports = router;
