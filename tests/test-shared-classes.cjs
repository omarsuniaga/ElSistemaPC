// Test script ACTUALIZADO para verificar clases compartidas específicamente
// Con datos que simulan tu caso real: 1 clase compartida con 95 estudiantes

function testSharedClassesLogic() {
  console.log('🧪 === PROBANDO LÓGICA DE CLASES COMPARTIDAS ===');
  console.log('🎯 CASO ESPECÍFICO: Verificar clase como asistente con 95 estudiantes');
  
  // Simular datos como los que podrían venir de Firestore
  const currentUserId = 'pzoktB8EIdYNKq8wCZ3YQbE3jMF3'; // Tu ID de usuario real
  
  const sampleClasses = [
    {
      id: 'large-class-id',
      name: 'Clase Grande (95 Estudiantes)', // Tu clase real con 95 estudiantes
      teacherId: 'otro-profesor-principal-id', // Otro profesor es el principal
      teachers: [
        {
          teacherId: 'otro-profesor-principal-id', // El profesor principal
          role: 'PRINCIPAL',
          permissions: { canTakeAttendance: true }
        },
        {
          teacherId: currentUserId, // TÚ estás en el array como asistente
          role: 'ASSISTANT', 
          permissions: { canTakeAttendance: true }
        }
      ],
      studentIds: Array.from({length: 95}, (_, i) => `student-${i}`), // 95 estudiantes
      schedule: {
        slots: [
          {
            day: 'martes',
            startTime: '15:30',
            endTime: '17:30'
          }
        ]
      },
      classType: 'shared',
      isSharedWithMe: true,
      userRole: 'ASSISTANT'
    },
    {
      id: 'class2', 
      name: 'Mi Clase Principal',
      teacherId: currentUserId, // TÚ eres el principal
      teachers: [],
      studentIds: Array.from({length: 12}, (_, i) => `student-${i}`), // 12 estudiantes
      schedule: {
        slots: [
          {
            day: 'martes',
            startTime: '10:00', 
            endTime: '11:00'
          }
        ]
      }
    },
    {
      id: 'class3',
      name: 'Coro Mixto (Día Diferente)', 
      teacherId: 'profesor-x',
      teachers: [
        {
          teacherId: currentUserId, // TÚ como colaborador
          role: 'COLLABORATOR',
          permissions: { canTakeAttendance: true }
        }
      ],
      studentIds: Array.from({length: 25}, (_, i) => `student-${i}`), // 25 estudiantes
      schedule: {
        slots: [
          {
            day: 'miércoles', // Día diferente, no debería aparecer
            startTime: '14:00',
            endTime: '15:30'
          }
        ]
      }
    }
  ];
  
  console.log('\n📋 DATOS DE PRUEBA:');
  console.log(`Usuario actual: ${currentUserId}`);
  console.log(`Total clases en DB: ${sampleClasses.length}`);
  
  // Mostrar resumen de clases
  sampleClasses.forEach(cls => {
    const studentCount = cls.studentIds?.length || 0;
    const isUserInTeachers = cls.teachers?.some(t => t.teacherId === currentUserId);
    const userRole = cls.teachers?.find(t => t.teacherId === currentUserId)?.role;
    
    console.log(`  - ${cls.name}: ${studentCount} estudiantes, usuario en teachers: ${isUserInTeachers}, rol: ${userRole || 'ninguno'}`);
  });
  
  const dayOfWeek = 'martes';
  console.log(`\n🔍 PROBANDO LÓGICA PARA ${dayOfWeek.toUpperCase()}:`);
  
  // === LÓGICA IGUAL A LA DE TeacherHome.vue ===
  
  // 1. Clases donde soy principal
  const myPrimaryClasses = sampleClasses.filter(cls => cls.teacherId === currentUserId);
  console.log(`\n👑 Mis clases principales: ${myPrimaryClasses.length}`);
  myPrimaryClasses.forEach(cls => console.log(`  - ${cls.name} (${cls.studentIds?.length || 0} estudiantes)`));
  
  // 2. Clases compartidas donde soy colaborador (LÓGICA CORREGIDA)
  const sharedClasses = sampleClasses.filter(cls => {
    console.log(`\n🔍 Evaluando clase: ${cls.name}`);
    
    // Verificar si estoy en el array de teachers
    const isCollaborator = cls.teachers?.some(teacher => teacher.teacherId === currentUserId);
    if (!isCollaborator) {
      console.log(`  ⏭️  No estoy en teachers array`);
      return false;
    }
    
    // Verificar que NO sea el profesor principal (evitar duplicados)
    if (cls.teacherId === currentUserId) {
      console.log(`  ⏭️  Soy el profesor principal`);
      return false;
    }
    
    // Verificar si la clase está programada para este día
    const hasSlotForDay = cls.schedule?.slots?.some(slot => {
      const slotDay = slot.day?.toLowerCase();
      return slotDay === dayOfWeek;
    });
    
    if (!hasSlotForDay) {
      console.log(`  ⏭️  No tiene horario para ${dayOfWeek}`);
      return false;
    }
    
    console.log(`  ✅ Cumple todos los criterios`);
    return true;
  });
  
  console.log(`\n🤝 Clases compartidas donde soy colaborador: ${sharedClasses.length}`);
  sharedClasses.forEach(cls => {
    const myRole = cls.teachers?.find(t => t.teacherId === currentUserId)?.role;
    const myPermissions = cls.teachers?.find(t => t.teacherId === currentUserId)?.permissions;
    const studentCount = cls.studentIds?.length || 0;
    console.log(`  - ${cls.name} (rol: ${myRole}, principal: ${cls.teacherId})`);
    console.log(`    📊 Estudiantes: ${studentCount}`);
    console.log(`    🔐 Permisos:`, myPermissions);
  });
  
  // 3. Total para el modal
  const totalForModal = [...myPrimaryClasses, ...sharedClasses];
  console.log(`\n📱 TOTAL CLASES PARA MODAL: ${totalForModal.length}`);
  totalForModal.forEach(cls => {
    const isPrimary = cls.teacherId === currentUserId;
    const type = isPrimary ? 'PRINCIPAL' : 'COMPARTIDA';
    const studentCount = cls.studentIds?.length || 0;
    console.log(`  - ${cls.name} (${type}) - ${studentCount} estudiantes`);
  });
  
  console.log('\n🎯 RESULTADO ESPERADO:');
  console.log('✅ "Clase Grande (95 Estudiantes)" debe aparecer como COMPARTIDA');
  console.log('✅ "Mi Clase Principal" debe aparecer como PRINCIPAL');
  console.log('❌ "Coro Mixto" NO debe aparecer (día diferente)');
  
  // Verificación específica para tu caso
  const myLargeSharedClass = sharedClasses.find(cls => (cls.studentIds?.length || 0) >= 90);
  if (myLargeSharedClass) {
    console.log('\n🎯🎯🎯 CLASE OBJETIVO ENCONTRADA:');
    console.log(`📚 Nombre: ${myLargeSharedClass.name}`);
    console.log(`👥 Estudiantes: ${myLargeSharedClass.studentIds?.length || 0}`);
    console.log(`🎭 Mi rol: ${myLargeSharedClass.teachers?.find(t => t.teacherId === currentUserId)?.role}`);
    console.log(`✅ DEBE APARECER EN EL MODAL para registrar asistencia`);
  } else {
    console.log('\n❌ NO SE ENCONTRÓ LA CLASE CON 95 ESTUDIANTES COMO ASISTENTE');
  }
  
  return { totalForModal, sharedClasses, myPrimaryClasses, myLargeSharedClass };
}

// Auto-ejecutar
testSharedClassesLogic();
