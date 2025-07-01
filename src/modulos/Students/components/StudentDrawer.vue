<script setup lang="ts">
import {ref, computed, watch, onMounted} from "vue"
import type {AttendanceRecord} from "../../Attendance/types/attendance"
import * as attendanceService from "../../Attendance/service/attendance"
import {useStudentsStore} from "../store/students"
import {useAttendanceStore} from "../../Attendance/store/attendance"
import {useAnalyticsStore} from "../../Analytics/store/analytics"
import {useRouter} from "vue-router"
import {Bar as BarChart} from "vue-chartjs"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import FileUpload from "../../../components/FileUpload.vue"
import StudentAvatar from "./StudentAvatar.vue"

// Registrar los componentes de Chart.js que necesitamos
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  student: {
    type: Object,
    default: null,
  },
  studentId: {
    type: String,
    default: "",
  },
  // Nueva prop para datos de análisis del estudiante
  studentAnalytics: {
    type: Object,
    default: () => ({
      performance: 0,
      attendance: 0,
      lastAccess: "",
      riskFactors: [],
      recommendedActions: [],
    }),
  },
})

const emit = defineEmits<{
  (e: "close"): void
  (e: "edit", id: string): void
  (e: "view-profile", id: string): void
  (e: "manage-documents", id: string): void
}>()

const isLoading = ref(false)
const error = ref<string | null>(null)
const attendanceRecords = ref<AttendanceRecord[]>([])
const contentProgress = ref<{title: string; progress: number}[]>([])

// Computed attendance stats
const attendanceStats = computed(() => {
  if (!attendanceRecords.value.length) return null

  return {
    total: attendanceRecords.value.length,
    present: attendanceRecords.value.filter((r) => r.status === "Presente").length,
    absent: attendanceRecords.value.filter((r) => r.status === "Ausente").length,
    justified: attendanceRecords.value.filter((r) => r.status === "Justificado").length,
    late: attendanceRecords.value.filter((r) => r.status === "Tardanza").length,
  }
})

// Computed attendance rate con clasificación según criterios específicos
const attendanceRate = computed(() => {
  if (!attendanceStats.value) return 0
  const {total, present, late = 0} = attendanceStats.value
  return Math.round(((present + late) / total) * 100)
})

// Clasificación del estudiante según su porcentaje de asistencia
const studentClassification = computed(() => {
  if (!attendanceStats.value || attendanceStats.value.total === 0) {
    return {
      type: "Sin datos",
      color: "gray",
      description: "No hay datos suficientes para evaluar al estudiante",
    }
  }

  const rate = attendanceRate.value

  if (rate >= 70) {
    return {
      type: "Responsable",
      color: "green",
      description: "Excelente asistencia. El estudiante asiste regularmente a clases.",
    }
  } else if (rate >= 40) {
    return {
      type: "Irregular",
      color: "yellow",
      description: "Asistencia inconsistente. Es necesario mejorar la regularidad.",
    }
  } else {
    return {
      type: "Crítico",
      color: "red",
      description: "Atención requerida. Asistencia muy baja.",
    }
  }
})

// Generando datos de gráfico para Chart.js
const chartData = computed(() => {
  if (!attendanceRecords.value.length) {
    return {
      labels: ["Sin datos"],
      datasets: [
        {
          label: "Asistencia",
          data: [0],
          backgroundColor: "#e5e7eb",
        },
      ],
    }
  }

  // Agrupar por meses los registros de asistencia
  const monthlyData = attendanceRecords.value.reduce((acc, record) => {
    if (!record.Fecha) return acc

    try {
      const date = new Date(record.Fecha)
      const month = date.toLocaleDateString("es-ES", {month: "short"})

      if (!acc[month]) {
        acc[month] = {
          present: 0,
          absent: 0,
          justified: 0,
          late: 0,
          total: 0,
        }
      }

      acc[month].total++

      const status = (record.status || "").toLowerCase()
      if (status === "presente" || status === "present") {
        acc[month].present++
      } else if (status === "ausente" || status === "absent") {
        acc[month].absent++
        if (record.justification) {
          acc[month].justified++
        }
      } else if (status === "tardanza" || status === "tarde" || status === "late") {
        acc[month].late++
      }
    } catch (error) {
      console.error("Error procesando fecha:", error)
    }

    return acc
  }, {})

  // Convertir datos agrupados para Chart.js
  const months = Object.keys(monthlyData).slice(-3) // Últimos 3 meses para una vista compacta

  return {
    labels: months,
    datasets: [
      {
        label: "Asistencias",
        data: months.map((m) => monthlyData[m].present),
        backgroundColor: "#22c55e",
      },
      {
        label: "Tardanzas",
        data: months.map((m) => monthlyData[m].late),
        backgroundColor: "#f59e0b",
      },
      {
        label: "Ausencias",
        data: months.map((m) => monthlyData[m].absent),
        backgroundColor: "#ef4444",
      },
      {
        label: "Justificadas",
        data: months.map((m) => monthlyData[m].justified),
        backgroundColor: "#a855f7",
      },
    ],
  }
})

