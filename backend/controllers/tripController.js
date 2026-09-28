const pool = require('../config/db');
const { geocodeAddress } = require('../services/geocodingService');
const { calculateRoute } = require('../services/routingService');
const { findMatchingTrips } = require('../services/matchingService');

/**
 * POST /api/trips
 * Creates a new commuter driver trip with automated road routing and PostGIS LineString geometry
 */
const createTrip = async (req, res) => {
    try {
        const {
            driverId,
            driverName,
            driverPhone,
            vehicleType = 'Bike',
            vehicleNumber,
            sourceLocation,
            destinationLocation,
            sourceLat: inputSourceLat,
            sourceLng: inputSourceLng,
            destinationLat: inputDestLat,
            destinationLng: inputDestLng,
            departureTime = '09:00:00',
            departureDate,
            availableSeats = 1,
            cargoCapacityKg = 15.0
        } = req.body;

        if (!sourceLocation || !destinationLocation) {
            return res.status(400).json({ error: 'Source and destination locations are required' });
        }

        // 1. Geocode locations if coordinates not directly supplied
        let sLat = parseFloat(inputSourceLat);
        let sLng = parseFloat(inputSourceLng);
        let sAddr = sourceLocation;

        if (isNaN(sLat) || isNaN(sLng)) {
            const geoSource = await geocodeAddress(sourceLocation);
            sLat = geoSource.lat;
            sLng = geoSource.lng;
            sAddr = geoSource.displayName || sourceLocation;
        }

        let dLat = parseFloat(inputDestLat);
        let dLng = parseFloat(inputDestLng);
        let dAddr = destinationLocation;

        if (isNaN(dLat) || isNaN(dLng)) {
            const geoDest = await geocodeAddress(destinationLocation);
            dLat = geoDest.lat;
            dLng = geoDest.lng;
            dAddr = geoDest.displayName || destinationLocation;
        }

        // 2. Calculate Road Route (OSRM)
        const routeData = await calculateRoute([
            { lat: sLat, lng: sLng },
            { lat: dLat, lng: dLng }
        ]);

        const routeGeojson = routeData.geojson;
        const geojsonString = JSON.stringify(routeGeojson);

        // 3. Insert into PostgreSQL + PostGIS
        const insertSql = `
            INSERT INTO driver_trips (
                driver_id,
                driver_name,
                driver_phone,
                vehicle_type,
                vehicle_number,
                source_address,
                source_lat,
                source_lng,
                destination_address,
                destination_lat,
                destination_lng,
                departure_time,
                departure_date,
                available_seats,
                cargo_capacity_kg,
                distance_km,
                duration_mins,
                route_polyline,
                route_geojson,
                route_geom,
                status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, COALESCE($13, CURRENT_DATE), $14, $15, $16, $17, $18, $19,
                ST_SetSRID(ST_GeomFromGeoJSON($20), 4326)::geography,
                'Scheduled'
            )
            RETURNING *;
        `;

        const values = [
            driverId || null,
            driverName || 'Verified Commuter',
            driverPhone || '+91 98110 00000',
            vehicleType,
            vehicleNumber || 'UP16 DL 0001',
            sAddr,
            sLat,
            sLng,
            dAddr,
            dLat,
            dLng,
            departureTime,
            departureDate || null,
            availableSeats,
            cargoCapacityKg,
            routeData.distanceKm,
            routeData.durationMins,
            '', // polyline
            routeGeojson,
            geojsonString
        ];

        const result = await pool.query(insertSql, values);
        return res.status(201).json({
            message: 'Driver trip created and indexed successfully',
            trip: result.rows[0]
        });
    } catch (err) {
        console.error('Error creating driver trip:', err);
        return res.status(500).json({ error: 'Failed to create driver trip: ' + err.message });
    }
};

/**
 * GET /api/trips/matches
 * Finds matching commuter driver trips along passenger/parcel pickup and drop coordinates
 */
