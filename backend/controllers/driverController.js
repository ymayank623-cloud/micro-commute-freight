const {
    checkExistingDriver,
    createDriver,
    getAllDrivers,
    getDriverById,
    updateDriver,
    deleteDriver
} = require("../models/driverModel");
const { sendOtpEmail } = require("../services/emailService");

// In-memory OTP storage for Driver Gmail Verification
const driverOtpStore = new Map();

// Send Google Gmail OTP
const sendDriverOtp = async (req, res) => {
    try {
        const { full_name, email, phone, license_number, vehicle_number } = req.body;

        // Check if duplicate exists before generating OTP
        const existing = await checkExistingDriver(email, phone, license_number, vehicle_number);
        if (existing && existing.length > 0) {
            const d = existing[0];
            let matchedField = "credentials";
            if (d.email && email && d.email.toLowerCase().trim() === email.toLowerCase().trim()) {
                matchedField = "Email address";
            } else if (d.phone && phone && d.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, '')) {
                matchedField = "Phone number";
            } else if (d.license_number && license_number && d.license_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === license_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()) {
                matchedField = "License number";
            } else if (d.vehicle_number && vehicle_number && d.vehicle_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === vehicle_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()) {
                matchedField = "Vehicle registration number";
            }
            return res.status(400).json({
                message: `User is already registered previously with matching ${matchedField}.`
            });
        }

        // Generate 6-digit random OTP
        const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpKey = email.toLowerCase().trim();

        driverOtpStore.set(otpKey, {
            emailOtp,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        // Send Real Google Gmail Email in background
        sendOtpEmail(email, emailOtp, full_name).catch(e => console.error("Async Gmail send error:", e));

        res.json({
            message: "Verification OTP dispatched to your Google Gmail inbox.",
            emailMasked: email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + "*".repeat(Math.max(3, gp3.length)))
        });
    } catch (error) {
        console.error("sendDriverOtp error:", error);
        res.status(500).json({ message: "Failed to generate OTP" });
    }
};

// Verify Google Gmail OTP
const verifyDriverOtp = async (req, res) => {
    try {
        const { email, emailOtp } = req.body;
        const otpKey = (email || '').toLowerCase().trim();

        const stored = driverOtpStore.get(otpKey);
        if (!stored) {
            return res.status(400).json({ message: "OTP expired or not requested. Please request a new OTP." });
        }

        if (Date.now() > stored.expiresAt) {
            driverOtpStore.delete(otpKey);
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        if (stored.emailOtp !== (emailOtp || '').trim()) {
            return res.status(400).json({ message: "Incorrect OTP entered. Please check your Gmail inbox." });
        }

        // Verified! Remove OTP from store
        driverOtpStore.delete(otpKey);

        res.json({
            verified: true,
            message: "Gmail address successfully verified!"
        });
    } catch (error) {
        console.error("verifyDriverOtp error:", error);
        res.status(500).json({ message: "Verification failed" });
    }
};

// Add Driver
const addDriver = async (req, res) => {

    try {

        const {
            full_name,
            email,
            phone,
            license_number,
            vehicle_type,
            vehicle_number
        } = req.body;

        // Check if user/driver registered previously with matching unique attributes
        const existing = await checkExistingDriver(email, phone, license_number, vehicle_number);
        if (existing && existing.length > 0) {
            const d = existing[0];
            let matchedField = "credentials";
            if (d.email && email && d.email.toLowerCase().trim() === email.toLowerCase().trim()) {
                matchedField = `Email address (${email})`;
            } else if (d.phone && phone && d.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, '')) {
                matchedField = `Phone number (${phone})`;
            } else if (d.license_number && license_number && d.license_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === license_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()) {
                matchedField = `License number (${license_number})`;
            } else if (d.vehicle_number && vehicle_number && d.vehicle_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === vehicle_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()) {
                matchedField = `Vehicle registration number (${vehicle_number})`;
            }

            return res.status(400).json({
                message: `User is already registered previously with matching ${matchedField}.`
            });
        }

        const driver = await createDriver(
            full_name,
            email,
            phone,
            license_number,
            vehicle_type,
            vehicle_number
        );

        res.status(201).json({
            message: "Driver added successfully",
            driver
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

// Get All Drivers
const getDrivers = async (req, res) => {

    try {

        const drivers = await getAllDrivers();

        res.json(drivers);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

// Get Driver By ID
const getDriver = async (req, res) => {

    try {

        const driver = await getDriverById(req.params.id);

        if (!driver) {
            return res.status(404).json({
                message: "Driver not found"
            });
        }

        res.json(driver);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

// Update Driver
const editDriver = async (req, res) => {

    try {

        const {
            full_name,
            email,
            phone,
            license_number,
            vehicle_type,
            vehicle_number,
            status
        } = req.body;

        // Check if another driver is already registered with matching credentials
        const existing = await checkExistingDriver(email, phone, license_number, vehicle_number, req.params.id);
        if (existing && existing.length > 0) {
            const d = existing[0];
            let matchedField = "credentials";
            if (d.email && email && d.email.toLowerCase().trim() === email.toLowerCase().trim()) {
                matchedField = "Email address";
            } else if (d.phone && phone && d.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, '')) {
                matchedField = "Phone number";
            } else if (d.license_number && license_number && d.license_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === license_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()) {
                matchedField = "License number";
            } else if (d.vehicle_number && vehicle_number && d.vehicle_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === vehicle_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()) {
                matchedField = "Vehicle registration number";
            }

            return res.status(400).json({
                message: `User is already registered previously with matching ${matchedField}.`
            });
        }

        const driver = await updateDriver(
            req.params.id,
            full_name,
            email,
            phone,
            license_number,
            vehicle_type,
            vehicle_number,
            status
        );

        if (!driver) {
            return res.status(404).json({
                message: "Driver not found"
            });
        }

        res.json({
            message: "Driver updated successfully",
            driver
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

// Delete Driver
const removeDriver = async (req, res) => {

    try {

        const driver = await deleteDriver(req.params.id);

        if (!driver) {
            return res.status(404).json({
                message: "Driver not found"
            });
        }

        res.json({
            message: "Driver deleted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

module.exports = {
    sendDriverOtp,
    verifyDriverOtp,
    addDriver,
    getDrivers,
    getDriver,
    editDriver,
    removeDriver
};