// Opciones para la gráfica de Chart.js
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
      beginAtZero: true,
    },
  },
  plugins: {
    legend: {
      display: true,
      position: "bottom",
      labels: {
        boxWidth: 12,
        padding: 10,
      },
    },
  },
}

// Load student data when student changes
watch(
  () => props.student,
  async (newStudent) => {
    if (newStudent) {
      await loadStudentData(newStudent.id)
    }
  },
  {immediate: true}
)

// Load student attendance and content data
async function loadStudentData(studentId: string) {
  isLoading.value = true
  error.value = null

  try {
    // Load attendance records
    const records = await fetchStudentAttendance(studentId)
    attendanceRecords.value = records

    // Mock content progress data (replace with actual API call when available)
    contentProgress.value = [
      {title: "Teoría Musical", progress: Math.floor(Math.random() * 100)},
      {title: "Técnica", progress: Math.floor(Math.random() * 100)},
      {title: "Repertorio", progress: Math.floor(Math.random() * 100)},
      {title: "Lectura a primera vista", progress: Math.floor(Math.random() * 100)},
    ]
  } catch (err: any) {
    console.error("Error loading student data:", err)
    error.value = err.message || "Error al cargar los datos del estudiante"
  } finally {
    isLoading.value = false
  }
}

// Fetch student attendance records
async function fetchStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
  try {
    // Get all attendance records
    const allRecords = await attendanceService.getAttendancesFirebase()
    // Filter by student ID
    return allRecords
      .filter((record) => record.studentId === studentId)
      .map((record) => ({
        ...record,
        justification:
          typeof record.justification === "string"
            ? {reason: record.justification}
            : record.justification,
      }))
  } catch (err) {
    console.error("Error fetching attendance:", err)
    throw err
  }
}

// Get instrument icon based on instrument name
function getInstrumentIcon(instrument: string): string {
  const instruments: Record<string, string> = {
    Piano: "https://cdn-icons-png.flaticon.com/512/3119/3119718.png",
    Guitarra: "https://cdn-icons-png.flaticon.com/512/3079/3079213.png",
    Violín: "https://cdn-icons-png.flaticon.com/512/3079/3079267.png",
    Flauta: "https://cdn-icons-png.flaticon.com/512/3079/3079183.png",
    Batería: "https://cdn-icons-png.flaticon.com/512/3079/3079218.png",
    Saxofón: "https://cdn-icons-png.flaticon.com/512/3079/3079257.png",
    Trompeta: "https://cdn-icons-png.flaticon.com/512/3079/3079264.png",
    Violonchelo: "https://cdn-icons-png.flaticon.com/512/3079/3079268.png",
  }

  return instruments[instrument] || "https://cdn-icons-png.flaticon.com/512/3079/3079165.png"
}

// Get instrument description
function getInstrumentDescription(instrument: string): string {
  const descriptions: Record<string, string> = {
    Piano: "Instrumento de teclado con amplio rango tonal",
    Guitarra: "Instrumento de cuerda pulsada versátil",
    Violín: "Instrumento de cuerda frotada de registro agudo",
    Flauta: "Instrumento de viento-madera de sonido brillante",
    Batería: "Conjunto de instrumentos de percusión",
    Saxofón: "Instrumento de viento-madera con lengüeta simple",
    Trompeta: "Instrumento de viento-metal brillante",
    Violonchelo: "Instrumento de cuerda frotada de registro grave",
  }

  return descriptions[instrument] || "Instrumento musical"
}

