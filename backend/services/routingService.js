/**
 * Routing Service for OSRM Road Calculations and Detour Analysis
 */

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Calculates road route across 2 or more waypoints using OSRM
 * @param {Array<{lat: number, lng: number}>} points 
 * @returns {Promise<{distanceMeters: number, durationSeconds: number, distanceKm: number, durationMins: number, coordinates: Array<[number, number]>, geojson: object}>}
 */
async function calculateRoute(points) {
    if (!points || points.length < 2) {
        throw new Error('At least 2 points are required to calculate route');
    }

    const coordStr = points.map(p => `${p.lng},${p.lat}`).join(';');
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(osrmUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data && data.routes && data.routes.length > 0) {
                const r = data.routes[0];
                return {
                    distanceMeters: r.distance,
                    durationSeconds: r.duration,
                    distanceKm: parseFloat((r.distance / 1000).toFixed(2)),
                    durationMins: Math.max(1, Math.round(r.duration / 60)),
                    coordinates: r.geometry.coordinates, // [[lng, lat], ...]
                    geojson: r.geometry
                };
            }
        }
    } catch (err) {
        // Fallback to geometric approximation if OSRM is unreachable
        console.warn('OSRM route fetch failed or timed out, using fallback approximation:', err.message);
    }

    // Fallback: Haversine distance with 1.25 road curvature factor
    let totalMeters = 0;
    const fallbackCoords = [];
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        fallbackCoords.push([p1.lng, p1.lat]);
        totalMeters += haversineDistanceMeters(p1.lat, p1.lng, p2.lat, p2.lng) * 1.25;
    }
    fallbackCoords.push([points[points.length - 1].lng, points[points.length - 1].lat]);

    const distanceKm = parseFloat((totalMeters / 1000).toFixed(2));
    const durationMins = Math.max(2, Math.round((distanceKm / 30) * 60)); // Avg 30 km/h urban speed

    return {
        distanceMeters: Math.round(totalMeters),
        durationSeconds: durationMins * 60,
        distanceKm,
        durationMins,
        coordinates: fallbackCoords,
        geojson: {
            type: 'LineString',
            coordinates: fallbackCoords
        }
    };
}

/**
 * Calculates detour required for a driver to service a passenger's pickup and drop
 * Driver planned route: S -> D
 * Combined detour route: S -> P_pickup -> P_drop -> D
 */
async function calculateDetour(driverSource, driverDest, passengerPickup, passengerDrop, originalMetrics = null) {
    let orig = originalMetrics;
    if (!orig || !orig.distanceMeters || !orig.durationSeconds) {
        orig = await calculateRoute([driverSource, driverDest]);
    }

    // Detour route through passenger pickup and dropoff
    const detourPoints = [
        driverSource,
        passengerPickup,
        passengerDrop,
        driverDest
    ];

    const detourRoute = await calculateRoute(detourPoints);

    const extraDistanceMeters = Math.max(0, detourRoute.distanceMeters - orig.distanceMeters);
    const extraDistanceKm = parseFloat((extraDistanceMeters / 1000).toFixed(2));
    const extraTimeSeconds = Math.max(0, detourRoute.durationSeconds - orig.durationSeconds);
    const extraTimeMins = Math.round(extraTimeSeconds / 60);

    return {
        originalRoute: orig,
        detourRoute,
        extraDistanceMeters,
        extraDistanceKm,
        extraTimeSeconds,
        extraTimeMins
    };
}

module.exports = {
    calculateRoute,
    calculateDetour,
    haversineDistanceMeters
};
