// 🧪 PRUEBA DE SOLUCIÓN DEL MAPEO DE DÍAS
console.log('🔧 VERIFICANDO SOLUCIÓN DE MAPEO DE DÍAS');
console.log('='.repeat(50));

// Función getDayIndex mejorada
const getDayIndex = (dayString) => {
  if (typeof dayString === 'number') return dayString;

  const dayMapping = {
    domingo: 0, lunes: 1, martes: 2, miércoles: 3, jueves: 4, viernes: 5, sábado: 6,
    Domingo: 0, Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6,
    dom: 0, lun: 1, mar: 2, mié: 3, jue: 4, vie: 5, sáb: 6,
    Dom: 0, Lun: 1, Mar: 2, Mié: 3, Jue: 4, Vie: 5, Sáb: 6,
    miercoles: 3, sabado: 6
  };

  const normalized = dayString.toString().trim();
  if (dayMapping[normalized] !== undefined) {
    return dayMapping[normalized];
  }
  
  const lowercased = normalized.toLowerCase();
  return dayMapping[lowercased] ?? -1;
};

// Datos de prueba basados en la imagen
const ejemploClase = {
  id: 'ensayo-general',
  name: 'Ensayo General',
  schedule: {
    slots: [
      { day: 'Martes', startTime: '17:00', endTime: '18:30' },
      { day: 'Jueves', startTime: '17:00', endTime: '18:30' },
      { day: 'Sábado', startTime: '09:00', endTime: '12:30' }
    ]
  }
};

// Simular hasScheduledClasses para el domingo 6 de julio 2025
const hasScheduledClasses = (dayOfWeek, clases) => {
  return clases.some(cls => {
    const schedule = cls.schedule;
    if (!schedule) return false;

    let slots = [];
    if (schedule.slots && Array.isArray(schedule.slots)) {
      slots = schedule.slots;
    } else if (schedule.day) {
      slots = [schedule];
    }

    return slots.some(slot => {
      const slotDayIndex = getDayIndex(slot.day);
      return slotDayIndex === dayOfWeek;
    });
  });
};

console.log('📅 VERIFICACIÓN DEL PROBLEMA:');
console.log('Clase: Ensayo General');
console.log('Horarios:', ejemploClase.schedule.slots.map(s => s.day).join(', '));

const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

console.log('\n🔍 VERIFICACIÓN DIARIA:');
weekDays.forEach((dayName, dayIndex) => {
  const shouldShow = hasScheduledClasses(dayIndex, [ejemploClase]);
  const expectedDays = [2, 4, 6]; // Martes, Jueves, Sábado
  const isExpected = expectedDays.includes(dayIndex);
  const status = shouldShow === isExpected ? '✅' : '❌';
  
  console.log(`${dayName} (${dayIndex}): ${shouldShow ? 'MOSTRAR' : 'NO MOSTRAR'} ${status}`);
});

console.log('\n🎯 VERIFICACIÓN ESPECÍFICA DEL DOMINGO:');
const domingoMuestraClase = hasScheduledClasses(0, [ejemploClase]);
console.log(`Domingo muestra clase: ${domingoMuestraClase ? '❌ SÍ (ERROR)' : '✅ NO (CORRECTO)'}`);

console.log('\n✅ RESUMEN:');
console.log('- Martes (2): SÍ debe mostrar');
console.log('- Jueves (4): SÍ debe mostrar');  
console.log('- Sábado (6): SÍ debe mostrar');
console.log('- Domingo (0): NO debe mostrar ← PROBLEMA ORIGINAL');

if (!domingoMuestraClase) {
  console.log('\n🎉 ¡PROBLEMA SOLUCIONADO!');
  console.log('El mapeo robusto de días funciona correctamente.');
} else {
  console.log('\n⚠️ Aún hay problemas en el mapeo.');
}
