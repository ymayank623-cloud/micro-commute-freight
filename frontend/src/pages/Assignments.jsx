import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  FaTasks,
  FaTruck,
  FaCheckCircle,
  FaLeaf,
  FaArrowRight,
  FaSyncAlt,
  FaClock
} from "react-icons/fa";
import SmartDispatchMatcher from "../components/SmartDispatchMatcher";
import DashboardCard from "../components/DashboardCard";
import "./dashboardPage.css";
import "../components/RecentAssignments.css";

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAssignments(true);
  }, []);

  const loadAssignments = async (initial = false) => {
    try {
      if (initial) setLoading(true);
      else setRefreshing(true);
      setError("");

      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setError("Unable to load assignments from backend.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/assignments/${id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadAssignments(false);
    } catch (err) {
      console.error('Complete error:', err);
      alert(err.response?.data?.message || "Failed to mark completed");
    }
  };

  const stats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter(a =>
      a.assignment_status === "Completed" || a.assignment_status === "Delivered"
    ).length;
    const active = assignments.filter(a =>
      a.assignment_status === "Assigned" || a.assignment_status === "In Transit"
    ).length;
    // Estimated eco-savings based on co-travel micro-commute
    const ecoSavings = Math.round(total * 85);

    return { total, active, completed, ecoSavings };
  }, [assignments]);

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <section className="welcome-banner" style={{ minHeight: "180px", marginBottom: "24px" }}>
        <div className="welcome-content">
          <span className="welcome-overline">DISPATCH COMMAND & ROUTING</span>
          <h1>Smart Dispatch & Assignments</h1>
          <p>
            Match shipments with daily micro-commuters (low cost) or dedicated nearest couriers (express priority).
          </p>
        </div>

        <div className="welcome-right">
          <button
            type="button"
            className="dashboard-refresh-btn"
            onClick={() => loadAssignments(false)}
            disabled={refreshing}
          >
            <FaSyncAlt className={refreshing ? "spin-icon" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Dispatches"}
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="row g-4 mb-4">
        <div className="col-xl-3 col-lg-6 col-md-6">
          <DashboardCard
            title="Total Dispatches"
            value={stats.total}
            subtitle={`${stats.active} Active Deliveries`}
            icon={<FaTasks />}
            color="#2563eb"
          />
        </div>
        <div className="col-xl-3 col-lg-6 col-md-6">
          <DashboardCard
            title="Active On Road"
            value={stats.active}
            subtitle="In Transit Courier"
            icon={<FaTruck />}
            color="#00F0FF"
          />
        </div>
        <div className="col-xl-3 col-lg-6 col-md-6">
          <DashboardCard
            title="Delivered"
            value={stats.completed}
            subtitle="Successful Deliveries"
            icon={<FaCheckCircle />}
            color="#10B981"
          />
        </div>
        <div className="col-xl-3 col-lg-6 col-md-6">
          <DashboardCard
            title="Network Savings"
            value={`₹${stats.ecoSavings}`}
            subtitle="Commute Cost Sharing"
            icon={<FaLeaf />}
            color="#F59E0B"
          />
        </div>
      </div>

      {/* DUAL-MODE SMART MATCHER ENGINE */}
      <SmartDispatchMatcher onAssignmentCreated={() => loadAssignments(false)} />

      {/* Active Assignments Table */}
      <div className="dashboard-card recent-assignments-card">
        <div className="dashboard-card-header">
          <div className="dashboard-card-title">
            <div className="dashboard-icon orange">
              <FaTruck />
            </div>
            <div>
              <span className="dashboard-overline">FLEET DISPATCH LOG</span>
              <h2>All Network Assignments</h2>
              <p>Historical & live delivery dispatch records</p>
            </div>
          </div>
          <span className="dashboard-record-count">
            {assignments.length} total dispatches
          </span>
        </div>

        {assignments.length === 0 ? (
          <div className="dashboard-empty">
            <FaTruck />
            <strong>No Assignments Found</strong>
            <span>Use the Smart Dispatch Matcher above to assign couriers to pending shipments.</span>
          </div>
        ) : (
          <div className="recent-assignment-table">
            <div className="recent-assignment-head">
              <span>DISPATCH</span>
              <span>DRIVER & VEHICLE</span>
              <span>ROUTE</span>
              <span style={{ textAlign: "right" }}>STATUS & ACTION</span>
            </div>

            {assignments.map((assignment) => {
              const isCompleted =
                assignment.assignment_status === "Completed" ||
                assignment.assignment_status === "Delivered";

              return (
                <div className="recent-assignment-row" key={assignment.id}>
                  {/* ID */}
                  <div className="assignment-id-cell">
                    <div className="mini-truck-icon">
                      <FaTruck />
                    </div>
                    <strong>#{assignment.id}</strong>
                  </div>

                  {/* Driver */}
                  <div className="assignment-driver-cell">
                    <div className="assignment-avatar">
                      {assignment.full_name?.charAt(0) || "D"}
                    </div>
                    <div className="assignment-driver-info">
                      <strong>{assignment.full_name || "Driver"}</strong>
                      <span>{assignment.vehicle_number || "Vehicle"}</span>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="assignment-route-cell">
                    <span className="route-point pickup" title={assignment.pickup_address}>
                      {assignment.pickup_address || "—"}
                    </span>
                    <FaArrowRight className="route-arrow-icon" />
                    <span className="route-point drop" title={assignment.drop_address}>
                      {assignment.drop_address || "—"}
                    </span>
                  </div>

                  {/* Status & Action */}
                  <div className="assignment-status-cell" style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "flex-end" }}>
                    <span className={`assignment-status-pill ${isCompleted ? "delivered" : "transit"}`}>
                      <span className="status-dot" />
                      {assignment.assignment_status || "Assigned"}
                    </span>

                    {!isCompleted && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        style={{ borderRadius: "8px", fontSize: "11px", fontWeight: "700" }}
                        onClick={() => handleComplete(assignment.id)}
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Assignments;