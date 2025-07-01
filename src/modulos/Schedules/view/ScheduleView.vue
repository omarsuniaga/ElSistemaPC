<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useSchedule} from "../../../composables/useSchedule"
import {useClassesStore} from "../../Classes/store/classes"
import {useTeachersStore} from "../../Teachers/store/teachers"
import {useScheduleStore} from "../store/schedule"
import ScheduleNavigation from "../components/ScheduleNavigation.vue"
import ScheduleEntryForm from "../components/ScheduleEntryForm.vue"
import ScheduleCalendarView from "../components/ScheduleCalendarView.vue"

// Stores y composables
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()
const scheduleStore = useScheduleStore()
const {isLoading, error, loadingCount, classStats, loadData, validateScheduleConflicts} =
  useSchedule()

// Estados reactivos
const showScheduleForm = ref(false)
const showDiagnostic = ref(false)
const diagnosticInfo = ref("")
const showMessageToast = ref(false)
const messageText = ref("")
const messageType = ref<"success" | "error">("success")
const editMode = ref(false)
const currentEditData = ref<any>({})
const showDetailsModal = ref(false)
const selectedClassDetails = ref<any>(null)
const showConfirmDeleteModal = ref(false)
const classToDelete = ref<string | null>(null)
const viewMode = ref<"list" | "calendar">("list")
const showStudentsModal = ref(false)
const selectedStudentsList = ref<any[]>([])

// Computed Properties
const hasData = computed(() => classesStore.classes.length > 0)

interface ClassData {
  id: string
  name: string
  schedule?: string | Schedule
  teacherId?: string
  studentIds?: string[]
  instrument?: string
  level?: string
  [key: string]: any
}

// Enhancedclasses computed property
const enhancedClasses = computed(() => {
  if (!classesStore.classes) return []

  return classesStore.classes.map((class_: ClassData) => {
    const teacher = teachersStore.teachers.find((t: {id: string}) => t.id === class_.teacherId)
    const formattedSchedule = formatSchedule(class_.schedule || null)
    const studentCount = class_.studentIds?.length || 0

    return {
      ...class_,
      teacherName: teacher?.name || "Sin asignar",
      studentCount,
      formattedSchedule,
      status: getClassStatus(class_),
    }
  })
})

interface Schedule {
  days: string[]
  startTime: string
  endTime: string
}

const formatSchedule = (schedule: string | Schedule | null): Schedule | null => {
  if (!schedule) return null

  if (typeof schedule === "string") {
    const parts = schedule.split(" ")
    if (parts.length >= 4) {
      return {
        days: [parts[0]],
        startTime: parts[1],
        endTime: parts[3],
      }
    }
  }

  if (typeof schedule === "object" && "days" in schedule) {
    return schedule as Schedule
  }

  return null
}

const getClassStatus = (class_: any): string => {
  if (!class_.teacherId) return "no_teacher"
  if (!class_.schedule) return "not_scheduled"
  if (!class_.studentIds?.length) return "no_students"
  return "ready"
}

// Funciones de manejo de clases
const handleSaveSchedule = async (formData: any) => {
  try {
    isLoading.value = true

    // Validar conflictos antes de guardar
    const conflicts = validateScheduleConflicts(formData.data.schedule, formData.data.id)
    if (conflicts.length > 0) {
      throw new Error(`Conflictos encontrados: ${conflicts.join(", ")}`)
    }

    if (editMode.value) {
      await classesStore.updateClass(formData.data)
    } else {
      await classesStore.addClass(formData.data)
    }
    closeScheduleForm()
    await loadData()
    showMessage("Información guardada correctamente")
  } catch (err: any) {
    showMessage(`Error: ${err.message}`, "error")
  } finally {
    isLoading.value = false
  }
}

const deleteClass = async () => {
  if (!classToDelete.value) return
  try {
    isLoading.value = true
    await classesStore.removeClass(classToDelete.value)
    showMessage("Clase eliminada correctamente")
    showConfirmDeleteModal.value = false
    await loadData()
  } catch (err: any) {
    showMessage(`Error: ${err.message}`, "error")
  } finally {
    isLoading.value = false
  }
}

const viewClassDetails = (classData: any) => {
  selectedClassDetails.value = classData
  showDetailsModal.value = true
}

const editClass = (classData: any) => {
  editMode.value = true
  currentEditData.value = {...classData}
  showScheduleForm.value = true
  showDetailsModal.value = false
}

const confirmDeleteClass = (classId: string) => {
  classToDelete.value = classId
  showConfirmDeleteModal.value = true
}

// Message Function
const showMessage = (text: string, type: "success" | "error" = "success") => {
  messageText.value = text
  messageType.value = type
  showMessageToast.value = true
  setTimeout(() => (showMessageToast.value = false), 3000)
}