// Function to view detailed profile
function viewProfile() {
  if (props.student?.id) {
    emit("view-profile", props.student.id)
  }
}

// Function to manage student documents
function manageDocuments() {
  if (props.student?.id) {
    emit("manage-documents", props.student.id)
  }
}

// Nuevas propiedades calculadas
const studentsStore = useStudentsStore()
const attendanceStore = useAttendanceStore()
const analyticsStore = useAnalyticsStore()

const studentPerformance = computed(() => {
  // Usar datos de la prop si están disponibles
  if (props.studentAnalytics && props.studentAnalytics.performance !== undefined) {
    return props.studentAnalytics.performance
  }

  // Fallback a cálculos anteriores o valor por defecto
  // ...código existente para calcular el rendimiento si es necesario...
  return 0
})

const studentAttendance = computed(() => {
  // Usar datos de la prop si están disponibles
  if (props.studentAnalytics && props.studentAnalytics.attendance !== undefined) {
    return props.studentAnalytics.attendance
  }

  // Fallback a cálculos anteriores o valor por defecto
  // ...código existente para calcular asistencia si es necesario...
  return 0
})

const lastAccess = computed(() => {
  // Usar datos de la prop si están disponibles
  if (props.studentAnalytics && props.studentAnalytics.lastAccess) {
    return props.studentAnalytics.lastAccess
  }

  // Fallback
  return "No registrado"
})

const riskFactors = computed(() => {
  // Usar datos de la prop si están disponibles
  if (props.studentAnalytics && props.studentAnalytics.riskFactors) {
    return props.studentAnalytics.riskFactors
  }

  return []
})

const recommendedActions = computed(() => {
  // Usar datos de la prop si están disponibles
  if (props.studentAnalytics && props.studentAnalytics.recommendedActions) {
    return props.studentAnalytics.recommendedActions
  }

  return []
})

// Agregar el router
const router = useRouter()

// Agregar la función viewSchedule
const viewSchedule = () => {
  if (props.student?.id) {
    router.push({name: "studentSchedule", params: {id: props.student.id}})
  } else {
    console.error("No se puede mostrar el horario: ID de estudiante no disponible")
  }
}

// Funciones para manejar la subida de fotos de perfil
function isValidImageUrl(url: string | undefined): boolean {
  if (!url) return false
  return (
    typeof url === "string" &&
    (url.startsWith("http") || url.startsWith("https") || url.startsWith("data:image"))
  )
}

