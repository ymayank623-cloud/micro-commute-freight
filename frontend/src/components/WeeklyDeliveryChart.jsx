import { useState, useMemo } from "react";
import {
  FaChartBar,
  FaDatabase,
} from "react-icons/fa";

import "./WeeklyDeliveryChart.css";

const normalizeStatus = (status) => {
  if (!status) return "";
  return String(status).trim().toLowerCase().replace(/[\s-]+/g, "_");
};

function WeeklyDeliveryChart({
  parcels = [],
}) {

  const [timeframe, setTimeframe] = useState("this_week");

  const data = useMemo(() => {
    const now = new Date();
    const grouped = {};

    parcels.forEach((parcel) => {
      if (normalizeStatus(parcel.status) !== "delivered") return;

      const rawDate = parcel.updated_at || parcel.created_at || parcel.pickup_date;
      if (!rawDate) return;

      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return;

      let include = false;

      if (timeframe === "all_time") {
        include = true;
      } else if (timeframe === "today") {
        include = 
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear();
      } else if (timeframe === "this_week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        include = date >= startOfWeek;
      } else if (timeframe === "last_week") {
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - now.getDay());
        startOfThisWeek.setHours(0, 0, 0, 0);

        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
        include = date >= startOfLastWeek && date < startOfThisWeek;
      } else if (timeframe === "this_month") {
        include = 
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear();
      }

      if (!include) return;

      const key = date.toISOString().slice(0, 10);
      if (!grouped[key]) grouped[key] = 0;
      grouped[key] += 1;
    });

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .map(([dateString, delivered]) => {
        let label = "";
        if (timeframe === "this_week" || timeframe === "last_week") {
          label = new Date(dateString).toLocaleDateString("en-IN", { weekday: "short" });
        } else if (timeframe === "this_month") {
          label = new Date(dateString).toLocaleDateString("en-IN", { month: "short" });
        } else {
          label = new Date(dateString).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        }
        
        return {
          date: dateString,
          label,
          delivered,
        };
      });
  }, [parcels, timeframe]);


  const totalDelivered =
    data.reduce(
      (total, item) =>
        total +
        Number(
          item.delivered || 0
        ),
      0
    );


  const maxValue =
    data.length > 0
      ? Math.max(
          ...data.map(
            (item) =>
              Number(
                item.delivered || 0
              )
          )
        )
      : 0;


  return (

    <div className="weekly-delivery-card">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="weekly-delivery-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

        <div className="weekly-delivery-title">

          <div className="weekly-delivery-icon">
            <FaChartBar />
          </div>

          <div>
            <span>
              DELIVERY ACTIVITY
            </span>

            <h2>
              Deliveries
            </h2>

            <p>
              Actual delivered parcels
            </p>
          </div>
        </div>

        <div>
          <select 
            className="form-select bg-dark text-white border-secondary rounded-pill"
            style={{ fontSize: "0.8rem", width: "auto", display: "inline-block", padding: "4px 12px" }}
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


      {/* =========================================
          TOTAL
      ========================================= */}

      <div className="weekly-delivery-total">

        <span>
          Total Delivered
        </span>

        <strong>
          {totalDelivered}
        </strong>

      </div>


      {/* =========================================
          NO DATA
      ========================================= */}

      {data.length === 0 ? (

        <div className="weekly-delivery-empty">

          <FaDatabase />

          <strong>
            No delivery data
          </strong>

          <span>
            There are no delivered parcels
            recorded in the last 7 days.
          </span>

        </div>

      ) : (

        /* =========================================
           REAL DATA CHART
        ========================================= */

        <div className="weekly-chart">

          <div className="weekly-y-axis">

            <span>
              {maxValue}
            </span>

            <span>
              {Math.ceil(maxValue / 2)}
            </span>

            <span>
              0
            </span>

          </div>


          <div className="weekly-chart-area">

            {/* GRID */}

            <div className="weekly-grid-line line-1" />
            <div className="weekly-grid-line line-2" />
            <div className="weekly-grid-line line-3" />


            {/* BARS */}

            <div className="weekly-bars">

              {data.map(
                (item) => {

                  const value =
                    Number(
                      item.delivered || 0
                    );


                  const height =
                    maxValue > 0
                      ? (
                          value /
                          maxValue
                        ) * 100
                      : 0;


                  return (

                    <div
                      className="weekly-bar-column"
                      key={item.date}
                    >

                      <div className="weekly-bar-value">

                        {value}

                      </div>


                      <div className="weekly-bar-wrapper">

                        <div
                          className="weekly-bar"
                          style={{
                            height:
                              `${height}%`,
                          }}
                        />

                      </div>


                      <span className="weekly-bar-label">

                        {item.label}

                      </span>

                    </div>

                  );

                }
              )}

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default WeeklyDeliveryChart;