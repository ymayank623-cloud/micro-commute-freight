import { useState, useMemo } from "react";
import {
  FaBoxOpen,
  FaTruck,
  FaUserCheck,
  FaSearch,
  FaArrowRight,
  FaExternalLinkAlt,
  FaClock
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { normalizeStatus } from "../utils/dashboardUtils";
import "./OperationsHub.css";

function OperationsHub({
  parcels = [],
  assignments = [],
  drivers = []
}) {
  const [activeTab, setActiveTab] = useState("parcels"); // "parcels" | "assignments" | "drivers"
  const [searchFilter, setSearchFilter] = useState("");
  const navigate = useNavigate();

  const getDriver = (driverId) => {
    return drivers.find((driver) => Number(driver.id) === Number(driverId));
  };

  const getParcel = (parcelId) => {
    return parcels.find((parcel) => Number(parcel.id) === Number(parcelId));
  };

  const getInitial = (name) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  // Filtered Parcels
  const filteredParcels = useMemo(() => {
    const sortedParcels = [...parcels].sort((a, b) => b.id - a.id);
    if (!searchFilter.trim()) return sortedParcels.slice(0, 7);
    const query = searchFilter.toLowerCase();
    return sortedParcels.filter(p =>
      p.id.toString().includes(query) ||
      (p.pickup_address && p.pickup_address.toLowerCase().includes(query)) ||
      (p.drop_address && p.drop_address.toLowerCase().includes(query)) ||
      (p.status && p.status.toLowerCase().includes(query))
    ).slice(0, 7);
  }, [parcels, searchFilter]);

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    const sortedAssignments = [...assignments].sort((a, b) => b.id - a.id);
    if (!searchFilter.trim()) return sortedAssignments.slice(0, 7);
    const query = searchFilter.toLowerCase();
    return sortedAssignments.filter(a =>
      a.id.toString().includes(query) ||
      (a.full_name && a.full_name.toLowerCase().includes(query)) ||
      (a.pickup_address && a.pickup_address.toLowerCase().includes(query)) ||
      (a.drop_address && a.drop_address.toLowerCase().includes(query)) ||
      (a.assignment_status && a.assignment_status.toLowerCase().includes(query))
    ).slice(0, 7);
  }, [assignments, searchFilter]);

  // Filtered Drivers
  const filteredDrivers = useMemo(() => {
    const sortedDrivers = [...drivers].sort((a, b) => b.id - a.id);
    if (!searchFilter.trim()) return sortedDrivers.slice(0, 7);
    const query = searchFilter.toLowerCase();
    return sortedDrivers.filter(d =>
      d.id.toString().includes(query) ||
      (d.full_name && d.full_name.toLowerCase().includes(query)) ||
      (d.vehicle_type && d.vehicle_type.toLowerCase().includes(query)) ||
      (d.status && d.status.toLowerCase().includes(query))
    ).slice(0, 7);
  }, [drivers, searchFilter]);

  return (
    <div className="operations-hub-card">
      {/* Top Header & Tab Controls */}
      <div className="operations-hub-header">
        <div className="operations-hub-title">
          <div className="hub-badge-icon">
            <FaBoxOpen />
          </div>
          <div>
            <span className="hub-overline">DISPATCH COMMAND</span>
            <h2>Operations Hub</h2>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="hub-tabs">
          <button
            type="button"
            className={`hub-tab-btn ${activeTab === "parcels" ? "active" : ""}`}
            onClick={() => setActiveTab("parcels")}
          >
            <FaBoxOpen />
            <span>Shipments</span>
            <span className="tab-counter">{parcels.length}</span>
          </button>

          <button
            type="button"
            className={`hub-tab-btn ${activeTab === "assignments" ? "active" : ""}`}
            onClick={() => setActiveTab("assignments")}
          >
            <FaTruck />
            <span>Dispatches</span>
            <span className="tab-counter">{assignments.length}</span>
          </button>

          <button
            type="button"
            className={`hub-tab-btn ${activeTab === "drivers" ? "active" : ""}`}
            onClick={() => setActiveTab("drivers")}
          >
            <FaUserCheck />
            <span>Drivers</span>
            <span className="tab-counter">{drivers.length}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="hub-toolbar">
        <div className="hub-search">
          <FaSearch />
          <input
            type="text"
            placeholder={`Filter ${activeTab} by ID, route, name or status...`}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="hub-view-all-btn"
          onClick={() => navigate(`/${activeTab === "drivers" ? "city-managers" : "parcels"}`)}
        >
          <span>View All</span>
          <FaExternalLinkAlt />
        </button>
      </div>

      {/* Content Panels */}
      <div className="hub-content">
        {/* 1. SHIPMENTS TAB */}
        {activeTab === "parcels" && (
          filteredParcels.length === 0 ? (
            <div className="dashboard-empty">
              <FaBoxOpen />
              <strong>No Shipments Found</strong>
              <span>No parcel records matching your current filter.</span>
            </div>
          ) : (
            <div className="hub-table">
              <div className="hub-table-head shipments-grid">
                <span>PARCEL</span>
                <span>ROUTE</span>
                <span>TYPE</span>
                <span>STATUS</span>
                <span style={{ textAlign: "right" }}>ACTION</span>
              </div>
              {filteredParcels.map((parcel) => {
                const status = normalizeStatus(parcel.status);
                return (
                  <div className="hub-table-row shipments-grid" key={parcel.id}>
                    <div className="hub-id-cell">
                      <div className="mini-id-icon cyan">#{parcel.id}</div>
                    </div>
                    <div className="hub-route-cell">
                      <span className="route-loc" title={parcel.pickup_address}>{parcel.pickup_address || "—"}</span>
                      <FaArrowRight className="route-arrow-cyan" />
                      <span className="route-loc" title={parcel.drop_address}>{parcel.drop_address || "—"}</span>
                    </div>
                    <div className="hub-meta-cell">
                      <span className="meta-tag">{parcel.weight_kg ? "${parcel.weight_kg} kg" : "Standard"}</span>
                    </div>
                    <div>
                      <span className={`hub-status-pill ${status}`}>
                        <span className="status-dot" />
                        {parcel.status || "Pending"}
                      </span>
                    </div>
                    <div className="hub-action-cell">
                      <button
                        type="button"
                        className="hub-track-btn"
                        onClick={() => navigate(`/tracking?id=${parcel.id}`)}
                      >
                        Track
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* 2. DISPATCHES TAB */}
        {activeTab === "assignments" && (
          filteredAssignments.length === 0 ? (
            <div className="dashboard-empty">
              <FaTruck />
              <strong>No Dispatches Found</strong>
              <span>No active dispatches matching your filter.</span>
            </div>
          ) : (
            <div className="hub-table">
              <div className="hub-table-head assignments-grid">
                <span>DISPATCH</span>
                <span>COURIER</span>
                <span>ROUTE</span>
                <span>STATUS</span>
                <span style={{ textAlign: "right" }}>ACTION</span>
              </div>
              {filteredAssignments.map((assignment) => {
                const status = normalizeStatus(assignment.assignment_status);
                const driver = getDriver(assignment.driver_id);
                const driverName = assignment.full_name || (driver ? driver.full_name : `Driver #${assignment.driver_id}`);
                return (
                  <div className="hub-table-row assignments-grid" key={assignment.id}>
                    <div className="hub-id-cell">
                      <div className="mini-id-icon purple">#{assignment.id}</div>
                    </div>
                    <div className="hub-user-cell">
                      <div className="hub-avatar">{getInitial(driverName)}</div>
                      <div className="hub-user-info">
                        <strong>{driverName}</strong>
                        <span>Parcel #{assignment.parcel_id}</span>
                      </div>
                    </div>
                    <div className="hub-route-cell">
                      <span className="route-loc" title={assignment.pickup_address}>{assignment.pickup_address || "—"}</span>
                      <FaArrowRight className="route-arrow-purple" />
                      <span className="route-loc" title={assignment.drop_address}>{assignment.drop_address || "—"}</span>
                    </div>
                    <div>
                      <span className={`hub-status-pill ${status}`}>
                        <span className="status-dot" />
                        {assignment.assignment_status || "Assigned"}
                      </span>
                    </div>
                    <div className="hub-action-cell">
                      <button
                        type="button"
                        className="hub-track-btn"
                        onClick={() => navigate(`/tracking?id=${assignment.parcel_id}`)}
                      >
                        Track
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* 3. DRIVERS TAB */}
        {activeTab === "drivers" && (
          filteredDrivers.length === 0 ? (
            <div className="dashboard-empty">
              <FaUserCheck />
              <strong>No Drivers Found</strong>
              <span>No couriers matching your search criteria.</span>
            </div>
          ) : (
            <div className="hub-table">
              <div className="hub-table-head drivers-grid">
                <span>COURIER</span>
                <span>VEHICLE</span>
                <span>CONTACT</span>
                <span>STATUS</span>
                <span style={{ textAlign: "right" }}>ACTION</span>
              </div>
              {filteredDrivers.map((driver) => {
                const isAvailable = driver.status === "Available" || driver.status === "available";
                return (
                  <div className="hub-table-row drivers-grid" key={driver.id}>
                    <div className="hub-user-cell">
                      <div className={`hub-avatar ${isAvailable ? "online" : "busy"}`}>
                        {getInitial(driver.full_name)}
                      </div>
                      <div className="hub-driver-info">
                        <strong>{driver.full_name}</strong>
                        <span>ID #{driver.id}</span>
                      </div>
                    </div>
                    <div className="hub-vehicle-cell">
                      <strong>{driver.vehicle_type || "Vehicle"}</strong>
                      <span>{driver.vehicle_number || "—"}</span>
                    </div>
                    <div className="hub-phone-cell">
                      <span>{driver.phone || "—"}</span>
                    </div>
                    <div>
                      <span className={`hub-status-pill ${isAvailable ? "delivered" : "transit"}`}>
                        <span className="status-dot" />
                        {driver.status || "Available"}
                      </span>
                    </div>
                    <div className="hub-action-cell">
                      <button
                        type="button"
                        className="hub-track-btn"
                        onClick={() => navigate("/city-managers")}
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default OperationsHub;
