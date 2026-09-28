const pool = require('../config/db');
const { calculateDetour, calculateRoute } = require('./routingService');

/**
 * Stage 1 & Stage 2 matching service with PostGIS spatial indices and detour analysis
 */
async function findMatchingTrips({
    pickupLat,
    pickupLng,
    dropLat,
    dropLng,
    requestedSeats = 1,
    requestedWeight = 1.0,
    departureTime = null,
    maxPickupDistanceMeters = 5000,
    maxDropDistanceMeters = 6000
}) {
    const pLat = parseFloat(pickupLat);
    const pLng = parseFloat(pickupLng);
    const dLat = parseFloat(dropLat);
    const dLng = parseFloat(dropLng);

    if (isNaN(pLat) || isNaN(pLng) || isNaN(dLat) || isNaN(dLng)) {
        throw new Error('Valid pickup and drop coordinates are required');
    }

    // Helper query for candidate driver trips
    const candidateQuery = async (pickupRadius, dropRadius) => {
        const sql = `
            SELECT 
                id,
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
                status,
                ST_Distance(route_geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS pickup_dist_meters,
                ST_Distance(route_geom, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography) AS drop_dist_meters,
                ST_LineLocatePoint(route_geom::geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS pickup_frac,
                ST_LineLocatePoint(route_geom::geometry, ST_SetSRID(ST_MakePoint($3, $4), 4326)) AS drop_frac
            FROM driver_trips
            WHERE 
                status IN ('Scheduled', 'Active')
                AND available_seats >= $5
                AND cargo_capacity_kg >= $6
                AND ST_DWithin(route_geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $7)
                AND ST_DWithin(route_geom, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $8)
                -- Direction Check: Pickup must precede dropoff along the route
                AND ST_LineLocatePoint(route_geom::geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326)) <
                    ST_LineLocatePoint(route_geom::geometry, ST_SetSRID(ST_MakePoint($3, $4), 4326))
            ORDER BY (
                ST_Distance(route_geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) +
                ST_Distance(route_geom, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography)
            ) ASC
            LIMIT 10;
        `;
        const values = [pLng, pLat, dLng, dLat, requestedSeats, requestedWeight, pickupRadius, dropRadius];
        const res = await pool.query(sql, values);
        return res.rows;
    };

    // Stage 1: Try with default threshold
    let candidates = await candidateQuery(maxPickupDistanceMeters, maxDropDistanceMeters);

    // If no candidate found, widen search corridor to 12km (wider metro/suburban coverage)
    if (candidates.length === 0) {
        candidates = await candidateQuery(12000, 15000);
    }

    if (candidates.length === 0) {
        return [];
    }

    // Stage 2: Detailed Detour & Scoring for candidates
    const evaluatedMatches = await Promise.all(
        candidates.map(async (trip) => {
            const pPickup = { lat: pLat, lng: pLng };
            const pDrop = { lat: dLat, lng: dLng };
            const dSource = { lat: parseFloat(trip.source_lat), lng: parseFloat(trip.source_lng) };
            const dDest = { lat: parseFloat(trip.destination_lat), lng: parseFloat(trip.destination_lng) };

            const origMetrics = {
                distanceMeters: parseFloat(trip.distance_km || 0) * 1000,
                durationSeconds: parseInt(trip.duration_mins || 0, 10) * 60
            };

            let detour = null;
            try {
                detour = await calculateDetour(dSource, dDest, pPickup, pDrop, origMetrics);
            } catch (err) {
                console.error(`Detour calculation error for trip ${trip.id}:`, err);
                detour = {
                    extraDistanceKm: parseFloat(((trip.pickup_dist_meters + trip.drop_dist_meters) / 1000).toFixed(2)),
                    extraTimeMins: Math.round(((trip.pickup_dist_meters + trip.drop_dist_meters) / 1000 / 30) * 60),
                    detourRoute: trip.route_geojson
                };
            }

            const pickupDistMeters = Math.round(parseFloat(trip.pickup_dist_meters));
            const dropDistMeters = Math.round(parseFloat(trip.drop_dist_meters));
            const extraKm = detour.extraDistanceKm;
            const extraMins = detour.extraTimeMins;

            // Score Factors (0 - 100 scale)
            // 1. Pickup Proximity (25 pts max)
            const pickupScore = Math.max(0, 25 - (pickupDistMeters / 4000) * 25);

            // 2. Dropoff Proximity (25 pts max)
            const dropScore = Math.max(0, 25 - (dropDistMeters / 5000) * 25);

            // 3. Extra Detour Distance (30 pts max)
            const detourDistScore = Math.max(0, 30 - (extraKm / 7.0) * 30);

            // 4. Extra Detour Time (20 pts max)
            const detourTimeScore = Math.max(0, 20 - (extraMins / 20.0) * 20);

            // Departure time difference penalty if specified
            let timePenalty = 0;
            if (departureTime && trip.departure_time) {
                try {
                    const [reqH, reqM] = departureTime.split(':').map(Number);
                    const [tripH, tripM] = trip.departure_time.split(':').map(Number);
                    const diffMins = Math.abs((tripH * 60 + tripM) - (reqH * 60 + reqM));
                    timePenalty = Math.min(15, Math.round(diffMins / 15) * 2);
                } catch (e) {}
            }

            const rawScore = pickupScore + dropScore + detourDistScore + detourTimeScore - timePenalty;
            const matchScore = Math.min(99, Math.max(35, Math.round(rawScore)));

            let matchTier = 'Good Match';
            let tierColor = '#00E5FF';
            if (matchScore >= 88) {
                matchTier = 'Optimal Corridor Match';
                tierColor = '#00FF66';
            } else if (matchScore >= 75) {
                matchTier = 'High Compatibility';
                tierColor = '#66FF99';
            } else if (matchScore < 60) {
                matchTier = 'Moderate Detour';
                tierColor = '#FFB800';
            }

            return {
                tripId: trip.id,
                driverId: trip.driver_id,
                driverName: trip.driver_name,
                driverPhone: trip.driver_phone,
                vehicleType: trip.vehicle_type,
                vehicleNumber: trip.vehicle_number,
                sourceAddress: trip.source_address,
                destinationAddress: trip.destination_address,
                sourceCoords: { lat: parseFloat(trip.source_lat), lng: parseFloat(trip.source_lng) },
                destCoords: { lat: parseFloat(trip.destination_lat), lng: parseFloat(trip.destination_lng) },
                departureTime: trip.departure_time,
                departureDate: trip.departure_date,
                availableSeats: trip.available_seats,
                cargoCapacityKg: trip.cargo_capacity_kg,
                originalDistanceKm: trip.distance_km,
                originalDurationMins: trip.duration_mins,
                pickupDistanceMeters: pickupDistMeters,
                dropDistanceMeters: dropDistMeters,
                extraDistanceKm: extraKm,
                extraTimeMins: extraMins,
                matchScore,
                matchTier,
                tierColor,
                routeGeometry: trip.route_geojson,
                detourGeometry: detour.detourRoute ? detour.detourRoute.geojson : null
            };
        })
    );

    // Sort descending by match score
    evaluatedMatches.sort((a, b) => b.matchScore - a.matchScore);

    return evaluatedMatches;
}

module.exports = {
    findMatchingTrips
};
