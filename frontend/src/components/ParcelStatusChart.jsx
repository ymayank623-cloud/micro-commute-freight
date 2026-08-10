import { useEffect, useState } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js";
import { FaBoxOpen } from "react-icons/fa";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

function ParcelStatusChart() {
    const [analytics, setAnalytics] = useState({
        total_parcels: 0,
        delivered: 0,
        assigned: 0,
        pending: 0
    });

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/assignments/analytics`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setAnalytics({
                total_parcels: Number(res.data.total_parcels || 0),
                delivered: Number(res.data.delivered || 0),
                assigned: Number(res.data.assigned || 0),
                pending: Number(res.data.pending || 0)
            });
        } catch (error) {
            console.error('Failed to load parcel analytics:', error);
        }
    };

    const calculatedTotal = analytics.total_parcels > 0 
        ? analytics.total_parcels 
        : (analytics.delivered + analytics.assigned + analytics.pending);

    const deliveredPct = calculatedTotal > 0 
        ? Math.round((analytics.delivered / calculatedTotal) * 100) 
        : 0;

    const data = {
        labels: ["Delivered", "In Transit / Assigned", "Pending"],
        datasets: [
            {
                data: calculatedTotal > 0 
                    ? [analytics.delivered, analytics.assigned, analytics.pending] 
                    : [1, 0, 0],
                backgroundColor: [
                    "#10B981", // Emerald Green (Delivered)
                    "#00F0FF", // Neon Cyan (In Transit / Assigned)
                    "#F59E0B"  // Amber Orange (Pending)
                ],
                borderColor: "rgba(10, 15, 28, 0.9)",
                borderWidth: 3,
                borderRadius: 8,
                spacing: 4,
                hoverOffset: 6
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: "rgba(10, 15, 28, 0.95)",
                titleColor: "#F8FAFC",
                bodyColor: "#94A3B8",
                borderColor: "rgba(0, 240, 255, 0.3)",
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    label: function (context) {
                        const val = context.raw || 0;
                        const pct = calculatedTotal > 0 ? Math.round((val / calculatedTotal) * 100) : 0;
                        return ` ${context.label}: ${val} (${pct}%)`;
                    }
                }
            }
        }
    };

    return (
        <div className="glass-panel h-100 d-flex flex-column p-4 rounded-4" style={{ border: "1px solid var(--glass-border)", minHeight: "380px" }}>
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                    <h3 className="mb-0 fw-bold" style={{ color: "var(--text-primary)", fontSize: "1.2rem" }}>
                        Parcel Status
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        Real-time delivery progress distribution
                    </span>
                </div>
                <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(0, 240, 255, 0.1)",
                    border: "1px solid rgba(0, 240, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-cyan)",
                    fontSize: "16px"
                }}>
                    <FaBoxOpen />
                </div>
            </div>

            {/* Doughnut Chart with Accurate Center Percentage */}
            <div className="position-relative d-flex align-items-center justify-content-center flex-grow-1" style={{ height: "200px", minHeight: "200px" }}>
                <Doughnut data={data} options={options} />
                
                {/* Center Percentage: Actual completed parcels over total */}
                <div className="position-absolute d-flex flex-column align-items-center justify-content-center pointer-events-none" style={{ pointerEvents: "none" }}>
                    <span style={{ fontSize: "1.8rem", fontWeight: "800", color: "#F8FAFC", lineHeight: "1" }}>
                        {deliveredPct}%
                    </span>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#10B981", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "4px" }}>
                        Delivered
                    </span>
                </div>
            </div>

            {/* Accurate Breakdown Cards */}
            <div className="d-flex flex-column gap-2 mt-3 pt-3 border-top" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
                <div className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <div className="d-flex align-items-center gap-2">
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
                        <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: "500" }}>Delivered</span>
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#10B981" }}>
                        {analytics.delivered} <small style={{ color: "var(--text-secondary)", fontWeight: "400" }}>({calculatedTotal > 0 ? Math.round((analytics.delivered / calculatedTotal) * 100) : 0}%)</small>
                    </span>
                </div>

                <div className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <div className="d-flex align-items-center gap-2">
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00F0FF", boxShadow: "0 0 8px #00F0FF" }} />
                        <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: "500" }}>In Transit / Assigned</span>
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#00F0FF" }}>
                        {analytics.assigned} <small style={{ color: "var(--text-secondary)", fontWeight: "400" }}>({calculatedTotal > 0 ? Math.round((analytics.assigned / calculatedTotal) * 100) : 0}%)</small>
                    </span>
                </div>

                <div className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <div className="d-flex align-items-center gap-2">
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B", boxShadow: "0 0 8px #F59E0B" }} />
                        <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: "500" }}>Pending</span>
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#F59E0B" }}>
                        {analytics.pending} <small style={{ color: "var(--text-secondary)", fontWeight: "400" }}>({calculatedTotal > 0 ? Math.round((analytics.pending / calculatedTotal) * 100) : 0}%)</small>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default ParcelStatusChart;