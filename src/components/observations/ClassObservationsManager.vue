<template>
  <div class="class-observations-manager dark:bg-gray-800">
    <!-- Modal de observaciones específico para una clase -->
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
      >
        <!-- Header del modal -->
        <div
          class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 sm:p-4 md:p-6 dark:bg-gray-800"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0 pr-3">
              <h2 class="text-lg sm:text-xl md:text-2xl font-bold mb-1 md:mb-2 truncate">
                📝 Observaciones de Clase
              </h2>
              <p class="text-blue-100 dark:text-blue-200 text-sm sm:text-base truncate">
                {{ displayClassName }} -
                {{
                  isValidDate(selectedDate)
                    ? formatDate(selectedDate)
                    : "Seleccione una fecha válida"
                }}
              </p>
            </div>
            <button
              class="text-white hover:text-gray-300 transition-colors flex-shrink-0"
              @click="closeModal"
            >
              <svg
                class="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
        </div>

        <!-- Contenido del modal -->
        <div
          class="p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-150px)] dark:bg-gray-900 dark:text-gray-200"
        >
          <!-- Estadísticas rápidas de la clase -->
          <div
            v-if="classStats"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6"
          >
            <div
              class="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 md:p-4"
            >
              <div class="flex items-center">
                <div
                  class="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center"
                >
                  <span class="text-2xl">📝</span>
                </div>
                <div class="ml-3">
                  <div class="text-lg font-bold text-blue-900 dark:text-blue-200">
                    {{ classStats.total }}
                  </div>
                  <div class="text-sm text-blue-600 dark:text-blue-300">Total observaciones</div>
                </div>
              </div>
            </div>

            <div
              class="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3 md:p-4"
            >
              <div class="flex items-center">
                <div
                  class="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center"
                >
                  <span class="text-2xl">👨‍🏫</span>
                </div>
                <div class="ml-3">
                  <div class="text-lg font-bold text-green-900 dark:text-green-200">
                    {{ classStats.teacherCount }}
                  </div>
                  <div class="text-sm text-green-600 dark:text-green-300">Maestros activos</div>
                </div>
              </div>
            </div>

            <div
              class="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg p-3 md:p-4"
            >
              <div class="flex items-center">
                <div
                  class="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center"
                >
                  <span class="text-2xl">📅</span>
                </div>
                <div class="ml-3">
                  <div class="text-sm font-medium text-purple-900 dark:text-purple-200">
                    {{ formatDate(classStats.lastObservation) }}
                  </div>
                  <div class="text-sm text-purple-600 dark:text-purple-300">Última observación</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Filtros y acciones rápidas -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <div class="flex flex-col gap-3">
              <div class="flex flex-col sm:flex-row gap-3">
                <div class="flex-1 min-w-0">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Período</label
                  >
                  <select
                    v-model="selectedPeriod"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    @change="loadObservationsForPeriod"
                  >
                    <option value="today">Solo hoy</option>
                    <option value="week">Esta semana</option>
                    <option value="month">Este mes</option>
                    <option value="all">Todas</option>
                  </select>
                </div>

                <div class="flex-1 min-w-0">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Tipo</label
                  >
                  <select
                    v-model="selectedType"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    @change="() => filterObservations()"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="general">General</option>
                    <option value="comportamiento">Comportamiento</option>
                    <option value="academico">Académico</option>
                    <option value="asistencia">Asistencia</option>
                    <option value="evaluacion">Evaluación</option>
                  </select>
                </div>
              </div>

              <div class="flex justify-center sm:justify-end">
                <button
                  class="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center justify-center gap-2 transition-colors"
                  @click="showCreateForm = true"
                >
                  <span>➕</span>
                  Nueva Observación
                </button>
              </div>
            </div>
          </div>

          <!-- Lista de observaciones -->
          <div class="space-y-4">
            <div v-if="loading || initialLoading" class="text-center py-8">
              <div
                class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"
              />
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                {{
                  initialLoading
                    ? "Cargando observaciones por primera vez..."
                    : "Cargando observaciones..."
                }}
              </p>
            </div>

            <div
              v-else-if="filteredObservations.length === 0"
              class="text-center py-8 text-gray-500 dark:text-gray-400"
            >
              <div class="text-4xl mb-4">📝</div>
              <p class="text-lg font-medium">No hay observaciones para mostrar</p>
              <p class="text-sm">Crea la primera observación para esta clase</p>
              <button
                class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                @click="showCreateForm = true"
              >
                ➕ Crear observación
              </button>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="observation in paginatedObservations"
                :key="observation.id"
                class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow"
              >
                <div class="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2 mb-3">
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

                      <!-- Horario de la clase con iconos -->
                      <div
                        class="flex items-center gap-1 bg-blue-50 dark:bg-blue-900 px-2 py-1 rounded-md"
                      >
                        <ClockIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span class="text-xs font-medium text-blue-800 dark:text-blue-200">
                          {{ getClassSchedule(observation.classId) }}
                        </span>
                      </div>

                      <span class="text-sm text-gray-500 dark:text-gray-400">
                        <CalendarDaysIcon class="w-4 h-4 inline mr-1" />
                        {{ formatDateTime(observation.createdAt) }}
                      </span>
                      <span
                        v-if="observation.requiresFollowUp"
                        class="text-orange-500 dark:text-orange-400 text-sm"
                      >
                        ⚠️ Requiere seguimiento
                      </span>
                    </div>

                    <div class="text-gray-900 dark:text-gray-100 leading-relaxed mb-3">
                      {{ observation.text }}
                    </div>

                    <div
                      class="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-500 dark:text-gray-400"
                    >
                      <span>👤 {{ observation.authorName || observation.author }}</span>
                      <span>📝 {{ observation.text.length }} caracteres</span>
                      <span
                        v-if="observation.taggedStudents && observation.taggedStudents.length > 0"
                      >
                        👥 {{ observation.taggedStudents.length }} estudiantes mencionados
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="canEditObservation(observation)"
                    class="flex gap-2 mt-3 md:mt-0 md:ml-4"
                  >
                    <button
                      class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md transition-colors"
                      title="Editar observación"
                      @click="editObservation(observation)"
                    >
                      ✏️
                    </button>
                    <button
                      class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors"
                      title="Eliminar observación"
                      @click="deleteObservation(observation)"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              <!-- Paginación -->
              <div
                v-if="totalPages > 1"
                class="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3"
              >
                <div class="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
                  Mostrando {{ startIndex + 1 }} a
                  {{ Math.min(endIndex, filteredObservations.length) }} de
                  {{ filteredObservations.length }} observaciones
                </div>
                <div class="flex space-x-2">
                  <button
                    :disabled="currentPage === 1"
                    class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                    @click="previousPage"
                  >
                    Anterior
                  </button>
                  <span
                    class="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                  >
                    {{ currentPage }} / {{ totalPages }}
                  </span>
                  <button
                    :disabled="currentPage === totalPages"
                    class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                    @click="nextPage"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal de crear/editar observación con formulario inteligente -->
    <div
      v-if="showCreateForm || editingObservation"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
    >
      <div
        class="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full mx-2 sm:mx-4 max-h-[95vh] overflow-hidden"
      >
        <!-- Header del modal -->
        <div
          class="px-3 sm:px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
          <div class="flex items-center justify-between">
            <h3
              class="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate pr-3"
            >
              {{ editingObservation ? "✏️ Editar Observación" : "➕ Nueva Observación" }}
            </h3>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
              @click="cancelFormEditing"
            >
              <svg
                class="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
        </div>
        <!-- Contenido del modal con formulario inteligente -->
        <div class="overflow-y-auto max-h-[85vh]">
          <SmartObservationForm
            :class-id="props.classId"
            :class-name="props.className || 'Clase'"
            :selected-date="editingObservation?.date || props.selectedDate"
            :initial-text="editingObservation?.text || ''"
            :initial-type="editingObservation?.type || 'general'"
            :initial-priority="editingObservation?.priority || 'media'"
            @observation-saved="handleSmartFormSave"
            @form-updated="handleFormUpdate"
            @cancel="cancelFormEditing"
          />
        </div>
      </div>
    </div>

    <!-- Modal de confirmación de eliminación -->
    <div
      v-if="observationToDelete"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
    >
      <div class="bg-white dark:bg-gray-900 rounded-lg p-4 md:p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          🗑️ Eliminar Observación
        </h3>

        <p class="text-gray-700 dark:text-gray-300 mb-6">
          ¿Estás seguro de que deseas eliminar esta observación? Esta acción no se puede deshacer.
        </p>

        <div
          class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-6"
        >
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {{ formatDate(observationToDelete.date) }}
          </div>
          <div class="text-sm dark:text-gray-300">
            {{ observationToDelete.text.substring(0, 100) }}...
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
          <button
            :disabled="deleting"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            @click="confirmDelete"
          >
            <span v-if="deleting">🗑️ Eliminando...</span>
            <span v-else>🗑️ Sí, eliminar</span>
          </button>
          <button
            class="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
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
import {ref, computed, watch, onMounted} from "vue"
import {ClockIcon, CalendarDaysIcon} from "@heroicons/vue/24/outline"
import {useTeacherObservations} from "../../composables/useObservationManagement"
import {useAuthStore} from "../../stores/auth"
import {useClassesStore} from "../../modulos/Classes/store/classes"
import {useTeacherClassCache} from "../../composables/useTeacherClassCache"
import SmartObservationForm from "./SmartObservationForm.vue"
import type {ObservationData} from "../../stores/observations"

