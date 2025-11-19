import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./signup.css";
import logo from "../assets/BynopsLogo.png";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await login(formData.email, formData.password);
      navigate('/admin');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {/* Left Section - Same as signup */}
      <div className="signup-left">
        <div className="signup-overlay"></div>
        <div className="signup-left-content">
          <h1>
            Admin Portal <br /> Secure Access
          </h1>
          <p>System Administration & Management</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="signup-right">
        <div className="signup-box">
          <div className="signup-logo">
            <img src={logo} alt="BYNOPS" />
          </div>
          <h2>Admin Login</h2>
          <p>Restricted access - authorized personnel only</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label>Admin Email</label>
            <input 
              type="email" 
              name="email"
              placeholder="admin@yourcompany.com" 
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button 
                type="button" 
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            <button 
              type="submit" 
              className="signup-btn" 
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Admin Login'}
            </button>
          </form>

          <div className="auth-links">
            <p>
              Regular user? <Link to="/login" className="text-link">User Login</Link>
            </p>
            <p>
              <Link to="/signup" className="text-link">← Back to Home</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}