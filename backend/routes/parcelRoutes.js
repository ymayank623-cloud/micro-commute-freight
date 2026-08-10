const express = require("express");
const router = express.Router();

const {
    bookParcel,
    getPricingQuote,
    getAllParcels,
    getParcelById,
    updateParcel,
    updateParcelStatus,
    deleteParcel
} = require("../controllers/parcelController");

const authMiddleware = require("../middleware/authMiddleware");

// ==============================
// Calculate Dual Pricing Quote
// ==============================
router.post("/quote", getPricingQuote);

// ==============================
// Book Parcel
// ==============================
router.post("/", authMiddleware, bookParcel);

// ==============================
// Get All Parcels
// ==============================
router.get("/", getAllParcels);

// ==============================
// Get Parcel By ID
// ==============================
router.get("/:id", getParcelById);

// ==============================
// Update Complete Parcel
// ==============================
router.put("/:id", updateParcel);

// ==============================
// Update Parcel Status
// ==============================
router.put("/:id/status", updateParcelStatus);

// ==============================
// Delete Parcel
// ==============================
router.delete("/:id", deleteParcel);

module.exports = router;