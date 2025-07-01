<template>
  <div class="teacher-observations-dashboard">
    <!-- Header personalizado para maestro -->
    <div
      class="dashboard-header bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-6"
    >
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold mb-2">📝 Mis Observaciones</h1>
          <p class="text-blue-100">Gestiona y revisa las observaciones de tus clases</p>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold">{{ myStats.total }}</div>
          <div class="text-sm text-blue-100">Observaciones totales</div>
        </div>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">🏫</span>
          </div>
          <div class="ml-4">
            <div class="text-2xl font-bold text-gray-900">{{ myStats.totalClasses }}</div>
            <div class="text-sm text-gray-600">Clases con observaciones</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📊</span>
          </div>
          <div class="ml-4">
            <div class="text-2xl font-bold text-gray-900">
              {{ myStats.averagePerClass.toFixed(1) }}
            </div>
            <div class="text-sm text-gray-600">Promedio por clase</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📅</span>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">
              {{ formatDate(myStats.lastObservation) }}
            </div>
            <div class="text-sm text-gray-600">Última observación</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros y acciones -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Clase</label>
            <select
              v-model="selectedClassId"
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @change="loadObservations"
            >
              <option value="">Todas las clases</option>
              <option v-for="classId in availableClasses" :key="classId" :value="classId">
                {{ getClassDisplayName(classId) }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rango de fechas</label>
            <div class="flex gap-2">
              <input
                v-model="dateFrom"
                type="date"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="loadObservations"
              />
              <input
                v-model="dateTo"
                type="date"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="loadObservations"
              />
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            @click="showCreateModal = true"
          >
            <span>➕</span>
            Nueva Observación
          </button>

          <button
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            @click="clearFilters"
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>
    </div>

    <!-- Distribución por tipo -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">📊 Mis Observaciones por Tipo</h3>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div v-for="(count, type) in myStats.byType" :key="type" class="text-center">
          <div
            class="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center"
            :class="getTypeBackgroundClass(type)"
          >
            <span class="text-2xl">{{ getTypeIcon(type) }}</span>
          </div>
          <div class="text-lg font-bold text-gray-900">{{ count }}</div>
          <div class="text-sm text-gray-600 capitalize">{{ type }}</div>
        </div>
      </div>
    </div>

    <!-- Lista de observaciones -->
    <div class="bg-white rounded-lg shadow-sm">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">
          📋 Mis Observaciones ({{ filteredObservations.length }})
        </h3>
        <div class="text-sm text-gray-600">
          <span v-if="loading">🔄 Cargando...</span>
          <span v-else>{{ filteredObservations.length }} observaciones encontradas</span>
        </div>
      </div>

      <div v-if="loading" class="p-8 text-center text-gray-500">🔄 Cargando observaciones...</div>

      <div v-else-if="filteredObservations.length === 0" class="p-8 text-center text-gray-500">
        📝 No hay observaciones para mostrar.
        <button
          class="block mx-auto mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          @click="showCreateModal = true"
        >
          ➕ Crear primera observación
        </button>
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="observation in paginatedObservations"
          :key="observation.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3">
                <span
                  :class="getTypeClass(observation.type)"
                  class="px-2 py-1 text-xs font-medium rounded-full"
                >
                  {{ getTypeLabel(observation.type) }}
                </span>
                <span
                  :class="getPriorityClass(observation.priority)"
                  class="px-2 py-1 text-xs font-medium rounded-full"
                >
                  {{ getPriorityLabel(observation.priority) }}
                </span>
                <span class="text-sm text-gray-500">
                  {{ formatDate(observation.date) }}
                </span>
                <span v-if="observation.requiresFollowUp" class="text-orange-500 text-sm">
                  ⚠️ Requiere seguimiento
                </span>
              </div>

              <div class="text-gray-900 leading-relaxed mb-3">
                {{ observation.text }}
              </div>

              <div class="flex items-center gap-4 text-sm text-gray-500">
                <span>🏫 {{ getClassDisplayName(observation.classId) }}</span>
                <span>📝 {{ observation.text.length }} caracteres</span>
                <span v-if="observation.taggedStudents.length > 0">
                  👥 {{ observation.taggedStudents.length }} estudiantes
                </span>
              </div>
            </div>

            <div class="flex gap-2 ml-4">
              <button
                class="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Editar observación"
                @click="editObservation(observation)"
              >
                ✏️
              </button>
              <button
                class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Eliminar observación"
                @click="deleteObservation(observation)"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Paginación -->
      <div
        v-if="filteredObservations.length > itemsPerPage"
        class="px-6 py-4 border-t border-gray-200 flex items-center justify-between"
      >
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

    <!-- Modal de crear/editar observación -->
    <div
      v-if="showCreateModal || editingObservation"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          {{ editingObservation ? "✏️ Editar Observación" : "➕ Nueva Observación" }}
        </h3>

        <form class="space-y-4" @submit.prevent="saveObservation">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Clase *</label>
              <select
                v-model="observationForm.classId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar clase</option>
                <option v-for="classId in availableClasses" :key="classId" :value="classId">
                  {{ getClassDisplayName(classId) }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fecha *</label>
              <input
                v-model="observationForm.date"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                v-model="observationForm.type"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
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
                v-model="observationForm.priority"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Observación *</label>
            <textarea
              v-model="observationForm.text"
              required
              rows="5"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe los detalles de la observación..."
            />
            <div class="text-sm text-gray-500 mt-1">
              {{ observationForm.text.length }} caracteres
            </div>
          </div>

          <div>
            <label class="flex items-center">
              <input
                v-model="observationForm.requiresFollowUp"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
              <span class="ml-2 text-sm text-gray-700">⚠️ Requiere seguimiento</span>
            </label>
          </div>

          <div class="flex space-x-3 pt-4">
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <span v-if="saving">💾 Guardando...</span>
              <span v-else
                >{{ editingObservation ? "💾 Actualizar" : "➕ Crear" }} Observación</span
              >
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              @click="cancelEdit"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de confirmación de eliminación -->
    <div
      v-if="observationToDelete"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">🗑️ Eliminar Observación</h3>

        <p class="text-gray-700 mb-6">
          ¿Estás seguro de que deseas eliminar esta observación? Esta acción no se puede deshacer.
        </p>

        <div class="bg-gray-50 border rounded-lg p-3 mb-6">
          <div class="text-sm text-gray-600 mb-1">{{ formatDate(observationToDelete.date) }}</div>
          <div class="text-sm">{{ observationToDelete.text.substring(0, 100) }}...</div>
        </div>

        <div class="flex space-x-3">
          <button
            :disabled="deleting"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            @click="confirmDelete"
          >
            <span v-if="deleting">🗑️ Eliminando...</span>
            <span v-else>🗑️ Sí, eliminar</span>
          </button>
          <button
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            @click="observationToDelete = null"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useTeacherObservations} from "../../composables/useObservationManagement"
import type {ObservationData} from "../../stores/observations"

// Composables
const {
  loading,
  error,
  myObservationStats,
  fetchMyObservations,
  fetchMyClassObservations,
  fetchMyObservationsByDateRange,
  createMyObservation,
  updateMyObservation,
  deleteMyObservation,
} = useTeacherObservations()

// Estado reactivo
const observations = ref<ObservationData[]>([])
const selectedClassId = ref("")
const dateFrom = ref("")
const dateTo = ref("")
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Modales
const showCreateModal = ref(false)
const editingObservation = ref<ObservationData | null>(null)
const observationToDelete = ref<ObservationData | null>(null)
const saving = ref(false)
const deleting = ref(false)

// Formulario
const observationForm = ref({
  classId: "",
  date: new Date().toISOString().split("T")[0],
  type: "general",
  priority: "media",
  text: "",
  requiresFollowUp: false,
})

// Computed properties
const myStats = computed(() => myObservationStats.value)

const availableClasses = computed(() => {
  const classes = new Set(observations.value.map((obs) => obs.classId))
  return Array.from(classes)
})

const filteredObservations = computed(() => observations.value)

const totalPages = computed(() => Math.ceil(filteredObservations.value.length / itemsPerPage.value))

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => startIndex.value + itemsPerPage.value)

