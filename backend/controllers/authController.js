const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
    createUser,
    getUserByEmail,
    getUserById
} = require("../models/userModel");
const axios = require("axios");

const nodemailer = require("nodemailer");

// In-memory store for Email OTPs
const emailOtpStore = new Map();

// Optional: Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// =====================================
// Send Email OTP
// =====================================
const sendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        if (!email.toLowerCase().endsWith("@gmail.com")) {
            return res.status(400).json({ message: "Only @gmail.com addresses are allowed." });
        }

        // Check if email already exists
        const existingUser = await getUserByEmail(email.toLowerCase());
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists." });
        }

        // Generate 6-digit random OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        emailOtpStore.set(email.toLowerCase(), {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
        });

        // SIMULATED OR REAL EMAIL
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'FlowLink Registration Verification Code',
                text: `Your FlowLink verification code is: ${otp}. It will expire in 10 minutes.`
            };
            await transporter.sendMail(mailOptions);
            console.log(`[EMAIL SENT] OTP sent to ${email}`);
        } else {
            // SIMULATED EMAIL: Print to terminal
            console.log(`\n=========================================`);
            console.log(`📧 [SIMULATED EMAIL] to ${email}`);
            console.log(`Subject: FlowLink Registration Verification Code`);
            console.log(`Your FlowLink verification code is: ${otp}`);
            console.log(`=========================================\n`);
        }

        res.status(200).json({
            message: "OTP sent successfully to your email."
        });
    } catch (error) {
        console.error("OTP Error:", error);
        res.status(500).json({ message: "Failed to send OTP to email" });
    }
};

// =====================================
// Verify Email OTP
// =====================================
const verifyEmailOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required." });
        }

        const normalizedEmail = email.toLowerCase();
        const stored = emailOtpStore.get(normalizedEmail);
        if (!stored) {
            return res.status(400).json({ message: "OTP not requested or expired." });
        }

        if (Date.now() > stored.expiresAt) {
            emailOtpStore.delete(normalizedEmail);
            return res.status(400).json({ message: "OTP has expired." });
        }

        if (stored.otp !== otp.trim()) {
            return res.status(400).json({ message: "Invalid OTP." });
        }

        emailOtpStore.delete(normalizedEmail);
        res.status(200).json({ message: "Email verified successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Verification failed." });
    }
};

// =====================================
// Register
// =====================================
const register = async (req, res) => {
    try {
        const { full_name, email, password, phone, role } = req.body;

        // 1. Enforce @gmail.com
        if (!email.toLowerCase().endsWith("@gmail.com")) {
            return res.status(400).json({ message: "Only @gmail.com addresses are allowed." });
        }

        // 2. Hash password & create user
        let finalRole = role || "user";
        if (email.toLowerCase() === "ymayank623@gmail.com") {
            finalRole = "admin";
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await createUser(full_name, email, hashedPassword, phone, finalRole);

        res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        console.error(error);
        // Handle duplicate email unique constraint error
        if (error.code === '23505') {
            return res.status(400).json({ message: "Email already exists." });
        }
        res.status(500).json({ message: "Server Error" });
    }
};

// =====================================
// Login
// =====================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await getUserByEmail(email);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        let currentRole = user.role;
        if (email.toLowerCase() === "ymayank623@gmail.com") {
            currentRole = "admin";
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: currentRole },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// =====================================
// Get Current User
// =====================================
const getMe = async (req, res) => {
    try {
        if (req.user.role === 'driver') {
            const { getDriverById } = require("../models/driverModel");
            const driver = await getDriverById(req.user.id);
            if (!driver) {
                return res.status(404).json({ message: "Driver not found" });
            }
            // attach role explicitly just in case frontend needs it mapped this way
            driver.role = 'driver';
            return res.status(200).json(driver);
        }

        const user = await getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    sendEmailOtp,
    verifyEmailOtp,
    register,
    login,
    getMe,
};