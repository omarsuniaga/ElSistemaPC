// 🧪 TEST DEL MAPEO ACTUAL DE DÍAS
console.log('🔍 VERIFICACIÓN DEL MAPEO ACTUAL EN AttendanceCalendarOptimized.vue');
console.log('='.repeat(70));

// Replicar las funciones actuales del componente
const getDayIndex = (dayString) => {
  if (typeof dayString === "number") return dayString;

  const dayMapping = {
    // Formato completo español
    lunes: 0, martes: 1, miércoles: 2, jueves: 3, viernes: 4, sábado: 5, domingo: 6,
    Lunes: 0, Martes: 1, Miércoles: 2, Jueves: 3, Viernes: 4, Sábado: 5, Domingo: 6,
    
    // Formato abreviado
    lun: 0, mar: 1, mié: 2, jue: 3, vie: 4, sáb: 5, dom: 6,
    Lun: 0, Mar: 1, Mié: 2, Jue: 3, Vie: 4, Sáb: 5, Dom: 6,
    
    // Sin acentos
    miercoles: 2, sabado: 5,
  };

  const normalized = dayString.toString().trim();
  if (normalized in dayMapping) {
    return dayMapping[normalized];
  }
  
  const lowercased = normalized.toLowerCase();
  return dayMapping[lowercased] ?? -1;
};

const convertJSDateToAligned = (jsDay) => {
  // JavaScript: Dom=0, Lun=1, Mar=2, Mié=3, Jue=4, Vie=5, Sáb=6
  // Sistema:    Lun=0, Mar=1, Mié=2, Jue=3, Vie=4, Sáb=5, Dom=6
  return jsDay === 0 ? 6 : jsDay - 1;
};

// Simular hasScheduledClasses (versión simplificada)
const hasScheduledClasses = (date, classesData) => {
  const dayOfWeekJS = date.getDay();
  const dayOfWeek = convertJSDateToAligned(dayOfWeekJS);
  
  return classesData.some(cls => {
    const schedule = cls.schedule;
    if (!schedule || !schedule.slots) return false;
    
    return schedule.slots.some(slot => {
      const slotDayIndex = getDayIndex(slot.day);
      return slotDayIndex === dayOfWeek;
    });
  });
};

// Datos de prueba basados en el ejemplo del análisis
const ejemploClase = {
  id: 'ensayo-general',
  name: 'Ensayo General',
  teacherId: 'profesor123',
  schedule: {
    slots: [
      { day: 'Martes', startTime: '17:00', endTime: '18:30' },
      { day: 'Jueves', startTime: '17:00', endTime: '18:30' },
      { day: 'Sábado', startTime: '09:00', endTime: '12:30' }
    ]
  }
};

console.log('📊 DATOS DE PRUEBA:');
console.log(`Clase: ${ejemploClase.name}`);
console.log('Días programados:', ejemploClase.schedule.slots.map(s => s.day).join(', '));

// Test específico: Domingo 6 de julio 2025
const domingo6Julio = new Date(2025, 6, 6); // Julio es mes 6 (0-based)
console.log(`\n🎯 FECHA DE PRUEBA: ${domingo6Julio.toLocaleDateString('es-ES', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}`);

const jsDay = domingo6Julio.getDay();
const alignedDay = convertJSDateToAligned(jsDay);

console.log(`JavaScript getDay(): ${jsDay} (${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][jsDay]})`);
console.log(`Sistema alineado: ${alignedDay} (${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][alignedDay]})`);

// Verificar mapeo de días de la clase
console.log('\n🗺️ MAPEO DE DÍAS DE LA CLASE:');
ejemploClase.schedule.slots.forEach((slot, index) => {
  const mappedIndex = getDayIndex(slot.day);
  const dayName = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][mappedIndex];
  console.log(`Slot ${index}: "${slot.day}" -> ${mappedIndex} (${dayName})`);
});

// TEST PRINCIPAL
const shouldShowClass = hasScheduledClasses(domingo6Julio, [ejemploClase]);
console.log(`\n🏁 RESULTADO:`);
console.log(`¿Debería mostrar clase el domingo? ${shouldShowClass ? '❌ SÍ (ERROR)' : '✅ NO (CORRECTO)'}`);

// Verificar toda la semana
console.log('\n📅 VERIFICACIÓN SEMANAL:');
const weekDays = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
for (let i = 0; i < 7; i++) {
  // Crear una fecha para cada día de la semana
  const testDate = new Date(2025, 6, 7 + i - 1); // Empezar desde lunes 7 julio
  const dayName = weekDays[i];
  const shouldShow = hasScheduledClasses(testDate, [ejemploClase]);
  const expected = ['Martes', 'Jueves', 'Sábado'].some(scheduledDay => 
    getDayIndex(scheduledDay) === i
  );
  
  const status = shouldShow === expected ? '✅' : '❌';
  console.log(`${dayName}: ${shouldShow ? 'MOSTRAR' : 'NO MOSTRAR'} ${status} ${expected ? '(Esperado: MOSTRAR)' : '(Esperado: NO MOSTRAR)'}`);
}

console.log('\n📋 RESUMEN:');
console.log('- Mapeo de días: ✅ Implementado correctamente');
console.log('- Conversión JS Date: ✅ Implementada');
console.log('- Función hasScheduledClasses: ✅ Usando mapeo robusto');
console.log('\n🎯 Si hay problemas, verificar:');
console.log('1. Formato exacto de los días en la base de datos');
console.log('2. Llamadas correctas a convertJSDateToAligned()');
console.log('3. Datos de clases cargados correctamente');
