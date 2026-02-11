import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initializeSampleData } from './firebase/initData';
import SignupPage from './page/signup';
import LoginPage from './page/login';
import AdminLogin from './page/AdminLogin';
import Navigation from './page/Navigation';
import AdminPanel from './page/AdminPanel';
import Landing from './page/Front'
import './App.css';
import Dashboard from './page/Dashboard';
import Import from "./page/import"
import Overview from "./page/overview"
import Documents from "./page/documents"
import Loan from "./page/loans"
import LoanDocumentsPage from './page/loandocuments';

function AppRoutes() {
  const { currentUser, userData } = useAuth();

  return (
    <>

      <Routes>
        {/* Public routes */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/" element={<Landing />} />
        <Route path="/loan-documents" element={<LoanDocumentsPage />} />
        <Route 
          path="/admin" 
          element={
            currentUser && userData?.role === 'super-admin' ? 
            <AdminPanel /> : 
            <Navigate to="/admin-login" replace />
          } 
        />
                <Route 
          path="/dashboard" 
          element={
            currentUser && userData?.role === 'user' ? 
            <Dashboard /> : 
            <Navigate to="/login" replace />
          } 
        />
                        <Route 
          path="/import" 
          element={
            currentUser && userData?.role === 'user' ? 
            <Import /> : 
            <Navigate to="/login" replace />
          } 
        />
                           <Route 
          path="/overview" 
          element={
            currentUser && userData?.role === 'user' ? 
            <Overview /> : 
            <Navigate to="/login" replace />
          } 
        />
                             <Route 
          path="/documents" 
          element={
            currentUser && userData?.role === 'user' ? 
            <Documents /> : 
            <Navigate to="/login" replace />
          } 
        />
                                 <Route 
          path="/loans" 
          element={
            currentUser && userData?.role === 'user' ? 
            <Loan /> : 
            <Navigate to="/login" replace />
          } 
        />
        
              </Routes>
    </>
  );
}

function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing BYNOPS Access System...');
        await initializeSampleData();
        console.log('✅ Initialization complete!');
      } catch (error) {
        console.error('❌ Initialization failed:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;