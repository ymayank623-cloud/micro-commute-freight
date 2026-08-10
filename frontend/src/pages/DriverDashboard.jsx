import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
    FaMapMarkerAlt, 
    FaCheckCircle, 
    FaSpinner, 
    FaPowerOff, 
    FaRoute, 
    FaCalendarAlt,
    FaDirections,
    FaPhoneAlt,
    FaLocationArrow,
    FaFlagCheckered,
    FaExternalLinkAlt
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import DashboardCard from '../components/DashboardCard';
import './dashboardPage.css';

const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const pickupPinIcon = L.divIcon({
    className: 'custom-pickup-pin',
    html: `<div style="background:#10B981;width:30px;height:30px;border-radius:50%;border:2.5px solid #FFF;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 0 15px #10B981;">📍</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const dropPinIcon = L.divIcon({
    className: 'custom-drop-pin',
    html: `<div style="background:#EF4444;width:34px;height:34px;border-radius:50%;border:2.5px solid #FFF;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 18px #EF4444;">🏁</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
});

const driverLivePinIcon = L.divIcon({
    className: 'custom-driver-icon',
    html: `<div style="background:#00F0FF;width:36px;height:36px;border-radius:50%;border:2.5px solid #050914;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 20px #00F0FF;">🛵</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

function getDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function DriverDashboard() {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  const [activeTab, setActiveTab] = useState('available');
  
  const [assignments, setAssignments] = useState([]);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  
  const [myLocation, setMyLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(() => localStorage.getItem('driver_online') !== 'false');
  const [stats, setStats] = useState({ trips: 0, earnings: 0 });

  // Map Route State
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // Ref to track previous requests for notifications
  const previousRequestIds = useRef(new Set());

  useEffect(() => {
    if (!user || user.role !== 'driver') return;
    
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            setMyLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
        }, (error) => {
            console.error("Location error", error);
            setMyLocation({ lat: 28.6139, lng: 77.2090 });
        });
    } else {
        setMyLocation({ lat: 28.6139, lng: 77.2090 });
    }

    fetchStats();
    if (isOnline) {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    } else {
        setLoading(false);
        setRouteCoordinates([]);
    }
  }, [user, isOnline, activeTab]);

  // When assignments change, fetch the route for the active job
  useEffect(() => {
      if (activeTab !== 'assignments' || assignments.length === 0 || !myLocation) {
          setRouteCoordinates([]);
          return;
      }
      
      const activeJob = assignments.find(a => a.assignment_status !== 'Completed');
      if (activeJob) {
          if (activeJob.assignment_status === 'Assigned' || activeJob.assignment_status === 'Pending') {
              // Route: Driver -> Pickup
              fetchRoute(myLocation.lat, myLocation.lng, activeJob.pickup_lat, activeJob.pickup_lng);
          } else if (activeJob.assignment_status === 'In Transit') {
              // Route: Pickup -> Dropoff
              fetchRoute(activeJob.pickup_lat, activeJob.pickup_lng, activeJob.drop_lat, activeJob.drop_lng);
          }
      } else {
          setRouteCoordinates([]);
      }
  }, [assignments, activeTab, myLocation]);

  const fetchRoute = async (startLat, startLng, endLat, endLng) => {
      if(!startLat || !startLng || !endLat || !endLng) return;
      try {
          const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
          if (res.data.routes && res.data.routes.length > 0) {
              const coords = res.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
              setRouteCoordinates(coords);
          }
      } catch(err) {
          console.error("Failed to fetch route from OSRM", err);
      }
  };

  const fetchStats = async () => {
      try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/driver-portal/stats`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setStats(res.data);
          if (res.data.status) {
              const onlineFromDb = res.data.status !== 'Offline';
              setIsOnline(onlineFromDb);
              localStorage.setItem('driver_online', onlineFromDb);
          }
      } catch(err) {
          console.error("Failed to fetch stats", err);
      }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (activeTab === 'assignments') {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/driver-portal/assignments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAssignments(res.data);
      } else {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/driver-portal/available`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const newRequests = res.data;
          
          // Check for new requests
          const currentIds = new Set(newRequests.map(req => req.id));
          
          if (previousRequestIds.current.size > 0) {
              newRequests.forEach(req => {
                  if (!previousRequestIds.current.has(req.id)) {
                      // Trigger rich notification for new request
                      toast.info(
                          <div>
                            <strong>🚚 New Delivery Request!</strong>
                            <div style={{ fontSize: '0.85rem', marginTop: '5px' }}>
                                <div><strong>From:</strong> {req.pickup_address}</div>
                                <div><strong>To:</strong> {req.drop_address}</div>
                                <div style={{ color: '#10b981', fontWeight: 'bold' }}>Earnings: ₹{req.price || '65.00'}</div>
                            </div>
                          </div>, 
                          { autoClose: 6000, theme: "dark" }
                      );
                  }
              });
          }
          
          previousRequestIds.current = currentIds;
          setAvailableRequests(newRequests);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
      const newStatus = !isOnline;
      try {
          const token = localStorage.getItem('token');
          await axios.post(`${import.meta.env.VITE_API_URL}/api/driver-portal/status`, 
            { status: newStatus ? 'Available' : 'Offline' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setIsOnline(newStatus);
          localStorage.setItem('driver_online', newStatus);
          if(newStatus) {
              toast.success("🟢 You're Online! Scanning for delivery requests...");
              fetchData();
          } else {
              toast.info("🔴 You are now Offline. You will not receive any new requests until you go online.");
              setAvailableRequests([]);
          }
      } catch (err) {
          toast.error("Failed to update status.");
      }
  };

  const [otpInput, setOtpInput] = useState({});

  const handleVerifyOtp = async (assignmentId) => {
    const enteredOtp = otpInput[assignmentId];
    if (!enteredOtp || !enteredOtp.trim()) {
      toast.warning("Please enter the sender's 4-digit pickup code!");
      return;
    }

    setUpdating(assignmentId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/driver-portal/verify-otp`,
        { assignment_id: assignmentId, otp: enteredOtp.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data.message || "Pickup verified successfully! Started delivery.");
      setOtpInput(prev => ({ ...prev, [assignmentId]: '' }));
      fetchData();

      // Broadcast initial driver GPS location
      if (myLocation) {
        axios.post(`${import.meta.env.VITE_API_URL}/api/driver-portal/location`,
          { assignment_id: assignmentId, lat: myLocation.lat, lng: myLocation.lng },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => {});
      }

    } catch (err) {
      console.error("OTP verification failed:", err);
      toast.error(err.response?.data?.error || "Incorrect OTP. Please check with customer.");
    } finally {
      setUpdating(null);
    }
  };

  const updateStatus = async (assignmentId, newStatus) => {
    setUpdating(assignmentId);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/driver-portal/update-status`, 
        { assignment_id: assignmentId, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Parcel marked as ${newStatus}!`);
      fetchData(); 
      if (newStatus === 'Delivered') fetchStats();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const acceptOrder = async (parcelId) => {
      setUpdating(parcelId);
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${import.meta.env.VITE_API_URL}/api/driver-portal/accept`, 
          { parcel_id: parcelId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success(`Order accepted successfully!`);
        setActiveTab('assignments');
      } catch (err) {
        console.error('Error accepting order:', err);
        toast.error(err.response?.data?.error || 'Failed to accept order.');
      } finally {
        setUpdating(null);
      }
  };

  const sortedRequests = [...availableRequests].sort((a, b) => {
      if (!myLocation) return 0;
      const distA = getDistance(myLocation.lat, myLocation.lng, a.pickup_lat, a.pickup_lng);
      const distB = getDistance(myLocation.lat, myLocation.lng, b.pickup_lat, b.pickup_lng);
      return distA - distB;
  });

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Live GPS broadcast when driver is In Transit
  useEffect(() => {
      const inTransitJob = assignments.find(a => a.assignment_status === 'In Transit');
      if (!inTransitJob || !myLocation) return;

      const broadcastGps = () => {
          const token = localStorage.getItem('token');
          axios.post(`${import.meta.env.VITE_API_URL}/api/driver-portal/location`,
              { assignment_id: inTransitJob.id, lat: myLocation.lat, lng: myLocation.lng },
              { headers: { Authorization: `Bearer ${token}` } }
          ).catch(() => {});
      };

      broadcastGps();
      const interval = setInterval(broadcastGps, 5000);
      return () => clearInterval(interval);
  }, [assignments, myLocation]);

  const activeTrip = assignments.find(a => a.assignment_status !== 'Completed');

  return (
    <div className="dashboard-page">
      <ToastContainer position="top-right" />
      
      <section className="welcome-banner mb-4">
          <div className="welcome-content">
              <span className="welcome-overline">DRIVER PORTAL</span>
              <h1>Welcome, {user?.full_name?.split(' ')[0]} 👋</h1>
              <p>Manage your active routes and discover nearby delivery requests.</p>
          </div>
          <div className="welcome-right d-flex align-items-center gap-3">
              <div className="banner-date d-none d-md-flex">
                  <FaCalendarAlt />
                  <div><span>Today</span><strong>{today}</strong></div>
              </div>
              
              <div className="d-flex flex-column align-items-end gap-1">
                  <span 
                      className={`badge px-3 py-1 rounded-pill fw-bold d-flex align-items-center gap-1 ${
                          isOnline ? 'bg-success bg-opacity-25 text-success border border-success border-opacity-50' : 'bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50'
                      }`}
                      style={{ fontSize: '11px' }}
                  >
                      <span style={{ 
                          width: '7px', 
                          height: '7px', 
                          borderRadius: '50%', 
                          background: isOnline ? '#10B981' : '#EF4444',
                          boxShadow: isOnline ? '0 0 8px #10B981' : '0 0 8px #EF4444',
                          display: 'inline-block' 
                      }}></span>
                      {isOnline ? "ONLINE • READY FOR TRIPS" : "OFFLINE • PAUSED"}
                  </span>
                  
                  <button 
                      className={`btn d-flex align-items-center gap-2 fw-bold px-3 py-2 ${isOnline ? 'btn-outline-danger' : 'btn-success'}`}
                      onClick={toggleOnlineStatus}
                      style={{ borderRadius: "12px", fontSize: "13px" }}
                  >
                      <FaPowerOff /> {isOnline ? "Go Offline" : "Go Online"}
                  </button>
              </div>
          </div>
      </section>

      <div className="row g-4 dashboard-kpi-row mb-4">
          <div className="col-md-6">
              <DashboardCard 
                title="Completed Trips" 
                value={stats.trips} 
                subtitle="Deliveries made today" 
                icon={<FaCheckCircle />} 
                color="#10b981" 
              />
          </div>
          <div className="col-md-6">
              <DashboardCard 
                title="Total Earnings" 
                value={`₹${stats.earnings}`} 
                subtitle="Verified trip earnings today" 
                icon={<FaRoute />} 
                color="#10b981" 
              />
          </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
            <div className="card shadow-sm h-100" style={{ background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(20px)", border: "1px solid rgba(0, 240, 255, 0.2)", borderRadius: "20px", overflow: 'hidden' }}>
                
                {/* ACTIVE TURN-BY-TURN DIRECTION STRIP */}
                {activeTrip && (
                    <div className="p-3" style={{ 
                        background: activeTrip.assignment_status === 'In Transit' ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.2), rgba(6, 78, 59, 0.4))' : 'linear-gradient(90deg, rgba(0, 240, 255, 0.15), rgba(30, 58, 138, 0.4))',
                        borderBottom: '1px solid rgba(0, 240, 255, 0.3)'
                    }}>
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                                <span className={`badge ${activeTrip.assignment_status === 'In Transit' ? 'bg-success' : 'bg-warning text-dark'} rounded-pill px-3 py-1 fw-bold mb-1`} style={{ fontSize: '10.5px' }}>
                                    {activeTrip.assignment_status === 'In Transit' ? '🚚 TRANSIT IN PROGRESS ➔ DELIVER HERE' : '📍 DRIVE TO PICKUP LOCATION'}
                                </span>
                                <h6 className="fw-bold text-white mb-0 text-truncate" style={{ maxWidth: '400px' }}>
                                    {activeTrip.assignment_status === 'In Transit' ? activeTrip.drop_address : activeTrip.pickup_address}
                                </h6>
                                {activeTrip.contact_name && (
                                    <span className="text-secondary small d-block" style={{ fontSize: '11px' }}>
                                        Contact: <strong>{activeTrip.contact_name}</strong> {activeTrip.contact_phone ? `(${activeTrip.contact_phone})` : ''}
                                    </span>
                                )}
                            </div>
                            
                            <div className="d-flex gap-2">
                                {activeTrip.contact_phone && (
                                    <a 
                                        href={`tel:${activeTrip.contact_phone}`} 
                                        className="btn btn-sm btn-outline-info rounded-pill px-3 d-flex align-items-center gap-1 fw-bold"
                                    >
                                        <FaPhoneAlt /> Call
                                    </a>
                                )}
                                <a 
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeTrip.assignment_status === 'In Transit' ? activeTrip.drop_lat : activeTrip.pickup_lat},${activeTrip.assignment_status === 'In Transit' ? activeTrip.drop_lng : activeTrip.pickup_lng}`}
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1 fw-bold shadow"
                                    style={{ background: 'linear-gradient(135deg, #00F0FF, #3B82F6)', color: '#050914', border: 'none' }}
                                >
                                    <FaDirections /> Google Maps GPS <FaExternalLinkAlt style={{ fontSize: '10px' }} />
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card-header bg-transparent border-0 pt-3 pb-0 px-4">
                    <h5 className="fw-bold mb-0 text-white">Live Route & Navigation Map</h5>
                    <p className="text-muted small mb-0">Follow turn-by-turn route to destination.</p>
                </div>

                <div className="card-body p-4" style={{ minHeight: "420px" }}>
                    {myLocation ? (
                        <div style={{ height: "420px", width: "100%", borderRadius: "14px", overflow: "hidden", border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                            <MapContainer 
                                center={[myLocation.lat, myLocation.lng]} 
                                zoom={13} 
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    key={isLight ? "driver-map-voyager" : "driver-map-dark"}
                                    url={
                                        isLight
                                            ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                            : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                    }
                                    attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                />

                                {/* Driver Live Position Marker */}
                                <Marker position={[myLocation.lat, myLocation.lng]} icon={driverLivePinIcon}>
                                    <Popup><strong>You (Driver)</strong><br/>Live GPS Position</Popup>
                                </Marker>
                                
                                {/* Active Trip Pins */}
                                {activeTrip && activeTrip.pickup_lat && activeTrip.pickup_lng && (
                                    <Marker position={[activeTrip.pickup_lat, activeTrip.pickup_lng]} icon={pickupPinIcon}>
                                        <Popup><strong>Pickup:</strong><br/>{activeTrip.pickup_address}</Popup>
                                    </Marker>
                                )}

                                {activeTrip && activeTrip.drop_lat && activeTrip.drop_lng && (
                                    <Marker position={[activeTrip.drop_lat, activeTrip.drop_lng]} icon={dropPinIcon}>
                                        <Popup><strong>🏁 Delivery Destination:</strong><br/>{activeTrip.drop_address}</Popup>
                                    </Marker>
                                )}

                                {/* Show Nearby Requests if in available tab */}
                                {isOnline && activeTab === 'available' && sortedRequests.map(req => req.pickup_lat && req.pickup_lng && (
                                    <Marker key={req.id} position={[req.pickup_lat, req.pickup_lng]} icon={defaultIcon}>
                                        <Popup>
                                            <strong>Request #{req.id}</strong><br/>
                                            {req.pickup_address}<br/>
                                            <span style={{color:'green', fontWeight:'bold'}}>₹{req.price}</span>
                                        </Popup>
                                    </Marker>
                                ))}

                                {/* Draw Route Line */}
                                {routeCoordinates.length > 0 && (
                                    <Polyline 
                                        positions={routeCoordinates} 
                                        color={activeTrip?.assignment_status === 'In Transit' ? '#10B981' : '#00F0FF'} 
                                        weight={6} 
                                        opacity={0.85} 
                                    />
                                )}

                            </MapContainer>
                        </div>
                    ) : (
                        <div className="h-100 d-flex align-items-center justify-content-center">
                            <FaSpinner className="fa-spin fs-2 text-primary" />
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="col-lg-5">
            <div className="card shadow-sm h-100" style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "20px" }}>
                <div className="card-body p-4 d-flex flex-column">
                    
                    <div className="d-flex gap-2 mb-4 p-1" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                        <button 
                            className={`btn flex-fill fw-bold border-0 ${activeTab === 'available' ? 'bg-primary text-white' : 'text-muted'}`}
                            onClick={() => setActiveTab('available')}
                            style={{ borderRadius: '8px' }}
                        >
                            Nearby Requests
                        </button>
                        <button 
                            className={`btn flex-fill fw-bold border-0 ${activeTab === 'assignments' ? 'bg-primary text-white' : 'text-muted'}`}
                            onClick={() => setActiveTab('assignments')}
                            style={{ borderRadius: '8px' }}
                        >
                            My Route
                        </button>
                    </div>

                    <div className="flex-grow-1" style={{ overflowY: 'auto', maxHeight: '400px', paddingRight: '5px' }}>
                        {!isOnline ? (
                            <div className="text-center py-5 text-muted">
                                <FaPowerOff size={40} className="mb-3 opacity-50" />
                                <h5>You are Offline</h5>
                                <p>Go online to start receiving delivery requests.</p>
                            </div>
                        ) : loading ? (
                            <div className="text-center py-5">
                                <FaSpinner className="fa-spin fs-2 text-primary" />
                            </div>
                        ) : activeTab === 'available' ? (
                            sortedRequests.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <p>Scanning for nearby trips...</p>
                                    <FaSpinner className="fa-spin" />
                                </div>
                            ) : (
                                sortedRequests.map(req => {
                                    const dist = getDistance(myLocation?.lat, myLocation?.lng, req.pickup_lat, req.pickup_lng);
                                    const distStr = dist === Infinity ? "Distance Unknown" : (dist < 1 ? "Under 1 km" : "${dist.toFixed(1)} km");
                                    const isShared = req.delivery_tier === 'saver' || !req.delivery_tier;
                                    
                                    return (
                                        <div key={req.id} className="p-3 mb-3" style={{ 
                                            background: isShared ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)', 
                                            borderRadius: '16px', 
                                            border: isShared ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)' 
                                        }}>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="badge px-2 py-1 rounded-pill" style={{ 
                                                    background: isShared ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                    color: isShared ? '#10B981' : '#60A5FA',
                                                    fontSize: '11px',
                                                    fontWeight: '700'
                                                }}>
                                                    {isShared ? '🟢 NEW SHARED DELIVERY' : '⚡ NEW PRIORITY DIRECT'}
                                                </span>
                                                <span className="fw-bold fs-5" style={{ color: isShared ? '#10B981' : '#60A5FA' }}>
                                                    ₹{req.price || (isShared ? '129.00' : '169.00')}
                                                </span>
                                            </div>

                                            <div className="small mb-2" style={{ color: isShared ? '#6EE7B7' : '#93C5FD', fontSize: '11px' }}>
                                                {isShared 
                                                    ? '📍 You are already traveling toward this area (Detour: ~2.1 km, +12 min)' 
                                                    : '🚀 Direct point-to-point courier required (No intermediate stops)'
                                                }
                                            </div>

                                            <div className="text-light small mb-3" style={{ opacity: 0.9 }}>
                                                <div className="text-truncate mb-1"><FaMapMarkerAlt className="me-1 text-success"/> <strong>Pickup:</strong> {req.pickup_address}</div>
                                                <div className="text-truncate"><FaMapMarkerAlt className="me-1 text-danger"/> <strong>Drop:</strong> {req.drop_address}</div>
                                            </div>

                                            <div className="d-flex align-items-center justify-content-between pt-1">
                                                <span className="text-secondary small fw-bold">{distStr === "Distance Unknown" ? distStr : "${distStr} to pickup"}</span>
                                                <div className="d-flex gap-2">
                                                    <button 
                                                        className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                                        onClick={() => setAvailableRequests(prev => prev.filter(r => r.id !== req.id))}
                                                    >
                                                        Decline
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm rounded-pill fw-bold px-4"
                                                        style={{ 
                                                            background: isShared ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #3B82F6, #6366F1)',
                                                            color: '#fff',
                                                            border: 'none'
                                                        }}
                                                        onClick={() => acceptOrder(req.id)}
                                                        disabled={updating === req.id}
                                                    >
                                                        {updating === req.id ? <FaSpinner className="fa-spin"/> : (isShared ? 'Accept Shared (+₹' + req.price + ')' : 'Accept Priority (₹' + req.price + ')')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )
                        ) : (
                            assignments.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <p>No active trips on your route.</p>
                                </div>
                            ) : (
                                assignments.map(job => {
                                    const isCompleted = job.assignment_status === 'Completed';
                                    const isInTransit = job.assignment_status === 'In Transit';
                                    const isAssigned = job.assignment_status === 'Assigned' || job.assignment_status === 'Pending';
                                    const isShared = job.delivery_tier === 'saver' || !job.delivery_tier;
                                    if(isCompleted) return null;

                                    return (
                                        <div key={job.id} className="p-3 mb-3" style={{ 
                                            background: isShared ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)', 
                                            borderRadius: '16px', 
                                            borderLeft: isInTransit ? '4px solid #f59e0b' : (isShared ? '4px solid #10b981' : '4px solid #3b82f6'),
                                            border: '1px solid rgba(255, 255, 255, 0.08)'
                                        }}>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="fw-bold text-white fs-6">Trip #{job.parcel_id}</span>
                                                    <span className={`badge ${isShared ? 'bg-success bg-opacity-25 text-success' : 'bg-primary bg-opacity-25 text-info'} rounded-pill`} style={{ fontSize: '10px' }}>
                                                        {isShared ? '🟢 Shared Route' : '⚡ Priority Direct'}
                                                    </span>
                                                </div>
                                                <div className="text-end">
                                                    <span className="text-secondary small d-block" style={{ fontSize: '10px' }}>Agreed Payout</span>
                                                    <span className="fw-bold fs-5" style={{ color: isShared ? '#10B981' : '#60A5FA' }}>
                                                        ₹{job.price || '35.00'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className={`badge ${isInTransit ? 'bg-warning text-dark' : 'bg-info text-dark'}`} style={{ fontSize: '11px' }}>
                                                    {job.assignment_status}
                                                </span>
                                                <span className="text-secondary small" style={{ fontSize: '11px' }}>
                                                    {job.weight ? `${job.weight} kg` : ''} {job.parcel_type ? '• ${job.parcel_type}' : ''}
                                                </span>
                                            </div>
                                            
                                            <div className="mb-3 p-2 rounded-3" style={{ background: 'rgba(0,0,0,0.2)', fontSize: '12px' }}>
                                                <div className="text-truncate mb-1"><strong className="text-success">Pickup:</strong> <span className="text-light">{job.pickup_address}</span></div>
                                                <div className="text-truncate"><strong className="text-danger">Drop:</strong> <span className="text-light">{job.drop_address}</span></div>
                                            </div>

                                            {isAssigned && (
                                              <div className="p-3 rounded-3 mb-2" style={{ background: 'rgba(0, 240, 255, 0.08)', border: '1px dashed rgba(0, 240, 255, 0.35)' }}>
                                                  <label className="text-white small fw-bold mb-2 d-flex align-items-center gap-1">
                                                      🔐 Enter Customer's 4-Digit Pickup OTP:
                                                  </label>
                                                  <div className="input-group mb-2">
                                                      <input 
                                                          type="text" 
                                                          maxLength="4" 
                                                          placeholder="e.g. 4829" 
                                                          className="form-control text-center fw-bold fs-5 bg-dark text-white border-info"
                                                          style={{ letterSpacing: '4px', maxWidth: '140px' }}
                                                          value={otpInput[job.id] || ''}
                                                          onChange={(e) => setOtpInput({ ...otpInput, [job.id]: e.target.value })}
                                                      />
                                                      <button 
                                                          className="btn btn-primary fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                                                          onClick={() => handleVerifyOtp(job.id)}
                                                          disabled={updating === job.id || !(otpInput[job.id] && otpInput[job.id].length >= 4)}
                                                      >
                                                          {updating === job.id ? <FaSpinner className="fa-spin" /> : <><FaCheckCircle /> Verify & Start</>}
                                                      </button>
                                                  </div>
                                                  <span className="text-secondary d-block" style={{ fontSize: '10.5px' }}>
                                                      * Ask sender for the 4-digit code shown on their tracking screen to start delivery.
                                                  </span>
                                              </div>
                                            )}
                                            {isInTransit && (
                                              <button 
                                                  className="btn btn-success w-100 rounded-pill fw-bold"
                                                  onClick={() => updateStatus(job.id, 'Delivered')}
                                                  disabled={updating === job.id}
                                              >
                                                  {updating === job.id ? <FaSpinner className="fa-spin" /> : <><FaCheckCircle className="me-1"/> Mark Delivered (Collect ₹{job.price || '35.00'})</>}
                                              </button>
                                            )}
                                        </div>
                                    );
                                })
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default DriverDashboard;
