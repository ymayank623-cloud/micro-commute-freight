import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext';
import { 
    FaBox, 
    FaMapMarkerAlt, 
    FaWeightHanging, 
    FaCalendarAlt, 
    FaCheck, 
    FaClock, 
    FaUser, 
    FaPhone, 
    FaBolt, 
    FaLeaf, 
    FaInfoCircle,
    FaRoute,
    FaSlidersH,
    FaRupeeSign
} from 'react-icons/fa';
import AddressAutocomplete from '../components/AddressAutocomplete';
import UberFindingDriverModal from '../components/UberFindingDriverModal';
import './dashboardPage.css';

// Haversine distance calculator in KM
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 12.0; // fallback reasonable default
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.max(1.0, Math.min(80, R * c));
}

// Real-time live quote calculator based on weight, distance, package type & time (Affordable Local Rates)
// Real-time live quote calculator: Minimum for shortest distance is ₹30 + weight of product
function calculateLiveQuote(pLat, pLng, dLat, dLng, weightVal, type) {
    const dist = calculateHaversineDistance(pLat, pLng, dLat, dLng);
    const wt = Math.max(0.5, parseFloat(weightVal) || 1.0);
    
    // Type multiplier
    let typeMultiplier = 1.0;
    if (type === 'Fragile') typeMultiplier = 1.10;
    else if (type === 'Electronics') typeMultiplier = 1.15;
    else if (type === 'Heavy') typeMultiplier = 1.20;
    else if (type === 'Documents') typeMultiplier = 0.95;

    // 1. SAVER (Shared Commuter Corridor)
    // Shortest distance base (0-2 km) is ₹30 + weight of product
    const saverMinBase = 30.00; // ₹30 base for shortest distance
    const saverWeightFee = wt * 2.00; // ₹2.00 / kg weight fee
    const saverExtraDistKm = Math.max(0, dist - 2.0);
    const saverDistFee = saverExtraDistKm * 4.00; // ₹4.00 / km for distance beyond 2 km
    const saverMins = Math.max(15, Math.round(dist * 2.4) + 8);
    const saverSubtotal = (saverMinBase + saverWeightFee + saverDistFee) * typeMultiplier;
    const saverPrice = Math.round(saverSubtotal);

    // 2. PRIORITY DIRECT (Dedicated Direct Courier)
    const priorityMinBase = 45.00; // ₹45 direct shortest distance base
    const priorityWeightFee = wt * 3.50; // ₹3.50 / kg
    const priorityExtraDistKm = Math.max(0, dist - 2.0);
    const priorityDistFee = priorityExtraDistKm * 7.00; // ₹7.00 / km beyond 2 km
    const priorityMins = Math.max(10, Math.round(dist * 1.6));
    const prioritySubtotal = (priorityMinBase + priorityWeightFee + priorityDistFee) * typeMultiplier;
    const priorityPrice = Math.round(prioritySubtotal);

    const savings = Math.max(15, priorityPrice - saverPrice);

    return {
        distanceKm: dist.toFixed(1),
        weightKg: wt.toFixed(1),
        saver: {
            tier: 'saver',
            title: 'Shared Route',
            badge: 'Best Value',
            badgeClass: 'saver',
            price: saverPrice.toFixed(2),
            originalPrice: (saverPrice + savings).toFixed(2),
            savingsAmount: savings.toFixed(2),
            savingsTag: `SAVE ₹${savings}`,
            estimated_time: `${Math.max(12, saverMins - 6)}–${saverMins + 6} min`,
            pickupTimeline: 'Delivered after driver completes current drop-off',
            explanation: `Save ₹${savings} because your ${wt} kg parcel shares an active commuter corridor (${dist.toFixed(1)} km).`
        },
        priority: {
            tier: 'priority',
            title: 'Priority Direct',
            badge: 'Fastest',
            badgeClass: 'priority',
            price: priorityPrice.toFixed(2),
            savingsAmount: '0.00',
            savingsTag: 'FASTEST',
            estimated_time: `${Math.max(8, priorityMins - 4)}–${priorityMins + 4} min`,
            pickupTimeline: 'Driver comes directly to you immediately',
            explanation: `Pay ₹${savings} more for direct express pickup and delivery with zero intermediate stops.`
        },
        breakdown: {
            distKm: dist.toFixed(1),
            saverBaseFee: saverMinBase.toFixed(0),
            priorityBaseFee: priorityMinBase.toFixed(0),
            saverDistFee: saverDistFee.toFixed(0),
            saverWeightFee: saverWeightFee.toFixed(0),
            priorityDistFee: priorityDistFee.toFixed(0),
            priorityWeightFee: priorityWeightFee.toFixed(0)
        }
    };
}

