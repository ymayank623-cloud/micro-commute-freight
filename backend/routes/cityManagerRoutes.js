const express = require("express");
const router = express.Router();
const {
    getAllCityManagers,
    addCityManager,
    updateCityManager,
    deleteCityManager
} = require("../controllers/cityManagerController");
const authMiddleware = require("../middleware/authMiddleware");

// GET /api/city-managers
router.get("/", authMiddleware, getAllCityManagers);

// POST /api/city-managers
router.post("/", authMiddleware, addCityManager);

// PUT /api/city-managers/:id
router.put("/:id", authMiddleware, updateCityManager);

// DELETE /api/city-managers/:id
router.delete("/:id", authMiddleware, deleteCityManager);

module.exports = router;
