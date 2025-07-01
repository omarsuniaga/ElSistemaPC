<template>
  <div class="observations-admin-dashboard">
    <!-- Header con estadísticas clave -->
    <div class="dashboard-header bg-white rounded-lg shadow-sm p-6 mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">
        📊 Dashboard de Observaciones - Administración
      </h1>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat-card bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span class="text-white text-sm font-bold">📝</span>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-blue-600">Total Observaciones</p>
              <p class="text-2xl font-bold text-blue-900">
                {{ stats?.kpis?.totalObservations || 0 }}
              </p>
            </div>
          </div>
        </div>

        <div class="stat-card bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span class="text-white text-sm font-bold">👨‍🏫</span>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-600">Maestros Activos</p>
              <p class="text-2xl font-bold text-green-900">
                {{ stats?.kpis?.activeTeachers || 0 }}
              </p>
            </div>
          </div>
        </div>

        <div class="stat-card bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span class="text-white text-sm font-bold">🏫</span>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-purple-600">Clases Activas</p>
              <p class="text-2xl font-bold text-purple-900">
                {{ stats?.kpis?.activeClasses || 0 }}
              </p>
            </div>
          </div>
        </div>

        <div class="stat-card bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span class="text-white text-sm font-bold">⚠️</span>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-orange-600">Requieren Seguimiento</p>
              <p class="text-2xl font-bold text-orange-900">
                {{ stats?.kpis?.criticalObservations || 0 }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros avanzados -->
    <div class="filters-section bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">🔍 Filtros Avanzados</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Rango de Fechas</label>
          <div class="space-y-2">
            <input
              v-model="filters.dateFrom"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Fecha desde"
            />
            <input
              v-model="filters.dateTo"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Fecha hasta"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
          <select
            v-model="filters.type"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="general">General</option>
            <option value="comportamiento">Comportamiento</option>
            <option value="academico">Académico</option>
            <option value="asistencia">Asistencia</option>
            <option value="evaluacion">Evaluación</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
          <select
            v-model="filters.priority"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las prioridades</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Seguimiento</label>
          <select
            v-model="filters.requiresFollowUp"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="true">Requiere seguimiento</option>
            <option value="false">No requiere seguimiento</option>
          </select>
        </div>
      </div>

      <div class="flex space-x-2 mt-4">
        <button
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="applyFilters"
        >
          <span v-if="loading">🔄 Cargando...</span>
          <span v-else>🔍 Aplicar Filtros</span>
        </button>

        <button
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          @click="clearFilters"
        >
          🗑️ Limpiar
        </button>

        <button
          :disabled="loading"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          @click="generateReport"
        >
          📊 Generar Análisis
        </button>

        <button
          :disabled="loading"
          class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          @click="exportData"
        >
          📤 Exportar para IA
        </button>
      </div>
    </div>

    <!-- Gráficos y análisis -->
    <div v-if="stats" class="analytics-section grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Tendencias mensuales -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📈 Tendencias Mensuales</h3>
        <div class="space-y-2">
          <div v-for="(count, month) in stats.monthlyTrends" :key="month" class="flex items-center">
            <span class="text-sm text-gray-600 w-20">{{ month }}</span>
            <div class="flex-1 bg-gray-200 rounded-full h-2 ml-3">
              <div
                class="bg-blue-500 h-2 rounded-full"
                :style="{
                  width: `${(count / Math.max(...Object.values(stats.monthlyTrends))) * 100}%`,
                }"
              />
            </div>
            <span class="text-sm font-medium text-gray-900 ml-3">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- Top maestros -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">👨‍🏫 Maestros Más Activos</h3>
        <div class="space-y-3">
          <div
            v-for="([teacher, data], index) in Object.entries(stats.teacherAnalysis).slice(0, 5)"
            :key="teacher"
            class="flex items-center p-3 bg-gray-50 rounded-lg"
          >
            <div
              class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
            >
              <span class="text-sm font-bold text-blue-600">{{ index + 1 }}</span>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ teacher }}</p>
              <p class="text-xs text-gray-500">
                {{ data.total }} observaciones • {{ data.classCount }} clases
              </p>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-900">
                {{ Math.round(data.followUpRate) }}%
              </div>
              <div class="text-xs text-gray-500">seguimiento</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de observaciones -->
    <div class="observations-list bg-white rounded-lg shadow-sm">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          📋 Observaciones Recientes ({{ filteredObservations.length }})
        </h3>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Fecha
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Maestro
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tipo
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Prioridad
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Observación
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Seguimiento
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="observation in paginatedObservations"
              :key="observation.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(observation.date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ observation.authorName || observation.author }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ observation.authorId.substring(0, 8) }}...
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getTypeClass(observation.type)"
                  class="px-2 py-1 text-xs font-medium rounded-full"
                >
                  {{ getTypeLabel(observation.type) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getPriorityClass(observation.priority)"
                  class="px-2 py-1 text-xs font-medium rounded-full"
                >
                  {{ getPriorityLabel(observation.priority) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate">
                  {{ observation.text }}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ observation.text.length }} caracteres
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span v-if="observation.requiresFollowUp" class="text-orange-500">⚠️</span>
                <span v-else class="text-gray-300">✓</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Mostrando {{ startIndex + 1 }} a {{ Math.min(endIndex, filteredObservations.length) }} de
          {{ filteredObservations.length }} observaciones
        </div>
        <div class="flex space-x-2">
          <button
            :disabled="currentPage === 1"
            class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
            @click="previousPage"
          >
            Anterior
          </button>
          <span class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            :disabled="currentPage === totalPages"
            class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
            @click="nextPage"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de exportación -->
    <div
      v-if="showExportModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📤 Exportar Datos para IA</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Formato</label>
            <select
              v-model="exportFormat"
              class="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="json">JSON (para análisis programático)</option>
              <option value="csv">CSV (para Excel/análisis estadístico)</option>
            </select>
          </div>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="text-sm font-medium text-blue-900 mb-2">📊 Datos incluidos:</h4>
            <ul class="text-sm text-blue-700 space-y-1">
              <li>• Texto de observaciones para análisis de sentimiento</li>
              <li>• Metadatos (fecha, tipo, prioridad, maestro)</li>
              <li>• Indicadores de urgencia normalizados</li>
              <li>• Campos preparados para análisis de IA</li>
            </ul>
          </div>
        </div>

        <div class="flex space-x-3 mt-6">
          <button
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            @click="confirmExport"
          >
            📥 Descargar
          </button>
          <button
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            @click="showExportModal = false"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {useAdminObservations} from "../../composables/useObservationManagement"
import type {ObservationFilters} from "../../stores/observations"

// Composables
const {loading, error, fetchAllObservations, generateAdvancedAnalysis, exportForAIAnalysis} =
  useAdminObservations()

// Estado reactivo
const observations = ref<any[]>([])
const stats = ref<any>(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showExportModal = ref(false)
const exportFormat = ref<"json" | "csv">("json")

// Filtros
const filters = ref<ObservationFilters>({
  dateFrom: "",
  dateTo: "",
  type: "",
  priority: "",
  requiresFollowUp: undefined,
})

// Computed properties
const filteredObservations = computed(() => observations.value)

const totalPages = computed(() => Math.ceil(filteredObservations.value.length / itemsPerPage.value))

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => startIndex.value + itemsPerPage.value)

const paginatedObservations = computed(() =>
  filteredObservations.value.slice(startIndex.value, endIndex.value)
)

// Métodos
const loadData = async () => {
  try {
    const data = await fetchAllObservations(filters.value)
    observations.value = data || []
  } catch (err) {
    console.error("Error loading observations:", err)
    observations.value = []
  }
}

const applyFilters = async () => {
  currentPage.value = 1
  await loadData()
}

const clearFilters = () => {
  filters.value = {
    dateFrom: "",
    dateTo: "",
    type: "",
    priority: "",
    requiresFollowUp: undefined,
  }
  currentPage.value = 1
  loadData()
}

const generateReport = async () => {
  try {
    const analysis = await generateAdvancedAnalysis(filters.value)
    stats.value = analysis
  } catch (err) {
    console.error("Error generating analysis:", err)
  }
}

const exportData = () => {
  showExportModal.value = true
}

const confirmExport = async () => {
  try {
    const data = await exportForAIAnalysis(filters.value, exportFormat.value)

    // Crear y descargar archivo
    const blob = new Blob([data], {
      type: exportFormat.value === "json" ? "application/json" : "text/csv",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `observaciones_ia_${new Date().toISOString().split("T")[0]}.${exportFormat.value}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showExportModal.value = false
  } catch (err) {
    console.error("Error exporting data:", err)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-ES")
}

const getTypeClass = (type: string) => {
  const classes = {
    general: "bg-gray-100 text-gray-800",
    comportamiento: "bg-red-100 text-red-800",
    academico: "bg-blue-100 text-blue-800",
    asistencia: "bg-yellow-100 text-yellow-800",
    evaluacion: "bg-green-100 text-green-800",
  }
  return classes[type as keyof typeof classes] || classes.general
}

const getTypeLabel = (type: string) => {
  const labels = {
    general: "General",
    comportamiento: "Comportamiento",
    academico: "Académico",
    asistencia: "Asistencia",
    evaluacion: "Evaluación",
  }
  return labels[type as keyof typeof labels] || type
}

const getPriorityClass = (priority: string) => {
  const classes = {
    baja: "bg-green-100 text-green-800",
    media: "bg-yellow-100 text-yellow-800",
    alta: "bg-orange-100 text-orange-800",
    critica: "bg-red-100 text-red-800",
  }
  return classes[priority as keyof typeof classes] || classes.media
}

const getPriorityLabel = (priority: string) => {
  const labels = {
    baja: "Baja",
    media: "Media",
    alta: "Alta",
    critica: "Crítica",
  }
  return labels[priority as keyof typeof labels] || priority
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Lifecycle
onMounted(async () => {
  await loadData()
  await generateReport()
})

// Watchers
watch(
  filters,
  () => {
    // Auto-aplicar filtros cuando cambien las fechas
    if (filters.value.dateFrom || filters.value.dateTo) {
      applyFilters()
    }
  },
  {deep: true}
)
</script>
