const express = require("express");
const router = express.Router();
const { suggestPlaces, geocodePlace, getDrivingRoute } = require("../controllers/placeController");

router.get("/suggest", suggestPlaces);
router.get("/geocode", geocodePlace);
router.get("/route", getDrivingRoute);

module.exports = router;