// Props
const props = defineProps<{
  isOpen: boolean
  classId: string
  className?: string
  selectedDate: string
}>()

// Emits
const emit = defineEmits<{
  (e: "close"): void
  (e: "observation-created"): void
  (e: "observation-updated"): void
  (e: "observation-deleted"): void
}>()

// Composables
const authStore = useAuthStore()
const classesStore = useClassesStore()
const classCache = useTeacherClassCache()
const {
  loading,
  fetchMyObservations,
  createMyObservation,
  updateMyObservation,
  deleteMyObservation,
} = useTeacherObservations()

// Estado reactivo mejorado con flags de loading específicos
const observations = ref<ObservationData[]>([])
const filteredObservations = ref<ObservationData[]>([])
const selectedPeriod = ref("today")
const selectedType = ref("")
const currentPage = ref(1)
const itemsPerPage = ref(10)
const saving = ref(false)
const deleting = ref(false)
const initialLoading = ref(true) // Para manejar el primer estado de carga

// Modales
const showCreateForm = ref(false)
const editingObservation = ref<ObservationData | null>(null)
const observationToDelete = ref<ObservationData | null>(null)

// Formulario
const observationForm = ref<{
  classId: string
  date: string
  type: "general" | "comportamiento" | "academico" | "asistencia" | "evaluacion"
  priority: "baja" | "media" | "alta" | "critica"
  text: string
  requiresFollowUp: boolean
}>({
  classId: "",
  date: "",
  type: "general",
  priority: "media",
  text: "",
  requiresFollowUp: false,
})

