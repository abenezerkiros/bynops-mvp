// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCgY_3ajsyrrF2EjAVGEti7DBRi3DkDSxg",
  authDomain: "bynops-931c3.firebaseapp.com",
  projectId: "bynops-931c3",
  storageBucket: "bynops-931c3.firebasestorage.app",
  messagingSenderId: "419192008285",
  appId: "1:419192008285:web:2ada50b8e9e3fac8e7a7b4",
  measurementId: "G-Q8DDQV8B8P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;