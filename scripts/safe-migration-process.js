/**
 * Script de migración completa y segura de estudiantes
 * 1. Crea backup de ALUMNOS
 * 2. Analiza datos del CSV
 * 3. Opcionalmente ejecuta la migración
 */

import { backupAlumnosCollection } from './backup-alumnos.js';
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_APP_API_KEY,
  authDomain: process.env.VITE_APP_AUTH_DOMAIN,
  projectId: process.env.VITE_APP_PROJECT_ID,
  storageBucket: process.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Ejecuta el proceso completo de migración segura
 */
async function safeMigrationProcess() {
  console.log('🚀 INICIANDO PROCESO DE MIGRACIÓN SEGURA');
  console.log('=' * 50);
  
  try {
    // PASO 1: Crear backup
    console.log('\n📋 PASO 1: Creando backup de seguridad...');
    const backupResult = await backupAlumnosCollection();
    
    if (!backupResult.success) {
      console.error('❌ Error creando backup. Abortando migración.');
      return { success: false, step: 'backup', error: backupResult.error };
    }
    
    console.log('✅ Backup creado exitosamente');
    console.log(`📁 Archivo: ${backupResult.filePath}`);
    console.log(`📊 ${backupResult.documentCount} documentos respaldados`);
    
    // PASO 2: Verificar archivo CSV
    console.log('\n📋 PASO 2: Verificando archivo CSV...');
    const csvPath = path.join(process.cwd(), 'INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ Archivo CSV no encontrado:', csvPath);
      return { success: false, step: 'csv-verification', error: 'CSV file not found' };
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvLines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    console.log('✅ Archivo CSV encontrado');
    console.log(`📄 ${csvLines.length - 1} registros de estudiantes en CSV`);
    
    // PASO 3: Análisis de datos
    console.log('\n📋 PASO 3: Analizando coincidencias...');
    
    // Obtener datos de Firestore
    const alumnosRef = collection(db, 'alumnos');
    const firestoreSnapshot = await getDocs(alumnosRef);
    
    console.log(`🔥 ${firestoreSnapshot.size} estudiantes en Firestore`);
    
    // Análisis básico de coincidencias
    let exactMatches = 0;
    let partialMatches = 0;
    let noMatches = 0;
    
    // Crear mapa de estudiantes de Firestore
    const firestoreStudents = new Map();
    firestoreSnapshot.forEach(doc => {
      const data = doc.data();
      firestoreStudents.set(doc.id, {
        id: doc.id,
        nombre: data.nombre || '',
        instrumento: data.instrumento || '',
        ...data
      });
    });
    
    // Procesar header del CSV
    const header = csvLines[0].split(',');
    
    // Analizar cada línea del CSV
    for (let i = 1; i < csvLines.length; i++) {
      const csvData = csvLines[i].split(',');
      const nombreCSV = csvData[1]?.trim() || '';
      
      if (!nombreCSV) continue;
      
      // Buscar coincidencias exactas
      let found = false;
      for (const [id, student] of firestoreStudents) {
        if (student.nombre.toLowerCase() === nombreCSV.toLowerCase()) {
          exactMatches++;
          found = true;
          break;
        }
      }
      
      if (!found) {
        // Buscar coincidencias parciales
        for (const [id, student] of firestoreStudents) {
          const nombreFirestore = student.nombre.toLowerCase();
          const nombreCSVLower = nombreCSV.toLowerCase();
          
          const wordsCSV = nombreCSVLower.split(' ').filter(w => w.length > 2);
          const wordsFirestore = nombreFirestore.split(' ').filter(w => w.length > 2);
          
          let commonWords = 0;
          for (const wordCSV of wordsCSV) {
            for (const wordFirestore of wordsFirestore) {
              if (wordCSV.includes(wordFirestore) || wordFirestore.includes(wordCSV)) {
                commonWords++;
                break;
              }
            }
          }
          
          if (commonWords >= 2) {
            partialMatches++;
            found = true;
            break;
          }
        }
      }
      
      if (!found) {
        noMatches++;
      }
    }
    
    // PASO 4: Mostrar resultados del análisis
    console.log('\n📊 RESULTADOS DEL ANÁLISIS:');
    console.log('=' * 40);
    console.log(`✅ Coincidencias exactas: ${exactMatches}`);
    console.log(`🔶 Coincidencias parciales: ${partialMatches}`);
    console.log(`❓ Sin coincidencias: ${noMatches}`);
    console.log(`📊 Total CSV: ${csvLines.length - 1}`);
    console.log(`🔥 Total Firestore: ${firestoreSnapshot.size}`);
    
    const matchPercentage = ((exactMatches + partialMatches) / (csvLines.length - 1) * 100).toFixed(1);
    console.log(`📈 Porcentaje de coincidencias: ${matchPercentage}%`);
    
    // PASO 5: Recomendaciones
    console.log('\n🎯 RECOMENDACIONES:');
    console.log('=' * 40);
    
    if (matchPercentage > 80) {
      console.log('✅ Excelente nivel de coincidencias. Seguro proceder.');
    } else if (matchPercentage > 60) {
      console.log('🔶 Nivel aceptable de coincidencias. Revisar casos no coincidentes.');
    } else {
      console.log('⚠️ Bajo nivel de coincidencias. Revisar datos antes de continuar.');
    }
    
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. Revisar el análisis detallado: npm run migrate:analyze-csv');
    console.log('2. Si está conforme, ejecutar: npm run migrate:students-csv');
    console.log(`3. En caso de problemas, restaurar desde: ${backupResult.filePath}`);
    
    return {
      success: true,
      backup: backupResult,
      analysis: {
        exactMatches,
        partialMatches,
        noMatches,
        totalCSV: csvLines.length - 1,
        totalFirestore: firestoreSnapshot.size,
        matchPercentage: parseFloat(matchPercentage)
      }
    };
    
  } catch (error) {
    console.error('💥 Error en el proceso de migración:', error);
    return { success: false, error: error.message };
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  safeMigrationProcess().then(result => {
    if (result.success) {
      console.log('\n🎉 Proceso de análisis completado exitosamente');
      console.log('📁 Backup seguro creado');
      console.log('📊 Análisis de datos completado');
    } else {
      console.error(`\n❌ Error en ${result.step || 'proceso'}: ${result.error}`);
      process.exit(1);
    }
  });
}

export { safeMigrationProcess };
