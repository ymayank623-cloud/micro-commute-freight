import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    FaRoute, 
    FaUserCheck, 
    FaCar, 
    FaClock, 
    FaCheckCircle, 
    FaPlus, 
    FaTimes, 
    FaMapPin, 
    FaInfoCircle, 
    FaSlidersH,
    FaArrowRight,
    FaShieldAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import './DriverRouteMatcher.css';

// Custom Map Bounds Fitter
function MapBoundsHandler({ waypoints }) {
    const map = useMap();
    useEffect(() => {
        if (!waypoints || waypoints.length === 0) return;
        try {
            const valid = waypoints.filter(p => p && !isNaN(p[0]) && !isNaN(p[1]));
            if (valid.length > 0) {
                const bounds = L.latLngBounds(valid);
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
            }
        } catch (e) {
            console.error('Fit bounds error:', e);
        }
    }, [map, waypoints]);
    return null;
}

// Marker DivIcons
const passengerPickupIcon = L.divIcon({
    className: 'custom-commuter-pin',
    html: `<div class="pin-bubble pin-passenger-p">📍</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const passengerDropIcon = L.divIcon({
    className: 'custom-commuter-pin',
    html: `<div class="pin-bubble pin-passenger-d">🎯</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const driverStartIcon = L.divIcon({
    className: 'custom-commuter-pin',
    html: `<div class="pin-bubble pin-driver-start">🏍️</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const driverEndIcon = L.divIcon({
    className: 'custom-commuter-pin',
    html: `<div class="pin-bubble pin-driver-end">🏁</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const POPULAR_CORRIDORS = [
    {
        name: 'Aman Verma',
        corridor: 'Knowledge Park II ➔ Botanical Garden',
        pickupAddress: 'Knowledge Park II, Greater Noida',
        pickupLat: 28.4619,
        pickupLng: 77.4988,
        dropAddress: 'Botanical Garden Metro Station, Noida',
        dropLat: 28.5645,
        dropLng: 77.3344,
        time: '08:30 AM',
        vehicle: 'UP16 BX 4421 • Bike'
    },
    {
        name: 'Rahul Sharma',
        corridor: 'Pari Chowk ➔ Sector 62 IT Park',
        pickupAddress: 'Pari Chowk, Greater Noida',
        pickupLat: 28.4716,
        pickupLng: 77.5093,
        dropAddress: 'Sector 62 IT Park, Noida',
        dropLat: 28.6258,
        dropLng: 77.3648,
        time: '09:00 AM',
        vehicle: 'UP16 EF 8890 • Bike'
    },
    {
        name: 'Pooja Malhotra',
        corridor: 'Sector 18 Noida ➔ Connaught Place',
        pickupAddress: 'Sector 18, Noida',
        pickupLat: 28.5708,
        pickupLng: 77.3260,
        dropAddress: 'Connaught Place, New Delhi',
        dropLat: 28.6315,
        dropLng: 77.2167,
        time: '09:15 AM',
        vehicle: 'DL3S CP 5512 • Bike'
    },
    {
        name: 'Kabir Mehta',
        corridor: 'DLF Cyber City ➔ Saket Metro',
        pickupAddress: 'DLF Cyber City, Gurugram',
        pickupLat: 28.4986,
        pickupLng: 77.0898,
        dropAddress: 'Saket Metro Station, South Delhi',
        dropLat: 28.5204,
        dropLng: 77.2014,
        time: '08:45 AM',
        vehicle: 'HR26 DK 1109 • Bike'
    },
    {
        name: 'Sandeep Kumar',
        corridor: 'Indirapuram ➔ Anand Vihar Terminal',
        pickupAddress: 'Indirapuram, Ghaziabad',
        pickupLat: 28.6415,
        pickupLng: 77.3712,
        dropAddress: 'Anand Vihar Terminal, Delhi',
        dropLat: 28.6502,
        dropLng: 77.3153,
        time: '08:15 AM',
        vehicle: 'UP14 BL 3320 • Bike'
    }
];

export default function DriverRouteMatcher({
    pickupLat,
    pickupLng,
    dropLat,
    dropLng,
    pickupAddress,
    dropAddress,
    weight = 1.0,
    seats = 1,
    onSelectDriverTrip,
    onApplyCorridor
}) {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTripId, setActiveTripId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joinedTrip, setJoinedTrip] = useState(null);

    // New Trip Form state for driver offering a ride
    const [newTripForm, setNewTripForm] = useState({
        driverName: '',
        driverPhone: '',
        vehicleNumber: '',
        sourceLocation: '',
        destinationLocation: '',
        departureTime: '08:30:00',
        availableSeats: 1,
        cargoCapacityKg: 15
    });
    const [creatingTrip, setCreatingTrip] = useState(false);

    // Fetch matching commuter driver trips whenever passenger points change
    const fetchMatches = async () => {
        if (!pickupLat || !pickupLng || !dropLat || !dropLng) return;
        setLoading(true);

        try {
            const url = `${import.meta.env.VITE_API_URL}/api/trips/matches?pickupLat=${pickupLat}&pickupLng=${pickupLng}&dropLat=${dropLat}&dropLng=${dropLng}&weight=${weight}&seats=${seats}`;
            const res = await axios.get(url);
            if (res.data?.matches) {
                setMatches(res.data.matches);
                if (res.data.matches.length > 0 && !activeTripId) {
                    setActiveTripId(res.data.matches[0].tripId);
                }
            }
        } catch (err) {
            console.error('Failed to fetch matched trips:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, [pickupLat, pickupLng, dropLat, dropLng, weight, seats]);

    const activeTrip = useMemo(() => {
        if (!matches || matches.length === 0) return null;
        return matches.find(m => m.tripId === activeTripId) || matches[0];
    }, [matches, activeTripId]);

    // Format coordinates from GeoJSON [lng, lat] to Leaflet [lat, lng]
    const driverRoutePolyline = useMemo(() => {
        if (!activeTrip?.routeGeometry?.coordinates) return [];
        return activeTrip.routeGeometry.coordinates.map(c => [c[1], c[0]]);
    }, [activeTrip]);

    const detourPolyline = useMemo(() => {
        if (!activeTrip?.detourGeometry?.coordinates) return [];
        return activeTrip.detourGeometry.coordinates.map(c => [c[1], c[0]]);
    }, [activeTrip]);

    // Map waypoints to fit bounds
    const mapBoundsWaypoints = useMemo(() => {
        const pts = [];
        if (pickupLat && pickupLng) pts.push([parseFloat(pickupLat), parseFloat(pickupLng)]);
        if (dropLat && dropLng) pts.push([parseFloat(dropLat), parseFloat(dropLng)]);
        if (activeTrip?.sourceCoords) pts.push([activeTrip.sourceCoords.lat, activeTrip.sourceCoords.lng]);
        if (activeTrip?.destCoords) pts.push([activeTrip.destCoords.lat, activeTrip.destCoords.lng]);
        if (driverRoutePolyline.length > 0) {
            pts.push(driverRoutePolyline[0]);
            pts.push(driverRoutePolyline[Math.floor(driverRoutePolyline.length / 2)]);
            pts.push(driverRoutePolyline[driverRoutePolyline.length - 1]);
        }
        return pts;
    }, [pickupLat, pickupLng, dropLat, dropLng, activeTrip, driverRoutePolyline]);

    // Handle Join Trip
    const handleJoinTrip = async (trip) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/trips/${trip.tripId}/join`, {
                passengerName: 'Passenger / Shipper',
                passengerPhone: '+91 98765 00000',
                parcelWeight: weight,
                seats: seats,
                pickupAddress,
                dropAddress
            });

            toast.success(`🎉 Booked with commuter driver ${trip.driverName}!`);
            setJoinedTrip({
                ...res.data.bookingDetails,
                driverName: trip.driverName,
                vehicleNumber: trip.vehicleNumber,
                matchScore: trip.matchScore,
                departureTime: trip.departureTime
            });

            if (onSelectDriverTrip) {
                onSelectDriverTrip(trip);
            }
            fetchMatches();
        } catch (err) {
            console.error('Join trip error:', err);
            toast.error(err.response?.data?.error || 'Failed to join trip');
        }
    };

    // Handle Create New Commuter Trip
    const handleCreateTripSubmit = async (e) => {
        e.preventDefault();
        setCreatingTrip(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/trips`, newTripForm);
            toast.success('🚗 Commuter route published to PostGIS network!');
            setShowCreateModal(false);
            setNewTripForm({
                driverName: '',
                driverPhone: '',
                vehicleNumber: '',
                sourceLocation: '',
                destinationLocation: '',
                departureTime: '08:30:00',
                availableSeats: 1,
                cargoCapacityKg: 15
            });
            fetchMatches();
        } catch (err) {
            console.error('Error creating trip:', err);
            toast.error(err.response?.data?.error || 'Failed to create commuter trip');
        } finally {
            setCreatingTrip(false);
        }
    };

    return (
        <div className="route-matcher-card mt-8 p-5 sm:p-7">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(0,255,102,0.3)]">
                            <FaRoute className="text-xl" />
                        </span>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                Driver Route Matching
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    PostGIS Spatial Engine
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Realtime matching of planned commuter routes passing through your pickup & dropoff corridor
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,255,102,0.15)] cursor-pointer"
                    >
                        <FaPlus className="text-xs" /> Offer a Commute Route
                    </button>
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-black/60 text-white border border-white/10 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        {matches.length} {matches.length === 1 ? 'Commuter Found' : 'Commuters Found'}
                    </span>
                </div>
            </div>

            {/* Quick Corridor Selection Bar */}
            <div className="mt-4 pt-3.5 border-t border-emerald-500/15">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="text-emerald-400">⚡</span> Active Verified Commuter Corridors:
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold hidden sm:inline">
                        Click to auto-fill & match on map
                    </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {POPULAR_CORRIDORS.map((c, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => {
                                if (onApplyCorridor) {
                                    onApplyCorridor(c);
                                }
                            }}
                            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/80 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                        >
                            <span className="text-emerald-400 text-sm">🏍️</span>
                            <span>{c.corridor}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                                {c.name.split(' ')[0]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Grid: Match List (Left) + Interactive Map (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
                
                {/* MATCHED DRIVER CARDS (7 Cols) */}
                <div className="lg:col-span-7 space-y-4">
                    {loading ? (
                        <div className="p-8 text-center bg-black/40 border border-emerald-500/20 rounded-2xl">
                            <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto mb-3"></div>
                            <p className="text-sm font-semibold text-emerald-300">Searching PostGIS spatial indices & computing road detours...</p>
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="p-8 text-center bg-black/40 border border-white/10 rounded-2xl space-y-3">
                            <span className="text-3xl">🛰️</span>
                            <h4 className="text-base font-bold text-white">No Direct Commuters on this corridor yet</h4>
                            <p className="text-xs text-slate-400 max-w-md mx-auto">
                                No registered commuters are currently traveling along this exact directional route. You can publish a commuter trip or proceed with our on-demand courier dispatch above!
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
                                className="mt-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                            >
                                + Offer a Commute Route along this corridor
                            </button>
                        </div>
                    ) : (
                        matches.map((trip) => {
                            const isActive = trip.tripId === activeTripId;

                            return (
                                <div
                                    key={trip.tripId}
                                    onClick={() => setActiveTripId(trip.tripId)}
                                    className={`match-item-card p-4 sm:p-5 relative ${isActive ? 'active-match' : ''}`}
                                >
                                    {/* Card Header: Driver & Score Badge */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg text-emerald-400 font-black">
                                                🏍️
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-bold text-white">
                                                        {trip.driverName}
                                                    </h4>
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                                                        {trip.vehicleNumber}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                                    <span>🕒 Departs {trip.departureTime?.slice(0, 5)}</span>
                                                    <span>•</span>
                                                    <span>{trip.availableSeats} seat available</span>
                                                    <span>•</span>
                                                    <span>{trip.cargoCapacityKg} kg max</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Glowing Score Badge */}
                                        <div 
                                            className="match-score-badge self-start sm:self-auto"
                                            style={{ color: trip.tierColor }}
                                        >
                                            <span className="text-sm font-black">{trip.matchScore}%</span>
                                            <span>{trip.matchTier}</span>
                                        </div>
                                    </div>

                                    {/* Origin & Destination */}
                                    <div className="py-3 text-xs space-y-1.5 border-b border-white/5">
                                        <div className="flex items-start gap-2 text-slate-300">
                                            <span className="text-blue-400 font-bold mt-0.5">FROM:</span>
                                            <span className="text-slate-200 line-clamp-1">{trip.sourceAddress}</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-slate-300">
                                            <span className="text-purple-400 font-bold mt-0.5">TO:</span>
                                            <span className="text-slate-200 line-clamp-1">{trip.destinationAddress}</span>
                                        </div>
                                    </div>

                                    {/* Detour Analysis & Proximity Metrics */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3">
                                        <div className="detour-metric-pill">
                                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Extra Detour</span>
                                            <span className="text-xs font-bold text-emerald-400">
                                                +{trip.extraDistanceKm} km
                                            </span>
                                        </div>

                                        <div className="detour-metric-pill">
                                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Detour Time</span>
                                            <span className="text-xs font-bold text-amber-400">
                                                +{trip.extraTimeMins} mins
                                            </span>
                                        </div>

                                        <div className="detour-metric-pill">
                                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Pickup Proximity</span>
                                            <span className="text-xs font-bold text-cyan-400">
                                                {trip.pickupDistanceMeters} m
                                            </span>
                                        </div>

                                        <div className="detour-metric-pill">
                                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Drop Proximity</span>
                                            <span className="text-xs font-bold text-teal-400">
                                                {trip.dropDistanceMeters} m
                                            </span>
                                        </div>
                                    </div>

                                    {/* PostGIS Direction Verification & Action */}
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
                                        <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                                            <FaCheckCircle className="text-emerald-400" /> Verified Direction: Pickup before Dropoff
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleJoinTrip(trip);
                                            }}
                                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-extrabold text-xs shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:shadow-[0_0_20px_rgba(0,255,102,0.5)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <FaUserCheck /> Book with this Commuter
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* INTERACTIVE LEAFLET MAP VISUALIZATION (5 Cols) */}
                <div className="lg:col-span-5 space-y-3">
                    <div className="p-3 bg-black/60 border border-emerald-500/20 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between text-xs px-1">
                            <span className="font-bold text-white flex items-center gap-1.5">
                                <FaRoute className="text-emerald-400" /> Commuter Route & Detour Map
                            </span>
                            {activeTrip && (
                                <span className="text-[10px] text-slate-400">
                                    Driver: <strong className="text-white">{activeTrip.driverName.split(' ')[0]}</strong>
                                </span>
                            )}
                        </div>

                        {/* Leaflet Container */}
                        <div className="match-map-container relative">
                            {pickupLat && pickupLng ? (
                                <MapContainer
                                    center={[parseFloat(pickupLat), parseFloat(pickupLng)]}
                                    zoom={12}
                                    scrollWheelZoom={false}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />

                                    {/* Auto-fitter */}
                                    <MapBoundsHandler waypoints={mapBoundsWaypoints} />

                                    {/* Passenger Pickup Pin */}
                                    <Marker position={[parseFloat(pickupLat), parseFloat(pickupLng)]} icon={passengerPickupIcon}>
                                        <Popup>
                                            <div className="text-xs font-bold">📍 Your Pickup</div>
                                            <div className="text-[10px] text-slate-600">{pickupAddress}</div>
                                        </Popup>
                                    </Marker>

                                    {/* Passenger Drop Pin */}
                                    {dropLat && dropLng && (
                                        <Marker position={[parseFloat(dropLat), parseFloat(dropLng)]} icon={passengerDropIcon}>
                                            <Popup>
                                                <div className="text-xs font-bold">🎯 Your Dropoff</div>
                                                <div className="text-[10px] text-slate-600">{dropAddress}</div>
                                            </Popup>
                                        </Marker>
                                    )}

                                    {/* Driver Source & Destination Pins */}
                                    {activeTrip?.sourceCoords && (
                                        <Marker position={[activeTrip.sourceCoords.lat, activeTrip.sourceCoords.lng]} icon={driverStartIcon}>
                                            <Popup>
                                                <div className="text-xs font-bold">🏍️ Driver Origin</div>
                                                <div className="text-[10px] text-slate-600">{activeTrip.sourceAddress}</div>
                                            </Popup>
                                        </Marker>
                                    )}

                                    {activeTrip?.destCoords && (
                                        <Marker position={[activeTrip.destCoords.lat, activeTrip.destCoords.lng]} icon={driverEndIcon}>
                                            <Popup>
                                                <div className="text-xs font-bold">🏁 Driver Destination</div>
                                                <div className="text-[10px] text-slate-600">{activeTrip.destinationAddress}</div>
                                            </Popup>
                                        </Marker>
                                    )}

                                    {/* Driver Planned Route Polyline (Green) */}
                                    {driverRoutePolyline.length > 0 && (
                                        <Polyline
                                            positions={driverRoutePolyline}
                                            pathOptions={{
                                                color: '#00FF66',
                                                weight: 5,
                                                opacity: 0.85
                                            }}
                                        />
                                    )}

                                    {/* Detour Route Polyline (Dashed Amber) */}
                                    {detourPolyline.length > 0 && (
                                        <Polyline
                                            positions={detourPolyline}
                                            pathOptions={{
                                                color: '#F59E0B',
                                                weight: 3.5,
                                                opacity: 0.9,
                                                dashArray: '6, 8'
                                            }}
                                        />
                                    )}
                                </MapContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                                    Enter pickup & dropoff to render map
                                </div>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-2 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-1 bg-[#00FF66] rounded-full inline-block"></span>
                                <span>Driver Road Route</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-1 bg-[#F59E0B] rounded-full inline-block"></span>
                                <span>Detour Pickup/Drop Leg</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span>📍</span>
                                <span>Your Pickup</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span>🎯</span>
                                <span>Your Dropoff</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONFIRMATION OVERLAY IF BOOKED */}
            {joinedTrip && (
                <div className="mt-5 p-4 rounded-xl bg-emerald-500/15 border border-emerald-400 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl text-emerald-400">✅</span>
                        <div>
                            <h4 className="font-bold text-sm text-emerald-300">
                                Matched with {joinedTrip.driverName}!
                            </h4>
                            <p className="text-xs text-slate-300">
                                Vehicle: <strong>{joinedTrip.vehicleNumber}</strong> • Departs at: <strong>{joinedTrip.departureTime}</strong> • Contact: <strong>{joinedTrip.driverPhone}</strong>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setJoinedTrip(null)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-400 text-black font-extrabold text-xs cursor-pointer hover:bg-emerald-300"
                    >
                        Done
                    </button>
                </div>
            )}

            {/* MODAL: OFFER A COMMUTER TRIP */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#050D07] border border-emerald-500/30 rounded-2xl p-6 max-w-lg w-full shadow-[0_0_40px_rgba(0,255,102,0.2)] text-white space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <h3 className="font-extrabold text-base flex items-center gap-2">
                                <span>🏍️</span> Register Commuter Route (Driver)
                            </h3>
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                className="text-slate-400 hover:text-white text-lg cursor-pointer"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTripSubmit} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-slate-300 font-bold mb-1">Driver Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Ramesh Kumar"
                                    value={newTripForm.driverName}
                                    onChange={(e) => setNewTripForm({ ...newTripForm, driverName: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Mobile Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="+91 98110 00000"
                                        value={newTripForm.driverPhone}
                                        onChange={(e) => setNewTripForm({ ...newTripForm, driverPhone: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white outline-none focus:border-emerald-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Vehicle Plate *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="UP16 AB 1234"
                                        value={newTripForm.vehicleNumber}
                                        onChange={(e) => setNewTripForm({ ...newTripForm, vehicleNumber: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white outline-none focus:border-emerald-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-bold mb-1">Start / Origin Location *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Knowledge Park II, Greater Noida"
                                    value={newTripForm.sourceLocation}
                                    onChange={(e) => setNewTripForm({ ...newTripForm, sourceLocation: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 font-bold mb-1">Destination Location *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Botanical Garden, Noida"
                                    value={newTripForm.destinationLocation}
                                    onChange={(e) => setNewTripForm({ ...newTripForm, destinationLocation: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Departure Time *</label>
                                    <input
                                        type="time"
                                        required
                                        value={newTripForm.departureTime}
                                        onChange={(e) => setNewTripForm({ ...newTripForm, departureTime: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white outline-none focus:border-emerald-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Seats *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="4"
                                        value={newTripForm.availableSeats}
                                        onChange={(e) => setNewTripForm({ ...newTripForm, availableSeats: parseInt(e.target.value) || 1 })}
                                        className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white outline-none focus:border-emerald-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Max Cargo (kg)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="1"
                                        max="40"
                                        value={newTripForm.cargoCapacityKg}
                                        onChange={(e) => setNewTripForm({ ...newTripForm, cargoCapacityKg: parseFloat(e.target.value) || 15 })}
                                        className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white outline-none focus:border-emerald-400"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-lg border border-white/20 text-slate-300 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingTrip}
                                    className="px-5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-bold flex items-center gap-1.5"
                                >
                                    {creatingTrip ? 'Routing & Indexing...' : 'Publish to Network'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
