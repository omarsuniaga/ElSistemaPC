// Prueba para verificar el problema de fechas

console.log("=== Prueba de Fechas ===")

// Fecha actual
const now = new Date()
console.log("Hoy (Date):", now)
console.log("Día de la semana:", now.getDay()) // 0=domingo, 6=sábado

// Formato YYYY-MM-DD
const today = now.toISOString().split('T')[0]
console.log("Hoy (YYYY-MM-DD):", today)

// PROBLEMA: usando new Date con T00:00:00
const problemDate = new Date(`${today}T00:00:00`)
console.log("Problema - Con T00:00:00:", problemDate)
console.log("Problema - Día de la semana:", problemDate.getDay())

// SOLUCIÓN: usando parseISO (simulado)
// En el navegador, parseISO de date-fns funciona correctamente
const fixedDate = new Date(today + 'T12:00:00') // Mediodía para evitar zona horaria
console.log("Solución - Mediodía:", fixedDate)
console.log("Solución - Día de la semana:", fixedDate.getDay())

// Comparación
console.log("Diferencia en día de semana:", problemDate.getDay() - fixedDate.getDay())

console.log("=== Fin de la Prueba ===")
