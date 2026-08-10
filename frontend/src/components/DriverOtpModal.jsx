import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaEnvelope,
  FaCheckCircle,
  FaTimes,
  FaSyncAlt,
  FaLock
} from "react-icons/fa";
import "./DriverOtpModal.css";

function DriverOtpModal({
  driverData,
  onVerified,
  onClose
}) {
  const [emailOtp, setEmailOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [error, setError] = useState("");
  const [emailMasked, setEmailMasked] = useState("");
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const hasSentRef = useRef(false);

  useEffect(() => {
    if (!hasSentRef.current) {
      hasSentRef.current = true;
      sendOtps();
    }
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendOtps = async () => {
    try {
      setResending(true);
      setError("");

      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/drivers/send-otp`,
        {
          full_name: driverData.full_name,
          email: driverData.email,
          phone: driverData.phone,
          license_number: driverData.license_number,
          vehicle_number: driverData.vehicle_number
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setEmailMasked(res.data.emailMasked || driverData.email);
      setCountdown(45);
    } catch (err) {
      console.error('Failed to send OTP:', err);
      setError(err.response?.data?.message || "Failed to dispatch verification OTP to your Gmail inbox.");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!emailOtp || emailOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP received in your Gmail inbox.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/drivers/verify-otp`,
        {
          email: driverData.email,
          emailOtp
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.verified) {
        setVerifiedSuccess(true);
        setTimeout(() => {
          onVerified();
        }, 1200);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.message || "Incorrect OTP. Please check the latest code in your Gmail inbox.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="driver-otp-backdrop">
      <div className="driver-otp-modal glass-panel">
        {/* Close button */}
        <button type="button" className="otp-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        {/* Modal Header */}
        <div className="otp-header">
          <div className="otp-icon-ring" style={{ background: "rgba(234, 67, 53, 0.15)", borderColor: "rgba(234, 67, 53, 0.4)", color: "#EA4335" }}>
            <FaEnvelope />
          </div>
          <h2>Gmail Verification</h2>
          <p>
            We have dispatched a 6-digit verification code to <strong>{driverData.email}</strong>. Please check your Gmail inbox to complete registration for <strong>{driverData.full_name}</strong>.
          </p>
        </div>

        {/* Spam Folder Warning */}
        <div className="otp-spam-warning">
          <span>📩</span>
          <span>Please check your <strong>Spam</strong> folder for the OTP email.</span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="otp-error-alert">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Success Animation */}
        {verifiedSuccess ? (
          <div className="otp-success-screen">
            <FaCheckCircle className="success-icon-animated" />
            <h3>Gmail Verified Successfully!</h3>
            <span>Registering driver into PostgreSQL database...</span>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="otp-form">
            {/* Email OTP Only */}
            <div className="otp-input-group">
              <label className="otp-field-label">
                <FaEnvelope style={{ color: "#EA4335" }} />
                <span>Enter 6-Digit Gmail OTP</span>
              </label>
              <div className="otp-input-wrapper">
                <input
                  type="text"
                  maxLength="6"
                  placeholder="• • • • • •"
                  className="otp-input"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  autoFocus
                  required
                />
                <span className="otp-len-badge">{emailOtp.length}/6</span>
              </div>
            </div>

            {/* Resend Action */}
            <div className="otp-resend-row">
              {countdown > 0 ? (
                <span className="countdown-text">
                  Resend code in <strong>0:{countdown < 10 ? `0${countdown}` : countdown}</strong>
                </span>
              ) : (
                <button
                  type="button"
                  className="resend-btn"
                  onClick={sendOtps}
                  disabled={resending}
                >
                  <FaSyncAlt className={resending ? "spin-icon" : ""} />
                  {resending ? "Sending..." : "Resend Gmail OTP"}
                </button>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="otp-actions">
              <button
                type="submit"
                className="otp-submit-btn"
                disabled={loading || emailOtp.length !== 6}
              >
                <FaLock />
                {loading ? "Verifying..." : "Verify & Complete Registration"}
              </button>
              <button
                type="button"
                className="otp-cancel-btn"
                onClick={onClose}
              >
                Back to Edit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default DriverOtpModal;
