const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require("../controllers/notificationController");

router.use(verifyToken); // All routes require authentication

router.get("/", getNotifications);
router.get("/unread", getUnreadCount);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