// Computed properties
// Busca el nombre de la clase según el ID con manejo reactivo mejorado
const displayClassName = computed(() => {
  // Si tenemos el prop className, usarlo directamente (más rápido)
  if (props.className) return props.className

  try {
    // Intentar obtener la clase del store
    const classData = classesStore.getClassById(props.classId)
    if (classData) {
      // Solo usar propiedades que existen en el tipo ClassData
      return classData.name || classData.description || `Clase ID: ${props.classId}`
    }
  } catch (error) {
    console.warn("Error fetching class data:", error)
  }

  // Fallback más informativo mientras se cargan los datos
  return classesStore.loading ? "Cargando clase..." : `Clase ID: ${props.classId}`
})

const classStats = computed(() => {
  const classObservations = observations.value.filter((obs) => obs.classId === props.classId)

  return {
    total: classObservations.length,
    teacherCount: new Set(classObservations.map((obs) => obs.authorId)).size,
    lastObservation: classObservations[0]?.date || null,
  }
})

const totalPages = computed(() => Math.ceil(filteredObservations.value.length / itemsPerPage.value))

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => startIndex.value + itemsPerPage.value)

const paginatedObservations = computed(() =>
  filteredObservations.value.slice(startIndex.value, endIndex.value)
)

// Métodos mejorados con mejor manejo de estado
const loadObservations = async () => {
  try {
    // Solo mostrar loading inicial si no hay datos cargados
    if (observations.value.length === 0) {
      initialLoading.value = true
    }

    const allObservations = await fetchMyObservations()
    observations.value = allObservations || []
    filterObservations()
  } catch (err) {
    console.error("Error loading observations:", err)
    // Mantener datos existentes en caso de error para evitar pérdida de estado
  } finally {
    initialLoading.value = false
  }
}

