const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config({ path: 'c:/MicroCommuteFreightNetwork/backend/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function geocode(address) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
        const response = await axios.get(url, { headers: { 'User-Agent': 'MicroCommute/1.0' } });
        if (response.data && response.data.length > 0) {
            return {
                lat: response.data[0].lat,
                lon: response.data[0].lon
            };
        }
    } catch (e) {
        console.log(`Failed to geocode: ${address}`);
    }
    return null;
}

async function fixParcels() {
    try {
        // Find all parcels missing coordinates
        const result = await pool.query('SELECT * FROM parcels WHERE pickup_lat IS NULL OR drop_lat IS NULL');
        
        console.log(`Found ${result.rows.length} parcels missing coordinates.`);
        
        for (const parcel of result.rows) {
            console.log(`Fixing parcel #${parcel.id}...`);
            
            let pickup_lat = parcel.pickup_lat;
            let pickup_lng = parcel.pickup_lng;
            let drop_lat = parcel.drop_lat;
            let drop_lng = parcel.drop_lng;
            
            if (!pickup_lat && parcel.pickup_address) {
                const geo = await geocode(parcel.pickup_address);
                if (geo) {
                    pickup_lat = geo.lat;
                    pickup_lng = geo.lon;
                }
            }
            
            if (!drop_lat && parcel.drop_address) {
                const geo = await geocode(parcel.drop_address);
                if (geo) {
                    drop_lat = geo.lat;
                    drop_lng = geo.lon;
                }
            }
            
            await pool.query(
                `UPDATE parcels SET pickup_lat = $1, pickup_lng = $2, drop_lat = $3, drop_lng = $4 WHERE id = $5`,
                [pickup_lat, pickup_lng, drop_lat, drop_lng, parcel.id]
            );
            console.log(`Updated parcel #${parcel.id}`);
            
            // Sleep to avoid Nominatim rate limits
            await new Promise(r => setTimeout(r, 1500));
        }
        
        console.log("Done fixing old parcels.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

fixParcels();
