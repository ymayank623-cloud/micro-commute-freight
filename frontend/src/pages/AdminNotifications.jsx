import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaBell, FaCheck, FaExclamationCircle, FaInfoCircle, FaCheckCircle, FaTrash } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./dashboardPage.css";

function AdminNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem(`token`);
            await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            toast.success('All caught up!');
        } catch (error) {
            console.error(error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'alert': return <FaExclamationCircle className="text-warning" size={24} />;
            case "success": return <FaCheckCircle className="text-success" size={24} />;
            default: return <FaInfoCircle className="text-info" size={24} />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="dashboard-page px-4">
            <ToastContainer />
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0" style={{ color: "var(--text-primary)" }}>
                    <FaBell className="me-2 text-primary" /> Notifications
                    {unreadCount > 0 && (
                        <span className="badge bg-danger ms-3 rounded-pill" style={{ fontSize: "14px", verticalAlign: "middle" }}>
                            {unreadCount} New
                        </span>
                    )}
                </h2>
                
                {unreadCount > 0 && (
                    <button 
                        className="btn btn-primary rounded-pill px-4 shadow-sm"
                        onClick={markAllAsRead}
                    >
                        <FaCheck className="me-2" /> Mark all as read
                    </button>
                )}
            </div>

            <div className="card shadow-lg" style={{ 
                background: "rgba(15, 23, 42, 0.7)", 
                backdropFilter: "blur(20px)", 
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px"
            }}>
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5 text-muted">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center p-5">
                            <FaBell size={48} className="text-muted opacity-50 mb-3" />
                            <h5 className="text-muted">No notifications</h5>
                            <p className="text-muted small">You're all caught up! When system events occur, they will appear here.</p>
                        </div>
                    ) : (
                        <div className="list-group list-group-flush" style={{ borderRadius: "20px", overflow: "hidden" }}>
                            {notifications.map((notif) => (
                                <div 
                                    key={notif.id} 
                                    className={`list-group-item d-flex align-items-start p-4 transition-all`}
                                    style={{ 
                                        backgroundColor: notif.is_read ? "transparent" : "rgba(37, 99, 235, 0.1)",
                                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                                        borderLeft: notif.is_read ? "4px solid transparent" : "4px solid var(--accent-cyan)"
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = notif.is_read ? "transparent" : "rgba(37, 99, 235, 0.1)"; }}
                                >
                                    <div className="me-3 mt-1">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <h6 className={`mb-0 ${notif.is_read ? 'text-muted fw-normal' : 'text-white fw-bold'}`}>
                                                {notif.title}
                                            </h6>
                                            <small className="text-muted">{formatDate(notif.created_at)}</small>
                                        </div>
                                        <p className={`mb-2 small ${notif.is_read ? 'text-muted' : 'text-light'}`}>
                                            {notif.message}
                                        </p>
                                        <div className="d-flex gap-3">
                                            {!notif.is_read && (
                                                <button 
                                                    className="btn btn-sm btn-link text-info text-decoration-none p-0"
                                                    onClick={() => markAsRead(notif.id)}
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                            <button 
                                                className="btn btn-sm btn-link text-danger text-decoration-none p-0"
                                                onClick={() => deleteNotification(notif.id)}
                                            >
                                                <FaTrash /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminNotifications;
