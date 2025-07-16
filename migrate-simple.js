// Script de migración simplificado con monitoreo detallado
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  query,
  where,
} from 'firebase/firestore';
import fs from 'fs';

// Cargar variables de entorno
config();

console.log('🚀 INICIANDO MIGRACIÓN DE ESTUDIANTES');
console.log('=====================================');

// Verificar variables de entorno
console.log('🔧 Verificando configuración...');
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.log('❌ Variables de entorno faltantes:', missingVars);
  console.log(
    '🔍 Variables disponibles:',
    Object.keys(process.env).filter((k) => k.startsWith('VITE')),
  );
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('✅ Configuración Firebase cargada');
console.log('📋 Project ID:', firebaseConfig.projectId);

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase inicializado');

async function ejecutarMigracion() {
  try {
    // Verificar conectividad
    console.log('\n📡 Verificando conectividad a Firestore...');
    const alumnosRef = collection(db, 'ALUMNOS');
    const testQuery = await getDocs(alumnosRef);
    console.log(`✅ Conectado. Documentos existentes: ${testQuery.size}`);

    // Leer CSV
    console.log('\n📄 Leyendo archivo CSV...');
    const csvPath = 'INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv';

    if (!fs.existsSync(csvPath)) {
      throw new Error(`Archivo CSV no encontrado: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter((line) => line.trim());

    console.log(`📊 CSV leído: ${lines.length} líneas (incluyendo header)`);

    // Parsear header
    const header = lines[0].split(',');
    console.log('📋 Campos CSV:', header);

    // Procesar estudiantes (saltando header)
    const estudiantes = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= header.length && values[1]) {
        // Verificar que tenga nombre
        const estudiante = {};
        header.forEach((field, index) => {
          estudiante[field] = values[index] || '';
        });
        estudiantes.push(estudiante);
      }
    }

    console.log(`👥 Estudiantes a procesar: ${estudiantes.length}`);

    // Procesar primeros 5 como prueba
    console.log('\n🔄 Procesando primeros 5 estudiantes como prueba...');

    for (let i = 0; i < Math.min(5, estudiantes.length); i++) {
      const estudiante = estudiantes[i];
      console.log(`\n📋 Procesando: ${estudiante.Nombre}`);

      // Buscar estudiante existente por nombre
      const q = query(alumnosRef, where('nombre', '==', estudiante.Nombre.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Actualizar estudiante existente
        console.log(`🔄 Actualizando estudiante existente: ${estudiante.Nombre}`);
        const docRef = querySnapshot.docs[0].ref;

        const updateData = {};
        if (estudiante.tlf) updateData.telefono = estudiante.tlf;
        if (estudiante.edad) updateData.edad = parseInt(estudiante.edad);
        if (estudiante.instrumento) updateData.instrumento = estudiante.instrumento;
        if (estudiante.InstrumentoID) updateData.instrumentoId = estudiante.InstrumentoID;

        // Actualizar grupos
        updateData.grupos = {
          preparatoria: estudiante.Preparatoria === 'TRUE',
          teoriaMusical: estudiante['Teoria Musical'] === 'TRUE',
          coro: estudiante.Coro === 'TRUE',
          orquesta: estudiante.Orquesta === 'TRUE',
        };

        await updateDoc(docRef, updateData);
        console.log(`✅ Actualizado: ${estudiante.Nombre}`);
      } else {
        // Crear nuevo estudiante
        console.log(`➕ Creando nuevo estudiante: ${estudiante.Nombre}`);

        const newStudentData = {
          nombre: estudiante.Nombre.trim(),
          telefono: estudiante.tlf || '',
          edad: estudiante.edad ? parseInt(estudiante.edad) : 0,
          instrumento: estudiante.instrumento || '',
          instrumentoId: estudiante.InstrumentoID || '',
          inscripcion: estudiante.inscripcion || '',
          nacimiento: estudiante.nac || '',
          grupos: {
            preparatoria: estudiante.Preparatoria === 'TRUE',
            teoriaMusical: estudiante['Teoria Musical'] === 'TRUE',
            coro: estudiante.Coro === 'TRUE',
            orquesta: estudiante.Orquesta === 'TRUE',
          },
          fechaCreacion: new Date().toISOString(),
        };

        await addDoc(alumnosRef, newStudentData);
        console.log(`✅ Creado: ${estudiante.Nombre}`);
      }

      // Pausa pequeña para no sobrecargar
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\n🎉 MIGRACIÓN DE PRUEBA COMPLETADA');
    console.log('📊 Se procesaron los primeros 5 estudiantes exitosamente');
    console.log('🔄 Para procesar todos los estudiantes, modifica el límite en el código');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    console.error('📍 Stack trace:', error.stack);
  }
}

ejecutarMigracion();
