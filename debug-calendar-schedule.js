// 🎯 Script de debug para el sistema de calendario y horarios
// Ejecutar en la consola del navegador desde la vista de calendario de asistencia

console.log('🔧 [DEBUG] Iniciando verificación del sistema de calendario y horarios...');

// Función para verificar el mapeo de horarios
function debugScheduleMapping() {
  console.log('📅 [DEBUG] === VERIFICACIÓN DE MAPEO DE HORARIOS ===');
  
  // Simular data de prueba si no existe
  if (typeof classesStore === 'undefined') {
    console.log('⚠️ [DEBUG] classesStore no disponible, creando datos de prueba...');
    
    window.debugData = {
      classes: [
        {
          id: 'class1',
          name: 'Piano Básico Lunes',
          teacherId: 'teacher1',
          schedule: {
            slots: [
              { day: 'lunes', startTime: '09:00', endTime: '10:00' },
              { day: 'miércoles', startTime: '09:00', endTime: '10:00' },
            ],
          },
        },
        {
          id: 'class2', 
          name: 'Guitarra Martes',
          teacherId: 'teacher1',
          schedule: {
            slots: [
              { day: 'martes', startTime: '14:00', endTime: '15:00' },
              { day: 'jueves', startTime: '14:00', endTime: '15:00' },
            ],
          },
        },
        {
          id: 'class3',
          name: 'Violín Numérico',
          teacherId: 'teacher1', 
          schedule: {
            slots: [
              { day: 1, startTime: '16:00', endTime: '17:00' }, // 1 = lunes
              { day: 3, startTime: '16:00', endTime: '17:00' },  // 3 = miércoles
            ],
          },
        },
        {
          id: 'class4',
          name: 'Clase Compartida',
          teacherId: 'teacher2',
          teachers: [
            { teacherId: 'teacher1', role: 'assistant' },
          ],
          schedule: {
            slots: [
              { day: 'viernes', startTime: '10:00', endTime: '11:00' },
            ],
          },
        },
      ],
      currentTeacherId: 'teacher1',
    };
  }
  
  const today = new Date();
  console.log('📅 Fecha actual:', today.toISOString().split('T')[0]);
  console.log('📅 Día de la semana actual:', today.getDay(), getDayName(today.getDay()));
  
  // Probar diferentes fechas de la semana
  const testDates = [];
  for (let i = 0; i < 7; i++) {
    const testDate = new Date(today);
    testDate.setDate(today.getDate() - today.getDay() + i); // Ajustar a la semana actual
    testDates.push(testDate);
  }
  
  console.log('\n🔍 [DEBUG] Verificando clases para cada día de la semana:');
  testDates.forEach((date, index) => {
    const dayName = getDayName(date.getDay());
    const dayNumber = date.getDay();
    
    console.log(`\n📆 ${dayName} (${dayNumber}) - ${date.toISOString().split('T')[0]}:`);
    
    // Simular la lógica de hasScheduledClasses
    const classesForDay = debugData.classes.filter(cls => {
      const teacherId = debugData.currentTeacherId;
      
      // Verificar si es una clase del maestro
      const isPrimary = cls.teacherId === teacherId;
      const isCollaborator = cls.teachers?.some(t => t.teacherId === teacherId);
      
      if (!isPrimary && !isCollaborator) return false;
      
      // Verificar horario
      const schedule = cls.schedule;
      if (!schedule || !schedule.slots) return false;
      
      return schedule.slots.some(slot => {
        if (typeof slot.day === 'number') {
          return slot.day === dayNumber;
        } else if (typeof slot.day === 'string') {
          return slot.day.toLowerCase() === dayName.toLowerCase();
        }
        return false;
      });
    });
    
    if (classesForDay.length > 0) {
      classesForDay.forEach(cls => {
        const relevantSlot = cls.schedule.slots.find(slot => {
          if (typeof slot.day === 'number') {
            return slot.day === dayNumber;
          } else if (typeof slot.day === 'string') {
            return slot.day.toLowerCase() === dayName.toLowerCase();
          }
          return false;
        });
        
        console.log(`  ✅ ${cls.name} (${relevantSlot?.startTime}-${relevantSlot?.endTime})`);
      });
    } else {
      console.log('  ❌ Sin clases programadas');
    }
  });
}