function handleImageError(event: Event) {
  // Si la imagen falla al cargar, usar el avatar generado
  const imgElement = event.target as HTMLImageElement
  if (imgElement && student.value?.nombre) {
    imgElement.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.value.nombre}`
  }
}

function handleProfilePhotoUpload(url: string) {
  if (!student.value?.id) return

  console.log("[StudentDrawer] URL de foto recibida:", url)

  // Verificar que sea una URL válida de Firebase Storage
  if (!url.includes("firebasestorage.googleapis.com")) {
    console.error("[StudentDrawer] URL inválida:", url)
    emit("error", "La URL de la imagen no es válida")
    return
  }

  // Actualizar el avatar del estudiante
  studentsStore
    .updateStudent(student.value.id, {avatar: url})
    .then(() => {
      console.log("[StudentDrawer] Avatar actualizado correctamente")
      // No es necesario hacer nada más, la UI se actualiza automáticamente
    })
    .catch((error) => {
      console.error("[StudentDrawer] Error al actualizar avatar:", error)
      emit("error", `Error al guardar foto: ${error.message || "Error desconocido"}`)
    })
}

function handleUploadError(message: string) {
  console.error("[StudentDrawer] Error de subida:", message)
  emit("error", message)
}
</script>
<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity z-[100]"
    @click="$emit('close')"
  />
  <div
    class="fixed inset-y-0 right-0 max-w-full flex z-[100] transform transition-all duration-300 ease-in-out"
    :class="{'translate-x-0': show, 'translate-x-full': !show}"
  >
    <div
      class="relative w-screen max-w-md bg-white dark:bg-gray-800 shadow-xl flex flex-col h-full"
      @click.stop
    >
      <!-- Header -->
      <div
        class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
      >
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">Detalles del Alumno</h2>
        <button
          class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          @click="$emit('close')"
        >
          <span class="sr-only">Cerrar</span>
          <svg
            class="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto pb-16">
        <div v-if="isLoading" class="flex justify-center items-center h-full">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>

        <div
          v-else-if="error"
          class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg"
        >
          {{ error }}
        </div>

        <div v-else-if="student" class="space-y-6">
          <!-- Student Profile -->
          <div class="flex items-center space-x-4">
            <div class="relative">
              <StudentAvatar
                :first-name="student.nombre || ''"
                :last-name="student.apellido || ''"
                size="lg"
              />
            </div>
            <div>
              <h3 class="text-xl font-bold">{{ student.nombre }} {{ student.apellido }}</h3>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="grupo in student.grupo || []"
                  :key="grupo"
                  class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {{ grupo }}
                </span>
                <span
                  v-if="!student.grupo?.length"
                  class="px-2 py-0.5 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 rounded-full"
                >
                  Sin grupo asignado
                </span>
              </div>
            </div>
          </div>
          <!-- Student Info -->
          <div class="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-3">
            <!-- Action Buttons -->
            <div class="border-t border-gray-200 dark:border-gray-700 p-4">
              <div class="grid grid-cols-3 gap-3 mb-3">
                <button
                  class="btn btn-outline-primary flex items-center justify-center dark:text-gray-800 dark:bg-gray-400"
                  @click="viewProfile()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Editar Alumno
                </button>
                <button
                  class="btn btn-outline-secondary flex items-center justify-center dark:text-gray-800 dark:bg-gray-400"
                  @click="viewProfile()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Ver Perfil
                </button>
                <button
                  class="btn btn-outline-info flex items-center justify-center dark:text-gray-800 dark:bg-gray-400"
                  @click="manageDocuments()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Documentos
                </button>
                <button
                  class="btn btn-outline-info flex items-center justify-center dark:text-gray-800 dark:bg-gray-400"
                  @click="viewSchedule()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Horario
                </button>
              </div>
            </div>
            <h4 class="font-medium">Información Personal</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Edad:</span>
                <span class="ml-1 font-medium">{{ student.edad || "No disponible" }} años</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Teléfono:</span>
                <span class="ml-1 font-medium">{{ student.tlf || "No disponible" }}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Email:</span>
                <span class="ml-1 font-medium">{{ student.email || "No disponible" }}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Instrumento:</span>
                <span class="ml-1 font-medium">{{ student.instrumento || "Sin instrumento" }}</span>
              </div>
              <div class="col-span-2">
                <span class="text-gray-500 dark:text-gray-400">Fecha de inscripción:</span>
                <span class="ml-1 font-medium">{{
                  student.fecInscripcion || "No disponible"
                }}</span>
              </div>
            </div>
          </div>
          <!-- Attendance Analysis -->
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div
              class="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 border-b border-gray-200 dark:border-gray-700"
            >
              <h4 class="font-medium flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Análisis de Asistencia
              </h4>
            </div>
            <div class="p-4">
              <div v-if="attendanceStats">
                <!-- Clasificación del estudiante -->
                <div
                  class="mb-3 p-3 rounded-lg"
                  :class="{
                    'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30':
                      studentClassification.color === 'green',
                    'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30':
                      studentClassification.color === 'yellow',
                    'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30':
                      studentClassification.color === 'red',
                    'bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800/30':
                      studentClassification.color === 'gray',
                  }"
                >
                  <div class="flex justify-between items-center">
                    <div>
                      <h5
                        class="font-medium"
                        :class="{
                          'text-green-700 dark:text-green-400':
                            studentClassification.color === 'green',
                          'text-yellow-700 dark:text-yellow-400':
                            studentClassification.color === 'yellow',
                          'text-red-700 dark:text-red-400': studentClassification.color === 'red',
                          'text-gray-700 dark:text-gray-400':
                            studentClassification.color === 'gray',
                        }"
                      >
                        {{ studentClassification.type }}
                      </h5>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        {{ studentClassification.description }}
                      </p>
                    </div>
                    <div
                      class="text-xl font-bold"
                      :class="{
                        'text-green-600 dark:text-green-400':
                          studentClassification.color === 'green',
                        'text-yellow-600 dark:text-yellow-400':
                          studentClassification.color === 'yellow',
                        'text-red-600 dark:text-red-400': studentClassification.color === 'red',
                        'text-gray-600 dark:text-gray-400': studentClassification.color === 'gray',
                      }"
                    >
                      {{ attendanceRate }}%
                    </div>
                  </div>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                  <div
                    class="h-2.5 rounded-full"
                    :class="{
                      'bg-green-600': attendanceRate >= 85,
                      'bg-yellow-500': attendanceRate >= 75 && attendanceRate < 85,
                      'bg-red-600': attendanceRate < 75,
                    }"
                    :style="{width: `${attendanceRate}%`}"
                  />
                </div>
                <div class="grid grid-cols-2 gap-3 text-center">
                  <div class="bg-green-100 dark:bg-green-900/30 p-2 rounded">
                    <div class="text-xl font-bold text-green-700 dark:text-green-400">
                      {{ attendanceStats.present }}
                    </div>
                    <div class="text-xs text-green-600 dark:text-green-500">Presentes</div>
                  </div>
                  <div class="bg-red-100 dark:bg-red-900/30 p-2 rounded">
                    <div class="text-xl font-bold text-red-700 dark:text-red-400">
                      {{ attendanceStats.absent }}
                    </div>
                    <div class="text-xs text-red-600 dark:text-red-500">Ausencias</div>
                  </div>
                  <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                    <div class="text-xl font-bold text-blue-700 dark:text-blue-400">
                      {{ attendanceStats.justified }}
                    </div>
                    <div class="text-xs text-blue-600 dark:text-blue-500">Justificadas</div>
                  </div>
                  <div class="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                    <div class="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                      {{ attendanceStats.late }}
                    </div>
                    <div class="text-xs text-yellow-600 dark:text-yellow-500">Tardanzas</div>
                  </div>
                </div>

                <!-- Visualización alternativa de asistencia -->
                <div class="mt-4 mb-3">
                  <h5 class="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Asistencia por meses
                  </h5>
                  <div class="space-y-3">
                    <template
                      v-if="chartData.labels.length > 0 && chartData.labels[0] !== 'Sin datos'"
                    >
                      <div v-for="(month, idx) in chartData.labels" :key="idx">
                        <div class="flex justify-between text-xs mb-1">
                          <span class="font-medium">{{ month }}</span>
                          <span
                            >{{
                              chartData.datasets[0].data[idx] +
                              chartData.datasets[1].data[idx] +
                              chartData.datasets[2].data[idx] +
                              chartData.datasets[3].data[idx]
                            }}
                            clases</span
                          >
                        </div>
                        <div class="flex h-6 w-full rounded-md overflow-hidden">
                          <!-- Presentes -->
                          <div
                            class="bg-green-500"
                            :style="{
                              width:
                                chartData.datasets[0].data[idx] > 0
                                  ? `${(chartData.datasets[0].data[idx] / (chartData.datasets[0].data[idx] + chartData.datasets[1].data[idx] + chartData.datasets[2].data[idx] + chartData.datasets[3].data[idx])) * 100}%`
                                  : '0%',
                            }"
                            :title="`Presentes: ${chartData.datasets[0].data[idx]}`"
                          />
                          <!-- Tardanzas -->
                          <div
                            class="bg-yellow-500"
                            :style="{
                              width:
                                chartData.datasets[1].data[idx] > 0
                                  ? `${(chartData.datasets[1].data[idx] / (chartData.datasets[0].data[idx] + chartData.datasets[1].data[idx] + chartData.datasets[2].data[idx] + chartData.datasets[3].data[idx])) * 100}%`
                                  : '0%',
                            }"
                            :title="`Tardanzas: ${chartData.datasets[1].data[idx]}`"
                          />
                          <!-- Ausencias -->
                          <div
                            class="bg-red-500"
                            :style="{
                              width:
                                chartData.datasets[2].data[idx] > 0
                                  ? `${(chartData.datasets[2].data[idx] / (chartData.datasets[0].data[idx] + chartData.datasets[1].data[idx] + chartData.datasets[2].data[idx] + chartData.datasets[3].data[idx])) * 100}%`
                                  : '0%',
                            }"
                            :title="`Ausencias: ${chartData.datasets[2].data[idx]}`"
                          />
                          <!-- Justificadas -->
                          <div
                            class="bg-purple-500"
                            :style="{
                              width:
                                chartData.datasets[3].data[idx] > 0
                                  ? `${(chartData.datasets[3].data[idx] / (chartData.datasets[0].data[idx] + chartData.datasets[1].data[idx] + chartData.datasets[2].data[idx] + chartData.datasets[3].data[idx])) * 100}%`
                                  : '0%',
                            }"
                            :title="`Justificadas: ${chartData.datasets[3].data[idx]}`"
                          />
                        </div>
                      </div>
                    </template>
                    <div v-else class="text-center text-sm text-gray-500">
                      No hay datos suficientes para mostrar
                    </div>
                  </div>
                  <div class="flex gap-2 text-xs mt-2 justify-center">
                    <div class="flex items-center gap-1">
                      <div class="w-3 h-3 bg-green-500 rounded-sm" />
                      <span>Presentes</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="w-3 h-3 bg-yellow-500 rounded-sm" />
                      <span>Tardanzas</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="w-3 h-3 bg-red-500 rounded-sm" />
                      <span>Ausencias</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="w-3 h-3 bg-purple-500 rounded-sm" />
                      <span>Justificadas</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
                No hay datos de asistencia disponibles
              </div>
            </div>
          </div>

          <!-- Content Progress -->
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div
              class="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 border-b border-gray-200 dark:border-gray-700"
            >
              <h4 class="font-medium">Progreso de Contenidos</h4>
            </div>
            <div class="p-4">
              <div v-if="contentProgress && contentProgress.length > 0">
                <div
                  v-for="(content, index) in contentProgress"
                  :key="index"
                  class="mb-3 last:mb-0"
                >
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium">{{ content.title }}</span>
                    <span class="text-sm font-bold">{{ content.progress }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="bg-primary-600 h-2 rounded-full"
                      :style="{width: `${content.progress}%`}"
                    />
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
                No hay datos de progreso disponibles
              </div>
            </div>
          </div>

          <!-- Instrument Details -->
          <div
            v-if="student.instrumento"
            class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <div
              class="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 border-b border-gray-200 dark:border-gray-700"
            >
              <h4 class="font-medium">Detalles del Instrumento</h4>
            </div>
            <div class="p-4">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  <img
                    :src="getInstrumentIcon(student.instrumento)"
                    :alt="student.instrumento"
                    class="w-12 h-12"
                  />
                </div>
                <div>
                  <h5 class="font-medium">{{ student.instrumento }}</h5>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ getInstrumentDescription(student.instrumento) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Metrics -->
          <div class="mt-4 space-y-4">
            <div class="border-t pt-4">
              <h3 class="text-lg font-medium">Métricas de Rendimiento</h3>
              <div class="mt-2 space-y-2">
                <div class="flex justify-between">
                  <span>Rendimiento General:</span>
                  <span class="font-medium">{{ studentPerformance }}%</span>
                </div>
                <div class="flex justify-between">
                  <span>Asistencia:</span>
                  <span class="font-medium">{{ studentAttendance }}%</span>
                </div>
                <div class="flex justify-between">
                  <span>Último Acceso:</span>
                  <span class="font-medium">{{ lastAccess }}</span>
                </div>
              </div>
            </div>

            <div v-if="riskFactors.length > 0" class="border-t pt-4">
              <h3 class="text-lg font-medium">Factores de Riesgo</h3>
              <ul class="mt-2 list-disc list-inside">
                <li v-for="(factor, index) in riskFactors" :key="index">
                  {{ factor }}
                </li>
              </ul>
            </div>

            <div v-if="recommendedActions.length > 0" class="border-t pt-4">
              <h3 class="text-lg font-medium">Acciones Recomendadas</h3>
              <ul class="mt-2 list-disc list-inside">
                <li v-for="(action, index) in recommendedActions" :key="index">
                  {{ action }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
