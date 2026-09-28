const express = require('express');
const router = express.Router();
const {
    createTrip,
    getMatchingTrips,
    getTripById,
    joinTrip,
    listTrips
} = require('../controllers/tripController');

// Driver trip endpoints
router.post('/', createTrip);
router.get('/', listTrips);
router.get('/matches', getMatchingTrips);
router.get('/:id', getTripById);
router.post('/:id/join', joinTrip);

module.exports = router;
