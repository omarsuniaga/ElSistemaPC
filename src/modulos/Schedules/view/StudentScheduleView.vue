<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {useRoute, useRouter} from "vue-router"
import {useClassesStore} from "../../Classes/store/classes"
import {useTeachersStore} from "../../Teachers/store/teachers"
import {useStudentsStore} from "../../Students/store/students"
import ScheduleNavigation from "../components/ScheduleNavigation.vue"

// Router
const route = useRoute()
const router = useRouter()

// Stores
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()

// Estado para el estudiante seleccionado
const selectedStudent = ref("")
// Estado para el estudiante actual (objeto completo)
const student = ref<any | null>(null)
const studentClasses = ref<any[]>([])
const error = ref<string | null>(null)
const isLoading = ref(true) // Iniciar con loading true hasta que se carguen los datos

// Si el ID del estudiante se proporciona en la ruta, úsalo
onMounted(async () => {
  console.log("Componente StudentScheduleView montado")
  await fetchInitialData()

  if (route.params.id) {
    selectedStudent.value = route.params.id as string
    console.log("ID de estudiante desde la ruta:", selectedStudent.value)
    await loadData()
  } else {
    isLoading.value = false
  }
})

// Cargar datos iniciales necesarios
const fetchInitialData = async () => {
  try {
    isLoading.value = true
    console.log("Cargando datos iniciales...")

    // Forzar la recarga de datos desde Firestore
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
      teachersStore.fetchTeachers(),
    ])

    console.log(
      `Datos cargados: ${studentsStore.students.length} estudiantes, ${classesStore.classes.length} clases, ${teachersStore.teachers.length} profesores`
    )
    return true
  } catch (err) {
    console.error("Error cargando datos iniciales:", err)
    error.value = "Error cargando datos iniciales. Por favor recargue la página."
    return false
  } finally {
    isLoading.value = false
  }
}

// Función para volver a intentar cargar datos
const retryLoading = async () => {
  error.value = null
  await fetchInitialData()
  if (selectedStudent.value) {
    await loadData()
  }
}

