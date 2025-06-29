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
  console.log(`\n� Mis clases principales: ${myPrimaryClasses.length}`);
  myPrimaryClasses.forEach(cls => console.log(`  - ${cls.name}`));
  
  // 2. Clases compartidas donde soy colaborador (LÓGICA CORREGIDA)
  const sharedClasses = sampleClasses.filter(cls => {
    // Verificar si estoy en el array de teachers
    const isCollaborator = cls.teachers?.some(teacher => teacher.teacherId === currentUserId);
    if (!isCollaborator) {
      console.log(`  ⏭️  ${cls.name}: No estoy en teachers array`);
      return false;
    }
    
    // Verificar que NO sea el profesor principal (evitar duplicados)
    if (cls.teacherId === currentUserId) {
      console.log(`  ⏭️  ${cls.name}: Soy el profesor principal`);
      return false;
    }
    
    // Verificar si la clase está programada para este día
    const hasSlotForDay = cls.schedule?.slots?.some(slot => {
      const slotDay = slot.day?.toLowerCase();
      return slotDay === dayOfWeek;
    });
    
    if (!hasSlotForDay) {
      console.log(`  ⏭️  ${cls.name}: No tiene horario para ${dayOfWeek}`);
      return false;
    }
    
    console.log(`  ✅ ${cls.name}: Cumple todos los criterios`);
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
  console.log(`\n� TOTAL CLASES PARA MODAL: ${totalForModal.length}`);
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

// Ejecutar test automáticamente
window.testSharedClassesLogic = testSharedClassesLogic;
  console.log('2. Verifica que aparezcan las clases demo');
  console.log('3. Prueba los filtros (Todas, Mis clases, Compartidas conmigo)');
  console.log('4. Haz clic en "Compartir Nueva Clase"');
  console.log('5. Prueba editar permisos de una clase');
  
  console.log('\n✨ Sistema listo para pruebas!');
};

// Auto-ejecutar en modo desarrollo
if (window.location.hostname === 'localhost') {
  console.log('🔧 Modo desarrollo detectado');
  console.log('💡 Ejecuta testSharedClasses() para probar el sistema');
}

// Verificar errores en tiempo real
window.addEventListener('error', (event) => {
  if (event.message.includes('SharedClassesList') || event.message.includes('length')) {
    console.error('🚨 Error detectado en SharedClassesList:', event.message);
    console.log('🔧 Posible solución: Recargar la página o verificar props');
  }
});

console.log('🎵 Script de prueba cargado. Usa testSharedClasses() para verificar el sistema.');
