const express = require("express");
const router = express.Router();

const { register, login, getMe, sendEmailOtp, verifyEmailOtp } = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, getMe);

module.exports = router;