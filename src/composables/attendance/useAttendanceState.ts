/**
 * Composable para gestionar el estado reactivo de asistencia
 * Extrae toda la lógica de estado del AttendanceView.vue
 */
import {ref, computed} from "vue"
import {getCurrentDate} from "@/utils/dateUtils"
import type {AttendanceFiltersType} from "@/modulos/Attendance/types/attendance"
import type {SelectedStudent} from "@/modulos/Students/types/student"

export function useAttendanceState() {
  // ============= NAVIGATION STATE =============
  const view = ref<"calendar" | "class-select" | "attendance-form">("calendar")
  const selectedDate = ref(getCurrentDate())
  const currentMonth = ref(new Date())
  const selectedClass = ref("")

  // ============= LOADING STATE =============
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const loadingMessage = ref("")
  const isUpdating = ref(false)

  // ============= MODAL STATE =============
  const showObservationsModal = ref(false)
  const showObservationAlert = ref(false)
  const showJustificationModal = ref(false)
  const showReportModal = ref(false)
  const showExportModal = ref(false)
  const showAnalytics = ref(false)
  const showTrends = ref(false)
  const showCalendarModal = ref(false)
  const showEmergencyClassModal = ref(false)
  const showClassesModal = ref(false)
  const showJustifiedAbsenceModal = ref(false)

  // ============= SELECTED DATA =============
  const selectedStudentForObs = ref<SelectedStudent | null>(null)
  const selectedStudentForJustification = ref<SelectedStudent | null>(null)
  const currentObservationText = ref<string>("")
  const observationToEdit = ref<any>(null)
  const initialJustificationText = ref<string>("")

  // ============= EMERGENCY CLASS STATE =============
  const emergencyClassInfo = ref<any>(null)
  const isLoadingEmergencyClass = ref(false)

  // ============= MESSAGES STATE =============
  const showMessage = ref(false)
  const message = ref("")
  const messageType = ref<"success" | "error">("success")
  const recipientEmail = ref("")

  // ============= REPORT STATE =============
  const reportFilters = ref<AttendanceFiltersType>({
    instrument: "",
    level: "",
    teacherId: "",
    startDate: "",
    endDate: "",
  })

  // ============= DATE INFO STATE =============
  const selectedDateInfo = ref<{
    hasRegistrations: boolean
    registeredClasses: string[]
    unregisteredClasses: string[]
  }>({
    hasRegistrations: false,
    registeredClasses: [],
    unregisteredClasses: [],
  })

  // ============= CLASSES FOR DATE =============
  const modalDate = ref<string>("")
  const classesForDate = ref<any[]>([])

  // ============= COMPUTED PROPERTIES =============
  const availableClasses = computed(() => classesForDate.value || [])

  // ============= STATE ACTIONS =============
  const updateView = (newView: "calendar" | "class-select" | "attendance-form") => {
    view.value = newView
    error.value = null

    if (newView === "calendar") {
      selectedClass.value = ""
    }
  }

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    message.value = msg
    messageType.value = type
    showMessage.value = true
    setTimeout(() => {
      showMessage.value = false
    }, 3000)
  }

  const closeAllModals = () => {
    showObservationsModal.value = false
    showJustifiedAbsenceModal.value = false
    showReportModal.value = false
    showExportModal.value = false
    showCalendarModal.value = false
    showEmergencyClassModal.value = false
    showClassesModal.value = false
    showObservationAlert.value = false
  }

  const resetState = () => {
    view.value = "calendar"
    selectedDate.value = getCurrentDate()
    selectedClass.value = ""
    error.value = null
    isLoading.value = false
    loadingMessage.value = ""
    closeAllModals()
  }

  return {
    // Navigation state
    view,
    selectedDate,
    currentMonth,
    selectedClass,

    // Loading state
    isLoading,
    error,
    loadingMessage,
    isUpdating,

    // Modal state
    showObservationsModal,
    showObservationAlert,
    showJustificationModal,
    showReportModal,
    showExportModal,
    showAnalytics,
    showTrends,
    showCalendarModal,
    showEmergencyClassModal,
    showClassesModal,
    showJustifiedAbsenceModal,

    // Selected data
    selectedStudentForObs,
    selectedStudentForJustification,
    currentObservationText,
    observationToEdit,
    initialJustificationText,

    // Emergency class state
    emergencyClassInfo,
    isLoadingEmergencyClass,

    // Messages state
    showMessage,
    message,
    messageType,
    recipientEmail,

    // Report state
    reportFilters,

    // Date info state
    selectedDateInfo,
    modalDate,
    classesForDate,

    // Computed
    availableClasses,

    // Actions
    updateView,
    showToast,
    closeAllModals,
    resetState,
  }
}
