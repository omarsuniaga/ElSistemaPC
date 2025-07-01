<template>
  <div class="attendance-analytics">
    <header class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
      <h2 class="text-xl font-bold">Análisis de Asistencia</h2>

      <!-- Filtros de tiempo y visualización -->
      <div class="flex flex-wrap gap-2 items-center">
        <div class="flex items-center">
          <label class="text-sm text-gray-600 mr-2">Periodo:</label>
          <select v-model="selectedPeriod" class="px-3 py-1 border rounded-md text-sm">
            <option value="day">Diario</option>
            <option value="week">Semanal</option>
            <option value="month">Mensual</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        <div v-if="selectedPeriod === 'custom'" class="flex gap-2 items-center">
          <input
            v-model="customDateRange.startDate"
            type="date"
            class="px-2 py-1 border rounded-md text-sm"
          />
          <input
            v-model="customDateRange.endDate"
            type="date"
            class="px-2 py-1 border rounded-md text-sm"
          />
          <button
            class="px-2 py-1 bg-blue-600 text-white rounded-md text-sm"
            @click="applyCustomDateFilter"
          >
            Aplicar
          </button>
        </div>

        <div class="flex items-center ml-auto">
          <label class="text-sm text-gray-600 mr-2">Ver:</label>
          <div class="flex rounded-md overflow-hidden border">
            <button
              v-for="view in viewOptions"
              :key="view.id"
              class="px-3 py-1 text-sm"
              :class="
                selectedView === view.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              "
              @click="selectedView = view.id"
            >
              {{ view.label }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      <span class="ml-3">Cargando datos de asistencia...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md mb-6">
      {{ error }}
    </div>

    <!-- Contenido del análisis -->
    <div v-else class="space-y-8">
      <!-- Indicadores principales -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Total Registros</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ metrics.totalRecords }}</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">en el periodo seleccionado</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Tasa de Asistencia</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ metrics.attendanceRate }}%</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">asistencia promedio</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Clases Afectadas</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ metrics.affectedClasses }}</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">con inasistencias</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 class="text-sm text-gray-500">Ausencias Justificadas</h4>
          <div class="mt-2">
            <span class="text-2xl font-bold">{{ metrics.justifiedAbsences }}</span>
            <span class="text-sm text-gray-500 ml-1">({{ metrics.justificationRate }}%)</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">del total de ausencias</p>
        </div>
      </div>

      <!-- Visualización principal -->
      <div v-if="selectedView === 'chart'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h4 class="text-base font-medium mb-4">Tendencia de Asistencia - {{ periodLabel }}</h4>
        <div class="h-80">
          <Line
            v-if="selectedPeriod === 'day'"
            :data="dailyAttendanceChartData"
            :options="chartOptions"
          />
          <Bar
            v-else-if="selectedPeriod === 'week'"
            :data="weeklyAttendanceChartData"
            :options="chartOptions"
          />
          <Bar v-else :data="monthlyAttendanceChartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Vista de datos en tabla -->
      <div
        v-else-if="selectedView === 'table'"
        class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
      >
        <div class="p-4">
          <h4 class="text-base font-medium">Registros de Asistencia - {{ periodLabel }}</h4>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Periodo
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Total
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Presentes
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Ausentes
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Tasa
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="(item, index) in attendanceTableData" :key="index">
                <td class="px-4 py-3 whitespace-nowrap">
                  {{ item.period }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  {{ item.total }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  {{ item.present }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  {{ item.absent }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        class="h-2 rounded-full"
                        :style="{
                          width: `${item.rate}%`,
                          backgroundColor: getRateColor(item.rate),
                        }"
                      />
                    </div>
                    <span>{{ item.rate }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Vista de calendario -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h4 class="text-base font-medium mb-4">Calendario de Asistencia - {{ periodLabel }}</h4>
        <div class="grid grid-cols-7 gap-2 text-center mb-2">
          <div
            v-for="day in ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']"
            :key="day"
            class="p-2 bg-gray-100 dark:bg-gray-700 font-medium text-xs"
          >
            {{ day }}
          </div>
        </div>

        <div class="grid grid-cols-7 gap-2">
          <div
            v-for="(day, idx) in calendarData"
            :key="idx"
            :class="[
              'rounded text-center py-2 px-1 relative',
              day.isCurrentMonth
                ? 'bg-gray-50 dark:bg-gray-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400',
              day.isToday ? 'ring-2 ring-indigo-500' : '',
            ]"
          >
            <span class="text-sm block mb-1">{{ day.day }}</span>
            <div v-if="day.data" class="flex justify-center space-x-1">
              <span
                class="w-2 h-2 rounded-full"
                :style="{backgroundColor: getRateColor(day.data.rate)}"
              />
              <span v-if="day.data.absent > 0" class="w-2 h-2 rounded-full bg-red-500" />
            </div>
            <span v-if="day.data" class="text-xs block mt-1">{{ day.data.rate }}%</span>
          </div>
        </div>
      </div>

      <!-- Análisis por día de la semana -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h4 class="text-base font-medium mb-4">Asistencia por Día de la Semana</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="h-60">
            <Bar :data="weekdayAttendanceChartData" :options="chartOptions" />
          </div>
          <div>
            <div v-for="(day, index) in weekdayAttendanceData" :key="index" class="mb-3">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-medium">{{ day.day }}</span>
                <span class="text-sm">{{ day.rate }}%</span>
              </div>
              <div class="w-full h-2.5 bg-gray-200 rounded-full">
                <div
                  class="h-2.5 rounded-full"
                  :style="{
                    width: `${day.rate}%`,
                    backgroundColor: getRateColor(day.rate),
                  }"
                />
              </div>
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>{{ day.present }} presentes</span>
                <span>{{ day.absent }} ausentes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ausencias por clase -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-base font-medium">Ausencias por Clase</h4>
          <select v-model="selectedSortOrder" class="px-3 py-1 border rounded-md text-sm">
            <option value="highest">Mayor ausencia primero</option>
            <option value="lowest">Menor ausencia primero</option>
            <option value="alphabetical">Alfabético</option>
          </select>
        </div>

        <div class="space-y-4">
          <div
            v-for="(classItem, index) in sortedClassAttendanceData"
            :key="index"
            class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="flex justify-between items-center mb-2">
              <div>
                <h5 class="font-medium">{{ classItem.name }}</h5>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ classItem.teacher }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm">
                  <span
                    :class="{
                      'text-green-600': classItem.attendanceRate >= 90,
                      'text-yellow-600':
                        classItem.attendanceRate >= 75 && classItem.attendanceRate < 90,
                      'text-red-600': classItem.attendanceRate < 75,
                    }"
                    >{{ classItem.attendanceRate }}%</span
                  >
                  asistencia
                </p>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  {{ classItem.absent }} ausencias / {{ classItem.total }} registros
                </p>
              </div>
            </div>

            <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-2"
                :style="{
                  width: `${classItem.attendanceRate}%`,
                  backgroundColor: getRateColor(classItem.attendanceRate),
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {
  format,
  parseISO,
  isToday,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns"
import {es} from "date-fns/locale"
import {useAnalyticsStore} from "../store/analytics"
import {useClassesStore} from "../../Classes/store/classes"
import {useAttendanceStore} from "../../Attendance/store/attendance"
import {Line, Bar} from "vue-chartjs"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const analyticsStore = useAnalyticsStore()
const classesStore = useClassesStore()
const attendanceStore = useAttendanceStore()

// Estado local
const isLoading = ref(true)
const error = ref("")
const selectedPeriod = ref("day")
const selectedView = ref("chart")
const selectedSortOrder = ref("highest")
const customDateRange = ref({
  startDate: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
})

// Opciones de visualización
const viewOptions = [
  {id: "chart", label: "Gráfica"},
  {id: "table", label: "Tabla"},
  {id: "calendar", label: "Calendario"},
]

// Métricas de asistencia
const metrics = ref({
  totalRecords: 0,
  attendanceRate: 0,
  affectedClasses: 0,
  justifiedAbsences: 0,
  justificationRate: 0,
  dailyAttendance: [],
  weeklyAttendance: [],
  monthlyAttendance: [],
  weekdayAttendance: [],
  classAttendance: [],
})

// Etiqueta del periodo actual
const periodLabel = computed(() => {
  switch (selectedPeriod.value) {
    case "day":
      return "Diario"
    case "week":
      return "Semanal"
    case "month":
      return "Mensual"
    case "custom":
      return `${customDateRange.value.startDate} a ${customDateRange.value.endDate}`
    default:
      return ""
  }
})

// Observar cambios en el periodo seleccionado
watch(selectedPeriod, (newPeriod) => {
  loadAttendanceMetrics()
})

// Cargar métricas de asistencia
async function loadAttendanceMetrics() {
  isLoading.value = true
  error.value = ""

  try {
    await Promise.all([
      analyticsStore.fetchAnalytics(),
      classesStore.fetchClasses(),
      attendanceStore.fetchAttendance(),
    ])

    // Datos de asistencia del store
    const attendanceMetrics = analyticsStore.attendanceMetrics

    // Métricas generales
    metrics.value.attendanceRate = attendanceMetrics.averageRate

    // Asignar datos según el periodo
    if (selectedPeriod.value === "day") {
      metrics.value.dailyAttendance = attendanceMetrics.dailyAttendance || []

      // Calcular totales
      let totalRecords = 0
      let totalPresent = 0
      let totalAbsent = 0
      const totalJustified = 0

      metrics.value.dailyAttendance.forEach((day) => {
        totalRecords += day.total
        totalPresent += day.present
        totalAbsent += day.absent
      })

      metrics.value.totalRecords = totalRecords
      metrics.value.justifiedAbsences = totalJustified
      metrics.value.justificationRate =
        totalAbsent > 0 ? Math.round((totalJustified / totalAbsent) * 100) : 0
    } else if (selectedPeriod.value === "week") {
      metrics.value.weeklyAttendance = attendanceMetrics.weeklyAttendance || []

      // Calcular totales
      let totalRecords = 0
      let totalPresent = 0
      let totalAbsent = 0
      const totalJustified = 0

      metrics.value.weeklyAttendance.forEach((week) => {
        totalRecords += week.total
        totalPresent += week.present
        totalAbsent += week.absent
      })

      metrics.value.totalRecords = totalRecords
      metrics.value.justifiedAbsences = totalJustified
      metrics.value.justificationRate =
        totalAbsent > 0 ? Math.round((totalJustified / totalAbsent) * 100) : 0
    } else {
      metrics.value.monthlyAttendance = attendanceMetrics.monthlyAttendance || []

      // Calcular totales
      let totalRecords = 0
      let totalPresent = 0
      let totalAbsent = 0
      const totalJustified = 0

      metrics.value.monthlyAttendance.forEach((month) => {
        totalRecords += month.total
        totalPresent += month.present
        totalAbsent += month.absent
      })

      metrics.value.totalRecords = totalRecords
      metrics.value.justifiedAbsences = totalJustified
      metrics.value.justificationRate =
        totalAbsent > 0 ? Math.round((totalJustified / totalAbsent) * 100) : 0
    }

    // Datos por día de la semana (simulados)
    metrics.value.weekdayAttendance = [
      {day: "Lunes", total: 120, present: 108, absent: 12, rate: 90},
      {day: "Martes", total: 115, present: 100, absent: 15, rate: 87},
      {day: "Miércoles", total: 130, present: 117, absent: 13, rate: 90},
      {day: "Jueves", total: 125, present: 113, absent: 12, rate: 90},
      {day: "Viernes", total: 110, present: 95, absent: 15, rate: 86},
      {day: "Sábado", total: 80, present: 72, absent: 8, rate: 90},
      {day: "Domingo", total: 40, present: 35, absent: 5, rate: 88},
    ]

    // Datos por clase (simulados)
    const classAttendance = []
    for (let i = 0; i < 10; i++) {
      const attendanceRate = Math.floor(Math.random() * 20) + 75 // 75-95%
      const total = Math.floor(Math.random() * 40) + 20 // 20-60 registros
      const absent = Math.round(total * (1 - attendanceRate / 100))
      const present = total - absent

      classAttendance.push({
        id: `class-${i}`,
        name:
          ["Piano", "Guitarra", "Violín", "Flauta", "Teoría Musical", "Canto", "Batería"][i % 7] +
          " - " +
          ["Nivel 1", "Nivel 2", "Nivel 3"][Math.floor(i / 3) % 3],
        teacher: ["Profesor A", "Profesor B", "Profesor C", "Profesor D"][i % 4],
        attendanceRate,
        total,
        present,
        absent,
      })
    }
    metrics.value.classAttendance = classAttendance
    metrics.value.affectedClasses = classAttendance.filter((c) => c.absent > 0).length

    // Generar datos de calendario (simulados)
    generateCalendarData()
  } catch (err) {
    console.error("Error cargando métricas de asistencia:", err)
    error.value = "Error al cargar los datos de asistencia. Por favor, intente de nuevo."
  } finally {
    isLoading.value = false
  }
}

// Aplicar filtro de fechas personalizado
function applyCustomDateFilter() {
  if (customDateRange.value.startDate && customDateRange.value.endDate) {
    loadAttendanceMetrics()
  }
}

// Generar datos para el calendario
function generateCalendarData() {
  // En una implementación real, estos datos vendrían de la base de datos
  // Por ahora usamos datos simulados para el mes actual
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  // Generar días del mes
  const days = eachDayOfInterval({start: monthStart, end: monthEnd})

  // Ajustar para empezar en domingo (agregar días del mes anterior)
  const firstDayOfWeek = getDay(monthStart)
  for (let i = 0; i < firstDayOfWeek; i++) {
    const prevDate = new Date(monthStart)
    prevDate.setDate(prevDate.getDate() - (firstDayOfWeek - i))
    days.unshift(prevDate)
  }

  // Ajustar para terminar en sábado (agregar días del mes siguiente)
  const lastDayOfWeek = getDay(monthEnd)
  if (lastDayOfWeek < 6) {
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const nextDate = new Date(monthEnd)
      nextDate.setDate(nextDate.getDate() + i)
      days.push(nextDate)
    }
  }

  // Generar datos para cada día
  return days.map((date) => {
    const day = date.getDate()
    const isCurrentMonth = isSameMonth(date, today)

    // Generar datos aleatorios para días del mes actual
    let data = null
    if (isCurrentMonth && date <= today) {
      const attendanceRate = Math.floor(Math.random() * 20) + 75 // 75-95%
      const total = Math.floor(Math.random() * 15) + 5 // 5-20 registros
      const absent = Math.round(total * (1 - attendanceRate / 100))
      const present = total - absent

      data = {
        total,
        present,
        absent,
        rate: attendanceRate,
      }
    }

    return {
      date,
      day,
      isCurrentMonth,
      isToday: isToday(date),
      data,
    }
  })
}

