// Test script ACTUALIZADO para verificar clases compartidas específicamente
// Ejecutar en la consola del navegador o como script independiente

function testSharedClassesLogic() {
  console.log('🧪 === PROBANDO LÓGICA DE CLASES COMPARTIDAS ===');
  
  // Simular datos como los que podrían venir de Firestore
  const currentUserId = 'pzoktB8EIdYNKq8wCZ3YQbE3jMF3'; // Tu ID de usuario real
  
  const sampleClasses = [
    {
      id: 'class1',
      name: 'Orquesta Sinfónica',
      teacherId: 'otro-profesor-id', // Otro profesor es el principal
      teachers: [
        {
          teacherId: currentUserId, // TÚ estás en el array
          role: 'ASSISTANT', 
          permissions: { canTakeAttendance: true }
        },
        {
          teacherId: 'otro-profesor-id',
          role: 'PRINCIPAL',
          permissions: { canTakeAttendance: true }
        }
      ],
      schedule: {
        slots: [
          {
            day: 'martes',
            startTime: '15:30',
            endTime: '17:30'
          }
        ]
      }
    },
    {
      id: 'class2', 
      name: 'Mi Clase Principal',
      teacherId: currentUserId, // TÚ eres el principal
      teachers: [],
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
      name: 'Coro Mixto', 
      teacherId: 'profesor-x',
      teachers: [
        {
          teacherId: currentUserId, // TÚ como colaborador
          role: 'COLLABORATOR',
          permissions: { canTakeAttendance: true }
        }
      ],
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
  
  const dayOfWeek = 'martes';
  console.log(`\n🔍 PROBANDO LÓGICA PARA ${dayOfWeek.toUpperCase()}:`);
  
  // === LÓGICA IGUAL A LA DE TeacherHome.vue ===
  
  // 1. Clases donde soy principal
  const myPrimaryClasses = sampleClasses.filter(cls => cls.teacherId === currentUserId);
  console.log(`\n👑 Mis clases principales: ${myPrimaryClasses.length}`);
  myPrimaryClasses.forEach(cls => console.log(`  - ${cls.name}`));
  
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
    console.log(`  - ${cls.name} (rol: ${myRole}, principal: ${cls.teacherId})`);
    console.log(`    Permisos:`, myPermissions);
  });
  
  // 3. Total para el modal
  const totalForModal = [...myPrimaryClasses, ...sharedClasses];
  console.log(`\n📱 TOTAL CLASES PARA MODAL: ${totalForModal.length}`);
  totalForModal.forEach(cls => {
    const isPrimary = cls.teacherId === currentUserId;
    const type = isPrimary ? 'PRINCIPAL' : 'COMPARTIDA';
    console.log(`  - ${cls.name} (${type})`);
  });
  
  console.log('\n🎯 RESULTADO ESPERADO:');
  console.log('✅ Si ves "Orquesta Sinfónica" en COMPARTIDA, la lógica funciona!');
  console.log('✅ "Mi Clase Principal" debe aparecer como PRINCIPAL');
  console.log('❌ "Coro Mixto" NO debe aparecer (día diferente)');
  
  return { totalForModal, sharedClasses, myPrimaryClasses };
}

// Para ejecutar en la consola del navegador
if (typeof window !== 'undefined') {
  window.testSharedClassesLogic = testSharedClassesLogic;
  console.log('🎵 Script cargado. Usa testSharedClassesLogic() para probar la lógica.');
}

// Para ejecutar en Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testSharedClassesLogic };
}

// Auto-ejecutar si se ejecuta directamente
if (require.main === module) {
  testSharedClassesLogic();
}
