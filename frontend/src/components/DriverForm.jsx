import { useEffect, useState } from "react";
import {
  FaUserPlus,
  FaEdit,
  FaTimes,
  FaExclamationCircle,
  FaCheckCircle,
  FaIdCard,
  FaPhoneAlt,
  FaEnvelope,
  FaMotorcycle
} from "react-icons/fa";
import DriverOtpModal from "./DriverOtpModal";

function DriverForm({
  onSubmit,
  editingDriver,
  existingDrivers = [],
  cancelEdit
}) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    license_number: "",
    vehicle_type: "",
    vehicle_number: "",
    status: "Active"
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingDriverData, setPendingDriverData] = useState(null);

  useEffect(() => {
    if (editingDriver) {
      setFormData({
        full_name: editingDriver.full_name || "",
        email: editingDriver.email || "",
        phone: editingDriver.phone || "",
        license_number: editingDriver.license_number || "",
        vehicle_type: editingDriver.vehicle_type || "",
        vehicle_number: editingDriver.vehicle_number || "",
        status: editingDriver.status || "Active"
      });
    } else {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        license_number: "",
        vehicle_type: "",
        vehicle_number: "",
        status: "Active"
      });
    }
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
  }, [editingDriver]);

  // Real-time Validation Rules (with duplicate registration checks)
  const validateField = (name, value) => {
    let errorMsg = "";

    switch (name) {
      case "full_name":
        if (!value || !value.trim()) {
          errorMsg = "Full Name is required";
        } else if (value.trim().length < 3) {
          errorMsg = "Name must be at least 3 letters";
        } else if (!/^[a-zA-Z\s.'-]+$/.test(value.trim())) {
          errorMsg = "Name can only contain alphabetic characters";
        }
        break;

      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!value || !value.trim()) {
          errorMsg = "Email address is required";
        } else if (!emailRegex.test(value.trim())) {
          errorMsg = "Please enter a valid email address (e.g. driver@example.com)";
        } else {
          const dup = existingDrivers.find(d => 
            (!editingDriver || Number(d.id) !== Number(editingDriver.id)) &&
            d.email && d.email.trim().toLowerCase() === value.trim().toLowerCase()
          );
          if (dup) {
            errorMsg = "User registered previously with this Email address";
          }
        }
        break;

      case "phone":
        const cleanPhone = value.replace(/[^0-9]/g, "");
        if (!value || !value.trim()) {
          errorMsg = "Phone number is required";
        } else if (cleanPhone.length !== 10) {
          errorMsg = `Phone number must be exactly 10 digits (currently ${cleanPhone.length} digits)`;
        } else if (!/^[6-9]/.test(cleanPhone)) {
          errorMsg = "Indian mobile number must start with 6, 7, 8, or 9";
        } else {
          const dup = existingDrivers.find(d => 
            (!editingDriver || Number(d.id) !== Number(editingDriver.id)) &&
            d.phone && d.phone.replace(/[^0-9]/g, '') === cleanPhone
          );
          if (dup) {
            errorMsg = "User registered previously with this Phone number";
          }
        }
        break;

      case "license_number":
        const cleanDL = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        if (!value || !value.trim()) {
          errorMsg = "Driving License Number is required";
        } else if (cleanDL.length < 10 || cleanDL.length > 16) {
          errorMsg = "License number must be 10-16 characters (e.g. UP1420180012345 or DL1420110012345)";
        } else if (!/^[A-Z]{2}/.test(cleanDL)) {
          errorMsg = "License must start with official 2-letter State Code (e.g. DL, UP, MH, HR)";
        } else {
          const dup = existingDrivers.find(d => 
            (!editingDriver || Number(d.id) !== Number(editingDriver.id)) &&
            d.license_number && d.license_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanDL
          );
          if (dup) {
            errorMsg = "User registered previously with this License Number";
          }
        }
        break;

      case "vehicle_type":
        if (!value || !value.trim()) {
          errorMsg = "Please select an official vehicle type";
        }
        break;

      case "vehicle_number":
        const cleanVN = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        const rtoRegex = /^([A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}|[0-9]{2}BH[0-9]{4}[A-Z]{1,2})$/;
        if (!value || !value.trim()) {
          errorMsg = "Vehicle Registration Number is required";
        } else if (cleanVN.length < 6 || cleanVN.length > 11) {
          errorMsg = "Invalid length. Official format: UP32AB1234 or DL01CA4321";
        } else if (!rtoRegex.test(cleanVN)) {
          errorMsg = "Must follow official RTO format: 2 State letters + 2 District digits + 1-2 letters + 4 digits (e.g. UP32AB1234)";
        } else {
          const dup = existingDrivers.find(d => 
            (!editingDriver || Number(d.id) !== Number(editingDriver.id)) &&
            d.vehicle_number && d.vehicle_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanVN
          );
          if (dup) {
            errorMsg = "User registered previously with this Vehicle Number";
          }
        }
        break;

      default:
        break;
    }

    return errorMsg;
  };

  const validateAll = (dataToValidate) => {
    const newErrors = {};
    Object.keys(dataToValidate).forEach((field) => {
      if (field !== "status") {
        const error = validateField(field, dataToValidate[field]);
        if (error) newErrors[field] = error;
      }
    });
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto-uppercase vehicle and license number
    const formattedValue = (name === "vehicle_number" || name === "license_number") 
      ? value.toUpperCase() 
      : value;

    const updatedFormData = {
      ...formData,
      [name]: formattedValue
    };

    setFormData(updatedFormData);

    if (touched[name] || submitAttempted) {
      const fieldError = validateField(name, formattedValue);
      setErrors(prev => ({
        ...prev,
        [name]: fieldError
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    // Mark all fields touched
    const allTouched = {
      full_name: true,
      email: true,
      phone: true,
      license_number: true,
      vehicle_type: true,
      vehicle_number: true
    };
    setTouched(allTouched);

    const validationErrors = validateAll(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return; // Block submission
    }

    if (editingDriver) {
      onSubmit(formData);
    } else {
      // Trigger Dual OTP Verification (Phone & Email)
      setPendingDriverData(formData);
      setShowOtpModal(true);
    }
  };

  const handleOtpVerified = () => {
    setShowOtpModal(false);
    if (pendingDriverData) {
      onSubmit(pendingDriverData);
    }
    // Auto-clear all slots
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      license_number: "",
      vehicle_type: "",
      vehicle_number: "",
      status: "Active"
    });
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
    setPendingDriverData(null);
  };

  const hasError = (field) => Boolean((touched[field] || submitAttempted) && errors[field]);
  const isValid = (field) => Boolean(touched[field] && !errors[field] && formData[field]);

  const getInputStyle = (field) => ({
    background: "rgba(255, 255, 255, 0.04)",
    border: hasError(field) 
      ? "1.5px solid #EF4444" 
      : isValid(field) 
      ? "1.5px solid #10B981" 
      : "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    color: "var(--text-primary, #FFFFFF)",
    padding: "10px 16px",
    fontSize: "0.95rem",
    width: "100%",
    outline: "none",
    boxShadow: hasError(field) 
      ? "0 0 12px rgba(239, 68, 68, 0.3)" 
      : isValid(field) 
      ? "0 0 12px rgba(16, 185, 129, 0.2)" 
      : "none",
    transition: "all 0.2s ease"
  });

  return (
    <div className="glass-panel mb-4 p-4 rounded-4" style={{ border: "1px solid var(--glass-border)", background: "rgba(15, 23, 42, 0.88)" }}>
      {/* Form Header */}
      <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom" style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}>
        <div style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #00F0FF, #8A2BE2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "18px",
          boxShadow: "0 0 15px rgba(0, 240, 255, 0.3)"
        }}>
          {editingDriver ? <FaEdit /> : <FaUserPlus />}
        </div>
        <div>
          <h3 className="mb-0 fw-bold" style={{ color: "var(--text-primary, #FFFFFF)", fontSize: "1.3rem" }}>
            {editingDriver ? "Edit Driver Details" : "Register New Fleet Driver"}
          </h3>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary, #94A3B8)" }}>
            {editingDriver ? "Update driver credentials and official vehicle registration." : "Fill in official driver information with verified Indian transport credentials."}
          </span>
        </div>
      </div>

      {/* Global Form Error Banner if submit attempted with errors */}
      {submitAttempted && Object.keys(errors).length > 0 && (
        <div className="d-flex align-items-center gap-2 p-3 mb-3 rounded-3" style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#EF4444", fontSize: "13px", fontWeight: "600" }}>
          <FaExclamationCircle />
          <span>Please correct the marked fields below before submitting the registration.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-3">
          {/* 1. Full Name */}
          <div className="col-md-6 mb-2">
            <label className="d-flex align-items-center justify-content-between mb-2">
              <span style={{ fontSize: "0.8rem", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-secondary, #94A3B8)" }}>
                Full Name <span style={{ color: "#EF4444", fontWeight: "900", fontSize: "1rem" }}>*</span>
              </span>
              {isValid("full_name") && <span style={{ color: "#10B981", fontSize: "11px" }}>✓ Valid</span>}
            </label>
            <input
              type="text"
              style={getInputStyle("full_name")}
              name="full_name"
              placeholder="e.g. Rahul Sharma"
              value={formData.full_name}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {hasError("full_name") ? (
              <div className="d-flex align-items-center gap-1 mt-1" style={{ color: "#EF4444", fontSize: "12px", fontWeight: "600" }}>
                <FaExclamationCircle /> <span>{errors.full_name}</span>
              </div>
            ) : (
              <div style={{ fontSize: "11px", color: "var(--text-muted, #64748B)", marginTop: "4px" }}>Official name as on Driving License</div>
            )}
          </div>

          {/* 2. Email Address */}
          <div className="col-md-6 mb-2">
            <label className="d-flex align-items-center justify-content-between mb-2">
              <span style={{ fontSize: "0.8rem", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-secondary, #94A3B8)" }}>
                Email Address <span style={{ color: "#EF4444", fontWeight: "900", fontSize: "1rem" }}>*</span>
              </span>
              {isValid("email") && <span style={{ color: "#10B981", fontSize: "11px" }}>✓ Valid</span>}
            </label>
            <input
              type="email"
              style={getInputStyle("email")}
              name="email"
              placeholder="e.g. rahul.sharma@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {hasError("email") ? (
              <div className="d-flex align-items-center gap-1 mt-1" style={{ color: "#EF4444", fontSize: "12px", fontWeight: "600" }}>
                <FaExclamationCircle /> <span>{errors.email}</span>
              </div>
            ) : (
              <div style={{ fontSize: "11px", color: "var(--text-muted, #64748B)", marginTop: "4px" }}>Valid communication email</div>
            )}
          </div>

          {/* 3. Phone Number (10 Digits) */}
          <div className="col-md-6 mb-2">
            <label className="d-flex align-items-center justify-content-between mb-2">
              <span style={{ fontSize: "0.8rem", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-secondary, #94A3B8)" }}>
                Phone Number <span style={{ color: "#EF4444", fontWeight: "900", fontSize: "1rem" }}>*</span>
              </span>
              {isValid("phone") && <span style={{ color: "#10B981", fontSize: "11px" }}>✓ 10 Digits</span>}
            </label>
            <input
              type="tel"
              style={getInputStyle("phone")}
              name="phone"
              maxLength="10"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {hasError("phone") ? (
              <div className="d-flex align-items-center gap-1 mt-1" style={{ color: "#EF4444", fontSize: "12px", fontWeight: "600" }}>
                <FaExclamationCircle /> <span>{errors.phone}</span>
              </div>
            ) : (
              <div style={{ fontSize: "11px", color: "var(--text-muted, #64748B)", marginTop: "4px" }}>Exactly 10-digit mobile number (starts with 6-9)</div>
            )}
          </div>

          {/* 4. License Number */}
          <div className="col-md-6 mb-2">
            <label className="d-flex align-items-center justify-content-between mb-2">
              <span style={{ fontSize: "0.8rem", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-secondary, #94A3B8)" }}>
                License Number <span style={{ color: "#EF4444", fontWeight: "900", fontSize: "1rem" }}>*</span>
              </span>
              {isValid("license_number") && <span style={{ color: "#10B981", fontSize: "11px" }}>✓ Verified Format</span>}
            </label>
            <input
              type="text"
              style={getInputStyle("license_number")}
              name="license_number"
              placeholder="e.g. UP1420180012345"
              value={formData.license_number}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {hasError("license_number") ? (
              <div className="d-flex align-items-center gap-1 mt-1" style={{ color: "#EF4444", fontSize: "12px", fontWeight: "600" }}>
                <FaExclamationCircle /> <span>{errors.license_number}</span>
              </div>
            ) : (
              <div style={{ fontSize: "11px", color: "var(--text-muted, #64748B)", marginTop: "4px" }}>Official RTO format: State Code + Year + ID (e.g. DL1420110012345)</div>
            )}
          </div>

          {/* 5. Vehicle Type */}
          <div className="col-md-6 mb-2">
            <label className="d-flex align-items-center justify-content-between mb-2">
              <span style={{ fontSize: "0.8rem", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-secondary, #94A3B8)" }}>
                Vehicle Type <span style={{ color: "#EF4444", fontWeight: "900", fontSize: "1rem" }}>*</span>
              </span>
              {isValid("vehicle_type") && <span style={{ color: "#10B981", fontSize: "11px" }}>✓ Selected</span>}
            </label>
            <select
              style={{ ...getInputStyle("vehicle_type"), cursor: "pointer" }}
              name="vehicle_type"
              value={formData.vehicle_type}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="" style={{ background: "#0A0F1C", color: "#94A3B8" }}>Select Official Vehicle Type</option>
              <option value="Bike" style={{ background: "#0A0F1C", color: "#FFFFFF" }}>🏍️ Bike (Two-Wheeler)</option>
              <option value="Scooter" style={{ background: "#0A0F1C", color: "#FFFFFF" }}>🛵 Scooter (Two-Wheeler)</option>
              <option value="Car" style={{ background: "#0A0F1C", color: "#FFFFFF" }}>🚗 Car / Hatchback</option>
              <option value="Mini Truck" style={{ background: "#0A0F1C", color: "#FFFFFF" }}>🚚 Mini Truck (Commercial)</option>
              <option value="Van" style={{ background: "#0A0F1C", color: "#FFFFFF" }}>🚐 Van / Cargo</option>
            </select>
            {hasError("vehicle_type") ? (
              <div className="d-flex align-items-center gap-1 mt-1" style={{ color: "#EF4444", fontSize: "12px", fontWeight: "600" }}>
                <FaExclamationCircle /> <span>{errors.vehicle_type}</span>
              </div>
            ) : (
              <div style={{ fontSize: "11px", color: "var(--text-muted, #64748B)", marginTop: "4px" }}>Authorized vehicle class for freight commute</div>
            )}
          </div>

          {/* 6. Vehicle Number */}
          <div className="col-md-6 mb-2">
            <label className="d-flex align-items-center justify-content-between mb-2">
              <span style={{ fontSize: "0.8rem", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-secondary, #94A3B8)" }}>
                Vehicle Number <span style={{ color: "#EF4444", fontWeight: "900", fontSize: "1rem" }}>*</span>
              </span>
              {isValid("vehicle_number") && <span style={{ color: "#10B981", fontSize: "11px" }}>✓ RTO Format</span>}
            </label>
            <input
              type="text"
              style={getInputStyle("vehicle_number")}
              name="vehicle_number"
              placeholder="e.g. UP32AB1234"
              value={formData.vehicle_number}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {hasError("vehicle_number") ? (
              <div className="d-flex align-items-center gap-1 mt-1" style={{ color: "#EF4444", fontSize: "12px", fontWeight: "600" }}>
                <FaExclamationCircle /> <span>{errors.vehicle_number}</span>
              </div>
            ) : (
              <div style={{ fontSize: "11px", color: "var(--text-muted, #64748B)", marginTop: "4px" }}>Official RTO Plate (e.g. UP32AB1234, DL01CA4321, 22BH1234AA)</div>
            )}
          </div>

          {/* 7. Operational Status (if editing) */}
          {editingDriver && (
            <div className="col-md-6 mb-2">
              <label className="d-block mb-2" style={{ fontSize: "0.8rem", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-secondary, #94A3B8)" }}>
                Operational Status
              </label>
              <select
                style={{ ...getInputStyle("status"), cursor: "pointer" }}
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active" style={{ background: "#0A0F1C", color: "#10B981" }}>🟢 Active / Available</option>
                <option value="Busy" style={{ background: "#0A0F1C", color: "#00F0FF" }}>🔵 Busy (On Delivery)</option>
                <option value="Offline" style={{ background: "#0A0F1C", color: "#94A3B8" }}>⚪ Offline</option>
              </select>
            </div>
          )}
        </div>

        {/* Submit & Cancel Buttons */}
        <div className="d-flex align-items-center gap-3 mt-4 pt-2">
          <button
            type="submit"
            style={{
              background: "linear-gradient(135deg, #00F0FF 0%, #8A2BE2 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "12px 28px",
              fontSize: "0.95rem",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0, 240, 255, 0.3)",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            {editingDriver ? "Save Changes" : "Register Driver"}
          </button>

          {editingDriver && (
            <button
              type="button"
              onClick={cancelEdit}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "var(--text-secondary, #94A3B8)",
                borderRadius: "12px",
                padding: "12px 22px",
                fontSize: "0.95rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <FaTimes className="me-2" /> Cancel
            </button>
          )}
        </div>
      </form>

      {/* DUAL OTP MODAL (PHONE & EMAIL) */}
      {showOtpModal && pendingDriverData && (
        <DriverOtpModal
          driverData={pendingDriverData}
          onVerified={handleOtpVerified}
          onClose={() => {
            setShowOtpModal(false);
            setPendingDriverData(null);
          }}
        />
      )}
    </div>
  );
}

export default DriverForm;