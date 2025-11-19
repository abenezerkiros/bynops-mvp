import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './signup.css';

export default function Navigation() {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/" className="brand-link">
          <span className="brand-text">BYNOPS</span>
        </Link>
      </div>
      
      <div className="nav-links">
        {currentUser ? (
          <>
            {userData?.role === 'admin' && (
              <Link to="/admin" className="nav-link admin-link">Admin Panel</Link>
            )}
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <div className="user-menu">
              <span className="user-info">
                {userData?.fullName} ({userData?.role})
              </span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">User Login</Link>
            <Link to="/signup" className="nav-link">Sign Up</Link>
            <Link to="/admin-login" className="nav-link admin-link">Admin Login</Link>
          </>
        )}
      </div>
    </nav>
  );
}