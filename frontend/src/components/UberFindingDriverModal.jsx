import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../context/ThemeContext';
import { 
    FaSearchLocation, 
    FaCheckCircle, 
    FaUserCheck, 
    FaTimes, 
    FaStar, 
    FaShieldAlt, 
    FaArrowRight, 
    FaRoute, 
    FaCar, 
    FaMotorcycle, 
    FaBoxOpen,
    FaPhoneAlt
} from 'react-icons/fa';
import './UberFindingDriverModal.css';

// Custom Pin Icons
const pickupIcon = L.divIcon({
    className: 'custom-pickup-pin',
    html: `<div class="pin-marker pickup-pin"><span class="pin-dot"></span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const dropIcon = L.divIcon({
    className: 'custom-drop-pin',
    html: `<div class="pin-marker drop-pin"><span class="pin-dot"></span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const driverVehicleIcon = (type) => L.divIcon({
    className: 'custom-driver-pin',
    html: `<div class="driver-car-marker"><span class="car-emoji">${type === 'Bike' ? '🛵' : '🚗'}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

const UberFindingDriverModal = ({ isOpen, parcel, onClose }) => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [matchingStep, setMatchingStep] = useState(0); 
    const [matchedDriver, setMatchedDriver] = useState(null);
    const [nearbyDrivers, setNearbyDrivers] = useState([]);
    const [routeCoords, setRouteCoords] = useState([]);

    const pLat = parseFloat(parcel?.pickup_lat || 28.6139);
    const pLng = parseFloat(parcel?.pickup_lng || 77.2090);
    const dLat = parseFloat(parcel?.drop_lat || 28.6448);
    const dLng = parseFloat(parcel?.drop_lng || 77.2167);

    // Initial setup when modal opens
    useEffect(() => {
        if (!isOpen || !parcel) return;

        setMatchingStep(0);
        setMatchedDriver(null);

        // Generate 3 simulated nearby commuter drivers around pickup location
        const randomDrivers = [
            {
                id: 1,
                name: 'Rahul Sharma',
                phone: '+91 98765 43210',
                vehicle: 'Hero Splendor Plus',
                plate: 'UP 32 KP 8347',
                vehicleType: 'Bike',
                rating: '4.9',
                trips: 240,
                lat: pLat + 0.004,
                lng: pLng + 0.005,
                etaMins: 3
            },
            {
                id: 2,
                name: 'Amit Verma',
                phone: '+91 88539 09885',
                vehicle: 'Maruti Suzuki Eeco',
                plate: 'UP 16 AB 1234',
                vehicleType: 'Car',
                rating: '4.8',
                trips: 189,
                lat: pLat - 0.005,
                lng: pLng + 0.003,
                etaMins: 5
            },
            {
                id: 3,
                name: 'Suresh Kumar',
                phone: '+91 91234 56789',
                vehicle: 'Bajaj Pulsar 150',
                plate: 'UP 72 QJ 3473',
                vehicleType: 'Bike',
                rating: '5.0',
                trips: 312,
                lat: pLat + 0.003,
                lng: pLng - 0.004,
                etaMins: 4
            }
        ];
        setNearbyDrivers(randomDrivers);

        // Fetch connecting driving route from OSRM
        fetch(`https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`)
            .then(res => res.json())
            .then(data => {
                if (data.routes && data.routes.length > 0) {
                    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    setRouteCoords(coords);
                } else {
                    setRouteCoords([[pLat, pLng], [dLat, dLng]]);
                }
            })
            .catch(() => {
                setRouteCoords([[pLat, pLng], [dLat, dLng]]);
            });

        // Step 1: Scanning for drivers (0 - 2.8s)
        const t1 = setTimeout(() => {
            setMatchingStep(1); // Evaluating nearest commuter routes
        }, 2800);

        // Step 2: Driver found and matched (5.8s)
        const t2 = setTimeout(() => {
            setMatchingStep(2); // Driver matched!
            setMatchedDriver(randomDrivers[0]);
        }, 5800);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [isOpen, parcel]);

    if (!isOpen || !parcel) return null;

    const isShared = parcel.delivery_tier === 'saver' || !parcel.delivery_tier;
    const center = [(pLat + dLat) / 2, (pLng + dLng) / 2];

    const handleGoToTracking = () => {
        onClose();
        navigate(`/tracking?id=${parcel.id}`);
    };

    return (
        <div className="uber-finding-modal-overlay">
            <div className="uber-finding-modal-container">
                
                {/* TOP FLOATING HEADER */}
                <div className="uber-finding-topbar">
                    <div className="d-flex align-items-center gap-2">
                        <div className="radar-live-badge">
                            <span className="live-dot"></span> LIVE DISPATCH
                        </div>
                        <span className={`badge ${isShared ? 'bg-success' : 'bg-primary'} rounded-pill px-3 py-1 fw-bold`} style={{ fontSize: '11px' }}>
                            {isShared ? '🟢 Shared Route' : '⚡ Priority Direct'} • ₹{parcel.price || '35.00'}
                        </span>
                    </div>
                    <button 
                        className="btn-cancel-search" 
                        onClick={onClose}
                        title="Cancel Search"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* LEAFLET INTERACTIVE RADAR MAP */}
                <div className="uber-finding-map-wrapper">
                    <MapContainer 
                        center={center} 
                        zoom={13} 
                        zoomControl={false}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            key={isLight ? "uber-modal-voyager" : "uber-modal-dark"}
                            url={
                                isLight
                                    ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            }
                            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />

                        {/* Radar Scan Pulse Ring around Pickup */}
                        <Circle 
                            center={[pLat, pLng]} 
                            radius={matchingStep < 2 ? 1200 : 300}
                            pathOptions={{
                                color: isShared ? '#10B981' : '#00F0FF',
                                fillColor: isShared ? '#10B981' : '#00F0FF',
                                fillOpacity: 0.15,
                                weight: 2,
                                dashArray: matchingStep < 2 ? '6, 6' : null
                            }}
                        />

                        {/* Pickup Marker */}
                        <Marker position={[pLat, pLng]} icon={pickupIcon}>
                            <Popup><strong>Pickup:</strong> {parcel.pickup_address}</Popup>
                        </Marker>

                        {/* Drop Marker */}
                        <Marker position={[dLat, dLng]} icon={dropIcon}>
                            <Popup><strong>Drop:</strong> {parcel.drop_address}</Popup>
                        </Marker>

                        {/* Connected Route Polyline */}
                        {routeCoords.length > 0 && (
                            <Polyline 
                                positions={routeCoords} 
                                color={isShared ? '#10B981' : '#3B82F6'} 
                                weight={5} 
                                opacity={0.8} 
                            />
                        )}

                        {/* Nearby Commuter Driver Markers */}
                        {nearbyDrivers.map(d => (
                            <Marker 
                                key={d.id} 
                                position={[d.lat, d.lng]} 
                                icon={driverVehicleIcon(d.vehicleType)}
                            >
                                <Popup>
                                    <strong>{d.name}</strong><br/>
                                    {d.vehicle} ({d.plate})<br/>
                                    ⭐ {d.rating}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* BOTTOM FLOATING UBER CARD */}
                <div className="uber-finding-bottom-card shadow-2xl">
                    
                    {matchingStep < 2 ? (
                        // STATE A: SEARCHING RADAR ANIMATION
                        <div className="searching-driver-box">
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <div className="uber-radar-spinner">
                                    <div className="radar-circle circle-1"></div>
                                    <div className="radar-circle circle-2"></div>
                                    <div className="radar-circle circle-3"></div>
                                    <FaSearchLocation className="radar-center-icon" />
                                </div>
                                <div>
                                    <h5 className="fw-bold text-white mb-1">
                                        {matchingStep === 0 ? "Finding nearby drivers..." : "Matching best route & vehicle..."}
                                    </h5>
                                    <p className="text-secondary small mb-0">
                                        {isShared 
                                            ? "Scanning commuters traveling along your delivery corridor" 
                                            : "Locating nearest dedicated express courier"}
                                    </p>
                                </div>
                            </div>

                            {/* PROGRESS STEP BAR */}
                            <div className="search-step-progress mb-3">
                                <div className={`step-bar-fill ${matchingStep === 1 ? 'step-evaluating' : 'step-scanning'}`}></div>
                            </div>

                            {/* TRIP DETAILS STRIP */}
                            <div className="trip-summary-strip p-2 px-3 rounded-3 mb-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="text-truncate me-2" style={{ maxWidth: '70%' }}>
                                        <span className="text-success fw-bold small me-1">From:</span>
                                        <span className="text-white small text-truncate">{parcel.pickup_address}</span>
                                    </div>
                                    <span className="fw-bold text-info small">₹{parcel.price || '35.00'}</span>
                                </div>
                            </div>

                            <button 
                                className="btn btn-outline-secondary w-100 rounded-pill py-2 text-white border-secondary"
                                onClick={handleGoToTracking}
                            >
                                Track in Background & View Details
                            </button>
                        </div>
                    ) : (
                        // STATE B: DRIVER FOUND! MATCHED CARD
                        <div className="matched-driver-box animate-pop-in">
                            <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom border-secondary border-opacity-25">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="matched-check-icon">
                                        <FaCheckCircle />
                                    </div>
                                    <div>
                                        <h5 className="fw-bold text-white mb-0">Driver Found & Assigned!</h5>
                                        <span className="text-success small fw-bold d-flex align-items-center gap-1">
                                            <FaShieldAlt /> Commuter Corridor Verified
                                        </span>
                                    </div>
                                </div>
                                <span className="badge bg-success bg-opacity-25 text-success rounded-pill px-3 py-1 fw-bold fs-6">
                                    ₹{parcel.price || '35.00'}
                                </span>
                            </div>

                            {/* DRIVER INFO ROW */}
                            <div className="driver-profile-card p-3 rounded-4 mb-3 d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="driver-avatar-circle">
                                        {matchedDriver?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h6 className="fw-bold text-white mb-1">{matchedDriver?.name}</h6>
                                        <div className="text-secondary small d-flex align-items-center gap-2">
                                            <span className="text-warning fw-bold"><FaStar /> {matchedDriver?.rating}</span>
                                            <span>•</span>
                                            <span>{matchedDriver?.vehicle}</span>
                                        </div>
                                        <span className="badge bg-dark text-info border border-info border-opacity-50 mt-1 font-monospace" style={{ fontSize: '10px' }}>
                                            {matchedDriver?.plate}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-end">
                                    <span className="text-secondary small d-block" style={{ fontSize: '11px' }}>Pickup ETA</span>
                                    <strong className="text-warning fs-5">~{matchedDriver?.etaMins} mins</strong>
                                </div>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="d-flex gap-2">
                                <button 
                                    className="btn btn-outline-secondary rounded-pill px-3 d-flex align-items-center justify-content-center"
                                    onClick={() => alert(`Calling driver ${matchedDriver?.name}: ${matchedDriver?.phone}`)}
                                    title="Call Driver"
                                >
                                    <FaPhoneAlt className="text-success" />
                                </button>
                                <button 
                                    className="btn btn-primary flex-grow-1 rounded-pill fw-bold py-2 shadow-lg d-flex align-items-center justify-content-center gap-2"
                                    style={{
                                        background: 'linear-gradient(135deg, #00F0FF, #3B82F6)',
                                        color: '#050914',
                                        border: 'none',
                                        fontSize: '15px'
                                    }}
                                    onClick={handleGoToTracking}
                                >
                                    Track Live Delivery on Map <FaArrowRight />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UberFindingDriverModal;
