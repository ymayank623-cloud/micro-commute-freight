import { useState, useRef, useEffect } from "react";
import {
  FaSearch,
  FaBell,
  FaBars,
  FaChevronDown,
  FaSignOutAlt,
  FaFilter,
  FaSun,
  FaMoon
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "./layout.css";

function TopNavbar({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ parcels: [], drivers: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [searchFilterOpen, setSearchFilterOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all"); // "all", "parcels", "drivers"
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search Debounce Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim() === "") {
        setSearchResults({ parcels: [], drivers: [] });
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/search?q=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(res.data);
        setSearchDropdownOpen(true);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications/unread`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadNotifications(res.data.count);
      } catch (error) {
        console.error('Failed to fetch notification count', error);
      }
    };
    
    if (user && user.role === "admin") {
      fetchUnread();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <header className="topbar">

      {/* Mobile menu */}

      <button
        className="mobile-menu-btn"
        onClick={onMenuClick}
      >
        <FaBars />
      </button>

      {/* Search */}

      <div className="global-search position-relative" ref={searchRef}>

        <div className="search-icon-wrap">
          <FaSearch className="search-icon" />
        </div>

        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!searchDropdownOpen) setSearchDropdownOpen(true);
          }}
          onFocus={() => {
            if (searchQuery.trim() !== "") setSearchDropdownOpen(true);
          }}
        />

        <button
          type="button"
          className={`search-filter-btn ${searchFilterOpen ? 'active' : ''}`}
          title="Filter Search Results"
          onClick={(e) => {
            e.stopPropagation();
            setSearchFilterOpen(!searchFilterOpen);
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
        </button>

        {/* Filter Quick-Filter Popup */}
        {searchFilterOpen && (
          <div 
            className="position-absolute glass-panel p-2 shadow-lg d-flex gap-2"
            style={{ top: "100%", right: 0, marginTop: "8px", zIndex: 1060, borderRadius: "14px", minWidth: "220px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {["all", "parcels", "drivers"].map(cat => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm px-3 py-1 rounded-pill text-capitalize fw-bold ${filterCategory === cat ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={{ fontSize: "11px", transition: "all 0.2s" }}
                onClick={() => {
                  setFilterCategory(cat);
                  setSearchFilterOpen(false);
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Search Results Dropdown */}
        {searchDropdownOpen && searchQuery.trim() !== "" && (
          <div 
            className="position-absolute glass-panel shadow-lg w-100 overflow-hidden" 
            style={{ top: "100%", left: 0, marginTop: "10px", zIndex: 1050, maxHeight: "400px", overflowY: "auto" }}
          >
            {isSearching ? (
              <div className="p-3 text-center text-muted small fw-bold">Searching...</div>
            ) : (searchResults.parcels.length === 0 && searchResults.drivers.length === 0) ? (
              <div className="p-3 text-center text-muted small fw-bold">No results found</div>
            ) : (
              <div className="d-flex flex-column">
                
                {searchResults.parcels.length > 0 && (
                  <div className="px-3 py-2 border-bottom text-muted small fw-bold text-uppercase" style={{ fontSize: "0.75rem", backgroundColor: "rgba(255,255,255,0.02)" }}>
                    Parcels
                  </div>
                )}
                {searchResults.parcels.map(parcel => (
                  <div 
                    key={`parcel-${parcel.id}`} 
                    className="p-3 border-bottom d-flex align-items-center justify-content-between"
                    style={{ cursor: "pointer", transition: "background-color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    onClick={() => {
                      setSearchDropdownOpen(false);
                      setSearchQuery("");
                      navigate(`/tracking?id=${parcel.id}`);
                    }}
                  >
                    <div>
                      <div className="fw-bold" style={{ color: "var(--accent-cyan)" }}>Parcel #{parcel.id}</div>
                      <div className="small text-muted text-truncate" style={{ maxWidth: "250px" }}>{parcel.pickup_address} → {parcel.drop_address}</div>
                    </div>
                    <span className="badge rounded-pill" style={{ fontSize: "0.7rem", backgroundColor: "rgba(255,255,255,0.1)" }}>{parcel.status}</span>
                  </div>
                ))}

                {searchResults.drivers.length > 0 && (
                  <div className="px-3 py-2 border-bottom text-muted small fw-bold text-uppercase" style={{ fontSize: "0.75rem", backgroundColor: "rgba(255,255,255,0.02)" }}>
                    Drivers
                  </div>
                )}
                {searchResults.drivers.map(driver => (
                  <div 
                    key={`driver-${driver.id}`} 
                    className="p-3 border-bottom d-flex align-items-center justify-content-between"
                    style={{ cursor: "pointer", transition: "background-color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    onClick={() => {
                      setSearchDropdownOpen(false);
                      setSearchQuery("");
                      navigate(`/drivers`);
                    }}
                  >
                    <div>
                      <div className="fw-bold" style={{ color: "var(--text-primary)" }}>{driver.full_name}</div>
                      <div className="small text-muted">{driver.vehicle_number}</div>
                    </div>
                    <span className={`badge rounded-pill`} style={{ fontSize: "0.7rem", backgroundColor: driver.status === 'Available' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: driver.status === 'Available' ? '#10B981' : '#F59E0B' }}>{driver.status}</span>
                  </div>
                ))}

              </div>
            )}
          </div>
        )}

      </div>

      {/* Right side */}

      <div className="navbar-right d-flex align-items-center gap-2">

        {/* Light / Dark Mode Toggle */}
        <button
          className="btn-theme-toggle rounded-pill px-3 py-1 d-flex align-items-center gap-2 fw-bold"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title={`Switch to ${theme === "light" ? "Dark Mode" : "Light Mode"}`}
          style={{
            background: theme === "light" ? "linear-gradient(135deg, #38BDF8, #0284C7)" : "rgba(255, 255, 255, 0.08)",
            color: theme === "light" ? "#FFFFFF" : "#00F0FF",
            border: theme === "light" ? "2px solid #FFFFFF" : "1px solid rgba(0, 240, 255, 0.3)",
            fontSize: "12px",
            boxShadow: theme === "light" ? "4px 4px 10px rgba(2, 132, 199, 0.3), inset 2px 2px 4px rgba(255,255,255,0.6)" : "none",
            cursor: "pointer"
          }}
        >
          {theme === "light" ? (
            <>
              <FaSun style={{ color: "#FDE047" }} /> <span>Light Mode</span>
            </>
          ) : (
            <>
              <FaMoon style={{ color: "#00F0FF" }} /> <span>Dark Mode</span>
            </>
          )}
        </button>

        <button 
          className="notification-btn position-relative"
          onClick={() => navigate('/notifications')}
        >

          <FaBell />

          {unreadNotifications > 0 && (
            <span 
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: "0.6rem" }}
            >
              {unreadNotifications}
            </span>
          )}

        </button>

        <div className="navbar-divider" />

        <div 
          className="profile" 
          ref={dropdownRef} 
          onClick={() => setDropdownOpen(!dropdownOpen)} 
          style={{ cursor: "pointer", position: "relative" }}
        >

          <div className="profile-avatar">
            {user ? user.full_name.charAt(0).toUpperCase() : "A"}
          </div>

          <div className="profile-info">
            <strong>
              {user ? user.full_name.split(' ')[0] : "Admin"}
            </strong>
            <span className="text-capitalize">
              {user ? user.role : "Administrator"}
            </span>
          </div>

          <FaChevronDown className="profile-arrow" />

          {dropdownOpen && (
            <div 
              className="position-absolute glass-panel shadow py-2" 
              style={{ top: "100%", right: 0, marginTop: "10px", width: "160px", zIndex: 1050 }}
            >
              <button 
                className="btn btn-link text-danger text-decoration-none d-flex align-items-center gap-2 w-100 px-3 text-start hover-bg-light"
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                <span className="fw-bold">Logout</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </header>
  );
}

export default TopNavbar;