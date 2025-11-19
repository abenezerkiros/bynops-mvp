import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './config';

export async function initializeSampleData() {
  try {
    console.log('🔄 Initializing sample data...');
    
    // Create companies collection
    const companies = [
      { name: 'Company One Inc.', domain: 'company1.com', seatLimit: 50 },
      { name: 'Company Two Ltd.', domain: 'company2.com', seatLimit: 25 },
      { name: 'Your Company', domain: 'yourcompany.com', seatLimit: 100 }
    ];
    
    for (const company of companies) {
      const companyId = company.domain.replace('.', '-');
      const companyRef = doc(db, 'companies', companyId);
      const companySnap = await getDoc(companyRef);
      
      if (!companySnap.exists()) {
        await setDoc(companyRef, {
          ...company,
          createdAt: new Date(),
          active: true
        });
        console.log(`✅ Created company: ${company.name}`);
      }
    }
    
    console.log('🎉 Sample data initialization completed!');
  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
  }
}