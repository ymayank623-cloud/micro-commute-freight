import { useEffect, useState } from "react";
import axios from "axios";
import { FaUser, FaEnvelope, FaPhone, FaKey, FaSignOutAlt, FaCog, FaShieldAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassToggle from "../components/GlassToggle";

function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setError("Failed to load user settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "60vh" }}>
        <div className="spinner-border text-primary mb-3" role="status" style={{ color: "var(--accent-cyan)" }}></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading account settings...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger m-4 text-center">{error}</div>;
  }

  return (
    <motion.div
      className="container-fluid p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ minHeight: "calc(100vh - 70px)", background: "transparent" }}
    >
      <div className="mb-4">
        <h1 className="fw-bold mb-1 neon-text d-flex align-items-center gap-3">
          Settings <FaCog style={{ color: "var(--accent-cyan)", fontSize: "2rem" }} />
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
          Manage your account credentials and system preferences.
        </p>
      </div>

      <div className="row g-4 justify-content-center">
        <div className="col-lg-7">
          <div className="glass-panel p-5 rounded-4" style={{ border: "1px solid var(--glass-border)" }}>
            <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom" style={{ borderColor: "var(--glass-border)" }}>
              <div>
                <h3 className="mb-1 fw-bold" style={{ color: "var(--text-primary)" }}>Profile Information</h3>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Your authenticated administrator profile</span>
              </div>
              <span className="badge px-3 py-2 rounded-pill" style={{ background: "rgba(0, 240, 255, 0.15)", color: "var(--accent-cyan)", border: "1px solid rgba(0, 240, 255, 0.3)" }}>
                <FaShieldAlt className="me-1" /> Active Session
              </span>
            </div>
            
            <div className="mb-3 d-flex align-items-center p-3 rounded-3" style={{ background: "var(--panel-item-bg)", border: "1px solid var(--panel-item-border)", overflow: "hidden" }}>
              <div style={{
                width: "44px",
                height: "44px",
                minWidth: "44px",
                borderRadius: "14px",
                background: "rgba(0, 240, 255, 0.1)",
                border: "1px solid rgba(0, 240, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-cyan)",
                fontSize: "18px",
                marginRight: "14px"
              }}>
                <FaUser />
              </div>
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Full Name</p>
                <p style={{ color: "var(--text-primary)", fontSize: "clamp(0.95rem, 3.8vw, 1.15rem)", fontWeight: "600", margin: 0, wordBreak: "break-word" }}>{user?.full_name}</p>
              </div>
            </div>

            <div className="mb-3 d-flex align-items-center p-3 rounded-3" style={{ background: "var(--panel-item-bg)", border: "1px solid var(--panel-item-border)", overflow: "hidden" }}>
              <div style={{
                width: "44px",
                height: "44px",
                minWidth: "44px",
                borderRadius: "14px",
                background: "rgba(138, 43, 226, 0.1)",
                border: "1px solid rgba(138, 43, 226, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-purple)",
                fontSize: "18px",
                marginRight: "14px"
              }}>
                <FaEnvelope />
              </div>
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Email Address</p>
                <p style={{ color: "var(--text-primary)", fontSize: "clamp(0.85rem, 3.5vw, 1.1rem)", fontWeight: "600", margin: 0, wordBreak: "break-all", overflowWrap: "anywhere" }}>{user?.email}</p>
              </div>
            </div>

            <div className="mb-3 d-flex align-items-center p-3 rounded-3" style={{ background: "var(--panel-item-bg)", border: "1px solid var(--panel-item-border)", overflow: "hidden" }}>
              <div style={{
                width: "44px",
                height: "44px",
                minWidth: "44px",
                borderRadius: "14px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
                fontSize: "18px",
                marginRight: "14px"
              }}>
                <FaPhone />
              </div>
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Phone Number</p>
                <p style={{ color: "var(--text-primary)", fontSize: "clamp(0.95rem, 3.8vw, 1.15rem)", fontWeight: "600", margin: 0, wordBreak: "break-word" }}>{user?.phone || "Not specified"}</p>
              </div>
            </div>

            <div className="mb-3 d-flex align-items-center p-3 rounded-3" style={{ background: "var(--panel-item-bg)", border: "1px solid var(--panel-item-border)", overflow: "hidden" }}>
              <div style={{
                width: "44px",
                height: "44px",
                minWidth: "44px",
                borderRadius: "14px",
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F59E0B",
                fontSize: "18px",
                marginRight: "14px"
              }}>
                <FaKey />
              </div>
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Role & Permissions</p>
                <p style={{ color: "var(--text-primary)", fontSize: "clamp(0.95rem, 3.8vw, 1.15rem)", fontWeight: "600", margin: 0, textTransform: "capitalize" }}>
                  <span className="badge px-3 py-1 rounded-pill" style={{ background: "var(--gradient-neon)", color: "white" }}>
                    {user?.role || "Administrator"}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5 mb-2 pt-4 border-top" style={{ borderColor: "var(--glass-border)" }}>
              <h4 className="fw-bold mb-4" style={{ color: "var(--text-primary)" }}>Appearance Preferences</h4>
              {/* Insert the fully self-contained GlassToggle component here */}
              <div style={{ overflow: "hidden", borderRadius: "24px" }}>
                <GlassToggle />
              </div>
            </div>

            <div className="mt-5 pt-4 border-top text-center" style={{ borderColor: "var(--glass-border)" }}>
              <button 
                className="btn px-4 py-2 fw-bold rounded-pill"
                onClick={handleLogout}
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#F87171",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#EF4444"; e.currentTarget.style.color = "white"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)"; e.currentTarget.style.color = "#F87171"; }}
              >
                <FaSignOutAlt className="me-2" /> Sign Out of Platform
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Settings;
