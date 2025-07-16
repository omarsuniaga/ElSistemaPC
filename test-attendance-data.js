// Script temporal para agregar datos de prueba a Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Configuración de Firebase (reemplaza con tu configuración)
const firebaseConfig = {
  // Tu configuración aquí
  apiKey: 'AIzaSyBEsIDpLCdOBZHI_lz4A_FUJNr7HZO8uio',
  authDomain: 'music-academy-manager-d01c5.firebaseapp.com',
  projectId: 'music-academy-manager-d01c5',
  storageBucket: 'music-academy-manager-d01c5.firebasestorage.app',
  messagingSenderId: '690187893169',
  appId: '1:690187893169:web:0bc44b5c4c1de4d43b1f89',
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ID del maestro de prueba (reemplaza con un ID real)
const TEST_TEACHER_ID = 'pzoktB8EIdYNKq8wc23YQbE3jWF3';

// Función para crear datos de prueba
async function createTestAttendanceData() {
  console.log('🧪 Creando datos de prueba para asistencia...');

  try {
    // Crear algunos registros de asistencia para diferentes fechas
    const testData = [
      {
        teacherId: TEST_TEACHER_ID,
        classId: 'lloptgTquxwQ8nlXLxEL',
        fecha: '2025-06-04', // Ayer
        data: {
          students: [
            { id: 'student1', status: 'presente' },
            { id: 'student2', status: 'ausente' },
            { id: 'student3', status: 'presente' },
          ],
          observación: 'Clase normal, buena participación',
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        teacherId: TEST_TEACHER_ID,
        classId: 'FS1CsRVSvgZyVc4TRgLb',
        fecha: '2025-06-05', // Hoy
        data: {
          students: [
            { id: 'student1', status: 'presente' },
            { id: 'student2', status: 'presente' },
            { id: 'student3', status: 'ausente' },
            { id: 'student4', status: 'presente' },
          ],
          observación: 'Excelente clase, todos participaron activamente',
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        teacherId: TEST_TEACHER_ID,
        classId: 'utbMldZWOlFSObx26n0',
        fecha: '2025-06-06', // Mañana
        data: {
          students: [
            { id: 'student1', status: 'presente' },
            { id: 'student2', status: 'tardanza' },
          ],
          observación: 'Clase productiva',
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    ];

    // Agregar cada documento a Firestore
    for (const docData of testData) {
      const docRef = await addDoc(collection(db, 'asistencias'), docData);
      console.log(`✅ Documento agregado con ID: ${docRef.id} para fecha: ${docData.fecha}`);
    }

    console.log('🎉 Datos de prueba creados exitosamente!');
    console.log('📊 Ahora deberías ver indicadores en el calendario para las fechas:');
    testData.forEach(doc => console.log(`  - ${doc.fecha}`));

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  }
}

// Ejecutar la función
createTestAttendanceData();
