const express = require("express");
const router = express.Router();

const {
    sendDriverOtp,
    verifyDriverOtp,
    addDriver,
    getDrivers,
    getDriver,
    editDriver,
    removeDriver
} = require("../controllers/driverController");

const authMiddleware = require("../middleware/authMiddleware");

// OTP Verification for Driver Registration
router.post("/send-otp", authMiddleware, sendDriverOtp);
router.post("/verify-otp", authMiddleware, verifyDriverOtp);

// Create Driver
router.post("/", authMiddleware, addDriver);

// Get All Drivers
router.get("/", getDrivers);

// Get Driver By ID
router.get("/:id", getDriver);

// Update Driver
router.put("/:id", authMiddleware, editDriver);

// Delete Driver
router.delete("/:id", authMiddleware, removeDriver);

module.exports = router;