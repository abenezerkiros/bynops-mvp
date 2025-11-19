import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { auth, db } from './config';

export async function createInitialAdmin() {
  const adminEmail = 'admin@yourcompany.com';
  const adminPassword = 'Admin123!'; // Change after first login
  
  try {
    // Check if admin already exists
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const existingAdmin = usersSnapshot.docs.find(doc => 
      doc.data().email === adminEmail
    );
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      return;
    }

    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    // Create user document
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: adminEmail,
      fullName: 'System Administrator',
      companyName: 'BYNOPS',
      domain: 'yourcompany.com',
      role: 'super-admin',
      status: 'active',
      createdAt: new Date(),
      lastPasswordUpdate: new Date(),
      seatAssigned: true,
      isAdmin: true
    });
    
    console.log('✅ Initial admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Temporary Password:', adminPassword);
    console.log('⚠️  IMPORTANT: Change password after first login!');
    
    return userCredential;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Admin user already exists in Authentication');
    } else {
      console.error('❌ Error creating admin user:', error);
    }
  }
}