// Cargar datos del estudiante
const loadData = async () => {
  try {
    isLoading.value = true
    error.value = null

    if (!selectedStudent.value) {
      isLoading.value = false
      return // No student selected, exit early
    }

    console.log("Buscando estudiante con ID:", selectedStudent.value)

    // Asegurarse de que los datos estén cargados antes de buscar el estudiante
    if (studentsStore.students.length === 0) {
      await fetchInitialData()
    }

    // Verificar si el estudiante existe en el store
    const foundStudent = studentsStore.students.find((s) => s.id === selectedStudent.value)

    if (!foundStudent) {
      console.error(`Estudiante con ID ${selectedStudent.value} no encontrado en el sistema`)
      error.value = `Estudiante no encontrado. Por favor seleccione un estudiante válido.`
      isLoading.value = false
      return
    }

    // Guardar el estudiante encontrado
    student.value = foundStudent
    console.log("Estudiante encontrado:", student.value)

    // Obtener clases para el estudiante seleccionado - usar el getter classes
    const classes = classesStore.classes.filter(
      (class_) =>
        class_.studentIds &&
        Array.isArray(class_.studentIds) &&
        class_.studentIds.includes(selectedStudent.value)
    )

    console.log(`Encontradas ${classes.length} clases para el estudiante`)

    // Verificar si el estudiante tiene clases asignadas
    if (classes.length === 0) {
      console.log("El estudiante no tiene clases asignadas")
    }

    // Enriquecer los datos de las clases con información del profesor
    studentClasses.value = await Promise.all(
      classes.map(async (class_) => {
        // Buscar el profesor de la clase
        const teacher = teachersStore.teachers.find((t) => t.id === class_.teacherId)

        return {
          ...class_,
          teacherName: teacher ? teacher.name : "Sin asignar",
          teacherData: teacher || null,
        }
      })
    )

    console.log("Clases procesadas con información de profesores:", studentClasses.value)
  } catch (err) {
    console.error("Error cargando datos:", err)
    error.value = `Error cargando datos: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

// Observar cambios en el estudiante seleccionado
watch(selectedStudent, () => {
  if (selectedStudent.value) {
    loadData()
  } else {
    studentClasses.value = []
    student.value = null
  }
})

// Obtener nombre del estudiante
const studentName = computed(() => {
  if (student.value) {
    return `${student.value.name || student.value.nombre || ""} ${student.value.lastName || student.value.apellido || ""}`
  }

  const foundStudent = studentsStore.students.find((s) => s.id === selectedStudent.value)
  return foundStudent ? `${foundStudent.nombre || ""} ${foundStudent.apellido || ""}` : "Estudiante"
})

// Manejar selección de estudiante
const handleStudentChange = (newStudentId) => {
  selectedStudent.value = newStudentId
  if (newStudentId) {
    router.push(`/student-schedule/${newStudentId}`)
  } else {
    router.push("/student-schedule")
  }
}

// Verificar si un estudiante tiene clases asignadas
const hasClasses = computed(() => {
  return studentClasses.value && studentClasses.value.length > 0
})
</script>

<template>
  <div class="student-schedule-view max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold mb-6">Horario del Estudiante</h1>

    <ScheduleNavigation class="mb-6" />

    <!-- Selector de estudiante -->
    <div class="mb-6">
      <label
        for="student-select"
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Seleccionar Estudiante
      </label>
      <select
        id="student-select"
        v-model="selectedStudent"
        class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        @change="handleStudentChange($event.target.value)"
      >
        <option value="">Seleccione un estudiante</option>
        <option v-for="s in studentsStore.students" :key="s.id" :value="s.id">
          {{ s.name || s.nombre || "" }} {{ s.lastName || s.apellido || "" }}
        </option>
      </select>
    </div>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      <span class="ml-3">Cargando horario...</span>
    </div>

    <!-- Estado de error con botón para reintentar -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4"
    >
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      <button
        class="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        @click="retryLoading"
      >
        <i class="fas fa-sync-alt mr-2" />
        Reintentar carga de datos
      </button>
    </div>

    <!-- Ningún estudiante seleccionado -->
    <div v-else-if="!selectedStudent" class="text-center py-8 text-gray-500 dark:text-gray-400">
      Seleccione un estudiante para ver su horario
    </div>

    <!-- No se encontraron clases -->
    <div v-else-if="!hasClasses" class="text-center py-8">
      <div
        class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-4 inline-block"
      >
        <p class="text-yellow-700 dark:text-yellow-400">
          <i class="fas fa-exclamation-triangle mr-2" />
          No se encontraron clases asignadas para este estudiante
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Este estudiante aún no ha sido asignado a ninguna clase.
        </p>
      </div>
    </div>

    <!-- Visualización de clases -->
    <div v-else class="space-y-8">
      <h2 class="text-xl font-semibold mb-4">Horario de {{ studentName }}</h2>

      <!-- Cards de clases en vez de tabla para mejor visualización -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="class_ in studentClasses"
          :key="class_.id"
          class="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden"
        >
          <div class="bg-indigo-600 dark:bg-indigo-800 text-white px-4 py-3">
            <h3 class="font-semibold truncate">{{ class_.name }}</h3>
          </div>

          <div class="p-4 space-y-3">
            <div class="flex items-start">
              <i class="fas fa-clock mt-1 text-gray-500 dark:text-gray-400 w-5" />
              <div class="ml-2">
                <p class="text-sm font-medium text-gray-900 dark:text-white">Horario</p>
                <div
                  v-if="class_.schedule?.slots && class_.schedule.slots.length > 0"
                  class="space-y-1"
                >
                  <div
                    v-for="(slot, index) in class_.schedule.slots"
                    :key="index"
                    class="text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span class="font-medium">{{ slot.day }}:</span> {{ slot.startTime }} -
                    {{ slot.endTime }}
                  </div>
                </div>
                <p v-else class="text-sm text-gray-600 dark:text-gray-400">No definido</p>
              </div>
            </div>

            <div class="flex items-start">
              <i class="fas fa-user mt-1 text-gray-500 dark:text-gray-400 w-5" />
              <div class="ml-2">
                <p class="text-sm font-medium text-gray-900 dark:text-white">Profesor</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ class_.teacherName }}</p>
              </div>
            </div>

            <div class="flex items-start">
              <i class="fas fa-graduation-cap mt-1 text-gray-500 dark:text-gray-400 w-5" />
              <div class="ml-2">
                <p class="text-sm font-medium text-gray-900 dark:text-white">Nivel</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ class_.level || "No definido" }}
                </p>
              </div>
            </div>

            <div class="flex items-start">
              <i class="fas fa-building mt-1 text-gray-500 dark:text-gray-400 w-5" />
              <div class="ml-2">
                <p class="text-sm font-medium text-gray-900 dark:text-white">Aula</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ class_.classroom || "No asignada" }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Si no hay resultados -->
      <div
        v-if="studentClasses.length === 0"
        class="text-center py-8 text-gray-500 dark:text-gray-400"
      >
        No se encontraron clases asignadas para este estudiante
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos adicionales para mejorar la impresión */
@media print {
  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  #schedule-pdf {
    margin: 0;
    padding: 15mm;
    box-shadow: none;
  }
}

/* Animaciones suaves */
.btn {
  transition: all 0.3s ease;
}

/* Efectos de hover para las clases */
#schedule-pdf [class*="bg-"] {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

#schedule-pdf [class*="bg-"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
