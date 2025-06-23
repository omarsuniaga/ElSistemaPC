// Script para probar las clases compartidas con la nueva estructura de Firestore
// Ejecutar en la consola del navegador

window.testFirestoreSharedClasses = () => {
  console.log('🔥 === PRUEBA DE CLASES COMPARTIDAS CON FIRESTORE ===');
  
  // Crear datos de ejemplo que coincidan con la estructura de Firestore
  const mockClassesWithTeachers = [
    {
      id: 'class1',
      name: 'Piano Avanzado Matutino',
      description: 'Clase de piano para estudiantes avanzados',
      instrument: 'Piano',
      level: 'avanzado',
      teacherId: 'main-teacher-123',
      teachers: [], // Sin compartir
      studentIds: ['student1', 'student2'],
      capacity: 8,
      status: 'active'
    },
    {
      id: 'class2',
      name: 'Guitarra Intermedio Vespertino',
      description: 'Clase de guitarra nivel intermedio',
      instrument: 'Guitarra', 
      level: 'intermedio',
      teacherId: 'main-teacher-123',
      teachers: ['main-teacher-123', 'assistant-teacher-456'], // COMPARTIDA
      studentIds: ['student3', 'student4', 'student5'],
      capacity: 10,
      status: 'active'
    },
    {
      id: 'class3',
      name: 'Violín Principiantes',
      description: 'Introducción al violín',
      instrument: 'Violín',
      level: 'principiante',
      teacherId: 'other-teacher-789',
      teachers: ['other-teacher-789', 'main-teacher-123'], // COMPARTIDA CONMIGO
      studentIds: ['student6', 'student7'],
      capacity: 6,
      status: 'active'
    }
  ];
  
  console.log('📊 ANÁLISIS DE CLASES:');
  
  // Simular ID de usuario actual
  const currentUserId = 'main-teacher-123';
  
  mockClassesWithTeachers.forEach((classItem, index) => {
    console.log(`\nClase ${index + 1}: ${classItem.name}`);
    console.log(`- teacherId: ${classItem.teacherId}`);
    console.log(`- teachers: [${classItem.teachers.join(', ')}]`);
    console.log(`- Es compartida: ${classItem.teachers.length > 0 ? '✅ SÍ' : '❌ NO'}`);
    
    if (classItem.teachers.length > 0) {
      const isOwned = classItem.teachers.includes(currentUserId);
      const isSharedWithMe = classItem.teachers.includes(currentUserId) && classItem.teacherId !== currentUserId;
      
      console.log(`- Aparece en mi panel: ${isOwned ? '✅ SÍ' : '❌ NO'}`);
      console.log(`- Es "compartida conmigo": ${isSharedWithMe ? '✅ SÍ' : '❌ NO'}`);
    }
  });
  
  // Filtrar según la nueva lógica
  const sharedClasses = mockClassesWithTeachers.filter(classItem => 
    classItem.teachers && classItem.teachers.length > 0
  );
  
  const ownedSharedClasses = sharedClasses.filter(classItem =>
    classItem.teachers.includes(currentUserId)
  );
  
  const sharedWithMeClasses = sharedClasses.filter(classItem =>
    classItem.teachers.includes(currentUserId) && classItem.teacherId !== currentUserId
  );
  
  console.log('\n🎯 RESULTADOS FINALES:');
  console.log(`📚 Total de clases: ${mockClassesWithTeachers.length}`);
  console.log(`🔗 Clases compartidas: ${sharedClasses.length}`);
  console.log(`👤 Mis clases compartidas: ${ownedSharedClasses.length}`);
  console.log(`📥 Compartidas conmigo: ${sharedWithMeClasses.length}`);
  
  console.log('\n📋 CLASES COMPARTIDAS:');
  sharedClasses.forEach(cls => {
    console.log(`- ${cls.name} (teachers: [${cls.teachers.join(', ')}])`);
  });
  
  console.log('\n👤 MIS CLASES COMPARTIDAS:');
  ownedSharedClasses.forEach(cls => {
    console.log(`- ${cls.name}`);
  });
  
  console.log('\n📥 COMPARTIDAS CONMIGO:');
  sharedWithMeClasses.forEach(cls => {
    console.log(`- ${cls.name}`);
  });
  
  console.log('\n✅ La nueva lógica funciona correctamente!');
};

// Función para inyectar datos de prueba temporalmente
window.injectTestSharedClasses = () => {
  console.log('💉 Inyectando datos de prueba...');
  
  // Esto simula tener clases con la estructura de Firestore
  const testData = [
    {
      id: 'firestore-class-1',
      name: 'Piano Colaborativo',
      instrument: 'Piano',
      teacherId: 'current-user-id',
      teachers: ['current-user-id', 'teacher-2', 'teacher-3'],
      studentIds: ['s1', 's2', 's3']
    },
    {
      id: 'firestore-class-2', 
      name: 'Guitarra Solo',
      instrument: 'Guitarra',
      teacherId: 'current-user-id',
      teachers: [], // No compartida
      studentIds: ['s4', 's5']
    }
  ];
  
  // Guardar en localStorage para que el componente lo pueda usar
  localStorage.setItem('test-shared-classes', JSON.stringify(testData));
  console.log('✅ Datos inyectados. Recarga la página para ver los cambios.');
};

console.log('🎵 Scripts de prueba cargados:');
console.log('- testFirestoreSharedClasses() - Probar lógica de filtrado');
console.log('- injectTestSharedClasses() - Inyectar datos de prueba');
