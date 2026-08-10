// =========================================================================
// GOOGLE-STYLE PLACES AUTOCOMPLETE & GEOCODING CONTROLLER
// =========================================================================

// Indian Transit and Common Landmark Dictionary
const INDIAN_ABBREVIATIONS = {
    'ndls': 'New Delhi Railway Station',
    'dli': 'Old Delhi Railway Station',
    'nzm': 'Hazrat Nizamuddin Railway Station',
    'anvt': 'Anand Vihar Terminal Delhi',
    'cp': 'Connaught Place New Delhi',
    'igi': 'Indira Gandhi International Airport Delhi',
    't3': 'IGI Airport Terminal 3 Delhi',
    't1': 'IGI Airport Terminal 1 Delhi',
    't2': 'IGI Airport Terminal 2 Delhi',
    'charbagh': 'Lucknow Charbagh Railway Station',
    'lko': 'Lucknow Charbagh Railway Station',
    'cnb': 'Kanpur Central Railway Station',
    'csmt': 'Chhatrapati Shivaji Maharaj Terminus Mumbai',
    'bct': 'Mumbai Central Railway Station',
    'hwh': 'Howrah Junction Railway Station',
    'sbc': 'KSR Bengaluru City Railway Station',
    'mas': 'MGR Chennai Central Railway Station',
    'sec 62': 'Sector 62 Noida',
    'sec 18': 'Sector 18 Noida',
    'cyber hub': 'DLF Cyber City Gurugram',
    'cyber city': 'DLF Cyber City Gurugram',
    'palassio': 'Phoenix Palassio Lucknow',
    'lulu': 'Lulu Mall Lucknow',
    'hazratganj': 'Hazratganj Lucknow'
};

function normalizeQuery(input) {
    if (!input) return { raw: '', searchTarget: '', extraSuffix: '' };
    let q = input.trim();
    
    // Check abbreviation map
    const words = q.split(/\s+/);
    const firstWordLower = words[0].toLowerCase();
    
    if (INDIAN_ABBREVIATIONS[firstWordLower]) {
        words[0] = INDIAN_ABBREVIATIONS[firstWordLower];
        q = words.join(" ");
    } else {
        const fullLower = q.toLowerCase();
        for (const [abbr, expanded] of Object.entries(INDIAN_ABBREVIATIONS)) {
            if (fullLower.startsWith(abbr + " ") || fullLower === abbr) {
                q = expanded + q.substring(abbr.length);
                break;
            }
        }
    }

    // Extract suffixes like "Gate no. 1", "Gate 2", "Shop 4"
    let extraSuffix = '';
    const gateMatch = input.match(/(gate\s*no\.?\s*\d+|gate\s*\d+|platform\s*\d+|shop\s*\d+|flat\s*\d+)/i);
    if (gateMatch) {
        extraSuffix = gateMatch[0];
    }

    const cleanSearch = q
        .replace(/gate\s*no\.?\s*\d+/gi, '')
        .replace(/gate\s*\d+/gi, '')
        .replace(/platform\s*no\.?\s*\d+/gi, '')
        .replace(/flat\s*no\.?\s*\d+/gi, '')
        .trim();

    return { raw: input, searchTarget: cleanSearch || q, extraSuffix };
}