// Función auxiliar para obtener nombre del día
function getDayName(dayNum) {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[dayNum];
}

// Función para verificar el modal de clases
function debugClassModal() {
  console.log('\n🎭 [DEBUG] === VERIFICACIÓN DEL MODAL DE CLASES ===');
  
  const testDate = '2024-07-08'; // Lunes
  console.log(`📅 Fecha de prueba: ${testDate}`);
  
  // Simular obtener clases para una fecha específica
  const parsedDate = new Date(testDate + 'T12:00:00');
  const dayOfWeek = parsedDate.getDay(); // 1 = lunes
  const dayName = getDayName(dayOfWeek);
  
  console.log(`📅 Día de la semana: ${dayName} (${dayOfWeek})`);
  
  // Filtrar clases usando la misma lógica que el modal
  const classesForDate = debugData.classes.filter(cls => {
    const teacherId = debugData.currentTeacherId;
    const isPrimary = cls.teacherId === teacherId;
    const isCollaborator = cls.teachers?.some(t => t.teacherId === teacherId);
    
    if (!isPrimary && !isCollaborator) return false;
    
    const schedule = cls.schedule;
    if (!schedule || !schedule.slots) return false;
    
    return schedule.slots.some(slot => {
      if (typeof slot.day === 'number') {
        return slot.day === dayOfWeek;
      } else if (typeof slot.day === 'string') {
        return slot.day.toLowerCase() === dayName;
      }
      return false;
    });
  });
  
  console.log(`🎯 Clases encontradas para ${testDate}:`, classesForDate.length);
  classesForDate.forEach(cls => {
    console.log(`  📚 ${cls.name}`);
    if (cls.teacherId === debugData.currentTeacherId) {
      console.log('    👨‍🏫 Profesor principal');
    } else {
      console.log('    🤝 Profesor colaborador');
    }
  });
}

// Función para verificar problemas comunes
function debugCommonIssues() {
  console.log('\n🔧 [DEBUG] === VERIFICACIÓN DE PROBLEMAS COMUNES ===');
  
  const issues = [];
  
  // Verificar estructura de datos
  debugData.classes.forEach(cls => {
    if (!cls.schedule) {
      issues.push(`❌ Clase "${cls.name}" sin schedule`);
    } else if (!cls.schedule.slots) {
      issues.push(`❌ Clase "${cls.name}" sin slots en schedule`);
    } else if (!Array.isArray(cls.schedule.slots)) {
      issues.push(`❌ Clase "${cls.name}" slots no es array`);
    } else {
      cls.schedule.slots.forEach((slot, index) => {
        if (!slot.day) {
          issues.push(`❌ Clase "${cls.name}" slot ${index} sin day`);
        }
        if (!slot.startTime) {
          issues.push(`❌ Clase "${cls.name}" slot ${index} sin startTime`);
        }
        if (!slot.endTime) {
          issues.push(`❌ Clase "${cls.name}" slot ${index} sin endTime`);
        }
      });
    }
  });
  
  if (issues.length === 0) {
    console.log('✅ No se encontraron problemas estructurales');
  } else {
    console.log('⚠️ Problemas encontrados:');
    issues.forEach(issue => console.log(`  ${issue}`));
  }
}

// Ejecutar todas las verificaciones
debugScheduleMapping();
debugClassModal();
debugCommonIssues();

console.log('\n🎯 [DEBUG] === RESUMEN ===');
console.log('✅ Script de debug completado');
console.log('📋 Verificaciones realizadas:');
console.log('  1. Mapeo de horarios semanales');
console.log('  2. Lógica del modal de clases');
console.log('  3. Problemas estructurales');
console.log('\n💡 Para usar en producción:');
console.log('  - Abrir vista de calendario de asistencia');
console.log('  - Verificar que aparezcan indicadores en días con clases');
console.log('  - Hacer clic en fechas y verificar que aparezcan clases en el modal');

// Exportar función para uso manual
window.debugCalendarSchedule = {
  debugScheduleMapping,
  debugClassModal,
  debugCommonIssues,
};
