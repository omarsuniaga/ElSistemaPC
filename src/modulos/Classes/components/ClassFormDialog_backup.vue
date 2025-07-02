<template>
  <TransitionRoot :show="open" as="template">
    <Dialog
      :open="open"
      as="div"
      class="fixed inset-0 z-50 overflow-y-auto"
      @close="handleClose"
      @open="lockBodyScroll"
    >
      <div class="min-h-screen px-4 text-center">
        <!-- Overlay -->
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
            class="fixed inset-0 bg-black/30 dark:bg-black/60 transition-opacity"
            aria-hidden="true"
          />
        </TransitionChild>

        <!-- Modal Container -->
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
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
                class="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
              >
                <div class="flex items-center justify-between mb-4">
                  <DialogTitle
                    as="h3"
                    class="text-xl font-semibold leading-6 text-gray-900 dark:text-white"
                  >
                    {{ isEditing ? "Editar Clase" : "Crear Clase" }}
                  </DialogTitle>
                  <button
                    type="button"
                    class="rounded-md text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                    @click="handleClose"
                  >
                    <span class="sr-only">Cerrar</span>
                    <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <form @submit.prevent="handleSubmit">
                  <div class="mb-4">
                    <label for="name" class="block text-sm font-medium text-gray-700">
                      Nombre de la clase
                    </label>
                    <input
                      id="name"
                      v-model="studentForm.name"
                      type="text"
                      class="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                      placeholder="Nombre de la clase"
                    />
                  </div>

                  <div class="mb-4">
                    <label for="instrument" class="block text-sm font-medium text-gray-700">
                      Instrumento
                    </label>
                    <input
                      id="instrument"
                      v-model="studentForm.instrument"
                      type="text"
                      class="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                      placeholder="Instrumento"
                    />
                  </div>

                  <div class="mb-4">
                    <label for="level" class="block text-sm font-medium text-gray-700">
                      Nivel
                    </label>
                    <input
                      id="level"
                      v-model="studentForm.level"
                      type="text"
                      class="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                      placeholder="Nivel"
                    />
                  </div>

                  <div class="mb-4">
                    <label for="status" class="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <select
                      id="status"
                      v-model="studentForm.status"
                      class="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="suspended">Suspendido</option>
                    </select>
                  </div>

                  <div class="mb-4">
                    <label for="description" class="block text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <textarea
                      id="description"
                      v-model="studentForm.description"
                      class="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                      placeholder="Descripción"
                    />
                  </div>

                  <div class="mb-4">
                    <label for="capacity" class="block text-sm font-medium text-gray-700">
                      Capacidad
                    </label>
                    <input
                      id="capacity"
                      v-model="studentForm.capacity"
                      type="number"
                      class="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                      placeholder="Capacidad"
                    />
                  </div>

                  <div class="mb-4">
                    <label for="teacherId" class="block text-sm font-medium text-gray-700">
                      Profesor
                    </label>
                    <select
                      id="teacherId"
                      v-model="studentForm.teacherId"
                      class="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                    >
                      <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                        {{ teacher.name }}
                      </option>
                    </select>
                  </div>

                  <div class="mb-4">
                    <label for="studentIds" class="block text-sm font-medium text-gray-700 mb-2">
                      Estudiantes
                    </label>
                    <!-- Search input -->
                    <div class="relative mb-2">
                      <div
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      >
                        <MagnifyingGlassIcon class="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="studentSearch"
                        v-model="studentSearchTerm"
                        type="text"
                        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Buscar estudiantes..."
                      />
                    </div>

                    <!-- Student list -->
                    <div
                      class="h-48 overflow-y-auto border rounded-md border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800"
                    >
                      <!-- Loading state -->
                      <div v-if="loading.students" class="flex justify-center items-center h-full">
                        <div
                          class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"
                        />
                      </div>

                      <!-- Empty state -->
                      <div
                        v-else-if="!loading.students && filteredStudents.length === 0"
                        class="text-center text-gray-500 py-4"
                      >
                        {{
                          students.length === 0
                            ? "No hay estudiantes disponibles"
                            : "No se encontraron estudiantes que coincidan con la búsqueda"
                        }}
                      </div>

                      <!-- Students list -->
                      <div v-else class="space-y-1">
                        <div
                          v-for="student in filteredStudents"
                          :key="student.id"
                          class="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors duration-150"
                        >
                          <input
                            :id="`student-${student.id}`"
                            v-model="studentForm.studentIds"
                            type="checkbox"
                            :value="student.id"
                            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                            @change="onStudentSelected"
                          />
                          <label
                            :for="`student-${student.id}`"
                            class="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                          >
                            {{ student.nombre }} {{ student.apellido }}
                            <span v-if="student.instrumento" class="text-xs text-gray-500 ml-2">
                              ({{ student.instrumento }})
                            </span>
                          </label>
                        </div>
                      </div>

                      <!-- Debug info (only in development) -->
                      <div
                        v-if="isDevelopment"
                        class="mt-4 p-3 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <div class="font-medium mb-1">Información de depuración:</div>
                        <div>• Estudiantes cargados: {{ students.length }}</div>
                        <div>• Estudiantes filtrados: {{ filteredStudents.length }}</div>
                        <div v-if="filteredStudents.length > 0" class="mt-2">
                          <div class="font-medium">Ejemplo de estudiante:</div>
                          <pre
                            class="text-xs overflow-auto p-2 bg-white dark:bg-gray-900 rounded mt-1"
                            >{{ JSON.stringify(filteredStudents[0], null, 2) }}</pre
                          >
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label for="sharedWith" class="block text-sm font-medium text-gray-700">
                      Compartir con
                    </label>
                    <select
                      id="sharedWith"
                      v-model="studentForm.sharedWith"
                      multiple
                      class="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                    >
                      <option
                        v-for="teacher in availableSharedTeachers"
                        :key="teacher.id"
                        :value="teacher.id"
                      >
                        {{ teacher.name }}
                      </option>
                    </select>
                  </div>

                  <div class="mb-4">
                    <label for="permissions" class="block text-sm font-medium text-gray-700">
                      Permisos
                    </label>
                    <div
                      v-for="teacherId in studentForm.sharedWith"
                      :key="teacherId"
                      class="flex items-center"
                    >
                      <span class="mr-2">{{ getTeacherName(teacherId) }}</span>
                      <select
                        v-model="studentForm.permissions[teacherId]"
                        class="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                      >
                        <option value="read">Lectura</option>
                        <option value="write">Escritura</option>
                        <option value="manage">Administración</option>
                      </select>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label for="schedules" class="block text-sm font-medium text-gray-700">
                      Horarios
                    </label>
                    <div
                      v-for="(schedule, index) in studentForm.schedules"
                      :key="index"
                      class="flex items-center"
                    >
                      <input
                        v-model="schedule.day"
                        type="text"
                        class="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                        placeholder="Día"
                      />
                      <input
                        v-model="schedule.startTime"
                        type="time"
                        class="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                        placeholder="Hora de inicio"
                      />
                      <input
                        v-model="schedule.endTime"
                        type="time"
                        class="block w-full rounded-md border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-700 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                        placeholder="Hora de fin"
                      />
                      <button
                        type="button"
                        class="ml-2 rounded-md bg-red-500 p-2 text-sm text-white hover:bg-red-700"
                        @click="removeScheduleSlot(index)"
                      >
                        Eliminar
                      </button>
                    </div>
                    <button
                      type="button"
                      class="mt-2 rounded-md bg-blue-500 p-2 text-sm text-white hover:bg-blue-700"
                      @click="addScheduleSlot"
                    >
                      Agregar horario
                    </button>
                  </div>

                  <div class="mt-4 flex justify-end">
                    <button
                      type="submit"
                      :disabled="!isFormValid || saving"
                      class="inline-flex justify-center rounded-md border border-transparent bg-blue-500 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {{ isEditing ? "Actualizar" : "Crear" }}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  shallowRef,
  nextTick,
  defineAsyncComponent,
  withDefaults,
} from "vue"
import {debounce} from "lodash-es"
import {Dialog, DialogPanel, TransitionRoot, TransitionChild, DialogTitle} from "@headlessui/vue"
import {MagnifyingGlassIcon, XMarkIcon} from "@heroicons/vue/24/outline"
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
  (e: "close"): void
  (e: "save", data: Partial<ClassData>): void
}>()

