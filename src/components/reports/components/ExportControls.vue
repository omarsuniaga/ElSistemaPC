<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-medium text-gray-900">Exportar Reporte</h3>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-500">{{ totalRecords }} registros</span>
      </div>
    </div>

    <!-- Opciones de exportación -->
    <div class="space-y-6">
      <!-- Formato de exportación -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Formato</label>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            v-for="format in exportFormats"
            :key="format.value"
            :class="[
              'p-3 border rounded-lg text-center transition-colors',
              selectedFormat === format.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400',
            ]"
            @click="selectedFormat = format.value"
          >
            <component :is="format.icon" class="h-6 w-6 mx-auto mb-1" />
            <div class="text-sm font-medium">{{ format.label }}</div>
          </button>
        </div>
      </div>

      <!-- Datos a incluir -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Datos a incluir</label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label v-for="option in dataOptions" :key="option.value" class="flex items-center">
            <input
              v-model="selectedData"
              type="checkbox"
              :value="option.value"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">{{ option.label }}</span>
          </label>
        </div>
      </div>

      <!-- Filtros adicionales -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Filtros adicionales</label>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Clases específicas</label>
            <select
              v-model="exportFilters.classes"
              multiple
              class="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option v-for="cls in availableClasses" :key="cls.id" :value="cls.id">
                {{ cls.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs text-gray-500 mb-1">Estado de asistencia</label>
            <select
              v-model="exportFilters.status"
              class="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="present">Solo presentes</option>
              <option value="absent">Solo ausentes</option>
              <option value="late">Solo tardanzas</option>
              <option value="justified">Solo justificados</option>
            </select>
          </div>

          <div>
            <label class="block text-xs text-gray-500 mb-1">Porcentaje mínimo</label>
            <input
              v-model="exportFilters.minAttendance"
              type="number"
              min="0"
              max="100"
              placeholder="0"
              class="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Configuración del reporte -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"
          >Configuración del reporte</label
        >
        <div class="space-y-3">
          <label class="flex items-center">
            <input
              v-model="reportConfig.includeCharts"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">Incluir gráficos y estadísticas</span>
          </label>

          <label class="flex items-center">
            <input
              v-model="reportConfig.includeObservations"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">Incluir observaciones de clase</span>
          </label>

          <label class="flex items-center">
            <input
              v-model="reportConfig.groupByClass"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">Agrupar por clase</span>
          </label>

          <label class="flex items-center">
            <input
              v-model="reportConfig.includeSummary"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">Incluir resumen ejecutivo</span>
          </label>
        </div>
      </div>

      <!-- Título personalizado -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Título del reporte</label>
        <input
          v-model="reportConfig.title"
          type="text"
          placeholder="Reporte de Asistencia"
          class="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <!-- Vista previa -->
      <div v-if="showPreview" class="border rounded-lg p-4 bg-gray-50">
        <h4 class="font-medium text-gray-900 mb-2">Vista previa</h4>
        <div class="text-sm text-gray-600 space-y-1">
          <p><strong>Formato:</strong> {{ getFormatLabel(selectedFormat) }}</p>
          <p><strong>Registros:</strong> {{ filteredRecordsCount }}</p>
          <p><strong>Datos incluidos:</strong> {{ selectedData.length }} categorías</p>
          <p><strong>Período:</strong> {{ formatDateRange }}</p>
        </div>
      </div>
    </div>

    <!-- Botones de acción -->
    <div class="flex items-center justify-between mt-6 pt-6 border-t">
      <div class="flex items-center space-x-2">
        <button
          class="text-sm text-blue-600 hover:text-blue-800"
          @click="showPreview = !showPreview"
        >
          {{ showPreview ? "Ocultar" : "Mostrar" }} vista previa
        </button>
      </div>

      <div class="flex items-center space-x-3">
        <button
          class="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          @click="saveAsTemplate"
        >
          Guardar como plantilla
        </button>

        <button
          :disabled="isExporting || selectedData.length === 0"
          class="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          @click="exportData"
        >
          <ArrowDownTrayIcon v-if="!isExporting" class="h-4 w-4 mr-2" />
          <div
            v-else
            class="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"
          />
          {{ isExporting ? "Exportando..." : "Exportar reporte" }}
        </button>
      </div>
    </div>

    <!-- Plantillas guardadas -->
    <div v-if="savedTemplates.length > 0" class="mt-6 pt-6 border-t">
      <h4 class="text-sm font-medium text-gray-900 mb-3">Plantillas guardadas</h4>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="template in savedTemplates"
          :key="template.id"
          class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 flex items-center"
          @click="loadTemplate(template)"
        >
          {{ template.name }}
          <XMarkIcon
            class="h-3 w-3 ml-1 hover:text-red-600"
            @click.stop="deleteTemplate(template.id)"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed} from "vue"
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentChartBarIcon,
  PrinterIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline"
import {format} from "date-fns"
import {es} from "date-fns/locale"

const props = defineProps({
  attendanceData: {
    type: Array,
    required: true,
  },
  dateRange: {
    type: Object,
    required: true,
  },
  teacherName: {
    type: String,
    default: "",
  },
})

const emit = defineEmits(["export"])

// Estado reactivo
const selectedFormat = ref("excel")
const selectedData = ref(["basic", "attendance", "statistics"])
const exportFilters = ref({
  classes: [],
  status: "",
  minAttendance: null,
})
const reportConfig = ref({
  title: "",
  includeCharts: true,
  includeObservations: false,
  groupByClass: true,
  includeSummary: true,
})
const isExporting = ref(false)
const showPreview = ref(false)
const savedTemplates = ref([])

// Opciones de formato
const exportFormats = [
  {value: "excel", label: "Excel", icon: TableCellsIcon},
  {value: "pdf", label: "PDF", icon: DocumentTextIcon},
  {value: "csv", label: "CSV", icon: DocumentChartBarIcon},
  {value: "print", label: "Imprimir", icon: PrinterIcon},
]

// Opciones de datos
const dataOptions = [
  {value: "basic", label: "Información básica del estudiante"},
  {value: "attendance", label: "Registros de asistencia"},
  {value: "statistics", label: "Estadísticas de asistencia"},
  {value: "observations", label: "Observaciones de clase"},
  {value: "justifications", label: "Justificaciones"},
  {value: "trends", label: "Tendencias temporales"},
  {value: "performance", label: "Análisis de rendimiento"},
]

// Clases disponibles
const availableClasses = computed(() => {
  return props.attendanceData.map((cls) => ({
    id: cls.classId,
    name: cls.className || "Clase sin nombre",
  }))
})

// Conteo de registros
const totalRecords = computed(() => {
  return props.attendanceData.reduce((total, cls) => {
    return total + (cls.students?.length || 0)
  }, 0)
})

const filteredRecordsCount = computed(() => {
  // Aquí se implementaría la lógica de filtrado
  return totalRecords.value
})

// Formateo de fecha
const formatDateRange = computed(() => {
  if (!props.dateRange.startDate || !props.dateRange.endDate) return "Rango no especificado"

  const start = format(new Date(props.dateRange.startDate), "dd/MM/yyyy", {locale: es})
  const end = format(new Date(props.dateRange.endDate), "dd/MM/yyyy", {locale: es})

  return `${start} - ${end}`
})

// Métodos
const getFormatLabel = (formatValue) => {
  const format = exportFormats.find((f) => f.value === formatValue)
  return format?.label || formatValue
}

const exportData = async () => {
  isExporting.value = true

  try {
    const exportConfig = {
      format: selectedFormat.value,
      data: selectedData.value,
      filters: exportFilters.value,
      config: reportConfig.value,
      attendanceData: props.attendanceData,
      dateRange: props.dateRange,
      teacherName: props.teacherName,
    }

    emit("export", exportConfig)
  } catch (error) {
    console.error("Error al exportar:", error)
  } finally {
    isExporting.value = false
  }
}

const saveAsTemplate = () => {
  const templateName = prompt("Nombre de la plantilla:")
  if (!templateName) return

  const template = {
    id: Date.now().toString(),
    name: templateName,
    format: selectedFormat.value,
    data: [...selectedData.value],
    filters: {...exportFilters.value},
    config: {...reportConfig.value},
  }

  savedTemplates.value.push(template)

  // Guardar en localStorage
  localStorage.setItem("attendanceReportTemplates", JSON.stringify(savedTemplates.value))
}

const loadTemplate = (template) => {
  selectedFormat.value = template.format
  selectedData.value = [...template.data]
  exportFilters.value = {...template.filters}
  reportConfig.value = {...template.config}
}

const deleteTemplate = (templateId) => {
  savedTemplates.value = savedTemplates.value.filter((t) => t.id !== templateId)
  localStorage.setItem("attendanceReportTemplates", JSON.stringify(savedTemplates.value))
}

// Cargar plantillas guardadas al montar el componente
const loadSavedTemplates = () => {
  const saved = localStorage.getItem("attendanceReportTemplates")
  if (saved) {
    try {
      savedTemplates.value = JSON.parse(saved)
    } catch (error) {
      console.error("Error al cargar plantillas:", error)
    }
  }
}

// Inicializar título
if (!reportConfig.value.title) {
  reportConfig.value.title = `Reporte de Asistencia${props.teacherName ? ` - ${props.teacherName}` : ""}`
}

// Cargar plantillas al montar
loadSavedTemplates()
</script>