const getMatchingTrips = async (req, res) => {
    try {
        let {
            pickup,
            drop,
            pickupLat,
            pickupLng,
            dropLat,
            dropLng,
            seats = 1,
            weight = 1.0,
            departureTime
        } = req.query;

        // Auto-geocode if raw text address is provided
        if ((!pickupLat || !pickupLng) && pickup) {
            const geoP = await geocodeAddress(pickup);
            pickupLat = geoP.lat;
            pickupLng = geoP.lng;
        }

        if ((!dropLat || !dropLng) && drop) {
            const geoD = await geocodeAddress(drop);
            dropLat = geoD.lat;
            dropLng = geoD.lng;
        }

        if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
            return res.status(400).json({
                error: 'Both pickup and drop locations (or lat/lng coordinates) are required'
            });
        }

        const matches = await findMatchingTrips({
            pickupLat,
            pickupLng,
            dropLat,
            dropLng,
            requestedSeats: parseInt(seats, 10) || 1,
            requestedWeight: parseFloat(weight) || 1.0,
            departureTime
        });

        return res.json({
            count: matches.length,
            passenger: {
                pickup: { lat: parseFloat(pickupLat), lng: parseFloat(pickupLng) },
                drop: { lat: parseFloat(dropLat), lng: parseFloat(dropLng) }
            },
            matches
        });
    } catch (err) {
        console.error('Error matching driver trips:', err);
        return res.status(500).json({ error: 'Failed to find matching trips: ' + err.message });
    }
};

/**
 * GET /api/trips/:id
 */
const getTripById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM driver_trips WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        return res.json(result.rows[0]);
    } catch (err) {
        console.error('Error getting trip by id:', err);
        return res.status(500).json({ error: 'Failed to fetch trip' });
    }
};

/**
 * POST /api/trips/:id/join
 * Join / Book with this commuter driver
 */
const joinTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const { passengerName, passengerPhone, parcelWeight = 1.0, seats = 1, pickupAddress, dropAddress } = req.body;

        const tripRes = await pool.query('SELECT * FROM driver_trips WHERE id = $1', [id]);
        if (tripRes.rows.length === 0) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        const trip = tripRes.rows[0];
        if (trip.available_seats < seats && seats > 0) {
            return res.status(400).json({ error: 'Not enough seats available on this commuter route' });
        }
        if (trip.cargo_capacity_kg < parcelWeight) {
            return res.status(400).json({ error: 'Weight exceeds commuter capacity' });
        }

        // Update remaining capacity
        const updated = await pool.query(
            `UPDATE driver_trips 
             SET available_seats = GREATEST(0, available_seats - $1),
                 cargo_capacity_kg = GREATEST(0, cargo_capacity_kg - $2)
             WHERE id = $3
             RETURNING *;`,
            [seats, parcelWeight, id]
        );

        return res.json({
            message: 'Successfully matched and confirmed with Commuter Driver!',
            trip: updated.rows[0],
            bookingDetails: {
                driverName: trip.driver_name,
                driverPhone: trip.driver_phone,
                vehicleNumber: trip.vehicle_number,
                departureTime: trip.departure_time,
                pickupAddress,
                dropAddress,
                status: 'Confirmed'
            }
        });
    } catch (err) {
        console.error('Error joining trip:', err);
        return res.status(500).json({ error: 'Failed to join trip: ' + err.message });
    }
};

/**
 * GET /api/trips
 * List all scheduled active trips
 */
const listTrips = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, driver_name, vehicle_type, source_address, destination_address, departure_time, departure_date, available_seats, cargo_capacity_kg, distance_km, duration_mins, status FROM driver_trips ORDER BY id DESC LIMIT 50'
        );
        return res.json(result.rows);
    } catch (err) {
        console.error('Error listing trips:', err);
        return res.status(500).json({ error: 'Failed to list trips' });
    }
};

module.exports = {
    createTrip,
    getMatchingTrips,
    getTripById,
    joinTrip,
    listTrips
};
