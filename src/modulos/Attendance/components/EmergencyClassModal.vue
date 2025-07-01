<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Crear Clase Emergente
          </h2>
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="handleCancel"
          >
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
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Fecha: {{ formatDate(date) }}</p>
      </div>

      <form class="p-6 space-y-6" @submit.prevent="handleSubmit">
        <!-- Información básica de la clase -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            Información de la Clase
          </h3>

          <!-- Nombre de la clase -->
          <div>
            <label
              for="emergencyClassName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nombre de la clase emergente *
            </label>
            <input
              id="emergencyClassName"
              v-model="formData.className"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Ej: Clase de Recuperación - Piano"
            />
          </div>

          <!-- Tipo de clase -->
          <div>
            <label
              for="emergencyClassType"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Tipo de clase *
            </label>
            <select
              id="emergencyClassType"
              v-model="formData.classType"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Seleccionar tipo</option>
              <option value="recuperacion">Clase de Recuperación</option>
              <option value="extra">Clase Extra</option>
              <option value="emergencia">Clase de Emergencia</option>
              <option value="evaluacion">Evaluación Especial</option>
              <option value="ensayo">Ensayo Especial</option>
            </select>
          </div>

          <!-- Horario -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="startTime"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Hora de inicio *
              </label>
              <input
                id="startTime"
                v-model="formData.startTime"
                type="time"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                for="endTime"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Hora de fin *
              </label>
              <input
                id="endTime"
                v-model="formData.endTime"
                type="time"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <!-- Instrumento -->
          <div>
            <label
              for="instrument"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Instrumento (opcional)
            </label>
            <input
              id="instrument"
              v-model="formData.instrument"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Ej: Piano, Violín, Guitarra, Canto, etc."
            />
          </div>

          <!-- Motivo -->
          <div>
            <label
              for="reason"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Motivo de la clase emergente *
            </label>
            <textarea
              id="reason"
              v-model="formData.reason"
              required
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Describe el motivo por el cual se necesita esta clase emergente..."
            />
          </div>
        </div>

        <!-- Selección de estudiantes -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <StudentSelector
            v-model="formData.selectedStudents"
            :available-students="availableStudents"
            :loading="loadingStudents"
            @students-changed="handleStudentsChanged"
          />
        </div>

        <!-- Botones de acción -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="handleCancel"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="!isFormValid || isCreating"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isCreating" class="flex items-center">
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creando...
            </span>
            <span v-else>Crear Clase Emergente</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {format, parseISO} from "date-fns"
import {es} from "date-fns/locale"
import StudentSelector from "./StudentSelector.vue"
import {useStudentsStore} from "../../Students/store/students"
import {useAuthStore} from "../../../stores/auth"
import {useEmergencyClasses} from "../../../composables/useEmergencyClasses"

// Types
interface EmergencyClassData {
  className: string
  classType: string
  startTime: string
  endTime: string
  instrument: string
  reason: string
  selectedStudents: string[]
}

interface Props {
  modelValue: boolean
  date: string
  classId?: string
  className?: string
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
  (
    e: "submitted",
    data: EmergencyClassData & {date: string; teacherId: string; emergencyClassId?: string}
  ): void
  (e: "cancel"): void
}

// Props and emits
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Stores and composables
const studentsStore = useStudentsStore()
const authStore = useAuthStore()
const {createEmergencyClass, isCreating, error: emergencyClassError} = useEmergencyClasses()

// Reactive state
const loadingStudents = ref(false)
const availableStudents = ref<any[]>([])

// Form data
const formData = ref<EmergencyClassData>({
  className: "",
  classType: "",
  startTime: "",
  endTime: "",
  instrument: "",
  reason: "",
  selectedStudents: [],
})

// Computed properties
const isFormValid = computed(() => {
  const valid =
    formData.value.className.trim() !== "" &&
    formData.value.classType !== "" &&
    formData.value.startTime !== "" &&
    formData.value.endTime !== "" &&
    formData.value.reason.trim() !== "" &&
    formData.value.selectedStudents.length > 0 &&
    formData.value.startTime < formData.value.endTime

  // Debug logging
  console.log("[EmergencyClassModal] Form validation:", {
    className: formData.value.className.trim() !== "",
    classType: formData.value.classType !== "",
    startTime: formData.value.startTime !== "",
    endTime: formData.value.endTime !== "",
    reason: formData.value.reason.trim() !== "",
    selectedStudents: formData.value.selectedStudents.length,
    timeValid: formData.value.startTime < formData.value.endTime,
    overall: valid,
  })

  return valid
})

// Methods
const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), "EEEE, d 'de' MMMM 'de' yyyy", {locale: es})
  } catch (error) {
    return dateStr
  }
}

const loadAvailableStudents = async () => {
  try {
    loadingStudents.value = true
    console.log("[EmergencyClassModal] Cargando estudiantes disponibles...")

    // Cargar todos los estudiantes activos
    await studentsStore.fetchStudents()
    availableStudents.value = studentsStore.students.filter((student) => student.activo !== false)

    console.log("[EmergencyClassModal] Estudiantes cargados:", availableStudents.value.length)
  } catch (error) {
    console.error("[EmergencyClassModal] Error cargando estudiantes:", error)
    availableStudents.value = []
  } finally {
    loadingStudents.value = false
  }
}

const handleStudentsChanged = (selectedStudents: string[]) => {
  console.log("[EmergencyClassModal] Students changed:", selectedStudents)
  formData.value.selectedStudents = selectedStudents
}

const handleSubmit = async () => {
  if (!isFormValid.value || isCreating.value) return

  try {
    console.log("[EmergencyClassModal] Enviando datos de clase emergente:", formData.value)

    const teacherId = authStore.user?.uid
    if (!teacherId) {
      throw new Error("No se pudo obtener el ID del maestro")
    }

    // Create the emergency class using the composable
    const emergencyClassId = await createEmergencyClass({
      className: formData.value.className,
      classType: formData.value.classType,
      date: props.date,
      startTime: formData.value.startTime,
      endTime: formData.value.endTime,
      instrument: formData.value.instrument,
      reason: formData.value.reason,
      selectedStudents: formData.value.selectedStudents,
      teacherId,
    })

    if (emergencyClassId) {
      console.log("[EmergencyClassModal] Clase emergente creada con ID:", emergencyClassId)

      // Emit the form data with additional metadata
      emit("submitted", {
        ...formData.value,
        date: props.date,
        teacherId,
        emergencyClassId,
      })
    } else {
      throw new Error(emergencyClassError.value || "Error al crear la clase emergente")
    }
  } catch (error) {
    console.error("[EmergencyClassModal] Error al crear clase emergente:", error)
    // TODO: Show error message to user
  }
}

const handleCancel = () => {
  emit("cancel")
  emit("update:modelValue", false)
}

const resetForm = () => {
  formData.value = {
    className: "",
    classType: "",
    startTime: "",
    endTime: "",
    instrument: "",
    reason: "",
    selectedStudents: [],
  }
}

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      loadAvailableStudents()

      // Set default class name based on existing class if provided
      if (props.className) {
        formData.value.className = `${props.className} - Emergente`
      }
    } else {
      resetForm()
    }
  }
)

// Initialize
onMounted(() => {
  if (props.modelValue) {
    loadAvailableStudents()
  }
})
</script>

<style scoped>
/* Custom scrollbar for modal */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Dark mode scrollbar */
.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #374151;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
