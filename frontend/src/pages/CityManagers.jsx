import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { motion } from 'framer-motion';
import { 
    FaCity, 
    FaUserTie, 
    FaMapMarkedAlt, 
    FaTruck, 
    FaBoxes, 
    FaPhoneAlt, 
    FaEnvelope, 
    FaPlus, 
    FaSearch, 
    FaShieldAlt, 
    FaTimes,
    FaRoute,
    FaTrashAlt,
    FaEdit,
    FaCheckCircle,
    FaLayerGroup
} from 'react-icons/fa';
import DashboardCard from '../components/DashboardCard';
import './CityManagers.css';

const ZONES = ['All Zones', 'North Zone', 'West Zone', 'South Zone', 'East Zone'];

function CityManagers() {
    const [managers, setManagers] = useState([]);
    const [kpis, setKpis] = useState({ totalHubs: 0, totalDrivers: 0, totalParcels: 0, activeParcels: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState('All Zones');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingManager, setEditingManager] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        hub_name: '',
        zone: 'North Zone',
        corridor_radius_km: 80,
        employee_id: ''
    });

    useEffect(() => {
        fetchManagers();
    }, [selectedZone]);

    const fetchManagers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = {};
            if (selectedZone !== 'All Zones') params.zone = selectedZone;
            if (searchQuery) params.search = searchQuery;

            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/city-managers`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            if (res.data.managers) {
                setManagers(res.data.managers);
                setKpis(res.data.kpis);
            } else if (Array.isArray(res.data)) {
                setManagers(res.data);
            }
        } catch (error) {
            console.error('Error fetching city managers:', error);
            toast.error('Failed to load city managers.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchManagers();
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOpenCreateModal = () => {
        setEditingManager(null);
        setFormData({
            full_name: '',
            email: '',
            phone: '',
            city: '',
            state: '',
            hub_name: '',
            zone: 'North Zone',
            corridor_radius_km: 80,
            employee_id: ''
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (manager) => {
        setEditingManager(manager);
        setFormData({
            full_name: manager.full_name,
            email: manager.email,
            phone: manager.phone,
            city: manager.city,
            state: manager.state,
            hub_name: manager.hub_name,
            zone: manager.zone,
            corridor_radius_km: manager.corridor_radius_km || 60,
            employee_id: manager.employee_id
        });
        setShowModal(true);
    };

    const handleSubmitManager = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            if (editingManager) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/city-managers/${editingManager.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success(`Updated ${formData.full_name}'s details successfully!`);
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/city-managers`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success(`Assigned ${formData.full_name} as City Manager for ${formData.city}!`);
            }
            setShowModal(false);
            fetchManagers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save city manager.');
        }
    };

    const handleDeleteManager = async (id, name, city) => {
        if (!window.confirm(`Are you sure you want to remove ${name} as City Manager for ${city}?`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/city-managers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Removed ${name} from ${city} operations.`);
            fetchManagers();
        } catch (error) {
            toast.error('Failed to remove city manager.');
        }
    };

    return (
        <div className="city-managers-page px-3 px-md-4 py-3">
            <ToastContainer position="top-right" />

            {/* TOP WELCOME HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge px-3 py-1 rounded-pill" style={{ background: 'rgba(0, 240, 255, 0.12)', color: '#00F0FF', border: '1px solid rgba(0, 240, 255, 0.35)', fontSize: '11px', fontWeight: '700' }}>
                            🇮🇳 INDIA FREIGHT NETWORK OPERATIONS
                        </span>
                    </div>
                    <h2 className="fw-bold text-white mb-1 d-flex align-items-center gap-2" style={{ letterSpacing: '-0.5px' }}>
                        <FaCity style={{ color: '#00F0FF' }} /> City Operations & Hub Managers
                    </h2>
                    <p className="text-secondary small mb-0">
                        Manage verified regional managers, metropolitan logistics corridors, and real-time commuter fleet coverage across India.
                    </p>
                </div>

                <button 
                    className="btn btn-primary fw-bold px-4 py-2 rounded-pill shadow-lg d-flex align-items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #00F0FF, #3B82F6)', color: '#050914', border: 'none', fontSize: '14px' }}
                    onClick={handleOpenCreateModal}
                >
                    <FaPlus /> Assign City Manager
                </button>
            </div>

            {/* REAL DATABASE KPI METRICS ROW */}
            <div className="row g-3 mb-4">
                <div className="col-lg-3 col-sm-6">
                    <DashboardCard 
                        title="Active City Hubs" 
                        value={kpis.totalHubs || managers.length} 
                        subtitle="Operational Metros in India" 
                        icon={<FaCity />} 
                        color="#00F0FF" 
                    />
                </div>
                <div className="col-lg-3 col-sm-6">
                    <DashboardCard 
                        title="Registered Fleet Drivers" 
                        value={`${kpis.totalDrivers} Drivers`} 
                        subtitle="Real drivers in DB" 
                        icon={<FaTruck />} 
                        color="#10B981" 
                    />
                </div>
                <div className="col-lg-3 col-sm-6">
                    <DashboardCard 
                        title="Total Parcels Handled" 
                        value={`${kpis.totalParcels} Orders`} 
                        subtitle="Lifetime network volume" 
                        icon={<FaBoxes />} 
                        color="#3B82F6" 
                    />
                </div>
                <div className="col-lg-3 col-sm-6">
                    <DashboardCard 
                        title="Active Shipments" 
                        value={`${kpis.activeParcels} Live`} 
                        subtitle="Pending & in transit" 
                        icon={<FaRoute />} 
                        color="#F59E0B" 
                    />
                </div>
            </div>

            {/* SEARCH & ZONE FILTER STRIP */}
            <div className="card p-3 rounded-4 mb-4" style={{ background: '#0B1120', border: '1.5px solid rgba(0, 240, 255, 0.25)' }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    
                    {/* Zone Pills */}
                    <div className="d-flex gap-2 flex-wrap">
                        {ZONES.map(zone => (
                            <button
                                key={zone}
                                className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${selectedZone === zone ? 'btn-primary' : 'btn-outline-secondary'}`}
                                style={{
                                    background: selectedZone === zone ? 'linear-gradient(135deg, #00F0FF, #3B82F6)' : 'transparent',
                                    color: selectedZone === zone ? '#050914' : '#CBD5E1',
                                    border: selectedZone === zone ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                                onClick={() => setSelectedZone(zone)}
                            >
                                {zone}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="d-flex gap-2 flex-grow-1" style={{ minWidth: '220px' }}>
                        <div className="input-group input-group-sm flex-grow-1" style={{ minWidth: '160px' }}>
                            <span className="input-group-text bg-dark border-secondary text-info">
                                <FaSearch />
                            </span>
                            <input 
                                type="text"
                                className="form-control bg-dark text-white border-secondary"
                                placeholder="Search city, manager, hub..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-sm btn-outline-info rounded-pill px-3 fw-bold">
                            Filter
                        </button>
                    </form>

                </div>
            </div>

            {/* CITY MANAGERS CARDS GRID */}
            {loading ? (
                <div className="text-center py-5 text-secondary">
                    <div className="spinner-border text-info mb-2" role="status"></div>
                    <p>Loading Indian City Operations Managers...</p>
                </div>
            ) : managers.length === 0 ? (
                <div className="text-center py-5 text-muted card p-5 rounded-4" style={{ background: '#0B1120', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                    <FaCity size={48} className="mb-3 opacity-50 text-info" />
                    <h5 className="text-white">No City Managers Found</h5>
                    <p className="text-secondary small">Click "+ Assign City Manager" to add an operations lead for a new Indian city hub.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {managers.map(manager => (
                        <div key={manager.id} className="col-lg-6 col-xl-4">
                            <div className="city-manager-card h-100">
                                
                                {/* TOP CITY & EMPLOYEE BADGE */}
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <h4 className="city-card-title mb-0">
                                                {manager.city}
                                            </h4>
                                            <span className="badge city-emp-badge rounded-pill px-2 py-1 font-monospace" style={{ fontSize: '11px' }}>
                                                {manager.employee_id}
                                            </span>
                                        </div>
                                        <span className="city-card-subtitle d-block">
                                            {manager.state} • <strong className="text-info">{manager.zone}</strong>
                                        </span>
                                    </div>
                                    
                                    <div className="d-flex align-items-center gap-1">
                                        <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 px-2 py-1 rounded-pill fw-bold" style={{ fontSize: '11px' }}>
                                            ● {manager.status || 'Operational'}
                                        </span>
                                        <button 
                                            className="btn-action-icon ms-1"
                                            title="Edit Hub Details"
                                            onClick={() => handleOpenEditModal(manager)}
                                        >
                                            <FaEdit style={{ fontSize: '12px' }} />
                                        </button>
                                        <button 
                                            className="btn-action-icon"
                                            title="Remove Manager"
                                            onClick={() => handleDeleteManager(manager.id, manager.full_name, manager.city)}
                                        >
                                            <FaTrashAlt style={{ fontSize: '12px' }} />
                                        </button>
                                    </div>
                                </div>

                                {/* HUB NAME & CORRIDOR */}
                                <div className="hub-details-box mb-3">
                                    <span className="hub-details-title small d-block mb-1" style={{ fontSize: '12.5px' }}>
                                        <FaMapMarkedAlt className="me-1 text-info" /> {manager.hub_name}
                                    </span>
                                    <div className="d-flex justify-content-between text-secondary" style={{ fontSize: '11.5px' }}>
                                        <span><FaRoute className="text-success me-1" /> Radius: <strong className="corridor-value">{manager.corridor_radius_km || 80} km</strong></span>
                                        <span className="text-info"><FaShieldAlt className="me-1" /> Verified Hub</span>
                                    </div>
                                </div>

                                {/* MANAGER PROFILE */}
                                <div className="manager-profile-box d-flex align-items-center gap-3 mb-3 p-3">
                                    <div className="manager-avatar-badge">
                                        {manager.full_name.charAt(0)}
                                    </div>
                                    <div className="flex-grow-1">
                                        <h5 className="manager-name mb-0">
                                            {manager.full_name}
                                        </h5>
                                        <span className="manager-role d-block">
                                            City Operations Lead
                                        </span>
                                    </div>
                                </div>

                                {/* CONTACT BUTTONS */}
                                <div className="d-flex gap-2 mt-auto pt-2">
                                    <a 
                                        href={`tel:${manager.phone}`} 
                                        className="btn-manager-call flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                                    >
                                        <FaPhoneAlt /> Call
                                    </a>
                                    <a 
                                        href={`mailto:${manager.email}`} 
                                        className="btn-manager-email flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                                    >
                                        <FaEnvelope /> Email
                                    </a>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ASSIGN / EDIT CITY MANAGER MODAL */}
            {showModal && (
                <div className="city-modal-overlay">
                    <div className="city-modal-container p-4">
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-50">
                            <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                <FaUserTie className="text-info" /> {editingManager ? 'Edit City Operations Manager' : 'Assign New City Operations Manager'}
                            </h5>
                            <button className="btn btn-sm btn-outline-secondary text-white rounded-circle" onClick={() => setShowModal(false)}>
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitManager}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label text-light small fw-bold">Full Name *</label>
                                    <input 
                                        type="text" 
                                        name="full_name"
                                        required
                                        className="form-control bg-dark text-white border-secondary"
                                        placeholder="e.g. Ramesh Chandra"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-light small fw-bold">Employee ID *</label>
                                    <input 
                                        type="text" 
                                        name="employee_id"
                                        required
                                        className="form-control bg-dark text-white border-secondary"
                                        placeholder="e.g. IND-KAN-009"
                                        value={formData.employee_id}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-light small fw-bold">Email Address *</label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        required
                                        className="form-control bg-dark text-white border-secondary"
                                        placeholder="e.g. ramesh@flowlink.in"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-light small fw-bold">Phone Number *</label>
                                    <input 
                                        type="text" 
                                        name="phone"
                                        required
                                        className="form-control bg-dark text-white border-secondary"
                                        placeholder="e.g. +91 98765 43210"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-light small fw-bold">City *</label>
                                    <input 
                                        type="text" 
                                        name="city"
                                        required
                                        className="form-control bg-dark text-white border-secondary"
                                        placeholder="e.g. Kanpur / Chandigarh"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-light small fw-bold">State *</label>
                                    <input 
                                        type="text" 
                                        name="state"
                                        required
                                        className="form-control bg-dark text-white border-secondary"
                                        placeholder="e.g. Uttar Pradesh / Punjab"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-light small fw-bold">Zone *</label>
                                    <select 
                                        name="zone"
                                        className="form-select bg-dark text-white border-secondary"
                                        value={formData.zone}
                                        onChange={handleInputChange}
                                    >
                                        <option value="North Zone">North Zone</option>
                                        <option value="West Zone">West Zone</option>
                                        <option value="South Zone">South Zone</option>
                                        <option value="East Zone">East Zone</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-light small fw-bold">Corridor Radius (KM)</label>
                                    <input 
                                        type="number" 
                                        name="corridor_radius_km"
                                        className="form-control bg-dark text-white border-secondary"
                                        value={formData.corridor_radius_km}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label text-light small fw-bold">Hub / Facility Name *</label>
                                    <input 
                                        type="text" 
                                        name="hub_name"
                                        required
                                        className="form-control bg-dark text-white border-secondary"
                                        placeholder="e.g. Civil Lines & Industrial Area Transit Node"
                                        value={formData.hub_name}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary rounded-pill px-4 fw-bold"
                                    style={{ background: 'linear-gradient(135deg, #00F0FF, #3B82F6)', color: '#050914', border: 'none' }}
                                >
                                    {editingManager ? 'Save Changes' : 'Confirm Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CityManagers;
