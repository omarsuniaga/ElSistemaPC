// Script para generar datos de asistencia de muestra
// Ejecutar con: node generate-sample-attendance.js

const admin = require('firebase-admin');

// Inicializar Firebase Admin (asegúrate de tener las credenciales)
const serviceAccount = require('./path/to/your/serviceAccountKey.json'); // Actualiza esta ruta

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: "https://your-project-id.firebaseio.com" // Actualiza con tu proyecto
});

const db = admin.firestore();

// Datos de muestra
const sampleClasses = [
  { id: 'clase-violin-1', name: 'Violín 1 - Juvenil' },
  { id: 'clase-violin-2', name: 'Violín 2 - Juvenil' },
  { id: 'clase-iniciacion-violin', name: 'Iniciación Violín' },
  { id: 'clase-ensayo-general', name: 'Ensayo General - Juvenil' },
  { id: 'clase-ensayo-seccional', name: 'Ensayo Seccional - Juvenil' },
  { id: 'clase-taller-violas', name: 'Taller de Violas' }
];

const sampleStudents = [
  'XCMzMoaZAKQpMfUyFgz',
  '1663248027973',
  'edelyn-abreu-id',
  'helen-sofia-abogado-brea-id',
  'student-1',
  'student-2',
  'student-3',
  'student-4',
  'student-5',
  'student-6',
  'student-7',
  'student-8',
  'student-9',
  'student-10'
];

const teacherId = 'pzoktB8EldYNKq8wc23YQbE3WF3'; // ID del maestro actual

// Función para generar fechas de los últimos 30 días
function getDateRange() {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

// Función para generar estado de asistencia aleatorio
function getRandomAttendanceStatus() {
  const statuses = ['presente', 'ausente', 'tarde'];
  const weights = [0.7, 0.2, 0.1]; // 70% presente, 20% ausente, 10% tarde
  
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return statuses[i];
    }
  }
  
  return 'presente';
}

// Función para generar datos de asistencia
async function generateAttendanceData() {
  const dates = getDateRange();
  const batch = db.batch();
  let documentCount = 0;
  
  console.log('🚀 Generando datos de asistencia...');
  
  for (const date of dates) {
    for (const classData of sampleClasses) {
      // Solo generar datos para algunos días (no todos los días tienen clases)
      if (Math.random() < 0.6) { // 60% de probabilidad de que haya clase
        const docId = `${date}_${classData.id}`;
        
        // Generar asistencia para estudiantes
        const presentes = [];
        const ausentes = [];
        const tarde = [];
        const justificacion = [];
        
        // Seleccionar estudiantes aleatoriamente para esta clase (3-8 estudiantes por clase)
        const numStudents = Math.floor(Math.random() * 6) + 3;
        const classStudents = sampleStudents.slice(0, numStudents);
        
        classStudents.forEach(studentId => {
          const status = getRandomAttendanceStatus();
          
          switch (status) {
            case 'presente':
              presentes.push(studentId);
              break;
            case 'ausente':
              ausentes.push(studentId);
              // 30% de probabilidad de que tenga justificación
              if (Math.random() < 0.3) {
                justificacion.push({
                  id: studentId,
                  studentId: studentId,
                  classId: classData.id,
                  fecha: date,
                  reason: `Justificación para ${studentId} - ${['Cita médica', 'Emergencia familiar', 'Viaje', 'Enfermedad'][Math.floor(Math.random() * 4)]}`,
                  documentUrl: null,
                  approvalStatus: 'pending',
                  createdAt: new Date(),
                  timeLimit: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                });
              }
              break;
            case 'tarde':
              tarde.push(studentId);
              break;
          }
        });
        
        const attendanceDoc = {
          fecha: date,
          date: date, // Ambos campos para compatibilidad
          classId: classData.id,
          teacherId: teacherId,
          uid: teacherId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          data: {
            presentes,
            ausentes,
            tarde,
            justificacion,
            observación: Math.random() < 0.3 ? `Observación para la clase ${classData.name} del ${date}` : '',
            observations: []
          }
        };
        
        const docRef = db.collection('ASISTENCIAS').doc(docId);
        batch.set(docRef, attendanceDoc);
        documentCount++;
        
        console.log(`📝 Documento generado: ${docId} - ${presentes.length} presentes, ${ausentes.length} ausentes, ${tarde.length} tarde`);
      }
    }
  }
  
  try {
    await batch.commit();
    console.log(`✅ Se generaron ${documentCount} documentos de asistencia exitosamente!`);
    console.log('🎯 Datos listos para visualizar en el tablero de maestros');
  } catch (error) {
    console.error('❌ Error al generar datos:', error);
  }
}

// Función para limpiar datos existentes (opcional)
async function clearExistingData() {
  console.log('🧹 Limpiando datos existentes...');
  
  const snapshot = await db.collection('ASISTENCIAS').get();
  const batch = db.batch();
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log('✅ Datos existentes eliminados');
}

// Ejecutar el script
async function main() {
  try {
    console.log('🎭 Generador de Datos de Asistencia - Academia Musical');
    console.log('===============================================');
    
    // Descomentar la siguiente línea si quieres limpiar datos existentes primero
    // await clearExistingData();
    
    await generateAttendanceData();
    
    console.log('🎉 ¡Proceso completado! Recarga la página para ver los nuevos datos.');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Error en el proceso:', error);
    process.exit(1);
  }
}

main();
