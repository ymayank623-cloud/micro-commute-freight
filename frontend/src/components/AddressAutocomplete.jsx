import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaMapMarkedAlt, FaMapMarkerAlt, FaSearchLocation, FaBuilding, FaTrain, FaPlane, FaShoppingBag } from 'react-icons/fa';
import MapPicker from './MapPicker';
import './AddressAutocomplete.css';

// Indian Abbreviation and Major Transit/Commercial Landmark Map
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
    'lulu': 'Lulu Mall',
    'hazratganj': 'Hazratganj Lucknow'
};

function normalizeAddressQuery(input) {
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

const AddressAutocomplete = ({ value, onChange, name, placeholder, required, className }) => {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debounceTimer = useRef(null);

    // Sync external value changes (e.g. when editing a parcel)
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    const fetchSuggestions = async (searchQuery) => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        setLoading(true);

        try {
            // Fetch Google-style predictions + OSM Indian Places from backend
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/places/suggest?q=${encodeURIComponent(searchQuery)}`, { timeout: 3500 });
            if (res.data && res.data.length > 0) {
                setSuggestions(res.data);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error("Geocoding search error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setShowDropdown(true);
        setActiveIndex(-1);

        if (onChange) onChange({ target: { name, value: val } });

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        
        debounceTimer.current = setTimeout(() => {
            fetchSuggestions(val);
        }, 300); // 300ms fast response
    };

    const handleSelect = async (item) => {
        let lat = item.lat;
        let lng = item.lng;
        const selectedAddress = item.fullAddress || item.subtitle || item.title;

        // If from google search prediction or missing coordinates
        if (item.source === `google` || !lat || !lng) {
            try {
                const geoRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/places/geocode?q=${encodeURIComponent(item.title || selectedAddress)}`);
                if (geoRes.data && geoRes.data.lat && geoRes.data.lng) {
                    lat = geoRes.data.lat;
                    lng = geoRes.data.lng;
                }
            } catch (e) {
                console.error("Geocoding failed for item", e);
            }
        }

        setQuery(selectedAddress);
        setShowDropdown(false);
        if (onChange) {
            onChange({ 
                target: { name, value: selectedAddress }, 
                lat: lat, 
                lng: lng 
            });
        }
    };

    const handleKeyDown = (e) => {
        if (!showDropdown || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            handleSelect(suggestions[activeIndex]);
        }
    };

    const handleBlur = () => {
        setTimeout(async () => {
            setShowDropdown(false);
            // If user typed/pasted an address manually, auto-geocode on leaving the field
            if (query && query.trim().length >= 3) {
                try {
                    const geoRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/places/geocode?q=${encodeURIComponent(query.trim())}`);
                    if (geoRes.data?.lat && geoRes.data?.lng) {
                        if (onChange) {
                            onChange({ 
                                target: { name, value: query }, 
                                lat: geoRes.data.lat, 
                                lng: geoRes.data.lng 
                            });
                        }
                    }
                } catch (e) {}
            }
        }, 200);
    };

    const handleMapConfirm = (address, position) => {
        setQuery(address);
        setIsMapOpen(false);
        if (onChange) {
            onChange({ 
                target: { name, value: address },
                lat: position ? position[0] : null,
                lng: position ? position[1] : null
            });
        }
    };

    const getItemIcon = (title) => {
        const t = (title || '').toLowerCase();
        if (t.includes('railway') || t.includes('station') || t.includes('terminal') || t.includes('junction')) {
            return <FaTrain className="text-warning me-2 mt-1 flex-shrink-0" />;
        }
        if (t.includes('airport') || t.includes('terminal') || t.includes('igi')) {
            return <FaPlane className="text-info me-2 mt-1 flex-shrink-0" />;
        }
        if (t.includes('mall') || t.includes('market') || t.includes('complex') || t.includes('plaza')) {
            return <FaShoppingBag className="text-success me-2 mt-1 flex-shrink-0" />;
        }
        return <FaMapMarkerAlt className="text-primary me-2 mt-1 flex-shrink-0" />;
    };

    return (
        <div className="address-autocomplete-wrapper relative w-full">
            <div className="flex items-stretch w-full">
                <input
                    type="text"
                    className="w-full flex-1 px-4 py-2.5 rounded-l-xl bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-slate-500 text-sm font-medium transition-all outline-none"
                    name={name}
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    onFocus={() => { if(query.length >= 2) setShowDropdown(true); }}
                    placeholder={placeholder}
                    required={required}
                    autoComplete="off"
                />
                <button 
                    type="button" 
                    className="px-3.5 py-2.5 rounded-r-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-l-0 border-emerald-500/30 text-emerald-400 hover:text-emerald-300 flex items-center justify-center transition-all cursor-pointer shadow-[0_0_10px_rgba(0,255,102,0.1)] flex-shrink-0"
                    onClick={() => setIsMapOpen(true)}
                    title="Pick location on map"
                >
                    <FaMapMarkedAlt className="text-base" />
                </button>
            </div>
            
            {showDropdown && (query.length >= 2) && (
                <ul className="address-autocomplete-dropdown shadow rounded glass-dropdown">
                    {loading && (
                        <li className="dropdown-item small px-3 py-2 text-info d-flex align-items-center gap-2">
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Searching places in India...
                        </li>
                    )}
                    
                    {!loading && suggestions.length === 0 && (
                        <li 
                            className="dropdown-item small px-3 py-2 suggestion-item"
                            onClick={() => {
                                setShowDropdown(false);
                            }}
                        >
                            <div className="d-flex align-items-start">
                                <FaSearchLocation className="text-info me-2 mt-1" />
                                <div>
                                    <strong className="d-block text-white">Use address:</strong>
                                    <span className="text-secondary" style={{ fontSize: '11px' }}>"{query}"</span>
                                </div>
                            </div>
                        </li>
                    )}

                    {!loading && suggestions.map((item, index) => (
                        <li 
                            key={index} 
                            className={`dropdown-item suggestion-item ${index === activeIndex ? 'active-suggestion' : ''}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(item);
                            }}
                            onClick={() => handleSelect(item)}
                        >
                            <div className="d-flex align-items-start gap-2">
                                <div className="mt-1 flex-shrink-0" style={{ fontSize: '16px' }}>
                                    {getItemIcon(item.title)}
                                </div>
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                    <strong className="suggestion-title d-block text-truncate">
                                        {item.title}
                                    </strong>
                                    <div className="suggestion-subtitle text-truncate">
                                        {item.subtitle}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <MapPicker 
                isOpen={isMapOpen} 
                onClose={() => setIsMapOpen(false)} 
                onConfirm={handleMapConfirm} 
            />
        </div>
    );
};

export default AddressAutocomplete;
