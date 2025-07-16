/**
 * Script para verificar el estado actual de la colección ALUMNOS
 * Muestra estadísticas y estructura de datos
 */

import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Cargar variables de entorno
config();

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_APP_API_KEY,
  authDomain: process.env.VITE_APP_AUTH_DOMAIN,
  projectId: process.env.VITE_APP_PROJECT_ID,
  storageBucket: process.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Analiza la estructura de datos de la colección ALUMNOS
 */
async function analyzeAlumnosCollection() {
  console.log('🔍 Analizando colección ALUMNOS...');

  try {
    const alumnosRef = collection(db, 'alumnos');
    const snapshot = await getDocs(alumnosRef);

    if (snapshot.empty) {
      console.log('📭 La colección ALUMNOS está vacía');
      return;
    }

    console.log(`📊 Total de estudiantes: ${snapshot.size}`);

    // Analizar campos
    const allFields = new Set();
    const fieldTypes = new Map();
    const sampleValues = new Map();
    const instrumentos = new Set();
    const grupos = new Set();

    snapshot.forEach((doc) => {
      const data = doc.data();

      Object.entries(data).forEach(([field, value]) => {
        allFields.add(field);

        const type = Array.isArray(value) ? 'array' : typeof value;
        if (!fieldTypes.has(field)) {
          fieldTypes.set(field, new Set());
        }
        fieldTypes.get(field).add(type);

        // Guardar valores de ejemplo
        if (!sampleValues.has(field)) {
          sampleValues.set(field, []);
        }
        if (sampleValues.get(field).length < 3) {
          sampleValues.get(field).push(value);
        }

        // Recopilar instrumentos
        if (field === 'instrumento' && value) {
          instrumentos.add(value);
        }

        // Recopilar grupos
        if (field === 'grupos' && Array.isArray(value)) {
          value.forEach((grupo) => grupos.add(grupo));
        }
      });
    });

    // Mostrar estadísticas de campos
    console.log('\n📋 ESTRUCTURA DE DATOS:');
    console.log('=' * 40);

    Array.from(allFields)
      .sort()
      .forEach((field) => {
        const types = Array.from(fieldTypes.get(field));
        const samples = sampleValues.get(field);

        console.log(`🔑 ${field}:`);
        console.log(`   Tipo: ${types.join(', ')}`);
        console.log(
          `   Ejemplos: ${samples
            .map((v) => (typeof v === 'object' ? JSON.stringify(v) : v))
            .join(', ')}`,
        );
        console.log('');
      });

    // Mostrar instrumentos
    if (instrumentos.size > 0) {
      console.log('🎵 INSTRUMENTOS ENCONTRADOS:');
      console.log('=' * 40);
      Array.from(instrumentos)
        .sort()
        .forEach((instrumento) => {
          console.log(`♪ ${instrumento}`);
        });
      console.log(`\nTotal: ${instrumentos.size} instrumentos diferentes`);
    }

    // Mostrar grupos
    if (grupos.size > 0) {
      console.log('\n👥 GRUPOS ENCONTRADOS:');
      console.log('=' * 40);
      Array.from(grupos)
        .sort()
        .forEach((grupo) => {
          console.log(`📚 ${grupo}`);
        });
      console.log(`\nTotal: ${grupos.size} grupos diferentes`);
    }

    // Estadísticas adicionales
    let withPhone = 0;
    let withAge = 0;
    let withInstrument = 0;
    let withGroups = 0;
    let withBirthDate = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.tlf) withPhone++;
      if (data.edad) withAge++;
      if (data.instrumento) withInstrument++;
      if (data.grupos && data.grupos.length > 0) withGroups++;
      if (data.nac) withBirthDate++;
    });

    console.log('\n📊 COMPLETITUD DE DATOS:');
    console.log('=' * 40);
    console.log(
      `📞 Con teléfono: ${withPhone}/${snapshot.size} (${((withPhone / snapshot.size) * 100).toFixed(1)}%)`,
    );
    console.log(
      `🎂 Con edad: ${withAge}/${snapshot.size} (${((withAge / snapshot.size) * 100).toFixed(1)}%)`,
    );
    console.log(
      `🎵 Con instrumento: ${withInstrument}/${snapshot.size} (${((withInstrument / snapshot.size) * 100).toFixed(1)}%)`,
    );
    console.log(
      `👥 Con grupos: ${withGroups}/${snapshot.size} (${((withGroups / snapshot.size) * 100).toFixed(1)}%)`,
    );
    console.log(
      `📅 Con fecha nacimiento: ${withBirthDate}/${snapshot.size} (${((withBirthDate / snapshot.size) * 100).toFixed(1)}%)`,
    );

    return {
      totalStudents: snapshot.size,
      fields: Array.from(allFields),
      instrumentos: Array.from(instrumentos),
      grupos: Array.from(grupos),
      completeness: {
        phone: withPhone,
        age: withAge,
        instrument: withInstrument,
        groups: withGroups,
        birthDate: withBirthDate,
      },
    };
  } catch (error) {
    console.error('💥 Error analizando colección:', error);
    return null;
  }
}

// Ejecutar análisis
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeAlumnosCollection().then((result) => {
    if (result) {
      console.log('\n✅ Análisis completado');
    } else {
      console.error('\n❌ Error en el análisis');
      process.exit(1);
    }
  });
}

export { analyzeAlumnosCollection };
