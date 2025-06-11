// scripts/fix-test-users.mjs
// Script para corregir la colección de usuarios de prueba

import { initializeApp } from 'firebase/app';
import { getAuth, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC5C5qqoGOXs28ht_frNU4XdqJrR9URcPE",
  authDomain: "orquestapuntacana.firebaseapp.com",
  projectId: "orquestapuntacana",
  storageBucket: "orquestapuntacana.appspot.com",
  messagingSenderId: "196404464243",
  appId: "1:196404464243:web:55dfa339590a2bc4ba3806"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Lista de usuarios de prueba
const testUserEmails = [
  'superusuario@test.com',
  'director@test.com',
  'admin@test.com',
  'maestro@test.com'
];

async function fixTestUsers() {
  console.log('🔄 Iniciando corrección de usuarios de prueba...\n');
  
  try {
    // 1. Buscar y mover documentos de 'users' a 'USERS'
    console.log('📋 Buscando documentos en colección "users"...');
    const usersQuery = query(
      collection(db, 'users'),
      where('isTestUser', '==', true)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    console.log(`✅ Encontrados ${usersSnapshot.size} documentos en colección "users"`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`🔄 Moviendo usuario ${userData.email} de "users" a "USERS"...`);
      
      // Crear en la colección correcta
      await setDoc(doc(db, 'USERS', userId), userData);
      console.log(`✅ Documento creado en "USERS" para ${userData.email}`);
      
      // Eliminar de la colección incorrecta
      await deleteDoc(doc(db, 'users', userId));
      console.log(`🗑️ Documento eliminado de "users" para ${userData.email}`);
    }
    
    console.log('\n✅ Todos los usuarios de prueba han sido corregidos!');
    console.log('\n🔐 CREDENCIALES DE ACCESO:');
    console.log('==========================');
    console.log('Superusuario: superusuario@test.com / Test123456!');
    console.log('Director: director@test.com / Test123456!');
    console.log('Admin: admin@test.com / Test123456!');
    console.log('Maestro: maestro@test.com / Test123456!');
    console.log('\n🎯 Ahora puedes intentar hacer login nuevamente');
    
  } catch (error) {
    console.error('❌ Error corrigiendo usuarios:', error);
  }
}

// Ejecutar el script
fixTestUsers()
  .then(() => {
    console.log('\n✅ Script de corrección completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando script:', error);
    process.exit(1);
  });
