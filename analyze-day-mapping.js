// 🔍 ANÁLISIS DEL PROBLEMA DE MAPEO DE DÍAS
console.log('📊 ANÁLISIS DE ESTRUCTURA DE CLASES Y HORARIOS');
console.log('='.repeat(60));

// Simular datos de clase real basado en la imagen
const ejemploClase = {
  id: 'ensayo-general',
  name: 'Ensayo General',
  teacherId: 'profesor123',
  schedule: {
    slots: [
      { day: 'Martes', startTime: '17:00', endTime: '18:30' },
      { day: 'Jueves', startTime: '17:00', endTime: '18:30' },
      { day: 'Sábado', startTime: '09:00', endTime: '12:30' },
    ],
  },
};

console.log('🎯 Ejemplo de clase con horario (basado en la imagen):');
console.log(JSON.stringify(ejemploClase, null, 2));

console.log('\n📅 Días del calendario (weekDays):');
const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
weekDays.forEach((day, index) => {
  console.log(`${index}: ${day}`);
});

console.log('\n🔍 Días en schedule.slots:');
ejemploClase.schedule.slots.forEach((slot, index) => {
  console.log(`Slot ${index}: ${slot.day}`);
});

console.log('\n❌ PROBLEMA IDENTIFICADO:');
console.log('- Calendar usa: Dom, Lun, Mar, Mié, Jue, Vie, Sáb (abreviado)');
console.log('- Schedule usa: Martes, Jueves, Sábado (completo)');
console.log('- La función actual no mapea correctamente los formatos');
console.log('- Domingo 6 de julio 2025 muestra clase cuando NO debería');

// Mapeo completo y robusto
const dayMapping = {
  // Formato completo español -> Índice numérico (0=domingo)
  'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6,
  'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6,
  
  // Formato abreviado -> Índice numérico
  'dom': 0, 'lun': 1, 'mar': 2, 'mié': 3, 'jue': 4, 'vie': 5, 'sáb': 6,
  'Dom': 0, 'Lun': 1, 'Mar': 2, 'Mié': 3, 'Jue': 4, 'Vie': 5, 'Sáb': 6,
  
  // Formato sin acentos
  'miercoles': 3, 'sabado': 6,
};

console.log('\n🗺️ Mapeo de días:');
Object.entries(dayMapping).forEach(([key, value]) => {
  console.log(`${key} -> ${value} (${weekDays[value]})`);
});

// Función mejorada para obtener índice del día
function getDayIndex(dayString) {
  // Si ya es un número, retornarlo
  if (typeof dayString === 'number') return dayString;
  
  // Normalizar: quitar espacios, convertir a minúsculas
  const normalized = dayString.toString().toLowerCase().trim();
  
  // Buscar en el mapeo
  return dayMapping[normalized] ?? dayMapping[dayString] ?? -1;
}

console.log('\n🧪 PRUEBAS CON DATOS REALES:');
const testDays = ['Martes', 'Jueves', 'Sábado', 'Domingo', 'Miércoles', 'Dom', 'Lun'];
testDays.forEach(day => {
  const index = getDayIndex(day);
  const isValid = index !== -1;
  console.log(`${day.padEnd(10)} -> ${index} (${isValid ? weekDays[index] : 'ERROR'})`);
});

// Simular el problema: Domingo 6 de julio 2025
console.log('\n🔍 VERIFICACIÓN DEL PROBLEMA:');
const domingoIndex = 0; // Domingo es 0 en JavaScript
const claseDays = ejemploClase.schedule.slots.map(slot => getDayIndex(slot.day));

console.log(`Fecha analizada: Domingo 6 de julio 2025 (índice ${domingoIndex})`);
console.log(`Días de la clase: ${claseDays} -> [${claseDays.map(i => weekDays[i]).join(', ')}]`);
console.log(`¿Debería mostrar clase? ${claseDays.includes(domingoIndex) ? '❌ SÍ (ERROR)' : '✅ NO (CORRECTO)'}`);

// Verificar otros días
console.log('\n📊 VERIFICACIÓN COMPLETA DE LA SEMANA:');
weekDays.forEach((dayName, dayIndex) => {
  const shouldShow = claseDays.includes(dayIndex);
  const status = shouldShow ? '✅ MOSTRAR' : '❌ NO MOSTRAR';
  console.log(`${dayName} (${dayIndex}): ${status}`);
});

console.log('\n✅ SOLUCIÓN PROPUESTA:');
console.log('1. Crear mapeo robusto de nombres de días');
console.log('2. Actualizar hasScheduledClasses() para usar el mapeo correcto');
console.log('3. Verificar que domingo NO muestre la clase');
console.log('4. Verificar que martes, jueves y sábado SÍ muestren la clase');
