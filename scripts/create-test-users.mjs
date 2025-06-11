// scripts/create-test-users.mjs
// Script para crear usuarios de prueba con diferentes roles

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';

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

// Definir usuarios de prueba
const testUsers = [
  {
    email: 'superusuario@test.com',
    password: 'Test123456!',
    role: 'Superusuario',
    displayName: 'Super Usuario',
    personalInfo: {
      firstName: 'Super',
      lastName: 'Usuario',
      phone: '+57 300 123 4567',
      address: 'Calle Principal 123',
      city: 'Bogotá',
      department: 'Cundinamarca'
    },
    status: 'aprobado',
    permissions: ['all'],
    description: 'Usuario con acceso completo al sistema'
  },
  {
    email: 'director@test.com',
    password: 'Test123456!',
    role: 'Director',
    displayName: 'Director Académico',
    personalInfo: {
      firstName: 'María',
      lastName: 'González',
      phone: '+57 301 234 5678',
      address: 'Carrera 15 #45-67',
      city: 'Medellín',
      department: 'Antioquia'
    },
    status: 'aprobado',
    permissions: ['manage_teachers', 'manage_students', 'view_reports', 'manage_classes'],
    description: 'Director con permisos administrativos completos'
  },
  {
    email: 'admin@test.com',
    password: 'Test123456!',
    role: 'Admin',
    displayName: 'Administrador',
    personalInfo: {
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      phone: '+57 302 345 6789',
      address: 'Avenida 80 #123-45',
      city: 'Cali',
      department: 'Valle del Cauca'
    },
    status: 'aprobado',
    permissions: ['manage_system', 'view_analytics', 'manage_users', 'backup_data'],
    description: 'Administrador del sistema con permisos técnicos'
  },
  {
    email: 'maestro@test.com',
    password: 'Test123456!',
    role: 'Maestro',
    displayName: 'Profesor Juan',
    personalInfo: {
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+57 303 456 7890',
      address: 'Transversal 25 #67-89',
      city: 'Barranquilla',
      department: 'Atlántico'
    },
    status: 'aprobado',
    specialties: ['Piano', 'Teoría Musical'],
    instruments: ['Piano', 'Teclado'],
    permissions: ['manage_attendance', 'view_students', 'create_observations'],
    description: 'Maestro de música con especialidad en piano'
  }
];

async function createTestUser(userData) {
  try {
    console.log(`🔄 Creando usuario: ${userData.email}`);
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    const user = userCredential.user;
    console.log(`✅ Usuario Auth creado: ${user.uid}`);
    
    // Crear documento en Firestore
    const userDoc = {
      uid: user.uid,
      email: userData.email,
      role: userData.role,
      displayName: userData.displayName,
      personalInfo: userData.personalInfo,
      status: userData.status,
      permissions: userData.permissions,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isTestUser: true, // Marcador para identificar usuarios de prueba
      description: userData.description
    };
    
    // Agregar campos específicos para maestros
    if (userData.role === 'Maestro') {
      userDoc.specialties = userData.specialties;
      userDoc.instruments = userData.instruments;
      userDoc.teacherInfo = {
        experience: '5 años',
        education: 'Licenciatura en Música',
        certifications: ['Pedagogía Musical', 'Piano Avanzado']
      };
    }
    
    // Guardar en Firestore
    await setDoc(doc(db, 'USERS', user.uid), userDoc);
    console.log(`✅ Documento Firestore creado para: ${userData.displayName}`);
    
    // Si es maestro, crear algunas clases de ejemplo
    if (userData.role === 'Maestro') {
      await createSampleClasses(user.uid, userData.displayName);
    }
    
    return {
      success: true,
      uid: user.uid,
      email: userData.email,
      role: userData.role,
      displayName: userData.displayName
    };
    
  } catch (error) {
    console.error(`❌ Error creando usuario ${userData.email}:`, error.message);
    return {
      success: false,
      email: userData.email,
      error: error.message
    };
  }
}

async function createSampleClasses(teacherId, teacherName) {
  try {
    const sampleClasses = [
      {
        name: 'Piano Básico - Grupo A',
        instrument: 'Piano',
        level: 'Básico',
        teacherId: teacherId,
        teacherName: teacherName,
        schedule: {
          day: 'Lunes',
          startTime: '14:00',
          endTime: '15:30',
          duration: 90
        },
        capacity: 8,
        currentStudents: 5,
        room: 'Aula 101',
        description: 'Clase de piano para principiantes',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        name: 'Teoría Musical Intermedio',
        instrument: 'Teoría',
        level: 'Intermedio',
        teacherId: teacherId,
        teacherName: teacherName,
        schedule: {
          day: 'Miércoles',
          startTime: '16:00',
          endTime: '17:00',
          duration: 60
        },
        capacity: 12,
        currentStudents: 8,
        room: 'Aula 203',
        description: 'Teoría musical para estudiantes intermedios',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ];
    
    for (const classData of sampleClasses) {
      await addDoc(collection(db, 'classes'), classData);
      console.log(`📚 Clase creada: ${classData.name}`);
    }
  } catch (error) {
    console.error('❌ Error creando clases de ejemplo:', error);
  }
}

async function createAllTestUsers() {
  console.log('🚀 Iniciando creación de usuarios de prueba...\n');
  
  const results = [];
  
  for (const userData of testUsers) {
    const result = await createTestUser(userData);
    results.push(result);
    console.log(''); // Línea en blanco para separar usuarios
  }
  
  // Resumen final
  console.log('📊 RESUMEN DE CREACIÓN DE USUARIOS:');
  console.log('=====================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Usuarios creados exitosamente: ${successful.length}`);
  successful.forEach(user => {
    console.log(`   - ${user.displayName} (${user.role}) - ${user.email}`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ Usuarios con errores: ${failed.length}`);
    failed.forEach(user => {
      console.log(`   - ${user.email}: ${user.error}`);
    });
  }
  
  console.log('\n🔐 CREDENCIALES DE ACCESO:');
  console.log('==========================');
  testUsers.forEach(user => {
    console.log(`${user.role}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log('');
  });
  
  console.log('🎯 INSTRUCCIONES DE USO:');
  console.log('========================');
  console.log('1. Ve a http://localhost:3000/login');
  console.log('2. Usa cualquiera de las credenciales anteriores');
  console.log('3. Cada usuario tendrá acceso a diferentes secciones según su rol');
  console.log('4. El Superusuario tendrá acceso completo al sistema');
  console.log('5. Los usuarios están marcados como isTestUser: true en la base de datos');
}

// Ejecutar el script
createAllTestUsers()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando script:', error);
    process.exit(1);
  });

export { createAllTestUsers, testUsers };
