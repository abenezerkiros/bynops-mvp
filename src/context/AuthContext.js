import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updatePassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allowedDomains, setAllowedDomains] = useState([]);

  const adminEmails = ['admin@yourcompany.com'];

  // Fetch allowed domains from Firestore companies collection
  useEffect(() => {
    const fetchAllowedDomains = async () => {
      try {
        const companiesSnapshot = await getDocs(collection(db, 'companies'));
        const domains = companiesSnapshot.docs
          .map(doc => doc.data().domain)
          .filter(domain => domain); // Remove any undefined/null domains
        
        setAllowedDomains(domains);
        console.log('Loaded domains from Firestore:', domains);
      } catch (error) {
        console.error('Error loading domains:', error);
        // Fallback to empty array if there's an error
        setAllowedDomains([]);
      }
    };

    fetchAllowedDomains();
  }, []);

  async function signup(email, password, fullName, companyName) {
    const domain = email.split('@')[1];
    
    if (!allowedDomains.includes(domain)) {
      throw new Error(`Company not found`);
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const role = adminEmails.includes(email) ? 'admin' : 'user';

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      fullName,
      companyName,
      domain,
      role: role,
      status: role === 'admin' ? 'active' : 'pending',
      createdAt: new Date(),
      lastPasswordUpdate: new Date(),
      seatAssigned: role === 'admin',
      isAdmin: role === 'admin'
    });

    if (role === 'user') {
      await sendEmailVerification(user);
    }
    
    return userCredential;
  }

  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error('User account not found');
    }

    const userData = userDoc.data();
    
    if (userData.role !== 'admin' && userData.status !== 'active') {
      await signOut(auth);
      throw new Error('Account pending approval or suspended');
    }

    return userCredential;
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function logout() {
    return signOut(auth);
  }

  async function updateUserPassword(newPassword) {
    const user = auth.currentUser;
    await updatePassword(user, newPassword);
    await updateDoc(doc(db, 'users', user.uid), {
      lastPasswordUpdate: new Date()
    });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    signup,
    login,
    logout,
    resetPassword,
    updateUserPassword,
    allowedDomains,
    adminEmails
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}