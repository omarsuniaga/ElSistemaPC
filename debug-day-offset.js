// Script para diagnosticar el problema de desplazamiento de días
// Ejecutar en la consola del navegador

console.log("🔍 === DIAGNÓSTICO DE DESPLAZAMIENTO DE DÍAS ===");

// Función para probar diferentes fechas
function testDayMapping() {
  const testDates = [
    "2025-07-06", // Domingo 6 julio
    "2025-07-07", // Lunes 7 julio  
    "2025-07-08", // Martes 8 julio
    "2025-07-09", // Miércoles 9 julio
    "2025-07-10", // Jueves 10 julio
    "2025-07-11", // Viernes 11 julio
    "2025-07-12", // Sábado 12 julio
  ];

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  console.log("📅 PRUEBA DE MAPEO DE DÍAS:");
  testDates.forEach(dateStr => {
    const date = new Date(dateStr);
    const getDay = date.getDay();
    const parseISODate = parseISO(dateStr);
    const parseISOGetDay = parseISODate.getDay();
    
    console.log(`${dateStr}:`);
    console.log(`  new Date("${dateStr}").getDay() = ${getDay} (${dayNames[getDay]})`);
    console.log(`  parseISO("${dateStr}").getDay() = ${parseISOGetDay} (${dayNames[parseISOGetDay]})`);
    console.log(`  Esperado: ${dayNames[testDates.indexOf(dateStr)]} (índice ${testDates.indexOf(dateStr)})`);
    
    if (getDay !== parseISOGetDay) {
      console.error(`❌ INCONSISTENCIA: new Date vs parseISO`);
    }
    
    const expectedIndex = testDates.indexOf(dateStr);
    if (getDay !== expectedIndex) {
      console.error(`❌ DESPLAZAMIENTO: getDay=${getDay}, esperado=${expectedIndex}`);
    }
    console.log("---");
  });
}

// Función para probar el mapeo de Ensayo General específicamente
function testEnsayoGeneral() {
  console.log("🎭 === PRUEBA ESPECÍFICA ENSAYO GENERAL ===");
  
  // Simular slots de Ensayo General
  const ensayoSlots = [
    { day: "Martes", startTime: "17:30", endTime: "18:30" },
    { day: "Jueves", startTime: "17:30", endTime: "18:30" },
    { day: "Sábado", startTime: "09:00", endTime: "12:30" }
  ];
  
  const getDayIndex = (dayString) => {
    const dayMapping = {
      domingo: 0, lunes: 1, martes: 2, miércoles: 3, jueves: 4, viernes: 5, sábado: 6,
      Domingo: 0, Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6,
    };
    return dayMapping[dayString] ?? -1;
  };
  
  console.log("📋 Slots de Ensayo General:");
  ensayoSlots.forEach((slot, index) => {
    const dayIndex = getDayIndex(slot.day);
    console.log(`Slot ${index}: "${slot.day}" → índice ${dayIndex}`);
  });
  
  // Probar contra diferentes días de la semana
  const testDays = [
    { date: "2025-07-06", expected: "Domingo", getDay: 0 },
    { date: "2025-07-07", expected: "Lunes", getDay: 1 },
    { date: "2025-07-08", expected: "Martes", getDay: 2 },
    { date: "2025-07-09", expected: "Miércoles", getDay: 3 },
    { date: "2025-07-10", expected: "Jueves", getDay: 4 },
    { date: "2025-07-11", expected: "Viernes", getDay: 5 },
    { date: "2025-07-12", expected: "Sábado", getDay: 6 },
  ];
  
  console.log("🧪 Prueba de coincidencias:");
  testDays.forEach(testDay => {
    const hasMatch = ensayoSlots.some(slot => {
      const slotIndex = getDayIndex(slot.day);
      return slotIndex === testDay.getDay;
    });
    
    const shouldMatch = ["Martes", "Jueves", "Sábado"].includes(testDay.expected);
    const result = hasMatch === shouldMatch ? "✅ CORRECTO" : "❌ ERROR";
    
    console.log(`${testDay.date} (${testDay.expected}): hasMatch=${hasMatch}, shouldMatch=${shouldMatch} ${result}`);
  });
}

// Función para verificar zona horaria
function testTimezone() {
  console.log("🌍 === VERIFICACIÓN DE ZONA HORARIA ===");
  
  const now = new Date();
  console.log(`Fecha actual: ${now}`);
  console.log(`Zona horaria: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  console.log(`Offset UTC: ${now.getTimezoneOffset()} minutos`);
  
  // Probar parseISO vs new Date para el domingo problemático
  const problematicDate = "2025-07-06";
  const date1 = new Date(problematicDate);
  const date2 = parseISO(problematicDate);
  
  console.log(`\n📅 Fecha problemática: ${problematicDate}`);
  console.log(`new Date("${problematicDate}"):`);
  console.log(`  toString(): ${date1.toString()}`);
  console.log(`  getDay(): ${date1.getDay()}`);
  console.log(`  getTimezoneOffset(): ${date1.getTimezoneOffset()}`);
  
  console.log(`parseISO("${problematicDate}"):`);
  console.log(`  toString(): ${date2.toString()}`);
  console.log(`  getDay(): ${date2.getDay()}`);
  console.log(`  getTimezoneOffset(): ${date2.getTimezoneOffset()}`);
}

// Ejecutar todas las pruebas
testTimezone();
testDayMapping();
testEnsayoGeneral();

console.log("🎯 === RESUMEN ===");
console.log("Si ves desplazamientos o inconsistencias arriba, esa es la causa del problema.");
console.log("Copia y pega este script en la consola del navegador para ejecutarlo.");
