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
            className="absolute top-full right-0 mt-2 glass-panel p-2 shadow-lg flex gap-2 z-[1060] rounded-[14px] min-w-[220px]"
            onClick={(e) => e.stopPropagation()}
          >
            {["all", "parcels", "drivers"].map(cat => (
              <button
                key={cat}
                type="button"
              className={`text-xs font-bold px-3 py-1 rounded-full capitalize transition-all duration-200 cursor-pointer border ${
                filterCategory === cat 
                  ? 'bg-cyan-500 text-white border-cyan-500' 
                  : 'bg-transparent text-gray-400 border-gray-600'
              }`}
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
            className="absolute top-full left-0 mt-2 glass-panel shadow-lg w-full overflow-hidden z-[1050] max-h-[400px] overflow-y-auto"
          >
            {isSearching ? (
              <div className="p-3 text-center text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Searching...</div>
            ) : (searchResults.parcels.length === 0 && searchResults.drivers.length === 0) ? (
              <div className="p-3 text-center text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>No results found</div>
            ) : (
              <div className="flex flex-col">
                
                {searchResults.parcels.length > 0 && (
                  <div className="px-3 py-2 border-b text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'var(--glass-border)' }}>
                    Parcels
                  </div>
                )}
                {searchResults.parcels.map(parcel => (
                  <div 
                    key={`parcel-${parcel.id}`} 
                    className="p-3 border-b flex items-center justify-between cursor-pointer transition-colors hover:bg-white/5"
                    style={{ borderColor: 'var(--table-border)' }}
                    onClick={() => {
                      setSearchDropdownOpen(false);
                      setSearchQuery("");
                      navigate(`/tracking?id=${parcel.id}`);
                    }}
                  >
                    <div>
                      <div className="font-bold" style={{ color: "var(--accent-cyan)" }}>Parcel #{parcel.id}</div>
                      <div className="text-xs truncate max-w-[250px]" style={{ color: 'var(--text-secondary)' }}>{parcel.pickup_address} → {parcel.drop_address}</div>
                    </div>
                    <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>{parcel.status}</span>
                  </div>
                ))}

                {searchResults.drivers.length > 0 && (
                  <div className="px-3 py-2 border-b text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'var(--glass-border)' }}>
                    Drivers
                  </div>
                )}
                {searchResults.drivers.map(driver => (
                  <div 
                    key={`driver-${driver.id}`} 
                    className="p-3 border-b flex items-center justify-between cursor-pointer transition-colors hover:bg-white/5"
                    style={{ borderColor: 'var(--table-border)' }}
                    onClick={() => {
                      setSearchDropdownOpen(false);
                      setSearchQuery("");
                      navigate(`/drivers`);
                    }}
                  >
                    <div>
                      <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{driver.full_name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{driver.vehicle_number}</div>
                    </div>
                    <span className="badge" style={{ backgroundColor: driver.status === 'Available' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: driver.status === 'Available' ? '#10B981' : '#F59E0B' }}>{driver.status}</span>
                  </div>
                ))}

              </div>
            )}
          </div>
        )}

      </div>

      {/* Right side */}

      <div className="navbar-right flex items-center gap-2">

        {/* Light / Dark Mode Toggle */}
        <button
          className="btn-theme-toggle rounded-full px-3 py-1 flex items-center gap-2 font-bold"
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
            <><FaSun style={{ color: "#FDE047" }} /> <span>Light Mode</span></>
          ) : (
            <><FaMoon style={{ color: "#00F0FF" }} /> <span>Dark Mode</span></>
          )}
        </button>

        <button 
          className="notification-btn relative"
          onClick={() => navigate('/notifications')}
        >
          <FaBell />
          {unreadNotifications > 0 && (
            <span 
              className="absolute -top-1 -right-1 badge"
              style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: "0.6rem" }}
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
            <strong>{user ? user.full_name.split(' ')[0] : "Admin"}</strong>
            <span className="capitalize">{user ? user.role : "Administrator"}</span>
          </div>
          <FaChevronDown className="profile-arrow" />

          {dropdownOpen && (
            <div 
              className="absolute top-full right-0 mt-2 glass-panel shadow py-2 z-[1050]" 
              style={{ width: "160px" }}
            >
              <button 
                className="flex items-center gap-2 w-full px-3 py-2 text-start font-bold transition-colors hover:bg-white/5"
                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}

export default TopNavbar;