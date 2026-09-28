const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

const pool = require("./config/db");

// =========================
// Middleware
// =========================
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            process.env.FRONTEND_URL || "https://microcommute.vercel.app",
        ],
        credentials: true,
    })
);

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    if (req.method === 'POST') console.log(`[BODY]`, req.body);
    next();
});

// =========================
// Import Routes
// =========================
const authRoutes = require("./routes/authRoutes");
const parcelRoutes = require("./routes/parcelRoutes");
const driverRoutes = require("./routes/driverRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const searchRoutes = require("./routes/searchRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const botRoutes = require("./routes/botRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const driverAuthRoutes = require("./routes/driverAuthRoutes");
const driverPortalRoutes = require("./routes/driverPortalRoutes");
const placeRoutes = require("./routes/placeRoutes");
const cityManagerRoutes = require("./routes/cityManagerRoutes");
const dispatchPolicyRoutes = require("./routes/dispatchPolicyRoutes");
const tripRoutes = require("./routes/tripRoutes");

// =========================
// Home Route
// =========================
app.get("/", (req, res) => {
    res.send("🚚 FlowLink Logistics API Running...");
});

// =========================
// API Routes
// =========================
app.use("/api/auth", authRoutes);

app.use("/api/parcels", parcelRoutes);

app.use("/api/drivers", driverRoutes);

app.use("/api/driver-auth", driverAuthRoutes);
app.use("/api/driver-portal", driverPortalRoutes);

app.use("/api/city-managers", cityManagerRoutes);
app.use("/api/admin", dispatchPolicyRoutes);
app.use("/api", dispatchPolicyRoutes);

app.use("/api/assignments", assignmentRoutes);

app.use("/api/search", searchRoutes);

app.use("/api/tracking", trackingRoutes);

app.use("/api/analytics", analyticsRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/bot", botRoutes);

app.use("/api/places", placeRoutes);
app.use("/api/trips", tripRoutes);

// =========================
// Database Connection Test
// =========================
pool.query("SELECT NOW()", (err, result) => {
    if (err) {
        console.error("❌ Database connection failed:", err.message);
    } else {
        console.log("✅ Database connected successfully!");
        console.log("Current Time:", result.rows[0].now);
    }
});

// =========================
// Start Server & Keep Alive
// =========================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Prevent background process termination
setInterval(() => {}, 1000 * 60 * 60);