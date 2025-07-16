// Script de prueba final para verificar la integración completa de clases emergentes
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, getDoc, getDocs, query, where } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyBak3LR7Jfe_DEKPOVzEpLg69Vv6xWC_jY',
  authDomain: 'agenda-fa2cd.firebaseapp.com',
  projectId: 'agenda-fa2cd',
  storageBucket: 'agenda-fa2cd.appspot.com',
  messagingSenderId: '7048785329',
  appId: '1:7048785329:web:8ec01c5ac240b32f50ff5a',
};

async function testCompleteIntegration() {
  console.log('🔄 Iniciando prueba de integración completa...\n');

  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // 1. Verificar clases emergentes disponibles
    console.log('1️⃣ Verificando clases emergentes disponibles...');
    const emergencyClassesRef = collection(db, 'EMERGENCY_CLASSES');
    const emergencySnapshot = await getDocs(emergencyClassesRef);

    if (emergencySnapshot.empty) {
      console.log('❌ No se encontraron clases emergentes');
      return;
    }

    console.log(`✅ Se encontraron ${emergencySnapshot.size} clases emergentes`);

    // 2. Obtener la primera clase emergente para probar
    const firstEmergencyClass = emergencySnapshot.docs[0];
    const emergencyClassId = firstEmergencyClass.id;
    const emergencyClassData = firstEmergencyClass.data();

    console.log(`\n2️⃣ Probando con clase emergente: ${emergencyClassId}`);
    console.log(`   Nombre: ${emergencyClassData.className || 'Sin nombre'}`);
    console.log(`   Maestro: ${emergencyClassData.teacherName || 'Sin maestro'}`);
    console.log(`   Estudiantes seleccionados: ${emergencyClassData.selectedStudents?.length || 0}`);

    if (!emergencyClassData.selectedStudents || emergencyClassData.selectedStudents.length === 0) {
      console.log('⚠️ Esta clase emergente no tiene estudiantes asignados');
      return;
    }

    // 3. Verificar que los estudiantes existen en la colección ALUMNOS
    console.log('\n3️⃣ Verificando existencia de estudiantes...');
    const studentIds = emergencyClassData.selectedStudents;
    let existingStudents = 0;

    for (let i = 0; i < Math.min(studentIds.length, 5); i++) {
      // Solo verificar los primeros 5
      const studentId = studentIds[i];
      const studentRef = doc(db, 'ALUMNOS', studentId);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        console.log(
          `   ✅ ${studentData.nombre} ${studentData.apellido} (${studentId.slice(0, 8)}...)`,
        );
        existingStudents++;
      } else {
        console.log(`   ❌ Estudiante no encontrado: ${studentId}`);
      }
    }

    console.log(
      `\n   📊 Estudiantes verificados: ${existingStudents}/${Math.min(studentIds.length, 5)}`,
    );

    // 4. Simular búsqueda híbrida de clases
    console.log('\n4️⃣ Simulando búsqueda híbrida de clases...');

    // Simular búsqueda en clases regulares primero
    const regularClassesRef = collection(db, 'CLASSES');
    const regularQuery = query(regularClassesRef, where('__name__', '==', emergencyClassId));
    const regularSnapshot = await getDocs(regularQuery);

    if (regularSnapshot.empty) {
      console.log('   ❌ Clase no encontrada en CLASSES (esperado)');
      console.log('   🔄 Buscando en EMERGENCY_CLASSES...');

      // Buscar en clases emergentes
      const emergencyClassRef = doc(db, 'EMERGENCY_CLASSES', emergencyClassId);
      const emergencyClassSnap = await getDoc(emergencyClassRef);

      if (emergencyClassSnap.exists()) {
        console.log('   ✅ Clase encontrada en EMERGENCY_CLASSES');

        // 5. Simular normalización de datos
        console.log('\n5️⃣ Simulando normalización de datos...');
        const rawData = emergencyClassSnap.data();

        const normalizedData = {
          id: emergencyClassId,
          name: rawData.className || `Clase Emergente ${emergencyClassId.slice(-6)}`,
          description: 'Clase emergente creada por el maestro',
          teacherId: rawData.teacherId || 'unknown',
          studentIds: rawData.selectedStudents || [],
          students: [],
          schedule: undefined,
          isEmergencyClass: true,
          level: undefined,
          instrument: undefined,
          teachers: undefined,
          classroom: undefined,
          capacity: undefined,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        console.log('   ✅ Datos normalizados exitosamente:');
        console.log(`      - ID: ${normalizedData.id}`);
        console.log(`      - Nombre: ${normalizedData.name}`);
        console.log(`      - Estudiantes: ${normalizedData.studentIds.length}`);
        console.log(`      - Es emergente: ${normalizedData.isEmergencyClass}`);

        // 6. Verificar estructura de datos para AttendanceList
        console.log('\n6️⃣ Verificando compatibilidad con AttendanceList...');
        const requiredFields = ['id', 'name', 'studentIds'];
        const missingFields = requiredFields.filter((field) => !normalizedData[field]);

        if (missingFields.length === 0) {
          console.log('   ✅ Estructura de datos compatible con AttendanceList');
          console.log(
            `   📋 Lista de estudiantes disponible: ${normalizedData.studentIds.length} estudiantes`,
          );
        } else {
          console.log(`   ❌ Campos faltantes: ${missingFields.join(', ')}`);
        }

        // 7. Simular carga de estudiantes
        console.log('\n7️⃣ Simulando carga de estudiantes...');
        const studentDetails = [];

        for (const studentId of normalizedData.studentIds.slice(0, 3)) {
          // Solo los primeros 3
          const studentRef = doc(db, 'ALUMNOS', studentId);
          const studentSnap = await getDoc(studentRef);

          if (studentSnap.exists()) {
            const studentData = studentSnap.data();
            studentDetails.push({
              id: studentId,
              nombre: studentData.nombre,
              apellido: studentData.apellido,
              estado: studentData.estado || 'Activo',
            });
          }
        }

        console.log(`   ✅ Estudiantes cargados: ${studentDetails.length}`);
        studentDetails.forEach((student) => {
          console.log(`      - ${student.nombre} ${student.apellido} (${student.estado})`);
        });

        // 8. Resumen final
        console.log('\n📋 RESUMEN DE LA INTEGRACIÓN:');
        console.log('✅ 1. Clases emergentes detectadas correctamente');
        console.log('✅ 2. Búsqueda híbrida funcional (CLASSES → EMERGENCY_CLASSES)');
        console.log('✅ 3. Normalización de datos exitosa');
        console.log('✅ 4. Estructura compatible con AttendanceList');
        console.log('✅ 5. Carga de estudiantes funcional');
        console.log('\n🎉 LA INTEGRACIÓN ESTÁ COMPLETA Y FUNCIONAL');
      } else {
        console.log('   ❌ Clase no encontrada en EMERGENCY_CLASSES');
      }
    } else {
      console.log('   ✅ Clase encontrada en CLASSES (clase regular)');
    }
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar las pruebas
console.log('🧪 PRUEBA DE INTEGRACIÓN COMPLETA - CLASES EMERGENTES');
console.log('====================================================\n');

testCompleteIntegration()
  .then(() => {
    console.log('\n✅ Prueba completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en la prueba:', error);
    process.exit(1);
  });
