// 🔬 TEST ESPECÍFICO PARA EL PROBLEMA DEL DOMINGO
// Este script simula exactamente los datos que vemos en la consola

console.log('🔬 TEST ESPECÍFICO: DOMINGO 6 JULIO 2025');
console.log('='.repeat(50));

// Simular la fecha exacta
const testDate = new Date('2025-07-06'); // Domingo
const dayOfWeek = testDate.getDay(); // 0

console.log(`📅 Fecha de prueba: ${testDate.toDateString()}`);
console.log(`📅 getDay() = ${dayOfWeek} (0=Domingo)`);

// Datos exactos según lo que vimos en los logs
const teacherId = 'gUnL52HTsqhpdgpZG0'; // Del log de la consola
const ensayoGeneralClass = {
  id: 'class-id-ensayo',
  name: 'Ensayo General', 
  teacherId: teacherId,
  schedule: {
    slots: [
      { day: 'Martes', startTime: '17:00', endTime: '18:30' },
      { day: 'Jueves', startTime: '17:00', endTime: '18:30' },
      { day: 'Sábado', startTime: '09:00', endTime: '12:30' }
    ]
  }
};

// Función getDayIndex exacta
const getDayIndex = (dayString) => {
  if (typeof dayString === 'number') return dayString;

  const dayMapping = {
    domingo: 0, lunes: 1, martes: 2, miércoles: 3, jueves: 4, viernes: 5, sábado: 6,
    Domingo: 0, Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6,
    dom: 0, lun: 1, mar: 2, mié: 3, jue: 4, vie: 5, sáb: 6,
    Dom: 0, Lun: 1, Mar: 2, Mié: 3, Jue: 4, Vie: 5, Sáb: 6,
    miercoles: 3, sabado: 6
  };

  const normalized = String(dayString).trim();
  if (dayMapping[normalized] !== undefined) {
    return dayMapping[normalized];
  }
  
  const lowercased = normalized.toLowerCase();
  return dayMapping[lowercased] ?? -1;
};

// Función isClassScheduledForDay exacta
const isClassScheduledForDay = (cls, targetDay) => {
  const schedule = cls.schedule;
  if (!schedule) {
    console.log(`❌ Clase ${cls.name}: NO tiene schedule`);
    return false;
  }

  let slots = [];
  if (schedule.slots && Array.isArray(schedule.slots)) {
    slots = schedule.slots;
  } else if (schedule.day) {
    slots = [schedule];
  }

  console.log(`🔍 Clase ${cls.name}: Verificando ${slots.length} slots para día ${targetDay}`);
  
  const hasMatch = slots.some((slot, index) => {
    const slotDayIndex = getDayIndex(slot.day);
    const matches = slotDayIndex === targetDay;
    console.log(`  📝 Slot ${index}: "${slot.day}" -> ${slotDayIndex}, objetivo ${targetDay}: ${matches ? '✅ MATCH' : '❌ no match'}`);
    return matches;
  });

  console.log(`📊 Clase ${cls.name}: Resultado = ${hasMatch}`);
  return hasMatch;
};

// TEST ESPECÍFICO
console.log('\n🧪 TEST CON ENSAYO GENERAL:');
console.log('Datos de la clase:');
console.log(JSON.stringify(ensayoGeneralClass, null, 2));

console.log('\n🎯 VERIFICACIÓN PARA DOMINGO:');
const result = isClassScheduledForDay(ensayoGeneralClass, 0);

console.log('\n📋 RESUMEN:');
console.log(`Clase: ${ensayoGeneralClass.name}`);
console.log(`Profesor: ${ensayoGeneralClass.teacherId}`);
console.log(`Horarios: ${ensayoGeneralClass.schedule.slots.map(s => s.day).join(', ')}`);
console.log(`¿Debería aparecer el domingo?: ${result ? '❌ SÍ (ERROR)' : '✅ NO (CORRECTO)'}`);

// VERIFICACIÓN ADICIONAL: ¿Podría ser un problema de datos?
console.log('\n🔍 ANÁLISIS ADICIONAL:');
console.log('¿Posibles causas si el resultado es incorrecto?');
console.log('1. Los datos reales tienen formato diferente');
console.log('2. Hay lógica adicional que sobrescribe el resultado');
console.log('3. El problema está en otra parte del código');
console.log('4. Hay registros de asistencia que fuerzan mostrar el día');

// Simular el filtro completo como en TeacherHome
console.log('\n⚙️ SIMULACIÓN DEL FILTRO COMPLETO:');
const allClasses = [ensayoGeneralClass];
const filteredClasses = allClasses.filter(cls => {
  const isTeacher = cls.teacherId === teacherId;
  const isScheduled = isClassScheduledForDay(cls, dayOfWeek);
  console.log(`🎭 isTeacher: ${isTeacher}, isScheduled: ${isScheduled}`);
  return isTeacher && isScheduled;
});

console.log(`\n🏁 RESULTADO FINAL: ${filteredClasses.length} clases filtradas`);
if (filteredClasses.length > 0) {
  console.log('❌ ERROR: La clase aparece cuando NO debería');
} else {
  console.log('✅ CORRECTO: La clase NO aparece');
}
