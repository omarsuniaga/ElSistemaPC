// 🧪 Script de prueba para verificar el nuevo mapeo LUNES=0
// Ejecutar en browser console para verificar la conversión

// Función de conversión JavaScript → LUNES=0
function convertJSDateToAligned(jsDay) {
  // JavaScript: Dom=0, Lun=1, Mar=2, Mié=3, Jue=4, Vie=5, Sáb=6
  // Nuestro:   Lun=0, Mar=1, Mié=2, Jue=3, Vie=4, Sáb=5, Dom=6
  return jsDay === 0 ? 6 : jsDay - 1;
}

// Función de prueba
function testNewDayMappingLunes0() {
  console.log('🧪 === PRUEBA DEL NUEVO MAPEO LUNES=0 ===');
  
  // Fecha de prueba: domingo 6 de julio de 2025
  const testDateSunday = new Date('2025-07-06');
  const jsDaySunday = testDateSunday.getDay(); // JavaScript: domingo = 0
  const alignedDaySunday = convertJSDateToAligned(jsDaySunday); // Nuestro: domingo = 6
  
  console.log('📅 Domingo 6 julio 2025:');
  console.log(`   JavaScript format: ${jsDaySunday} (domingo)`);
  console.log(`   LUNES=0 format: ${alignedDaySunday} (domingo)`);
  console.log(`   ✅ Conversión correcta: ${alignedDaySunday === 6 ? 'SÍ' : 'NO'}`);
  
  // Mapeo completo de la semana
  const days = [
    '2025-07-06', // Domingo
    '2025-07-07', // Lunes  
    '2025-07-08', // Martes
    '2025-07-09', // Miércoles
    '2025-07-10', // Jueves
    '2025-07-11', // Viernes
    '2025-07-12',  // Sábado
  ];
  
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  console.log('\n📅 === MAPEO COMPLETO DE LA SEMANA (LUNES=0) ===');
  days.forEach((dateStr) => {
    const date = new Date(dateStr);
    const jsDay = date.getDay();
    const alignedDay = convertJSDateToAligned(jsDay);
    const dayName = dayNames[jsDay];
    
    console.log(`${dateStr} (${dayName}): JS=${jsDay} → LUNES=0=${alignedDay}`);
  });
  
  // Verificación específica para "Ensayo General"
  console.log('\n🎭 === VERIFICACIÓN ENSAYO GENERAL (LUNES=0) ===');
  console.log('"Ensayo General" está programado para:');
  
  // En formato LUNES=0: Martes=1, Jueves=3, Sábado=5
  console.log(`- Martes (LUNES=0 format = 1): ${convertJSDateToAligned(new Date('2025-07-08').getDay()) === 1 ? '✅' : '❌'}`);
  console.log(`- Jueves (LUNES=0 format = 3): ${convertJSDateToAligned(new Date('2025-07-10').getDay()) === 3 ? '✅' : '❌'}`);
  console.log(`- Sábado (LUNES=0 format = 5): ${convertJSDateToAligned(new Date('2025-07-12').getDay()) === 5 ? '✅' : '❌'}`);
  
  console.log('\n❌ NO debe aparecer en:');
  const sundayAligned = convertJSDateToAligned(new Date('2025-07-06').getDay());
  console.log(`- Domingo (LUNES=0 format = 6): ${sundayAligned === 6 ? 'CORRECTO - no debe aparecer en 1,3,5' : 'ERROR'}`);
  
  // Verificación de la lógica de filtrado
  console.log('\n🔍 === LÓGICA DE FILTRADO ===');
  console.log('Si "Ensayo General" tiene slots para [martes, jueves, sábado]:');
  console.log('- En formato LUNES=0: [1, 3, 5]');
  console.log(`- Domingo convertido: ${sundayAligned}`);
  console.log(`- ¿${sundayAligned} está en [1, 3, 5]? ${[1, 3, 5].includes(sundayAligned) ? 'SÍ (PROBLEMA)' : 'NO (CORRECTO)'}`);
  
  return {
    sundayJS: jsDaySunday,
    sundayAligned: alignedDaySunday,
    conversionWorking: alignedDaySunday === 6,
    shouldNotMatch: ![1, 3, 5].includes(sundayAligned),
  };
}

// Ejecutar la prueba
const result = testNewDayMappingLunes0();
console.log(`\n🎯 Resultado final: ${result.conversionWorking && result.shouldNotMatch ? 'CONVERSIÓN EXITOSA - PROBLEMA RESUELTO' : 'CONVERSIÓN FALLIDA'}`);
