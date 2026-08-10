import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { 
    FaMapMarkerAlt, 
    FaCheck, 
    FaSpinner, 
    FaSearch, 
    FaCrosshairs, 
    FaTimes, 
    FaTrain, 
    FaPlane, 
    FaShoppingBag 
} from 'react-icons/fa';
import './MapPicker.css';

const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [28, 44],
    iconAnchor: [14, 44],
    popupAnchor: [1, -34]
});

// Helper component to control map viewport smoothly
function MapController({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || 15, { duration: 1.2 });
        }
    }, [center, zoom, map]);
    return null;
}

// Map Click Handler Component
function LocationMarker({ position, setPosition, setAddress, setLoading }) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            setLoading(true);
            axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                .then(res => {
                    setAddress(res.data.display_name || "Custom Pin Location");
                })
                .catch(err => {
                    console.error("Reverse geocoding error:", err);
                    setAddress(`Pinned (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                })
                .finally(() => {
                    setLoading(false);
                });
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={defaultIcon} />
    );
}

const INDIAN_ABBREVIATIONS = {
    'ndls': 'New Delhi Railway Station',
    'dli': 'Old Delhi Railway Station',
    'nzm': 'Hazrat Nizamuddin Railway Station',
    'anvt': 'Anand Vihar Terminal Delhi',
    'cp': 'Connaught Place New Delhi',
    'igi': 'Indira Gandhi International Airport Delhi',
    't3': 'IGI Airport Terminal 3 Delhi',
    'charbagh': 'Lucknow Charbagh Railway Station',
    'lko': 'Lucknow Charbagh Railway Station',
    'palassio': 'Phoenix Palassio Lucknow',
    'lulu': 'Lulu Mall'
};

const MapPicker = ({ isOpen, onClose, onSelectLocation, initialPosition, title = "Pin Location on Map" }) => {
    const { theme } = useTheme();
    const isLight = theme === "light";

    const [position, setPosition] = useState(initialPosition || null);
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState(initialPosition || [28.6139, 77.2090]); // Delhi default
    const [mapZoom, setMapZoom] = useState(13);

    // Search state inside map modal
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchDebounce = useRef(null);

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            setPosition(null);
            setAddress("");
            setSearchQuery("");
            setSearchResults([]);
            setLoading(false);

            // Attempt to get user GPS location
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const userPos = [pos.coords.latitude, pos.coords.longitude];
                        setMapCenter(userPos);
                        setMapZoom(14);
                    },
                    () => {
                        setMapCenter([28.6139, 77.2090]); // Delhi fallback
                    }
                );
            }
        }
    }, [isOpen]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setShowResults(true);

        if (searchDebounce.current) clearTimeout(searchDebounce.current);
        if (!val.trim() || val.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        searchDebounce.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/places/suggest?q=${encodeURIComponent(val.trim())}`, { timeout: 3500 });
                if (res.data && res.data.length > 0) {
                    setSearchResults(res.data);
                } else {
                    setSearchResults([]);
                }
            } catch (err) {
                console.error("Map search error:", err);
            } finally {
                setSearchLoading(false);
            }
        }, 300);
    };

    const handleSelectSearchResult = async (item) => {
        let lat = item.lat;
        let lng = item.lng;
        const selectedAddress = item.fullAddress || item.subtitle || item.title;

        if (item.source === `google` || !lat || !lng) {
            try {
                const geoRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/places/geocode?q=${encodeURIComponent(item.title)}`);
                if (geoRes.data) {
                    lat = geoRes.data.lat;
                    lng = geoRes.data.lng;
                }
            } catch (e) {}
        }

        const validLat = lat || 28.6139;
        const validLng = lng || 77.2090;

        setPosition([validLat, validLng]);
        setAddress(selectedAddress);
        setMapCenter([validLat, validLng]);
        setMapZoom(16);
        setShowResults(false);
        setSearchQuery(item.title || item.fullAddress);
    };

    const handleUseCurrentLocation = () => {
        if ("geolocation" in navigator) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setPosition([lat, lng]);
                    setMapCenter([lat, lng]);
                    setMapZoom(16);

                    axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                        .then(res => {
                            setAddress(res.data.display_name || "My Current Location");
                        })
                        .catch(() => {
                            setAddress(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                        })
                        .finally(() => {
                            setLoading(false);
                        });
                },
                () => {
                    setLoading(false);
                    alert("Could not access GPS location. Please check location permissions.");
                }
            );
        }
    };

    if (!isOpen) return null;

    return (
        <div className="map-picker-overlay">
            <div className="map-picker-modal rounded-4 shadow-2xl overflow-hidden">
                {/* MODAL HEADER */}
                <div className="map-picker-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                        <div className="p-2 rounded-circle" style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00F0FF' }}>
                            <FaMapMarkerAlt />
                        </div>
                        <div>
                            <h5 className="mb-0 fw-bold text-white">Pick Location on Map</h5>
                            <span className="text-secondary small" style={{ fontSize: '11px' }}>Search any landmark or click on the map to drop a pin</span>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px' }}
                        onClick={onClose}
                    >
                        <FaTimes />
                    </button>
                </div>
                
                {/* MAP CONTAINER & SEARCH OVERLAY */}
                <div className="map-picker-body position-relative">
                    {/* IN-MAP SEARCH BAR */}
                    <div className="map-search-container">
                        <div className="input-group shadow-lg">
                            <span className="input-group-text bg-dark border-secondary text-info">
                                {searchLoading ? <FaSpinner className="fa-spin" /> : <FaSearch />}
                            </span>
                            <input 
                                type="text" 
                                className="form-control bg-dark text-white border-secondary"
                                placeholder="Search city, area, mall, metro, station (e.g. Phoenix Palassio)..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => setShowResults(true)}
                            />
                            <button 
                                type="button" 
                                className="btn btn-primary px-3 fw-bold d-flex align-items-center gap-1"
                                onClick={handleUseCurrentLocation}
                                title="Locate Me (GPS)"
                            >
                                <FaCrosshairs /> <span className="d-none d-sm-inline">GPS</span>
                            </button>
                        </div>

                        {/* SEARCH RESULTS DROPDOWN */}
                        {showResults && searchResults.length > 0 && (
                            <ul className="map-search-results shadow-lg rounded-3">
                                {searchResults.map((item, i) => (
                                    <li 
                                        key={i} 
                                        className="map-search-item px-3 py-2"
                                        onClick={() => handleSelectSearchResult(item)}
                                    >
                                        <div className="d-flex align-items-start gap-2">
                                            <FaMapMarkerAlt className="text-info mt-1 flex-shrink-0" />
                                            <div style={{ overflow: 'hidden' }}>
                                                <strong className="text-white d-block" style={{ fontSize: '13px' }}>
                                                    {item.title}
                                                </strong>
                                                <span className="text-secondary text-truncate d-block" style={{ fontSize: '11px' }}>
                                                    {item.subtitle}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* LEAFLET MAP */}
                    <MapContainer 
                        center={mapCenter} 
                        zoom={mapZoom} 
                        style={{ height: "420px", width: "100%" }}
                    >
                        <TileLayer
                            key={isLight ? "map-picker-voyager" : "map-picker-dark"}
                            url={
                                isLight
                                    ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            }
                            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        <MapController center={mapCenter} zoom={mapZoom} />
                        <LocationMarker 
                            position={position} 
                            setPosition={setPosition} 
                            setAddress={setAddress}
                            setLoading={setLoading}
                        />
                    </MapContainer>

                    {/* HINT OVERLAY */}
                    {!position && (
                        <div className="map-picker-hint shadow">
                            👆 Search above or click anywhere on the map to drop a pin.
                        </div>
                    )}
                </div>

                {/* MODAL FOOTER */}
                <div className="map-picker-footer p-3 border-top">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="flex-grow-1 me-3" style={{ maxWidth: '75%' }}>
                            <span className="small fw-bold text-secondary text-uppercase d-block" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
                                Selected Location:
                            </span>
                            {loading ? (
                                <span className="text-info small fw-bold"><FaSpinner className="fa-spin me-2"/>Fetching exact address...</span>
                            ) : (
                                <span className="small fw-medium text-white text-truncate d-block" style={{ fontSize: '12px' }}>
                                    {address || "Click on the map or select a search result"}
                                </span>
                            )}
                        </div>
                        <div className="d-flex gap-2">
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary px-3 rounded-pill"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                className="btn btn-primary fw-bold px-4 rounded-pill d-flex align-items-center gap-2 shadow" 
                                disabled={!address || loading}
                                onClick={() => onConfirm(address, position)}
                            >
                                <FaCheck /> Confirm Location
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapPicker;
