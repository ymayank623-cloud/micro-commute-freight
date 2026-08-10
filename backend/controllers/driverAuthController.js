const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { checkExistingDriver } = require("../models/driverModel");

// Driver Registration
const driverRegister = async (req, res) => {
  const { full_name, email, password, phone, license_number, vehicle_type, vehicle_number } = req.body;

  if (!full_name || !email || !password || !phone || !license_number || !vehicle_number) {
    return res.status(400).json({ error: "All required fields must be provided." });
  }

  try {
    const existingDriver = await checkExistingDriver(email, phone, license_number, vehicle_number);

    if (existingDriver.length > 0) {
      return res.status(400).json({ error: "Driver with these credentials (email/phone/license/vehicle) already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO drivers
        (full_name, email, phone, license_number, vehicle_type, vehicle_number, password, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'Available')
        RETURNING id, full_name, email, status`,
      [full_name, email, phone, license_number, vehicle_type || 'Truck', vehicle_number, hashedPassword]
    );

    const driver = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: driver.id, role: "driver" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Driver registered successfully.",
      token,
      driver
    });
  } catch (error) {
    console.error("Driver registration error:", error);
    res.status(500).json({ error: "Server error during registration." });
  }
};

// Driver Login
const driverLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const result = await pool.query("SELECT * FROM drivers WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const driver = result.rows[0];

    if (!driver.password) {
        return res.status(401).json({ error: "Account not setup with password. Please contact admin." });
    }

    const isMatch = await bcrypt.compare(password, driver.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: driver.id, role: "driver" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      driver: {
        id: driver.id,
        full_name: driver.full_name,
        email: driver.email,
        status: driver.status
      }
    });
  } catch (error) {
    console.error("Driver login error:", error);
    res.status(500).json({ error: "Server error during login." });
  }
};

module.exports = {
  driverRegister,
  driverLogin
};