const isDevelopment = import.meta.env.MODE === "development"

const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()
const {showNotification} = useNotification()

const saving = ref(false)
const studentSearchTerm = ref("")

// Interfaz para el horario
interface ScheduleSlot {
  day: string
  startTime: string
  endTime: string
}

// Interfaz para el formulario
interface ClassFormData {
  name: string
  instrument: string
  level: string
  status: "active" | "inactive" | "suspended"
  description: string
  capacity: number
  teacherId: string
  studentIds: string[]
  sharedWith: string[]
  permissions: Record<string, string[]>
  schedules: ScheduleSlot[]
}

const studentForm = ref<ClassFormData>({
  name: "",
  instrument: "",
  level: "",
  status: "active",
  description: "",
  capacity: 8,
  teacherId: "",
  studentIds: [],
  sharedWith: [],
  permissions: {},
  schedules: [{day: "", startTime: "", endTime: ""}],
})

const isEditing = computed(() => !!props.classData)

// Importar el componente de lista virtualizada
const VirtualizedList = defineAsyncComponent(() => import("@/components/VirtualizedList.vue"))

// Datos con carga perezosa
const teachers = shallowRef<any[]>([])
const students = shallowRef<any[]>([])
const loading = ref({
  teachers: false,
  students: false,
})

// Función memoizada para normalizar texto
const normalizeText = (
  (cache = new Map()) =>
  (text: string): string => {
    if (!text) return ""
    if (cache.has(text)) return cache.get(text)

    const normalized = String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ")

    cache.set(text, normalized)
    if (cache.size > 1000) cache.delete(cache.keys().next().value)
    return normalized
  }
)()

