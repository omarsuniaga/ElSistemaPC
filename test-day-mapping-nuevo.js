// 🧪 Script de prueba para verificar el nuevo mapeo de días
// Ejecutar en browser console para verificar la conversión

// Función de conversión JavaScript → ISO
function convertJSDateToISO(jsDay) {
  return jsDay === 0 ? 7 : jsDay;
}

// Función de prueba
function testNewDayMapping() {
  console.log('🧪 === PRUEBA DEL NUEVO MAPEO DE DÍAS ===');
  
  // Fecha de prueba: domingo 6 de julio de 2025
  const testDateSunday = new Date('2025-07-06');
  const jsDaySunday = testDateSunday.getDay(); // JavaScript: domingo = 0
  const isoDaySunday = convertJSDateToISO(jsDaySunday); // ISO: domingo = 7
  
  console.log('📅 Domingo 6 julio 2025:');
  console.log(`   JavaScript format: ${jsDaySunday} (domingo)`);
  console.log(`   ISO format: ${isoDaySunday} (domingo)`);
  console.log(`   ✅ Conversión correcta: ${isoDaySunday === 7 ? 'SÍ' : 'NO'}`);
  
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
  
  console.log('\n📅 === MAPEO COMPLETO DE LA SEMANA ===');
  days.forEach((dateStr, index) => {
    const date = new Date(dateStr);
    const jsDay = date.getDay();
    const isoDay = convertJSDateToISO(jsDay);
    const dayName = dayNames[jsDay];
    
    console.log(`${dateStr} (${dayName}): JS=${jsDay} → ISO=${isoDay}`);
  });
  
  // Verificación específica para "Ensayo General"
  console.log('\n🎭 === VERIFICACIÓN ENSAYO GENERAL ===');
  console.log('"Ensayo General" está programado para:');
  console.log(`- Martes (ISO=2): ${convertJSDateToISO(new Date('2025-07-08').getDay()) === 2 ? '✅' : '❌'}`);
  console.log(`- Jueves (ISO=4): ${convertJSDateToISO(new Date('2025-07-10').getDay()) === 4 ? '✅' : '❌'}`);
  console.log(`- Sábado (ISO=6): ${convertJSDateToISO(new Date('2025-07-12').getDay()) === 6 ? '✅' : '❌'}`);
  console.log('\n❌ NO debe aparecer en:');
  console.log(`- Domingo (ISO=7): ${convertJSDateToISO(new Date('2025-07-06').getDay()) === 7 ? 'CORRECTO - no debe aparecer' : 'ERROR'}`);
  
  return {
    sundayJS: jsDaySunday,
    sundayISO: isoDaySunday,
    conversionWorking: isoDaySunday === 7,
  };
}

// Ejecutar la prueba
const result = testNewDayMapping();
console.log(`\n🎯 Resultado final: ${result.conversionWorking ? 'CONVERSIÓN EXITOSA' : 'CONVERSIÓN FALLIDA'}`);
