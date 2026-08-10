import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { 
  FaRegEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaTruck, 
  FaGlobe, 
  FaWhatsapp,
  FaArrowRight,
  FaSun,
  FaMoon
} from "react-icons/fa";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import FlowLinkNetwork from "../components/FlowLinkNetwork";
import "./auth.css";

function Login() {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post("/auth/login", form);
            localStorage.setItem("token", response.data.token);
            toast.success("Welcome back to FlowLink!");

            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 800);
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Login failed. Please check your credentials."
            );
        }
        setLoading(false);
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
                {/* Left Side: Animated Integration Beam Network */}
                <div className="auth-network-pane">
                    <FlowLinkNetwork
                        titlePrefix="Welcome to the Next-Gen"
                        titleGradient="Micro-Commute Freight Network."
                        subtitle="Connect shipments, real-time routing, instant payouts, and live dispatch across one unified core."
                        statusText="FlowLink autonomous dispatch online"
                    />
                </div>

                {/* Right Side: Arcadia-Style Luxury Glass Login Card */}
                <div className="auth-card-pane">
                    <div className="arcadia-card">
                        <div className="arcadia-header">
                            <h1 className="arcadia-title">FlowLink</h1>
                            <p className="arcadia-subtitle">Your digital freight realm awaits</p>
                            <p className="arcadia-caption">Press Enter to begin your journey</p>
                            
                            <div className="arcadia-glyphs">
                                <span>✦</span>
                                <FaTruck style={{ fontSize: '14px', color: '#C084FC' }} />
                                <span>✦</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Email Field */}
                            <div className="arcadia-input-group">
                                <div className="arcadia-input-icon">
                                    <FaRegEnvelope />
                                </div>
                                <input
                                    type="email"
                                    className="arcadia-input"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Email address"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="arcadia-input-group">
                                <div className="arcadia-input-icon">
                                    <FaLock />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="arcadia-input"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Password"
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

                            {/* Remember Me & Forgot Password */}
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

                                <a href="#forgot" onClick={(e) => { e.preventDefault(); toast.info("Password recovery: please contact support or your administrator."); }} className="arcadia-forgot-link">
                                    Forgot password?
                                </a>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="arcadia-btn"
                                disabled={loading}
                            >
                                {loading ? "Entering FlowLink..." : "Enter FlowLink"}
                            </button>
                        </form>

                        {/* Quick Access Divider */}
                        <div className="arcadia-divider">
                            <span>quick access via</span>
                        </div>

                        {/* Quick Access Social / Portal Buttons */}
                        <div className="arcadia-social-row">
                            <Link to="/tracking" className="arcadia-social-btn" title="Live Public Tracking">
                                <FaGlobe />
                            </Link>

                            <a href="https://wa.me/" target="_blank" rel="noreferrer" className="arcadia-social-btn" title="WhatsApp Instant Support">
                                <FaWhatsapp />
                            </a>

                            <Link to="/driver/login" className="arcadia-social-btn" title="Driver Fleet Portal">
                                <FaTruck />
                            </Link>
                        </div>

                        {/* Footer */}
                        <p className="arcadia-footer">
                            New to the network? <Link to="/register">Create account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;