import {defineStore} from "pinia"
import {ref} from "vue"
import {attendancePredictionModel, AttendancePrediction} from "../ml/attendancePredictionModel"
import {useStudentsStore} from "@/modulos/Students/store/students"

export const usePredictionStore = defineStore("predictions", () => {
  // State
  const predictions = ref<AttendancePrediction[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  const generatePredictionsForClass = async (classId: string, dates: Date[]) => {
    isLoading.value = true
    error.value = null
    try {
      const studentsStore = useStudentsStore()
      // Asegurarse de que los estudiantes de la clase estén cargados
      const students = studentsStore.getStudentsByClass(classId)
      if (students.length === 0) {
        console.warn(
          `No se encontraron estudiantes para la clase ${classId}, no se pueden generar predicciones.`
        )
        predictions.value = []
        return
      }

      const result = await attendancePredictionModel.predictBulkAttendance(students, classId, dates)

      // Reemplazar las predicciones existentes para esta clase y fechas
      const otherPredictions = predictions.value.filter(
        (p) =>
          p.classId !== classId || !dates.some((d) => d.getTime() === p.predictedDate.getTime())
      )
      predictions.value = [...otherPredictions, ...result]
    } catch (err: any) {
      error.value = err.message || "Ocurrió un error al generar las predicciones."
      console.error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  const clearPredictions = () => {
    predictions.value = []
  }

  return {
    // State
    predictions,
    isLoading,
    error,
    // Actions
    generatePredictionsForClass,
    clearPredictions,
  }
})
