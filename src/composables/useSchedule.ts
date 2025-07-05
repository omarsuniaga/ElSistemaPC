import {ref, computed} from "vue"

export function useSchedule() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const loadingCount = ref(0)

  // Función para obtener stores de manera segura
  const getStores = async () => {
    try {
      const [{useClassesStore}, {useTeachersStore}, {useStudentsStore}] = await Promise.all([
        import("../modulos/Classes/store/classes"),
        import("../modulos/Teachers/store/teachers"),
        import("../modulos/Students/store/students"),
      ])
      return {
        classesStore: useClassesStore(),
        teachersStore: useTeachersStore(),
        studentsStore: useStudentsStore(),
      }
    } catch (error) {
      console.warn("Stores no disponibles:", error)
      return null
    }
  }

  // Stats
  const classStats = computed(() => {
    // TODO: Esta será una función async cuando se refactorice completamente
    return {
      total: 0,
      scheduled: 0,
      unscheduled: 0,
      withoutTeacher: 0,
      withoutStudents: 0,
    }
  })

  // Enhanced classes with additional information - simplificado por ahora
  const enhancedClasses = computed(() => [])

  // Format schedules
  const formatScheduleDisplay = (schedule: any) => {
    if (!schedule) return {days: [], startTime: "", endTime: ""}
    if (typeof schedule === "string") {
      const [day, start, , end] = schedule.split(" ")
      return {days: [day || ""], startTime: start || "", endTime: end || ""}
    }
    return schedule
  }

  // Load data
  const loadData = async () => {
    try {
      isLoading.value = true
      const stores = await getStores()
      if (!stores) return

      loadingCount.value = 3
      await Promise.all([
        stores.classesStore.fetchClasses(),
        stores.teachersStore.fetchTeachers(),
        stores.studentsStore.fetchStudents(),
      ])
    } catch (err: any) {
      error.value = err.message || "Error cargando datos"
    } finally {
      isLoading.value = false
      loadingCount.value = 0
    }
  }

  // Validar horario (simplificado)
  const validateSchedule = (schedule: any) => {
    const errors: string[] = []
    if (!schedule) {
      errors.push("El horario es requerido")
      return errors
    }
    return errors
  }

  // Validar conflictos de horario (simplificado)
  const validateScheduleConflicts = async (_schedule: any, _classId?: string) => {
    const conflicts: Array<{type: string; message: string; details: string}> = []
    // TODO: Implementar validación completa cuando los stores estén disponibles
    return conflicts
  }

  // Verificar conflicto de tiempo
  const hasTimeConflict = (_schedule1: any, _schedule2: any) => {
    // TODO: Implementar verificación completa
    return false
  }

  return {
    isLoading,
    error,
    loadingCount,
    classStats,
    enhancedClasses,
    formatScheduleDisplay,
    loadData,
    validateSchedule,
    validateScheduleConflicts,
    hasTimeConflict,
    getStores, // Exportar para uso en componentes
  }
}
