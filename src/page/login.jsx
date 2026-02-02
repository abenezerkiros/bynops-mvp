import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./signup.css";
import logo from "../assets/BynopsLogo.png";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, resetPassword } = useAuth();
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
      navigate('/front');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      return setError('Please enter your email first');
    }

    try {
      await resetPassword(formData.email);
      setError('Password reset email sent! Check your inbox.');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="signup-container">
      {/* Left Section */}
      <div className="signup-left">
        <div className="signup-overlay"></div>
        <div className="signup-left-content">
          <h1>
            Welcome Back to <br /> BYNOPS
          </h1>
          <p>Continue your journey with structured understanding</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="signup-right">
        <div className="signup-box">
          <div className="signup-logo">
            <img src={logo} alt="BYNOPS" />
          </div>
          <h2>User Login</h2>
          <p>Sign in to your account</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input 
              type="email" 
              name="email"
              placeholder="your@company.com" 
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
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-links">
 
            <p>
              Don't have an account? <Link to="/signup" className="text-link">Sign Up</Link>
            </p>
            <p>
              Admin access? <Link to="/admin-login" className="text-link">Admin Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}