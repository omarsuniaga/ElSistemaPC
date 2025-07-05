<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
    <div class="mb-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Métricas de Asistencia - Última Semana
      </h3>

      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span class="ml-2 text-gray-600 dark:text-gray-400">Cargando métricas...</span>
      </div>

      <div v-else-if="error" class="text-center py-8">
        <p class="text-red-500">Error al cargar las métricas de asistencia.</p>
      </div>

      <div v-else class="space-y-6">
        <!-- KPIs Principales -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-100 text-sm font-medium">Tasa de Asistencia</p>
                <p class="text-3xl font-bold">{{ weeklyKPIs.attendanceRate }}%</p>
              </div>
              <div class="text-green-200">
                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-blue-100 text-sm font-medium">Total Clases</p>
                <p class="text-3xl font-bold">{{ weeklyKPIs.totalClasses }}</p>
              </div>
              <div class="text-blue-200">
                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-purple-100 text-sm font-medium">Total Estudiantes</p>
                <p class="text-3xl font-bold">{{ weeklyKPIs.totalStudents }}</p>
              </div>
              <div class="text-purple-200">
                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM9.5 14.5c0-1.381 1.119-2.5 2.5-2.5s2.5 1.119 2.5 2.5v1.5H9.5v-1.5zM6 10a2 2 0 11-4 0 2 2 0 014 0zM1.5 15.5c0-1.381 1.119-2.5 2.5-2.5s2.5 1.119 2.5 2.5v1.5H1.5v-1.5zM16 10a2 2 0 11-4 0 2 2 0 014 0zM13.5 15.5c0-1.381 1.119-2.5 2.5-2.5s2.5 1.119 2.5 2.5v1.5h-5v-1.5z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Métricas Detalladas -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800"
          >
            <div class="text-green-800 dark:text-green-200 text-sm font-medium mb-1">Presentes</div>
            <div class="text-green-900 dark:text-green-100 text-2xl font-bold">
              {{ weeklyKPIs.presentes }}
            </div>
            <div class="text-green-600 dark:text-green-300 text-xs">estudiantes</div>
          </div>

          <div
            class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800"
          >
            <div class="text-red-800 dark:text-red-200 text-sm font-medium mb-1">Ausentes</div>
            <div class="text-red-900 dark:text-red-100 text-2xl font-bold">
              {{ weeklyKPIs.ausentes }}
            </div>
            <div class="text-red-600 dark:text-red-300 text-xs">estudiantes</div>
          </div>

          <div
            class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800"
          >
            <div class="text-yellow-800 dark:text-yellow-200 text-sm font-medium mb-1">
              Tardanzas
            </div>
            <div class="text-yellow-900 dark:text-yellow-100 text-2xl font-bold">
              {{ weeklyKPIs.tardes }}
            </div>
            <div class="text-yellow-600 dark:text-yellow-300 text-xs">estudiantes</div>
          </div>

          <div
            class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <div class="text-blue-800 dark:text-blue-200 text-sm font-medium mb-1">
              Justificados
            </div>
            <div class="text-blue-900 dark:text-blue-100 text-2xl font-bold">
              {{ weeklyKPIs.justificados }}
            </div>
            <div class="text-blue-600 dark:text-blue-300 text-xs">estudiantes</div>
          </div>
        </div>

        <!-- Resumen Rápido -->
        <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Resumen Semanal</h4>
          <div class="text-sm text-gray-600 dark:text-gray-300">
            <span
              >Del total de <strong>{{ weeklyKPIs.totalStudents }}</strong> registros de asistencia
              en <strong>{{ weeklyKPIs.totalClasses }}</strong> clases, el
              <strong>{{ weeklyKPIs.attendanceRate }}%</strong> corresponde a estudiantes
              presentes.</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from "vue"
import {useAttendanceStore} from "@/stores/attendance"
import {useAuthStore} from "@/stores/auth"
import {format} from "date-fns"

defineOptions({name: "WeeklyAttendanceChart"})

const loading = ref(true)
const error = ref(false)

// Stores
const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()

// Datos de la semana
const weeklyData = ref({
  presentes: 0,
  ausentes: 0,
  tardes: 0,
  justificados: 0,
  totalClasses: 0,
})

// KPIs computados para la semana
const weeklyKPIs = computed(() => {
  const {presentes, ausentes, tardes, justificados, totalClasses} = weeklyData.value
  const totalStudents = presentes + ausentes + tardes + justificados
  const attendanceRate = totalStudents > 0 ? Math.round((presentes / totalStudents) * 100) : 0

  return {
    presentes,
    ausentes,
    tardes,
    justificados,
    totalStudents,
    totalClasses,
    attendanceRate,
  }
})

const fetchWeeklyAttendance = async () => {
  loading.value = true
  error.value = false
  try {
    console.log("[WeeklyAttendanceChart] Iniciando carga de métricas semanales...")

    const today = new Date()
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      return d
    }).reverse()

    // Obtener rango de fechas para el store
    const startDate = format(last7Days[0], "yyyy-MM-dd")
    const endDate = format(last7Days[6], "yyyy-MM-dd")

    console.log(`[WeeklyAttendanceChart] Obteniendo datos del ${startDate} al ${endDate}`)

    // Usar el store de asistencia para obtener documentos
    const teacherId = authStore.user?.uid
    if (!teacherId) {
      throw new Error("Usuario no autenticado")
    }

    // Obtener documentos de asistencia para el rango de fechas
    await attendanceStore.fetchAttendanceDocumentsByTeacher(teacherId, startDate, endDate)

    // Inicializar contadores
    let totalPresentes = 0
    let totalAusentes = 0
    let totalTardes = 0
    let totalJustificados = 0
    const classesSet = new Set<string>()

    // Procesar los documentos para extraer estadísticas
    attendanceStore.attendanceDocuments.forEach((doc) => {
      const docDate = new Date(doc.fecha)
      const isInRange = docDate >= last7Days[0] && docDate <= last7Days[6]

      if (isInRange && doc.data) {
        // Agregar clase al set para contar clases únicas
        classesSet.add(`${doc.fecha}_${doc.classId}`)

        // Sumar presentes
        totalPresentes += doc.data.presentes?.length || 0

        // Obtener justificados
        const justificados = doc.data.justificacion?.map((j) => j.studentId || j.id) || []

        // Sumar ausentes (excluyendo los justificados)
        const ausentes = doc.data.ausentes || []
        const ausentesNoJustificados = ausentes.filter(
          (studentId) => !justificados.includes(studentId)
        )
        totalAusentes += ausentesNoJustificados.length

        // Sumar tardanzas (excluyendo los justificados)
        const tardanzas = doc.data.tarde || []
        const tardanzasNoJustificadas = tardanzas.filter(
          (studentId) => !justificados.includes(studentId)
        )
        totalTardes += tardanzasNoJustificadas.length

        // Sumar justificados (de todas las categorías)
        totalJustificados += justificados.length
      }
    })

    // Actualizar datos
    weeklyData.value = {
      presentes: totalPresentes,
      ausentes: totalAusentes,
      tardes: totalTardes,
      justificados: totalJustificados,
      totalClasses: classesSet.size,
    }

    console.log("[WeeklyAttendanceChart] Métricas cargadas exitosamente:", weeklyData.value)
  } catch (e) {
    console.error("[WeeklyAttendanceChart] Error al cargar métricas semanales:", e)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchWeeklyAttendance()
})
</script>
