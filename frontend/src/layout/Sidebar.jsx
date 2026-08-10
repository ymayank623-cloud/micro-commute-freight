import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  FaTachometerAlt,
  FaBoxOpen,
  FaTruck,
  FaTasks,
  FaMapMarkerAlt,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaTimes,
  FaCity,
  FaSlidersH
} from "react-icons/fa";

import "./layout.css";

import { useAuth } from "../context/AuthContext";

function Sidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const { user } = useAuth(); // Retrieve current user

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload();
  };

  const adminMenu = [
    { name: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt /> },
    { name: "Parcels", path: "/parcels", icon: <FaBoxOpen /> },
    { name: "City Managers", path: "/city-managers", icon: <FaCity /> },
    { name: "Dispatch Rules", path: "/dispatch-rules", icon: <FaSlidersH /> },
    { name: "Tracking", path: "/tracking", icon: <FaMapMarkerAlt /> },
    { name: "Analytics", path: "/analytics", icon: <FaChartBar /> },
    { name: "Settings", path: "/settings", icon: <FaCog /> },
  ];

  const userMenu = [
    { name: "My Dashboard", path: "/dashboard", icon: <FaTachometerAlt /> },
    { name: "My Parcels", path: "/my-parcels", icon: <FaBoxOpen /> },
    { name: "Book a Parcel", path: "/book-parcel", icon: <FaMapMarkerAlt /> },
    { name: "Profile", path: "/settings", icon: <FaCog /> },
  ];

  const driverMenu = [
    { name: "Driver Hub", path: "/driver/dashboard", icon: <FaTruck /> },
    { name: "Settings", path: "/settings", icon: <FaCog /> }
  ];

  let menuItems = adminMenu;
  if (user?.role === "user" || user?.role === "customer") menuItems = userMenu;
  if (user?.role === "driver") menuItems = driverMenu;

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <motion.aside
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* Brand */}

        <div className="sidebar-brand">
          <div className="brand-icon">
            🚚
          </div>

          <div>
            <h2>FlowLink</h2>
            <span>LOGISTICS PLATFORM</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation */}

        <div className="sidebar-section-title">
          MAIN MENU
        </div>

        <nav className="sidebar-nav">

          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? "active-link" : ""
                }`
              }
            >
              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span>
                {item.name}
              </span>

              <span className="nav-arrow">
                →
              </span>
            </NavLink>
          ))}

        </nav>

        {/* Bottom */}

        <div className="sidebar-bottom">

          <div className="sidebar-help">
            <div className="help-icon">
              ?
            </div>

            <div>
              <strong>Need Help?</strong>
              <span>Contact support</span>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={logout}
          >
            <FaSignOutAlt />

            <span>
              Logout
            </span>
          </button>

          <div className="sidebar-version">
            FlowLink v1.0.0
          </div>

        </div>

      </motion.aside>
    </>
  );
}

export default Sidebar;