const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "micro_commute",
    password: "Mayank8492",
    port: 5432,
});

// Helper to create notification internally
const createNotification = async (userId, title, message, type = "info") => {
    try {
        await pool.query(
            "INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)",
            [userId, title, message, type]
        );
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
};

const notifyAdmins = async (title, message, type = "info") => {
    try {
        const admins = await pool.query("SELECT id FROM users WHERE role = 'admin'");
        for (let admin of admins.rows) {
            await createNotification(admin.id, title, message, type);
        }
    } catch (error) {
        console.error("Failed to notify admins:", error);
    }
};

// Fetch all notifications for a user
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Server error fetching notifications" });
    }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false",
            [userId]
        );
        res.status(200).json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ message: "Server error fetching count" });
    }
};

// Mark a specific notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        await pool.query(
            "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
            [id, userId]
        );
        res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("Error marking notification read:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await pool.query(
            "UPDATE notifications SET is_read = true WHERE user_id = $1",
            [userId]
        );
        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error marking all read:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await pool.query(
            "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
            [id, userId]
        );
        res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createNotification,
    notifyAdmins,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
