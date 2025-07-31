import React, { useState } from "react";
import axios from "axios";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${baseUrl}/auth/login`, formData);
      const token = res.data.token;

      // Save token to localStorage or context
      localStorage.setItem("token", token);

      setMessage("Login successful!");
      // Navigate or redirect if needed
    } catch (error) {
      console.error(error);
      setMessage("Login failed. Please check your credentials.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: 10, width: "100%" }}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: 10, width: "100%" }}
        />
        <button type="submit" style={{ width: "100%" }}>
          Login
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default LoginPage;