// Search with debounce
const updateStudentSearch = debounce((term: string) => {
  studentSearchTerm.value = term.trim().toLowerCase()
}, 300)

// Watch for search term changes
watch(studentSearchTerm, (newTerm) => {
  if (newTerm) {
    updateStudentSearch(newTerm)
  } else {
    // Reset immediately when search is cleared
    studentSearchTerm.value = ""
  }
})

// Optimized filtering function
const filterStudents = (items: any[], searchTerm: string) => {
  if (!searchTerm) return items

  const searchTerms = searchTerm.split(" ").filter((term) => term.length > 0)
  if (searchTerms.length === 0) return items

  return items.filter((student) => {
    // Normalize student data
    const nombre = normalizeText(student.nombre || "")
    const apellido = normalizeText(student.apellido || "")
    const instrumento = normalizeText(student.instrumento || "")
    const fullName = `${nombre} ${apellido}`.trim()

    // Check if all search terms match any field
    return searchTerms.every((term) => {
      const normalizedTerm = normalizeText(term)
      if (!normalizedTerm) return true

      return (
        nombre.includes(normalizedTerm) ||
        apellido.includes(normalizedTerm) ||
        fullName.includes(normalizedTerm) ||
        instrumento.includes(normalizedTerm) ||
        student.cedula?.includes(term) || // Search by ID if available
        student.codigo_estudiante?.toString().includes(term) // Search by student code if available
      )
    })
  })
}

// Lista de estudiantes filtrada con memoización
const filteredStudents = computed(() => {
  return filterStudents(students.value, studentSearchTerm.value)
})

const availableSharedTeachers = computed(() =>
  teachers.value.filter((teacher) => teacher.id !== studentForm.value.teacherId)
)

const isFormValid = computed(() => {
  return (
    studentForm.value.name.trim() !== "" &&
    studentForm.value.instrument !== "" &&
    studentForm.value.level !== "" &&
    studentForm.value.teacherId !== ""
  )
})

// Helper functions for permissions
const getTeacherPermissionLevel = (teacherId: string): string => {
  const permissions = studentForm.value.permissions[teacherId]
  if (!permissions || permissions.length === 0) return "read"

  if (permissions.includes("manage")) return "manage"
  if (permissions.includes("write")) return "write"
  return "read"
}

const updateTeacherPermission = (teacherId: string, permissionLevel: string) => {
  switch (permissionLevel) {
    case "read":
      studentForm.value.permissions[teacherId] = ["read"]
      break
    case "write":
      studentForm.value.permissions[teacherId] = ["read", "write"]
      break
    case "manage":
      studentForm.value.permissions[teacherId] = ["read", "write", "manage"]
      break
    default:
      studentForm.value.permissions[teacherId] = ["read"]
  }
}

// Helper function to get teacher name
const getTeacherName = (teacherId: string): string => {
  if (!teacherId) return "Sin asignar"
  const teacher = teachers.value?.find((t) => t.id === teacherId)
  return teacher ? teacher.name : "Maestro no encontrado"
}

