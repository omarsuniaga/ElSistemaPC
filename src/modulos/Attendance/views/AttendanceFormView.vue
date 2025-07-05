<!-- 
📝 ATTENDANCE FORM VIEW
Vista optimizada para registro de asistencia - Velocidad y eficiencia máxima
-->

<script setup lang="ts">
import {ref, computed, onMounted, watch, nextTick} from "vue"
import {useRoute, useRouter} from "vue-router"
import {format, parseISO} from "date-fns"
import {es} from "date-fns/locale"
import {debounce} from "lodash-es"

// Stores y composables
import {useAttendanceOptimized} from "../composables/useAttendanceOptimized"
import {useClassesStore} from "../../Classes/store/classes"
import {useStudentsStore} from "../../Students/store/students"
import {useAuthStore} from "../../../stores/auth"

// Componentes optimizados
import AttendanceHeader from "../components/form/AttendanceHeader.vue"
import StudentAttendanceGrid from "../components/form/StudentAttendanceGrid.vue"
import ClassObservationInput from "../components/form/ClassObservationInput.vue"
import FloatingActionBar from "../components/form/FloatingActionBar.vue"
import AttendanceToolbar from "../components/form/AttendanceToolbar.vue"

// Tipos
interface Student {
  id: string
  name: string
  email?: string
  avatar?: string
  status: "Presente" | "Ausente" | "Tardanza" | "Justificado"
  isChanged: boolean
  justification?: string
}

interface ClassInfo {
  id: string
  name: string
  teacher: string
  date: string
  time: string
  classroom?: string
  totalStudents: number
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const classesStore = useClassesStore()
const studentsStore = useStudentsStore()

// Composable optimizado
const {
  loading,
  error,
  selectedDate,
  selectedClass,
  currentAttendanceRecords,
  fetchAttendanceOptimized,
  updateAttendanceOptimized,
  isUpdatePending,
} = useAttendanceOptimized()

// 🎯 Estado del formulario
const students = ref<Student[]>([])
const classInfo = ref<ClassInfo | null>(null)
const searchQuery = ref("")
const classObservations = ref("")
const hasUnsavedChanges = ref(false)
const isInitializing = ref(true)
const showUnsavedWarning = ref(false)

// 🔍 Estado de búsqueda
const searchInput = ref<HTMLInputElement | null>(null)

// 💾 Estado de guardado
const isSaving = ref(false)
const lastSaved = ref<Date | null>(null)
const saveError = ref<string | null>(null)

/**
 * 🎯 COMPUTED PROPERTIES
 */

// Información de la clase actual
const currentClass = computed(() => classInfo.value)

// Fecha formateada
const formattedDate = computed(() => {
  if (!selectedDate.value) return ""
  const date = parseISO(selectedDate.value)
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", {locale: es}).replace(/^\w/, (c) =>
    c.toUpperCase()
  )
})

// Estadísticas en tiempo real
const attendanceStats = computed(() => {
  const presente = students.value.filter((s) => s.status === "Presente").length
  const ausente = students.value.filter((s) => s.status === "Ausente").length
  const tardanza = students.value.filter((s) => s.status === "Tardanza").length
  const justificado = students.value.filter((s) => s.status === "Justificado").length
  const total = students.value.length

  return {
    presente,
    ausente,
    tardanza,
    justificado,
    total,
    attendanceRate: total > 0 ? Math.round((presente / total) * 100) : 0,
    changedCount: students.value.filter((s) => s.isChanged).length,
  }
})

// Filtro de estudiantes
const displayedStudents = computed(() => {
  if (!searchQuery.value.trim()) return students.value

  const query = searchQuery.value.toLowerCase().trim()
  return students.value.filter((student) => student.name.toLowerCase().includes(query))
})

// Transformar registros de asistencia al formato que espera StudentAttendanceGrid
const attendanceRecords = computed(() => {
  if (!currentAttendanceRecords.value) return []
  
  // Mapeo de estados de español a inglés
  const statusMap: Record<string, "present" | "absent" | "late" | "justified"> = {
    Presente: "present",
    Ausente: "absent",
    Tardanza: "late",
    Justificado: "justified",
  }
  
  return Object.entries(currentAttendanceRecords.value).map(([studentId, status]) => ({
    studentId,
    status: statusMap[status as string] || "absent",
    notes: "",
    timestamp: new Date(),
  }))
})