const paginatedObservations = computed(() =>
  filteredObservations.value.slice(startIndex.value, endIndex.value)
)

// Métodos
const loadObservations = async () => {
  try {
    let result: ObservationData[] = []

    if (selectedClassId.value) {
      result = await fetchMyClassObservations(selectedClassId.value)
    } else if (dateFrom.value && dateTo.value) {
      result = await fetchMyObservationsByDateRange(dateFrom.value, dateTo.value)
    } else {
      result = await fetchMyObservations()
    }

    observations.value = result || []
    currentPage.value = 1
  } catch (err) {
    console.error("Error loading observations:", err)
    observations.value = []
  }
}

const clearFilters = () => {
  selectedClassId.value = ""
  dateFrom.value = ""
  dateTo.value = ""
  loadObservations()
}

const editObservation = (observation: ObservationData) => {
  editingObservation.value = observation
  observationForm.value = {
    classId: observation.classId,
    date: observation.date,
    type: observation.type,
    priority: observation.priority,
    text: observation.text,
    requiresFollowUp: observation.requiresFollowUp,
  }
}

const cancelEdit = () => {
  showCreateModal.value = false
  editingObservation.value = null
  observationForm.value = {
    classId: "",
    date: new Date().toISOString().split("T")[0],
    type: "general",
    priority: "media",
    text: "",
    requiresFollowUp: false,
  }
}

const saveObservation = async () => {
  try {
    saving.value = true

    if (editingObservation.value) {
      await updateMyObservation(editingObservation.value.id, observationForm.value)
    } else {
      await createMyObservation(observationForm.value)
    }

    await loadObservations()
    cancelEdit()
  } catch (err) {
    console.error("Error saving observation:", err)
  } finally {
    saving.value = false
  }
}

const deleteObservation = (observation: ObservationData) => {
  observationToDelete.value = observation
}

const confirmDelete = async () => {
  if (!observationToDelete.value) return

  try {
    deleting.value = true
    await deleteMyObservation(observationToDelete.value.id)
    await loadObservations()
    observationToDelete.value = null
  } catch (err) {
    console.error("Error deleting observation:", err)
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("es-ES")
}

const getClassDisplayName = (classId: string) => {
  // Aquí podrías integrar con un store de clases para obtener nombres reales
  return `Clase ${classId.substring(0, 8)}...`
}

const getTypeIcon = (type: string) => {
  const icons = {
    general: "📝",
    comportamiento: "👥",
    academico: "📚",
    asistencia: "📅",
    evaluacion: "📊",
  }
  return icons[type as keyof typeof icons] || "📝"
}

const getTypeBackgroundClass = (type: string) => {
  const classes = {
    general: "bg-gray-100",
    comportamiento: "bg-red-100",
    academico: "bg-blue-100",
    asistencia: "bg-yellow-100",
    evaluacion: "bg-green-100",
  }
  return classes[type as keyof typeof classes] || "bg-gray-100"
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
onMounted(() => {
  loadObservations()
})
</script>
