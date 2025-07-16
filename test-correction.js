// Test final para verificar que la corrección funciona
console.log('=== PRUEBA FINAL: Lógica de Días Corregida ===');

// Simular el problema específico de "Ensayo General"
const ensayoGeneralSlots = [
  { day: 2, startTime: '10:00', endTime: '12:00' }, // Martes
  { day: 4, startTime: '10:00', endTime: '12:00' }, // Jueves  
  { day: 6, startTime: '10:00', endTime: '12:00' }, // Sábado
];

// Función corregida (como está ahora en el código)
function isClassScheduledForDay(slots, targetDayName) {
  const dayNames = [
    'domingo',
    'lunes', 
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
  ];
  
  return slots.some(slot => {
    const slotDayName = dayNames[slot.day];
    return slotDayName === targetDayName.toLowerCase();
  });
}

// Función antigua (problemática)
function isClassScheduledForDayOLD(slots, targetDayName) {
  return slots.some(slot => {
    const incorrectDate = new Date(2024, 0, slot.day + 1);
    const slotDayName = incorrectDate.toLocaleDateString('es-ES', { weekday: 'long' });
    return slotDayName === targetDayName.toLowerCase();
  });
}

// Probar para cada día de la semana
const testDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

console.log('\n🔍 PRUEBAS PARA ENSAYO GENERAL:');
console.log('Horarios programados: Martes (2), Jueves (4), Sábado (6)\n');

testDays.forEach(day => {
  const shouldShow = isClassScheduledForDay(ensayoGeneralSlots, day);
  const wouldShowOld = isClassScheduledForDayOLD(ensayoGeneralSlots, day);
  
  const expected = ['martes', 'jueves', 'sábado'].includes(day);
  const statusNew = shouldShow === expected ? '✅ CORRECTO' : '❌ ERROR';
  const statusOld = wouldShowOld === expected ? '✅ CORRECTO' : '❌ ERROR';
  
  console.log(`${day.toUpperCase()}:`);
  console.log(`  Nueva lógica: ${shouldShow} ${statusNew}`);
  console.log(`  Lógica vieja: ${wouldShowOld} ${statusOld}`);
  console.log('');
});

// Verificación específica del problema reportado
console.log('🎯 VERIFICACIÓN DEL PROBLEMA ESPECÍFICO:');
console.log('¿Aparece \'Ensayo General\' el SÁBADO? (debería ser SÍ)');
console.log(`Nueva lógica: ${isClassScheduledForDay(ensayoGeneralSlots, 'sábado') ? 'SÍ ✅' : 'NO ❌'}`);
console.log(`Lógica vieja: ${isClassScheduledForDayOLD(ensayoGeneralSlots, 'sábado') ? 'SÍ ✅' : 'NO ❌'}`);

console.log('\n¿Aparece \'Ensayo General\' el VIERNES? (debería ser NO)');
console.log(`Nueva lógica: ${isClassScheduledForDay(ensayoGeneralSlots, 'viernes') ? 'SÍ ❌' : 'NO ✅'}`);
console.log(`Lógica vieja: ${isClassScheduledForDayOLD(ensayoGeneralSlots, 'viernes') ? 'SÍ ❌' : 'NO ✅'}`);