// GET /api/places/suggest?q=...
const suggestPlaces = async (req, res) => {
    try {
        const query = req.query.q || '';
        if (!query.trim() || query.trim().length < 2) {
            return res.json([]);
        }

        const { searchTarget, extraSuffix } = normalizeQuery(query);
        const results = [];
        const seen = new Set();

        const fetchWithTimeout = async (url, options = {}, timeoutMs = 2000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const response = await fetch(url, { ...options, signal: controller.signal });
                clearTimeout(id);
                return response;
            } catch (err) {
                clearTimeout(id);
                throw err;
            }
        };

        // Run Google Suggest, Photon OSM, and Nominatim in parallel
        const [googleRes, photonRes, nomRes] = await Promise.allSettled([
            // 1. Google Predictions
            fetchWithTimeout(`https://suggestqueries.google.com/complete/search?client=firefox&hl=en-IN&gl=in&q=${encodeURIComponent(query)}`, {}, 1500)
                .then(r => r.json()),
            
            // 2. Photon OSM
            fetchWithTimeout(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchTarget)}&lat=28.6139&lon=77.2090&limit=6`, {}, 1800)
                .then(r => r.json()),

            // 3. Nominatim India
            fetchWithTimeout(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTarget)}&countrycodes=in&addressdetails=1&limit=5`, {
                headers: { 'User-Agent': 'FlowLink-Logistics/1.0' }
            }, 1800)
                .then(r => r.json())
        ]);

        // Process Nominatim results first
        if (nomRes.status === 'fulfilled' && Array.isArray(nomRes.value)) {
            nomRes.value.forEach(item => {
                const name = item.name || item.display_name.split(',')[0].trim();
                const key = name.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    results.push({
                        title: extraSuffix ? `${name} (${extraSuffix})` : name,
                        subtitle: item.display_name,
                        fullAddress: extraSuffix ? `${name}, ${extraSuffix}, ${item.display_name}` : item.display_name,
                        lat: parseFloat(item.lat),
                        lng: parseFloat(item.lon),
                        source: 'nominatim'
                    });
                }
            });
        }

        // Process Photon results
        if (photonRes.status === 'fulfilled' && photonRes.value?.features) {
            photonRes.value.features.forEach(f => {
                const props = f.properties;
                const name = props.name || props.street || props.city;
                const subParts = [props.street, props.district, props.city, props.state, props.country].filter(Boolean);
                const subtitle = subParts.join(", ");
                const key = (name + " " + (props.city || "")).toLowerCase();
                
                if (name && !seen.has(key)) {
                    seen.add(key);
                    results.push({
                        title: extraSuffix ? `${name} (${extraSuffix})` : name,
                        subtitle: subtitle || "India",
                        fullAddress: extraSuffix ? `${name}, ${extraSuffix}, ${subtitle}` : (subtitle ? `${name}, ${subtitle}` : name),
                        lat: f.geometry.coordinates[1],
                        lng: f.geometry.coordinates[0],
                        source: 'photon'
                    });
                }
            });
        }

        // Process Google Search Suggestions
        if (googleRes.status === 'fulfilled' && Array.isArray(googleRes.value?.[1])) {
            googleRes.value[1].slice(0, 6).forEach(gText => {
                const cleanGText = gText.charAt(0).toUpperCase() + gText.slice(1);
                const key = cleanGText.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    results.push({
                        title: cleanGText,
                        subtitle: "Popular Landmark / Area in India",
                        fullAddress: cleanGText,
                        lat: results.length > 0 ? results[0].lat : 28.6139,
                        lng: results.length > 0 ? results[0].lng : 77.2090,
                        source: 'google'
                    });
                }
            });
        }

        res.json(results);
    } catch (error) {
        console.error("Places suggest error:", error);
        res.status(500).json({ error: "Failed to fetch place suggestions" });
    }
};

// GET /api/places/geocode?q=...
const geocodePlace = async (req, res) => {
    try {
        const query = req.query.q || '';
        if (!query.trim()) {
            return res.status(400).json({ error: "Query required" });
        }

        const { searchTarget } = normalizeQuery(query);

        // 1. Try Nominatim India
        try {
            const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTarget)}&countrycodes=in&limit=1`;
            const nomRes = await fetch(nomUrl, { headers: { 'User-Agent': 'FlowLink-Logistics/1.0' } });
            const nomData = await nomRes.json();
            if (nomData && nomData.length > 0) {
                return res.json({
                    lat: parseFloat(nomData[0].lat),
                    lng: parseFloat(nomData[0].lon),
                    display_name: nomData[0].display_name
                });
            }
        } catch (e) {}

        // 2. Try Photon fallback
        try {
            const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchTarget)}&limit=1`;
            const pRes = await fetch(photonUrl);
            const pData = await pRes.json();
            if (pData && pData.features && pData.features.length > 0) {
                const f = pData.features[0];
                return res.json({
                    lat: f.geometry.coordinates[1],
                    lng: f.geometry.coordinates[0],
                    display_name: [f.properties.name, f.properties.city, f.properties.state, f.properties.country].filter(Boolean).join(", ")
                });
            }
        } catch (e) {}

        // Fallback default coordinates
        return res.json({
            lat: 28.6139,
            lng: 77.2090,
            display_name: query
        });
    } catch (error) {
        console.error("Geocode error:", error);
        res.status(500).json({ error: "Geocoding failed" });
    }
};

module.exports = {
    suggestPlaces,
    geocodePlace
};
