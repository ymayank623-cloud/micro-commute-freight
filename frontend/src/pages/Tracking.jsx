import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  FaSearch, 
  FaBox, 
  FaMapMarkerAlt, 
  FaCheckCircle, 
  FaSpinner, 
  FaBolt, 
  FaLeaf, 
  FaClock, 
  FaUser, 
  FaPhone, 
  FaShieldAlt, 
  FaRoute,
  FaKey,
  FaMotorcycle,
  FaCar,
  FaLock
} from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from "../context/ThemeContext";
import "./trackingPage.css";

const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const liveDriverIcon = (vehicleType) => L.divIcon({
    className: 'custom-live-driver-pin',
    html: `<div class="live-driver-pulse"><span class="driver-icon-emoji">${vehicleType === 'Bike' ? '🛵' : '🚗'}</span><div class="driver-radar-ring"></div></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
});

function Tracking() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialId = queryParams.get("id") || "";

  const [parcelId, setParcelId] = useState(initialId);
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [history, setHistory] = useState([]);
  const [latest, setLatest] = useState(null);
  const [parcelDetails, setParcelDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  
  const [routeCoords, setRouteCoords] = useState([]);
  const [roadCoords, setRoadCoords] = useState([]); // Store real road path
  const [routeInfo, setRouteInfo] = useState(null); // Store distance & duration
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Default Delhi/India Center
  const [driverPos, setDriverPos] = useState(null);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs} hr ${mins} min`;
    return `${mins} min`;
  };

  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(1) + " km";
  };

  useEffect(() => {
    if (initialId) {
      performSearch(initialId);
    }
  }, [initialId]);

  // Polling every 5s for live updates
  useEffect(() => {
    if (!parcelDetails || parcelDetails.status === 'Delivered') return;
    const interval = setInterval(() => {
      fetchLatestStatus(parcelDetails.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [parcelDetails]);

  const fetchLatestStatus = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parcels/${id}`, { headers });
      setParcelDetails(res.data);

      const histRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/tracking/${id}/history`);
      setHistory(histRes.data);

      const latRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/tracking/${id}/latest`);
      setLatest(latRes.data);
    } catch(e) {}
  };

  const performSearch = async (idToSearch) => {
    if (!idToSearch.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);
    setHistory([]);
    setLatest(null);
    setParcelDetails(null);
    setRoadCoords([]);
    setRouteInfo(null);
    setDriverPos(null);

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch parcel details first
      const parcelRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/parcels/${idToSearch}`, { headers });
      setParcelDetails(parcelRes.data);

      // 2. Fetch history and latest
      try {
        const historyRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/tracking/${idToSearch}/history`);
        setHistory(historyRes.data);
      } catch (e) {
        setHistory([]);
      }

      try {
        const latestRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/tracking/${idToSearch}/latest`);
        setLatest(latestRes.data);
      } catch (e) {
        setLatest(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Parcel not found in the system.");
      } else {
        setError("Failed to fetch tracking data.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Run geocoding & route calculation
  useEffect(() => {
    if (!parcelDetails) return;

    const pLat = parseFloat(parcelDetails.pickup_lat);
    const pLng = parseFloat(parcelDetails.pickup_lng);
    const dLat = parseFloat(parcelDetails.drop_lat);
    const dLng = parseFloat(parcelDetails.drop_lng);

    const setupCoordinates = (pCoords, dCoords) => {
      setRouteCoords([pCoords, dCoords]);
      setMapCenter(pCoords);

      // Calculate initial driver position
      if (parcelDetails.driver_lat && parcelDetails.driver_lng) {
        setDriverPos([parseFloat(parcelDetails.driver_lat), parseFloat(parcelDetails.driver_lng)]);
      } else if (parcelDetails.status === 'In Transit') {
        // Interpolate midway
        setDriverPos([(pCoords[0] + dCoords[0]) / 2, (pCoords[1] + dCoords[1]) / 2]);
      } else {
        setDriverPos(pCoords);
      }

      // Fetch road route from OSRM
      axios.get(`https://router.project-osrm.org/route/v1/driving/${pCoords[1]},${pCoords[0]};${dCoords[1]},${dCoords[0]}?overview=full&geometries=geojson`, { timeout: 5000 })
        .then(osrmRes => {
          if (osrmRes.data && osrmRes.data.routes && osrmRes.data.routes.length > 0) {
            const routeData = osrmRes.data.routes[0];
            const leafletCoords = routeData.geometry.coordinates.map(c => [c[1], c[0]]);
            setRoadCoords(leafletCoords);

            const distKm = routeData.distance / 1000;
            const customMins = Math.max(12, Math.round((distKm / 30) * 60));
            setRouteInfo({ duration: customMins * 60, distance: routeData.distance });

            // If in transit, place driver 40% along the actual road path
            if (parcelDetails.status === 'In Transit' && leafletCoords.length > 2) {
              const midIndex = Math.floor(leafletCoords.length * 0.45);
              setDriverPos(leafletCoords[midIndex]);
            }
          }
        })
        .catch(() => {
          setRoadCoords([pCoords, dCoords]);
        });
    };

    if (pLat && pLng && dLat && dLng) {
      setupCoordinates([pLat, pLng], [dLat, dLng]);
    } else if (parcelDetails.pickup_address && parcelDetails.drop_address) {
      // Fallback geocoding
      Promise.all([
        axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(parcelDetails.pickup_address)}&limit=1`),
        axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(parcelDetails.drop_address)}&limit=1`)
      ]).then(([pRes, dRes]) => {
        if (pRes.data.length > 0 && dRes.data.length > 0) {
          const pCoords = [parseFloat(pRes.data[0].lat), parseFloat(pRes.data[0].lon)];
          const dCoords = [parseFloat(dRes.data[0].lat), parseFloat(dRes.data[0].lon)];
          setupCoordinates(pCoords, dCoords);
        }
      }).catch(() => {});
    }
  }, [parcelDetails]);

  const handleSearch = async (e) => {
    e.preventDefault();
    performSearch(parcelId);
  };

  const isInTransit = parcelDetails?.status === 'In Transit';
  const isDelivered = parcelDetails?.status === 'Delivered';
  const isPickupVerified = parcelDetails?.is_pickup_verified;
  const otpCode = parcelDetails?.pickup_otp || '4829';

  return (
    <div className="premium-tracking-wrapper">
      
      {/* FULL-SCREEN BACKGROUND MAP */}
      <div className="background-map">
        <MapContainer 
          key={mapCenter.join(',')} 
          center={mapCenter} 
          zoom={12} 
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            key={isLight ? "tracking-carto-voyager" : "tracking-carto-dark"}
            url={
              isLight
                ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            }
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          {routeCoords.length === 2 && (
            <>
              {/* Pickup Point */}
              <Marker position={routeCoords[0]} icon={defaultIcon}>
                <Popup><strong>Pickup:</strong><br/>{parcelDetails?.pickup_address}</Popup>
              </Marker>

              {/* Drop Point */}
              <Marker position={routeCoords[1]} icon={defaultIcon}>
                <Popup><strong>Drop-off:</strong><br/>{parcelDetails?.drop_address}</Popup>
              </Marker>
              
              {/* Road Polyline */}
              {roadCoords.length > 0 && (
                <Polyline 
                  positions={roadCoords} 
                  color={parcelDetails?.delivery_tier === 'priority' ? '#3B82F6' : '#10B981'} 
                  weight={6} 
                  opacity={0.85}
                />
              )}

              {/* LIVE DRIVER GPS MARKER */}
              {driverPos && (isInTransit || parcelDetails?.assignment_status === 'Assigned') && (
                <Marker position={driverPos} icon={liveDriverIcon(parcelDetails?.vehicle_type)}>
                  <Popup>
                    <div style={{ padding: '4px' }}>
                      <strong className="text-primary">{parcelDetails?.driver_name || 'Assigned Driver'}</strong><br/>
                      <span>Vehicle: {parcelDetails?.vehicle_number || 'UP 32 KP 8347'}</span><br/>
                      <span className="badge bg-success mt-1">Live En Route</span>
                    </div>
                  </Popup>
                </Marker>
              )}
            </>
          )}
        </MapContainer>
      </div>

      {/* FLOATING UI PANELS */}
      <div className="floating-ui-container container-fluid p-3 p-md-4">
        <div className="row h-100">
          <div className="col-lg-4 col-md-6 col-12 d-flex flex-column h-100 mt-2 ms-md-2">
            
            <motion.div 
              className="glass-panel tracking-search-panel mb-3 p-3 p-md-4 rounded-4"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h4 className="fw-bold mb-1 text-white">Live Tracking</h4>
              <p className="text-white-50 mb-3 small">Monitor your parcel and live driver location in real time.</p>

              <form onSubmit={handleSearch} className="search-form">
                <div className="input-group">
                  <span className="input-group-text">
                    <FaBox className="text-info" />
                  </span>
                  <input
                    type="text"
                    className="form-control ps-0 font-monospace"
                    placeholder="Enter 12-digit Shipment ID (e.g., 689482956509)"
                    value={parcelId}
                    onChange={(e) => setParcelId(e.target.value)}
                  />
                  <button className="btn btn-primary px-3 fw-bold" type="submit" disabled={loading}>
                    {loading ? <FaSpinner className="fa-spin" /> : <FaSearch />}
                  </button>
                </div>
              </form>
              
              {error && (
                <div className="alert alert-danger mt-3 mb-0 small text-center rounded-3 p-2 border-0">
                  {error}
                </div>
              )}
            </motion.div>

            {searched && !loading && !error && parcelDetails && (
              <motion.div 
                className="glass-panel tracking-history-panel p-3 p-md-4 rounded-4 d-flex flex-column flex-grow-1 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-3 flex-wrap gap-2">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h5 className="fw-bold mb-0 text-white">Shipment #{parcelDetails?.id}</h5>
                      <span className={`badge ${parcelDetails?.delivery_tier === 'priority' ? 'bg-primary text-white' : 'bg-success text-white'} px-2 py-1 rounded-pill`} style={{ fontSize: '10px' }}>
                        {parcelDetails?.delivery_tier === 'priority' ? '⚡ Priority Direct' : '🟢 Shared Route'}
                      </span>
                    </div>
                    <span className={`badge ${isDelivered ? 'bg-success' : (isInTransit ? 'bg-warning text-dark' : 'bg-info text-dark')} px-2 py-1 rounded-pill mt-1 fw-bold`}>
                      {parcelDetails?.status}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="text-success fs-5 fw-bold d-block">₹{parcelDetails?.price || '35.00'}</span>
                    <span className="text-secondary small" style={{ fontSize: '10px' }}>Agreed Payout</span>
                  </div>
                </div>

                {/* 🔐 SENDER PICKUP OTP CARD (Crucial Security Feature) */}
                {!isDelivered && (
                  <div className="customer-otp-card p-3 mb-3 text-center">
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                      <FaKey className="text-info" />
                      <span className="small fw-bold text-white text-uppercase" style={{ letterSpacing: '1px' }}>
                        {isPickupVerified ? "Pickup Verified" : "Your Pickup Security OTP"}
                      </span>
                    </div>
                    
                    {!isPickupVerified ? (
                      <>
                        <div className="d-flex justify-content-center gap-2 my-2">
                          {otpCode.split('').map((digit, i) => (
                            <span key={i} className="otp-box-digit">{digit}</span>
                          ))}
                        </div>
                        <p className="mb-0 text-light small" style={{ fontSize: '11px', opacity: 0.9 }}>
                          🔒 Tell this <strong>4-digit code</strong> to the driver at pickup to begin delivery.
                        </p>
                      </>
                    ) : (
                      <div className="p-2 rounded-3 bg-success bg-opacity-25 border border-success border-opacity-50 text-success fw-bold small d-flex align-items-center justify-content-center gap-1">
                        <FaCheckCircle /> OTP Verified — Package Handed Over to Driver
                      </div>
                    )}
                  </div>
                )}

                {/* DRIVER PROFILE CARD */}
                <div className="p-3 rounded-3 mb-3" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-2 rounded-circle" style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00F0FF' }}>
                        {parcelDetails?.vehicle_type === 'Bike' ? <FaMotorcycle /> : <FaCar />}
                      </div>
                      <div>
                        <strong className="text-white d-block" style={{ fontSize: '13px' }}>
                          {parcelDetails?.driver_name || 'Rahul Sharma (Assigned Driver)'}
                        </strong>
                        <span className="text-secondary small" style={{ fontSize: '11px' }}>
                          {parcelDetails?.vehicle_number || 'UP 32 KP 8347'} • ⭐ 4.9
                        </span>
                      </div>
                    </div>
                    {parcelDetails?.driver_phone && (
                      <a href={`tel:${parcelDetails.driver_phone}`} className="btn btn-sm btn-outline-info rounded-pill px-3 d-flex align-items-center gap-1">
                        <FaPhone /> Call
                      </a>
                    )}
                  </div>
                </div>

                {/* TRIP METRICS (ETA & DISTANCE) */}
                {routeInfo && (
                  <div className="d-flex justify-content-between align-items-center mb-3 bg-dark bg-opacity-40 p-2 rounded-3 border border-secondary border-opacity-30">
                    <div className="text-center flex-fill border-end border-secondary border-opacity-50 px-1">
                      <span className="text-info d-block small" style={{fontSize: '10px'}}>EST. TIME</span>
                      <strong className="text-white small">{parcelDetails?.estimated_time || formatDuration(routeInfo.duration)}</strong>
                    </div>
                    <div className="text-center flex-fill border-end border-secondary border-opacity-50 px-1">
                      <span className="text-info d-block small" style={{fontSize: '10px'}}>DISTANCE</span>
                      <strong className="text-white small">{formatDistance(routeInfo.distance)}</strong>
                    </div>
                    <div className="text-center flex-fill px-1">
                      <span className="text-info d-block small" style={{fontSize: '10px'}}>TIER</span>
                      <strong className={parcelDetails?.delivery_tier === 'priority' ? 'text-primary small' : 'text-success small'}>
                        {parcelDetails?.delivery_tier === 'priority' ? 'Express Direct' : 'Shared Saver'}
                      </strong>
                    </div>
                  </div>
                )}

                {/* TIMELINE */}
                <h6 className="fw-bold mb-3 text-white-50 text-uppercase small" style={{letterSpacing:'1px', fontSize: '11px'}}>
                  Live Status Timeline
                </h6>
                
                <div className="timeline-container ps-2 overflow-y-auto pe-2 flex-grow-1">
                  {history.length > 0 ? (
                    history.map((event, index) => (
                      <motion.div 
                        key={event.id || index} 
                        className="timeline-item position-relative pb-2"
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="timeline-icon">
                          {event.status.toLowerCase().includes('delivered') ? <FaCheckCircle /> : (event.status.toLowerCase().includes('otp') ? <FaKey /> : <FaMapMarkerAlt />)}
                        </div>
                        <div className="timeline-content ps-3 ms-2">
                          <h6 className="fw-bold mb-1 text-white" style={{ fontSize: '12.5px' }}>{event.status}</h6>
                          <span className="text-info d-block small" style={{ fontSize: '10px' }}>{new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="mb-0 small text-white-50 d-block" style={{ fontSize: '11px' }}>{event.location}</span>
                          {event.remarks && <p className="text-light small mt-1 mb-0 border-top border-secondary border-opacity-25 pt-1" style={{ fontSize: '10.5px' }}>{event.remarks}</p>}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center text-white-50 py-3 small">
                      Awaiting initial dispatch scan...
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default Tracking;