// Function to handle student selection
const onStudentSelected = () => {
  // Optional: Add any logic needed when a student is selected
  // For example, you could close a dropdown or show a confirmation
  console.log("Selected students:", studentForm.value.studentIds)
}

// Functions for managing multiple schedules
const addScheduleSlot = () => {
  studentForm.value.schedules.push({
    day: "",
    startTime: "",
    endTime: "",
  })
}

const removeScheduleSlot = (index: number) => {
  if (studentForm.value.schedules.length > 1) {
    studentForm.value.schedules.splice(index, 1)
  }
}

// Cache para días de la semana
const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const dayIndexMap = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

// Helper functions for schedule display
const getDayName = (day: string): string => {
  if (!day) return ""
  const dayLower = day.toLowerCase()
  const index = dayIndexMap[dayLower as keyof typeof dayIndexMap]
  return index !== undefined ? dayNames[index] : day
}

/**
 * Formatea un valor de tiempo a formato HH:mm con caché
 */
const timeCache = new Map<string, string>()
const formatTimeToHHMM = (time: string | Date | {hours: number; minutes: number}): string => {
  if (!time) return ""

  // Generar clave de caché
  const cacheKey = typeof time === "object" ? JSON.stringify(time) : String(time)

  // Verificar caché
  if (timeCache.has(cacheKey)) {
    return timeCache.get(cacheKey)
  }

  let result = ""

  try {
    // Si ya es un string en formato HH:mm, usarlo directamente
    if (typeof time === "string" && /^\d{2}:\d{2}$/.test(time)) {
      result = time
    }
    // Si es un objeto con horas y minutos
    else if (typeof time === "object" && "hours" in time && "minutes" in time) {
      const hours = String(time.hours).padStart(2, "0")
      const minutes = String(time.minutes).padStart(2, "0")
      result = `${hours}:${minutes}`
    }
    // Si es un objeto Date
    else if (time instanceof Date) {
      result = time.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    }
    // Si es un string con formato de hora
    else if (typeof time === "string") {
      const date = new Date(`2000-01-01T${time}`)
      if (!isNaN(date.getTime())) {
        result = date.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      }
    }

    // Si no se pudo formatear, usar el valor original
    if (!result) {
      result = String(time)
    }

    // Guardar en caché
    timeCache.set(cacheKey, result)

    // Limpiar caché si es muy grande (prevenir memory leaks)
    if (timeCache.size > 1000) {
      const firstKey = timeCache.keys().next().value
      timeCache.delete(firstKey)
    }

    return result
  } catch (e) {
    console.warn("Error formateando hora:", time, e)
    return String(time)
  }
}

/**
 * Función de compatibilidad para formatear la hora (mantenida por compatibilidad)
 */
const formatTime = (time: string | Date | {hours: number; minutes: number}): string => {
  return formatTimeToHHMM(time)
}

// Caché para horarios válidos
const validSchedulesCache = new Map<string, ScheduleSlot[]>()

// Validación de horarios con memoización
const validSchedules = computed<ScheduleSlot[]>(() => {
  const cacheKey = JSON.stringify(studentForm.value.schedules)

  // Si ya tenemos un resultado en caché, lo devolvemos
  if (validSchedulesCache.has(cacheKey)) {
    return validSchedulesCache.get(cacheKey)!
  }

  // Filtramos los horarios válidos
  const valid = studentForm.value.schedules.filter((schedule: ScheduleSlot) => {
    if (!schedule.day || !schedule.startTime || !schedule.endTime) return false

    try {
      const start = new Date(`1970-01-01T${schedule.startTime}`)
      const end = new Date(`1970-01-01T${schedule.endTime}`)
      return start < end
    } catch (e) {
      console.error("Error al validar horario:", e)
      return false
    }
  })

  // Guardamos en caché el resultado
  validSchedulesCache.set(cacheKey, valid)
  return valid
})

// Comprobamos si hay horarios válidos
const hasValidSchedules = computed(() => validSchedules.value.length > 0)

const hasInvalidSchedules = computed(() => {
  return studentForm.value.schedules.some((schedule) => {
    if (!schedule.day || !schedule.startTime || !schedule.endTime) return true
    try {
      const start = new Date(`1970-01-01T${schedule.startTime}`)
      const end = new Date(`1970-01-01T${schedule.endTime}`)
      return start >= end
    } catch (e) {
      return true
    }
  })
})

