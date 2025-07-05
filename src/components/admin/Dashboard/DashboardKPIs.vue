<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- KPI Card: Active Students -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <div class="flex items-center">
        <div class="flex-shrink-0 bg-blue-500 rounded-md p-3">
          <UserGroupIcon class="h-6 w-6 text-white" />
        </div>
        <div class="ml-4 flex-1">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Estudiantes Activos
            </p>
            <div class="relative group">
              <QuestionMarkCircleIcon
                class="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-pointer"
              />
              <div
                class="absolute bottom-full mb-2 w-48 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              >
                Total de estudiantes con estado "Activo".
              </div>
            </div>
          </div>
          <div
            v-if="loading"
            class="mt-1 h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          />
          <p v-else class="text-2xl font-semibold text-gray-900 dark:text-white">
            {{ kpis.activeStudents }}
          </p>
        </div>
      </div>
    </div>

    <!-- KPI Card: Classes Today -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <div class="flex items-center">
        <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
          <CalendarDaysIcon class="h-6 w-6 text-white" />
        </div>
        <div class="ml-4 flex-1">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Clases Hoy</p>
            <div class="relative group">
              <QuestionMarkCircleIcon
                class="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-pointer"
              />
              <div
                class="absolute bottom-full mb-2 w-48 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              >
                Total de clases programadas para el día de hoy.
              </div>
            </div>
          </div>
          <div
            v-if="loading"
            class="mt-1 h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          />
          <p v-else class="text-2xl font-semibold text-gray-900 dark:text-white">
            {{ kpis.classesToday }}
          </p>
        </div>
      </div>
    </div>

    <!-- KPI Card: Daily Attendance -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <div class="flex items-center">
        <div class="flex-shrink-0 bg-yellow-500 rounded-md p-3">
          <CheckCircleIcon class="h-6 w-6 text-white" />
        </div>
        <div class="ml-4 flex-1">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Asistencia Hoy
            </p>
            <div class="relative group">
              <QuestionMarkCircleIcon
                class="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-pointer"
              />
              <div
                class="absolute bottom-full mb-2 w-56 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              >
                Porcentaje de estudiantes marcados como "Presente" del total de asistencias
                registradas hoy.
              </div>
            </div>
          </div>
          <div
            v-if="loading"
            class="mt-1 h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          />
          <p v-else class="text-2xl font-semibold text-gray-900 dark:text-white">
            {{ kpis.dailyAttendance }}%
          </p>
        </div>
      </div>
    </div>

    <!-- KPI Card: Pending Notifications -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <div class="flex items-center">
        <div class="flex-shrink-0 bg-red-500 rounded-md p-3">
          <BellAlertIcon class="h-6 w-6 text-white" />
        </div>
        <div class="ml-4 flex-1">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Alertas</p>
            <div class="relative group">
              <QuestionMarkCircleIcon
                class="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-pointer"
              />
              <div
                class="absolute bottom-full mb-2 w-60 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              >
                Suma de estudiantes ausentes y con tardanza hoy que podrían requerir una
                notificación.
              </div>
            </div>
          </div>
          <div
            v-if="loading"
            class="mt-1 h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          />
          <p v-else class="text-2xl font-semibold text-gray-900 dark:text-white">
            {{ kpis.pendingNotifications }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from "vue"
import {
  UserGroupIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  BellAlertIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/vue/24/outline"
import {useStudentsStore} from "../../../modulos/Students/store/students"
import {useClassesStore} from "../../../modulos/Classes/store/classes"
import {useAttendanceStore} from "../../../modulos/Attendance/store/attendance"
import {format} from "date-fns"

defineOptions({name: "DashboardKPIs"})

const loading = ref(true)
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const attendanceStore = useAttendanceStore()

// Función auxiliar para obtener estadísticas específicas del día
const getTodayAttendanceStats = () => {
  const today = new Date()
  const todayStr = format(today, "yyyy-MM-dd")

  // Obtener documentos de asistencia del día actual
  const todayDocs = attendanceStore.attendanceDocuments.filter((doc) => doc.fecha === todayStr)

  if (todayDocs.length === 0) {
    return {
      attendanceRate: 100,
      pendingNotifications: 0,
      totalClasses: 0,
      totalStudents: 0,
    }
  }

  let totalPresentes = 0
  let totalAusentes = 0
  let totalTardes = 0
  let totalJustificados = 0

  todayDocs.forEach((doc) => {
    totalPresentes += doc.data.presentes?.length || 0
    totalAusentes += doc.data.ausentes?.length || 0
    totalTardes += doc.data.tarde?.length || 0
    totalJustificados += doc.data.justificacion?.length || 0
  })

  const totalStudents = totalPresentes + totalAusentes + totalTardes
  const attendanceRate =
    totalStudents > 0 ? Math.round((totalPresentes / totalStudents) * 100) : 100
  const pendingNotifications = totalAusentes + totalTardes // Excluimos justificados

  return {
    attendanceRate,
    pendingNotifications,
    totalClasses: todayDocs.length,
    totalStudents,
    presentes: totalPresentes,
    ausentes: totalAusentes,
    tardes: totalTardes,
    justificados: totalJustificados,
  }
}

// Computed properties para obtener datos de los stores
const kpis = computed(() => {
  const activeStudents = studentsStore.activeStudents.length

  // Obtener clases programadas para hoy usando el store modular de clases
  const today = new Date()
  const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
  const dayNamesEn = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const dayIndex = today.getDay() // 0 = domingo, 1 = lunes, etc.
  const todayNameEs = dayNames[dayIndex]
  const todayNameEn = dayNamesEn[dayIndex]

  // Usar el getter del store para obtener clases por día
  const classesToday =
    classesStore.getClassesByDay(dayIndex).length +
    classesStore.getClassesByDay(todayNameEs).length +
    classesStore.getClassesByDay(todayNameEn).length

  // Obtener estadísticas de asistencia del día actual usando nuestra función auxiliar
  const todayStats = getTodayAttendanceStats()
  const dailyAttendance = todayStats.attendanceRate
  const pendingNotifications = todayStats.pendingNotifications

  return {
    activeStudents,
    classesToday,
    dailyAttendance,
    pendingNotifications,
    // Datos adicionales para debugging
    attendanceDetails: {
      totalClasses: todayStats.totalClasses,
      totalStudents: todayStats.totalStudents,
      presentes: todayStats.presentes,
      ausentes: todayStats.ausentes,
      tardes: todayStats.tardes,
      justificados: todayStats.justificados,
    },
  }
})

const fetchKPIs = async () => {
  loading.value = true
  try {
    // Cargar datos de los stores en paralelo
    await Promise.all([
      studentsStore.fetchStudents(),
      classesStore.fetchClasses(),
      // Para la asistencia, obtener datos del día actual y generar analíticas
      attendanceStore
        .fetchAttendanceDocuments(
          format(new Date(), "yyyy-MM-dd"),
          format(new Date(), "yyyy-MM-dd")
        )
        .catch((err) => {
          console.warn("No se pudo cargar asistencia del día actual:", err)
          // No es un error crítico, continuar sin datos de asistencia
        }),
    ])

    // Actualizar analíticas del store de attendance si hay datos
    if (attendanceStore.attendanceDocuments.length > 0) {
      try {
        await attendanceStore.updateAnalytics()
        console.log("Analíticas de asistencia actualizadas:", attendanceStore.analytics)
      } catch (analyticsError) {
        console.warn("Error actualizando analíticas:", analyticsError)
      }
    }

    console.log("KPIs cargados:", {
      estudiantes: studentsStore.activeStudents.length,
      clasesTotal: classesStore.classes.length,
      documentosAsistencia: attendanceStore.attendanceDocuments.length,
      analytics: attendanceStore.analytics ? "Disponibles" : "No disponibles",
    })
  } catch (error) {
    console.error("Error fetching KPIs:", error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchKPIs()
})
</script>
