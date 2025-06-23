// Script simple para verificar Firebase
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

config();

console.log('🔧 Verificando variables de entorno...');
console.log('PROJECT_ID:', process.env.VITE_FIREBASE_PROJECT_ID);

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('🚀 Inicializando Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('📡 Conectando a Firestore...');

try {
  const alumnosRef = collection(db, 'ALUMNOS');
  const snapshot = await getDocs(alumnosRef);
  
  console.log(`✅ CONEXIÓN EXITOSA`);
  console.log(`📊 Total de documentos en ALUMNOS: ${snapshot.size}`);
  
  if (snapshot.size > 0) {
    console.log('\n📄 Primeros 3 documentos:');
    let count = 0;
    snapshot.forEach((doc) => {
      if (count < 3) {
        const data = doc.data();
        console.log(`${count + 1}. ${data.nombre || 'Sin nombre'} - ID: ${doc.id}`);
        count++;
      }
    });
  } else {
    console.log('⚠️ La colección ALUMNOS está vacía');
  }
  
} catch (error) {
  console.error('❌ Error de conexión:', error.message);
}
