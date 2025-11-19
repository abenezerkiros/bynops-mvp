import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "./signup.css";
import logo from "../assets/BynopsLogo.png";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { signup, allowedDomains } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    const domain = formData.email.split('@')[1];
    console.log(allowedDomains)
    if (!allowedDomains.includes(domain)) {
      return setError(`Registration only allowed with approved company email domains. Please use an email from your company's registered domain.`);
    }

    try {
      setLoading(true);
      await signup(formData.email, formData.password, formData.fullName, formData.companyName);
      setMessage('Registration successful! Your account is pending admin approval.');
      setFormData({
        fullName: '',
        email: '',
        companyName: '',
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {/* Left Section */}
      <div className="signup-left">
        <div className="signup-overlay"></div>
        <div className="signup-left-content">
          <h1>
            From Scattered Data to <br /> Decisive Direction
          </h1>
          <p>Turning Knowledge Into Structured Understanding</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="signup-right">
        <div className="signup-box">
          <div className="signup-logo">
            <img src={logo} alt="BYNOPS" />
          </div>
          <h2>Create Your Account</h2>
          <p>Join us and start your journey today.</p>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <form onSubmit={handleSubmit}>
            <label>Full Name</label>
            <input 
              type="text" 
              name="fullName"
              placeholder="Brad Smith" 
              value={formData.fullName}
              onChange={handleChange}
              required
            />

            <label>Company Name</label>
            <input 
              type="text" 
              name="companyName"
              placeholder="ABC Company" 
              value={formData.companyName}
              onChange={handleChange}
              required
            />

            <label>Email</label>
            <input 
              type="email" 
              name="email"
              placeholder="brad@yourcompany.com" 
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

            <label>Confirm Password</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button 
                type="button" 
                className="eye-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            <button 
              type="submit" 
              className="signup-btn" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          <p>
              Already have an account? <Link to="/login" className="text-link">Login In</Link>
            </p>
        </div>
      </div>
    </div>
  );
}