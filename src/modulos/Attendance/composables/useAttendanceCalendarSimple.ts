/**
 * 📅 COMPOSABLE SIMPLIFICADO PARA CALENDARIO DE ASISTENCIAS
 * Versión temporal para pruebas rápidas
 */

import { ref, computed } from "vue"
import { format } from "date-fns"
import { CalendarService } from "../services/CalendarService"

export function useAttendanceCalendarSimple() {
  // Estado básico
  const selectedDate = ref<string | null>(null)
  const currentMonth = ref(new Date())
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const teacherId = ref("teacher-123") // Mock para pruebas

  // Datos simulados
  const dayClasses = ref<any[]>([])
  
  const dayStats = computed(() => ({
    total: dayClasses.value.length,
    withAttendance: Math.floor(dayClasses.value.length * 0.7),
    pending: Math.ceil(dayClasses.value.length * 0.3)
  }))

  // Simular clases del día
  const generateMockClasses = (date: string) => {
    const dayOfWeek = new Date(date).getDay()
    
    // Solo generar clases para ciertos días (evitar domingo para "Ensayo General")
    if (dayOfWeek === 0) return [] // Domingo - no clases
    
    const classes = []
    
    // Martes, Jueves, Sábado - incluir "Ensayo General"
    if ([2, 4, 6].includes(dayOfWeek)) {
      classes.push({
        id: "ensayo-general-1",
        name: "Ensayo General",
        time: "17:00 - 18:30",
        teacherId: teacherId.value,
        students: ["Estudiante 1", "Estudiante 2", "Estudiante 3"],
        hasAttendance: Math.random() > 0.5
      })
    }
    
    // Otras clases aleatorias
    if ([1, 2, 3, 4, 5, 6].includes(dayOfWeek)) {
      const randomClasses = Math.floor(Math.random() * 3) + 1
      
      for (let i = 0; i < randomClasses; i++) {
        classes.push({
          id: `class-${date}-${i}`,
          name: `Clase ${i + 1}`,
          time: `${9 + i * 2}:00 - ${11 + i * 2}:00`,
          teacherId: teacherId.value,
          students: [`Estudiante A${i}`, `Estudiante B${i}`],
          hasAttendance: Math.random() > 0.4
        })
      }
    }
    
    return classes
  }

  // Métodos
  const selectDate = async (date: string) => {
    console.log(`[useAttendanceCalendar] Selecting date: ${date}`)
    
    isLoading.value = true
    error.value = null
    
    try {
      // Simular delay de carga
      await new Promise(resolve => setTimeout(resolve, 500))
      
      selectedDate.value = date
      dayClasses.value = generateMockClasses(date)
      
      console.log(`[useAttendanceCalendar] ✅ Loaded ${dayClasses.value.length} classes for ${date}`)
      
      // Verificar específicamente el problema de "Ensayo General" en domingo
      const dayOfWeek = new Date(date).getDay()
      const hasEnsayoGeneral = dayClasses.value.some(c => c.name === "Ensayo General")
      
      if (dayOfWeek === 0 && hasEnsayoGeneral) {
        console.error(`❌ ERROR: "Ensayo General" aparece en domingo ${date}`)
      } else if (dayOfWeek === 0 && !hasEnsayoGeneral) {
        console.log(`✅ CORRECTO: "Ensayo General" NO aparece en domingo ${date}`)
      }
      
    } catch (err) {
      console.error("[useAttendanceCalendar] Error:", err)
      error.value = "Error loading classes"
    } finally {
      isLoading.value = false
    }
  }

  const loadClassesForDate = async (dateString: string) => {
    return selectDate(dateString)
  }

  const refreshCurrentDate = async () => {
    if (selectedDate.value) {
      await selectDate(selectedDate.value)
    }
  }

  // Funciones de utilidad para validación
  const validateClassForDay = (classItem: any, dayOfWeek: number) => {
    if (!classItem?.name) return false
    
    // Ensayo General solo martes (2), jueves (4), sábado (6)
    if (classItem.name === "Ensayo General") {
      return [2, 4, 6].includes(dayOfWeek)
    }
    
    return true
  }

  const debugClass = (classItem: any, date: string) => {
    const dayOfWeek = new Date(date).getDay()
    const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
    
    console.log(`[DEBUG] Clase: ${classItem.name}`)
    console.log(`[DEBUG] Fecha: ${date} (${dayNames[dayOfWeek]})`)
    console.log(`[DEBUG] Día de la semana: ${dayOfWeek}`)
    console.log(`[DEBUG] ¿Debe aparecer?: ${validateClassForDay(classItem, dayOfWeek)}`)
  }

  // Inicializar con fecha actual
  const today = format(new Date(), "yyyy-MM-dd")
  selectDate(today)

  return {
    // Estado
    selectedDate,
    currentMonth,
    isLoading,
    error,
    teacherId,
    
    // Datos computados
    dayClasses,
    dayStats,
    
    // Métodos
    selectDate,
    loadClassesForDate,
    refreshCurrentDate,
    
    // Utilidades de validación
    validateClassForDay,
    debugClass,
  }
}
