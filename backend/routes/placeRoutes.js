const express = require("express");
const router = express.Router();
const { suggestPlaces, geocodePlace } = require("../controllers/placeController");

router.get("/suggest", suggestPlaces);
router.get("/geocode", geocodePlace);

module.exports = router;
