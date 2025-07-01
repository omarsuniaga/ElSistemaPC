import {ref} from "vue"
import {collection, query, where, getDocs} from "firebase/firestore"
import {db} from "../../../firebase"

export function useEmergentClassesCheck() {
  // Estado para el indicador visual
  const hasApprovedEmergentClasses = ref(false)
  const emergentClassesCount = ref(0)
  const emergentClasses = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  /**
   * Obtiene el rango de tiempo para el día de hoy (desde 00:00:00 hasta 23:59:59)
   * @returns {Object} Objeto con fechas de inicio y fin del día
   */
  const getTodayTimeRange = () => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

    return {startOfDay, endOfDay}
  }

  /**
   * Verifica si hay clases emergentes aprobadas para hoy
   */
  const checkTodayEmergentClasses = async () => {
    isLoading.value = true
    error.value = null

    try {
      const {startOfDay, endOfDay} = getTodayTimeRange()

      // Consulta a Firestore para buscar clases emergentes aprobadas para hoy
      const classesRef = collection(db, "CLASES")
      const q = query(
        classesRef,
        where("tipo", "==", "emergente"),
        where("estado", "==", "aprobado"),
        where("fecha", ">=", startOfDay),
        where("fecha", "<=", endOfDay)
      )

      const querySnapshot = await getDocs(q)

      // Procesar resultados
      const classesData = []
      querySnapshot.forEach((doc) => {
        classesData.push({id: doc.id, ...doc.data()})
      })

      // Actualizar estado
      emergentClasses.value = classesData
      emergentClassesCount.value = classesData.length
      hasApprovedEmergentClasses.value = classesData.length > 0
    } catch (err) {
      console.error("Error al verificar clases emergentes:", err)
      error.value = "Error al verificar clases emergentes"
    } finally {
      isLoading.value = false
    }
  }

  return {
    hasApprovedEmergentClasses,
    emergentClassesCount,
    emergentClasses,
    isLoading,
    error,
    checkTodayEmergentClasses,
  }
}