const loadObservationsForPeriod = () => {
  let dateFilter: Date | undefined = new Date()
  const today = new Date(props.selectedDate)

  switch (selectedPeriod.value) {
    case "today":
      dateFilter = today
      break
    case "week":
      dateFilter = new Date(today)
      dateFilter.setDate(dateFilter.getDate() - 7)
      break
    case "month":
      dateFilter = new Date(today)
      dateFilter.setMonth(dateFilter.getMonth() - 1)
      break
    case "all":
      dateFilter = undefined
      break
  }

  filterObservations(dateFilter)
}

const filterObservations = (dateFilter?: Date) => {
  let filtered = observations.value.filter((obs) => obs.classId === props.classId)

  // Filtro por tipo
  if (selectedType.value) {
    filtered = filtered.filter((obs) => obs.type === selectedType.value)
  }

  // Filtro por fecha
  if (dateFilter) {
    filtered = filtered.filter((obs) => {
      const obsDate = new Date(obs.date)
      return obsDate >= dateFilter
    })
  } else if (selectedPeriod.value === "today") {
    filtered = filtered.filter((obs) => obs.date === props.selectedDate)
  }

  // Ordenar por fecha (más reciente primero)
  filtered.sort((a, b) => {
    const dateA = new Date((a.createdAt as string) || a.date)
    const dateB = new Date((b.createdAt as string) || b.date)
    return dateB.getTime() - dateA.getTime()
  })

  filteredObservations.value = filtered
  currentPage.value = 1
}

const canEditObservation = (observation: ObservationData) => {
  return observation.authorId === authStore.user?.uid
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
    emit("observation-deleted")
  } catch (err) {
    console.error("Error deleting observation:", err)
  } finally {
    deleting.value = false
  }
}

const closeModal = () => {
  emit("close")
}

const isValidDate = (dateString: string | null): boolean => {
  if (!dateString || dateString.trim() === "") return false

  // Verificar que no sea solo espacios o caracteres inválidos
  if (dateString === "Invalid Date" || dateString === "NaN") return false

  const date = new Date(dateString)

  // Verificar que sea una fecha válida y no esté en el futuro lejano o pasado lejano
  const isValid = !isNaN(date.getTime())
  const year = date.getFullYear()
  const currentYear = new Date().getFullYear()

  // Permitir fechas entre 1900 y 100 años en el futuro
  return isValid && year >= 1900 && year <= currentYear + 100
}

const formatDate = (dateString: string | null) => {
  if (!dateString || !isValidDate(dateString)) return "Fecha no disponible"

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Fecha no disponible"
  }
}

