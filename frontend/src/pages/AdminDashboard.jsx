import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

import {
  FaBoxOpen,
  FaTruck,
  FaTasks,
  FaCheckCircle,
  FaCalendarAlt,
  FaSyncAlt,
  FaExclamationTriangle,
  FaSlidersH,
} from "react-icons/fa";

import DashboardCard from "../components/DashboardCard";
import ParcelStatusChart from "../components/ParcelStatusChart";
import WeeklyDeliveryChart from "../components/WeeklyDeliveryChart";
import DriverStatus from "../components/DriverStatus";
import OperationsHub from "../components/OperationsHub";
import FleetMapRadar from "../components/FleetMapRadar";
import QuickActions from "../components/QuickActions";
import ActivityTimeline from "../components/ActivityTimeline";
import DispatchPolicyManager from "../components/DispatchPolicyManager";

import "./dashboardPage.css";


function Dashboard() {

  const { user } = useAuth();

  /* =====================================================
     STATE
  ===================================================== */

  const [parcels, setParcels] = useState([]);

  const [drivers, setDrivers] = useState([]);

  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [showPolicyModal, setShowPolicyModal] = useState(false);


  /* =====================================================
     NORMALIZE STATUS
  ===================================================== */

  const normalizeStatus = (status) => {

    if (!status) {
      return "";
    }

    return String(status)
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

  };


  /* =====================================================
     LOAD REAL DATA FROM BACKEND
  ===================================================== */

  const loadDashboard = async (
    initialLoad = false
  ) => {

    try {

      if (initialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");


      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [parcelsRes, driversRes, assignmentsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/parcels`, { headers }).catch(e => ({ data: [] })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/drivers`, { headers }).catch(e => ({ data: [] })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/assignments`, { headers }).catch(e => ({ data: [] }))
      ]);

      const parseArray = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.parcels)) return data.parcels;
        if (Array.isArray(data?.drivers)) return data.drivers;
        if (Array.isArray(data?.assignments)) return data.assignments;
        return [];
      };

      setParcels(parseArray(parcelsRes.data));
      setDrivers(parseArray(driversRes.data));
      setAssignments(parseArray(assignmentsRes.data));

    }

    catch (err) {

      console.error('Dashboard error:', err);


      if (
        err.response?.status === 401
      ) {

        setError(
          "Authentication expired. Please login again."
        );

      } else {

        setError(
          "Unable to connect to backend. Make sure the server is running on port 5000."
        );

      }

    }

    finally {

      setLoading(false);

      setRefreshing(false);

    }

  };


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    loadDashboard(true);

  }, []);


  /* =====================================================
     PARCEL STATISTICS
  ===================================================== */

  const parcelStats = useMemo(() => {

    const total =
      parcels.length;


    const delivered =
      parcels.filter(
        (parcel) =>
          normalizeStatus(
            parcel.status
          ) === "delivered"
      ).length;


    const pending =
      parcels.filter(
        (parcel) => {

          const status =
            normalizeStatus(
              parcel.status
            );

          return (
            status === "pending" ||
            status === "created"
          );

        }
      ).length;


    const inTransit =
      parcels.filter(
        (parcel) => {

          const status =
            normalizeStatus(
              parcel.status
            );

          return (
            status === "in_transit" ||
            status === "intransit" ||
            status === "out_for_delivery"
          );

        }
      ).length;


    const assigned =
      parcels.filter(
        (parcel) =>
          normalizeStatus(
            parcel.status
          ) === "assigned"
      ).length;


    return {
      total,
      delivered,
      pending,
      inTransit,
      assigned,
    };

  }, [parcels]);


  /* =====================================================
     DRIVER STATISTICS
  ===================================================== */

  const driverStats = useMemo(() => {

    const total =
      drivers.length;


    const available =
      drivers.filter(
        (driver) =>
          normalizeStatus(
            driver.status
          ) === "available"
      ).length;


    const busy =
      drivers.filter(
        (driver) =>
          normalizeStatus(
            driver.status
          ) !== "available"
      ).length;


    return {
      total,
      available,
      busy,
    };

  }, [drivers]);


  /* =====================================================
     ASSIGNMENT STATISTICS
  ===================================================== */

  const assignmentStats =
    useMemo(() => {

      const total =
        assignments.length;


      const active =
        assignments.filter(
          (assignment) => {

            const status =
              normalizeStatus(
                assignment.status
              );


            return (
              status === "assigned" ||
              status === "active" ||
              status === "in_transit" ||
              status === "intransit" ||
              status === "on_delivery" ||
              status === "out_for_delivery"
            );

          }
        ).length;


      const completed =
        assignments.filter(
          (assignment) => {

            const status =
              normalizeStatus(
                assignment.status
              );


            return (
              status === "completed" ||
              status === "delivered"
            );

          }
        ).length;


      return {
        total,
        active,
        completed,
      };

    }, [assignments]);


  /* =====================================================
     REAL WEEKLY DELIVERY DATA
     
     IMPORTANT:
     This does NOT create fake values.
     
     It only uses parcels whose status is Delivered.
  ===================================================== */




  /* =====================================================
     TODAY
  ===================================================== */

  const today =
    new Date().toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <div className="dashboard-loading">

        <div className="dashboard-loading-spinner">

          <FaSyncAlt />

        </div>


        <h3>
          Loading FlowLink
        </h3>


        <p>
          Fetching real data from your backend...
        </p>

      </div>

    );

  }


  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (

    <div className="dashboard-page">


      {/* =================================================
          WELCOME BANNER
      ================================================= */}

      <section className="welcome-banner">


        <div className="welcome-content">

          <span className="welcome-overline">
            LOGISTICS CONTROL CENTER
          </span>


          <h1>
            Welcome Back, {user ? user.full_name.split(' ')[0] : "Admin"} 👋
          </h1>


          <p>
            Monitor your real shipments,
            drivers and delivery operations.
          </p>

        </div>


        <div className="welcome-right">


          {/* NETWORK STATUS */}

          <div className="network-status">

            <span className="status-dot"></span>

            <div>

              <strong>
                Backend Connected
              </strong>

              <span>
                Live data from your API
              </span>

            </div>

          </div>


          {/* DATE */}

          <div className="banner-date">

            <FaCalendarAlt />

            <div>

              <span>
                Today
              </span>

              <strong>
                {today}
              </strong>

            </div>

          </div>


          {/* REFRESH */}
          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={() =>
              loadDashboard(false)
            }
            disabled={refreshing}
          >
            <FaSyncAlt
              className={
                refreshing
                  ? "refresh-spin"
                  : ""
              }
            />
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>


        </div>

      </section>


      {/* =================================================
          BACKEND ERROR
      ================================================= */}

      {error && (

        <div className="dashboard-error">

          <FaExclamationTriangle />

          <div>

            <strong>
              Backend request failed
            </strong>

            <span>
              {error}
            </span>

          </div>


          <button
            type="button"
            onClick={() =>
              loadDashboard(false)
            }
          >

            Retry

          </button>

        </div>

      )}


      {/* =================================================
          KPI CARDS
      ================================================= */}

      <div className="row g-4 dashboard-kpi-row">


        {/* TOTAL PARCELS */}

        <div className="col-xl-3 col-lg-6 col-md-6">

          <DashboardCard

            title="Total Parcels"

            value={
              parcelStats.total
            }

            subtitle={
              `${parcelStats.pending} Pending Parcels`
            }

            icon={
              <FaBoxOpen />
            }

            color="#2563eb"

          />

        </div>


        {/* DRIVERS */}

        <div className="col-xl-3 col-lg-6 col-md-6">

          <DashboardCard

            title="Drivers"

            value={
              driverStats.total
            }

            subtitle={
              `${driverStats.available} Available`
            }

            icon={
              <FaTruck />
            }

            color="#16a34a"

          />

        </div>


        {/* ASSIGNMENTS */}

        <div className="col-xl-3 col-lg-6 col-md-6">

          <DashboardCard

            title="Assignments"

            value={
              assignmentStats.total
            }

            subtitle={
              `${assignmentStats.active} Active`
            }

            icon={
              <FaTasks />
            }

            color="#f59e0b"

          />

        </div>


        {/* DELIVERED */}

        <div className="col-xl-3 col-lg-6 col-md-6">

          <DashboardCard

            title="Delivered"

            value={
              parcelStats.delivered
            }

            subtitle="Completed Orders"

            icon={
              <FaCheckCircle />
            }

            color="#10b981"

          />

        </div>

      </div>


      {/* =================================================
          PARCEL STATUS + DRIVER STATUS
      ================================================= */}

      <div className="row g-4 dashboard-section">

        {/* PARCEL STATUS */}
        <div className="col-xl-6 col-lg-6">
          <ParcelStatusChart
            parcels={parcels}
          />
        </div>

        {/* DRIVER STATUS */}
        <div className="col-xl-6 col-lg-6">
          <DriverStatus
            drivers={drivers}
          />
        </div>

      </div>

      {/* =================================================
          WEEKLY DELIVERIES + QUICK ACTIONS
      ================================================= */}

      <div className="row g-4 dashboard-section">

        {/* WEEKLY DELIVERIES */}
        <div className="col-xl-7 col-lg-7">
          <WeeklyDeliveryChart
            parcels={parcels}
          />
        </div>

        {/* QUICK ACTIONS */}
        <div className="col-xl-5 col-lg-5">
          <QuickActions />
        </div>

      </div>


      {/* =================================================
          OPERATIONS HUB + ACTIVITY
      ================================================= */}

      <div className="row g-4 dashboard-section">

        {/* OPERATIONS HUB */}
        <div className="col-xl-8 col-lg-7">
          <OperationsHub
            parcels={parcels}
            assignments={assignments}
            drivers={drivers}
          />
        </div>

        {/* ACTIVITY */}
        <div className="col-xl-4 col-lg-5">
          <ActivityTimeline
            parcels={parcels}
            drivers={drivers}
            assignments={assignments}
          />
        </div>

      </div>

      {/* =================================================
          LIVE INTRACITY FLEET MAP RADAR
      ================================================= */}

      <div className="row g-4 dashboard-section">
        <div className="col-12">
          <FleetMapRadar
            drivers={drivers}
            parcels={parcels}
            assignments={assignments}
          />
        </div>
      </div>


      {/* =================================================
          DISPATCH & MATCHING POLICY MODAL
      ================================================= */}
      {showPolicyModal && (
        <DispatchPolicyManager
          onClose={() => setShowPolicyModal(false)}
        />
      )}

    </div>

  );

}


export default Dashboard;