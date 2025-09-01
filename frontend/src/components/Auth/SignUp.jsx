import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/authContext";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css"; // Import the CSS file

const SignupPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/signup`, form);
      setMessage("Account created successfully! Redirecting to login...");
      setMessageType("success");
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error) {
        setMessage(`${err.response.data.error}`);
      } else {
        setMessage("Signup failed. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Simple password strength checker
  const getPasswordStrength = (password) => {
    if (password.length < 6) return null;
    if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])/.test(password)) return 'weak';
    if (password.length < 10 || !/(?=.*\d)/.test(password)) return 'medium';
    return 'strong';
  };

  const passwordStrength = getPasswordStrength(form.password);

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="blockchain-accent"></div>
        
        <h2 className="signup-title">Create Account</h2>
        <p className="signup-subtitle">Join the future of cross-chain swapping</p>
        
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              name="username"
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              required
              className="form-input"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
              className="form-input"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              required
              className="form-input"
              disabled={isLoading}
            />
            {passwordStrength && (
              <div className={`password-strength ${passwordStrength}`}>
                Password strength: {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="signup-button"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="signup-footer">
          <span className="signup-link">Already have an account? </span>
          <Link to="/login" className="signup-link-accent">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;