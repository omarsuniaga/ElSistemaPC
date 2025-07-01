import {ref, computed, onMounted} from "vue"
import {useEmergencyClassStore} from "../modulos/Attendance/store/emergencyClass"
import {format} from "date-fns"
import {es} from "date-fns/locale"

/**
 * Composable para gestionar la verificación y visualización de clases emergentes
 *
 * @returns {Object} - Objeto con estado y métodos relacionados a clases emergentes
 */
export function useEmergentClassesCheck() {
  // Estado interno
  const isLoading = ref(true)
  const error = ref(null)
  const emergentClasses = ref([])
  const lastCheck = ref(null)

  // Store de clases emergentes
  const emergencyClassStore = useEmergencyClassStore()

  /**
   * Carga y procesa las clases emergentes para el día actual
   */
  const fetchEmergentClasses = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Obtener todas las clases emergentes (el store maneja el filtrado por estado)
      await emergencyClassStore.fetchEmergencyClasses("Aceptada")

      // Filtrar solo las clases de hoy
      const now = new Date()
      const today = format(now, "yyyy-MM-dd")

      const classesForToday = emergencyClassStore.emergencyClasses
        .filter((emergencyClass) => {
          // Verificar si la fecha de la clase es hoy
          const classDate = emergencyClass.date.substring(0, 10) // Formato YYYY-MM-DD
          return classDate === today
        })
        .map((classData) => {
          // Transformar el formato para nuestro componente
          return {
            id: classData.id,
            title: classData.className,
            startTime: getClassStartTime(classData),
            endTime: getClassEndTime(classData),
            originalTeacher: emergencyClass.originalTeacher || "No especificado",
            replacementTeacher: classData.teacherName,
            location: classData.location || "Salón habitual",
            reason: classData.reason,
            notes: classData.notes || "",
            status: classData.status,
          }
        })

      emergentClasses.value = classesForToday
      lastCheck.value = new Date()
    } catch (err) {
      console.error("Error al cargar clases emergentes:", err)
      error.value = err.message || "Error al cargar clases emergentes"
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Obtiene la hora de inicio de una clase
   * Si no está especificada, calcula una hora aproximada del día
   */
  const getClassStartTime = (classData) => {
    // Si la clase tiene una hora de inicio específica, usarla
    if (classData.startTime) {
      return classData.startTime
    }

    // De lo contrario crear una hora aproximada basada en la fecha
    const classDate = new Date(classData.date)
    // Asumimos que la clase comienza a las 8 de la mañana si no hay hora específica
    classDate.setHours(8, 0, 0, 0)
    return classDate.toISOString()
  }

  /**
   * Obtiene la hora de fin de una clase
   * Si no está especificada, calcula una hora aproximada del día
   */
  const getClassEndTime = (classData) => {
    // Si la clase tiene una hora de fin específica, usarla
    if (classData.endTime) {
      return classData.endTime
    }

    // De lo contrario crear una hora aproximada basada en la fecha
    const classDate = new Date(classData.date)
    // Asumimos que la clase dura 60 minutos si no hay hora específica
    classDate.setHours(9, 0, 0, 0)
    return classDate.toISOString()
  }

  // Propiedades computadas
  const hasApprovedEmergentClasses = computed(() => emergentClasses.value.length > 0)
  const emergentClassesCount = computed(() => emergentClasses.value.length)

  // Cargar datos al montar el componente
  onMounted(() => {
    fetchEmergentClasses()

    // Establecer un intervalo para refrescar cada 5 minutos
    const interval = setInterval(fetchEmergentClasses, 5 * 60 * 1000)

    // Limpiar el intervalo cuando se desmonte el componente
    return () => {
      clearInterval(interval)
    }
  })

  return {
    isLoading,
    error,
    emergentClasses,
    hasApprovedEmergentClasses,
    emergentClassesCount,
    fetchEmergentClasses,
    lastCheck,
  }
}
