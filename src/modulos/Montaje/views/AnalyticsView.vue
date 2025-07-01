<template>
  <div class="analytics-view p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Análisis y Métricas</h1>
      <p class="text-gray-600">Dashboard de rendimiento y KPIs del módulo de montaje</p>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Período</label>
          <select
            v-model="filters.period"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="quarter">Este trimestre</option>
            <option value="year">Este año</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Entidad</label>
          <select
            v-model="filters.entityType"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Todas</option>
            <option value="obra">Obras</option>
            <option value="plan">Planes</option>
            <option value="frase">Frases</option>
            <option value="repertorio">Repertorio</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Instructor</label>
          <select
            v-model="filters.instructor"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Todos</option>
            <option v-for="instructor in instructors" :key="instructor" :value="instructor">
              {{ instructor }}
            </option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            @click="refreshData"
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>

    <!-- KPIs Principales -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-600">Obras Activas</p>
            <p class="text-2xl font-bold text-gray-900">{{ kpis.obrasActivas }}</p>
          </div>
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              class="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
        </div>
        <div class="mt-2">
          <span class="text-sm text-green-600">+{{ kpis.obrasActivasChange }}%</span>
          <span class="text-sm text-gray-500"> vs período anterior</span>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-600">Progreso Promedio</p>
            <p class="text-2xl font-bold text-gray-900">{{ kpis.progresoPromedio }}%</p>
          </div>
          <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              class="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
        </div>
        <div class="mt-2">
          <span class="text-sm text-green-600">+{{ kpis.progresoPromedioChange }}%</span>
          <span class="text-sm text-gray-500"> vs período anterior</span>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-600">Evaluación Promedio</p>
            <p class="text-2xl font-bold text-gray-900">{{ kpis.evaluacionPromedio }}/10</p>
          </div>
          <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              class="w-4 h-4 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
        </div>
        <div class="mt-2">
          <span class="text-sm text-green-600">+{{ kpis.evaluacionPromedioChange }}</span>
          <span class="text-sm text-gray-500"> vs período anterior</span>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-600">Tiempo Promedio</p>
            <p class="text-2xl font-bold text-gray-900">{{ kpis.tiempoPromedio }}d</p>
          </div>
          <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg
              class="w-4 h-4 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <div class="mt-2">
          <span class="text-sm text-red-600">{{ kpis.tiempoPromedioChange }}d</span>
          <span class="text-sm text-gray-500"> vs período anterior</span>
        </div>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Progreso por Tiempo -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Progreso por Tiempo</h3>
        <AnalyticsDashboard :data="progressChartData" chart-type="line" :height="300" />
      </div>

      <!-- Distribución por Estado -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Distribución por Estado</h3>
        <AnalyticsDashboard :data="statusChartData" chart-type="doughnut" :height="300" />
      </div>
    </div>

    <!-- Gráfico de Evaluaciones -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h3 class="text-lg font-medium mb-4">Evaluaciones por Instructor</h3>
      <AnalyticsDashboard :data="evaluationChartData" chart-type="bar" :height="400" />
    </div>

    <!-- Tablas de Rendimiento -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top Obras -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Obras con Mejor Rendimiento</h3>
        <div class="space-y-3">
          <div
            v-for="(obra, index) in topObras"
            :key="obra.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <span
                class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium"
              >
                {{ index + 1 }}
              </span>
              <div>
                <p class="font-medium">{{ obra.titulo }}</p>
                <p class="text-sm text-gray-500">{{ obra.compositor }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-medium">{{ obra.progreso }}%</p>
              <p class="text-sm text-gray-500">{{ obra.evaluacion }}/10</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Instructores Activos -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium mb-4">Instructores Más Activos</h3>
        <div class="space-y-3">
          <div
            v-for="(instructor, index) in topInstructors"
            :key="instructor.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <span
                class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium"
              >
                {{ index + 1 }}
              </span>
              <div>
                <p class="font-medium">{{ instructor.nombre }}</p>
                <p class="text-sm text-gray-500">{{ instructor.obrasAsignadas }} obras</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-medium">{{ instructor.progresoPromedio }}%</p>
              <p class="text-sm text-gray-500">{{ instructor.evaluacionPromedio }}/10</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas y Recomendaciones -->
    <div class="mt-6 bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-medium mb-4">Alertas y Recomendaciones</h3>
      <div class="space-y-3">
        <div
          v-for="alert in alerts"
          :key="alert.id"
          class="flex items-start space-x-3 p-3 rounded-lg"
          :class="getAlertClass(alert.type)"
        >
          <div class="flex-shrink-0">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                v-if="alert.type === 'warning'"
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
              <path
                v-else-if="alert.type === 'info'"
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
              <path
                v-else
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p class="font-medium">{{ alert.title }}</p>
            <p class="text-sm">{{ alert.message }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useMontajeAnalytics} from "../composables/useMontajeAnalytics"
import AnalyticsDashboard from "../components/AnalyticsDashboard.vue"

const {getKPIs, getProgressData, getStatusDistribution, getEvaluationData} = useMontajeAnalytics()

const filters = ref({
  period: "month",
  entityType: "",
  instructor: "",
})

const kpis = ref({
  obrasActivas: 24,
  obrasActivasChange: 12,
  progresoPromedio: 67,
  progresoPromedioChange: 8,
  evaluacionPromedio: 7.8,
  evaluacionPromedioChange: 0.3,
  tiempoPromedio: 45,
  tiempoPromedioChange: -3,
})

const instructors = ref(["María González", "Carlos Pérez", "Ana Rodríguez", "Luis Martín"])

const progressChartData = ref({
  labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
  datasets: [
    {
      label: "Progreso Promedio",
      data: [45, 52, 48, 61, 67, 70],
      borderColor: "rgb(59, 130, 246)",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      tension: 0.4,
    },
  ],
})

const statusChartData = ref({
  labels: ["Borrador", "En Revisión", "En Montaje", "Completada"],
  datasets: [
    {
      data: [15, 8, 12, 9],
      backgroundColor: [
        "rgba(107, 114, 128, 0.8)",
        "rgba(245, 158, 11, 0.8)",
        "rgba(59, 130, 246, 0.8)",
        "rgba(34, 197, 94, 0.8)",
      ],
    },
  ],
})

const evaluationChartData = ref({
  labels: instructors.value,
  datasets: [
    {
      label: "Evaluación Promedio",
      data: [8.2, 7.9, 8.5, 7.4],
      backgroundColor: "rgba(59, 130, 246, 0.8)",
    },
  ],
})

const topObras = ref([
  {id: "1", titulo: "Sinfonía No. 5", compositor: "Beethoven", progreso: 95, evaluacion: 9.2},
  {id: "2", titulo: "Ave Verum Corpus", compositor: "Mozart", progreso: 88, evaluacion: 8.7},
  {id: "3", titulo: "Canon en Re", compositor: "Pachelbel", progreso: 82, evaluacion: 8.3},
])

const topInstructors = ref([
  {
    id: "1",
    nombre: "María González",
    obrasAsignadas: 8,
    progresoPromedio: 85,
    evaluacionPromedio: 8.5,
  },
  {
    id: "2",
    nombre: "Carlos Pérez",
    obrasAsignadas: 6,
    progresoPromedio: 78,
    evaluacionPromedio: 8.2,
  },
  {
    id: "3",
    nombre: "Ana Rodríguez",
    obrasAsignadas: 7,
    progresoPromedio: 82,
    evaluacionPromedio: 8.7,
  },
])

const alerts = ref([
  {
    id: "1",
    type: "warning",
    title: "Obras Retrasadas",
    message: "3 obras están por encima del tiempo estimado de completación.",
  },
  {
    id: "2",
    type: "info",
    title: "Nuevas Evaluaciones",
    message: "Se han registrado 5 nuevas evaluaciones esta semana.",
  },
  {
    id: "3",
    type: "success",
    title: "Meta Alcanzada",
    message: "El progreso promedio ha superado el 65% objetivo.",
  },
])

const getAlertClass = (type: string) => {
  const classes = {
    warning: "bg-yellow-50 text-yellow-800",
    info: "bg-blue-50 text-blue-800",
    success: "bg-green-50 text-green-800",
    error: "bg-red-50 text-red-800",
  }
  return classes[type] || "bg-gray-50 text-gray-800"
}

const refreshData = async () => {
  // Implementar actualización de datos basada en filtros
  console.log("Refreshing data with filters:", filters.value)
}

onMounted(() => {
  refreshData()
})
</script>
