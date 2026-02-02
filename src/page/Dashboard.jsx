import React, { useState, useRef, useCallback, useEffect } from 'react';
import './ResizableSplitPanel.css';
import RightPanel from "./sidebar.jsx";
import LeftPanel from "./Chat.jsx";
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ResizableSplitPanel = ({ left, right }) => {
  const [leftWidth, setLeftWidth] = useState(33.33);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const MIN_WIDTH = 33.33;
  const MAX_WIDTH = 80;

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent) => {
    if (isResizing && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = mouseMoveEvent.clientX - containerRect.left;
      const newWidth = (mouseX / containerWidth) * 100;

      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setLeftWidth(newWidth);
      } else if (newWidth < MIN_WIDTH) {
        setLeftWidth(MIN_WIDTH);
      } else if (newWidth > MAX_WIDTH) {
        setLeftWidth(MAX_WIDTH);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);

      return () => {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResizing);
      };
    }
  }, [isResizing, resize, stopResizing]);

  return (
    <div ref={containerRef} className="split-panel-container">
      <div 
        className="left-panel"
        style={{ width: `${leftWidth}%` }}
      >
        {left}
      </div>
      
      <div 
        className="divider"
        onMouseDown={startResizing}
      />
      
      <div 
        className="right-panel"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {right}
      </div>
    </div>
  );
};

const ExampleApp = () => {
  const { currentUser } = useAuth();
  const [propertyStatus, setPropertyStatus] = useState("Performing");
  const [loading, setLoading] = useState(false);
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Load property data from Firebase
  useEffect(() => {
    const loadPropertyData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const propertyDocRef = doc(db, 'properties', currentUser.uid);
        const propertyDoc = await getDoc(propertyDocRef);
        
        if (propertyDoc.exists()) {
          const data = propertyDoc.data();
          if (data.status) {
            setPropertyStatus(data.status);
          }
          if (data.selectedLoan) {
            setSelectedLoan(data.selectedLoan);
          }
        } else {
          await setDoc(propertyDocRef, {
            status: 'Performing',
            lastUpdated: new Date(),
            userId: currentUser.uid,
            userEmail: currentUser.email,
            createdAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error loading property data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPropertyData();
  }, [currentUser]);

  // Load loans from localStorage
  useEffect(() => {
    const loadLoans = () => {
      try {
        const raw = localStorage.getItem("bynops_loans");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setLoans(parsed);
          }
        }
      } catch (error) {
        console.error("Error loading loans:", error);
      }
    };

    loadLoans();
    
    const handleStorageChange = (e) => {
      if (e.key === "bynops_loans") {
        loadLoans();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Check URL for loan parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loanFromUrl = urlParams.get('loan');
    
    if (loanFromUrl) {
      handleSelectLoan(loanFromUrl);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  // Handle status change and save to Firebase
  const handleStatusChange = async (newStatus) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const propertyDocRef = doc(db, 'properties', currentUser.uid);
      
      await updateDoc(propertyDocRef, {
        status: newStatus,
        lastUpdated: new Date()
      });

      setPropertyStatus(newStatus);
    } catch (error) {
      console.error('Error updating status in Firebase:', error);
      alert('Error updating status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle loan selection
  const handleSelectLoan = async (loanId) => {
    if (!currentUser) return;
    
    try {
      setSelectedLoan(loanId);
      
      const propertyDocRef = doc(db, 'properties', currentUser.uid);
      await updateDoc(propertyDocRef, {
        selectedLoan: loanId,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error saving selected loan:', error);
    }
  };

  // Get selected loan details
  const getSelectedLoanDetails = () => {
    if (!selectedLoan) return null;
    return loans.find(loan => 
      loan.id === selectedLoan || 
      loan.loanNumber === selectedLoan
    );
  };

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <ResizableSplitPanel
        left={
          <RightPanel 
            status={propertyStatus}
            onStatusChange={handleStatusChange}
            loading={loading}
            loans={loans}
            selectedLoan={selectedLoan}
            onSelectLoan={handleSelectLoan}
            selectedLoanDetails={getSelectedLoanDetails()}
          />
        }
        right={
          <LeftPanel 
            status={propertyStatus} 
            loans={loans}
            selectedLoan={selectedLoan}
            selectedLoanDetails={getSelectedLoanDetails()}
          />
        }
      />
    </div>
  );
};

export default ExampleApp;