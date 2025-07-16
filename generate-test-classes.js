/**
 * 🎯 GENERADOR DE CLASES DE PRUEBA
 * Script para crear clases y estudiantes de prueba en Firestore
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Configuración de Firebase (reemplaza con tu configuración)
const firebaseConfig = {
  // Tu configuración aquí
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Datos de prueba
const TEACHER_EMAIL = 'maestro@test.com';
const TEACHER_PASSWORD = '123456';

const TEST_CLASSES = [
  {
    name: 'Piano Básico',
    description: 'Clase de piano para principiantes',
    instrument: 'Piano',
    level: 'Básico',
    classroom: 'Aula 101',
    schedule: {
      slots: [
        {
          id: 'slot1',
          day: 'lunes',
          startTime: '09:00',
          endTime: '10:00',
        },
        {
          id: 'slot2', 
          day: 'miércoles',
          startTime: '09:00',
          endTime: '10:00',
        },
      ],
    },
    maxStudents: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Guitarra Intermedio',
    description: 'Clase de guitarra nivel intermedio',
    instrument: 'Guitarra',
    level: 'Intermedio',
    classroom: 'Aula 102',
    schedule: {
      slots: [
        {
          id: 'slot3',
          day: 'martes',
          startTime: '14:00',
          endTime: '15:00',
        },
        {
          id: 'slot4',
          day: 'viernes', 
          startTime: '14:00',
          endTime: '15:00',
        },
      ],
    },
    maxStudents: 8,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const TEST_STUDENTS = [
  {
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@test.com',
    fechaNacimiento: '2010-05-15',
    telefono: '555-0001',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    nombre: 'María',
    apellido: 'González',
    email: 'maria.gonzalez@test.com', 
    fechaNacimiento: '2011-08-22',
    telefono: '555-0002',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    nombre: 'Carlos',
    apellido: 'López',
    email: 'carlos.lopez@test.com',
    fechaNacimiento: '2009-12-03',
    telefono: '555-0003', 
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function generateTestData() {
  try {
    console.log('🔐 Authenticating...');
    const userCredential = await signInWithEmailAndPassword(auth, TEACHER_EMAIL, TEACHER_PASSWORD);
    const teacherId = userCredential.user.uid;
    
    console.log('📚 Creating test classes...');
    const classIds = [];
    
    for (const classData of TEST_CLASSES) {
      const classDoc = await addDoc(collection(db, 'classes'), {
        ...classData,
        teacherId,
        primaryTeacher: teacherId,
      });
      classIds.push(classDoc.id);
      console.log(`✅ Created class: ${classData.name} (${classDoc.id})`);
    }
    
    console.log('👥 Creating test students...');
    const studentIds = [];
    
    for (const studentData of TEST_STUDENTS) {
      const studentDoc = await addDoc(collection(db, 'students'), studentData);
      studentIds.push(studentDoc.id);
      console.log(`✅ Created student: ${studentData.nombre} ${studentData.apellido} (${studentDoc.id})`);
    }
    
    console.log('🔗 Linking students to classes...');
    // Asignar estudiantes a las clases
    for (let i = 0; i < classIds.length; i++) {
      const classId = classIds[i];
      const classStudents = studentIds.slice(0, 2); // Primeros 2 estudiantes por clase
      
      await setDoc(doc(db, 'classes', classId), {
        studentIds: classStudents,
      }, { merge: true });
      
      console.log(`✅ Linked students to class ${classId}:`, classStudents);
    }
    
    console.log('🎉 Test data generated successfully!');
    console.log('📋 Summary:');
    console.log(`- Classes created: ${classIds.length}`);
    console.log(`- Students created: ${studentIds.length}`);
    console.log(`- Teacher ID: ${teacherId}`);
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
  }
}

// Ejecutar el generador
generateTestData();
