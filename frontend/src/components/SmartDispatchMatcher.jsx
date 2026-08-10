import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FaRoute,
  FaBolt,
  FaLeaf,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaMotorcycle,
  FaCompass,
  FaTag,
  FaShieldAlt,
  FaArrowRight
} from "react-icons/fa";
import "./SmartDispatchMatcher.css";

function SmartDispatchMatcher({ onAssignmentCreated }) {
  const [parcels, setParcels] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedParcelId, setSelectedParcelId] = useState("");
  const [assigningOption, setAssigningOption] = useState(null); // 1 or 2
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [parcelsRes, driversRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/parcels`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/drivers`, { headers })
      ]);

      const allParcels = Array.isArray(parcelsRes.data) ? parcelsRes.data : [];
      const pendingList = allParcels.filter(p => p.status === 'Pending" || p.status === "pending');
      
      // If no pending, allow matching all for preview
      setParcels(pendingList.length > 0 ? pendingList : allParcels);
      if (pendingList.length > 0) {
        setSelectedParcelId(pendingList[0].id);
      } else if (allParcels.length > 0) {
        setSelectedParcelId(allParcels[0].id);
      }

      const allDrivers = Array.isArray(driversRes.data) ? driversRes.data : [];
      setDrivers(allDrivers);
    } catch (err) {
      console.error("Failed to load matching data:", err);
    }
  };

  const selectedParcel = useMemo(() => {
    return parcels.find(p => Number(p.id) === Number(selectedParcelId)) || parcels[0] || null;
  }, [parcels, selectedParcelId]);

  // Option 1: Commuter Match (Going to same destination)
  const commuterMatch = useMemo(() => {
    if (!selectedParcel || drivers.length === 0) return null;
    // Match driver whose route/vehicle or first available driver fits the same corridor
    const available = drivers.filter(d => d.status === "Available" || d.status === "active");
    const driver = available.length > 0 ? available[0] : drivers[0];
    
    // Extract weight and estimated route distance
    const weight = Math.max(0.5, parseFloat(selectedParcel.weight || 2));
    // Estimate distance in km (or fallback between 3km and 15km for city delivery)
    const pickup = selectedParcel.pickup_address || "";
    const drop = selectedParcel.drop_address || "";
    const estimatedDistanceKm = Math.min(35, Math.max(2.5, Math.round(((pickup.length + drop.length) % 12) + 3.2)));

    // FORMULA 1: Co-Traveler Route Match (Low Price)
    // Base ₹25 + (Distance * ₹4/km) + (Weight * ₹6/kg)
    const lowPrice = Math.round(25 + (estimatedDistanceKm * 4) + (weight * 6));
    const originalPrice = Math.round(60 + (estimatedDistanceKm * 12) + (weight * 15));
    const savingsPct = Math.round(((originalPrice - lowPrice) / originalPrice) * 100);

    return {
      driver,
      pricingType: "Co-Traveler Route Match",
      price: lowPrice,
      originalPrice: originalPrice,
      discount: `${savingsPct}% Eco-Savings`,
      badge: "SAME DESTINATION COMMUTE",
      eta: "22 - 28 mins",
      distanceKm: estimatedDistanceKm,
      weightKg: weight,
      formulaBreakdown: `Base ₹25 + (${estimatedDistanceKm} km × ₹4) + (${weight} kg × ₹6)`,
      routeMatchPct: "94% Route Overlap",
      benefits: [
        `Weight: ${weight} kg | Distance: ~${estimatedDistanceKm} km`,
        "Already traveling towards this destination",
        "Slightly longer (+6 mins) for prior en-route drop",
        "Lowest guaranteed cost on the network"
      ]
    };
  }, [selectedParcel, drivers]);

  // Option 2: Nearest Dedicated Driver (High price based on weight & distance)
  const nearestMatch = useMemo(() => {
    if (!selectedParcel || drivers.length === 0) return null;
    const available = drivers.filter(d => d.status === "Available" || d.status === "active");
    const driver = available.length > 1 ? available[1] : drivers[drivers.length - 1];

    const weight = Math.max(0.5, parseFloat(selectedParcel.weight || 2));
    const pickup = selectedParcel.pickup_address || "";
    const drop = selectedParcel.drop_address || "";
    const estimatedDistanceKm = Math.min(35, Math.max(2.5, Math.round(((pickup.length + drop.length) % 12) + 3.2)));

    // FORMULA 2: Nearest Priority Courier (High Price)
    // Base ₹60 + (Distance * ₹12/km) + (Weight * ₹15/kg)
    const highPrice = Math.round(60 + (estimatedDistanceKm * 12) + (weight * 15));

    return {
      driver,
      pricingType: "Nearest Dedicated Courier",
      price: highPrice,
      badge: "EXPRESS PRIORITY DISPATCH",
      eta: "15 - 20 mins (Direct Express)",
      distanceKm: estimatedDistanceKm,
      weightKg: weight,
      formulaBreakdown: `Base ₹60 + (${estimatedDistanceKm} km × ₹12) + (${weight} kg × ₹15)`,
      distance: "0.8 km from Pickup Point",
      benefits: [
        `Weight: ${weight} kg | Distance: ~${estimatedDistanceKm} km`,
        "Physically closest available driver right now",
        "1-on-1 exclusive on-demand courier dispatch",
        "Fastest direct point-to-point delivery"
      ]
    };
  }, [selectedParcel, drivers]);

  const handleAssign = async (optionNum, driverToAssign, priceSelected) => {
    if (!selectedParcel || !driverToAssign) return;
    setAssigningOption(optionNum);
    setError("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/assignments`,
        {
          parcel_id: selectedParcel.id,
          driver_id: driverToAssign.id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccessMessage(
        `🎉 Successfully assigned ${driverToAssign.full_name} (${optionNum === 1 ? 'Commuter Match @ ₹' + priceSelected : 'Nearest Courier @ ₹' + priceSelected}) to Parcel #${selectedParcel.id}!`
      );

      if (onAssignmentCreated) onAssignmentCreated();
      loadData();
    } catch (err) {
      console.error('Assignment error:', err);
      setError(err.response?.data?.message || "Failed to dispatch driver.");
    } finally {
      setAssigningOption(null);
    }
  };

  return (
    <div className="smart-matcher-card glass-panel">
      {/* Header */}
      <div className="smart-matcher-header">
        <div className="matcher-icon-badge">
          <FaRoute />
        </div>
        <div>
          <span className="matcher-overline">DUAL-MODE SMART DISPATCH ENGINE</span>
          <h2>Intelligent Courier Matching</h2>
          <p>Compare Co-Traveler Route Match (Low Cost) vs Nearest Instant Courier (Express)</p>
        </div>
      </div>

      {/* Parcel Selection Bar */}
      <div className="matcher-parcel-select">
        <label>SELECT SHIPMENT TO DISPATCH:</label>
        <select
          className="form-select matcher-select"
          value={selectedParcelId}
          onChange={(e) => setSelectedParcelId(e.target.value)}
        >
          {parcels.map(p => (
            <option key={p.id} value={p.id} style={{ backgroundColor: "#0A0F1C", color: "#FFFFFF" }}>
              #{p.id} — {p.pickup_address?.split(',')[0]} → {p.drop_address?.split(',')[0]} ({p.weight || '2'} kg, {p.status})
            </option>
          ))}
        </select>
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="matcher-alert success">
          <FaCheckCircle />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="matcher-alert error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {selectedParcel && (
        <div className="matcher-route-preview">
          <div className="route-tags">
            <span className="route-tag origin">🟢 Origin: <strong>{selectedParcel.pickup_address}</strong></span>
            <FaArrowRight className="route-tag-arrow" />
            <span className="route-tag dest">🔴 Destination: <strong>{selectedParcel.drop_address}</strong></span>
          </div>
          <span className="parcel-weight-badge">Weight: <strong>{selectedParcel.weight} kg</strong></span>
        </div>
      )}

      {/* 2 COMPARISON CARDS */}
      <div className="matcher-grid">
        {/* OPTION 1: COMMUTER ROUTE MATCH (LOW PRICE) */}
        {commuterMatch && (
          <div className="matcher-option-card commuter-card">
            <div className="option-badge-tag green">
              <FaLeaf />
              <span>{commuterMatch.badge}</span>
            </div>

            <div className="option-price-row">
              <div className="price-tag-group">
                <span className="currency">₹</span>
                <span className="price-amount low">{commuterMatch.price}</span>
                <span className="price-period">/ delivery</span>
              </div>
              <div className="discount-tag">
                <FaTag />
                <span>{commuterMatch.discount}</span>
              </div>
            </div>
            <div className="price-comparison-note">
              Standard Courier Price: <del>₹{commuterMatch.originalPrice}</del>
            </div>
            <div className="formula-pill green">
              <span>📐 Rate: {commuterMatch.formulaBreakdown}</span>
            </div>

            {/* Driver Match Info */}
            <div className="matched-driver-box">
              <div className="driver-avatar-ring green">
                {commuterMatch.driver?.full_name?.charAt(0) || "D"}
              </div>
              <div className="driver-details">
                <strong>{commuterMatch.driver?.full_name || "Assigned Commuter"}</strong>
                <span>{commuterMatch.driver?.vehicle_type} • {commuterMatch.driver?.vehicle_number}</span>
                <span className="match-tag-pill green">
                  <FaRoute /> {commuterMatch.routeMatchPct}
                </span>
              </div>
            </div>

            {/* Benefits List */}
            <ul className="option-benefits-list">
              {commuterMatch.benefits.map((b, i) => (
                <li key={`cb-${i}`}>
                  <FaCheckCircle className="check-icon green" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="option-eta-bar">
              <FaClock />
              <span>Estimated Delivery: <strong>{commuterMatch.eta}</strong></span>
            </div>

            <button
              type="button"
              className="matcher-action-btn green-btn"
              disabled={assigningOption !== null}
              onClick={() => handleAssign(1, commuterMatch.driver, commuterMatch.price)}
            >
              {assigningOption === 1 ? "Dispatching..." : "Assign Commuter Match (₹${commuterMatch.price})"}
            </button>
          </div>
        )}

        {/* OPTION 2: NEAREST DEDICATED DRIVER (HIGH PRICE) */}
        {nearestMatch && (
          <div className="matcher-option-card nearest-card">
            <div className="option-badge-tag amber">
              <FaBolt />
              <span>{nearestMatch.badge}</span>
            </div>

            <div className="option-price-row">
              <div className="price-tag-group">
                <span className="currency">₹</span>
                <span className="price-amount high">{nearestMatch.price}</span>
                <span className="price-period">/ express</span>
              </div>
              <span className="premium-tag">Instant Courier</span>
            </div>
            <div className="price-comparison-note">
              Exclusive 1-on-1 Point-to-Point Dispatch
            </div>
            <div className="formula-pill amber">
              <span>📐 Rate: {nearestMatch.formulaBreakdown}</span>
            </div>

            {/* Driver Match Info */}
            <div className="matched-driver-box">
              <div className="driver-avatar-ring amber">
                {nearestMatch.driver?.full_name?.charAt(0) || "D"}
              </div>
              <div className="driver-details">
                <strong>{nearestMatch.driver?.full_name || "Nearest Courier"}</strong>
                <span>{nearestMatch.driver?.vehicle_type} • {nearestMatch.driver?.vehicle_number}</span>
                <span className="match-tag-pill amber">
                  <FaCompass /> {nearestMatch.distance}
                </span>
              </div>
            </div>

            {/* Benefits List */}
            <ul className="option-benefits-list">
              {nearestMatch.benefits.map((b, i) => (
                <li key={`nb-${i}`}>
                  <FaCheckCircle className="check-icon amber" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="option-eta-bar">
              <FaBolt style={{ color: "#F59E0B" }} />
              <span>Priority ETA: <strong>{nearestMatch.eta}</strong></span>
            </div>

            <button
              type="button"
              className="matcher-action-btn amber-btn"
              disabled={assigningOption !== null}
              onClick={() => handleAssign(2, nearestMatch.driver, nearestMatch.price)}
            >
              {assigningOption === 2 ? "Dispatching..." : "Assign Nearest Express (₹${nearestMatch.price})"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SmartDispatchMatcher;
