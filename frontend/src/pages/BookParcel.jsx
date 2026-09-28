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

// Multi-Factor Dynamic Rate Engine (Uber/Logistics Supply & Demand Model)
// Factors: Pickup/Drop route, Distance, Travel Time, Traffic, Demand Surge, Driver Availability, Ride Type, Tolls, Taxes, Route Winding
function calculateMultiFactorQuote(pLat, pLng, dLat, dLng, weightVal, type, liveRoadDistKm, liveRoadDurationMins) {
    const straightDist = calculateHaversineDistance(pLat, pLng, dLat, dLng);
    // 1. Route Characteristics: Use actual road routing if available, else tortuosity 1.22x
    let routeDistanceKm;
    if (liveRoadDistKm && parseFloat(liveRoadDistKm) > 0) {
        routeDistanceKm = Math.max(0.5, parseFloat(liveRoadDistKm));
    } else {
        routeDistanceKm = Math.max(1.0, straightDist * 1.22);
    }
    const wt = Math.max(0.5, parseFloat(weightVal) || 1.0);

    // 2. Package Type Handling Surcharge
    let packageMultiplier = 1.0;
    if (type === 'Fragile') packageMultiplier = 1.10;
    else if (type === 'Electronics') packageMultiplier = 1.15;
    else if (type === 'Heavy') packageMultiplier = 1.20;
    else if (type === 'Documents') packageMultiplier = 0.95;

    // 3. Traffic Multiplier & Expected Travel Time (based on current time of day)
    const currentHour = new Date().getHours();
    let trafficMultiplier = 1.06;
    let trafficStatus = 'Moderate';
    if ((currentHour >= 8 && currentHour <= 11) || (currentHour >= 17 && currentHour <= 20)) {
        trafficMultiplier = 1.22;
        trafficStatus = 'Peak Rush';
    } else if (currentHour >= 22 || currentHour <= 6) {
        trafficMultiplier = 0.95;
        trafficStatus = 'Light Flow';
    }

    // 4. Demand & Driver Availability (Dynamic network surge: 1.08x)
    const demandMultiplier = 1.08;

    // 5. Tolls Estimation (included upfront for trips > 18 km)
    const hasTolls = routeDistanceKm > 18.0;

    // 6. Taxes/fees/surcharges: 5% GST + platform safety fee included
    const taxRate = 1.05;

    // 7. Ride & Transport Types Configuration (Bike Only)
    const transportConfigs = [
        {
            id: 'bike',
            name: 'Bike Courier',
            icon: '🏍️',
            tagline: 'Swift two-wheeler commuter delivery',
            capacity: 'Up to 30 kg',
            maxWeight: 30,
            baseFare: 28.00,
            perKmRate: 4.80,
            perHalfKgRate: 6.00, // ₹6 per 0.5 kg
            avgSpeedKmH: 32,
            tollAmount: 0 // Two-wheelers exempt
        }
    ];

    const transports = transportConfigs.map(cfg => {
        // Base calculation incorporating distance, weight (₹6 per 0.5 kg), traffic & demand
        const distCost = routeDistanceKm * cfg.perKmRate;
        const weightSlabs = Math.max(1, Math.ceil(wt / 0.5));
        const weightCost = weightSlabs * cfg.perHalfKgRate;
        const rawSubtotal = (cfg.baseFare + distCost + weightCost) * packageMultiplier * trafficMultiplier * demandMultiplier + cfg.tollAmount;

        // Priority Direct (Direct dedicated courier, no intermediate stops)
        const priorityPrice = Math.max(35, Math.round(rawSubtotal * taxRate));

        // Shared Route (Saver) - Commuter corridor discount (~38% off)
        const saverPrice = Math.max(25, Math.round(priorityPrice * 0.62));
        const savings = priorityPrice - saverPrice;

        // Expected travel duration
        let travelMinutes;
        if (liveRoadDurationMins && parseInt(liveRoadDurationMins) > 0) {
            travelMinutes = Math.round(parseInt(liveRoadDurationMins) * trafficMultiplier);
        } else {
            travelMinutes = Math.round((routeDistanceKm / cfg.avgSpeedKmH) * 60 * trafficMultiplier);
        }
        const priorityEta = `${Math.max(4, travelMinutes - 2)}–${travelMinutes + 4} min`;
        const saverEta = `${Math.max(8, travelMinutes + 4)}–${travelMinutes + 12} min`;

        const isWeightExceeded = wt > cfg.maxWeight;

        return {
            ...cfg,
            priorityPrice,
            saverPrice,
            savings,
            priorityEta,
            saverEta,
            isWeightExceeded
        };
    });

    return {
        distanceKm: routeDistanceKm.toFixed(1),
        straightKm: straightDist.toFixed(1),
        weightKg: wt.toFixed(1),
        trafficStatus,
        hasTolls,
        transports
    };
}

