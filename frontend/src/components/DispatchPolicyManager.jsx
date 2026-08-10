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
        <div className="dispatch-policy-modal-overlay" onClick={onClose}>
            <div className="dispatch-policy-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div className="dispatch-modal-header d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className="policy-badge-icon">
                            <FaSlidersH />
                        </div>
                        <div>
                            <span className="policy-overline">ENTERPRISE DISPATCH COMMAND</span>
                            <h2 className="mb-0">Driver Matching & Platform Policy Engine</h2>
                            <p className="mb-0 mt-1">Configure dual-driver matching, priority pricing, commissions & corridor constraints</p>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        {onClose && (
                            <button type="button" className="btn-close-policy" onClick={onClose}>
                                <FaTimesCircle />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="policy-tabs-bar mt-3 d-flex gap-2">
                    <button
                        type="button"
                        className={`policy-tab-btn ${activeTab === 'matching_pricing' ? 'active' : ''}`}
                        onClick={() => setActiveTab('matching_pricing')}
                    >
                        <FaRoute />
                        <span>Dual Driver Matching & Pricing</span>
                    </button>
                    <button
                        type="button"
                        className={`policy-tab-btn ${activeTab === 'zones_constraints' ? 'active' : ''}`}
                        onClick={() => setActiveTab('zones_constraints')}
                    >
                        <FaShieldAlt />
                        <span>Zones, Limits & Commissions</span>
                    </button>
                    <button
                        type="button"
                        className={`policy-tab-btn ${activeTab === 'disputes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('disputes')}
                    >
                        <FaGavel />
                        <span>Dispute Resolution ({disputes.filter(d => d.status !== 'Resolved').length} Active)</span>
                    </button>
                </div>

                {saveSuccess && (
                    <div className="alert alert-success d-flex align-items-center gap-2 mt-3 mb-0 rounded-4 py-2 px-3">
                        <FaCheckCircle className="text-success" />
                        <strong>Platform dispatch rules updated and applied live to all commuter matches!</strong>
                    </div>
                )}

                {/* Main Content Sections */}
                <div className="policy-modal-body mt-3">
                    {loading ? (
                        <div className="text-center py-5">
                            <FaSyncAlt className="spinning text-info" style={{ fontSize: '32px' }} />
                            <p className="text-secondary mt-2">Loading active dispatch rules...</p>
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: DUAL DRIVER MATCHING & PRICING */}
                            {activeTab === 'matching_pricing' && (
                                <div className="row g-4">
                                    {/* 1. ROUTE-MATCHING COMMUTER DRIVERS */}
                                    <div className="col-lg-6">
                                        <div className="driver-type-panel commuter-card p-4 rounded-4 h-100">
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="type-icon-box eco">
                                                        <FaLeaf />
                                                    </div>
                                                    <div>
                                                        <h4 className="mb-0 text-white">1. Route-Matching Commuter Driver</h4>
                                                        <span className="text-success small fw-bold">Already commuting towards destination → Cheaper</span>
                                                    </div>
                                                </div>
                                                <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50">
                                                    Eco Match
                                                </span>
                                            </div>

                                            {/* Rule 1: Min Route Overlap Slider */}
                                            <div className="rule-slider-group mb-3">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="rule-label">Destination / Route Matching Overlap</span>
                                                    <strong className="rule-value text-info">{policies.route_match_min_overlap}%</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="form-range custom-policy-range"
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
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="rule-label">Max Permitted Commuter Detour</span>
                                                    <strong className="rule-value text-warning">{policies.max_commuter_detour_km} km</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="form-range custom-policy-range"
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
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="rule-label">Sender Micro-Commute Discount</span>
                                                    <strong className="rule-value text-success">{policies.commuter_discount_percent}% OFF</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="form-range custom-policy-range"
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
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="rule-label">Commuter Payout Share</span>
                                                    <strong className="rule-value text-white">{policies.commuter_driver_commission}% Driver / {100 - policies.commuter_driver_commission}% FlowLink</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="form-range custom-policy-range"
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
                                    <div className="col-lg-6">
                                        <div className="driver-type-panel direct-card p-4 rounded-4 h-100">
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="type-icon-box priority">
                                                        <FaBolt />
                                                    </div>
                                                    <div>
                                                        <h4 className="mb-0 text-white">2. Nearby / Direct Driver</h4>
                                                        <span className="text-warning small fw-bold">Comes specifically for this parcel → Higher Priority/Price</span>
                                                    </div>
                                                </div>
                                                <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-50">
                                                    Direct Express
                                                </span>
                                            </div>

                                            {/* Rule 1: Priority Surge Multiplier */}
                                            <div className="rule-slider-group mb-3">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="rule-label">Priority Express Price Multiplier</span>
                                                    <strong className="rule-value text-warning">{policies.direct_priority_surge}x Base</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="form-range custom-policy-range"
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
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="rule-label">Direct Courier Payout Share</span>
                                                    <strong className="rule-value text-white">{policies.direct_driver_commission}% Driver / {100 - policies.direct_driver_commission}% Platform</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="form-range custom-policy-range"
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
                                                <label className="rule-label d-block mb-1.5">Driver Assignment Rules</label>
                                                <select
                                                    className="form-select custom-policy-select"
                                                    value={policies.driver_assignment_mode}
                                                    onChange={(e) => setPolicies({ ...policies, driver_assignment_mode: e.target.value })}
                                                >
                                                    <option value="hybrid_smart_match">Hybrid Smart Match (Route-Commuter First, Direct Fallback)</option>
                                                    <option value="commuter_only">Eco Commuter Only (Strict matching on active routes)</option>
                                                    <option value="direct_priority_only">Direct Priority Courier Broadcast (Instant dispatch)</option>
                                                </select>
                                                <span className="rule-hint d-block mt-1">Algorithm order for assigning incoming parcel bookings</span>
                                            </div>

                                            {/* Rule 4: Estimated Delivery Time Buffer */}
                                            <div className="rule-slider-group">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="rule-label">ETA Traffic & Handover Buffer</span>
                                                    <strong className="rule-value text-info">+{policies.estimated_delivery_buffer_mins} Mins</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="form-range custom-policy-range"
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
                                <div className="row g-4">
                                    {/* Platform Fees & Cancellations */}
                                    <div className="col-lg-6">
                                        <div className="driver-type-panel p-4 rounded-4 h-100">
                                            <h4 className="mb-3 text-white d-flex align-items-center gap-2">
                                                <FaMoneyBillWave className="text-info" />
                                                Commission & Cancellation Charges
                                            </h4>

                                            <div className="rule-slider-group mb-3">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="rule-label">Platform Service Commission</span>
                                                    <strong className="rule-value text-info">{policies.platform_commission}%</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="form-range custom-policy-range"
                                                    min="5"
                                                    max="30"
                                                    step="1"
                                                    value={policies.platform_commission}
                                                    onChange={(e) => setPolicies({ ...policies, platform_commission: parseInt(e.target.value, 10) })}
                                                />
                                            </div>

                                            <div className="row g-3 mb-3">
                                                <div className="col-6">
                                                    <label className="rule-label">Cancellation Fee (₹)</label>
                                                    <div className="input-group mt-1">
                                                        <span className="input-group-text bg-dark text-muted border-secondary">₹</span>
                                                        <input
                                                            type="number"
                                                            className="form-control bg-dark text-white border-secondary"
                                                            value={policies.cancellation_fee}
                                                            onChange={(e) => setPolicies({ ...policies, cancellation_fee: parseFloat(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                    <span className="rule-hint">Applied if cancelled after grace period</span>
                                                </div>
                                                <div className="col-6">
                                                    <label className="rule-label">Cancellation Grace Window</label>
                                                    <div className="input-group mt-1">
                                                        <input
                                                            type="number"
                                                            className="form-control bg-dark text-white border-secondary"
                                                            value={policies.cancellation_grace_mins}
                                                            onChange={(e) => setPolicies({ ...policies, cancellation_grace_mins: parseInt(e.target.value, 10) || 0 })}
                                                        />
                                                        <span className="input-group-text bg-dark text-muted border-secondary">Mins</span>
                                                    </div>
                                                    <span className="rule-hint">Free cancellation window</span>
                                                </div>
                                            </div>

                                            <div className="form-check form-switch p-3 rounded-3 mt-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                <input
                                                    className="form-check-input ms-0 me-3"
                                                    type="checkbox"
                                                    id="otpCheck"
                                                    checked={policies.require_otp_verification}
                                                    onChange={(e) => setPolicies({ ...policies, require_otp_verification: e.target.checked })}
                                                    style={{ transform: 'scale(1.3)' }}
                                                />
                                                <label className="form-check-label text-white fw-bold" htmlFor="otpCheck">
                                                    Mandatory 4-Digit Pickup & Drop OTP Verification
                                                </label>
                                                <span className="d-block text-secondary small mt-1">
                                                    Ensures couriers cannot complete trips without recipient confirmation.
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Corridor Radius & Max Parcel Size */}
                                    <div className="col-lg-6">
                                        <div className="driver-type-panel p-4 rounded-4 h-100">
                                            <h4 className="mb-3 text-white d-flex align-items-center gap-2">
                                                <FaWeightHanging className="text-warning" />
                                                Delivery Zones & Parcel Limits
                                            </h4>

                                            <div className="rule-slider-group mb-3">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="rule-label">Max Micro-Commute Corridor Radius</span>
                                                    <strong className="rule-value text-info">{policies.max_corridor_radius_km} km</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="form-range custom-policy-range"
                                                    min="10"
                                                    max="80"
                                                    step="5"
                                                    value={policies.max_corridor_radius_km}
                                                    onChange={(e) => setPolicies({ ...policies, max_corridor_radius_km: parseFloat(e.target.value) })}
                                                />
                                                <span className="rule-hint">Maximum allowable distance between pickup & drop within metro zones</span>
                                            </div>

                                            <div className="rule-slider-group mb-3">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="rule-label">Maximum Parcel Weight Limit</span>
                                                    <strong className="rule-value text-warning">{policies.max_parcel_weight_kg} kg</strong>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="form-range custom-policy-range"
                                                    min="2.0"
                                                    max="35.0"
                                                    step="1.0"
                                                    value={policies.max_parcel_weight_kg}
                                                    onChange={(e) => setPolicies({ ...policies, max_parcel_weight_kg: parseFloat(e.target.value) })}
                                                />
                                                <span className="rule-hint">Commuter transport safety limit for bikes, scooters, and cars</span>
                                            </div>

                                            <div className="p-3 rounded-3 mt-4" style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                                                <strong className="text-info d-block mb-1">🏙️ Active Indian Metro Hubs:</strong>
                                                <span className="text-secondary small">
                                                    Delhi NCR (80km) • Lucknow (80km) • Mumbai (80km) • Bengaluru (80km) • Hyderabad (80km) • Ahmedabad (80km)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: DISPUTE RESOLUTION */}
                            {activeTab === 'disputes' && (
                                <div className="disputes-container">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h4 className="mb-0 text-white">Active Driver & Customer Disputes</h4>
                                        <span className="text-secondary small">Review claims, fee appeals & transit exceptions</span>
                                    </div>

                                    {disputes.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            <FaCheckCircle className="text-success mb-2" style={{ fontSize: '28px' }} />
                                            <p className="mb-0">Zero outstanding disputes! All courier settlements are clear.</p>
                                        </div>
                                    ) : (
                                        <div className="dispute-list d-flex flex-column gap-3">
                                            {disputes.map(ticket => (
                                                <div key={ticket.id} className="dispute-card p-3 rounded-4">
                                                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                                                        <div>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <strong className="text-white">{ticket.ticket_id}</strong>
                                                                <span className={`badge ${ticket.status === 'Resolved' ? 'bg-success' : 'bg-danger'} bg-opacity-25 ${ticket.status === 'Resolved' ? 'text-success' : 'text-danger'} border`}>
                                                                    {ticket.status}
                                                                </span>
                                                                <span className="text-info small fw-bold">#{ticket.parcel_id}</span>
                                                            </div>
                                                            <span className="text-secondary small d-block mt-0.5">Claimant: {ticket.user_email} • Driver #{ticket.driver_id}</span>
                                                        </div>
                                                        <div className="text-end">
                                                            <strong className="text-warning d-block">₹{ticket.amount}</strong>
                                                            <span className="text-muted small">{ticket.dispute_type}</span>
                                                        </div>
                                                    </div>

                                                    <p className="dispute-desc text-light mb-3 small p-2 rounded-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                        {ticket.description}
                                                    </p>

                                                    {ticket.status !== 'Resolved' ? (
                                                        <div className="d-flex gap-2 justify-content-end flex-wrap">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                                                disabled={resolvingId === ticket.id}
                                                                onClick={() => handleResolveDispute(ticket.id, 'refund')}
                                                            >
                                                                💳 Process Refund (₹{ticket.amount})
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-info rounded-pill px-3"
                                                                disabled={resolvingId === ticket.id}
                                                                onClick={() => handleResolveDispute(ticket.id, 'payout')}
                                                            >
                                                                🚗 Approve Driver Payout
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-success rounded-pill px-3"
                                                                disabled={resolvingId === ticket.id}
                                                                onClick={() => handleResolveDispute(ticket.id, 'dismiss')}
                                                            >
                                                                ✅ Dismiss & Resolve
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-success small fw-bold mt-2">
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

                {/* Modal Footer */}
                <div className="dispatch-modal-footer d-flex align-items-center justify-content-between mt-4 pt-3 border-top border-secondary border-opacity-25 flex-wrap gap-2">
                    <span className="text-secondary small">
                        🛡️ Policies directly control real-time algorithm dispatch & pricing across Indian corridors.
                    </span>

                    <div className="d-flex gap-2">
                        {onClose && (
                            <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>
                                Close
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-save-policy d-flex align-items-center gap-2 rounded-pill px-4"
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