// Modal Control Functions
const openNewScheduleForm = () => {
  editMode.value = false
  currentEditData.value = {}
  showScheduleForm.value = true
}

const closeScheduleForm = () => {
  showScheduleForm.value = false
}

// Función de diagnóstico
const runDiagnostic = () => {
  const issues: string[] = []
  enhancedClasses.value.forEach((class_) => {
    if (!class_.schedule) {
      issues.push(`Clase "${class_.name}": Sin horario asignado`)
    }
    if (!class_.teacherId) {
      issues.push(`Clase "${class_.name}": Sin profesor asignado`)
    }
    if (!class_.studentIds?.length) {
      issues.push(`Clase "${class_.name}": Sin estudiantes inscritos`)
    }
  })

  diagnosticInfo.value = issues.length
    ? `Problemas encontrados:\n${issues.join("\n")}`
    : "No se encontraron problemas en los horarios."
  showDiagnostic.value = true
}

const fixSchedules = async () => {
  try {
    isLoading.value = true
    const result = await scheduleStore.fixInvalidSchedules()
    if (result.success) {
      showMessage(result.message, "success")
      await loadData()
    } else {
      showMessage(`Error: ${result.error}`, "error")
    }
  } catch (error) {
    showMessage(`Error inesperado: ${error.message}`, "error")
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
</script>
<template>
  <div class="p-4 md:p-6">
    <h1 class="text-2xl font-bold mb-4">Gestión de Horarios</h1>

    <!-- Navegación entre vistas de horarios -->
    <ScheduleNavigation class="mb-6" />

    <!-- Notificación/Toast -->
    <div
      v-if="showMessageToast"
      class="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white transition-all duration-300"
      :class="messageType === 'success' ? 'bg-green-500' : 'bg-red-500'"
    >
      {{ messageText }}
    </div>

    <!-- Panel principal -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
      <div class="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h2 class="text-xl font-semibold">Vista General de Horarios</h2>
        <div class="flex flex-wrap gap-2">
          <button
            class="px-3 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded"
            @click="runDiagnostic"
          >
            <i class="fas fa-stethoscope mr-2" />
            Diagnóstico
          </button>

          <button
            class="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
            @click="loadData"
          >
            <i class="fas fa-sync-alt mr-2" />
            Recargar datos
          </button>

          <button
            class="px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded"
            @click="openNewScheduleForm"
          >
            <i class="fas fa-plus mr-2" />
            Programar Nueva Clase
          </button>

          <button
            class="px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded"
            @click="fixSchedules"
          >
            <i class="fas fa-wrench mr-2" />
            Corregir Horarios
          </button>
        </div>
      </div>

      <div class="flex justify-end mb-4">
        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            class="px-3 py-1 rounded-md transition-colors"
            :class="
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            "
            @click="viewMode = 'list'"
          >
            <i class="fas fa-list mr-1" />
            Lista
          </button>
          <button
            class="px-3 py-1 rounded-md transition-colors"
            :class="
              viewMode === 'calendar'
                ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            "
            @click="viewMode = 'calendar'"
          >
            <i class="fas fa-calendar-alt mr-1" />
            Calendario
          </button>
        </div>
      </div>

      <!-- Estado de carga -->
      <div v-if="isLoading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        <span class="ml-3">Cargando datos ({{ loadingCount }})...</span>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4"
      >
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
        <button
          class="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          @click="loadData"
        >
          Reintentar
        </button>
      </div>

      <!-- Diagnóstico -->
      <div v-else-if="showDiagnostic" class="mt-4">
        <div
          class="bg-gray-50 dark:bg-gray-900 rounded-md p-4 font-mono text-sm whitespace-pre-wrap"
        >
          {{ diagnosticInfo }}
        </div>
        <button
          class="mt-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          @click="showDiagnostic = false"
        >
          Cerrar diagnóstico
        </button>
      </div>

      <!-- Sin datos -->
      <div
        v-else-if="!hasData"
        class="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-md text-center"
      >
        <p class="text-yellow-700 dark:text-yellow-400 mb-2">
          No hay clases registradas en el sistema.
        </p>
        <button
          class="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          @click="openNewScheduleForm"
        >
          Crear mi primera clase
        </button>
      </div>

      <!-- Contenido principal cuando hay datos -->
      <div v-else>
        <!-- Vista de lista -->
        <div v-if="viewMode === 'list'">
          <!-- Resumen estadístico de clases -->
          <div class="mt-6">
            <h3 class="text-lg font-medium mb-3">Resumen de clases</h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {{ classStats.total }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Clases totales</div>
              </div>

              <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ classStats.scheduled }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Clases programadas</div>
              </div>

              <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
                <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {{ classStats.unscheduled }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Clases sin programar</div>
              </div>

              <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-md">
                <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {{ classStats.withoutTeacher }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Sin profesor</div>
              </div>

              <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-md">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {{ classStats.withoutStudents }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Sin estudiantes</div>
              </div>
            </div>
          </div>

          <!-- Listado de clases -->
          <div class="mt-8">
            <h3 class="text-lg font-medium mb-3">Listado de Clases con Horarios</h3>

            <!-- Tabla de clases -->
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Clase
                    </th>
                    <th
                      scope="col"
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Horario
                    </th>
                    <th
                      scope="col"
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Profesor
                    </th>
                    <th
                      scope="col"
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Estudiantes
                    </th>
                    <th
                      scope="col"
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Nivel
                    </th>
                    <th
                      scope="col"
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody
                  class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
                >
                  <tr
                    v-for="class_ in enhancedClasses"
                    :key="class_.id"
                    :class="{
                      'bg-red-50 dark:bg-red-900/10': class_.status === 'no_teacher',
                      'bg-yellow-50 dark:bg-yellow-900/10': class_.status === 'not_scheduled',
                      'bg-orange-50 dark:bg-orange-900/10': class_.status === 'no_students',
                    }"
                  >
                    <td
                      class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                    >
                      <div class="flex flex-col">
                        <span>{{ class_.name }}</span>
                        <span class="text-xs text-gray-500">{{
                          class_.instrument || "Sin instrumento"
                        }}</span>
                      </div>
                    </td>
                    <td
                      class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                    >
                      <div class="flex flex-col items-center">
                        <span>
                          {{ class_.formattedSchedule?.days?.[0] || "No definido" }}
                        </span>
                        <span
                          :class="{
                            'px-2 py-1 rounded': true,
                            'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300':
                              class_.schedule,
                            'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300':
                              !class_.schedule,
                          }"
                        >
                          {{
                            class_.formattedSchedule?.startTime && class_.formattedSchedule?.endTime
                              ? `${class_.formattedSchedule.startTime} - ${class_.formattedSchedule.endTime}`
                              : "Sin programar"
                          }}
                        </span>
                      </div>
                    </td>
                    <td
                      class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                    >
                      {{ class_.teacherName || "Sin asignar" }}
                    </td>
                    <td
                      class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                    >
                      {{ class_.studentCount || 0 }} estudiantes
                    </td>
                    <td
                      class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                    >
                      {{ class_.level || "No definido" }}
                    </td>
                    <td
                      class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                    >
                      <div class="flex space-x-2">
                        <button
                          class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
                          title="Ver detalles"
                          @click="viewClassDetails(class_)"
                        >
                          <i class="fas fa-eye" />
                        </button>
                        <button
                          class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                          title="Editar clase"
                          @click="editClass(class_)"
                        >
                          <i class="fas fa-edit" />
                        </button>
                        <button
                          class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                          title="Eliminar clase"
                          @click="confirmDeleteClass(class_.id)"
                        >
                          <i class="fas fa-trash-alt" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <!-- Mensaje si no hay clases -->
                  <tr v-if="!enhancedClasses || enhancedClasses.length === 0">
                    <td
                      colspan="6"
                      class="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No hay clases disponibles
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Vista de tarjetas para dispositivos móviles -->
          <div class="mt-6 md:hidden">
            <h3 class="text-lg font-medium mb-3">Clases (Vista móvil)</h3>

            <div class="grid grid-cols-1 gap-4">
              <div
                v-for="class_ in enhancedClasses"
                :key="class_.id"
                class="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
                :class="{
                  'border-l-4 border-red-500': class_.status === 'no_teacher',
                  'border-l-4 border-yellow-500': class_.status === 'not_scheduled',
                  'border-l-4 border-orange-500': class_.status === 'no_students',
                  'border-l-4 border-green-500': class_.status === 'ready',
                }"
              >
                <div class="flex justify-between">
                  <h4 class="font-medium">{{ class_.name }}</h4>
                  <div class="flex space-x-2">
                    <button
                      class="text-blue-600 hover:text-blue-900"
                      title="Editar clase"
                      @click="editClass(class_)"
                    >
                      <i class="fas fa-edit" />
                    </button>
                    <button
                      class="text-red-600 hover:text-red-900"
                      title="Eliminar clase"
                      @click="confirmDeleteClass(class_.id)"
                    >
                      <i class="fas fa-trash-alt" />
                    </button>
                  </div>
                </div>

                <div class="mt-2 space-y-1 text-sm">
                  <div class="flex items-center">
                    <span class="w-24 text-gray-600 dark:text-gray-400">Horario:</span>
                    <span>
                      {{
                        class_.formattedSchedule
                          ? `${class_.formattedSchedule.days[0] || ""} ${class_.formattedSchedule.startTime || ""} - ${class_.formattedSchedule.endTime || ""}`
                          : "Sin programar"
                      }}
                    </span>
                  </div>
                  <div class="flex items-center">
                    <span class="w-24 text-gray-600 dark:text-gray-400">Profesor:</span>
                    <span>{{ class_.teacherName }}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="w-24 text-gray-600 dark:text-gray-400">Estudiantes:</span>
                    <span>{{ class_.studentCount }} Estudiantes</span>
                  </div>
                  <div class="flex items-center">
                    <span class="w-24 text-gray-600 dark:text-gray-400">Nivel:</span>
                    <span>{{ class_.level || "No definido" }}</span>
                  </div>
                </div>
              </div>

              <!-- Mensaje si no hay clases -->
              <div
                v-if="enhancedClasses.length === 0"
                class="text-center py-4 text-gray-500 dark:text-gray-400"
              >
                No hay clases disponibles
              </div>
            </div>
          </div>
        </div>

        <!-- Vista de calendario -->
        <div v-else>
          <ScheduleCalendarView :classes="enhancedClasses || []" />
        </div>
      </div>
    </div>

    <!-- Modal para crear/editar horarios -->
    <ScheduleEntryForm
      v-if="showScheduleForm"
      :edit-mode="editMode"
      :initial-data="currentEditData"
      @close="closeScheduleForm"
      @save="handleSaveSchedule"
    />

    <!-- Modal de vista de detalles de clase -->
    <div
      v-if="showDetailsModal && selectedClassDetails"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto"
      >
        <div class="p-6">
          <!-- Cabecera del modal -->
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Detalles de la Clase</h2>
            <button
              class="text-gray-400 hover:text-gray-500 focus:outline-none"
              @click="showDetailsModal = false"
            >
              <span class="sr-only">Cerrar</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Detalles principales -->
          <div class="space-y-6">
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {{ selectedClassDetails.name }}
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Instrumento</p>
                  <p class="font-medium">
                    {{ selectedClassDetails.instrument || "No especificado" }}
                  </p>
                </div>

                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Nivel</p>
                  <p class="font-medium">{{ selectedClassDetails.level || "No especificado" }}</p>
                </div>

                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Horario</p>
                  <p class="font-medium">{{ selectedClassDetails.schedule || "No programado" }}</p>
                </div>

                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Aula</p>
                  <p class="font-medium">{{ selectedClassDetails.classroom || "No asignada" }}</p>
                </div>

                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Profesor</p>
                  <p class="font-medium">{{ selectedClassDetails.teacherName || "Sin asignar" }}</p>
                </div>

                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Total Estudiantes</p>
                  <p class="font-medium">{{ selectedClassDetails.studentCount || 0 }}</p>
                </div>
              </div>

              <div v-if="selectedClassDetails.description" class="mt-4">
                <p class="text-sm text-gray-500 dark:text-gray-400">Descripción</p>
                <p class="mt-1">{{ selectedClassDetails.description }}</p>
              </div>
            </div>

            <!-- Listado de estudiantes -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Estudiantes inscritos
              </h3>

              <div
                v-if="
                  selectedClassDetails.studentDetails &&
                  selectedClassDetails.studentDetails.length > 0
                "
                class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        ID
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Nombre
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Nivel
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
                  >
                    <tr v-for="student in selectedClassDetails.studentDetails" :key="student.id">
                      <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {{ student.id }}
                      </td>
                      <td
                        class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                      >
                        {{ student.name }}
                      </td>
                      <td
                        class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                      >
                        {{ student.level }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                v-else
                class="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                No hay estudiantes inscritos en esta clase
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="flex justify-end space-x-3">
              <button
                class="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                @click="editClass(selectedClassDetails)"
              >
                Editar Clase
              </button>
              <button
                class="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                @click="showDetailsModal = false"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación de eliminación -->
    <div
      v-if="showConfirmDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirmar eliminación</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          ¿Estás seguro de que deseas eliminar esta clase? Esta acción no se puede deshacer.
        </p>
        <div class="flex justify-end space-x-3">
          <button
            class="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            @click="showConfirmDeleteModal = false"
          >
            Cancelar
          </button>
          <button
            class="px-4 py-2 bg-red-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            @click="deleteClass()"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de lista de estudiantes -->
    <div
      v-if="showStudentsModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto"
      >
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Lista de Estudiantes</h2>
            <button
              class="text-gray-400 hover:text-gray-500 focus:outline-none"
              @click="showStudentsModal = false"
            >
              <span class="sr-only">Cerrar</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div
            v-if="selectedStudentsList.length > 0"
            class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    ID
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Nombre
                  </th>
                  <th
                    scope="col"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Nivel
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
              >
                <tr v-for="student in selectedStudentsList" :key="student.id">
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ student.id }}
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ student.name }}
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ student.level }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-else
            class="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            No hay estudiantes inscritos en esta clase
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
