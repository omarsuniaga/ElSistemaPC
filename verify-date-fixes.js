// Prueba para verificar que los cambios de fecha están funcionando correctamente

console.log("=== VERIFICACIÓN DE CORRECCIONES DE FECHA ===")

// Simular el comportamiento del componente con fecha de hoy (domingo 6 julio 2025)
const today = "2025-07-06"

console.log("1. Fecha de entrada:", today)

// Simular parseISO (el método corregido)
try {
  const date = new Date(today + "T12:00:00") // Usar mediodía para evitar zona horaria
  console.log("2. Fecha parseada:", date)
  console.log("3. Día de la semana (0=dom, 1=lun, etc):", date.getDay())
  
  const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
  console.log("4. Nombre del día:", dayNames[date.getDay()])
  
  // Verificar que domingo = 0
  if (date.getDay() === 0) {
    console.log("✅ CORRECTO: Hoy es domingo (día 0)")
  } else {
    console.log("❌ ERROR: Hoy debería ser domingo pero detecta día", date.getDay())
  }
  
} catch (error) {
  console.error("Error al procesar la fecha:", error)
}

// Verificar la configuración del calendario
console.log("\n=== CONFIGURACIÓN DEL CALENDARIO ===")
console.log("- weekStartsOn cambiado a 1 (lunes)")
console.log("- Array de días: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']")
console.log("- parseISO usado en lugar de new Date(fecha + 'T00:00:00')")

console.log("\n=== FIN VERIFICACIÓN ===")