const invalidScheduleMessage = computed(() => {
  const invalid = studentForm.value.schedules.find((schedule) => {
    if (!schedule.day || !schedule.startTime || !schedule.endTime) return true
    try {
      const start = new Date(`1970-01-01T${schedule.startTime}`)
      const end = new Date(`1970-01-01T${schedule.endTime}`)
      return start >= end
    } catch (e) {
      return true
    }
  })

  return invalid
    ? `El horario del ${getDayName(invalid.day)} tiene una hora de inicio posterior a la de finalización o es inválido`
    : ""
})

async function handleSubmit() {
  // Validación inicial rápida
  if (!isFormValid.value || saving.value) {
    showNotification("Por favor complete todos los campos requeridos", "warning")
    return
  }

  // Dar tiempo al navegador para actualizar el estado de carga
  saving.value = true
  await nextTick()

  try {
    // Validar horarios
    if (!hasValidSchedules.value) {
      showNotification("Debe agregar al menos un horario válido", "error")
      saving.value = false
      return
    }

    // Validar que las horas de inicio sean menores a las de fin
    if (hasInvalidSchedules.value) {
      showNotification(invalidScheduleMessage.value, "error")
      saving.value = false
      return
    }

    // Validar que se haya seleccionado un profesor
    if (!studentForm.value.teacherId) {
      showNotification("Debe seleccionar un profesor para la clase", "error")
      saving.value = false
      return
    }

    // Preparar datos para guardar (operación síncrona rápida)
    const now = new Date()
    const classData: Partial<ClassData> = {
      name: studentForm.value.name.trim(),
      instrument: studentForm.value.instrument,
      level: studentForm.value.level,
      status: studentForm.value.status,
      description: studentForm.value.description.trim(),
      capacity: 0, // Capacidad ilimitada
      teacherId: studentForm.value.teacherId,
      studentIds: Array.isArray(studentForm.value.studentIds)
        ? [...studentForm.value.studentIds]
        : [],
      sharedWith: Array.isArray(studentForm.value.sharedWith)
        ? [...studentForm.value.sharedWith]
        : [],
      permissions: {...(studentForm.value.permissions || {})},
      schedule: {slots: [...validSchedules.value]},
      updatedAt: now,
    }

    // Si es edición, mantener el ID y fecha de creación
    if (isEditing.value && props.classData?.id) {
      classData.id = props.classData.id
      classData.createdAt = props.classData.createdAt || now

      // Mantener el historial de cambios si existe
      if (props.classData.changeHistory) {
        classData.changeHistory = [
          ...(props.classData.changeHistory || []),
          {timestamp: now, changes: "Actualización de la clase"},
        ]
      } else {
        classData.changeHistory = [{timestamp: now, changes: "Actualización de la clase"}]
      }
    } else {
      // Para clases nuevas, establecer fechas de creación
      classData.createdAt = now
      classData.changeHistory = [{timestamp: now, changes: "Creación de la clase"}]
    }

    // Emitir evento para guardar (operación asíncrona)
    emit("save", classData)

    // Mostrar notificación de éxito
    showNotification(
      `✅ Clase "${classData.name}" ${isEditing.value ? "actualizada" : "creada"} correctamente`,
      "success"
    )

    // Cerrar el diálogo después de guardar
    emit("close")
  } catch (error) {
    console.error("Error al guardar la clase:", error)
    showNotification(
      `❌ Error al ${isEditing.value ? "actualizar" : "crear"} la clase: ${error instanceof Error ? error.message : "Error desconocido"}`,
      "error"
    )
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    loading.value.teachers = true
    loading.value.students = true

    const [teachersStore, studentsStore] = [useTeachersStore(), useStudentsStore()]

    await Promise.all([
      teachersStore.fetchTeachers().then(() => {
        teachers.value = teachersStore.teachers
      }),
      studentsStore.fetchStudents().then(() => {
        students.value = studentsStore.students
      }),
    ])

    // Si estamos editando, cargar los datos de la clase
    if (props.classData) {
      // Convertir el schedule a formato de array si es necesario
      const scheduleData = props.classData.schedule || {}
      const schedules = Array.isArray(scheduleData) ? scheduleData : [scheduleData].filter(Boolean)

      studentForm.value = {
        name: props.classData.name || "",
        instrument: props.classData.instrument || "",
        level: props.classData.level || "",
        status: props.classData.status || "active",
        description: props.classData.description || "",
        capacity: props.classData.capacity || 8,
        teacherId: props.classData.teacherId || "",
        studentIds: Array.isArray(props.classData.studentIds)
          ? [...props.classData.studentIds]
          : [],
        sharedWith: Array.isArray(props.classData.sharedWith)
          ? [...props.classData.sharedWith]
          : [],
        permissions: {...(props.classData.permissions || {})},
        schedules:
          schedules.length > 0
            ? schedules.map((s: any) => ({
                day: s?.day || "",
                startTime: s?.startTime || "",
                endTime: s?.endTime || "",
              }))
            : [{day: "", startTime: "", endTime: ""}],
      }
    }
  } catch (error) {
    console.error("Error loading data:", error)
    showNotification("Error al cargar los datos. Por favor, intente nuevamente.", "error")
  } finally {
    loading.value.teachers = false
    loading.value.students = false
  }
})

