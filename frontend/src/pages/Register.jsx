import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleLogin } from "@react-oauth/google";

import { 
  FaRegUser, 
  FaRegEnvelope, 
  FaPhone, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaTruck, 
  FaGlobe, 
  FaWhatsapp,
  FaShieldAlt,
  FaSun,
  FaMoon
} from "react-icons/fa";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import FlowLinkNetwork from "../components/FlowLinkNetwork";
import "./auth.css";

function Register() {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        role: "user" 
    });

    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState(1); // 1 = Details, 2 = OTP
    const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
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

            setForm({
                ...form,
                full_name: decoded.name,
                email: decoded.email
            });
            toast.success("Google account linked! Please enter your phone & password.");
        } catch (error) {
            console.error("Google token decode failed", error);
            toast.error("Failed to link Google account.");
        }
        setLoading(false);
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        
        if (!form.email.toLowerCase().endsWith("@gmail.com")) {
            toast.error("Registration is strictly limited to @gmail.com addresses.");
            return;
        }

        let submitPhone = form.phone;
        if (!submitPhone.startsWith("+")) {
            submitPhone = "+91" + submitPhone.replace(/\D/g, '');
            setForm({...form, phone: submitPhone});
        }

        if (submitPhone.length < 13) {
            toast.error("Please enter a valid 10-digit mobile number.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/register", {
                ...form,
                phone: submitPhone
            });
            
            toast.success("Registration Successful! Redirecting to login...");
            
            setTimeout(() => {
                navigate("/login");
            }, 1200);
        } catch (error) {
            console.error("Registration Error:", error);
            if (error.response?.data?.message === "Email already exists.") {
                toast.error("This email is already registered.");
            } else {
                toast.error(error.response?.data?.message || "Failed to register. Please try again.");
            }
        }
        setLoading(false);
    };

    const handleVerifyAndRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const fullOtp = otpValues.join('');
            if (fullOtp.length !== 6) {
                toast.error("Please enter the complete 6-digit OTP.");
                setLoading(false);
                return;
            }

            await api.post("/auth/verify-email-otp", { email: form.email, otp: fullOtp });
            await api.post("/auth/register", form);
            
            toast.success("Registration Successful! Redirecting to login...");
            
            setTimeout(() => {
                navigate("/login");
            }, 1200);
        } catch (error) {
            console.error("Verification failed:", error);
            toast.error(
                error.response?.data?.message || error.message || "Verification or Registration Failed"
            );
        }
        setLoading(false);
    };

    const handleOtpChange = (index, value) => {
        if (value && !/^\d+$/.test(value)) return;
        
        const newOtpValues = [...otpValues];
        newOtpValues[index] = value.substring(value.length - 1);
        setOtpValues(newOtpValues);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('Text').replace(/\D/g, '').substring(0, 6);
        if (!pastedData) return;

        const newOtpValues = [...otpValues];
        for (let i = 0; i < pastedData.length; i++) {
            newOtpValues[i] = pastedData[i];
        }
        setOtpValues(newOtpValues);
        
        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otpValues[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
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
                {/* Left Side: Animated Integration Beam Network */}
                <div className="auth-network-pane">
                    <FlowLinkNetwork
                        titlePrefix="Join the Intelligent"
                        titleGradient="Freight Ecosystem."
                        subtitle="Book, dispatch, and track parcels seamlessly with verified commuter drivers and instant route optimization."
                        statusText="Network capacity online"
                    />
                </div>

                {/* Right Side: Arcadia-Style Luxury Glass Registration Card */}
                <div className="auth-card-pane">
                    <div className="arcadia-card wide">
                        <div className="arcadia-header">
                            <h1 className="arcadia-title">FlowLink</h1>
                            <p className="arcadia-subtitle">
                                {step === 1 ? "Create your digital freight account" : "Verify Gmail Address"}
                            </p>
                            <p className="arcadia-caption">
                                {step === 1 ? "Press Enter to begin your journey" : "Enter the 6-digit OTP sent to ${form.email}"}
                            </p>
                            
                            <div className="arcadia-glyphs">
                                <span>✦</span>
                                <FaTruck style={{ fontSize: '14px', color: '#C084FC' }} />
                                <span>✦</span>
                            </div>
                        </div>

                        {step === 1 ? (
                            <>
                                {/* Google Fast Sign-in */}
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
                                    <span>or register with email</span>
                                </div>

                                <form onSubmit={handleSendOtp}>
                                    {/* Full Name */}
                                    <div className="arcadia-input-group">
                                        <div className="arcadia-input-icon">
                                            <FaRegUser />
                                        </div>
                                        <input
                                            type="text"
                                            className="arcadia-input"
                                            name="full_name"
                                            value={form.full_name}
                                            onChange={handleChange}
                                            placeholder="Full name"
                                            required
                                        />
                                    </div>

                                    {/* Email */}
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
                                            placeholder="Gmail address (@gmail.com)"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>

                                    {/* Phone Number */}
                                    <div className="arcadia-input-group">
                                        <div className="arcadia-input-icon">
                                            <FaPhone />
                                        </div>
                                        <input
                                            type="tel"
                                            className="arcadia-input"
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="10-digit mobile number (+91)"
                                            required
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
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Create a strong password"
                                            required
                                            autoComplete="new-password"
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

                                    {/* Submit Button */}
                                    <button type="submit" className="arcadia-btn-primary mt-3" disabled={loading}>
                                        {loading ? "Creating Account..." : "Create Account"}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <form onSubmit={handleVerifyAndRegister}>
                                <div className="text-center mb-2">
                                    <span className="badge px-3 py-2 rounded-pill" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#C084FC', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                                        <FaShieldAlt className="me-1" /> OTP Verification Code
                                    </span>
                                </div>

                                <div className="arcadia-otp-container" onPaste={handleOtpPaste}>
                                    {otpValues.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (inputRefs.current[index] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            className="arcadia-otp-box"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    className="arcadia-btn mt-4"
                                    disabled={loading || otpValues.join('').length !== 6}
                                >
                                    {loading ? "Verifying..." : "Complete Registration"}
                                </button>

                                <div className="d-flex justify-content-between align-items-center mt-3 pt-2">
                                    <button
                                        type="button"
                                        className="btn btn-link p-0 text-decoration-none"
                                        style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}
                                        onClick={() => setStep(1)}
                                    >
                                        ← Change Email
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-link p-0 text-decoration-none"
                                        style={{ color: '#C084FC', fontSize: '13px', fontWeight: 600 }}
                                        onClick={handleSendOtp}
                                        disabled={loading}
                                    >
                                        Resend Code
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
                            <Link to="/tracking" className="arcadia-social-btn" title="Live Public Tracking">
                                <FaGlobe />
                            </Link>

                            <a href="https://wa.me/" target="_blank" rel="noreferrer" className="arcadia-social-btn" title="WhatsApp Instant Support">
                                <FaWhatsapp />
                            </a>

                            <Link to="/driver/register" className="arcadia-social-btn" title="Apply as a Commuter Driver">
                                <FaTruck />
                            </Link>
                        </div>

                        {/* Footer */}
                        <p className="arcadia-footer">
                            Already on the network? <Link to="/login">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;