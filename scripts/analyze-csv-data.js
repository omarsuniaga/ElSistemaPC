/**
 * Script de análisis previo a la migración de estudiantes
 * Analiza el CSV y compara con los datos existentes en Firestore
 */

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

// Configuración de Firebase (usar variables de entorno)
const firebaseConfig = {
  apiKey: process.env.VITE_APP_API_KEY,
  authDomain: process.env.VITE_APP_AUTH_DOMAIN,
  projectId: process.env.VITE_APP_PROJECT_ID,
  storageBucket: process.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Parsea una línea CSV
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Encuentra similitudes entre nombres
 */
function findNameSimilarity(csvName, firestoreName) {
  const csvWords = csvName
    .toLowerCase()
    .split(' ')
    .filter((w) => w.length > 2);
  const firestoreWords = firestoreName
    .toLowerCase()
    .split(' ')
    .filter((w) => w.length > 2);

  let matches = 0;
  for (const csvWord of csvWords) {
    for (const firestoreWord of firestoreWords) {
      if (csvWord.includes(firestoreWord) || firestoreWord.includes(csvWord)) {
        matches++;
        break;
      }
    }
  }

  return matches / Math.max(csvWords.length, firestoreWords.length);
}

/**
 * Analiza los datos del CSV vs Firestore
 */
async function analyzeCSVData() {
  console.log('🔍 Analizando datos del CSV vs Firestore...');

  try {
    // Leer CSV
    const csvPath = path.join(process.cwd(), 'INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv');

    if (!fs.existsSync(csvPath)) {
      console.error('❌ Archivo CSV no encontrado en:', csvPath);
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter((line) => line.trim() !== '');

    console.log(`📄 CSV: ${lines.length - 1} estudiantes encontrados`);

    // Obtener todos los estudiantes de Firestore
    const alumnosRef = collection(db, 'alumnos');
    const snapshot = await getDocs(alumnosRef);
    const firestoreStudents = [];

    snapshot.forEach((doc) => {
      firestoreStudents.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`🔥 Firestore: ${firestoreStudents.length} estudiantes encontrados`);

    // Analizar cada estudiante del CSV
    const analysis = {
      exactMatches: [],
      partialMatches: [],
      noMatches: [],
      csvOnlyStudents: [],
      firestoreOnlyStudents: [...firestoreStudents],
    };

    // Procesar header
    const header = parseCSVLine(lines[0]);

    for (let i = 1; i < lines.length; i++) {
      const data = parseCSVLine(lines[i]);

      const csvStudent = {
        contador: data[0],
        nombre: data[1]?.trim() || '',
        inscripcion: data[2]?.trim() || '',
        nac: data[3]?.trim() || '',
        instrumento: data[4]?.trim() || '',
        edad: data[5]?.trim() || '',
        tlf: data[6]?.trim() || '',
        instrumentoId: data[11]?.trim() || '',
      };

      if (!csvStudent.nombre) continue;

      // Buscar coincidencias exactas
      let bestMatch = null;
      let bestSimilarity = 0;

      for (const firestoreStudent of firestoreStudents) {
        const similarity = findNameSimilarity(csvStudent.nombre, firestoreStudent.nombre || '');

        if (similarity === 1) {
          // Coincidencia exacta
          bestMatch = { student: firestoreStudent, similarity: 1, type: 'exact' };
          break;
        } else if (similarity > 0.6 && similarity > bestSimilarity) {
          // Coincidencia parcial
          bestMatch = { student: firestoreStudent, similarity, type: 'partial' };
          bestSimilarity = similarity;
        }
      }

      if (bestMatch) {
        if (bestMatch.type === 'exact') {
          analysis.exactMatches.push({
            csv: csvStudent,
            firestore: bestMatch.student,
            similarity: bestMatch.similarity,
          });
        } else {
          analysis.partialMatches.push({
            csv: csvStudent,
            firestore: bestMatch.student,
            similarity: bestMatch.similarity,
          });
        }

        // Remover de la lista de solo-Firestore
        analysis.firestoreOnlyStudents = analysis.firestoreOnlyStudents.filter(
          (s) => s.id !== bestMatch.student.id,
        );
      } else {
        analysis.noMatches.push(csvStudent);
      }
    }

    // Generar reporte
    console.log('\n' + '='.repeat(60));
    console.log('📊 ANÁLISIS DE DATOS');
    console.log('='.repeat(60));

    console.log(`\n✅ COINCIDENCIAS EXACTAS (${analysis.exactMatches.length}):`);
    analysis.exactMatches.forEach((match) => {
      console.log(`  📝 "${match.csv.nombre}" -> "${match.firestore.nombre}"`);
    });

    console.log(`\n🔶 COINCIDENCIAS PARCIALES (${analysis.partialMatches.length}):`);
    analysis.partialMatches.forEach((match) => {
      console.log(
        `  📝 "${match.csv.nombre}" -> "${match.firestore.nombre}" (${(match.similarity * 100).toFixed(1)}%)`,
      );
    });

    console.log(`\n❓ SIN COINCIDENCIAS (${analysis.noMatches.length}):`);
    analysis.noMatches.forEach((student) => {
      console.log(`  📝 "${student.nombre}" (${student.instrumento})`);
    });

    console.log(`\n🔥 SOLO EN FIRESTORE (${analysis.firestoreOnlyStudents.length}):`);
    analysis.firestoreOnlyStudents.forEach((student) => {
      console.log(`  📝 "${student.nombre}" (${student.instrumento || 'N/A'})`);
    });

    // Guardar reporte detallado
    const reportPath = path.join(process.cwd(), 'migration-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`\n📄 Reporte detallado guardado en: ${reportPath}`);

    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMEN');
    console.log('='.repeat(60));
    console.log(`✅ Coincidencias exactas: ${analysis.exactMatches.length}`);
    console.log(`🔶 Coincidencias parciales: ${analysis.partialMatches.length}`);
    console.log(`❓ Sin coincidencias: ${analysis.noMatches.length}`);
    console.log(`🔥 Solo en Firestore: ${analysis.firestoreOnlyStudents.length}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('💥 Error en el análisis:', error);
  }
}

// Ejecutar análisis
analyzeCSVData();
