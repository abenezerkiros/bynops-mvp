import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import './admin.css';

// Admin Dashboard Component
// Admin Dashboard Component
function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    domain: '',
    seatLimit: 10
  });
  const { userData } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadCompanies()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      updateStats(usersData, companies);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesData = companiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(companiesData);
      updateStats(users, companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const updateStats = (usersData, companiesData) => {
    const totalUsers = usersData.length;
    const pendingUsers = usersData.filter(u => u.status === 'pending').length;
    const activeUsers = usersData.filter(u => u.status === 'active').length;
    const totalCompanies = companiesData.length;
    
    setStats({
      totalUsers,
      pendingUsers,
      activeUsers,
      totalCompanies
    });
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status });
      await loadData();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const addNewCompany = async (e) => {
    e.preventDefault();
    try {
      // Validate domain format
      const domain = newCompany.domain.toLowerCase().trim();
      if (!domain.includes('.')) {
        alert('Please enter a valid domain (e.g., company.com)');
        return;
      }

      // Check if company already exists
      const existingCompany = companies.find(c => c.domain === domain);
      if (existingCompany) {
        alert('A company with this domain already exists');
        return;
      }

      // Create company document
      await addDoc(collection(db, 'companies'), {
        name: newCompany.name.trim(),
        domain: domain,
        seatLimit: parseInt(newCompany.seatLimit),
        createdAt: new Date(),
        active: true
      });

      // Reset form and reload data
      setNewCompany({ name: '', domain: '', seatLimit: 10 });
      setShowAddCompany(false);
      await loadCompanies();
      
      alert('Company added successfully!');
    } catch (error) {
      console.error('Error adding company:', error);
      alert('Error adding company: ' + error.message);
    }
  };

  const toggleCompanyStatus = async (companyId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'companies', companyId), {
        active: !currentStatus
      });
      await loadCompanies();
    } catch (error) {
      console.error('Error updating company status:', error);
    }
  };

  const deleteCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company? This will prevent new signups from this domain.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'companies', companyId));
      await loadCompanies();
      alert('Company deleted successfully!');
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Error deleting company: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading">Loading admin data...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div className="admin-welcome">
          Welcome, {userData?.fullName} ({userData?.role})
        </div>
        <button onClick={loadData} className="refresh-btn">
          Refresh Data
        </button>
      </div>
      
      <div className="admin-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          User Management ({users.length})
        </button>
        <button 
          className={activeTab === 'companies' ? 'active' : ''}
          onClick={() => setActiveTab('companies')}
        >
          Companies ({companies.length})
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="admin-stats">
            <div className="stat-card">
              <h3>Total Users</h3>
              <p>{users.length || 0}</p>
              <small>{users.length} loaded</small>
            </div>
            <div className="stat-card">
              <h3>Pending Approval</h3>
              <p>{stats.pendingUsers || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Active Users</h3>
              <p>{stats.activeUsers || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Companies</h3>
              <p>{stats.totalCompanies || 0}</p>
              <small>{companies.length} loaded</small>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>User Management</h2>
            <div className="user-filters">
              <button onClick={() => loadData()}>All Users ({users.length})</button>
              <button onClick={() => {}}>Pending ({users.filter(u => u.status === 'pending').length})</button>
              <button onClick={() => {}}>Active ({users.filter(u => u.status === 'active').length})</button>
            </div>
          </div>

          <div className="users-grid">
            {users.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  <h4>{user.fullName}</h4>
                  <p>{user.email}</p>
                  <p>Company: {user.companyName}</p>
                  <p>Role: <span className={`role ${user.role}`}>{user.role}</span></p>
                  <p>Status: <span className={`status ${user.status}`}>{user.status}</span></p>
                  <p>Seat: {user.seatAssigned ? 'Assigned' : 'Not Assigned'}</p>
                  <p>Joined: {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</p>
                </div>
                <div className="user-actions">
                  {user.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => updateUserStatus(user.id, 'active')}
                        className="btn-approve"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => updateUserStatus(user.id, 'suspended')}
                        className="btn-suspend"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {user.status === 'active' && (
                    <button 
                      onClick={() => updateUserStatus(user.id, 'suspended')}
                      className="btn-suspend"
                    >
                      Suspend
                    </button>
                  )}
                  {user.status === 'suspended' && (
                    <button 
                      onClick={() => updateUserStatus(user.id, 'active')}
                      className="btn-activate"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <div className="no-data">
              <p>No users found in the database.</p>
              <button onClick={loadData}>Refresh</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'companies' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Company Management</h2>
            <button 
              onClick={() => setShowAddCompany(true)}
              className="btn-add-company"
            >
              + Add New Company
            </button>
          </div>

          {/* Add Company Form */}
          {showAddCompany && (
            <div className="add-company-form">
              <h3>Add New Company</h3>
              <form onSubmit={addNewCompany}>
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Domain</label>
                  <input
                    type="text"
                    value={newCompany.domain}
                    onChange={(e) => setNewCompany({...newCompany, domain: e.target.value})}
                    placeholder="company.com"
                    required
                  />
                  <small>Users can sign up with emails from this domain</small>
                </div>
                <div className="form-group">
                  <label>Seat Limit</label>
                  <input
                    type="number"
                    value={newCompany.seatLimit}
                    onChange={(e) => setNewCompany({...newCompany, seatLimit: e.target.value})}
                    min="1"
                    max="1000"
                    required
                  />
                  <small>Maximum number of users allowed from this company</small>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    Add Company
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddCompany(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Companies List */}
          <div className="companies-grid">
            {companies.map(company => {
              const companyUsers = users.filter(u => u.domain === company.domain);
              const assignedSeats = companyUsers.filter(u => u.seatAssigned).length;
              const availableSeats = company.seatLimit - assignedSeats;
              
              return (
                <div key={company.id} className={`company-card ${company.active ? '' : 'inactive'}`}>
                  <div className="company-header">
                    <h4>{company.name}</h4>
                    <span className={`company-status ${company.active ? 'active' : 'inactive'}`}>
                      {company.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="company-info">
                    <p><strong>Domain:</strong> {company.domain}</p>
                    <p><strong>Seats:</strong> {assignedSeats} / {company.seatLimit}</p>
                    <p><strong>Available:</strong> {availableSeats} seats</p>
                    <p><strong>Created:</strong> {company.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</p>
                  </div>
                  <div className="company-actions">
                    <button 
                      onClick={() => toggleCompanyStatus(company.id, company.active)}
                      className={company.active ? 'btn-suspend' : 'btn-activate'}
                    >
                      {company.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => deleteCompany(company.id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {companies.length === 0 && (
            <div className="no-data">
              <p>No companies found. Add your first company to allow user registrations.</p>
              <button onClick={() => setShowAddCompany(true)} className="btn-primary">
                Add First Company
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main AdminPanel component with routing
// Main AdminPanel component with routing
export default function AdminPanel() {
  const { userData } = useAuth();
  const location = useLocation();

  if (userData?.role !== 'super-admin') {
    return <Navigate to="/admin-login" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="*" element={<AdminDashboard />} />
    </Routes>
  );
}