function BookParcel() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        pickup_address: '',
        drop_address: '',
        weight: '0.5',
        parcel_type: 'Standard',
        pickup_date: new Date().toISOString().split('T')[0],
        pickup_lat: 28.4723, // Default Greater Noida (Knowledge Park)
        pickup_lng: 77.4893,
        drop_lat: 28.4609,
        drop_lng: 77.4930,
        contact_name: '',
        contact_phone: '',
        preferred_pickup_time: 'Instant / ASAP'
    });

    const [selectedTier, setSelectedTier] = useState('saver'); // 'saver' or 'priority'
    const [selectedVehicle, setSelectedVehicle] = useState('bike');
    const [roadDistanceKm, setRoadDistanceKm] = useState(null);
    const [roadDurationMins, setRoadDurationMins] = useState(null);
    const [quoteData, setQuoteData] = useState(() => calculateMultiFactorQuote(28.4723, 77.4893, 28.4609, 77.4930, '0.5', 'Standard'));
    const [bookedParcel, setBookedParcel] = useState(null);
    const [showFindingModal, setShowFindingModal] = useState(false);

    // Fetch real driving road route whenever coordinates change
    useEffect(() => {
        if (!form.pickup_lat || !form.pickup_lng || !form.drop_lat || !form.drop_lng) return;
        let isCancelled = false;

        const fetchRoute = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/places/route?pLat=${form.pickup_lat}&pLng=${form.pickup_lng}&dLat=${form.drop_lat}&dLng=${form.drop_lng}`);
                if (!isCancelled && res.data?.distanceKm) {
                    setRoadDistanceKm(res.data.distanceKm);
                    setRoadDurationMins(res.data.durationMins);
                }
            } catch (e) {
                console.error("Live road routing error:", e);
            }
        };

        fetchRoute();
        return () => { isCancelled = true; };
    }, [form.pickup_lat, form.pickup_lng, form.drop_lat, form.drop_lng]);

    // Auto-resolve pickup coordinates if text typed
    useEffect(() => {
        if (!form.pickup_address || form.pickup_address.trim().length < 3) return;
        const timer = setTimeout(async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/places/geocode?q=${encodeURIComponent(form.pickup_address.trim())}`);
                if (res.data?.lat && res.data?.lng) {
                    setForm(prev => {
                        if (Math.abs(prev.pickup_lat - res.data.lat) > 0.0001 || Math.abs(prev.pickup_lng - res.data.lng) > 0.0001) {
                            return { ...prev, pickup_lat: res.data.lat, pickup_lng: res.data.lng };
                        }
                        return prev;
                    });
                }
            } catch (e) {}
        }, 500);
        return () => clearTimeout(timer);
    }, [form.pickup_address]);

    // Auto-resolve drop coordinates if text typed
    useEffect(() => {
        if (!form.drop_address || form.drop_address.trim().length < 3) return;
        const timer = setTimeout(async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/places/geocode?q=${encodeURIComponent(form.drop_address.trim())}`);
                if (res.data?.lat && res.data?.lng) {
                    setForm(prev => {
                        if (Math.abs(prev.drop_lat - res.data.lat) > 0.0001 || Math.abs(prev.drop_lng - res.data.lng) > 0.0001) {
                            return { ...prev, drop_lat: res.data.lat, drop_lng: res.data.lng };
                        }
                        return prev;
                    });
                }
            } catch (e) {}
        }, 500);
        return () => clearTimeout(timer);
    }, [form.drop_address]);

    // Recalculate quote live on ANY input change (weight, parcel type, pickup/drop coordinates, live road route)
    useEffect(() => {
        const live = calculateMultiFactorQuote(
            form.pickup_lat,
            form.pickup_lng,
            form.drop_lat,
            form.drop_lng,
            form.weight,
            form.parcel_type,
            roadDistanceKm,
            roadDurationMins
        );
        setQuoteData(live);
    }, [form.pickup_lat, form.pickup_lng, form.drop_lat, form.drop_lng, form.weight, form.parcel_type, roadDistanceKm, roadDurationMins]);

    const handleChange = (e, lat, lng) => {
        setForm(prev => {
            const updates = { [e.target.name]: e.target.value };

            if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
                if (e.target.name === 'pickup_address') {
                    updates.pickup_lat = parseFloat(lat);
                    updates.pickup_lng = parseFloat(lng);
                } else if (e.target.name === 'drop_address') {
                    updates.drop_lat = parseFloat(lat);
                    updates.drop_lng = parseFloat(lng);
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
            const chosenTransport = quoteData.transports.find(t => t.id === selectedVehicle) || quoteData.transports[0];
            const chosenPrice = selectedTier === 'saver' ? chosenTransport.saverPrice : chosenTransport.priorityPrice;
            const chosenEta = selectedTier === 'saver' ? chosenTransport.saverEta : chosenTransport.priorityEta;
            const chosenSavings = (chosenTransport.priorityPrice - chosenTransport.saverPrice).toFixed(2);

            const payload = {
                ...form,
                sender_id: user.id,
                delivery_tier: selectedTier,
                vehicle_type: chosenTransport.name,
                selected_price: chosenPrice,
                savings_amount: chosenSavings,
                estimated_time: chosenEta,
                match_reason: `${chosenTransport.name} (${selectedTier === 'saver' ? 'Shared Commuter' : 'Priority Direct'})`
            };

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/parcels`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`🎉 ${chosenTransport.name} (${selectedTier === 'saver' ? 'Shared Route' : 'Priority Direct'}) confirmed!`);
            
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

    const chosenTransport = quoteData?.transports?.find(t => t.id === selectedVehicle) || quoteData?.transports?.[0] || {
        id: 'bike',
        name: 'Bike Courier',
        icon: '🏍️',
        saverPrice: 35,
        priorityPrice: 55,
        saverEta: '20 min',
        priorityEta: '12 min'
    };
    const chosenPrice = selectedTier === 'saver' ? chosenTransport.saverPrice : chosenTransport.priorityPrice;

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

                            {/* Row 2: Weight, Pickup Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                                            <FaCheck className="text-base" /> Confirm & Book: {chosenTransport.icon} {chosenTransport.name} ({selectedTier === 'saver' ? 'Shared' : 'Priority'}) • ₹{chosenPrice}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* RIGHT COLUMN: Available Transports & Both Prices */}
                <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-6 space-y-4">
                    <div className="bg-[#050D07]/90 border border-emerald-500/20 rounded-2xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(0,255,102,0.05)] backdrop-blur-xl space-y-4">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                            <div>
                                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                                    <span className="text-emerald-400 text-lg">🏍️</span> Bike Courier Delivery
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Two-wheeler delivery • Select pricing tier
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(0,255,102,0.15)]">
                                {quoteData.distanceKm} km • {quoteData.weightKg} kg
                            </span>
                        </div>



                        {/* Transports List */}
                        <div className="space-y-3">
                            {quoteData.transports.map((transport) => {
                                const isSelectedVehicle = selectedVehicle === transport.id;

                                return (
                                    <div 
                                        key={transport.id}
                                        className={`p-3.5 sm:p-4 rounded-xl transition-all duration-200 border ${
                                            isSelectedVehicle 
                                                ? 'bg-emerald-500/10 border-emerald-400/80 shadow-[0_0_20px_rgba(0,255,102,0.15)] ring-1 ring-emerald-400/40' 
                                                : 'bg-black/30 border-white/10 hover:border-emerald-500/30 hover:bg-black/50'
                                        } ${transport.isWeightExceeded ? 'opacity-40 pointer-events-none' : ''}`}
                                    >
                                        {/* Transport Header Info */}
                                        <div className="flex items-center justify-between gap-3 mb-2.5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    {transport.icon}
                                                </span>
                                                <div>
                                                    <div className="font-bold text-white text-sm flex items-center gap-2">
                                                        {transport.name}
                                                        {isSelectedVehicle && (
                                                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#00FF66]"></span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {transport.tagline} • <span className="text-slate-300 font-medium">{transport.capacity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {transport.isWeightExceeded && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                    Max {transport.maxWeight} kg
                                                </span>
                                            )}
                                        </div>

                                        {/* Both Prices for this Transport (Shared Route vs Priority Direct) */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/5">
                                            {/* Option 1: Shared Route (Saver) */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedVehicle(transport.id);
                                                    setSelectedTier('saver');
                                                }}
                                                className={`p-3.5 rounded-xl text-left transition-all border cursor-pointer ${
                                                    selectedTier === 'saver'
                                                        ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_20px_rgba(0,255,102,0.35)] ring-1 ring-emerald-400/50'
                                                        : 'bg-black/50 border-white/10 hover:border-emerald-500/40 text-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-1">
                                                    <span className="flex items-center gap-1.5 font-bold">🌿 Shared Route</span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                                        Save ₹{transport.savings}
                                                    </span>
                                                </div>
                                                <div className="text-2xl font-black text-emerald-400 leading-tight">
                                                    ₹{transport.saverPrice}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-1 font-medium flex items-center gap-1">
                                                    ⏱️ {transport.saverEta}
                                                </div>
                                            </button>

                                            {/* Option 2: Priority Direct (Express) */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedVehicle(transport.id);
                                                    setSelectedTier('priority');
                                                }}
                                                className={`p-3.5 rounded-xl text-left transition-all border cursor-pointer ${
                                                    selectedTier === 'priority'
                                                        ? 'bg-blue-500/25 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] ring-1 ring-blue-400/50'
                                                        : 'bg-black/50 border-white/10 hover:border-blue-500/40 text-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between text-xs font-semibold text-blue-400 mb-1">
                                                    <span className="flex items-center gap-1.5 font-bold">⚡ Priority Direct</span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                                                        Fastest
                                                    </span>
                                                </div>
                                                <div className="text-2xl font-black text-white leading-tight">
                                                    ₹{transport.priorityPrice}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-1 font-medium flex items-center gap-1">
                                                    ⏱️ {transport.priorityEta}
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Active Selection Summary Bar */}
                        <div className="p-3.5 rounded-xl bg-black/50 border border-emerald-500/25 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-base">{chosenTransport.icon}</span>
                                <div>
                                    <span className="text-slate-400 text-[11px]">Selected:</span>
                                    <div className="text-white font-bold">
                                        {chosenTransport.name} • <span className={selectedTier === 'saver' ? 'text-emerald-400' : 'text-blue-400'}>{selectedTier === 'saver' ? 'Shared Route (Saver)' : 'Priority Direct'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-400 text-[10px]">Total Upfront:</span>
                                <div className="text-emerald-400 font-black text-base">
                                    ₹{chosenPrice}
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