function BookParcel() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        pickup_address: '',
        drop_address: '',
        weight: '2',
        parcel_type: 'Standard',
        pickup_date: new Date().toISOString().split('T')[0],
        pickup_lat: 28.6139, // Default Delhi-NCR
        pickup_lng: 77.2090,
        drop_lat: 28.5355,
        drop_lng: 77.3910,
        contact_name: '',
        contact_phone: '',
        preferred_pickup_time: 'Instant / ASAP'
    });

    const [selectedTier, setSelectedTier] = useState('saver'); // 'saver' or 'priority'
    const [quoteData, setQuoteData] = useState(() => calculateLiveQuote(28.6139, 77.2090, 28.5355, 77.3910, '2', 'Standard'));
    const [bookedParcel, setBookedParcel] = useState(null);
    const [showFindingModal, setShowFindingModal] = useState(false);

    // Recalculate quote live on ANY input change (weight, parcel type, pickup/drop coordinates)
    useEffect(() => {
        const live = calculateLiveQuote(
            form.pickup_lat,
            form.pickup_lng,
            form.drop_lat,
            form.drop_lng,
            form.weight,
            form.parcel_type
        );
        setQuoteData(live);
    }, [form.pickup_lat, form.pickup_lng, form.drop_lat, form.drop_lng, form.weight, form.parcel_type]);

    const handleChange = (e, lat, lng) => {
        setForm(prev => {
            const updates = { [e.target.name]: e.target.value };

            if (lat !== undefined && lng !== undefined) {
                if (e.target.name === 'pickup_address') {
                    updates.pickup_lat = lat;
                    updates.pickup_lng = lng;
                } else if (e.target.name === 'drop_address') {
                    updates.drop_lat = lat;
                    updates.drop_lng = lng;
                }
            }

            return { ...prev, ...updates };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const chosenDetails = selectedTier === 'saver' ? quoteData.saver : quoteData.priority;

            const payload = {
                ...form,
                sender_id: user.id,
                delivery_tier: selectedTier,
                selected_price: chosenDetails.price,
                savings_amount: chosenDetails.savingsAmount,
                estimated_time: chosenDetails.estimated_time
            };

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/parcels`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`🎉 ${selectedTier === 'saver' ? 'Saver Route' : 'Priority Direct'} parcel confirmed!`);
            
            // Set booked parcel data and trigger Uber-style driver finding radar map
            setBookedParcel(res.data.parcel);
            setShowFindingModal(true);

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to book parcel');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-page px-3 px-md-4 py-3">
            <ToastContainer />
            
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h2 className="fw-bold mb-1" style={{ color: "var(--text-primary)" }}>Smart Parcel Booking</h2>
                    <p className="text-secondary small mb-0">Dynamic pricing that scales accurately with weight, route distance, and delivery tier</p>
                </div>
                <span className="badge px-3 py-2 rounded-pill" style={{ background: "rgba(0, 240, 255, 0.1)", color: "var(--accent-cyan)", border: "1px solid rgba(0, 240, 255, 0.3)" }}>
                    <FaRoute className="me-1" /> Dynamic Rate Engine Active
                </span>
            </div>

            <div className="row g-4">
                {/* LEFT COLUMN: Booking Form */}
                <div className="col-lg-7">
                    <div className="card shadow-lg p-4" style={{ 
                        background: "var(--glass-bg, rgba(15, 23, 42, 0.75))", 
                        backdropFilter: "blur(20px)", 
                        border: "1px solid var(--glass-border, rgba(255,255,255,0.1))",
                        borderRadius: "24px"
                    }}>
                        <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <FaBox style={{ color: "var(--accent-cyan)" }} /> 1. Shipment Details & Weight
                        </h5>

                        <form onSubmit={handleSubmit} className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label text-secondary small fw-bold text-uppercase d-flex align-items-center gap-2">
                                    <FaMapMarkerAlt style={{ color: "#10B981" }} /> Pickup Location
                                </label>
                                <AddressAutocomplete 
                                    name="pickup_address" 
                                    value={form.pickup_address} 
                                    onChange={(e) => handleChange(e, e.lat, e.lng)} 
                                    placeholder="Enter pickup address"
                                    className="bg-transparent text-white border-secondary"
                                    required 
                                />
                            </div>
                            
                            <div className="col-md-6">
                                <label className="form-label text-secondary small fw-bold text-uppercase d-flex align-items-center gap-2">
                                    <FaMapMarkerAlt style={{ color: "#EF4444" }} /> Drop-off Destination
                                </label>
                                <AddressAutocomplete 
                                    name="drop_address" 
                                    value={form.drop_address} 
                                    onChange={(e) => handleChange(e, e.lat, e.lng)} 
                                    placeholder="Enter destination address"
                                    className="bg-transparent text-white border-secondary"
                                    required 
                                />
                            </div>

                            {/* WEIGHT FIELD WITH LIVE UPDATE */}
                            <div className="col-md-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <label className="form-label text-secondary small fw-bold text-uppercase d-flex align-items-center gap-1 mb-1">
                                        <FaWeightHanging style={{ color: "#F59E0B" }} /> Weight (kg)
                                    </label>
                                    <span className="badge bg-warning bg-opacity-25 text-warning rounded-pill" style={{ fontSize: '10px' }}>
                                        Scales Fare Live
                                    </span>
                                </div>
                                <input 
                                    type="number" 
                                    step="0.5"
                                    min="0.5"
                                    max="80"
                                    className="form-control bg-transparent text-white border-warning border-opacity-50 fw-bold" 
                                    name="weight" 
                                    value={form.weight} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label text-secondary small fw-bold text-uppercase d-flex align-items-center gap-2">
                                    <FaBox /> Package Type
                                </label>
                                <select 
                                    className="form-select bg-dark text-white border-secondary" 
                                    name="parcel_type" 
                                    value={form.parcel_type} 
                                    onChange={handleChange}
                                >
                                    <option value="Standard">Standard Box</option>
                                    <option value="Fragile">Fragile (+15%)</option>
                                    <option value="Electronics">Electronics (+20%)</option>
                                    <option value="Documents">Documents (-5%)</option>
                                    <option value="Heavy">Heavy Goods (+30%)</option>
                                </select>
                            </div>

                            <div className="col-md-4">
                                <label className="form-label text-secondary small fw-bold text-uppercase d-flex align-items-center gap-2">
                                    <FaCalendarAlt /> Pickup Date
                                </label>
                                <input 
                                    type="date" 
                                    className="form-control bg-transparent text-white border-secondary" 
                                    name="pickup_date" 
                                    value={form.pickup_date} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>

                            <hr className="my-3 border-secondary border-opacity-25" />

                            <h5 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: "var(--text-primary)" }}>
                                <FaUser style={{ color: "#8A2BE2" }} /> 2. Recipient & Preferred Slot
                            </h5>

                            <div className="col-md-4">
                                <label className="form-label text-secondary small fw-bold text-uppercase d-flex align-items-center gap-2">
                                    <FaUser /> Recipient Name
                                </label>
                                <input 
                                    type="text" 
                                    className="form-control bg-transparent text-white border-secondary" 
                                    name="contact_name" 
                                    placeholder="e.g. Rahul Sharma"
                                    value={form.contact_name} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label text-secondary small fw-bold text-uppercase d-flex align-items-center gap-2">
                                    <FaPhone /> Recipient Phone
                                </label>
                                <input 
                                    type="tel" 
                                    className="form-control bg-transparent text-white border-secondary" 
                                    name="contact_phone" 
                                    placeholder="+91 9876543210"
                                    value={form.contact_phone} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label text-secondary small fw-bold text-uppercase d-flex align-items-center gap-2">
                                    <FaClock /> Preferred Slot
                                </label>
                                <select 
                                    className="form-select bg-dark text-white border-secondary" 
                                    name="preferred_pickup_time" 
                                    value={form.preferred_pickup_time} 
                                    onChange={handleChange}
                                >
                                    <option value="Instant / ASAP">⚡ Instant / ASAP</option>
                                    <option value="Within 1 Hour">⏱️ Within 1 Hour</option>
                                    <option value="Morning (9 AM - 12 PM)">🌅 Morning Slot</option>
                                    <option value="Afternoon (12 PM - 4 PM)">☀️ Afternoon Slot</option>
                                    <option value="Evening (5 PM - 9 PM)">🌆 Evening Commute Slot</option>
                                </select>
                            </div>

                            <div className="col-12 mt-4 d-flex justify-content-between align-items-center pt-2">
                                <button 
                                    type="button" 
                                    className="btn btn-outline-secondary px-4 rounded-pill"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary px-5 py-3 rounded-pill fw-bold d-inline-flex align-items-center gap-2 shadow"
                                    disabled={loading}
                                    style={{ background: selectedTier === 'saver' ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
                                >
                                    {loading ? 'Dispatching...' : (
                                        <>
                                            <FaCheck /> Confirm & Book ({selectedTier === 'saver' ? 'Saver ₹' + quoteData.saver.price : 'Priority ₹' + quoteData.priority.price})
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* RIGHT COLUMN: Smart Dual Pricing Options */}
                <div className="col-lg-5">
                    <div className="card shadow-lg p-4 h-100 d-flex flex-column justify-content-between" style={{ 
                        background: "var(--glass-bg, rgba(15, 23, 42, 0.75))", 
                        backdropFilter: "blur(20px)", 
                        border: "1px solid var(--glass-border, rgba(255,255,255,0.1))",
                        borderRadius: "24px"
                    }}>
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h5 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
                                    ⚡ Real-Time Dual Quote
                                </h5>
                                <span className="badge px-3 py-1 rounded-pill bg-info bg-opacity-25 text-info fw-bold" style={{ fontSize: '11px' }}>
                                    {quoteData.distanceKm} km • {quoteData.weightKg} kg
                                </span>
                            </div>
                            <p className="text-secondary small mb-3">
                                Rates dynamically calculate based on distance, weight, and commuter route overlap:
                            </p>

                            {/* OPTION A: SHARED ROUTE / SAVER DELIVERY */}
                            <div 
                                onClick={() => setSelectedTier('saver')}
                                className={`p-3 rounded-4 mb-3 position-relative cursor-pointer transition-all ${selectedTier === 'saver' ? 'border-success' : 'border-secondary border-opacity-25'}`}
                                style={{ 
                                    background: selectedTier === 'saver' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                                    border: selectedTier === 'saver' ? '2px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                                    cursor: 'pointer',
                                    boxShadow: selectedTier === 'saver' ? '0 10px 30px rgba(16, 185, 129, 0.25)' : 'none'
                                }}
                            >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="p-2 rounded-circle" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }}>
                                            <FaLeaf />
                                        </div>
                                        <div>
                                            <div className="fw-bold text-white fs-6">Shared Route</div>
                                            <span className="badge bg-success bg-opacity-25 text-success rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                                                {quoteData.saver.badge}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <span className="badge bg-success text-white px-2 py-1 rounded-pill mb-1 fw-bold" style={{ fontSize: '11px' }}>
                                            {quoteData.saver.savingsTag}
                                        </span>
                                        <div className="fw-bold text-success fs-4">₹{quoteData.saver.price}</div>
                                        <div className="text-decoration-line-through text-secondary" style={{ fontSize: '11px' }}>₹{quoteData.saver.originalPrice}</div>
                                    </div>
                                </div>

                                <div className="small text-secondary mb-2" style={{ lineHeight: '1.4' }}>
                                    <div className="text-light fw-medium mb-1">⏱️ Est. Delivery: {quoteData.saver.estimated_time}</div>
                                    <div>• Driver is already traveling along this corridor ({quoteData.distanceKm} km)</div>
                                    <div>• Weight cost: ₹{quoteData.breakdown.saverWeightFee} ({quoteData.weightKg} kg @ ₹4.5/kg)</div>
                                </div>

                                <div className="p-2 rounded-3 mt-2" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px dashed rgba(16, 185, 129, 0.3)', fontSize: '11px', color: '#6EE7B7' }}>
                                    💡 <strong>Saver Benefit:</strong> {quoteData.saver.explanation}
                                </div>
                            </div>

                            {/* OPTION B: PRIORITY DIRECT DELIVERY */}
                            <div 
                                onClick={() => setSelectedTier('priority')}
                                className={`p-3 rounded-4 mb-3 position-relative cursor-pointer transition-all ${selectedTier === 'priority' ? 'border-primary' : 'border-secondary border-opacity-25'}`}
                                style={{ 
                                    background: selectedTier === 'priority' ? 'rgba(59, 130, 246, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                                    border: selectedTier === 'priority' ? '2px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                                    cursor: 'pointer',
                                    boxShadow: selectedTier === 'priority' ? '0 10px 30px rgba(59, 130, 246, 0.25)' : 'none'
                                }}
                            >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="p-2 rounded-circle" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }}>
                                            <FaBolt />
                                        </div>
                                        <div>
                                            <div className="fw-bold text-white fs-6">Priority Direct</div>
                                            <span className="badge bg-primary bg-opacity-25 text-info rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                                                {quoteData.priority.badge}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <span className="badge bg-primary text-white px-2 py-1 rounded-pill mb-1 fw-bold" style={{ fontSize: '11px' }}>
                                            {quoteData.priority.savingsTag}
                                        </span>
                                        <div className="fw-bold text-white fs-4">₹{quoteData.priority.price}</div>
                                    </div>
                                </div>

                                <div className="small text-secondary mb-2" style={{ lineHeight: '1.4' }}>
                                    <div className="text-light fw-medium mb-1">⚡ Est. Delivery: {quoteData.priority.estimated_time}</div>
                                    <div>• Driver comes directly to you for immediate pickup</div>
                                    <div>• Weight cost: ₹{quoteData.breakdown.priorityWeightFee} ({quoteData.weightKg} kg @ ₹6.5/kg)</div>
                                </div>

                                <div className="p-2 rounded-3 mt-2" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed rgba(59, 130, 246, 0.3)', fontSize: '11px', color: '#93C5FD' }}>
                                    🚀 <strong>Priority Benefit:</strong> {quoteData.priority.explanation}
                                </div>
                            </div>
                        </div>

                        {/* LIVE DYNAMIC BREAKDOWN BAR */}
                        <div className="p-3 rounded-3 mt-2" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div className="d-flex align-items-center justify-content-between text-white small fw-bold mb-2">
                                <span className="d-flex align-items-center gap-1"><FaSlidersH style={{ color: 'var(--accent-cyan)' }} /> Live Cost Breakdown</span>
                                <span className="text-secondary font-monospace">Distance: {quoteData.distanceKm} km | Wt: {quoteData.weightKg} kg</span>
                            </div>
                            <div className="d-flex justify-content-between text-secondary" style={{ fontSize: '11px' }}>
                                <span>Distance: <strong>₹{selectedTier === 'saver' ? quoteData.breakdown.saverDistFee : quoteData.breakdown.priorityDistFee}</strong></span>
                                <span>Weight: <strong>₹{selectedTier === 'saver' ? quoteData.breakdown.saverWeightFee : quoteData.breakdown.priorityWeightFee}</strong></span>
                                <span>Base (Shortest): <strong>₹{selectedTier === 'saver' ? '30' : '45'}</strong></span>
                                <span className="text-success fw-bold">Total: ₹{selectedTier === 'saver' ? quoteData.saver.price : quoteData.priority.price}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* UBER-STYLE FINDING DRIVER LIVE RADAR MODAL */}
            <UberFindingDriverModal 
                isOpen={showFindingModal}
                parcel={bookedParcel}
                onClose={() => setShowFindingModal(false)}
            />
        </div>
    );
}

export default BookParcel;
