// Prueba específica para detectar el problema de fechas en el calendario

import { parseISO, format, getDay } from 'date-fns'
import { es } from 'date-fns/locale'

// Hoy es domingo 6 de julio de 2025
const today = '2025-07-06'
console.log('=== PRUEBA DE FECHAS CALENDARIO ===')

console.log('Fecha hoy:', today)

// Probar con parseISO
const dateWithParseISO = parseISO(today)
console.log('parseISO result:', dateWithParseISO)
console.log('parseISO day of week (0=dom, 1=lun):', getDay(dateWithParseISO))
console.log('parseISO day name:', format(dateWithParseISO, 'EEEE', { locale: es }))

// Probar con new Date + T00:00:00 (el método problemático)
const dateWithT = new Date(`${today}T00:00:00`)
console.log('new Date T00:00:00 result:', dateWithT)
console.log('new Date T00:00:00 day of week:', getDay(dateWithT))
console.log('new Date T00:00:00 day name:', format(dateWithT, 'EEEE', { locale: es }))

// Probar con la fecha de ayer para ver el desplazamiento
const yesterday = '2025-07-05' // Sábado
const dateYesterday = parseISO(yesterday)
console.log('Ayer (sábado):', yesterday)
console.log('Ayer parseISO day of week:', getDay(dateYesterday))
console.log('Ayer parseISO day name:', format(dateYesterday, 'EEEE', { locale: es }))

const dateYesterdayWithT = new Date(`${yesterday}T00:00:00`)
console.log('Ayer new Date T00:00:00 day of week:', getDay(dateYesterdayWithT))
console.log('Ayer new Date T00:00:00 day name:', format(dateYesterdayWithT, 'EEEE', { locale: es }))

console.log('=== FIN PRUEBA ===')