// Datos para gráfico de asistencia diaria
const dailyAttendanceChartData = computed(() => {
  const dailyData = metrics.value.dailyAttendance || []

  return {
    labels: dailyData.map((day) => format(parseISO(day.date), "dd/MM")),
    datasets: [
      {
        label: "Tasa de Asistencia (%)",
        data: dailyData.map((day) => day.rate),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  }
})

// Datos para gráfico de asistencia semanal
// Usar sólo datos reales de metrics
const weeklyAttendanceChartData = computed(() => {
  const weeklyData = metrics.value.weeklyAttendance || []

  return {
    labels: weeklyData.map((week) => week.week),
    datasets: [
      {
        label: "Presentes",
        data: weeklyData.map((week) => week.present),
        backgroundColor: "rgba(16, 185, 129, 0.7)",
      },
      {
        label: "Ausentes",
        data: weeklyData.map((week) => week.absent),
        backgroundColor: "rgba(239, 68, 68, 0.7)",
      },
    ],
  }
})

// Datos para gráfico de asistencia mensual
// Usar sólo datos reales de metrics
const monthlyAttendanceChartData = computed(() => {
  const monthlyData = metrics.value.monthlyAttendance || []

  return {
    labels: monthlyData.map((month) => month.month),
    datasets: [
      {
        label: "Presentes",
        data: monthlyData.map((month) => month.present),
        backgroundColor: "rgba(16, 185, 129, 0.7)",
      },
      {
        label: "Ausentes",
        data: monthlyData.map((month) => month.absent),
        backgroundColor: "rgba(239, 68, 68, 0.7)",
      },
    ],
  }
})

// Datos para gráfico por día de la semana
// Usar sólo datos reales de metrics
const weekdayAttendanceChartData = computed(() => {
  const weekdayData = metrics.value.weekdayAttendance || []

  return {
    labels: weekdayData.map((day) => day.day),
    datasets: [
      {
        label: "Tasa de Asistencia (%)",
        data: weekdayData.map((day) => day.rate),
        backgroundColor: weekdayData.map((day) => getRateColor(day.rate)),
      },
    ],
  }
})

// Datos para la tabla de asistencia
const attendanceTableData = computed(() => {
  if (selectedPeriod.value === "day") {
    return metrics.value.dailyAttendance.map((day) => ({
      period: format(parseISO(day.date), "dd/MM/yyyy"),
      total: day.total,
      present: day.present,
      absent: day.absent,
      rate: day.rate,
    }))
  } else if (selectedPeriod.value === "week") {
    return metrics.value.weeklyAttendance.map((week) => ({
      period: week.week,
      total: week.total,
      present: week.present,
      absent: week.absent,
      rate: week.rate,
    }))
  } else {
    return metrics.value.monthlyAttendance.map((month) => ({
      period: month.month,
      total: month.total,
      present: month.present,
      absent: month.absent,
      rate: month.rate,
    }))
  }
})

// Datos de asistencia por día de la semana
const weekdayAttendanceData = computed(() => {
  return metrics.value.weekdayAttendance || []
})

// Datos de calendario
const calendarData = computed(() => {
  return generateCalendarData()
})

// Datos de asistencia por clase ordenados
const sortedClassAttendanceData = computed(() => {
  const classData = [...(metrics.value.classAttendance || [])]

  if (selectedSortOrder.value === "highest") {
    return classData.sort((a, b) => b.absent - a.absent)
  } else if (selectedSortOrder.value === "lowest") {
    return classData.sort((a, b) => a.absent - b.absent)
  } else {
    return classData.sort((a, b) => a.name.localeCompare(b.name))
  }
})

// Obtener color según la tasa de asistencia
function getRateColor(rate) {
  if (rate >= 90) return "#10B981" // verde
  if (rate >= 80) return "#60A5FA" // azul
  if (rate >= 70) return "#FBBF24" // amarillo
  return "#EF4444" // rojo
}

// Opciones para los gráficos
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
    },
    tooltip: {
      mode: "index" as const,
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
}

// Cargar datos iniciales
onMounted(() => {
  loadAttendanceMetrics()
})
</script>
