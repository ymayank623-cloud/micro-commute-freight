import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaRoute,
    FaTruck,
    FaPercent,
    FaMoneyBillWave,
    FaWeightHanging,
    FaClock,
    FaShieldAlt,
    FaCheckCircle,
    FaSlidersH,
    FaExclamationCircle,
    FaSave,
    FaSyncAlt,
    FaGavel,
    FaTimesCircle,
    FaBolt,
    FaLeaf,
    FaUserShield
} from 'react-icons/fa';
import './DispatchPolicyManager.css';

function DispatchPolicyManager({ onClose }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState("matching_pricing"); // "matching_pricing" | "zones_constraints" | "disputes"

    // Policies State
    const [policies, setPolicies] = useState({
        route_match_min_overlap: 70,
        max_commuter_detour_km: 2.5,
        commuter_discount_percent: 30,
        commuter_driver_commission: 85,
        direct_priority_surge: 1.4,
        direct_driver_commission: 80,
        platform_commission: 15,
        cancellation_fee: 40.0,
        cancellation_grace_mins: 3,
        max_parcel_weight_kg: 15.0,
        max_corridor_radius_km: 40.0,
        estimated_delivery_buffer_mins: 8,
        driver_assignment_mode: 'hybrid_smart_match',
        require_otp_verification: true
    });

    // Disputes State
    const [disputes, setDisputes] = useState([]);
    const [resolvingId, setResolvingId] = useState(null);

    // Fetch live policies and disputes from backend
    const fetchPolicyData = async () => {
        try {
            setLoading(true);
            const [policyRes, disputeRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/admin/dispatch-policies`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/admin/disputes`)
            ]);

            if (policyRes.data && policyRes.data.policies) {
                setPolicies(policyRes.data.policies);
            }
            if (disputeRes.data && disputeRes.data.disputes) {
                setDisputes(disputeRes.data.disputes);
            }
        } catch (err) {
            console.error(`Error loading policies:`, err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicyData();
    }, []);

    // Save Updated Policies
    const handleSavePolicies = async (e) => {
        if (e) e.preventDefault();
        try {
            setSaving(true);
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/dispatch-policies`, policies);
            if (res.data && res.data.policies) {
                setPolicies(res.data.policies);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3500);
            }
        } catch (err) {
            console.error('Error saving dispatch policies:', err);
            alert("Failed to save policies. Please check backend connection.");
        } finally {
            setSaving(false);
        }
    };

    // Resolve Dispute
    const handleResolveDispute = async (disputeId, actionType) => {
        try {
            setResolvingId(disputeId);
            const notes = actionType === 'refund' 
                ? 'Full refund processed to customer account' 
                : actionType === 'payout'
                ? 'Driver compensation approved & disbursed'
                : 'Resolved by Admin Policy adjustment';

            await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/disputes/${disputeId}/resolve`, {
                status: 'Resolved',
                resolution_notes: notes
            });

            setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'Resolved', resolution_notes: notes } : d));
        } catch (err) {
            console.error('Error resolving dispute:', err);
        } finally {
            setResolvingId(null);
        }
    };

    return (
        <div className="dispatch-policy-modal-overlay fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 md:p-6" onClick={onClose}>
            <div 
                className="dispatch-policy-modal-card w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0B1120] border border-cyan-500/30 rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_35px_rgba(0,240,255,0.15)] text-white overflow-hidden" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header (Fixed top) */}
                <div className="dispatch-modal-header flex items-center justify-between flex-wrap gap-3 flex-shrink-0 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="policy-badge-icon">
                            <FaSlidersH />
                        </div>
                        <div>
                            <span className="policy-overline">ENTERPRISE DISPATCH COMMAND</span>
                            <h2 className="text-xl md:text-2xl font-extrabold text-white">Driver Matching & Platform Policy Engine</h2>
                            <p className="text-xs md:text-sm text-slate-400 mt-0.5">Configure dual-driver matching, priority pricing, commissions & corridor constraints</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onClose && (
                            <button type="button" className="btn-close-policy hover:text-red-400 transition-colors p-2 text-2xl" onClick={onClose}>
                                <FaTimesCircle />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs Navigation (Fixed top) */}
                <div className="policy-tabs-bar mt-4 flex gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
                    <button
                        type="button"
                        className={`policy-tab-btn flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm transition-all ${activeTab === 'matching_pricing' ? 'active' : ''}`}
                        onClick={() => setActiveTab('matching_pricing')}
                    >
                        <FaRoute />
                        <span>Dual Driver Matching & Pricing</span>
                    </button>
                    <button
                        type="button"
                        className={`policy-tab-btn flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm transition-all ${activeTab === 'zones_constraints' ? 'active' : ''}`}
                        onClick={() => setActiveTab('zones_constraints')}
                    >
                        <FaShieldAlt />
                        <span>Zones, Limits & Commissions</span>
                    </button>
                    <button
                        type="button"
                        className={`policy-tab-btn flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm transition-all ${activeTab === 'disputes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('disputes')}
                    >
                        <FaGavel />
                        <span>Dispute Resolution ({disputes.filter(d => d.status !== 'Resolved').length} Active)</span>
                    </button>
                </div>

                {saveSuccess && (
                    <div className="flex items-center gap-2 mt-3 py-2 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex-shrink-0">
                        <FaCheckCircle className="text-emerald-400" />
                        <span>Platform dispatch rules updated and applied live to all commuter matches!</span>
                    </div>
                )}

                {/* Main Content Sections (Scrollable Body) */}
                <div className="policy-modal-body flex-1 overflow-y-auto pr-2 my-4 space-y-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <FaSyncAlt className="animate-spin text-cyan-400 mx-auto" style={{ fontSize: '32px' }} />
                            <p className="text-slate-400 mt-3 text-sm">Loading active dispatch rules...</p>
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: DUAL DRIVER MATCHING & PRICING */}
                            {activeTab === 'matching_pricing' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* 1. ROUTE-MATCHING COMMUTER DRIVERS */}
                                    <div className="driver-type-panel commuter-card p-5 rounded-2xl flex flex-col justify-between border border-emerald-500/30 bg-slate-900/60">
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="type-icon-box eco">
                                                        <FaLeaf />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-white mb-0.5">1. Route-Matching Commuter Driver</h4>
                                                        <span className="text-emerald-400 text-xs font-semibold">Already commuting towards destination → Cheaper</span>
                                                    </div>
                                                </div>
                                                <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
                                                    Eco Match
                                                </span>
                                            </div>

                                            {/* Rule 1: Min Route Overlap Slider */}
                                            <div className="rule-slider-group mb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="rule-label">Destination / Route Matching Overlap</span>
                                                    <strong className="rule-value text-cyan-400 font-bold">{policies.route_match_min_overlap}%</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
                                                    min="40"
                                                    max="95"
                                                    step="5"
                                                    value={policies.route_match_min_overlap}
                                                    onChange={(e) => setPolicies({ ...policies, route_match_min_overlap: parseInt(e.target.value, 10) })}
                                                />
                                                <span className="rule-hint">Min % of driver's planned route that aligns with parcel drop</span>
                                            </div>

                                            {/* Rule 2: Max Commuter Detour Distance */}
                                            <div className="rule-slider-group mb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="rule-label">Max Permitted Commuter Detour</span>
                                                    <strong className="rule-value text-amber-400 font-bold">{policies.max_commuter_detour_km} km</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400 my-2"
                                                    min="1.0"
                                                    max="10.0"
                                                    step="0.5"
                                                    value={policies.max_commuter_detour_km}
                                                    onChange={(e) => setPolicies({ ...policies, max_commuter_detour_km: parseFloat(e.target.value) })}
                                                />
                                                <span className="rule-hint">Maximum detour allowed from commuter's main transit route</span>
                                            </div>

                                            {/* Rule 3: Commuter Discount % */}
                                            <div className="rule-slider-group mb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="rule-label">Sender Micro-Commute Discount</span>
                                                    <strong className="rule-value text-emerald-400 font-bold">{policies.commuter_discount_percent}% OFF</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400 my-2"
                                                    min="10"
                                                    max="50"
                                                    step="5"
                                                    value={policies.commuter_discount_percent}
                                                    onChange={(e) => setPolicies({ ...policies, commuter_discount_percent: parseInt(e.target.value, 10) })}
                                                />
                                                <span className="rule-hint">Cost reduction passed to user for matching an existing commute</span>
                                            </div>

                                            {/* Rule 4: Commuter Driver Commission */}
                                            <div className="rule-slider-group">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="rule-label">Commuter Payout Share</span>
                                                    <strong className="rule-value text-white font-bold">{policies.commuter_driver_commission}% Driver / {100 - policies.commuter_driver_commission}% FlowLink</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
                                                    min="70"
                                                    max="95"
                                                    step="1"
                                                    value={policies.commuter_driver_commission}
                                                    onChange={(e) => setPolicies({ ...policies, commuter_driver_commission: parseInt(e.target.value, 10) })}
                                                />
                                                <span className="rule-hint">Driver receives {policies.commuter_driver_commission}% of trip fee for zero-waste transport</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. NEARBY / DIRECT PRIORITY DRIVERS */}
                                    <div className="driver-type-panel direct-card p-5 rounded-2xl flex flex-col justify-between border border-amber-500/30 bg-slate-900/60">
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="type-icon-box priority">
                                                        <FaBolt />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-white mb-0.5">2. Nearby / Direct Driver</h4>
                                                        <span className="text-amber-400 text-xs font-semibold">Comes specifically for this parcel → Higher Priority/Price</span>
                                                    </div>
                                                </div>
                                                <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
                                                    Direct Express
                                                </span>
                                            </div>

                                            {/* Rule 1: Priority Surge Multiplier */}
                                            <div className="rule-slider-group mb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="rule-label">Priority Express Price Multiplier</span>
                                                    <strong className="rule-value text-amber-400 font-bold">{policies.direct_priority_surge}x Base</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400 my-2"
                                                    min="1.1"
                                                    max="2.5"
                                                    step="0.1"
                                                    value={policies.direct_priority_surge}
                                                    onChange={(e) => setPolicies({ ...policies, direct_priority_surge: parseFloat(e.target.value) })}
                                                />
                                                <span className="rule-hint">Priority rate charged when user requests dedicated direct courier</span>
                                            </div>

                                            {/* Rule 2: Direct Driver Commission */}
                                            <div className="rule-slider-group mb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="rule-label">Direct Courier Payout Share</span>
                                                    <strong className="rule-value text-white font-bold">{policies.direct_driver_commission}% Driver / {100 - policies.direct_driver_commission}% Platform</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
                                                    min="60"
                                                    max="90"
                                                    step="1"
                                                    value={policies.direct_driver_commission}
                                                    onChange={(e) => setPolicies({ ...policies, direct_driver_commission: parseInt(e.target.value, 10) })}
                                                />
                                                <span className="rule-hint">Courier incentive payout for dedicated point-to-point trip</span>
                                            </div>

                                            {/* Rule 3: Assignment Rules */}
                                            <div className="mb-3">
                                                <label className="rule-label block mb-1.5 font-bold text-xs text-slate-300">Driver Assignment Rules</label>
                                                <select
                                                    className="w-full bg-slate-900 text-white border border-slate-700 rounded-xl text-xs py-2.5 px-3 outline-none focus:border-cyan-400 transition-colors"
                                                    value={policies.driver_assignment_mode}
                                                    onChange={(e) => setPolicies({ ...policies, driver_assignment_mode: e.target.value })}
                                                >
                                                    <option value="hybrid_smart_match">Hybrid Smart Match (Route-Commuter First, Direct Fallback)</option>
                                                    <option value="commuter_only">Eco Commuter Only (Strict matching on active routes)</option>
                                                    <option value="direct_priority_only">Direct Priority Courier Broadcast (Instant dispatch)</option>
                                                </select>
                                                <span className="rule-hint block mt-1">Algorithm order for assigning incoming parcel bookings</span>
                                            </div>

                                            {/* Rule 4: Estimated Delivery Time Buffer */}
                                            <div className="rule-slider-group">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="rule-label">ETA Traffic & Handover Buffer</span>
                                                    <strong className="rule-value text-cyan-400 font-bold">+{policies.estimated_delivery_buffer_mins} Mins</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
                                                    min="2"
                                                    max="20"
                                                    step="1"
                                                    value={policies.estimated_delivery_buffer_mins}
                                                    onChange={(e) => setPolicies({ ...policies, estimated_delivery_buffer_mins: parseInt(e.target.value, 10) })}
                                                />
                                                <span className="rule-hint">Traffic compensation added to road routing ETA</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: ZONES, CONSTRAINTS & COMMISSIONS */}
                            {activeTab === 'zones_constraints' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Platform Fees & Cancellations */}
                                    <div className="driver-type-panel p-5 rounded-2xl flex flex-col justify-between border border-white/10 bg-slate-900/60">
                                        <div>
                                            <h4 className="mb-4 text-base font-bold text-white flex items-center gap-2">
                                                <FaMoneyBillWave className="text-cyan-400" />
                                                Commission & Cancellation Charges
                                            </h4>

                                            <div className="rule-slider-group mb-4">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="rule-label">Platform Service Commission</span>
                                                    <strong className="rule-value text-cyan-400 font-bold">{policies.platform_commission}%</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
                                                    min="5"
                                                    max="30"
                                                    step="1"
                                                    value={policies.platform_commission}
                                                    onChange={(e) => setPolicies({ ...policies, platform_commission: parseInt(e.target.value, 10) })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="rule-label block mb-1 text-xs font-bold text-slate-300">Cancellation Fee (₹)</label>
                                                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mt-1">
                                                        <span className="px-3 text-slate-400 bg-slate-800 text-xs py-2 border-r border-slate-700">₹</span>
                                                        <input
                                                            type="number"
                                                            className="w-full bg-transparent text-white px-3 py-2 text-xs outline-none"
                                                            value={policies.cancellation_fee}
                                                            onChange={(e) => setPolicies({ ...policies, cancellation_fee: parseFloat(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                    <span className="rule-hint">Applied if cancelled after grace period</span>
                                                </div>
                                                <div>
                                                    <label className="rule-label block mb-1 text-xs font-bold text-slate-300">Grace Window</label>
                                                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mt-1">
                                                        <input
                                                            type="number"
                                                            className="w-full bg-transparent text-white px-3 py-2 text-xs outline-none"
                                                            value={policies.cancellation_grace_mins}
                                                            onChange={(e) => setPolicies({ ...policies, cancellation_grace_mins: parseInt(e.target.value, 10) || 0 })}
                                                        />
                                                        <span className="px-3 text-slate-400 bg-slate-800 text-xs py-2 border-l border-slate-700">Mins</span>
                                                    </div>
                                                    <span className="rule-hint">Free cancellation window</span>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 p-4 rounded-xl mt-4 bg-white/[0.03] border border-white/5">
                                                <input
                                                    type="checkbox"
                                                    id="otpCheck"
                                                    className="w-5 h-5 rounded cursor-pointer accent-cyan-400 mt-0.5"
                                                    checked={policies.require_otp_verification}
                                                    onChange={(e) => setPolicies({ ...policies, require_otp_verification: e.target.checked })}
                                                />
                                                <div>
                                                    <label className="text-white font-bold text-sm cursor-pointer" htmlFor="otpCheck">
                                                        Mandatory 4-Digit Pickup & Drop OTP Verification
                                                    </label>
                                                    <span className="block text-slate-400 text-xs mt-1">
                                                        Ensures couriers cannot complete trips without recipient confirmation.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Corridor Radius & Max Parcel Size */}
                                    <div className="driver-type-panel p-5 rounded-2xl flex flex-col justify-between border border-white/10 bg-slate-900/60">
                                        <div>
                                            <h4 className="mb-4 text-base font-bold text-white flex items-center gap-2">
                                                <FaWeightHanging className="text-amber-400" />
                                                Delivery Zones & Parcel Limits
                                            </h4>

                                            <div className="rule-slider-group mb-4">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="rule-label">Max Micro-Commute Corridor Radius</span>
                                                    <strong className="rule-value text-cyan-400 font-bold">{policies.max_corridor_radius_km} km</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
                                                    min="10"
                                                    max="80"
                                                    step="5"
                                                    value={policies.max_corridor_radius_km}
                                                    onChange={(e) => setPolicies({ ...policies, max_corridor_radius_km: parseFloat(e.target.value) })}
                                                />
                                                <span className="rule-hint">Maximum allowable distance between pickup & drop within metro zones</span>
                                            </div>

                                            <div className="rule-slider-group mb-4">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="rule-label">Maximum Parcel Weight Limit</span>
                                                    <strong className="rule-value text-amber-400 font-bold">{policies.max_parcel_weight_kg} kg</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400 my-2"
                                                    min="2.0"
                                                    max="35.0"
                                                    step="1.0"
                                                    value={policies.max_parcel_weight_kg}
                                                    onChange={(e) => setPolicies({ ...policies, max_parcel_weight_kg: parseFloat(e.target.value) })}
                                                />
                                                <span className="rule-hint">Commuter transport safety limit for bikes, scooters, and cars</span>
                                            </div>

                                            <div className="p-4 rounded-xl mt-4 bg-cyan-950/20 border border-cyan-500/20">
                                                <strong className="text-cyan-400 block mb-1 text-xs uppercase tracking-wider font-bold">🏙️ Active Indian Metro Hubs:</strong>
                                                <span className="text-slate-300 text-xs">
                                                    Delhi NCR (80km) • Lucknow (80km) • Mumbai (80km) • Bengaluru (80km) • Hyderabad (80km) • Ahmedabad (80km)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: DISPUTE RESOLUTION */}
                            {activeTab === 'disputes' && (
                                <div className="disputes-container space-y-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-base font-bold text-white mb-0">Active Driver & Customer Disputes</h4>
                                        <span className="text-slate-400 text-xs">Review claims, fee appeals & transit exceptions</span>
                                    </div>

                                    {disputes.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <FaCheckCircle className="text-emerald-400 mx-auto mb-2 text-3xl" />
                                            <p className="text-sm">Zero outstanding disputes! All courier settlements are clear.</p>
                                        </div>
                                    ) : (
                                        <div className="dispute-list flex flex-col gap-3">
                                            {disputes.map(ticket => (
                                                <div key={ticket.id} className="dispute-card p-4 rounded-2xl border border-white/10 bg-slate-900/60">
                                                    <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <strong className="text-white text-sm">{ticket.ticket_id}</strong>
                                                                <span className={`badge ${ticket.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} border text-[11px] px-2 py-0.5 rounded-full font-bold`}>
                                                                    {ticket.status}
                                                                </span>
                                                                <span className="text-cyan-400 text-xs font-bold">#{ticket.parcel_id}</span>
                                                            </div>
                                                            <span className="text-slate-400 text-xs block mt-1">Claimant: {ticket.user_email} • Driver #{ticket.driver_id}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <strong className="text-amber-400 block text-sm">₹{ticket.amount}</strong>
                                                            <span className="text-slate-400 text-xs">{ticket.dispute_type}</span>
                                                        </div>
                                                    </div>

                                                    <p className="dispute-desc text-slate-200 text-xs p-3 rounded-xl my-3 bg-white/[0.03] border border-white/5">
                                                        {ticket.description}
                                                    </p>

                                                    {ticket.status !== 'Resolved' ? (
                                                        <div className="flex gap-2 justify-end flex-wrap pt-2">
                                                            <button
                                                                type="button"
                                                                className="px-3 py-1.5 rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors cursor-pointer"
                                                                disabled={resolvingId === ticket.id}
                                                                onClick={() => handleResolveDispute(ticket.id, 'refund')}
                                                            >
                                                                💳 Process Refund (₹{ticket.amount})
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="px-3 py-1.5 rounded-full border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-xs font-bold transition-colors cursor-pointer"
                                                                disabled={resolvingId === ticket.id}
                                                                onClick={() => handleResolveDispute(ticket.id, 'payout')}
                                                            >
                                                                🚗 Approve Driver Payout
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="px-3 py-1.5 rounded-full border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold transition-colors cursor-pointer"
                                                                disabled={resolvingId === ticket.id}
                                                                onClick={() => handleResolveDispute(ticket.id, 'dismiss')}
                                                            >
                                                                ✅ Dismiss & Resolve
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-emerald-400 text-xs font-bold mt-2">
                                                            ✓ Resolution: {ticket.resolution_notes || 'Resolved by Admin'}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modal Footer (Fixed bottom) */}
                <div className="dispatch-modal-footer flex items-center justify-between pt-4 mt-auto border-t border-white/10 flex-wrap gap-3 flex-shrink-0">
                    <span className="text-slate-400 text-xs">
                        🛡️ Policies directly control real-time algorithm dispatch & pricing across Indian corridors.
                    </span>

                    <div className="flex items-center gap-3">
                        {onClose && (
                            <button 
                                type="button" 
                                className="px-5 py-2 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-xs font-semibold cursor-pointer" 
                                onClick={onClose}
                            >
                                Close
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn-save-policy flex items-center gap-2 rounded-full px-5 py-2 cursor-pointer font-bold text-xs md:text-sm"
                            onClick={handleSavePolicies}
                            disabled={saving}
                        >
                            <FaSave />
                            <span>{saving ? "Applying Rules..." : "Save & Apply Live Rules"}</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default DispatchPolicyManager;
