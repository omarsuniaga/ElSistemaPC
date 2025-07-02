<template>
  <TransitionRoot :show="open" as="template">
    <Dialog :open="open" as="div" class="fixed inset-0 z-50 overflow-y-auto" @close="handleClose">
      <div class="min-h-screen px-4 text-center">
        <!-- Overlay with improved backdrop -->
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div
            class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 backdrop-blur-sm transition-all"
            aria-hidden="true"
          />
        </TransitionChild>

        <!-- Centering container -->
        <span class="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

        <!-- Modal panel -->
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leave-from="opacity-100 translate-y-0 sm:scale-100"
          leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <DialogPanel
            class="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl"
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700"
            >
              <div class="flex items-center space-x-3">
                <div class="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <AcademicCapIcon class="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <DialogTitle as="h3" class="text-xl font-semibold text-gray-900 dark:text-white">
                    {{ isEditing ? "Editar Clase" : "Crear Nueva Clase" }}
                  </DialogTitle>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{
                      isEditing
                        ? "Modifica los detalles de la clase"
                        : "Configura una nueva clase para la academia"
                    }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                @click="handleClose"
              >
                <span class="sr-only">Cerrar</span>
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>

            <!-- Form Content -->
            <div class="max-h-[calc(100vh-200px)] overflow-y-auto">
              <form class="p-6 space-y-6" @submit.prevent="handleSubmit">
                <!-- Basic Information Section -->
                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h4
                    class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center"
                  >
                    <DocumentTextIcon class="h-5 w-5 text-indigo-500 mr-2" />
                    Información Básica
                  </h4>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Class Name -->
                    <div class="md:col-span-2">
                      <label
                        for="name"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Nombre de la Clase *
                      </label>
                      <input
                        id="name"
                        v-model="formData.name"
                        type="text"
                        required
                        class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        placeholder="Ej: Piano Intermedio, Guitarra Avanzada..."
                      />
                    </div>

                    <!-- Description -->
                    <div class="md:col-span-2">
                      <label
                        for="description"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Descripción
                      </label>
                      <textarea
                        id="description"
                        v-model="formData.description"
                        rows="3"
                        class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        placeholder="Describe el contenido y objetivos de la clase..."
                      />
                    </div>

                    <!-- Instrument -->
                    <div>
                      <label
                        for="instrument"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Instrumento
                      </label>
                      <select
                        id="instrument"
                        v-model="formData.instrument"
                        class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                      >
                        <option value="">Seleccionar instrumento</option>
                        <option
                          v-for="instrument in instruments"
                          :key="instrument"
                          :value="instrument"
                        >
                          {{ instrument }}
                        </option>
                      </select>
                    </div>

                    <!-- Level -->
                    <div>
                      <label
                        for="level"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Nivel
                      </label>
                      <select
                        id="level"
                        v-model="formData.level"
                        class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                      >
                        <option value="">Seleccionar nivel</option>
                        <option value="Principiante">Principiante</option>
                        <option value="Intermedio">Intermedio</option>
                        <option value="Avanzado">Avanzado</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Teachers Section -->
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                  <h4
                    class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center"
                  >
                    <UsersIcon class="h-5 w-5 text-blue-500 mr-2" />
                    Gestión de Maestros
                  </h4>

                  <!-- Main Teacher -->
                  <div class="space-y-4">
                    <div>
                      <label
                        for="teacherId"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Maestro Principal *
                      </label>
                      <select
                        id="teacherId"
                        v-model="formData.teacherId"
                        required
                        class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                      >
                        <option value="">Seleccionar maestro principal</option>
                        <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                          {{ teacher.name }}
                        </option>
                      </select>
                    </div>

                    <!-- Shared Teachers -->
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Maestros Colaboradores
                      </label>
                      <div class="space-y-3">
                        <select
                          v-model="selectedSharedTeacher"
                          class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                          @change="addSharedTeacher"
                        >
                          <option value="">Agregar maestro colaborador</option>
                          <option
                            v-for="teacher in availableSharedTeachers"
                            :key="teacher.id"
                            :value="teacher.id"
                          >
                            {{ teacher.name }}
                          </option>
                        </select>

                        <!-- Shared Teachers List -->
                        <div v-if="formData.sharedWith.length > 0" class="space-y-2">
                          <div
                            v-for="teacherId in formData.sharedWith"
                            :key="teacherId"
                            class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div class="flex items-center space-x-3">
                              <UserCircleIcon class="h-5 w-5 text-gray-400" />
                              <span class="text-sm font-medium text-gray-900 dark:text-white">
                                {{ getTeacherName(teacherId) }}
                              </span>
                            </div>
                            <div class="flex items-center space-x-2">
                              <select
                                :value="getTeacherPermissionLevel(teacherId)"
                                class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                @change="
                                  updateTeacherPermission(
                                    teacherId,
                                    ($event.target as HTMLSelectElement).value
                                  )
                                "
                              >
                                <option value="read">Lectura</option>
                                <option value="write">Escritura</option>
                                <option value="manage">Administración</option>
                              </select>
                              <button
                                type="button"
                                class="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                @click="removeSharedTeacher(teacherId)"
                              >
                                <XMarkIcon class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Schedule Section -->
                <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                  <h4
                    class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center"
                  >
                    <ClockIcon class="h-5 w-5 text-green-500 mr-2" />
                    Horarios de Clase
                  </h4>

                  <div class="space-y-4">
                    <div
                      v-for="(schedule, index) in formData.schedules"
                      :key="index"
                      class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <!-- Day -->
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Día
                          </label>
                          <select
                            v-model="schedule.day"
                            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm transition-colors"
                          >
                            <option value="">Seleccionar día</option>
                            <option value="Lunes">Lunes</option>
                            <option value="Martes">Martes</option>
                            <option value="Miércoles">Miércoles</option>
                            <option value="Jueves">Jueves</option>
                            <option value="Viernes">Viernes</option>
                            <option value="Sábado">Sábado</option>
                            <option value="Domingo">Domingo</option>
                          </select>
                        </div>

                        <!-- Start Time -->
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Hora Inicio
                          </label>
                          <input
                            v-model="schedule.startTime"
                            type="time"
                            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm transition-colors"
                          />
                        </div>

                        <!-- End Time -->
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Hora Fin
                          </label>
                          <input
                            v-model="schedule.endTime"
                            type="time"
                            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm transition-colors"
                          />
                        </div>

                        <!-- Actions -->
                        <div class="flex items-end">
                          <button
                            v-if="formData.schedules.length > 1"
                            type="button"
                            class="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-300 dark:border-red-600 rounded-lg transition-colors"
                            @click="removeScheduleSlot(index)"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Add Schedule Button -->
                    <button
                      type="button"
                      class="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-green-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      @click="addScheduleSlot"
                    >
                      <PlusIcon class="h-5 w-5 mx-auto mb-1" />
                      Agregar Horario Adicional
                    </button>
                  </div>
                </div>

                <!-- Students Section -->
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
                  <h4
                    class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center"
                  >
                    <UserGroupIcon class="h-5 w-5 text-purple-500 mr-2" />
                    Estudiantes de la Clase
                  </h4>

                  <!-- Search Students -->
                  <div class="mb-4">
                    <div class="relative">
                      <div
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      >
                        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        v-model="studentSearchTerm"
                        type="text"
                        class="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        placeholder="Buscar estudiantes por nombre, apellido o instrumento..."
                      />
                    </div>
                  </div>

                  <!-- Students List -->
                  <div
                    class="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div v-if="loading.students" class="flex justify-center items-center p-8">
                      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                    </div>

                    <div
                      v-else-if="filteredStudents.length === 0"
                      class="text-center p-8 text-gray-500 dark:text-gray-400"
                    >
                      {{
                        students.length === 0
                          ? "No hay estudiantes disponibles"
                          : "No se encontraron estudiantes"
                      }}
                    </div>

                    <div v-else class="divide-y divide-gray-200 dark:divide-gray-600">
                      <label
                        v-for="student in filteredStudents"
                        :key="student.id"
                        class="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      >
                        <input
                          v-model="formData.studentIds"
                          type="checkbox"
                          :value="student.id"
                          class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <div class="ml-3 flex-1">
                          <div class="flex items-center justify-between">
                            <div>
                              <p class="text-sm font-medium text-gray-900 dark:text-white">
                                {{ student.nombre }} {{ student.apellido }}
                              </p>
                              <p class="text-xs text-gray-500 dark:text-gray-400">
                                {{ student.instrumento || "Sin instrumento" }} •
                                {{ student.nivel || "Sin nivel" }}
                              </p>
                            </div>
                            <div
                              v-if="student.codigo_estudiante"
                              class="text-xs text-gray-400 dark:text-gray-500"
                            >
                              #{{ student.codigo_estudiante }}
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- Selected Students Count -->
                  <div
                    v-if="formData.studentIds.length > 0"
                    class="mt-3 text-sm text-gray-600 dark:text-gray-400"
                  >
                    {{ formData.studentIds.length }} estudiante(s) seleccionado(s)
                  </div>
                </div>
              </form>
            </div>

            <!-- Footer Actions -->
            <div
              class="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
            >
              <button
                type="button"
                class="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                @click="handleClose"
              >
                Cancelar
              </button>

              <div class="flex items-center space-x-3">
                <div v-if="!isFormValid" class="text-sm text-amber-600 dark:text-amber-400">
                  Completa los campos obligatorios
                </div>
                <button
                  type="submit"
                  :disabled="!isFormValid || saving"
                  class="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  @click="handleSubmit"
                >
                  <span v-if="saving" class="flex items-center">
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
                    {{ isEditing ? "Actualizando..." : "Creando..." }}
                  </span>
                  <span v-else>
                    {{ isEditing ? "Actualizar Clase" : "Crear Clase" }}
                  </span>
                </button>
              </div>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import {ref, computed, watch, onMounted, shallowRef, nextTick} from "vue"
