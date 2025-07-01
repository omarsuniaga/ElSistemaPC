<!-- src/components/teachers/TeacherClassesNew.vue -->
<template>
  <div class="teacher-classes">
    <!-- Filtros -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Filtros</h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Búsqueda -->
        <div class="relative">
          <label class="block text-sm font-medium text-gray-700 mb-2">Buscar clases</label>
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por nombre o instrumento..."
              class="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <!-- Filtro por instrumento -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Instrumento</label>
          <select
            v-model="filterInstrument"
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Todos los instrumentos</option>
            <option v-for="instrument in instruments" :key="instrument" :value="instrument">
              {{ instrument }}
            </option>
          </select>
        </div>

        <!-- Filtro por nivel -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
          <select
            v-model="filterLevel"
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Todos los niveles</option>
            <option v-for="level in levels" :key="level" :value="level">
              {{ level }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="flex items-center">
          <AcademicCapIcon class="h-8 w-8 text-blue-600" />
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Clases</p>
            <p class="text-2xl font-bold text-gray-900">{{ classesStats.total }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="flex items-center">
          <UserGroupIcon class="h-8 w-8 text-green-600" />
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Estudiantes</p>
            <p class="text-2xl font-bold text-gray-900">{{ classesStats.students }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="flex items-center">
          <UserIcon class="h-8 w-8 text-purple-600" />
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Individuales</p>
            <p class="text-2xl font-bold text-gray-900">{{ classesStats.individual }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="flex items-center">
          <UsersIcon class="h-8 w-8 text-orange-600" />
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Grupales</p>
            <p class="text-2xl font-bold text-gray-900">{{ classesStats.group }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de clases -->
    <div class="space-y-6">
      <div v-if="paginatedClasses.length === 0" class="text-center py-12">
        <AcademicCapIcon class="h-12 w-12 mx-auto text-gray-400" />
        <h3 class="mt-2 text-lg font-medium text-gray-900">
          {{ hasFilters ? "No se encontraron clases" : "No tienes clases asignadas" }}
        </h3>
        <p class="mt-1 text-gray-500">
          {{
            hasFilters
              ? "Intenta ajustar los filtros."
              : "Contacta al administrador para asignar clases."
          }}
        </p>
      </div>

      <div
        v-for="classItem in paginatedClasses"
        :key="classItem.id"
        class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-grow">
              <div class="flex items-center mb-2">
                <h3 class="text-lg font-semibold mr-3">{{ classItem.nombre }}</h3>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getClassTypeClass(classItem.tipo || 'individual')"
                >
                  {{ getClassTypeLabel(classItem.tipo || "individual") }}
                </span>
              </div>

              <p class="text-gray-600 dark:text-gray-400 mb-2">
                {{ classItem.contenido || "Sin descripción" }}
              </p>

              <div class="flex items-center space-x-4 text-sm text-gray-500">
                <span class="flex items-center">
                  <ClockIcon class="h-4 w-4 mr-1" />
                  {{ formatScheduleCount(classItem) }}
                </span>
                <span class="flex items-center">
                  <UserGroupIcon class="h-4 w-4 mr-1" />
                  <span class="text-sm">{{ classItem.alumnos?.length || 0 }} estudiantes</span>
                </span>
              </div>
            </div>

            <div class="flex items-center space-x-2 ml-4">
              <button
                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                @click="showStudentList(classItem)"
              >
                <UsersIcon class="h-4 w-4 mr-1" />
                Estudiantes
              </button>

              <button
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                @click="takeAttendance(classItem)"
              >
                <ClipboardDocumentCheckIcon class="h-4 w-4 mr-1" />
                Asistencia
              </button>
            </div>
          </div>
        </div>

        <!-- Horarios -->
        <div
          v-if="classItem.horario"
          class="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t dark:border-gray-700"
        >
          <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <CalendarIcon class="h-4 w-4 mr-2" />
            <span>
              {{ classItem.horario.dia }}, {{ classItem.horario.horaInicio }} -
              {{ classItem.horario.horaFin }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="filteredClasses.length > 0" class="flex justify-between items-center mt-6">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Mostrando {{ paginatedClasses.length }} de {{ filteredClasses.length }} clases
      </div>

      <div class="flex space-x-1">
        <button
          v-for="page in totalPages"
          :key="page"
          :class="[
            'px-3 py-2 text-sm font-medium rounded-md',
            currentPage === page
              ? 'bg-indigo-600 text-white'
              : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300',
          ]"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
      </div>
    </div>

    <!-- Modal de estudiantes -->
    <div
      v-if="selectedClassStudents"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="selectedClassStudents = null"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white"
        @click.stop
      >
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            Estudiantes de {{ selectedClassStudents.nombre }}
          </h3>
        </div>

        <div class="p-6">
          <div v-if="classStudents.length > 0" class="space-y-3">
            <div
              v-for="student in classStudents"
              :key="student.id"
              class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span class="text-sm font-medium text-gray-700">
                      {{ student.nombre?.charAt(0) }}{{ student.apellido?.charAt(0) }}
                    </span>
                  </div>
                </div>

                <div class="flex-grow ml-4">
                  <h4 class="font-medium">{{ student.nombre }} {{ student.apellido }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ student.instrumento || "Sin instrumento" }} ·
                    {{ student.edad || "Sin edad" }} años
                  </p>
                </div>

                <div>
                  <button
                    class="inline-flex items-center px-3 py-1 border border-blue-300 rounded text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
                    @click="showStudentDetails(student.id)"
                  >
                    Ver Perfil
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-12">
            <UserIcon class="h-12 w-12 mx-auto text-gray-400" />
            <h3 class="mt-2 text-lg font-medium text-gray-500">No hay estudiantes asignados</h3>
            <p class="mt-1 text-gray-500">Esta clase aún no tiene estudiantes asignados.</p>
          </div>
        </div>

        <div class="px-6 py-4 border-t dark:border-gray-700 flex justify-end">
          <button
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            @click="selectedClassStudents = null"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {useRouter} from "vue-router"
import {useClassesStore} from "../../stores/classes"
import {useStudentsStore} from "../../modulos/Students/store/students"
import type {Student} from "../../modulos/Students/types/student"
import {
  MagnifyingGlassIcon,
  AcademicCapIcon,
  UserGroupIcon,
  UserIcon,
  UsersIcon,
  ClockIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/vue/24/outline"

// Interfaces
interface TeacherClass {
  id: string
  nombre: string
  contenido?: string
  instrumento?: string
  nivel?: string
  tipo?: "individual" | "group"
  teacherId: string
  alumnos?: string[]
  horario?: {
    dia: string
    horaInicio: string
    horaFin: string
  }
}

// Router
const router = useRouter()

// Stores
const classesStore = useClassesStore()
const studentsStore = useStudentsStore()

// Estado
const searchQuery = ref("")
const filterInstrument = ref("")
const filterLevel = ref("")
const currentPage = ref(1)
const pageSize = 5
const selectedClassStudents = ref<TeacherClass | null>(null)
const classStudents = ref<Student[]>([])
const teacherClasses = ref<TeacherClass[]>([])

// ID del profesor (simulado)
const teacherId = "1" // En un caso real, se obtendría del usuario autenticado

// Opciones de filtro
const instruments = ["Piano", "Violín", "Guitarra", "Flauta", "Violonchelo", "Percusión"]
const levels = ["Principiante", "Intermedio", "Avanzado"]

// Estadísticas de clases
const classesStats = computed(() => {
  const total = teacherClasses.value.length
  const students = 0
  let individual = 0
  let group = 0

  const uniqueStudents = new Set()

  teacherClasses.value.forEach((cls) => {
    if (cls.alumnos) {
      cls.alumnos.forEach((id) => uniqueStudents.add(id))
    }

    if (cls.tipo === "individual") {
      individual++
    } else {
      group++
    }
  })

  return {
    total,
    students: uniqueStudents.size,
    individual,
    group,
  }
})

// Clases filtradas
const filteredClasses = computed(() => {
  let result = teacherClasses.value

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (cls) =>
        (cls.nombre && cls.nombre.toLowerCase().includes(query)) ||
        (cls.instrumento && cls.instrumento.toLowerCase().includes(query))
    )
  }

  // Filtrar por instrumento
  if (filterInstrument.value) {
    result = result.filter((cls) => cls.instrumento === filterInstrument.value)
  }

  // Filtrar por nivel
  if (filterLevel.value) {
    result = result.filter((cls) => cls.nivel === filterLevel.value)
  }

  return result
})

// Clases paginadas
const paginatedClasses = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredClasses.value.slice(start, end)
})

// Total de páginas
const totalPages = computed(() => Math.ceil(filteredClasses.value.length / pageSize))

// Verificar si hay filtros activos
const hasFilters = computed(() => searchQuery.value || filterInstrument.value || filterLevel.value)

// Formatear el número de horarios
const formatScheduleCount = (classItem: TeacherClass) => {
  return classItem.horario ? "1 sesión semanal" : "Sin horario"
}

// Obtener etiqueta del tipo de clase
const getClassTypeLabel = (type: string) => {
  switch (type) {
    case "individual":
      return "Individual"
    case "group":
      return "Grupal"
    case "ensemble":
      return "Conjunto"
    case "workshop":
      return "Taller"
    default:
      return "Regular"
  }
}

// Obtener clase CSS para el tipo de clase
const getClassTypeClass = (type: string) => {
  switch (type) {
    case "individual":
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
    case "group":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
    case "ensemble":
      return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
    case "workshop":
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
    default:
      return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200"
  }
}

// Mostrar lista de estudiantes
const showStudentList = async (classItem: TeacherClass) => {
  selectedClassStudents.value = classItem

  try {
    if (studentsStore.students.length === 0) {
      await studentsStore.fetchStudents()
    }

    // Filtrar estudiantes de esta clase
    classStudents.value = studentsStore.students.filter((student) =>
      classItem.alumnos?.includes(student.id)
    )
  } catch (error) {
    console.error("Error al cargar estudiantes de la clase:", error)
  }
}

// Mostrar detalles del estudiante
const showStudentDetails = (studentId: string) => {
  router.push(`/students/${studentId}`)
}

// Tomar asistencia
const takeAttendance = (classItem: TeacherClass) => {
  router.push(`/teacher/classes/${classItem.id}/attendance`)
}

// Resetear la página actual cuando cambian los filtros
watch([searchQuery, filterInstrument, filterLevel], () => {
  currentPage.value = 1
})

// Cargar datos al montar el componente
onMounted(async () => {
  try {
    // Cargar clases
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses()
    }

    // Filtrar clases para este profesor (como maestro principal)
    teacherClasses.value = classesStore.classes.filter((c) => c.teacherId === teacherId)
  } catch (error) {
    console.error("Error al cargar clases del profesor:", error)
  }
})
</script>

<style scoped>
.teacher-classes {
  @apply space-y-6;
}
</style>