function resetForm() {
  studentForm.value = {
    name: "",
    instrument: "",
    level: "",
    status: "active",
    description: "",
    capacity: 8,
    teacherId: "",
    studentIds: [],
    sharedWith: [],
    permissions: {},
    schedules: [
      {
        day: "",
        startTime: "",
        endTime: "",
      },
    ],
  }
  studentSearchTerm.value = ""
}

// Watch con debounce para cambios en sharedWith
watch(
  () => studentForm.value.sharedWith,
  debounce((newSharedWith, oldSharedWith) => {
    // Remove permissions for teachers that are no longer shared
    if (oldSharedWith) {
      oldSharedWith.forEach((teacherId: string) => {
        if (!newSharedWith.includes(teacherId)) {
          delete studentForm.value.permissions[teacherId]
        }
      })
    }

    // Add default permissions for new shared teachers
    newSharedWith.forEach((teacherId: string) => {
      if (!studentForm.value.permissions[teacherId]) {
        studentForm.value.permissions[teacherId] = ["read"]
      }
    })
  }, 300),
  {deep: true}
)

// Watch for classData changes to populate form
watch(
  () => props.classData,
  (classData) => {
    if (classData) {
      // Handle schedule conversion from old format to new format
      let schedules: {day: string; startTime: string; endTime: string}[] = []

      if (classData.schedule) {
        if ("slots" in classData.schedule && Array.isArray(classData.schedule.slots)) {
          // New format: multiple schedules
          schedules = classData.schedule.slots
        } else if ("day" in classData.schedule) {
          // Old format: single schedule
          schedules = [
            {
              day: classData.schedule.day || "",
              startTime: classData.schedule.startTime || "",
              endTime: classData.schedule.endTime || "",
            },
          ]
        }
      }

      // Ensure at least one empty schedule slot
      if (schedules.length === 0) {
        schedules = [
          {
            day: "",
            startTime: "",
            endTime: "",
          },
        ]
      }

      studentForm.value = {
        name: classData.name || "",
        instrument: classData.instrument || "",
        level: classData.level || "",
        status: classData.status || "active",
        description: classData.description || "",
        capacity: classData.capacity || 8,
        teacherId: classData.teacherId || "",
        studentIds: Array.isArray(classData.studentIds) ? [...classData.studentIds] : [],
        sharedWith: Array.isArray(classData.sharedWith) ? [...classData.sharedWith] : [],
        permissions: {...(classData.permissions || {})},
        schedules,
      }
    } else {
      resetForm()
    }
  },
  {immediate: true}
)

const handleClose = () => {
  unlockBodyScroll()
  emit("close")
}

function lockBodyScroll() {
  document.body.style.overflow = "hidden"
}

function unlockBodyScroll() {
  document.body.style.overflow = ""
}
</script>

<style scoped>
/* Styling removed to fix build error. Will be re-applied with inline classes. */

/* Scrollbar styling for dark mode */
.dark ::-webkit-scrollbar {
  width: 8px;
}

.dark ::-webkit-scrollbar-track {
  background: #374151;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
.fixed {
  position: fixed;
}

.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.z-50 {
  z-index: 50;
}

.overflow-y-auto {
  overflow-y: auto;
}

/* Custom scrollbar styles */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background-color: #f3f4f6;
  border-radius: 0.375rem;
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background-color: #374151;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 0.375rem;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #6b7280;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

/* Ensure proper spacing for mobile navigation */
@media (max-width: 768px) {
  .fixed.inset-0 {
    padding-bottom: 5rem; /* Space for mobile navigation */
  }
}

/* Smooth transitions */
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
