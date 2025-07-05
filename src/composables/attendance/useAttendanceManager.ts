/**
 * Composable principal que integra toda la funcionalidad de asistencia
 * Reemplaza la lógica compleja del AttendanceView.vue
 */
import {onMounted, watch, nextTick} from "vue"
import {useRouter, useRoute} from "vue-router"
import {useConfigStore} from "@/stores/config"
import {useAuthStore} from "@/stores/auth"
import {useAttendanceStore} from "@/modulos/Attendance/store/attendance"
import {useStudentsStore} from "@/modulos/Students/store/students"
import {useClassesStore} from "@/modulos/Classes/store/classes"
import {getCurrentDate} from "@/utils/dateUtils"
import {useAttendanceState} from "./useAttendanceState"
import {useAttendanceDateClass} from "./useAttendanceDateClass"
import {useAttendanceOperations} from "./useAttendanceOperations"
import {useAttendanceExports} from "./useAttendanceExports"

export function useAttendanceManager(props: {date?: string; classId?: string}) {
  // ============= INITIALIZE COMPOSABLES =============
  const state = useAttendanceState()
  const dateClass = useAttendanceDateClass(state)
  const operations = useAttendanceOperations(state)
  const exports = useAttendanceExports(state)

  // ============= ROUTER AND STORES =============
  const router = useRouter()
  const route = useRoute()
  const configStore = useConfigStore()
  const authStore = useAuthStore()
  const attendanceStore = useAttendanceStore()
  const studentsStore = useStudentsStore()
  const classesStore = useClassesStore()

  // ============= NAVIGATION HELPERS =============
  const navigateToCalendar = () => {
    state.updateView("calendar")
  }

  const navigateToClassSelector = () => {
    if (!state.selectedDate.value) {
      state.selectedDate.value = getCurrentDate()
    }
    dateClass.selectDate(state.selectedDate.value)
  }

  // ============= CLASS SELECTION =============
  const selectClass = async (className: string) => {
    try {
      state.isLoading.value = true
      state.loadingMessage.value = "Cargando datos de clase..."

      state.selectedClass.value = className

      // Load specific students for the class first
      console.log(`[AttendanceManager] Cargando estudiantes para clase: ${className}`)
      await studentsStore.getStudentsByClass(className)

      await operations.loadAttendanceData(className)
      state.updateView("attendance-form")

      // Update URL for deep linking
      const formattedDate = state.selectedDate.value.replace(/-/g, "")
      router.push(`/attendance/${formattedDate}/${className}`)
    } catch (err) {
      console.error("Error selecting class:", err)
      state.showToast("Error al cargar la clase", "error")
    } finally {
      state.isLoading.value = false
      state.loadingMessage.value = ""
    }
  }

  // ============= CALENDAR HANDLERS =============
  const handleCalendarSelect = (date: string | {date: string}) => {
    let dateStr: string
    if (typeof date === "string") {
      dateStr = date
    } else if (date && typeof date === "object" && "date" in date) {
      dateStr = date.date
    } else {
      console.error("Invalid date parameter:", date)
      return
    }
    state.selectedDate.value = dateStr
    state.showCalendarModal.value = false
    state.updateView("class-select")
  }

  const handleMonthChange = (newMonth: Date) => {
    state.currentMonth.value = newMonth
    console.log("Month changed to:", newMonth)
  }

  const handleDateChange = async (newDate: string) => {
    if (state.isUpdating.value) return
    state.isUpdating.value = true

    try {
      state.selectedDate.value = newDate
      if (!attendanceStore.validateAttendanceDate(newDate)) {
        state.showToast("No se puede registrar asistencia para fechas futuras", "error")
        return
      }

      if (state.selectedClass.value) {
        await operations.loadAttendanceData(state.selectedClass.value)
      }
    } finally {
      state.isUpdating.value = false
    }
  }

  const handleSelectedDateUpdate = (newDate: string) => {
    state.selectedDate.value = newDate
  }

  // ============= EMERGENCY CLASS HANDLERS =============
  const handleEmergencyClassCancelled = () => {
    console.log("[AttendanceManager] Creación de clase emergente cancelada")
    state.showEmergencyClassModal.value = false
  }

  // ============= INITIAL DATA LOADING =============
  const fetchInitialData = async () => {
    try {
      state.isLoading.value = true
      state.loadingMessage.value = "Cargando datos iniciales..."

      console.log("[AttendanceManager] fetchInitialData: Starting data fetch...")

      // 🎯 Obtener el ID del maestro autenticado
      const teacherId = authStore.user?.uid
      console.log("[AttendanceManager] Teacher ID:", teacherId)

      // Cargar datos básicos en paralelo
      await Promise.all([studentsStore.fetchStudents(), classesStore.fetchClasses()])

      // 📅 Si hay maestro autenticado, cargar SUS documentos específicos
      if (teacherId) {
        console.log("[AttendanceManager] Loading teacher-specific attendance data...")
        const now = new Date()
        const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          .toISOString()
          .split("T")[0] // Mes anterior
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0] // Mes siguiente

        await attendanceStore.fetchAttendanceDocumentsByTeacher(teacherId, startDate, endDate)
        console.log(
          "[AttendanceManager] Teacher attendance documents loaded:",
          attendanceStore.attendanceDocuments.length
        )
      } else {
        // Si no hay maestro, cargar todas las fechas (para admins)
        await attendanceStore.fetchAllAttendanceDates()
      }

      console.log("[AttendanceManager] fetchInitialData: Initial data fetched.")
      console.log("[AttendanceManager] Classes loaded:", classesStore.classes.length)

      // Handle URL parameters
      if (props.date && props.classId) {
        console.log(
          `[AttendanceManager] fetchInitialData: URL params detected - date: ${props.date}, classId: ${props.classId}`
        )
        const formattedDate =
          props.date.length === 8
            ? `${props.date.substring(0, 4)}-${props.date.substring(4, 6)}-${props.date.substring(6, 8)}`
            : props.date

        state.selectedDate.value = formattedDate
        state.selectedClass.value = props.classId
        console.log(
          `[AttendanceManager] fetchInitialData: selectedDate: ${state.selectedDate.value}, selectedClass: ${state.selectedClass.value}`
        )
        await selectClass(props.classId)
      } else if (route.query.class) {
        console.log(
          `[AttendanceManager] fetchInitialData: URL query class detected: ${route.query.class}`
        )
        state.selectedClass.value = route.query.class as string
        console.log(
          `[AttendanceManager] fetchInitialData: selectedClass: ${state.selectedClass.value}`
        )
        await operations.loadAttendanceData(state.selectedClass.value)
        state.updateView("attendance-form")
      }

      state.error.value = null
    } catch (err) {
      state.error.value = "Error al cargar los datos iniciales"
      console.error("Error loading initial data:", err)
    } finally {
      state.isLoading.value = false
      state.loadingMessage.value = ""
    }
  }

  // ============= LIFECYCLE HOOKS =============
  onMounted(async () => {
    await configStore.fetchConfigs()
    await fetchInitialData()
  })

  // ============= WATCHERS =============
  // Watch for route changes
  watch(
    () => [route.params.date, route.params.classId, route.path],
    async ([newDate, newClassId, path]) => {
      if (
        typeof path === "string" &&
        (path.endsWith("/attendance/calendar") || path.endsWith("/teacher/attendance/calendar"))
      ) {
        state.updateView("calendar")
        state.selectedDate.value = getCurrentDate()
        state.selectedClass.value = ""
        state.closeAllModals()
        return
      }

      if (newDate && newClassId) {
        const dateStr = newDate as string
        const formattedDate =
          dateStr.length === 8
            ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
            : dateStr

        state.selectedDate.value = formattedDate
        state.selectedClass.value = newClassId as string
        await selectClass(newClassId as string)
      }
    }
  )

  // Watch for date changes
  watch(
    () => state.selectedDate.value,
    async (newDate) => {
      if (newDate) {
        await dateClass.updateSelectedDateInfo(newDate)
      }
    },
    {immediate: true}
  )

  // Watch for changes in attendance records - only log when debugging enabled
  watch(
    () => attendanceStore.attendanceRecords,
    (newRecords, oldRecords) => {
      if (window.localStorage.getItem("attendance-debug") === "true") {
        console.log("[AttendanceManager] Attendance records changed:")
        console.log(
          "- Registros anteriores:",
          oldRecords ? JSON.parse(JSON.stringify(oldRecords)) : null
        )
        console.log(
          "- Registros nuevos:",
          newRecords ? JSON.parse(JSON.stringify(newRecords)) : null
        )
      }

      // Quick integrity check without detailed logs
      operations.verifyAttendanceDataIntegrity()
    },
    {deep: true}
  )

  // Watch for changes in current attendance document - only log when debugging enabled
  watch(
    () => attendanceStore.currentAttendanceDoc,
    (newDoc, oldDoc) => {
      if (window.localStorage.getItem("attendance-debug") === "true") {
        console.log("[AttendanceManager] Current attendance document changed:")
        console.log("- Documento anterior:", oldDoc ? JSON.parse(JSON.stringify(oldDoc)) : null)
        console.log("- Documento nuevo:", newDoc ? JSON.parse(JSON.stringify(newDoc)) : null)
      }
    },
    {deep: true}
  )

  // ============= RETURN ALL FUNCTIONALITY =============
  return {
    // State management
    ...state,

    // Date and class management
    ...dateClass,

    // Attendance operations
    ...operations,

    // Export functionality
    ...exports,

    // Navigation
    navigateToCalendar,
    navigateToClassSelector,
    selectClass,

    // Calendar handlers
    handleCalendarSelect,
    handleMonthChange,
    handleDateChange,
    handleSelectedDateUpdate,

    // Emergency class handlers
    handleEmergencyClassCancelled,

    // Initialization
    fetchInitialData,

    // Utilities
    nextTick,

    // 🏪 Stores - exponer para uso en template
    attendanceStore,
    studentsStore,
    classesStore,
    authStore,
  }
}
