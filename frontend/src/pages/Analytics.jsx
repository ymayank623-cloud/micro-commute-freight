import { useEffect, useState } from "react";
import axios from "axios";
import { FaChartLine, FaBoxOpen, FaTruck, FaTasks } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import DashboardCard from "../components/DashboardCard";
import "./analyticsPage.css";

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeframe, setTimeframe] = useState("all_time");

  const COLORS = ["#00F0FF", "#8A2BE2", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/analytics?filter=${timeframe}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        console.error("Analytics fetch error:", err);
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [timeframe]);

  if (loading && !data) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading Analytics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger m-4">{error}</div>;
  }

  // Ensure charts have valid data
  const statusData = data?.statuses && data.statuses.length > 0 
    ? data.statuses 
    : [{ name: "No Data", value: 0 }];

  const typeData = data?.types && data.types.length > 0 
    ? data.types 
    : [{ name: "Standard", value: 1 }];

  return (
    <motion.div
      className="container-fluid analytics-page p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ background: "transparent" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1 neon-text d-flex align-items-center gap-3">
            Analytics Dashboard <FaChartLine style={{ color: "var(--accent-cyan)", fontSize: "2rem" }} />
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Real-time logistics performance and freight distribution overview.
          </p>
        </div>
        
        <div>
          <select 
            className="form-select bg-dark text-white shadow-sm border-secondary"
            style={{ width: "200px", borderRadius: "10px", padding: "10px 15px", cursor: "pointer" }}
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="all_time">All Time</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <DashboardCard
            title="Total Parcels"
            value={data?.stats?.total_parcels || 0}
            subtitle={`${data?.stats?.delivered_parcels || 0} Delivered`}
            icon={<FaBoxOpen />}
            color="#00F0FF"
          />
        </div>
        <div className="col-md-3">
          <DashboardCard
            title="Total Drivers"
            value={data?.stats?.total_drivers || 0}
            subtitle={`${data?.stats?.available_drivers || 0} Available`}
            icon={<FaTruck />}
            color="#10B981"
          />
        </div>
        <div className="col-md-3">
          <DashboardCard
            title="Assignments"
            value={data?.stats?.total_assignments || 0}
            subtitle="Active Dispatches"
            icon={<FaTasks />}
            color="#8A2BE2"
          />
        </div>
        <div className="col-md-3">
          <DashboardCard
            title="Success Rate"
            value={data?.stats?.total_parcels > 0 ? `${Math.round((data?.stats?.delivered_parcels / data?.stats?.total_parcels) * 100)}%` : "0%"}
            subtitle="Delivery Completion"
            icon={<FaChartLine />}
            color="#F59E0B"
          />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="chart-card glass-panel p-4 rounded-4" style={{ border: "1px solid var(--glass-border)" }}>
            <h3 className="mb-4 fw-bold" style={{ color: "var(--text-primary)", fontSize: "1.2rem" }}>
              Parcels by Status
            </h3>
            <div style={{ height: "350px", width: "100%" }}>
              <ResponsiveContainer>
                <BarChart data={statusData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-secondary)" 
                    tick={{ fill: "#94A3B8", fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    tick={{ fill: "#94A3B8", fontSize: 12, fontWeight: 500 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ 
                      background: "rgba(10, 15, 28, 0.95)", 
                      backdropFilter: "blur(12px)", 
                      border: "1px solid rgba(0, 240, 255, 0.3)", 
                      borderRadius: "12px",
                      color: "#F8FAFC",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.5)"
                    }}
                  />
                  <Legend 
                    formatter={(value) => <span style={{ color: "#E2E8F0", fontWeight: 600 }}>{value}</span>}
                  />
                  <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} name="Parcels" />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#8A2BE2" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="chart-card glass-panel p-4 rounded-4" style={{ border: "1px solid var(--glass-border)" }}>
            <h3 className="mb-4 fw-bold" style={{ color: "var(--text-primary)", fontSize: "1.2rem" }}>
              Parcel Types
            </h3>
            <div style={{ height: "350px", width: "100%" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        stroke="rgba(10, 15, 28, 0.8)" 
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      background: "rgba(10, 15, 28, 0.95)", 
                      backdropFilter: "blur(12px)", 
                      border: "1px solid rgba(0, 240, 255, 0.3)", 
                      borderRadius: "12px",
                      color: "#F8FAFC",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.5)"
                    }}
                  />
                  <Legend 
                    formatter={(value) => <span style={{ color: "#E2E8F0", fontWeight: 600 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Analytics;