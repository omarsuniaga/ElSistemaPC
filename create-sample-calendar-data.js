// create-sample-calendar-data.js
// Script para crear datos de muestra para el calendario profesional

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
} from 'firebase/firestore';

// Configuración de Firebase (usando las mismas credenciales del proyecto)
const firebaseConfig = {
  apiKey: 'AIzaSyBfOLqN3tSHqnvDH-uUBcOwALwm_3b7H2k',
  authDomain: 'el-sistema-pc.firebaseapp.com',
  projectId: 'el-sistema-pc',
  storageBucket: 'el-sistema-pc.firebasestorage.app',
  messagingSenderId: '85481507703',
  appId: '1:85481507703:web:4bb3c73a4edbff4c0e44e3',
  measurementId: 'G-S6V3H3FN2J',
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Datos de muestra para clases
const sampleClasses = [
  {
    id: 'clase-piano-1',
    name: 'Piano Básico',
    instrument: 'Piano',
    level: 'Principiante',
    teacherId: 'teacher-001',
    teacherName: 'María González',
    studentIds: ['student-001', 'student-002', 'student-003'],
    schedule: {
      slots: [
        {
          day: 'lunes',
          startTime: '09:00',
          endTime: '10:00',
        },
        {
          day: 'miércoles',
          startTime: '09:00',
          endTime: '10:00',
        },
      ],
    },
    classroom: 'Aula 1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'clase-violin-1',
    name: 'Violín Intermedio',
    instrument: 'Violín',
    level: 'Intermedio',
    teacherId: 'teacher-002',
    teacherName: 'Carlos Rodríguez',
    studentIds: ['student-004', 'student-005'],
    schedule: {
      slots: [
        {
          day: 'martes',
          startTime: '10:00',
          endTime: '11:00',
        },
        {
          day: 'jueves',
          startTime: '10:00',
          endTime: '11:00',
        },
      ],
    },
    classroom: 'Aula 2',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'clase-guitarra-1',
    name: 'Guitarra Clásica',
    instrument: 'Guitarra',
    level: 'Principiante',
    teacherId: 'teacher-003',
    teacherName: 'Ana Martínez',
    studentIds: ['student-006', 'student-007', 'student-008', 'student-009'],
    schedule: {
      slots: [
        {
          day: 'lunes',
          startTime: '14:00',
          endTime: '15:00',
        },
        {
          day: 'viernes',
          startTime: '14:00',
          endTime: '15:00',
        },
      ],
    },
    classroom: 'Aula 3',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Datos de muestra para estudiantes
const sampleStudents = [
  { id: 'student-001', name: 'Juan Pérez', email: 'juan@example.com' },
  { id: 'student-002', name: 'María López', email: 'maria@example.com' },
  { id: 'student-003', name: 'Pedro García', email: 'pedro@example.com' },
  { id: 'student-004', name: 'Ana Ruiz', email: 'ana@example.com' },
  { id: 'student-005', name: 'Luis Torres', email: 'luis@example.com' },
  { id: 'student-006', name: 'Carmen Silva', email: 'carmen@example.com' },
  { id: 'student-007', name: 'Roberto Díaz', email: 'roberto@example.com' },
  { id: 'student-008', name: 'Laura Moreno', email: 'laura@example.com' },
  { id: 'student-009', name: 'Diego Vargas', email: 'diego@example.com' },
];

// Función para crear registros de asistencia de muestra
function createSampleAttendance() {
  const attendance = {};
  const currentDate = new Date();
  
  // Crear registros para los últimos 7 días
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    attendance[dateString] = {};
    
    // Agregar algunos registros aleatorios
    sampleStudents.forEach(student => {
      if (Math.random() > 0.3) { // 70% de probabilidad de asistencia
        attendance[dateString][student.id] = Math.random() > 0.1 ? 'present' : 'absent';
      }
    });
  }
  
  return attendance;
}

// Función principal para crear todos los datos
async function createSampleData() {
  try {
    console.log('🚀 Creando datos de muestra para el calendario...');
    
    // 1. Crear clases
    console.log('📚 Creando clases...');
    for (const classData of sampleClasses) {
      await setDoc(doc(db, 'classes', classData.id), classData);
      console.log(`✅ Clase creada: ${classData.name}`);
    }
    
    // 2. Crear estudiantes
    console.log('👥 Creando estudiantes...');
    for (const student of sampleStudents) {
      await setDoc(doc(db, 'students', student.id), student);
      console.log(`✅ Estudiante creado: ${student.name}`);
    }
    
    // 3. Crear registros de asistencia
    console.log('📋 Creando registros de asistencia...');
    const attendanceData = createSampleAttendance();
    
    for (const [date, records] of Object.entries(attendanceData)) {
      await setDoc(doc(db, 'attendance', date), {
        date,
        records,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Asistencia creada para: ${date}`);
    }
    
    console.log('🎉 ¡Datos de muestra creados exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - ${sampleClasses.length} clases`);
    console.log(`   - ${sampleStudents.length} estudiantes`);
    console.log(`   - ${Object.keys(attendanceData).length} días de asistencia`);
    
  } catch (error) {
    console.error('❌ Error creando datos de muestra:', error);
  }
}

// Ejecutar si se llama directamente
if (typeof window === 'undefined') {
  createSampleData().then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

export { createSampleData };
