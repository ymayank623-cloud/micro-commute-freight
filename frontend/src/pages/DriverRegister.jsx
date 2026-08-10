import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUser, 
  FaRegEnvelope, 
  FaLock, 
  FaPhone, 
  FaIdCard, 
  FaTruck, 
  FaEye, 
  FaEyeSlash,
  FaGlobe,
  FaWhatsapp,
  FaShieldAlt 
} from 'react-icons/fa';
import { GoogleLogin } from "@react-oauth/google";
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import FlowLinkNetwork from '../components/FlowLinkNetwork';
import './auth.css';

function DriverRegister() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    license_number: '',
    vehicle_type: 'Van',
    vehicle_number: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSuccess = (credentialResponse) => {
    setLoading(true);
    try {
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decoded = JSON.parse(jsonPayload);
      
      if (!decoded.email.toLowerCase().endsWith("@gmail.com")) {
          toast.error("Please use a @gmail.com account.");
          setLoading(false);
          return;
      }

      setFormData({
          ...formData,
          full_name: decoded.name,
          email: decoded.email
      });
      toast.success("Google linked! Please enter your phone, password & vehicle details.");
    } catch (err) {
        console.error("Google token decode failed", err);
        toast.error("Failed to link Google account.");
    }
    setLoading(false);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email.toLowerCase().endsWith("@gmail.com")) {
        toast.error("Registration is strictly limited to @gmail.com addresses.");
        return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/driver-auth/register`, formData);
      localStorage.setItem('token', res.data.token);
      toast.success("Driver profile approved! Entering portal...");
      setTimeout(() => {
        window.location.href = '/driver/dashboard';
      }, 1000);
    } catch (err) {
      console.error("Registration Error:", err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please check your inputs.';
      setError(errorMsg);
      toast.error(errorMsg);
    }
    setLoading(false);
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-phone-otp`, { phone: formData.phone, otp });
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/driver-auth/register`, formData);
      localStorage.setItem('token', res.data.token);
      toast.success("Driver profile approved! Entering portal...");
      setTimeout(() => {
        window.location.href = '/driver/dashboard';
      }, 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please check your inputs.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      <ToastContainer />
      <div className="auth-split-inner">
        {/* Left Side: Animated Integration Beam Network for Drivers */}
        <div className="auth-network-pane">
          <FlowLinkNetwork
            titlePrefix="Start Earning on Your Daily"
            titleGradient="Micro-Commute Route."
            subtitle="Pick up verified parcels along your routine travels. Guaranteed instant payouts and smart automated dispatch."
            statusText="Onboarding & Fleet Radar open"
          />
        </div>

        {/* Right Side: Driver Registration Form in Arcadia UI */}
        <div className="auth-card-pane">
          <div className="arcadia-card wide">
            <div className="arcadia-header">
              <h1 className="arcadia-title">Driver Fleet</h1>
              <p className="arcadia-subtitle">
                {step === 1 ? "Create your driver fleet profile" : "Verify Mobile Number"}
              </p>
              <p className="arcadia-caption">
                {step === 1 ? "Press Enter to begin your journey" : "Enter the verification code sent to ${formData.phone}"}
              </p>
              
              <div className="arcadia-glyphs">
                <span>✦</span>
                <FaTruck style={{ fontSize: '14px', color: '#C084FC' }} />
                <span>✦</span>
              </div>
            </div>

            {step === 1 ? (
              <>
                <div className="d-flex justify-content-center mb-3">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error("Google authentication failed")}
                    theme="filled_black"
                    shape="pill"
                    text="signup_with"
                  />
                </div>

                <div className="arcadia-divider" style={{ margin: '14px 0' }}>
                  <span>or register fleet manually</span>
                </div>

                <form onSubmit={handleSendOtp}>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <div className="arcadia-input-group mb-2">
                        <div className="arcadia-input-icon"><FaUser /></div>
                        <input
                          type="text"
                          className="arcadia-input"
                          name="full_name"
                          placeholder="Full name"
                          value={formData.full_name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="arcadia-input-group mb-2">
                        <div className="arcadia-input-icon"><FaRegEnvelope /></div>
                        <input
                          type="email"
                          className="arcadia-input"
                          name="email"
                          placeholder="Gmail address (@gmail.com)"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="arcadia-input-group mb-2">
                        <div className="arcadia-input-icon"><FaPhone /></div>
                        <input
                          type="tel"
                          className="arcadia-input"
                          name="phone"
                          placeholder="+91 Phone number"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="arcadia-input-group mb-2">
                        <div className="arcadia-input-icon"><FaLock /></div>
                        <input
                          type={showPassword ? "text" : "password"}
                          className="arcadia-input"
                          name="password"
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                        <button
                          type="button"
                          className="arcadia-input-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="arcadia-input-group mb-2">
                        <div className="arcadia-input-icon"><FaIdCard /></div>
                        <input
                          type="text"
                          className="arcadia-input"
                          name="license_number"
                          placeholder="Driver License No."
                          value={formData.license_number}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="arcadia-input-group mb-2">
                        <div className="arcadia-input-icon"><FaTruck /></div>
                        <input
                          type="text"
                          className="arcadia-input"
                          name="vehicle_number"
                          placeholder="Vehicle Reg. Number"
                          value={formData.vehicle_number}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="arcadia-btn mt-3 w-100" disabled={loading}>
                    {loading ? "Creating Profile..." : "Create Driver Profile"}
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={handleVerifyAndRegister}>
                <div className="text-center mb-3">
                  <span className="badge px-3 py-2 rounded-pill" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#C084FC', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                    <FaShieldAlt className="me-1" /> Mobile SMS Verification
                  </span>
                </div>

                <div className="arcadia-input-group">
                  <div className="arcadia-input-icon"><FaShieldAlt /></div>
                  <input
                    type="text"
                    className="arcadia-input text-center fw-bold"
                    style={{ fontSize: '20px', letterSpacing: '4px' }}
                    name="otp"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="arcadia-btn mt-3"
                  disabled={loading || !otp}
                >
                  {loading ? "Verifying..." : "Complete Driver Registration"}
                </button>

                <div className="d-flex justify-content-between align-items-center mt-3 pt-2">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}
                    onClick={() => setStep(1)}
                  >
                    ← Back to Details
                  </button>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    style={{ color: '#C084FC', fontSize: '13px', fontWeight: 600 }}
                    onClick={handleSendOtp}
                    disabled={loading}
                  >
                    Resend SMS Code
                  </button>
                </div>
              </form>
            )}

            {/* Quick Access Divider */}
            <div className="arcadia-divider">
              <span>quick access via</span>
            </div>

            {/* Social Row */}
            <div className="arcadia-social-row">
              <Link to="/login" className="arcadia-social-btn" title="Customer Portal">
                <FaGlobe />
              </Link>

              <a href="https://wa.me/" target="_blank" rel="noreferrer" className="arcadia-social-btn" title="WhatsApp Support">
                <FaWhatsapp />
              </a>

              <Link to="/driver/login" className="arcadia-social-btn" title="Driver Login">
                <FaTruck />
              </Link>
            </div>

            {/* Footer */}
            <p className="arcadia-footer">
              Already a registered driver? <Link to="/driver/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverRegister;