import {debounce} from "lodash-es"
import {Dialog, DialogPanel, TransitionRoot, TransitionChild, DialogTitle} from "@headlessui/vue"
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AcademicCapIcon,
  UsersIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  UserCircleIcon,
} from "@heroicons/vue/24/outline"
import {useTeachersStore} from "../../Teachers/store/teachers"
import {useStudentsStore} from "../../Students/store/students"
import {useNotification} from "@/composables/useNotification"
import type {ClassData} from "../types/class"

interface Props {
  open: boolean
  classData?: ClassData | null
}

const props = withDefaults(defineProps<Props>(), {
  classData: null,
})

const emit = defineEmits<{
  (e: "save", data: Partial<ClassData>): void
  (e: "close"): void
}>()

// Stores and composables
const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()
const {showNotification} = useNotification()

// Reactive state
const saving = ref(false)
const studentSearchTerm = ref("")
const selectedSharedTeacher = ref("")

// Data loading
const teachers = shallowRef<any[]>([])
const students = shallowRef<any[]>([])
const loading = ref({
  students: false,
})

// Available instruments
const instruments = [
  "Piano",
  "Guitarra",
  "Violín",
  "Violonchelo",
  "Flauta",
  "Clarinete",
  "Saxofón",
  "Trompeta",
  "Batería",
  "Bajo",
  "Canto",
  "Ukulele",
  "Mandolina",
]