// Indicador de cambios pendientes
const pendingChanges = computed(() => {
  return students.value.filter((s) => s.isChanged).length
})

/**
 * 🚀 MÉTODOS PRINCIPALES
 */

// Inicializar formulario
const initializeForm = async () => {
  try {
    isInitializing.value = true
    const classId = route.params.classId as string
    const date = (route.query.date as string) || format(new Date(), "yyyy-MM-dd")

    console.log("📝 [AttendanceForm] Initializing form:", {classId, date})

    // Verificar que tenemos los parámetros necesarios
    if (!classId) {
      console.log("❌ [AttendanceForm] No classId provided, redirecting to calendar")
      router.push("/teacher/attendance/calendar")
      return
    }

    // Configurar estado inicial
    selectedClass.value = classId
    selectedDate.value = date

    // Cargar datos en paralelo
    // Primero asegurémonos de que el store de clases esté inicializado
    if (classesStore.classes.length === 0) {
      console.log("📚 [AttendanceForm] Loading classes store...")
      await classesStore.fetchClasses()
    }

    // También cargar estudiantes si no están cargados
    if (studentsStore.students.length === 0) {
      console.log("👥 [AttendanceForm] Loading students store...")
      await studentsStore.fetchStudents()
    }

    const [classData, studentsData] = await Promise.all([
      classesStore.getClass(classId),
      Promise.resolve(studentsStore.getStudentsByClass(classId)),
      fetchAttendanceOptimized(date, classId),
    ])

    // Verificar que la clase existe
    if (!classData) {
      console.log("❌ [AttendanceForm] Class not found, redirecting to calendar")
      router.push("/teacher/attendance/calendar")
      return
    }

    // Configurar información de la clase
    if (classData) {
      classInfo.value = {
        id: classData.id,
        name: classData.name,
        teacher: classData.teacherId || authStore.user?.uid || "Maestro",
        date,
        time: formatClassTime(classData),
        classroom: classData.classroom,
        totalStudents: studentsData.length,
      }
    }

    // Verificar que tenemos estudiantes
    if (!studentsData || studentsData.length === 0) {
      console.log("⚠️ [AttendanceForm] No students found for class:", classId)
      error.value = "No se encontraron estudiantes para esta clase"
    }

    // Configurar estudiantes con estado de asistencia
    students.value = studentsData.map((student) => ({
      id: student.id,
      name: `${student.nombre || ""} ${student.apellido || ""}`.trim(),
      email: student.email,
      avatar: student.photoURL,
      status: currentAttendanceRecords.value[student.id] || "Ausente",
      isChanged: false,
      justification: "",
    }))

    console.log("✅ [AttendanceForm] Form initialized successfully", {
      studentsCount: students.value.length,
      className: classData?.name,
    })
  } catch (err) {
    console.error("❌ [AttendanceForm] Error initializing form:", err)
    error.value = "Error al cargar el formulario de asistencia"
  } finally {
    isInitializing.value = false
  }
}

// Formatear horario de clase
const formatClassTime = (classData: any): string => {
  if (classData.schedule?.slots?.length) {
    const slot = classData.schedule.slots[0]
    return `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`
  }
  return classData.time || "Horario no definido"
}

// Formatear hora
const formatTime = (timeStr: string): string => {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return timeStr

  const [hours, minutes] = timeStr.split(":")
  const date = new Date()
  date.setHours(parseInt(hours, 10))
  date.setMinutes(parseInt(minutes, 10))

  return format(date, "h:mm a", {locale: es})
}

// Actualizar estado de estudiante
const updateStudentStatus = async (
  studentId: string,
  newStatus: "present" | "absent" | "late" | "justified"
) => {
  // Mapeo de estados de inglés a español
  const statusMap: Record<string, "Presente" | "Ausente" | "Tardanza" | "Justificado"> = {
    present: "Presente",
    absent: "Ausente",
    late: "Tardanza",
    justified: "Justificado",
  }

  const spanishStatus = statusMap[newStatus] || "Ausente"
  
  const student = students.value.find((s) => s.id === studentId)
  if (!student) return

  console.log("📝 [AttendanceForm] Updating student status:", {studentId, newStatus: spanishStatus})

  // Actualizar estado local inmediatamente
  student.status = spanishStatus
  student.isChanged = true
  hasUnsavedChanges.value = true

  // Actualizar usando el composable optimizado (con debounce)
  try {
    await updateAttendanceOptimized(
      studentId,
      spanishStatus,
      selectedDate.value,
      selectedClass.value
    )
  } catch (err) {
    console.error("❌ [AttendanceForm] Error updating student status:", err)
    // Revertir cambio en caso de error
    student.status = currentAttendanceRecords.value[studentId] || "Ausente"
    student.isChanged = false
  }
}

