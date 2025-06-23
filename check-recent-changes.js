// Script para verificar cambios específicos en los últimos minutos
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verificarCambiosRecientes() {
  console.log('\n🕐 VERIFICANDO CAMBIOS RECIENTES EN FIREBASE');
  console.log('==========================================');
  
  try {
    const alumnosRef = collection(db, 'ALUMNOS');
    const snapshot = await getDocs(alumnosRef);
    
    console.log(`📊 Total de documentos: ${snapshot.size}`);
    
    // Buscar específicamente los estudiantes del CSV
    const estudiantesCSV = [
      'Geily Yosairy Diviche',
      'Rousse Angelina Martinez', 
      'Ana Giselle Taveras Fulgencia',
      'Jose Angel Lopez Matos',
      'Rebecca Jeanpierre'
    ];
    
    console.log('\n🔍 Verificando estudiantes específicos del CSV:');
    
    let encontrados = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      const nombre = data.nombre;
      
      if (nombre && estudiantesCSV.some(csvNombre => 
        nombre.toLowerCase().includes(csvNombre.toLowerCase()) ||
        csvNombre.toLowerCase().includes(nombre.toLowerCase())
      )) {
        encontrados++;
        console.log(`\n✅ ENCONTRADO: ${nombre}`);
        console.log(`   📞 Teléfono: ${data.telefono || 'No especificado'}`);
        console.log(`   🎂 Edad: ${data.edad || 'No especificado'}`);
        console.log(`   🎵 Instrumento: ${data.instrumento || 'No especificado'}`);
        console.log(`   👥 Grupos: ${JSON.stringify(data.grupos || {})}`);
        console.log(`   📅 Creado: ${data.fechaCreacion || 'No especificado'}`);
        console.log(`   🆔 ID: ${doc.id}`);
      }
    });
    
    console.log(`\n📈 RESUMEN:`);
    console.log(`   🎯 Estudiantes CSV verificados: ${estudiantesCSV.length}`);
    console.log(`   ✅ Estudiantes encontrados: ${encontrados}`);
    console.log(`   📊 Porcentaje de coincidencia: ${(encontrados/estudiantesCSV.length*100).toFixed(1)}%`);
    
    if (encontrados >= 3) {
      console.log('\n🎉 ¡MIGRACIÓN EXITOSA! Se encontraron estudiantes del CSV en Firebase');
    } else if (encontrados >= 1) {
      console.log('\n🔶 MIGRACIÓN PARCIAL: Se encontraron algunos estudiantes');
    } else {
      console.log('\n❌ NO SE DETECTÓ MIGRACIÓN: No se encontraron estudiantes del CSV');
    }
    
    // Mostrar algunos documentos aleatorios para verificar estructura
    console.log('\n📄 ESTRUCTURA DE DOCUMENTOS (muestra):');
    let count = 0;
    snapshot.forEach((doc) => {
      if (count < 3) {
        const data = doc.data();
        console.log(`\n${count + 1}. ${data.nombre || 'Sin nombre'}`);
        console.log(`   Campos disponibles: ${Object.keys(data).join(', ')}`);
        count++;
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verificarCambiosRecientes();