// Form structure
interface ScheduleSlot {
  day: string
  startTime: string
  endTime: string
}

interface FormData {
  name: string
  description: string
  instrument: string
  level: string
  teacherId: string
  studentIds: string[]
  sharedWith: string[]
  permissions: Record<string, string[]>
  schedules: ScheduleSlot[]
  status: "active" | "inactive" | "suspended"
}

const formData = ref<FormData>({
  name: "",
  description: "",
  instrument: "",
  level: "",
  teacherId: "",
  studentIds: [],
  sharedWith: [],
  permissions: {},
  schedules: [{day: "", startTime: "", endTime: ""}],
  status: "active",
})

// Computed properties
const isEditing = computed(() => !!props.classData?.id)

const isFormValid = computed(() => {
  return formData.value.name.trim() !== "" && formData.value.teacherId !== ""
})

const availableSharedTeachers = computed(() =>
  teachers.value.filter(
    (teacher) =>
      teacher.id !== formData.value.teacherId && !formData.value.sharedWith.includes(teacher.id)
  )
)

// Search functionality
const debouncedSearch = debounce((term: string) => {
  // Implement search logic if needed
}, 300)

watch(studentSearchTerm, (newTerm) => {
  debouncedSearch(newTerm)
})

const filteredStudents = computed(() => {
  if (!studentSearchTerm.value.trim()) return students.value

  const searchTerm = studentSearchTerm.value.toLowerCase()
  return students.value.filter(
    (student) =>
      student.nombre?.toLowerCase().includes(searchTerm) ||
      student.apellido?.toLowerCase().includes(searchTerm) ||
      student.instrumento?.toLowerCase().includes(searchTerm) ||
      student.nivel?.toLowerCase().includes(searchTerm) ||
      student.codigo_estudiante?.toString().includes(searchTerm)
  )
})

// Methods
const loadData = async () => {
  loading.value.students = true
  try {
    await Promise.all([teachersStore.fetchTeachers(), studentsStore.fetchStudents()])

    teachers.value = teachersStore.teachers || []
    students.value = studentsStore.students || []
  } catch (error) {
    console.error("Error loading data:", error)
    showNotification("Error al cargar datos", "error")
  } finally {
    loading.value.students = false
  }
}

const getTeacherName = (teacherId: string): string => {
  const teacher = teachers.value.find((t) => t.id === teacherId)
  return teacher ? teacher.name : "Maestro no encontrado"
}

