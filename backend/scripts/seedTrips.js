require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/db');
const { calculateRoute } = require('../services/routingService');

const SAMPLE_TRIPS = [
    {
        driverName: 'Aman Verma (Commuter)',
        driverPhone: '+91 98101 23456',
        vehicleType: 'Bike',
        vehicleNumber: 'UP16 BX 4421',
        sourceAddress: 'Knowledge Park II, Greater Noida',
        sourceCoords: { lat: 28.4619, lng: 77.4988 },
        destinationAddress: 'Botanical Garden Metro Station, Noida',
        destCoords: { lat: 28.5645, lng: 77.3344 },
        departureTime: '08:30:00',
        availableSeats: 1,
        cargoCapacityKg: 15.0
    },
    {
        driverName: 'Rahul Sharma (Daily Tech Commuter)',
        driverPhone: '+91 98712 34567',
        vehicleType: 'Bike',
        vehicleNumber: 'UP16 EF 8890',
        sourceAddress: 'Pari Chowk, Greater Noida',
        sourceCoords: { lat: 28.4716, lng: 77.5093 },
        destinationAddress: 'Sector 62 IT Park, Noida',
        destCoords: { lat: 28.6258, lng: 77.3648 },
        departureTime: '09:00:00',
        availableSeats: 1,
        cargoCapacityKg: 12.0
    },
    {
        driverName: 'Pooja Malhotra (Office Commuter)',
        driverPhone: '+91 99103 45678',
        vehicleType: 'Bike',
        vehicleNumber: 'DL3S CP 5512',
        sourceAddress: 'Sector 18, Noida',
        sourceCoords: { lat: 28.5708, lng: 77.3260 },
        destinationAddress: 'Connaught Place, New Delhi',
        destCoords: { lat: 28.6315, lng: 77.2167 },
        departureTime: '09:15:00',
        availableSeats: 1,
        cargoCapacityKg: 10.0
    },
    {
        driverName: 'Kabir Mehta (Corporate Commuter)',
        driverPhone: '+91 98114 56789',
        vehicleType: 'Bike',
        vehicleNumber: 'HR26 DK 1109',
        sourceAddress: 'DLF Cyber City, Gurugram',
        sourceCoords: { lat: 28.4986, lng: 77.0898 },
        destinationAddress: 'Saket Metro Station, South Delhi',
        destCoords: { lat: 28.5204, lng: 77.2014 },
        departureTime: '08:45:00',
        availableSeats: 1,
        cargoCapacityKg: 15.0
    },
    {
        driverName: 'Sandeep Kumar (Freight Commuter)',
        driverPhone: '+91 98215 67890',
        vehicleType: 'Bike',
        vehicleNumber: 'UP14 BL 3320',
        sourceAddress: 'Indirapuram, Ghaziabad',
        sourceCoords: { lat: 28.6415, lng: 77.3712 },
        destinationAddress: 'Anand Vihar Terminal, Delhi',
        destCoords: { lat: 28.6502, lng: 77.3153 },
        departureTime: '08:15:00',
        availableSeats: 1,
        cargoCapacityKg: 20.0
    }
];

async function seed() {
    try {
        console.log('Seeding commuter driver trips with real road geometry...');

        // Truncate existing trips
        await pool.query('DELETE FROM driver_trips');

        for (const trip of SAMPLE_TRIPS) {
            console.log(`Routing trip: ${trip.sourceAddress} -> ${trip.destinationAddress}...`);
            const route = await calculateRoute([trip.sourceCoords, trip.destCoords]);

            const geojsonStr = JSON.stringify(route.geojson);

            const insertSql = `
                INSERT INTO driver_trips (
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
                    route_geojson,
                    route_geom,
                    status
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, CURRENT_DATE, $12, $13, $14, $15, $16,
                    ST_SetSRID(ST_GeomFromGeoJSON($17), 4326)::geography,
                    'Scheduled'
                ) RETURNING id;
            `;

            const res = await pool.query(insertSql, [
                trip.driverName,
                trip.driverPhone,
                trip.vehicleType,
                trip.vehicleNumber,
                trip.sourceAddress,
                trip.sourceCoords.lat,
                trip.sourceCoords.lng,
                trip.destinationAddress,
                trip.destCoords.lat,
                trip.destCoords.lng,
                trip.departureTime,
                trip.availableSeats,
                trip.cargoCapacityKg,
                route.distanceKm,
                route.durationMins,
                route.geojson,
                geojsonStr
            ]);

            console.log(`-> Inserted trip ${res.rows[0].id} (${route.distanceKm} km, ${route.durationMins} mins, ${route.coordinates.length} waypoints)`);
        }

        console.log('✅ All sample commuter trips seeded successfully!');
    } catch (e) {
        console.error('Seeding error:', e);
    } finally {
        await pool.end();
    }
}

seed();
