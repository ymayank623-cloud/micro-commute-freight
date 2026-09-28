const { normalizeQuery } = require('../controllers/placeController');

/**
 * Geocodes an address or query into coordinates { lat, lng, displayName }
 */
async function geocodeAddress(address) {
    if (!address || typeof address !== 'string' || !address.trim()) {
        throw new Error('Address is required for geocoding');
    }

    const clean = address.trim();
    const simplified = clean
        .replace(/\b(institute\s+of\s+technology(\s+and\s+management)?|college\s+of\s+engineering|university|campus|and)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const queries = [clean];
    if (simplified && simplified.length >= 3 && simplified !== clean) {
        queries.push(simplified);
        queries.push(`${simplified} Greater Noida`);
        queries.push(`${simplified} Delhi NCR`);
    }

    // 1. Nominatim lookup
    for (const q of queries) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=1`;
            const res = await fetch(url, { headers: { 'User-Agent': 'FlowLink-Logistics/1.0' } });
            const data = await res.json();
            if (data && data.length > 0 && data[0].lat && data[0].lon) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    displayName: data[0].display_name
                };
            }
        } catch (e) {}
    }

    // 2. Photon fallback
    for (const q of queries) {
        try {
            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=28.47&lon=77.49&limit=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data?.features?.length > 0) {
                const f = data.features[0];
                return {
                    lat: f.geometry.coordinates[1],
                    lng: f.geometry.coordinates[0],
                    displayName: [f.properties.name, f.properties.city, f.properties.state, f.properties.country].filter(Boolean).join(', ')
                };
            }
        } catch (e) {}
    }

    // Default fallback (Delhi NCR)
    return {
        lat: 28.6139,
        lng: 77.2090,
        displayName: address
    };
}

module.exports = {
    geocodeAddress
};
