import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FaBoxOpen, FaSyncAlt } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./dashboardPage.css";

function UserParcels() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [parcels, setParcels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParcels = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/parcels`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const myParcels = res.data.filter(p => p.sender_id === user.id);
                setParcels(myParcels.reverse());
            } catch (err) {
                console.error('Failed to fetch parcels', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchParcels();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="dashboard-loading-spinner"><FaSyncAlt /></div>
                <h3>Loading Your Parcels</h3>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const s = String(status || '').toLowerCase();
        if (s.includes('delivered')) return 'badge bg-success text-white';
        if (s.includes('transit') || s.includes('assigned')) return 'badge bg-info text-white';
        if (s.includes('pending')) return 'badge bg-warning text-dark';
        if (s.includes('cancel')) return 'badge bg-danger text-white';
        return 'badge bg-secondary text-white';
    };

    return (
        <div className="dashboard-page px-4">
            <ToastContainer />
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1" style={{ color: "var(--text-primary)" }}>
                        My Parcels
                    </h2>
                    <p className="text-secondary mb-0">Complete history and live tracking for all your shipments.</p>
                </div>
                <Link to="/book-parcel" className="btn btn-primary rounded-pill px-4 shadow-sm">
                    + Book New Parcel
                </Link>
            </div>

            <div className="card shadow-sm" style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "20px" }}>
                <div className="card-body p-4">
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
                                        <th className="text-secondary small fw-bold text-uppercase">Date</th>
                                        <th className="text-secondary small fw-bold text-uppercase text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parcels.map(parcel => (
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
                                            <td>
                                                <div className="small text-muted">
                                                    {new Date(parcel.pickup_date).toLocaleDateString()}
                                                </div>
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

export default UserParcels;
