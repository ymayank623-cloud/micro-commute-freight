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
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <ToastContainer />
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-500/10">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
                            <FaBox className="text-xl" />
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Smart Parcel Booking
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                        Dynamic rate engine scales transparently with weight, route distance, and delivery tier
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(0,255,102,0.15)]">
                        <FaRoute className="text-emerald-400" /> Dynamic Rate Engine Active
                    </span>
                </div>
            </div>

            {/* Main Content Grid: Form (7 cols) + Dual Quote (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Booking Form */}
                <div className="lg:col-span-7 xl:col-span-7">
                    <div className="bg-[#050D07]/90 border border-emerald-500/20 rounded-2xl p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(0,255,102,0.05)] backdrop-blur-xl">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Section 1: Shipment Details & Dimensions */}
                            <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
                                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">1</span>
                                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                                    <FaBox className="text-emerald-400" /> Shipment Details & Locations
                                </h3>
                            </div>

                            {/* Row 1: Pickup & Dropoff Addresses */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <FaMapMarkerAlt className="text-emerald-400" /> Pickup Location <span className="text-emerald-400">*</span>
                                    </label>
                                    <AddressAutocomplete 
                                        name="pickup_address" 
                                        value={form.pickup_address} 
                                        onChange={(e) => handleChange(e, e.lat, e.lng)} 
                                        placeholder="Enter pickup address"
                                        required 
                                    />
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <FaMapMarkerAlt className="text-rose-400" /> Drop-off Destination <span className="text-emerald-400">*</span>
                                    </label>
                                    <AddressAutocomplete 
                                        name="drop_address" 
                                        value={form.drop_address} 
                                        onChange={(e) => handleChange(e, e.lat, e.lng)} 
                                        placeholder="Enter destination address"
                                        required 
                                    />
                                </div>
                            </div>

                            {/* Row 2: Weight, Package Type, Pickup Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                {/* WEIGHT FIELD WITH LIVE UPDATE */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <FaWeightHanging className="text-amber-400" /> Weight (kg) <span className="text-emerald-400">*</span>
                                        </label>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                            Live Fare
                                        </span>
                                    </div>
                                    <input 
                                        type="number" 
                                        step="0.5"
                                        min="0.5"
                                        max="80"
                                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white font-bold text-sm transition-all outline-none" 
                                        name="weight" 
                                        value={form.weight} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>

                                {/* PACKAGE TYPE */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <FaBox className="text-emerald-400" /> Package Type
                                    </label>
                                    <select 
                                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white text-sm transition-all outline-none cursor-pointer" 
                                        name="parcel_type" 
                                        value={form.parcel_type} 
                                        onChange={handleChange}
                                    >
                                        <option value="Standard" className="bg-[#050D07] text-white">Standard Box</option>
                                        <option value="Fragile" className="bg-[#050D07] text-white">Fragile (+10%)</option>
                                        <option value="Electronics" className="bg-[#050D07] text-white">Electronics (+15%)</option>
                                        <option value="Documents" className="bg-[#050D07] text-white">Documents (-5%)</option>
                                        <option value="Heavy" className="bg-[#050D07] text-white">Heavy Goods (+20%)</option>
                                    </select>
                                </div>

                                {/* PICKUP DATE */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <FaCalendarAlt className="text-emerald-400" /> Pickup Date <span className="text-emerald-400">*</span>
                                    </label>
                                    <input 
                                        type="date" 
                                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white text-sm transition-all outline-none" 
                                        name="pickup_date" 
                                        value={form.pickup_date} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                            </div>

                            {/* Section 2: Recipient & Preferred Slot */}
                            <div className="flex items-center gap-2.5 pb-3 border-b border-white/5 pt-2">
                                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">2</span>
                                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                                    <FaUser className="text-emerald-400" /> Recipient & Schedule
                                </h3>
                            </div>

                            {/* Row 3: Recipient Information */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <FaUser className="text-emerald-400" /> Recipient Name <span className="text-emerald-400">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-slate-500 text-sm transition-all outline-none" 
                                        name="contact_name" 
                                        placeholder="e.g. Rahul Sharma"
                                        value={form.contact_name} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <FaPhone className="text-emerald-400" /> Recipient Phone <span className="text-emerald-400">*</span>
                                    </label>
                                    <input 
                                        type="tel" 
                                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder-slate-500 text-sm transition-all outline-none" 
                                        name="contact_phone" 
                                        placeholder="+91 9876543210"
                                        value={form.contact_phone} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <FaClock className="text-emerald-400" /> Preferred Slot
                                    </label>
                                    <select 
                                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white text-sm transition-all outline-none cursor-pointer" 
                                        name="preferred_pickup_time" 
                                        value={form.preferred_pickup_time} 
                                        onChange={handleChange}
                                    >
                                        <option value="Instant / ASAP" className="bg-[#050D07] text-white">⚡ Instant / ASAP</option>
                                        <option value="Within 1 Hour" className="bg-[#050D07] text-white">⏱️ Within 1 Hour</option>
                                        <option value="Morning (9 AM - 12 PM)" className="bg-[#050D07] text-white">🌅 Morning Slot (9 AM - 12 PM)</option>
                                        <option value="Afternoon (12 PM - 4 PM)" className="bg-[#050D07] text-white">☀️ Afternoon Slot (12 PM - 4 PM)</option>
                                        <option value="Evening (5 PM - 9 PM)" className="bg-[#050D07] text-white">🌆 Evening Commute Slot (5 PM - 9 PM)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-5 border-t border-white/10">
                                <button 
                                    type="button" 
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-white/15 hover:border-white/30 text-slate-300 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all cursor-pointer text-center"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 active:scale-[0.98] text-black font-extrabold text-sm shadow-[0_0_25px_rgba(0,255,102,0.4)] hover:shadow-[0_0_35px_rgba(0,255,102,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                                            Dispatching Courier...
                                        </span>
                                    ) : (
                                        <>
                                            <FaCheck className="text-base" /> Confirm & Book ({selectedTier === 'saver' ? 'Saver ₹' + quoteData.saver.price : 'Priority ₹' + quoteData.priority.price})
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* RIGHT COLUMN: Smart Dual Pricing Options */}
                <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-6 space-y-6">
                    <div className="bg-[#050D07]/90 border border-emerald-500/20 rounded-2xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(0,255,102,0.05)] backdrop-blur-xl space-y-5">
                        <div>
                            <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                                    <span className="text-amber-400 text-lg">⚡</span> Real-Time Dual Quote
                                </h3>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(0,255,102,0.15)]">
                                    {quoteData.distanceKm} km • {quoteData.weightKg} kg
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mt-2.5 mb-4">
                                Rates dynamically calculate based on distance, weight, and commuter route overlap:
                            </p>

                            {/* OPTION A: SHARED ROUTE / SAVER DELIVERY */}
                            <div 
                                onClick={() => setSelectedTier('saver')}
                                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 relative mb-4 ${
                                    selectedTier === 'saver'
                                        ? 'bg-emerald-500/10 border-2 border-emerald-400 shadow-[0_0_25px_rgba(0,255,102,0.25)] ring-1 ring-emerald-400/50'
                                        : 'bg-black/30 border border-white/10 hover:border-emerald-500/30 hover:bg-black/50'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3 mb-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-2 rounded-lg ${selectedTier === 'saver' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-400'}`}>
                                            <FaLeaf className="text-base" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm flex items-center gap-2">
                                                Shared Route
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                    {quoteData.saver.badge}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-400 mt-0.5">Commuter Corridor</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-black mb-1 shadow-sm">
                                            {quoteData.saver.savingsTag}
                                        </span>
                                        <div className="text-2xl font-black text-emerald-400 leading-tight">₹{quoteData.saver.price}</div>
                                        <div className="text-[11px] line-through text-slate-500 font-medium">₹{quoteData.saver.originalPrice}</div>
                                    </div>
                                </div>

                                <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                                        <span>⏱️ Est. Delivery:</span> {quoteData.saver.estimated_time}
                                    </div>
                                    <div className="text-slate-400">• Driver already traveling on this corridor ({quoteData.distanceKm} km)</div>
                                    <div className="text-slate-400">• Weight fee: ₹{quoteData.breakdown.saverWeightFee} ({quoteData.weightKg} kg)</div>
                                </div>

                                <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 leading-snug">
                                    💡 <strong>Saver Benefit:</strong> {quoteData.saver.explanation}
                                </div>
                            </div>

                            {/* OPTION B: PRIORITY DIRECT DELIVERY */}
                            <div 
                                onClick={() => setSelectedTier('priority')}
                                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 relative mb-4 ${
                                    selectedTier === 'priority'
                                        ? 'bg-blue-500/10 border-2 border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.25)] ring-1 ring-blue-400/50'
                                        : 'bg-black/30 border border-white/10 hover:border-blue-500/30 hover:bg-black/50'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3 mb-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-2 rounded-lg ${selectedTier === 'priority' ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-slate-400'}`}>
                                            <FaBolt className="text-base" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm flex items-center gap-2">
                                                Priority Direct
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                    {quoteData.priority.badge}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-400 mt-0.5">Dedicated Instant Courier</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500 text-white mb-1 shadow-sm">
                                            {quoteData.priority.savingsTag}
                                        </span>
                                        <div className="text-2xl font-black text-white leading-tight">₹{quoteData.priority.price}</div>
                                    </div>
                                </div>

                                <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
                                        <span>⚡ Est. Delivery:</span> {quoteData.priority.estimated_time}
                                    </div>
                                    <div className="text-slate-400">• Dedicated courier dispatched directly to your location</div>
                                    <div className="text-slate-400">• Weight fee: ₹{quoteData.breakdown.priorityWeightFee} ({quoteData.weightKg} kg)</div>
                                </div>

                                <div className="mt-3 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 leading-snug">
                                    🚀 <strong>Priority Benefit:</strong> {quoteData.priority.explanation}
                                </div>
                            </div>
                        </div>

                        {/* LIVE DYNAMIC BREAKDOWN BAR */}
                        <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-bold text-white">
                                <span className="flex items-center gap-1.5 text-emerald-400">
                                    <FaSlidersH /> Live Cost Breakdown
                                </span>
                                <span className="text-slate-400 font-mono text-[11px]">
                                    Distance: {quoteData.distanceKm} km | Wt: {quoteData.weightKg} kg
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-xs text-slate-400">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase">Distance</div>
                                    <div className="text-white font-bold">₹{selectedTier === 'saver' ? quoteData.breakdown.saverDistFee : quoteData.breakdown.priorityDistFee}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase">Weight</div>
                                    <div className="text-white font-bold">₹{selectedTier === 'saver' ? quoteData.breakdown.saverWeightFee : quoteData.breakdown.priorityWeightFee}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase">Base Fare</div>
                                    <div className="text-white font-bold">₹{selectedTier === 'saver' ? '30' : '45'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase">Total</div>
                                    <div className="text-emerald-400 font-extrabold text-sm">₹{selectedTier === 'saver' ? quoteData.saver.price : quoteData.priority.price}</div>
                                </div>
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
