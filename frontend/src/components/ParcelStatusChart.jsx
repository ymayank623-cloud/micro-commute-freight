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
                    "#00FF66", // Toxic Neon Green (Delivered)
                    "#10E54B", // Acid Lime Green (In Transit / Assigned)
                    "#FFB800"  // Biohazard Amber (Pending)
                ],
                borderColor: "rgba(3, 8, 4, 0.95)",
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
                backgroundColor: "rgba(4, 12, 5, 0.96)",
                titleColor: "#F0FFF4",
                bodyColor: "#86A889",
                borderColor: "rgba(0, 255, 102, 0.4)",
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
        <div className="glass-panel flex flex-col justify-between p-6 rounded-2xl w-full h-full min-h-[460px]" style={{ border: "1px solid var(--glass-border)" }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                        Parcel Status
                    </h3>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        Real-time delivery progress distribution
                    </span>
                </div>
                <div style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "12px",
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
            <div className="relative w-full h-[190px] flex items-center justify-center my-3">
                <Doughnut data={data} options={options} />
                
                {/* Center Percentage: Inside hollow center of doughnut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-white leading-none">
                        {deliveredPct}%
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mt-1">
                        Delivered
                    </span>
                </div>
            </div>

            {/* Accurate Breakdown Cards */}
            <div className="flex flex-col gap-2.5 pt-4 mt-auto border-t" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
                <div className="flex items-center justify-between p-2.5 rounded-xl transition-colors hover:bg-white/[0.04]" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Delivered</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">
                        {analytics.delivered} <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>({calculatedTotal > 0 ? Math.round((analytics.delivered / calculatedTotal) * 100) : 0}%)</span>
                    </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl transition-colors hover:bg-white/[0.04]" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>In Transit / Assigned</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "var(--accent-cyan)" }}>
                        {analytics.assigned} <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>({calculatedTotal > 0 ? Math.round((analytics.assigned / calculatedTotal) * 100) : 0}%)</span>
                    </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl transition-colors hover:bg-white/[0.04]" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#F59E0B]" />
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Pending</span>
                    </div>
                    <span className="text-sm font-bold text-amber-400">
                        {analytics.pending} <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>({calculatedTotal > 0 ? Math.round((analytics.pending / calculatedTotal) * 100) : 0}%)</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default ParcelStatusChart;