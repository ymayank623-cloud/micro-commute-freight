import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  FaBoxOpen,
  FaSearch,
  FaPlus,
  FaFilter,
  FaSyncAlt,
  FaEllipsisV,
  FaMapMarkerAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import AddressAutocomplete from "../components/AddressAutocomplete";

import "./parcelsPage.css";


function Parcels() {
  const navigate = useNavigate();
  const [parcels, setParcels] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [openMenu, setOpenMenu] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [viewModalParcel, setViewModalParcel] = useState(null);
  const [editModalParcel, setEditModalParcel] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [formData, setFormData] = useState({
    pickup_address: "",
    drop_address: "",
    weight: "",
    parcel_type: "Standard",
    pickup_date: "",
    status: "Pending"
  });
  const [submitting, setSubmitting] = useState(false);

  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
  }

  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Intracity Validation (max 60km)
      const pRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.pickup_address)}`);
      const dRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.drop_address)}`);

      if (pRes.data.length === 0 || dRes.data.length === 0) {
         alert("Could not verify locations. Please select a valid address from the dropdown or map.");
         setSubmitting(false);
         return;
      }

      const distanceKm = getDistanceFromLatLonInKm(
        parseFloat(pRes.data[0].lat), parseFloat(pRes.data[0].lon),
        parseFloat(dRes.data[0].lat), parseFloat(dRes.data[0].lon)
      );

      if (distanceKm > 40) {
         alert(`Intercity delivery is not supported. Pickup and Drop-off are ${Math.round(distanceKm)} km apart. Deliveries must be within the same city region (max 40km).`);
         setSubmitting(false);
         return;
      }

      const token = localStorage.getItem("token");
      await axios.post(`${import.meta.env.VITE_API_URL}/api/parcels`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      loadParcels();
      setFormData({ pickup_address: "", drop_address: "", weight: "", parcel_type: "Standard", pickup_date: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to create shipment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditShipmentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Intracity Validation (max 60km)
      const pRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.pickup_address)}`);
      const dRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.drop_address)}`);

      if (pRes.data.length === 0 || dRes.data.length === 0) {
         alert("Could not verify locations. Please select a valid address from the dropdown or map.");
         setSubmitting(false);
         return;
      }

      const distanceKm = getDistanceFromLatLonInKm(
        parseFloat(pRes.data[0].lat), parseFloat(pRes.data[0].lon),
        parseFloat(dRes.data[0].lat), parseFloat(dRes.data[0].lon)
      );

      if (distanceKm > 40) {
         alert(`Intercity delivery is not supported. Pickup and Drop-off are ${Math.round(distanceKm)} km apart. Deliveries must be within the same city region (max 40km).`);
         setSubmitting(false);
         return;
      }

      const token = localStorage.getItem("token");
      await axios.put(`${import.meta.env.VITE_API_URL}/api/parcels/${editModalParcel.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update status independently
      if (formData.status && formData.status !== editModalParcel.status) {
        try {
          await axios.put(`${import.meta.env.VITE_API_URL}/api/parcels/${editModalParcel.id}/status`, { status: formData.status }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (statusErr) {
          alert(statusErr.response?.data?.message || 'Failed to update shipment status');
        }
      }

      setEditModalParcel(null);
      loadParcels();
    } catch (err) {
      console.error(err);
      alert("Failed to update shipment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShipment = async () => {
    if (!window.confirm("Are you sure you want to completely delete this shipment? This action cannot be undone.")) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/parcels/${editModalParcel.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditModalParcel(null);
      loadParcels();
    } catch (err) {
      console.error(err);
      alert('Failed to delete shipment');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (parcel) => {
    setFormData({
      pickup_address: parcel.pickup_address || "",
      drop_address: parcel.drop_address || "",
      weight: parcel.weight || "",
      parcel_type: parcel.parcel_type || "Standard",
      pickup_date: parcel.pickup_date ? parcel.pickup_date.substring(0, 10) : "",
      status: parcel.status || "Pending"
    });
    setEditModalParcel(parcel);
    setOpenMenu(null);
  };


  /* =====================================================
     LOAD PARCELS
  ===================================================== */

  const loadParcels = async () => {

    try {

      setLoading(true);

      setError("");

      const token =
        localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/parcels`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result =
        Array.isArray(response.data)
          ? response.data
          : [];

      setParcels(result);

    } catch (err) {

      console.error('Parcel loading error:', err);

      setError(
        "Unable to load parcels."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    loadParcels();
  }, []);


  /* =====================================================
     NORMALIZE STATUS
  ===================================================== */

  const normalizeStatus = (status) => {

    return String(status || "")
      .toLowerCase()
      .replace(/_/g, " ")
      .trim();
  };


  /* =====================================================
     FILTERED PARCELS
  ===================================================== */

  const filteredParcels = useMemo(() => {

    return parcels.filter((parcel) => {

      const searchText =
        search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        String(
          parcel.id ||
          parcel.parcel_id ||
          parcel.tracking_id ||
          ""
        )
          .toLowerCase()
          .includes(searchText) ||

        String(
          parcel.pickup_address ||
          parcel.pickup ||
          parcel.source ||
          ""
        )
          .toLowerCase()
          .includes(searchText) ||

        String(
          parcel.drop_address ||
          parcel.drop ||
          parcel.destination ||
          ""
        )
          .toLowerCase()
          .includes(searchText);


      const status =
        normalizeStatus(parcel.status);


      const matchesStatus =
        statusFilter === "All" ||
        status ===
          statusFilter.toLowerCase();


      return (
        matchesSearch &&
        matchesStatus
      );

    });

  }, [
    parcels,
    search,
    statusFilter,
  ]);


  /* =====================================================
     COUNTS
  ===================================================== */

  const counts = useMemo(() => {

    const result = {
      all: parcels.length,
      pending: 0,
      transit: 0,
      delivered: 0,
    };


    parcels.forEach((parcel) => {

      const status =
        normalizeStatus(
          parcel.status
        );


      if (status === "pending") {

        result.pending++;

      } else if (
        status === "in transit" ||
        status === "transit"
      ) {

        result.transit++;

      } else if (
        status === "delivered" ||
        status === "completed"
      ) {

        result.delivered++;

      }

    });


    return result;

  }, [parcels]);


  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (value) => {

    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  /* =====================================================
     PARCEL ID
  ===================================================== */

  const getParcelId = (parcel) => {

    return (
      parcel.tracking_id ||
      parcel.parcel_id ||
      parcel.id ||
      "—"
    );

  };


  /* =====================================================
     ROUTE
  ===================================================== */

  const getPickup = (parcel) => {

    return (
      parcel.pickup_address ||
      parcel.pickup ||
      parcel.source ||
      "Unknown"
    );

  };


  const getDrop = (parcel) => {

    return (
      parcel.drop_address ||
      parcel.drop ||
      parcel.destination ||
      "Unknown"
    );

  };


  /* =====================================================
     CUSTOMER
  ===================================================== */

  const getCustomer = (parcel) => {

    return (
      parcel.customer_name ||
      parcel.customer ||
      parcel.sender_name ||
      "Customer"
    );

  };


  /* =====================================================
     STATUS CLASS
  ===================================================== */

  const getStatusClass = (status) => {

    const normalized =
      normalizeStatus(status);

    if (
      normalized === "delivered" ||
      normalized === "completed"
    ) {
      return "delivered";
    }

    if (
      normalized === "in transit" ||
      normalized === "transit"
    ) {
      return "transit";
    }

    if (
      normalized === "assigned"
    ) {
      return "assigned";
    }

    return "pending";

  };


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className="parcels-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <section className="parcels-header">

        <div>

          <div className="page-overline">
            SHIPMENT MANAGEMENT
          </div>

          <h1>
            Parcels
          </h1>

          <p>
            Manage, track and monitor
            every shipment in your network.
          </p>

        </div>


        <button
          className="new-parcel-button"
          onClick={() => setShowModal(true)}
        >
          <FaPlus />
          New Shipment
        </button>

      </section>


      {/* =================================================
          STATISTICS
      ================================================= */}

      <section className="parcel-stat-grid">


        <div
          className={`parcel-stat ${
            statusFilter === "All"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setStatusFilter("All")
          }
        >

          <div className="parcel-stat-icon blue">

            <FaBoxOpen />

          </div>

          <div>

            <span>
              Total Shipments
            </span>

            <strong>
              {counts.all}
            </strong>

          </div>

        </div>


        <div
          className={`parcel-stat ${
            statusFilter === "Pending"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setStatusFilter("Pending")
          }
        >

          <div className="parcel-stat-icon orange">

            <FaCalendarAlt />

          </div>

          <div>

            <span>
              Pending
            </span>

            <strong>
              {counts.pending}
            </strong>

          </div>

        </div>


        <div
          className={`parcel-stat ${
            statusFilter === "In Transit"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setStatusFilter("In Transit")
          }
        >

          <div className="parcel-stat-icon purple">

            <FaMapMarkerAlt />

          </div>

          <div>

            <span>
              In Transit
            </span>

            <strong>
              {counts.transit}
            </strong>

          </div>

        </div>


        <div
          className={`parcel-stat ${
            statusFilter === "Delivered"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setStatusFilter("Delivered")
          }
        >

          <div className="parcel-stat-icon green">

            <FaBoxOpen />

          </div>

          <div>

            <span>
              Delivered
            </span>

            <strong>
              {counts.delivered}
            </strong>

          </div>

        </div>

      </section>


      {/* =================================================
          TOOLBAR
      ================================================= */}

      <section className="parcel-toolbar">

        <div className="parcel-search">

          <FaSearch />

          <input
            type="text"
            placeholder="Search shipments, routes, tracking..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <kbd>
            /
          </kbd>

        </div>


        <div className="parcel-toolbar-actions">


          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="parcel-filter"
          >

            <option value="All">
              All Status
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Assigned">
              Assigned
            </option>

            <option value="In Transit">
              In Transit
            </option>

            <option value="Delivered">
              Delivered
            </option>

          </select>


          <button
            className="parcel-refresh"
            onClick={loadParcels}
            disabled={loading}
          >

            <FaSyncAlt
              className={
                loading
                  ? "refresh-spin"
                  : ""
              }
            />

          </button>


          <button className="filter-button" onClick={() => setShowFilterModal(true)}>
            <FaFilter />
            Filters
          </button>

        </div>

      </section>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="parcel-error">

          <span>
            {error}
          </span>

          <button
            onClick={loadParcels}
          >
            Retry
          </button>

        </div>

      )}


      {/* =================================================
          TABLE
      ================================================= */}

      <section className="parcels-table-card">


        <div className="parcels-table-header">

          <div>

            <h2>
              All Shipments
            </h2>

            <span>
              {filteredParcels.length}
              {" "}
              shipments found
            </span>

          </div>

          <span className="table-live">

            <span />

            Live data

          </span>

        </div>


        <div className="parcels-table-wrapper">

          <table className="parcels-table">

            <thead>

              <tr>

                <th>
                  Shipment
                </th>

                <th>
                  Route
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Status
                </th>

                <th>
                  Date
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="6"
                    className="parcel-loading"
                  >

                    <FaSyncAlt className="refresh-spin" />

                    Loading shipments...

                  </td>

                </tr>

              ) : filteredParcels.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="parcel-empty"
                  >

                    <div className="empty-icon">

                      <FaBoxOpen />

                    </div>

                    <strong>
                      No shipments found
                    </strong>

                    <span>
                      Try changing your search
                      or filter.
                    </span>

                  </td>

                </tr>

              ) : (

                filteredParcels.map(
                  (parcel) => {

                    const status =
                      normalizeStatus(
                        parcel.status
                      );

                    return (

                      <tr
                        key={getParcelId(parcel)}
                      >


                        {/* Shipment */}

                        <td>

                          <div className="shipment-cell">

                            <div className="shipment-cell-icon">

                              <FaBoxOpen />

                            </div>

                            <div>

                              <strong>
                                {getParcelId(
                                  parcel
                                )}
                              </strong>

                              <span>
                                Shipment
                              </span>

                            </div>

                          </div>

                        </td>


                        {/* Route */}

                        <td>

                          <div className="route-cell">

                            <span>

                              <FaMapMarkerAlt />

                              {getPickup(
                                parcel
                              )}

                            </span>

                            <i>
                              →
                            </i>

                            <span>

                              <FaMapMarkerAlt />

                              {getDrop(
                                parcel
                              )}

                            </span>

                          </div>

                        </td>


                        {/* Customer */}

                        <td>

                          <span className="customer-cell">

                            {getCustomer(
                              parcel
                            )}

                          </span>

                        </td>


                        {/* Status */}

                        <td>

                          <span
                            className={`parcel-page-status ${getStatusClass(
                              status
                            )}`}
                          >

                            <span />

                            {status
                              ? status
                                  .replace(
                                    /\b\w/g,
                                    (char) =>
                                      char.toUpperCase()
                                  )
                              : "Pending"}

                          </span>

                        </td>


                        {/* Date */}

                        <td>

                          <span className="parcel-date-cell">

                            {formatDate(
                              parcel.created_at ||
                              parcel.createdAt ||
                              parcel.pickup_date
                            )}

                          </span>

                        </td>


                        {/* Action */}

                        <td>

                          <div className="parcel-action-wrapper">

                            <button
                              className="parcel-action-button"
                              onClick={() =>
                                setOpenMenu(
                                  openMenu ===
                                    getParcelId(parcel)
                                    ? null
                                    : getParcelId(parcel)
                                )
                              }
                            >

                              <FaEllipsisV />

                            </button>


                            {openMenu ===
                              getParcelId(
                                parcel
                              ) && (

                              <div className="parcel-action-menu">

                                <button onClick={() => { setViewModalParcel(parcel); setOpenMenu(null); }}>
                                  View details
                                </button>

                                <button onClick={() => { navigate(`/tracking?id=${getParcelId(parcel)}`); setOpenMenu(null); }}>
                                  Track shipment
                                </button>

                                <button onClick={() => openEditModal(parcel)}>
                                  Edit shipment
                                </button>

                              </div>

                            )}

                          </div>

                        </td>

                      </tr>

                    );

                  }
                )

              )}

            </tbody>

          </table>

        </div>


        {/* Footer */}

        {filteredParcels.length > 0 && (

          <div className="parcels-table-footer">

            Showing
            {" "}
            <strong>
              {filteredParcels.length}
            </strong>
            {" "}
            of
            {" "}
            <strong>
              {parcels.length}
            </strong>
            {" "}
            shipments

          </div>

        )}

      </section>

      {/* NEW SHIPMENT MODAL */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel border-0 shadow-lg rounded-4 p-2" style={{ background: "rgba(10, 15, 28, 0.95)", border: "1px solid var(--glass-border)" }}>
              <div className="modal-header border-bottom pb-3" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
                <h5 className="modal-title fw-bold" style={{ color: "var(--text-primary)" }}>Create New Shipment</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleCreateShipment}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Pickup Address</label>
                    <AddressAutocomplete 
                        className="form-control" 
                        name="pickup_address" 
                        value={formData.pickup_address} 
                        onChange={handleInputChange} 
                        placeholder="Search pickup location..."
                        required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Drop Address</label>
                    <AddressAutocomplete 
                        className="form-control" 
                        name="drop_address" 
                        value={formData.drop_address} 
                        onChange={handleInputChange} 
                        placeholder="Search drop-off location..."
                        required 
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Weight (kg)</label>
                      <input type="number" className="form-control" name="weight" value={formData.weight} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Parcel Type</label>
                      <select className="form-select" name="parcel_type" value={formData.parcel_type} onChange={handleInputChange}>
                        <option value="Standard" style={{ backgroundColor: "#0A0F1C", color: "#F8FAFC" }}>📦 Standard</option>
                        <option value="Express" style={{ backgroundColor: "#0A0F1C", color: "#F8FAFC" }}>⚡ Express</option>
                        <option value="Fragile" style={{ backgroundColor: "#0A0F1C", color: "#F8FAFC" }}>🍷 Fragile</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Pickup Date</label>
                    <input type="date" className="form-control" name="pickup_date" value={formData.pickup_date} onChange={handleInputChange} required />
                  </div>

                  {/* LIVE DYNAMIC PRICE ESTIMATOR */}
                  {formData.weight && (
                    <div className="mb-4 p-3 rounded-3" style={{ background: "rgba(0, 240, 255, 0.05)", border: "1px solid rgba(0, 240, 255, 0.2)" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small fw-bold text-uppercase" style={{ color: "var(--accent-cyan)", fontSize: "11px", letterSpacing: "1px" }}>
                          💰 Estimated Network Pricing
                        </span>
                        <span className="badge" style={{ background: "rgba(255,255,255,0.1)", color: "#94A3B8", fontSize: "10px" }}>
                          Weight: {formData.weight} kg
                        </span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center p-2 rounded-2 mb-2" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                        <div>
                          <strong style={{ color: "#10B981", fontSize: "13px" }}>🟢 Commuter Route Match:</strong>
                          <div style={{ fontSize: "11px", color: "#94A3B8" }}>Base ₹25 + (₹4/km) + (₹6/kg)</div>
                        </div>
                        <div className="text-end">
                          <strong style={{ color: "#10B981", fontSize: "18px" }}>
                            ₹{Math.round(25 + (5 * 4) + (parseFloat(formData.weight || 1) * 6))}
                          </strong>
                          <div style={{ fontSize: "10px", color: "#10B981" }}>Save ~60%</div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center p-2 rounded-2" style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                        <div>
                          <strong style={{ color: "#F59E0B", fontSize: "13px" }}>🟡 Nearest Express Courier:</strong>
                          <div style={{ fontSize: "11px", color: "#94A3B8" }}>Base ₹60 + (₹12/km) + (₹15/kg)</div>
                        </div>
                        <div className="text-end">
                          <strong style={{ color: "#F59E0B", fontSize: "18px" }}>
                            ₹{Math.round(60 + (5 * 12) + (parseFloat(formData.weight || 1) * 15))}
                          </strong>
                          <div style={{ fontSize: "10px", color: "#F59E0B" }}>Express Direct</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="d-grid">
                    <button type="submit" className="new-parcel-button w-100" disabled={submitting}>
                      {submitting ? "Booking..." : "Book Shipment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SHIPMENT MODAL */}
      {editModalParcel && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel border-0 shadow-lg rounded-4 p-2" style={{ background: "rgba(10, 15, 28, 0.95)", border: "1px solid var(--glass-border)" }}>
              <div className="modal-header border-bottom pb-3" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
                <h5 className="modal-title fw-bold" style={{ color: "var(--text-primary)" }}>Edit Shipment #{editModalParcel.id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditModalParcel(null)}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleEditShipmentSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Pickup Address</label>
                    <AddressAutocomplete 
                        className="form-control" 
                        name="pickup_address" 
                        value={formData.pickup_address} 
                        onChange={handleInputChange} 
                        placeholder="Search pickup location..."
                        required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Drop Address</label>
                    <AddressAutocomplete 
                        className="form-control" 
                        name="drop_address" 
                        value={formData.drop_address} 
                        onChange={handleInputChange} 
                        placeholder="Search drop-off location..."
                        required 
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Weight (kg)</label>
                      <input type="number" className="form-control" name="weight" value={formData.weight} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Parcel Type</label>
                      <select className="form-select" name="parcel_type" value={formData.parcel_type} onChange={handleInputChange}>
                        <option value="Standard" style={{ backgroundColor: "#0A0F1C", color: "#F8FAFC" }}>📦 Standard</option>
                        <option value="Express" style={{ backgroundColor: "#0A0F1C", color: "#F8FAFC" }}>⚡ Express</option>
                        <option value="Fragile" style={{ backgroundColor: "#0A0F1C", color: "#F8FAFC" }}>🍷 Fragile</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <label className="form-label small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Pickup Date</label>
                      <input type="date" className="form-control" name="pickup_date" value={formData.pickup_date} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-4">
                      <label className="form-label small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Shipment Status</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                        <option value="Pending" style={{ backgroundColor: "#0A0F1C", color: "#F8FAFC" }}>🟡 Pending</option>
                        <option value="Assigned" style={{ backgroundColor: "#0A0F1C", color: "#F8FAFC" }}>🟣 Assigned</option>
                        <option value="In Transit" style={{ backgroundColor: "#0A0F1C", color: "#F8FAFC" }}>🔵 In Transit</option>
                        <option value="Delivered" style={{ backgroundColor: "#0A0F1C", color: "#F8FAFC" }}>🟢 Delivered</option>
                      </select>
                    </div>
                  </div>
                  <div className="d-flex gap-3 mt-4">
                    <button type="button" className="btn btn-outline-danger py-2 fw-bold w-50 rounded-3" onClick={handleDeleteShipment} disabled={submitting}>
                      {submitting ? "..." : "Delete"}
                    </button>
                    <button type="submit" className="new-parcel-button py-2 fw-bold w-50" disabled={submitting}>
                      {submitting ? "Updating..." : "Update"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewModalParcel && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel border-0 shadow-lg rounded-4 p-2" style={{ background: "rgba(10, 15, 28, 0.95)", border: "1px solid var(--glass-border)" }}>
              <div className="modal-header border-bottom pb-3" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
                <h5 className="modal-title fw-bold" style={{ color: "var(--text-primary)" }}>Shipment Details</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewModalParcel(null)}></button>
              </div>
              <div className="modal-body p-4" style={{ color: "var(--text-primary)" }}>
                <div className="row mb-3 pb-2 border-bottom" style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}>
                  <div className="col-6 small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Parcel ID</div>
                  <div className="col-6 fw-bold text-end" style={{ color: "var(--accent-cyan)" }}>#{viewModalParcel.id}</div>
                </div>
                <div className="row mb-3 pb-2 border-bottom" style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}>
                  <div className="col-6 small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Status</div>
                  <div className="col-6 text-end">
                    <span className="badge px-3 py-1 rounded-pill" style={{ background: "rgba(0, 240, 255, 0.15)", color: "var(--accent-cyan)", border: "1px solid rgba(0, 240, 255, 0.3)" }}>
                      {viewModalParcel.status}
                    </span>
                  </div>
                </div>
                <div className="row mb-3 pb-2 border-bottom" style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}>
                  <div className="col-6 small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Pickup</div>
                  <div className="col-6 text-end">{viewModalParcel.pickup_address}</div>
                </div>
                <div className="row mb-3 pb-2 border-bottom" style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}>
                  <div className="col-6 small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Drop-off</div>
                  <div className="col-6 text-end">{viewModalParcel.drop_address}</div>
                </div>
                <div className="row mb-3 pb-2 border-bottom" style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}>
                  <div className="col-6 small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Weight</div>
                  <div className="col-6 text-end">{viewModalParcel.weight} kg</div>
                </div>
                <div className="row mb-3">
                  <div className="col-6 small fw-bold text-uppercase" style={{ color: "var(--text-secondary)" }}>Type</div>
                  <div className="col-6 text-end">{viewModalParcel.parcel_type}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS MODAL */}
      {showFilterModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content glass-panel border-0 shadow-lg rounded-4 p-2" style={{ background: "rgba(10, 15, 28, 0.95)", border: "1px solid var(--glass-border)" }}>
              <div className="modal-header border-bottom pb-3" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
                <h5 className="modal-title fw-bold" style={{ color: "var(--text-primary)" }}>Filter Shipments</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowFilterModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <label className="form-label small fw-bold text-uppercase mb-2" style={{ color: "var(--text-secondary)" }}>Status</label>
                <select className="form-select mb-4" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                </select>
                <div className="d-grid">
                  <button className="new-parcel-button w-100" onClick={() => setShowFilterModal(false)}>Apply Filter</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Parcels;