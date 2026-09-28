require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/db');

async function setup() {
    try {
        console.log('Ensuring PostGIS extension is loaded...');
        await pool.query('CREATE EXTENSION IF NOT EXISTS postgis');

        console.log('Creating driver_trips table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS driver_trips (
                id SERIAL PRIMARY KEY,
                driver_id INT REFERENCES drivers(id) ON DELETE SET NULL,
                driver_name VARCHAR(100),
                driver_phone VARCHAR(30),
                vehicle_type VARCHAR(50) DEFAULT 'Bike',
                vehicle_number VARCHAR(50),
                source_address TEXT NOT NULL,
                source_lat NUMERIC(10, 6) NOT NULL,
                source_lng NUMERIC(10, 6) NOT NULL,
                destination_address TEXT NOT NULL,
                destination_lat NUMERIC(10, 6) NOT NULL,
                destination_lng NUMERIC(10, 6) NOT NULL,
                departure_time TIME NOT NULL,
                departure_date DATE DEFAULT CURRENT_DATE,
                available_seats INT DEFAULT 1,
                cargo_capacity_kg NUMERIC(6, 2) DEFAULT 20.00,
                distance_km NUMERIC(8, 2),
                duration_mins INT,
                route_polyline TEXT,
                route_geojson JSONB,
                route_geom GEOGRAPHY(LINESTRING, 4326),
                status VARCHAR(30) DEFAULT 'Scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_driver_trips_route_geom ON driver_trips USING GIST (route_geom);
            CREATE INDEX IF NOT EXISTS idx_driver_trips_status ON driver_trips (status);
            CREATE INDEX IF NOT EXISTS idx_driver_trips_dep_time ON driver_trips (departure_time);
        `);

        // Check if sample driver commuter trips exist; if not, add realistic commuter routes
        const existing = await pool.query('SELECT COUNT(*) as count FROM driver_trips');
        console.log(`Current driver_trips count: ${existing.rows[0].count}`);

        console.log('Setup finished successfully!');
    } catch (e) {
        console.error('Setup error:', e);
    } finally {
        await pool.end();
    }
}

setup();
