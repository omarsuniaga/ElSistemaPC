<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
      <!-- Header con título y botón de cierre -->
      <div class="flex justify-between items-center border-b p-4">
        <h2 class="text-xl font-semibold">{{ title }}</h2>
        <button class="text-gray-500 hover:text-gray-700" @click="close">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
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

      <!-- Contenido del modal -->
      <div class="p-4 overflow-y-auto flex-grow">
        <!-- Estado de carga -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-8">
          <svg
            class="animate-spin h-10 w-10 mb-4 text-blue-500"
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
          <p class="text-gray-500">Cargando estudiantes...</p>
        </div>

        <!-- Estado de error -->
        <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{{ error }}</p>
          <button class="mt-2 px-3 py-1 bg-red-200 hover:bg-red-300 rounded" @click="loadStudents">
            Reintentar
          </button>
        </div>

        <!-- Lista de estudiantes -->
        <div v-else>
          <div v-if="filteredStudents.length === 0" class="text-center py-8 text-gray-500">
            No hay estudiantes registrados para esta clase
          </div>

          <div v-else>
            <!-- Filtro de búsqueda -->
            <div class="mb-4">
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Buscar estudiante..."
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- Lista de estudiantes -->
            <ul class="divide-y divide-gray-200">
              <li
                v-for="student in filteredStudents"
                :key="student.id"
                class="py-2 flex items-center"
              >
                <div class="flex-1">
                  <p class="font-medium">{{ student.nombre }} {{ student.apellido }}</p>
                  <p class="text-sm text-gray-500">
                    {{ student.instrumento || "Sin instrumento asignado" }}
                  </p>
                </div>
                <div>
                  <span
                    :class="{
                      'px-2 py-1 text-xs rounded-full font-medium': true,
                      'bg-green-100 text-green-800': student.status === 'Presente',
                      'bg-red-100 text-red-800': student.status === 'Ausente',
                      'bg-yellow-100 text-yellow-800': student.status === 'Tardanza',
                      'bg-blue-100 text-blue-800': student.status === 'Justificado',
                    }"
                  >
                    {{ student.status || "No registrado" }}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Footer con botones de acción -->
      <div class="border-t p-4 flex justify-end">
        <button class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg" @click="close">
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch, onMounted} from "vue"
import {collection, query, where, getDocs} from "firebase/firestore"
import {db} from "../firebase"
import {useStudentsStore} from "../modulos/Students/store/students"
import {useAttendanceStore} from "../modulos/Attendance/store/attendance"

// Props
const props = defineProps<{
  isVisible: boolean
  classId: string
  date: string
  title?: string
}>()

// Emits
const emit = defineEmits(["close"])

// Estado reactivo
const isLoading = ref(false)
const error = ref<string | null>(null)
const students = ref<any[]>([])
const searchTerm = ref("")
const studentsStore = useStudentsStore()
const attendanceStore = useAttendanceStore()

// Computados
const filteredStudents = computed(() => {
  if (!searchTerm.value) return students.value

  const term = searchTerm.value.toLowerCase()
  return students.value.filter(
    (student) =>
      student.nombre.toLowerCase().includes(term) ||
      student.apellido.toLowerCase().includes(term) ||
      (student.instrumento && student.instrumento.toLowerCase().includes(term))
  )
})

// Métodos
const close = () => {
  emit("close")
}

const loadStudents = async () => {
  if (!props.classId || !props.date) return

  isLoading.value = true
  error.value = null

  try {
    // Cargar estudiantes si no están en el store
    if (studentsStore.students.length === 0) {
      await studentsStore.fetchStudents()
    }

    // Cargar asistencia para la fecha y clase específica
    const attendanceDoc = await attendanceStore.fetchAttendanceDocument(props.date, props.classId)

    // Buscar estudiantes asignados a esta clase
    const classesCollection = collection(db, "CLASES")
    const classQuery = query(classesCollection, where("id", "==", props.classId))
    const classSnapshot = await getDocs(classQuery)

    if (classSnapshot.empty) {
      throw new Error("No se encontró la clase especificada")
    }

    const classData = classSnapshot.docs[0].data()
    const studentIds = classData.studentIds || []

    // Obtener datos de estudiantes y asignar estado de asistencia
    const studentsList = studentIds.map((studentId) => {
      const studentData = studentsStore.students.find((s) => s.id === studentId) || {
        nombre: "Estudiante",
        apellido: "Desconocido",
      }

      // Determinar estado de asistencia
      let status = "No registrado"
      if (attendanceDoc) {
        if (attendanceDoc.data.presentes.includes(studentId)) {
          status = "Presente"
        } else if (attendanceDoc.data.ausentes.includes(studentId)) {
          status = "Ausente"
        } else if (attendanceDoc.data.tarde.includes(studentId)) {
          // Verificar si es justificado
          const justificado = attendanceDoc.data.justificacion?.some((j) => j.id === studentId)
          status = justificado ? "Justificado" : "Tardanza"
        }
      }

      return {
        ...studentData,
        status,
      }
    })

    students.value = studentsList
  } catch (err) {
    console.error("Error al cargar estudiantes:", err)
    error.value = `Error al cargar estudiantes: ${err instanceof Error ? err.message : "Error desconocido"}`
  } finally {
    isLoading.value = false
  }
}

// Observadores
watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      loadStudents()
    }
  }
)

// Ciclo de vida
onMounted(() => {
  if (props.isVisible) {
    loadStudents()
  }
})
</script>
