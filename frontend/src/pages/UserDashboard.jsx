import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaBoxOpen, FaCheckCircle, FaMapMarkerAlt, FaPlus, FaCalendarAlt, FaSyncAlt } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/AuthContext";
import DashboardCard from "../components/DashboardCard";
import "./dashboardPage.css";

function UserDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [parcels, setParcels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadData = async (initial = false) => {
        if (initial) setLoading(true);
        else setRefreshing(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            // Fetch all parcels. We'll filter in frontend for now, or if the backend already filters, that's better.
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parcels`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Ensure we only see user`s parcels
            const myParcels = res.data.filter(p => p.sender_id === user.id);
            setParcels(myParcels);
        } catch (err) {
            console.error(err);
            setError('Failed to load your parcels.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) loadData(true);
    }, [user]);

    const normalizeStatus = (status) => {
        if (!status) return "";
        return String(status).trim().toLowerCase().replace(/[\s-]+/g, "_");
    };

    const stats = useMemo(() => {
        const total = parcels.length;
        const delivered = parcels.filter(p => normalizeStatus(p.status) === "delivered").length;
        const active = parcels.filter(p => ["pending", "created", "assigned", "in_transit", "out_for_delivery"].includes(normalizeStatus(p.status))).length;
        
        return { total, delivered, active };
    }, [parcels]);

    const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const getStatusBadge = (status) => {
        const s = String(status || '').toLowerCase();
        if (s.includes('delivered')) return 'badge bg-success text-white';
        if (s.includes('transit') || s.includes('assigned')) return 'badge bg-info text-white';
        if (s.includes('pending')) return 'badge bg-warning text-dark';
        if (s.includes('cancel')) return 'badge bg-danger text-white';
        return 'badge bg-secondary text-white';
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="dashboard-loading-spinner"><FaSyncAlt /></div>
                <h3>Loading Your Dashboard</h3>
            </div>
        );
    }

    return (
        <div className="dashboard-page px-4">
            <ToastContainer />
            <section className="welcome-banner mb-4">
                <div className="welcome-content">
                    <span className="welcome-overline">CUSTOMER PORTAL</span>
                    <h1>Welcome, {user?.full_name?.split(' ')[0] || user?.name || "User"} 👋</h1>
                    <p>Track your deliveries and book new parcels instantly.</p>
                </div>
                <div className="welcome-right">
                    <div className="banner-date">
                        <FaCalendarAlt />
                        <div><span>Today</span><strong>{today}</strong></div>
                    </div>
                    <button type="button" className="dashboard-refresh-button" onClick={() => loadData(false)} disabled={refreshing}>
                        <FaSyncAlt className={refreshing ? "refresh-spin" : ""} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                    <Link to="/book-parcel" className="btn btn-primary rounded-pill px-4 shadow-sm">
                        + Book New Parcel
                    </Link>
                </div>
            </section>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="row g-4 mb-4">
                <div className="col-md-4">
                    <DashboardCard title="Total Shipments" value={stats.total} subtitle="All time parcels" icon={<FaBoxOpen />} color="#2563eb" />
                </div>
                <div className="col-md-4">
                    <DashboardCard title="Active Deliveries" value={stats.active} subtitle="Currently in progress" icon={<FaMapMarkerAlt />} color="#f59e0b" />
                </div>
                <div className="col-md-4">
                    <DashboardCard title="Delivered" value={stats.delivered} subtitle="Successfully delivered" icon={<FaCheckCircle />} color="#10b981" />
                </div>
            </div>

            <div className="card shadow-sm" style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "20px" }}>
                <div className="card-body p-4">
                    <h5 className="fw-bold mb-4" style={{ color: "var(--text-primary)" }}>Your Recent Parcels</h5>
                    
                    {parcels.length === 0 ? (
                        <div className="text-center py-5">
                            <FaBoxOpen size={48} className="text-muted mb-3 opacity-50" />
                            <h5 className="text-muted">No parcels found</h5>
                            <p className="text-muted">You haven't booked any shipments yet.</p>
                            <Link to="/book-parcel" className="btn btn-primary mt-2">Book Your First Parcel</Link>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-borderless text-white align-middle" style={{ '--bs-table-bg': 'transparent' }}>
                                <thead style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                    <tr>
                                        <th className="text-secondary small fw-bold text-uppercase">Tracking ID</th>
                                        <th className="text-secondary small fw-bold text-uppercase">Route</th>
                                        <th className="text-secondary small fw-bold text-uppercase">Type & Weight</th>
                                        <th className="text-secondary small fw-bold text-uppercase">Status</th>
                                        <th className="text-secondary small fw-bold text-uppercase text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parcels.slice().reverse().slice(0, 5).map(parcel => (
                                        <tr key={parcel.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <td className="fw-bold" style={{ color: "var(--accent-cyan)" }}>#{parcel.id}</td>
                                            <td>
                                                <div className="small text-truncate" style={{ maxWidth: "200px" }} title={parcel.pickup_address}>{parcel.pickup_address}</div>
                                                <div className="small text-muted text-truncate" style={{ maxWidth: "200px" }} title={parcel.drop_address}>→ {parcel.drop_address}</div>
                                            </td>
                                            <td>
                                                <div className="small">{parcel.parcel_type}</div>
                                                <div className="small text-muted">{parcel.weight} kg</div>
                                            </td>
                                            <td>
                                                <span className={`rounded-pill px-3 py-1 ${getStatusBadge(parcel.status)}`}>
                                                    {parcel.status}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <button 
                                                    className="btn btn-sm btn-primary rounded-pill px-3 fw-bold shadow-sm"
                                                    onClick={() => navigate(`/tracking?id=${parcel.id}`)}
                                                >
                                                    Track
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserDashboard;
