// 🔧 DIAGNÓSTICO AVANZADO DEL PROBLEMA DE CALENDARIO
// Vamos a inspeccionar los datos reales del sistema

console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA');
console.log('='.repeat(60));

// Simular la fecha problemática: Domingo 6 de julio 2025
const problemDate = new Date('2025-07-06'); // Domingo
const dayOfWeek = problemDate.getDay(); // 0 = Domingo

console.log('📅 FECHA PROBLEMÁTICA:');
console.log(`Fecha: ${problemDate.toDateString()}`);
console.log(`Día de la semana: ${dayOfWeek} (0=Domingo)`);
console.log(`getDay() retorna: ${problemDate.getDay()}`);

// Datos simulados basados en lo que vemos en la consola
const classesMockData = [
  {
    id: 'class-1',
    name: 'Ensayo General',
    teacherId: 'teacher-123',
    schedule: {
      slots: [
        { day: 'Martes', startTime: '17:00', endTime: '18:30' },
        { day: 'Jueves', startTime: '17:00', endTime: '18:30' },
        { day: 'Sábado', startTime: '09:00', endTime: '12:30' }
      ]
    }
  }
];

// Función getDayIndex corregida
const getDayIndex = (dayString) => {
  if (typeof dayString === 'number') return dayString;

  // Mapeo más exhaustivo
  const dayMapping = {
    // Español completo
    'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6,
    'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6,
    
    // Abreviado
    'dom': 0, 'lun': 1, 'mar': 2, 'mié': 3, 'jue': 4, 'vie': 5, 'sáb': 6,
    'Dom': 0, 'Lun': 1, 'Mar': 2, 'Mié': 3, 'Jue': 4, 'Vie': 5, 'Sáb': 6,
    
    // Sin acentos
    'miercoles': 3, 'sabado': 6,
    'Miercoles': 3, 'Sabado': 6,
    
    // Inglés (por si acaso)
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6,
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6,
    
    // Números como string
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6
  };

  const normalized = String(dayString).trim();
  
  // Buscar exacto primero
  if (dayMapping.hasOwnProperty(normalized)) {
    return dayMapping[normalized];
  }
  
  // Buscar en minúsculas
  const lowercased = normalized.toLowerCase();
  if (dayMapping.hasOwnProperty(lowercased)) {
    return dayMapping[lowercased];
  }
  
  console.warn(`⚠️ Día no reconocido: "${dayString}" (normalizado: "${normalized}")`);
  return -1;
};

console.log('\n🧪 PRUEBAS DE MAPEO:');
const testValues = ['Martes', 'Jueves', 'Sábado', 'Domingo', 'martes', 'MARTES', 2, '2', 'Tuesday'];
testValues.forEach(day => {
  const result = getDayIndex(day);
  console.log(`${String(day).padEnd(8)} -> ${result}`);
});

console.log('\n🔍 ANÁLISIS DE LA CLASE PROBLEMÁTICA:');
const testClass = classesMockData[0];
console.log(`Clase: ${testClass.name}`);
console.log('Slots de horario:');

testClass.schedule.slots.forEach((slot, index) => {
  const dayIndex = getDayIndex(slot.day);
  console.log(`  Slot ${index}: "${slot.day}" -> índice ${dayIndex}`);
});

console.log('\n📊 VERIFICACIÓN DOMINGO:');
const expectedDays = testClass.schedule.slots.map(slot => getDayIndex(slot.day));
console.log(`Días esperados: [${expectedDays.join(', ')}] -> [${expectedDays.map(d => ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]).join(', ')}]`);
console.log(`Domingo (0) está incluido: ${expectedDays.includes(0) ? '❌ SÍ (ERROR)' : '✅ NO (CORRECTO)'}`);

// Simular hasScheduledClasses
const hasScheduledClasses = (dayOfWeek, classes, teacherId = 'teacher-123') => {
  return classes.some(cls => {
    if (cls.teacherId !== teacherId) return false;
    
    const schedule = cls.schedule;
    if (!schedule) return false;
    
    let slots = [];
    if (schedule.slots && Array.isArray(schedule.slots)) {
      slots = schedule.slots;
    } else if (schedule.day) {
      slots = [schedule];
    }
    
    const hasMatch = slots.some(slot => {
      const slotDayIndex = getDayIndex(slot.day);
      const matches = slotDayIndex === dayOfWeek;
      console.log(`    Comparando slot "${slot.day}" (${slotDayIndex}) con día ${dayOfWeek}: ${matches ? 'MATCH' : 'no match'}`);
      return matches;
    });
    
    return hasMatch;
  });
};

console.log('\n🎯 SIMULACIÓN hasScheduledClasses:');
console.log('Para domingo (6 julio 2025):');
const result = hasScheduledClasses(0, classesMockData, 'teacher-123');
console.log(`Resultado: ${result ? '❌ SÍ muestra clase (ERROR)' : '✅ NO muestra clase (CORRECTO)'}`);

console.log('\n🔧 POSIBLES PROBLEMAS:');
console.log('1. ¿Los datos reales tienen formato diferente?');
console.log('2. ¿Hay lógica adicional que fuerza mostrar clases?');
console.log('3. ¿El teacherId no coincide?');
console.log('4. ¿Hay registros de asistencia que fuerzan mostrar el día?');

console.log('\n✅ RECOMENDACIONES:');
console.log('1. Agregar logs detallados en las funciones reales');
console.log('2. Verificar datos exactos del classesStore');
console.log('3. Revisar lógica de hasAttendanceRecords');
console.log('4. Verificar filtros de teacherId');
