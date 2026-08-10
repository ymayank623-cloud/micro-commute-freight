import { useState, useMemo } from "react";
import {
  FaBoxOpen,
  FaTruck,
  FaTasks,
} from "react-icons/fa";

import "./ActivityTimeline.css";

function ActivityTimeline({
  parcels = [],
  drivers = [],
  assignments = [],
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Default to Today as requested
  const [timeframe, setTimeframe] = useState("today");

  const activities = useMemo(() => {
    const list = [];

    // All driver records
    drivers.forEach((driver) => {
      list.push({
        type: "driver",
        title: "Driver record available",
        description: driver.full_name || driver.name || `Driver #${driver.id}`,
        date: driver.created_at || driver.updated_at,
        id: `driver-${driver.id}`,
      });
    });

    // All parcel records
    parcels.forEach((parcel) => {
      list.push({
        type: "parcel",
        title: `Parcel #${parcel.id}`,
        description: parcel.status || "Status unavailable",
        date: parcel.updated_at || parcel.created_at || parcel.pickup_date,
        id: `parcel-${parcel.id}`,
      });
    });

    // All assignment records
    assignments.forEach((assignment) => {
      list.push({
        type: "assignment",
        title: `Assignment #${assignment.id}`,
        description: assignment.assignment_status || assignment.status || "Dispatched",
        date: assignment.assigned_at || assignment.created_at || assignment.updated_at,
        id: `assignment-${assignment.id}`,
      });
    });

    return list;
  }, [drivers, parcels, assignments]);

  const formatDate = (value) => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter activities by timeframe
  const filteredActivities = useMemo(() => {
    const now = new Date();
    
    return activities.filter((activity) => {
      if (timeframe === "all_time") return true;
      if (!activity.date) return false;

      const activityDate = new Date(activity.date);
      if (Number.isNaN(activityDate.getTime())) return false;

      if (timeframe === "today") {
        return (
          activityDate.getDate() === now.getDate() &&
          activityDate.getMonth() === now.getMonth() &&
          activityDate.getFullYear() === now.getFullYear()
        );
      }

      if (timeframe === "this_week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        return activityDate >= startOfWeek;
      }

      if (timeframe === "last_week") {
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - now.getDay());
        startOfThisWeek.setHours(0, 0, 0, 0);

        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

        return activityDate >= startOfLastWeek && activityDate < startOfThisWeek;
      }

      if (timeframe === "this_month") {
        return (
          activityDate.getMonth() === now.getMonth() &&
          activityDate.getFullYear() === now.getFullYear()
        );
      }

      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [activities, timeframe]);

  return (
    <div className="dashboard-card activity-card">
      <div 
        className="dashboard-card-header" 
        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="dashboard-card-title">
          <div className="dashboard-icon purple">
            <FaTasks />
          </div>

          <div>
            <span className="dashboard-overline">
              LIVE DATA
            </span>

            <h2 className="d-flex align-items-center gap-3">
              Activity
              <select 
                className="form-select bg-dark text-white border-secondary rounded-pill"
                style={{ fontSize: "0.8rem", width: "auto", display: "inline-block", padding: "2px 10px", marginLeft: "10px" }}
                value={timeframe}
                onChange={(e) => {
                  e.stopPropagation(); // prevent collapsing when clicking dropdown
                  setTimeframe(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="this_month">This Month</option>
                <option value="all_time">All Time</option>
              </select>
            </h2>

            <p>
              Generated from your records
            </p>
          </div>
        </div>

        <div>
           <span style={{ fontSize: "1.2rem", color: "var(--text-muted)", transition: "transform 0.3s ease", display: "inline-block", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>
             ▼
           </span>
        </div>
      </div>

      {!isCollapsed && (
        filteredActivities.length === 0 ? (
          <div className="activity-empty text-center p-4">
            <div className="text-muted mb-2" style={{ fontSize: "2rem" }}>📋</div>
            <strong className="d-block text-white mb-1">
              {timeframe === "today" ? "No Activity Recorded Today" : "No Activity Records"}
            </strong>
            <span className="text-secondary small">
              {timeframe === "today" 
                ? "No parcels or actions logged today yet. Switch to 'This Week' or 'All Time' to view history."
                : "No activities match the selected timeframe."}
            </span>
          </div>
        ) : (
          <div className="activity-timeline-list">
            {filteredActivities.slice(0, 10).map((activity) => {
              let icon = <FaTasks />;
              let iconClass = "purple";

              if (activity.type === "parcel") {
                icon = <FaBoxOpen />;
                iconClass = "cyan";
              } else if (activity.type === "driver") {
                icon = <FaTruck />;
                iconClass = "green";
              }

              return (
                <div key={activity.id} className="activity-item d-flex align-items-start gap-3 mb-3">
                  <div className={`activity-icon-badge ${iconClass}`}>
                    {icon}
                  </div>
                  <div className="activity-details flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong className="activity-title text-white">{activity.title}</strong>
                      <span className="activity-time text-secondary small">{formatDate(activity.date)}</span>
                    </div>
                    <p className="activity-desc text-muted mb-0 small">{activity.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

export default ActivityTimeline;