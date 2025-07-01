<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="assign-student-modal"
    role="dialog"
    aria-modal="true"
  >
    <!-- Overlay -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="$emit('close')" />

    <!-- Modal -->
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div
        class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Asignar Estudiante a Clase
          </h3>
          <button
            class="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="$emit('close')"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Información del estudiante -->
        <div v-if="student" class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Estudiante a asignar:
          </h4>
          <div class="space-y-1 text-sm">
            <p>
              <span class="font-medium">Nombre:</span> {{ student.firstName }}
              {{ student.lastName }}
            </p>
            <p v-if="student.email"><span class="font-medium">Email:</span> {{ student.email }}</p>
            <p v-if="student.phone">
              <span class="font-medium">Teléfono:</span> {{ student.phone }}
            </p>
            <p v-if="student.instrument">
              <span class="font-medium">Instrumento:</span> {{ student.instrument }}
            </p>
          </div>
        </div>

        <!-- Selector de clase -->
        <div class="mb-6">
          <label
            for="class-select"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Seleccionar Clase:
          </label>

          <!-- Loading state para clases -->
          <div v-if="loadingClasses" class="text-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Cargando clases...</p>
          </div>

          <!-- Error al cargar clases -->
          <div v-else-if="classesError" class="text-center py-4">
            <ExclamationTriangleIcon class="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p class="text-sm text-red-600 dark:text-red-400">{{ classesError }}</p>
            <button
              class="mt-2 text-sm text-blue-600 hover:text-blue-500"
              @click="loadTeacherClasses"
            >
              Reintentar
            </button>
          </div>

          <!-- Lista de clases -->
          <div v-else-if="availableClasses.length === 0" class="text-center py-4">
            <AcademicCapIcon class="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p class="text-sm text-gray-600 dark:text-gray-400">No tienes clases disponibles</p>
          </div>

          <select
            v-else
            id="class-select"
            v-model="selectedClassId"
            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
          >
            <option value="">Selecciona una clase...</option>
            <option v-for="classItem in availableClasses" :key="classItem.id" :value="classItem.id">
              {{ classItem.name }} - {{ classItem.instrument || "Música" }} ({{
                classItem.studentIds?.length || 0
              }}
              estudiantes)
            </option>
          </select>
        </div>

        <!-- Información adicional -->
        <div v-if="selectedClass" class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <h4 class="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Información de la clase seleccionada:
          </h4>
          <div class="space-y-1 text-sm text-blue-800 dark:text-blue-300">
            <p><span class="font-medium">Nombre:</span> {{ selectedClass.name }}</p>
            <p v-if="selectedClass.description">
              <span class="font-medium">Descripción:</span> {{ selectedClass.description }}
            </p>
            <p>
              <span class="font-medium">Instrumento:</span>
              {{ selectedClass.instrument || "Música general" }}
            </p>
            <p>
              <span class="font-medium">Nivel:</span>
              {{ selectedClass.level || "Todos los niveles" }}
            </p>
            <p>
              <span class="font-medium">Estudiantes actuales:</span>
              {{ selectedClass.studentIds?.length || 0 }}
            </p>
          </div>
        </div>

        <!-- Error de asignación -->
        <div
          v-if="assignmentError"
          class="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md"
        >
          <div class="flex">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
            <div class="ml-3">
              <p class="text-sm text-red-800 dark:text-red-200">{{ assignmentError }}</p>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex gap-3 justify-end">
          <button
            class="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="$emit('close')"
          >
            Cancelar
          </button>

          <button
            :disabled="!selectedClassId || isAssigning"
            class="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleAssignStudent"
          >
            <div v-if="isAssigning" class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Asignando...
            </div>
            <span v-else>Asignar a Clase</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch, onMounted} from "vue"
import {XMarkIcon, ExclamationTriangleIcon, AcademicCapIcon} from "@heroicons/vue/24/outline"
import {useAuthStore} from "../../../stores/auth"
import {getTeacherClasses, addStudentToClass} from "../../Classes/service/classes"
import {useToast} from "../../../composables/useToast"
import type {GeneralNotification} from "../services/generalNotifications"

// Props
interface Props {
  show: boolean
  student: any
  notification: GeneralNotification | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  assigned: [data: {classId: string; className: string; studentId: string}]
}>()

// Composables
const authStore = useAuthStore()
const toast = useToast()

// Estado
const selectedClassId = ref("")
const availableClasses = ref<any[]>([])
const loadingClasses = ref(false)
const classesError = ref<string | null>(null)
const isAssigning = ref(false)
const assignmentError = ref<string | null>(null)

// Computed
const selectedClass = computed(() =>
  availableClasses.value.find((c) => c.id === selectedClassId.value)
)

// Métodos
const loadTeacherClasses = async () => {
  if (!authStore.user?.uid) return

  loadingClasses.value = true
  classesError.value = null

  try {
    console.log("Cargando clases del maestro:", authStore.user.uid)
    const classes = await getTeacherClasses(authStore.user.uid)
    availableClasses.value = classes || []
    console.log("Clases cargadas:", classes.length)
  } catch (error: any) {
    classesError.value = error.message || "Error al cargar las clases"
    console.error("Error loading teacher classes:", error)
  } finally {
    loadingClasses.value = false
  }
}

const handleAssignStudent = async () => {
  if (!selectedClassId.value || !props.student?.id || !selectedClass.value) {
    return
  }

  isAssigning.value = true
  assignmentError.value = null

  try {
    console.log("Asignando estudiante a clase:", {
      studentId: props.student.id,
      classId: selectedClassId.value,
      className: selectedClass.value.name,
    })

    // Verificar si el estudiante ya está en la clase
    const currentStudents = selectedClass.value.studentIds || []
    if (currentStudents.includes(props.student.id)) {
      assignmentError.value = "El estudiante ya está inscrito en esta clase"
      return
    }

    // Asignar estudiante a la clase
    await addStudentToClass(selectedClassId.value, props.student.id)

    // Emitir evento de éxito
    emit("assigned", {
      classId: selectedClassId.value,
      className: selectedClass.value.name,
      studentId: props.student.id,
    })
  } catch (error: any) {
    assignmentError.value = error.message || "Error al asignar estudiante a la clase"
    console.error("Error assigning student to class:", error)
  } finally {
    isAssigning.value = false
  }
}

const resetForm = () => {
  selectedClassId.value = ""
  assignmentError.value = null
}

// Watchers
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      resetForm()
      loadTeacherClasses()
    }
  }
)

// Lifecycle
onMounted(() => {
  if (props.show) {
    loadTeacherClasses()
  }
})
</script>