// Acciones masivas
const markAllPresent = () => {
  console.log("⚡ [AttendanceForm] Marking all students present")
  students.value.forEach((student) => {
    if (student.status !== "Presente") {
      updateStudentStatus(student.id, "present")
    }
  })
}

const resetAllStatuses = () => {
  console.log("🔄 [AttendanceForm] Resetting all statuses")
  students.value.forEach((student) => {
    updateStudentStatus(student.id, "absent")
  })
}

// Guardar cambios
const saveChanges = debounce(async () => {
  if (!hasUnsavedChanges.value) return

  isSaving.value = true
  saveError.value = null

  try {
    console.log("💾 [AttendanceForm] Saving changes...")

    // Los cambios ya se guardan automáticamente con el composable optimizado
    // Aquí solo actualizamos el estado de UI
    students.value.forEach((student) => {
      student.isChanged = false
    })

    hasUnsavedChanges.value = false
    lastSaved.value = new Date()

    console.log("✅ [AttendanceForm] Changes saved successfully")
  } catch (err) {
    console.error("❌ [AttendanceForm] Error saving changes:", err)
    saveError.value = "Error al guardar los cambios"
  } finally {
    isSaving.value = false
  }
}, 1000)

// Salir sin guardar
const exitWithoutSaving = () => {
  if (hasUnsavedChanges.value) {
    showUnsavedWarning.value = true
  } else {
    navigateBack()
  }
}

// Confirmar salida sin guardar
const confirmExitWithoutSaving = () => {
  hasUnsavedChanges.value = false
  showUnsavedWarning.value = false
  navigateBack()
}

// Navegar de vuelta
const navigateBack = () => {
  const returnRoute = route.query.return as string

  if (returnRoute === "dashboard") {
    router.push({name: "teacher-attendance-dashboard"})
  } else {
    router.push({name: "attendance-overview"})
  }
}

// Manejar búsqueda
const handleSearch = (query: string) => {
  searchQuery.value = query
}

// Limpiar búsqueda
const clearSearch = () => {
  searchQuery.value = ""
  nextTick(() => {
    searchInput.value?.focus()
  })
}

// Focus en búsqueda (atajo de teclado)
const focusSearch = () => {
  nextTick(() => {
    searchInput.value?.focus()
  })
}

/**
 * 🎬 WATCHERS Y LIFECYCLE
 */

// Auto-guardar cuando hay cambios
watch(
  () => pendingChanges.value,
  (newCount) => {
    if (newCount > 0) {
      saveChanges()
    }
  }
)

// Watch para cambios en los registros de asistencia
watch(
  currentAttendanceRecords,
  (newRecords) => {
    // Sincronizar con el estado local
    students.value.forEach((student) => {
      if (newRecords[student.id] && !student.isChanged) {
        student.status = newRecords[student.id]
      }
    })
  },
  {deep: true}
)

// Inicializar formulario al montar
onMounted(() => {
  initializeForm()

  // Atajos de teclado
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case "s":
          event.preventDefault()
          saveChanges()
          break
        case "f":
          event.preventDefault()
          focusSearch()
          break
      }
    }
  }

  document.addEventListener("keydown", handleKeyPress)

  // Limpiar al desmontar
  return () => {
    document.removeEventListener("keydown", handleKeyPress)
  }
})

// Prevenir salida con cambios no guardados
window.addEventListener("beforeunload", (event) => {
  if (hasUnsavedChanges.value) {
    event.preventDefault()
    event.returnValue = ""
  }
})

