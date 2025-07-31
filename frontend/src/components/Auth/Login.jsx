import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { useWallet } from "../../context/walletContext";
import "./Login.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { requestOtp, verifyOtp } = useAuth();
  const { resetWallet } = useWallet();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); 

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (step === 1) {
      setFormData({ ...formData, [name]: value });
    } else {
      setOtp(value);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const msg = await requestOtp(formData.email, formData.password);
      setMessage(msg);
      setMessageType("success");
      setStep(2);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Failed to send OTP");
      setMessageType("error");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await verifyOtp(formData.email, otp);
      resetWallet();
      setMessage("Login successful!");
      setMessageType("success");
      navigate("/home");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "OTP verification failed");
      setMessageType("error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="blockchain-accent"></div>

        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Access your cross-chain swap platform</p>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="login-form">
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <button type="submit" className="login-button">
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="login-form">
            <div className="input-group">
              <input
                type="text"
                name="otp"
                placeholder="Enter OTP"
                value={otp}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <button type="submit" className="login-button">
              Verify OTP & Sign In
            </button>
          </form>
        )}

        {message && <div className={`message ${messageType}`}>{message}</div>}
      </div>
    </div>
  );
};

export default LoginPage;
