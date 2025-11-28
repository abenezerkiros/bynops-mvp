import React, { useState, useRef, useCallback, useEffect } from 'react';
import './ResizableSplitPanel.css';
import RightPanel from "./sidebar.jsx"
import LeftPanel from "./Chat.jsx"
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

// Main Dashboard Component with Firebase integration
const ExampleApp = () => {
  const { currentUser } = useAuth();
  const [propertyStatus, setPropertyStatus] = useState("Performing");
  const [loading, setLoading] = useState(false);

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
        } else {
          // Create initial property document
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

  // Handle status change and save to Firebase
  const handleStatusChange = async (newStatus) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      console.log('Updating status to:', newStatus);
      
      const propertyDocRef = doc(db, 'properties', currentUser.uid);
      
      await updateDoc(propertyDocRef, {
        status: newStatus,
        lastUpdated: new Date()
      });

      setPropertyStatus(newStatus);
      console.log('Status updated successfully in Firebase');
      
    } catch (error) {
      console.error('Error updating status in Firebase:', error);
      alert('Error updating status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <ResizableSplitPanel
        left={
          <RightPanel 
            status={propertyStatus}
            onStatusChange={handleStatusChange}
            loading={loading}
          />
        }
        right={
          <LeftPanel status={propertyStatus} />
        }
      />
    </div>
  );
};

export default ExampleApp;
export { ExampleApp };