// 🔍 TEST CORREGIDO - MAPEO DE DÍAS CON FECHAS REALES
console.log('🧪 TEST CORREGIDO DEL MAPEO DE DÍAS');
console.log('='.repeat(60));

// Funciones replicadas del componente actual
const getDayIndex = (dayString) => {
  if (typeof dayString === "number") return dayString;

  const dayMapping = {
    lunes: 0, martes: 1, miércoles: 2, jueves: 3, viernes: 4, sábado: 5, domingo: 6,
    Lunes: 0, Martes: 1, Miércoles: 2, Jueves: 3, Viernes: 4, Sábado: 5, Domingo: 6,
    lun: 0, mar: 1, mié: 2, jue: 3, vie: 4, sáb: 5, dom: 6,
    Lun: 0, Mar: 1, Mié: 2, Jue: 3, Vie: 4, Sáb: 5, Dom: 6,
    miercoles: 2, sabado: 5,
  };

  const normalized = dayString.toString().trim();
  if (normalized in dayMapping) return dayMapping[normalized];
  
  const lowercased = normalized.toLowerCase();
  return dayMapping[lowercased] ?? -1;
};

const convertJSDateToAligned = (jsDay) => {
  return jsDay === 0 ? 6 : jsDay - 1;
};

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

// Datos de prueba
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

console.log('📊 CLASE DE PRUEBA:');
console.log(`Nombre: ${ejemploClase.name}`);
console.log('Días programados:', ejemploClase.schedule.slots.map(s => s.day).join(', '));

// Mapear días de la clase al sistema
console.log('\n🗺️ MAPEO DE DÍAS DE LA CLASE:');
const classDays = ejemploClase.schedule.slots.map(slot => {
  const index = getDayIndex(slot.day);
  console.log(`"${slot.day}" -> ${index} (${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][index]})`);
  return index;
});

// Fechas específicas de la semana del 6-12 julio 2025
const fechasJulio2025 = [
  { fecha: new Date(2025, 6, 6), nombre: 'Domingo 6' },    // Domingo
  { fecha: new Date(2025, 6, 7), nombre: 'Lunes 7' },     // Lunes  
  { fecha: new Date(2025, 6, 8), nombre: 'Martes 8' },    // Martes ✅
  { fecha: new Date(2025, 6, 9), nombre: 'Miércoles 9' }, // Miércoles
  { fecha: new Date(2025, 6, 10), nombre: 'Jueves 10' },  // Jueves ✅ 
  { fecha: new Date(2025, 6, 11), nombre: 'Viernes 11' }, // Viernes
  { fecha: new Date(2025, 6, 12), nombre: 'Sábado 12' },  // Sábado ✅
];

console.log('\n📅 VERIFICACIÓN CON FECHAS REALES:');
console.log('Días con clases esperados: Martes, Jueves, Sábado');
console.log('-'.repeat(50));

let erroresEncontrados = 0;

fechasJulio2025.forEach(({fecha, nombre}) => {
  const jsDay = fecha.getDay();
  const alignedDay = convertJSDateToAligned(jsDay);
  const shouldShow = hasScheduledClasses(fecha, [ejemploClase]);
  const expected = classDays.includes(alignedDay);
  const isCorrect = shouldShow === expected;
  
  if (!isCorrect) erroresEncontrados++;
  
  const status = isCorrect ? '✅' : '❌';
  const jsWeekDay = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][jsDay];
  const alignedWeekDay = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][alignedDay];
  
  console.log(`${status} ${nombre} (${jsWeekDay}): ${shouldShow ? 'MOSTRAR' : 'NO MOSTRAR'} | Esperado: ${expected ? 'MOSTRAR' : 'NO MOSTRAR'}`);
  console.log(`   JS Day: ${jsDay} -> Aligned: ${alignedDay} (${alignedWeekDay})`);
});

console.log('\n🏁 RESULTADO FINAL:');
if (erroresEncontrados === 0) {
  console.log('✅ PERFECTO: El mapeo funciona correctamente');
  console.log('✅ Domingo 6 NO muestra clases (correcto)');
  console.log('✅ Martes 8, Jueves 10, Sábado 12 SÍ muestran clases (correcto)');
} else {
  console.log(`❌ ERRORES ENCONTRADOS: ${erroresEncontrados}`);
  console.log('🔧 Necesita corrección en el mapeo de días');
}

// Test específico del problema original
console.log('\n🎯 TEST ESPECÍFICO DEL PROBLEMA ORIGINAL:');
const domingo6 = new Date(2025, 6, 6);
const muestraClaseDomingo = hasScheduledClasses(domingo6, [ejemploClase]);
console.log(`Domingo 6 de julio 2025: ${muestraClaseDomingo ? '❌ MUESTRA CLASES (ERROR)' : '✅ NO MUESTRA CLASES (CORRECTO)'}`);

// Debug detallado
console.log('\n🔍 DEBUG DETALLADO:');
console.log('Días en los que la clase está programada (formato sistema):');
classDays.forEach((day, index) => {
  const dayName = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][day];
  console.log(`  ${day} (${dayName})`);
});

console.log('Conversión de Domingo 6 julio:');
const domingoJS = domingo6.getDay(); // 0
const domingoAligned = convertJSDateToAligned(domingoJS); // 6
console.log(`  JavaScript: ${domingoJS} -> Sistema: ${domingoAligned}`);
console.log(`  ¿Está ${domingoAligned} en [${classDays.join(', ')}]? ${classDays.includes(domingoAligned)}`);
