import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaTruck, 
  FaRegEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaGlobe, 
  FaWhatsapp, 
  FaArrowRight,
  FaSun,
  FaMoon
} from 'react-icons/fa';
import FlowLinkNetwork from '../components/FlowLinkNetwork';
import { useTheme } from '../context/ThemeContext';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import './auth.css';

function DriverLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/driver-auth/login`, formData);
      localStorage.setItem('token', res.data.token);
      toast.success("Welcome Driver! Launching dashboard...");
      setTimeout(() => {
        window.location.href = '/driver/dashboard';
      }, 800);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      <ToastContainer />

      {/* Top Right Theme Switcher */}
      <div className="auth-top-actions">
        <button
          type="button"
          className="auth-theme-toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
        >
          {theme === "light" ? (
            <>
              <FaMoon style={{ color: "#7C3AED" }} />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <FaSun style={{ color: "#FDE047" }} />
              <span>Light Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="auth-split-inner">
        {/* Left Side: Animated Integration Beam Network for Drivers */}
        <div className="auth-network-pane">
          <FlowLinkNetwork
            titlePrefix="Live Fleet Dispatch &"
            titleGradient="Instant Driver Payouts."
            subtitle="Connect your vehicle, accept nearby micro-commute shipments, and receive verified earnings on every delivery."
            statusText="Driver telematics & radar online"
          />
        </div>

        {/* Right Side: Driver Login Form in Arcadia UI */}
        <div className="auth-card-pane">
          <div className="arcadia-card">
            <div className="arcadia-header">
              <h1 className="arcadia-title">Driver Portal</h1>
              <p className="arcadia-subtitle">Your digital freight realm awaits</p>
              <p className="arcadia-caption">Press Enter to begin your journey</p>
              
              <div className="arcadia-glyphs">
                <span>✦</span>
                <FaTruck style={{ fontSize: '14px', color: '#C084FC' }} />
                <span>✦</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email Address */}
              <div className="arcadia-input-group">
                <div className="arcadia-input-icon">
                  <FaRegEnvelope />
                </div>
                <input
                  type="email"
                  className="arcadia-input"
                  name="email"
                  placeholder="driver@flowlink.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="arcadia-input-group">
                <div className="arcadia-input-icon">
                  <FaLock />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="arcadia-input"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="arcadia-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Options Row */}
              <div className="arcadia-options-row">
                <label className="arcadia-remember">
                  <span className="arcadia-switch">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="arcadia-slider"></span>
                  </span>
                  Remember me
                </label>

                <a href="#forgot" onClick={(e) => { e.preventDefault(); toast.info("Driver recovery: please contact support."); }} className="arcadia-forgot-link">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="arcadia-btn"
                disabled={loading}
              >
                {loading ? "Entering Portal..." : "Enter Driver Portal"}
              </button>
            </form>

            {/* Quick Access Divider */}
            <div className="arcadia-divider">
              <span>quick access via</span>
            </div>

            {/* Social Row */}
            <div className="arcadia-social-row">
              <Link to="/login" className="arcadia-social-btn" title="Customer Portal">
                <FaGlobe />
              </Link>

              <a href="https://wa.me/" target="_blank" rel="noreferrer" className="arcadia-social-btn" title="Driver Dispatch Helpline">
                <FaWhatsapp />
              </a>

              <Link to="/tracking" className="arcadia-social-btn" title="Public Tracking">
                <FaTruck />
              </Link>
            </div>

            {/* Footer */}
            <p className="arcadia-footer">
              Not a registered driver? <Link to="/driver/register">Apply here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverLogin;
