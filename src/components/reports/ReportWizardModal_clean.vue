<!-- Asistente Inteligente para Creación de Reportes -->
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
      <!-- Header del modal -->
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="p-2 bg-white bg-opacity-20 rounded-lg mr-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold">🚀 Asistente de Reportes</h2>
              <p class="text-blue-100 text-sm">Crea reportes personalizados con IA</p>
            </div>
          </div>
          <button class="text-white hover:text-blue-200 transition-colors" @click="$emit('close')">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Progreso del asistente -->
      <div class="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div class="flex items-center justify-between text-sm">
          <div class="flex space-x-4">
            <div
              v-for="(step, index) in steps"
              :key="step.id"
              :class="[
                'flex items-center space-x-2',
                index <= currentStep ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400',
              ]"
            >
              <div
                :class="[
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  index < currentStep
                    ? 'bg-blue-600 text-white'
                    : index === currentStep
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-400',
                ]"
              >
                {{ index < currentStep ? "✓" : index + 1 }}
              </div>
              <span class="font-medium">{{ step.title }}</span>
            </div>
          </div>
          <div class="text-gray-500 dark:text-gray-400">Paso {{ currentStep + 1 }} de {{ steps.length }}</div>
        </div>
      </div>

      <!-- Contenido del asistente -->
      <div class="p-6 overflow-y-auto max-h-96">
        <!-- Paso 1: Tipo de Reporte -->
        <div v-if="currentStep === 0" class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🎯 ¿Qué tipo de reporte necesitas?
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="type in reportTypes"
                :key="type.id"
                :class="[
                  'p-4 border-2 rounded-lg cursor-pointer transition-all',
                  reportConfig.type === type.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300',
                ]"
                @click="reportConfig.type = type.id"
              >
                <div class="flex items-start space-x-3">
                  <div class="text-3xl">{{ type.icon }}</div>
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900 dark:text-white">{{ type.name }}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {{ type.description }}
                    </p>
                    <div class="flex flex-wrap gap-1 mt-2">
                      <span
                        v-for="feature in type.features"
                        :key="feature"
                        class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                      >
                        {{ feature }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Paso 2: Configuración de Datos -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📅 Configura el rango de datos
            </h3>

            <!-- Rango de fechas -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Inicio
                </label>
                <input
                  v-model="reportConfig.dateRange.start"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Fin
                </label>
                <input
                  v-model="reportConfig.dateRange.end"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <!-- Filtros rápidos -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtros Rápidos
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="preset in datePresets"
                  :key="preset.id"
                  :class="[
                    'px-3 py-2 text-sm rounded-lg border transition-colors',
                    reportConfig.datePreset === preset.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300',
                  ]"
                  @click="applyDatePreset(preset)"
                >
                  {{ preset.label }}
                </button>
              </div>
            </div>

            <!-- Filtros por entidades -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Clases Específicas
                </label>
                <select
                  v-model="reportConfig.filters.classes"
                  multiple
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  size="4"
                >
                  <option value="">Todas las clases</option>
                  <option v-for="cls in availableClasses" :key="cls.id" :value="cls.id">
                    {{ cls.name }} - {{ cls.teacher }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estudiantes Específicos
                </label>
                <select
                  v-model="reportConfig.filters.students"
                  multiple
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  size="4"
                >
                  <option value="">Todos los estudiantes</option>
                  <option v-for="student in availableStudents" :key="student.id" :value="student.id">
                    {{ student.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Paso 3: Personalización -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              🎨 Personaliza tu reporte
            </h3>

            <!-- Formato de salida -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Formato de Salida
              </label>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  v-for="outputFormat in outputFormats"
                  :key="outputFormat.id"
                  :class="[
                    'p-4 border-2 rounded-lg cursor-pointer transition-all',
                    reportConfig.format === outputFormat.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300',
                  ]"
                  @click="reportConfig.format = outputFormat.id"
                >
                  <div class="text-center">
                    <div class="text-2xl mb-2">{{ outputFormat.icon }}</div>
                    <div class="font-medium text-gray-900 dark:text-white">{{ outputFormat.name }}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {{ outputFormat.description }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Opciones de contenido -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Contenido del Reporte
              </label>
              <div class="space-y-3">
                <div v-for="option in contentOptions" :key="option.id" class="flex items-center">
                  <input
                    :id="option.id"
                    v-model="reportConfig.content[option.id]"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label :for="option.id" class="ml-3 flex-1">
                    <div class="font-medium text-gray-900 dark:text-white">{{ option.name }}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                      {{ option.description }}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Configuración del título -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título del Reporte
              </label>
              <input
                v-model="reportConfig.title"
                type="text"
                placeholder="Ej: Reporte de Asistencia - Enero 2025"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <!-- Paso 4: Revisión y Generación -->
        <div v-if="currentStep === 3" class="space-y-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Revisión Final</h3>

            <!-- Resumen de configuración -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white mb-2">Configuración Básica</h4>
                  <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div><strong>Tipo:</strong> {{ getSelectedReportType()?.name }}</div>
                    <div><strong>Formato:</strong> {{ getSelectedFormat()?.name }}</div>
                    <div>
                      <strong>Título:</strong>
                      {{ reportConfig.title || "Sin título personalizado" }}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white mb-2">Rango de Datos</h4>
                  <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div><strong>Desde:</strong> {{ formatDate(reportConfig.dateRange.start) }}</div>
                    <div><strong>Hasta:</strong> {{ formatDate(reportConfig.dateRange.end) }}</div>
                    <div><strong>Días:</strong> {{ calculateDayRange() }} días</div>
                  </div>
                </div>
              </div>

              <!-- Contenido incluido -->
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white mb-2">Contenido Incluido</h4>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(enabled, key) in reportConfig.content"
                    :key="key"
                    v-show="enabled"
                    class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded"
                  >
                    {{ getContentOptionName(key) }}
                  </span>
                </div>
              </div>

              <!-- Estimaciones -->
              <div class="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 class="font-medium text-gray-900 dark:text-white mb-2">Estimaciones</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div class="text-center p-3 bg-white dark:bg-gray-800 rounded">
                    <div class="font-bold text-lg text-blue-600 dark:text-blue-400">{{ estimatedPages }}</div>
                    <div class="text-gray-600 dark:text-gray-400">Páginas aprox.</div>
                  </div>
                  <div class="text-center p-3 bg-white dark:bg-gray-800 rounded">
                    <div class="font-bold text-lg text-green-600 dark:text-green-400">{{ estimatedTime }}</div>
                    <div class="text-gray-600 dark:text-gray-400">Tiempo de generación</div>
                  </div>
                  <div class="text-center p-3 bg-white dark:bg-gray-800 rounded">
                    <div class="font-bold text-lg text-purple-600 dark:text-purple-400">
                      {{ estimatedSize }}
                    </div>
                    <div class="text-gray-600 dark:text-gray-400">Tamaño del archivo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer con navegación -->
      <div class="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
        <div class="flex items-center justify-between">
          <button
            v-if="currentStep > 0"
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            @click="previousStep"
          >
            ← Anterior
          </button>
          <div v-else></div>

          <div class="flex space-x-3">
            <button
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              @click="$emit('close')"
            >
              Cancelar
            </button>
            <button
              v-if="currentStep < steps.length - 1"
              :disabled="!canProceedToNext()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              @click="nextStep"
            >
              Siguiente →
            </button>
            <button
              v-else
              :disabled="!canGenerate()"
              class="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium transition-colors"
              @click="generateReport"
            >
              🚀 Generar Reporte
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { es } from "date-fns/locale"

// Emits
const emit = defineEmits<{
  close: []
  generate: [config: any]
}>()

// Estado del asistente
const currentStep = ref(0)
const reportConfig = ref({
  type: "",
  format: "pdf",
  title: "",
  dateRange: {
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  },
  datePreset: "last30days",
  filters: {
    classes: [],
    students: [],
    teachers: [],
  },
  content: {
    summary: true,
    detailed: true,
    charts: true,
    trends: false,
    patterns: false,
    recommendations: true,
    analytics: false,
  },
})

// Datos de configuración
const steps = [
  { id: "type", title: "Tipo" },
  { id: "data", title: "Datos" },
  { id: "customize", title: "Personalizar" },
  { id: "review", title: "Revisar" },
]

const reportTypes = [
  {
    id: "attendance",
    name: "Reporte de Asistencia",
    description: "Análisis completo de asistencia con estadísticas y tendencias",
    icon: "📊",
    features: ["Estadísticas", "Gráficos", "Tendencias", "Análisis por estudiante"],
  },
  {
    id: "risk_analysis",
    name: "Análisis de Riesgo",
    description: "Identificación de estudiantes que requieren atención especial",
    icon: "⚠️",
    features: ["Predicción IA", "Plan de acción", "Factores de riesgo", "Recomendaciones"],
  },
  {
    id: "class_performance",
    name: "Rendimiento por Clase",
    description: "Comparativas de rendimiento entre clases y profesores",
    icon: "📚",
    features: ["Benchmarks", "Comparativas", "Rankings", "Análisis de eficiencia"],
  },
  {
    id: "notification_analysis",
    name: "Análisis de Notificaciones",
    description: "Efectividad de las comunicaciones y escalaciones",
    icon: "📱",
    features: ["Efectividad", "Patrones", "Respuesta", "Optimización"],
  },
  {
    id: "trends_prediction",
    name: "Tendencias y Predicción",
    description: "Análisis predictivo con machine learning",
    icon: "🔮",
    features: ["IA Predictiva", "Modelos", "Forecasting", "Insights"],
  },
  {
    id: "custom",
    name: "Reporte Personalizado",
    description: "Combina múltiples tipos de análisis según tus necesidades",
    icon: "🎯",
    features: ["Flexible", "Combinado", "Personalizable", "Avanzado"],
  },
]

const outputFormats = [
  {
    id: "pdf",
    name: "PDF Profesional",
    description: "Reporte profesional con gráficos y formato corporativo",
    icon: "📄",
  },
  {
    id: "excel",
    name: "Excel Avanzado",
    description: "Hojas múltiples con tablas dinámicas y análisis",
    icon: "📊",
  },
  {
    id: "powerpoint",
    name: "Presentación",
    description: "Slides ejecutivos para presentaciones",
    icon: "📽️",
  },
]

const contentOptions = [
  {
    id: "summary",
    name: "Resumen Ejecutivo",
    description: "Métricas principales y conclusiones clave",
  },
  {
    id: "detailed",
    name: "Datos Detallados",
    description: "Tablas completas con toda la información",
  },
  {
    id: "charts",
    name: "Gráficos y Visualizaciones",
    description: "Gráficos profesionales para análisis visual",
  },
  {
    id: "trends",
    name: "Análisis de Tendencias",
    description: "Evolución temporal y patrones históricos",
  },
  {
    id: "patterns",
    name: "Detección de Patrones",
    description: "Patrones de comportamiento identificados por IA",
  },
  {
    id: "recommendations",
    name: "Recomendaciones",
    description: "Sugerencias y plan de acción basado en análisis",
  },
  {
    id: "analytics",
    name: "Analytics Avanzado",
    description: "Métricas avanzadas y análisis predictivo",
  },
]

const datePresets = [
  {
    id: "today",
    label: "Hoy",
    start: () => new Date(),
    end: () => new Date(),
  },
  {
    id: "yesterday",
    label: "Ayer",
    start: () => subDays(new Date(), 1),
    end: () => subDays(new Date(), 1),
  },
  {
    id: "last7days",
    label: "Últimos 7 días",
    start: () => subDays(new Date(), 7),
    end: () => new Date(),
  },
  {
    id: "last30days",
    label: "Últimos 30 días",
    start: () => subDays(new Date(), 30),
    end: () => new Date(),
  },
  {
    id: "thisweek",
    label: "Esta semana",
    start: () => startOfWeek(new Date()),
    end: () => endOfWeek(new Date()),
  },
  {
    id: "lastweek",
    label: "Semana pasada",
    start: () => startOfWeek(subWeeks(new Date(), 1)),
    end: () => endOfWeek(subWeeks(new Date(), 1)),
  },
  {
    id: "thismonth",
    label: "Este mes",
    start: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: () => new Date(),
  },
  {
    id: "lastmonth",
    label: "Mes pasado",
    start: () => subMonths(new Date(), 1),
    end: () => subDays(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 1),
  },
]

// Datos simulados para filtros
const availableClasses = ref([
  { id: "1", name: "Violín Básico", teacher: "Prof. María González" },
  { id: "2", name: "Piano Intermedio", teacher: "Prof. Carlos Rodríguez" },
  { id: "3", name: "Guitarra Avanzada", teacher: "Prof. Ana Martínez" },
  { id: "4", name: "Coro Juvenil", teacher: "Prof. Luis Pérez" },
])

const availableStudents = ref([
  { id: "1", name: "María García" },
  { id: "2", name: "Juan Pérez" },
  { id: "3", name: "Ana López" },
  { id: "4", name: "Carlos Martín" },
])

// Computed properties
const estimatedPages = computed(() => {
  let pages = 3 // Base
  if (reportConfig.value.content.detailed) pages += 5
  if (reportConfig.value.content.charts) pages += 3
  if (reportConfig.value.content.trends) pages += 2
  if (reportConfig.value.content.patterns) pages += 2
  if (reportConfig.value.content.analytics) pages += 4
  return pages
})

const estimatedTime = computed(() => {
  const baseTime = 30 // 30 segundos base
  const contentTime = Object.values(reportConfig.value.content).filter(Boolean).length * 15
  const totalSeconds = baseTime + contentTime
  return totalSeconds > 60 ? `${Math.ceil(totalSeconds / 60)}min` : `${totalSeconds}s`
})

const estimatedSize = computed(() => {
  let size = 2 // MB base
  if (reportConfig.value.content.charts) size += 3
  if (reportConfig.value.content.detailed) size += 2
  if (reportConfig.value.format === "excel") size += 1
  return `${size}MB`
})

// Métodos de navegación
const nextStep = (): void => {
  if (canProceedToNext()) {
    currentStep.value++
  }
}

const previousStep = (): void => {
  currentStep.value--
}

const canProceedToNext = (): boolean => {
  switch (currentStep.value) {
    case 0:
      return !!reportConfig.value.type
    case 1:
      return !!reportConfig.value.dateRange.start && !!reportConfig.value.dateRange.end
    case 2:
      return !!reportConfig.value.format
    default:
      return true
  }
}

const canGenerate = (): boolean => {
  return !!(
    reportConfig.value.type &&
    reportConfig.value.format &&
    reportConfig.value.dateRange.start &&
    reportConfig.value.dateRange.end
  )
}

// Métodos utilitarios
const applyDatePreset = (preset: any): void => {
  reportConfig.value.datePreset = preset.id
  reportConfig.value.dateRange.start = format(preset.start(), "yyyy-MM-dd")
  reportConfig.value.dateRange.end = format(preset.end(), "yyyy-MM-dd")
}

const getSelectedReportType = () => {
  return reportTypes.find((type) => type.id === reportConfig.value.type)
}

const getSelectedFormat = () => {
  return outputFormats.find((formatItem) => formatItem.id === reportConfig.value.format)
}

const getContentOptionName = (key: string): string => {
  const option = contentOptions.find((opt) => opt.id === key)
  return option?.name || key
}

const formatDate = (dateString: string): string => {
  if (!dateString) return "No definida"
  return format(new Date(dateString), "dd/MM/yyyy", { locale: es })
}

const calculateDayRange = (): number => {
  if (!reportConfig.value.dateRange.start || !reportConfig.value.dateRange.end) return 0
  const start = new Date(reportConfig.value.dateRange.start)
  const end = new Date(reportConfig.value.dateRange.end)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

const generateReport = (): void => {
  if (canGenerate()) {
    emit("generate", { ...reportConfig.value })
  }
}

// Lifecycle
onMounted(() => {
  // Configurar título por defecto basado en fecha
  const today = format(new Date(), "MMMM yyyy", { locale: es })
  reportConfig.value.title = `Reporte de Asistencia - ${today}`
})
</script>
