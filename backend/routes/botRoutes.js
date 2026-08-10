const express = require("express");
const router = express.Router();
const { processCommand } = require("../controllers/botController");
const authMiddleware = require("../middleware/authMiddleware");

// POST /api/bot/chat
router.post("/chat", authMiddleware, processCommand);

module.exports = router;