// Exponer métodos para testing
defineExpose({
  updateStudentStatus,
  markAllPresent,
  resetAllStatuses,
  saveChanges,
  exitWithoutSaving,
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 🔄 ESTADO DE CARGA INICIAL -->
    <div v-if="isInitializing" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p class="text-gray-600 dark:text-gray-400">Cargando formulario de asistencia...</p>
      </div>
    </div>

    <!-- 📝 FORMULARIO DE ASISTENCIA -->
    <div v-else-if="currentClass && students.length > 0" class="pb-20">
      <!-- Header con información de la clase -->
      <AttendanceHeader
        v-if="currentClass"
        :class-info="currentClass"
        :formatted-date="formattedDate"
        :attendance-stats="attendanceStats"
        :is-loading="loading"
        @back="exitWithoutSaving"
      />

      <!-- Toolbar con acciones y búsqueda -->
      <AttendanceToolbar
        ref="searchInput"
        :search-query="searchQuery"
        :students-count="students.length"
        :filtered-count="displayedStudents.length"
        class="sticky top-0 z-10"
        @search="handleSearch"
        @clear-search="clearSearch"
        @mark-all-present="markAllPresent"
        @reset-all="resetAllStatuses"
      />

      <!-- Grid de estudiantes -->
      <div class="px-4 py-6">
        <StudentAttendanceGrid
          :students="displayedStudents"
          :attendance-records="attendanceRecords"
          :is-updating="isUpdatePending"
          @update-status="updateStudentStatus"
          @add-justification="
            (studentId: string, reason: string) =>
              console.log('Add justification:', studentId, reason)
          "
        />

        <!-- Mensaje si no hay estudiantes filtrados -->
        <div v-if="displayedStudents.length === 0 && searchQuery" class="text-center py-12">
          <div
            class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p class="text-gray-500 dark:text-gray-400 text-lg font-medium">
            No se encontraron estudiantes
          </p>
          <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">Busca por "{{ searchQuery }}"</p>
          <button
            class="mt-4 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            @click="clearSearch"
          >
            Limpiar búsqueda
          </button>
        </div>
      </div>

      <!-- Observaciones de la clase -->
      <ClassObservationInput
        v-model="classObservations"
        :class-id="selectedClass"
        :date="selectedDate"
        class="mx-4 mb-6"
      />
    </div>

    <!-- 🚫 ESTADO SIN DATOS O ERROR -->
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="text-center max-w-md mx-auto px-4">
        <div class="mb-6">
          <svg
            class="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Registro de Asistencia
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Para registrar asistencia, primero debes seleccionar una fecha y una clase desde el
          calendario.
        </p>
        <div class="space-y-3">
          <button
            class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            @click="router.push('/teacher/attendance/calendar')"
          >
            📅 Ir al Calendario
          </button>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Desde el calendario podrás seleccionar la fecha y ver las clases disponibles para ese
            día.
          </p>
        </div>
      </div>
    </div>

    <!-- 🚀 BARRA DE ACCIONES FLOTANTE -->
    <FloatingActionBar
      :pending-changes="pendingChanges"
      :is-saving="isSaving"
      :last-saved="lastSaved"
      :save-error="saveError"
      @save="saveChanges"
      @exit="exitWithoutSaving"
    />

    <!-- ⚠️ MODAL DE ADVERTENCIA -->
    <div
      v-if="showUnsavedWarning"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <div class="flex items-center space-x-3 mb-4">
            <div
              class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Cambios sin guardar
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Tienes {{ pendingChanges }} cambio{{ pendingChanges > 1 ? "s" : "" }} pendiente{{
                  pendingChanges > 1 ? "s" : ""
                }}
              </p>
            </div>
          </div>

          <p class="text-gray-700 dark:text-gray-300 mb-6">
            ¿Estás seguro de que quieres salir sin guardar los cambios?
          </p>

          <div class="flex items-center justify-end space-x-3">
            <button
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              @click="showUnsavedWarning = false"
            >
              Cancelar
            </button>
            <button
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              @click="
                async () => {
                  await saveChanges()
                  navigateBack()
                }
              "
            >
              Guardar y Salir
            </button>
            <button
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              @click="confirmExitWithoutSaving"
            >
              Salir sin Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 🚨 ESTADO DE ERROR -->
    <div
      v-if="error"
      class="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-sm"
    >
      <div class="flex items-center space-x-2">
        <svg
          class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p class="text-sm font-medium text-red-800 dark:text-red-400">Error</p>
          <p class="text-xs text-red-700 dark:text-red-500">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animaciones personalizadas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Efectos de scroll suave */
.smooth-scroll {
  scroll-behavior: smooth;
}

/* Optimizaciones de rendimiento */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}
</style>