const formatDateTime = (dateOrTimestamp: any) => {
  if (!dateOrTimestamp) return "Fecha no disponible"

  try {
    let date: Date

    // Si es un timestamp de Firestore
    if (typeof dateOrTimestamp === "object" && "toDate" in dateOrTimestamp) {
      date = dateOrTimestamp.toDate()
    } else {
      // Si es una fecha normal o string
      date = new Date(dateOrTimestamp)
    }

    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) {
      return "Fecha no disponible"
    }

    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Error formatting datetime:", error)
    return "Fecha no disponible"
  }
}

const getTypeClass = (type: string) => {
  const classes = {
    general: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
    comportamiento: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    academico: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    asistencia: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
    evaluacion: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
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

const getClassSchedule = (classId: string) => {
  const classData = classesStore.getClassById(classId)
  if (!classData) return "Sin horario"

  // Verificar si hay horario y obtener el formato correcto
  if (classData.schedule) {
    // Si schedule es un objeto con slots (nuevo formato)
    if (
      "slots" in classData.schedule &&
      classData.schedule.slots &&
      classData.schedule.slots.length > 0
    ) {
      const slot = classData.schedule.slots[0]
      return `${slot.startTime} - ${slot.endTime}`
    }
    // Si schedule es un objeto con día, hora inicio y fin (formato alternativo)
    else if ("startTime" in classData.schedule && "endTime" in classData.schedule) {
      return `${classData.schedule.startTime} - ${classData.schedule.endTime}`
    }
  }

  return "Sin horario"
}

const handleSmartFormSave = async (observationData: any) => {
  try {
    saving.value = true

    if (editingObservation.value) {
      // Actualizar observación existente
      await updateMyObservation(editingObservation.value.id, observationData)
      emit("observation-updated")
    } else {
      // Crear nueva observación
      await createMyObservation(observationData)
      emit("observation-created")
    }

    // Recargar observaciones y cerrar formulario
    await loadObservations()

    // Invalidar caché de clases si la observación afecta la clase
    await classCache.invalidateOnEvent("class-updated", authStore.user?.uid)

    cancelFormEditing()
  } catch (error) {
    console.error("Error al guardar observación inteligente:", error)
  } finally {
    saving.value = false
  }
}

const handleFormUpdate = (data: any) => {
  // Manejar actualizaciones del formulario si es necesario
  console.log("Formulario actualizado:", data)
}

const cancelFormEditing = () => {
  showCreateForm.value = false
  editingObservation.value = null

  // Resetear el formulario original si es necesario
  observationForm.value = {
    classId: props.classId,
    date: props.selectedDate,
    type: "general",
    priority: "media",
    text: "",
    requiresFollowUp: false,
  }
}

const getPriorityClass = (priority: string) => {
  const classes = {
    baja: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    media: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
    alta: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
    critica: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
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

// Watchers mejorados para evitar estados inconsistentes
watch(
  () => props.classId,
  (newClassId) => {
    if (newClassId) {
      // Resetear el estado al cambiar de clase
      initialLoading.value = true
      observations.value = []
      filteredObservations.value = []
      currentPage.value = 1
      loadObservations()
    }
  }
)

watch(
  () => props.selectedDate,
  (newDate) => {
    observationForm.value.date = newDate
    if (selectedPeriod.value === "today") {
      filterObservations()
    }
  }
)

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      observationForm.value.classId = props.classId
      observationForm.value.date = props.selectedDate

      // Solo cargar si no tenemos datos o si cambió la clase
      if (observations.value.length === 0 || initialLoading.value) {
        loadObservations()
      }
    }
  }
)

// Lifecycle mejorado
onMounted(() => {
  // Solo cargar datos si el modal está abierto y tenemos un classId válido
  if (props.isOpen && props.classId) {
    initialLoading.value = true
    loadObservations()
  }

  // Asegurar que el formulario esté inicializado correctamente
  observationForm.value.classId = props.classId
  observationForm.value.date = props.selectedDate
})
</script>