const getTeacherPermissionLevel = (teacherId: string): string => {
  const permissions = formData.value.permissions[teacherId]
  if (!permissions || permissions.length === 0) return "read"

  if (permissions.includes("manage")) return "manage"
  if (permissions.includes("write")) return "write"
  return "read"
}

const updateTeacherPermission = (teacherId: string, permissionLevel: string) => {
  switch (permissionLevel) {
    case "read":
      formData.value.permissions[teacherId] = ["read"]
      break
    case "write":
      formData.value.permissions[teacherId] = ["read", "write"]
      break
    case "manage":
      formData.value.permissions[teacherId] = ["read", "write", "manage"]
      break
    default:
      formData.value.permissions[teacherId] = ["read"]
  }
}

const addSharedTeacher = () => {
  if (
    selectedSharedTeacher.value &&
    !formData.value.sharedWith.includes(selectedSharedTeacher.value)
  ) {
    formData.value.sharedWith.push(selectedSharedTeacher.value)
    formData.value.permissions[selectedSharedTeacher.value] = ["read"]
    selectedSharedTeacher.value = ""
  }
}

const removeSharedTeacher = (teacherId: string) => {
  formData.value.sharedWith = formData.value.sharedWith.filter((id) => id !== teacherId)
  delete formData.value.permissions[teacherId]
}

const addScheduleSlot = () => {
  formData.value.schedules.push({day: "", startTime: "", endTime: ""})
}

const removeScheduleSlot = (index: number) => {
  if (formData.value.schedules.length > 1) {
    formData.value.schedules.splice(index, 1)
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  saving.value = true
  try {
    // Convertir schedules a schedule.slots para compatibilidad con el store
    const scheduleSlots = formData.value.schedules.filter(
      (slot) => slot.day && slot.startTime && slot.endTime
    )

    const classDataToSave: Partial<ClassData> = {
      ...formData.value,
      id: props.classData?.id,
      createdAt: props.classData?.createdAt || new Date(),
      updatedAt: new Date(),
      // Convertir el formato de horarios para que sea compatible
      schedule: {
        slots: scheduleSlots,
      },
    }

    // Eliminar el campo schedules ya que lo convertimos a schedule.slots
    delete (classDataToSave as any).schedules

    console.log("📤 Datos enviados desde ClassFormDialog:", {
      schedule: classDataToSave.schedule,
      slots: classDataToSave.schedule?.slots,
      slotsCount: classDataToSave.schedule?.slots?.length,
    })

    emit("save", classDataToSave)
    handleClose()
  } catch (error) {
    console.error("Error saving class:", error)
    showNotification("Error al guardar la clase", "error")
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  emit("close")
  resetForm()
}

const resetForm = () => {
  formData.value = {
    name: "",
    description: "",
    instrument: "",
    level: "",
    teacherId: "",
    studentIds: [],
    sharedWith: [],
    permissions: {},
    schedules: [{day: "", startTime: "", endTime: ""}],
    status: "active",
  }
  studentSearchTerm.value = ""
  selectedSharedTeacher.value = ""
}

const loadFormData = () => {
  if (props.classData) {
    formData.value = {
      name: props.classData.name || "",
      description: props.classData.description || "",
      instrument: props.classData.instrument || "",
      level: props.classData.level || "",
      teacherId: props.classData.teacherId || "",
      studentIds: props.classData.studentIds || [],
      sharedWith: props.classData.sharedWith || [],
      permissions: props.classData.permissions || {},
      schedules:
        props.classData.schedule?.slots?.length > 0
          ? props.classData.schedule.slots.map((slot) => ({
              day: slot.day || "",
              startTime: slot.startTime || "",
              endTime: slot.endTime || "",
            }))
          : [{day: "", startTime: "", endTime: ""}],
      status: props.classData.status || "active",
    }
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loadFormData()
      nextTick(() => {
        const nameInput = document.getElementById("name")
        if (nameInput) nameInput.focus()
      })
    }
  }
)
</script>

<style scoped>
/* Custom scrollbar for the modal content */
.max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar {
  width: 6px;
}

.max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar-track {
  background: transparent;
}

.max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar-thumb {
  background: rgb(156 163 175 / 0.5);
  border-radius: 3px;
}

.max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar-thumb:hover {
  background: rgb(156 163 175 / 0.7);
}

/* Dark mode scrollbar */
.dark .max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar-thumb {
  background: rgb(75 85 99 / 0.5);
}

.dark .max-h-\[calc\(100vh-200px\)\]::-webkit-scrollbar-thumb:hover {
  background: rgb(75 85 99 / 0.7);
}
</style>
