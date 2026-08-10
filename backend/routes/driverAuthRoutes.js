const express = require("express");
const router = express.Router();
const { driverRegister, driverLogin } = require("../controllers/driverAuthController");

// POST /api/driver-auth/register
router.post("/register", driverRegister);

// POST /api/driver-auth/login
router.post("/login", driverLogin);

module.exports = router;
