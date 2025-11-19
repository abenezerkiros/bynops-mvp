import React from 'react';
import { useAuth } from '../context/AuthContext';
import './dashboard.css';

export default function Dashboard() {
  const { currentUser, userData } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome to BYNOPS Dashboard</h1>
        <p>Turning Knowledge Into Structured Understanding</p>
      </div>
      
      <div className="dashboard-content">
        <div className="user-welcome">
          <h2>Hello, {userData?.fullName || 'User'}!</h2>
          <div className="user-info-card">
            <div className="info-item">
              <strong>Email:</strong> {userData?.email}
            </div>
            <div className="info-item">
              <strong>Company:</strong> {userData?.companyName}
            </div>
            <div className="info-item">
              <strong>Role:</strong> <span className={`role-badge ${userData?.role}`}>{userData?.role}</span>
            </div>
            <div className="info-item">
              <strong>Status:</strong> <span className={`status-badge ${userData?.status}`}>{userData?.status}</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard-features">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Data Analytics</h3>
            <p>Access comprehensive data insights and analytics tools to make informed decisions.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Reports</h3>
            <p>Generate and view detailed reports and summaries of your data and performance.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Manage your account preferences, security settings, and notification preferences.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Team Collaboration</h3>
            <p>Collaborate with your team members and share insights across your organization.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Security</h3>
            <p>Manage your security settings, two-factor authentication, and access controls.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Knowledge Base</h3>
            <p>Access documentation, tutorials, and resources to help you get the most from BYNOPS.</p>
          </div>
        </div>

        <div className="quick-stats">
          <h3>Quick Overview</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">Projects</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">Reports</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">Team Members</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">Active Tasks</div>
            </div>
          </div>
        </div>

        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-placeholder">
            <p>No recent activity to display</p>
            <small>Your recent actions and updates will appear here</small>
          </div>
        </div>
      </div>
    </div>
  );
}