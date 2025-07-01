<template>
  <div v-if="modelValue" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="absolute inset-0 bg-black/50" @click="close" />
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto z-10"
    >
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">Informe de Asistencias</h2>
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

        <!-- Filtros -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-3">Filtros</h3>

          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-1">Rango de fechas</label>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-sm text-gray-600 dark:text-gray-400">Desde</label>
                  <input v-model="filters.startDate" type="date" class="input w-full" />
                </div>
                <div>
                  <label class="text-sm text-gray-600 dark:text-gray-400">Hasta</label>
                  <input v-model="filters.endDate" type="date" class="input w-full" />
                </div>
              </div>
            </div>

            <div>
              <label class="block mb-1">Clase</label>
              <select v-model="filters.class" class="input w-full">
                <option value="">Todas las clases</option>
                <option v-for="class_ in classes" :key="class_.id" :value="class_.id">
                  {{ class_.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block mb-1">Estudiante</label>
              <select v-model="filters.student" class="input w-full">
                <option value="">Todos los estudiantes</option>
                <option v-for="student in filteredStudents" :key="student.id" :value="student.id">
                  {{ student.nombre }} {{ student.apellido }}
                </option>
              </select>
            </div>

            <div>
              <label class="block mb-1">Estado</label>
              <select v-model="filters.status" class="input w-full">
                <option value="">Todos los estados</option>
                <option value="Presente">Presente</option>
                <option value="Ausente">Ausente</option>
                <option value="Tardanza">Tardanza</option>
                <option value="Justificado">Justificado</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Resultados -->
        <div v-if="!isLoading && !error && filteredRecords.length > 0" class="space-y-6">
          <!-- Resumen de estadísticas -->
          <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h4 class="text-lg font-medium mb-2">Resumen</h4>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div class="bg-white dark:bg-gray-800 p-3 rounded shadow">
                <div class="text-sm text-gray-500">Total de registros</div>
                <div class="text-xl font-bold">{{ stats.total }}</div>
              </div>
              <div class="bg-green-50 dark:bg-green-900 p-3 rounded shadow">
                <div class="text-sm text-gray-500 dark:text-gray-300">Presentes</div>
                <div class="text-xl font-bold">
                  {{ stats.present }} ({{ stats.presentPercentage }}%)
                </div>
              </div>
              <div class="bg-red-50 dark:bg-red-900 p-3 rounded shadow">
                <div class="text-sm text-gray-500 dark:text-gray-300">Ausentes</div>
                <div class="text-xl font-bold">
                  {{ stats.absent }} ({{ stats.absentPercentage }}%)
                </div>
              </div>
              <div class="bg-yellow-50 dark:bg-yellow-900 p-3 rounded shadow">
                <div class="text-sm text-gray-500 dark:text-gray-300">Tardanzas</div>
                <div class="text-xl font-bold">{{ stats.late }} ({{ stats.latePercentage }}%)</div>
              </div>
            </div>

            <!-- Gráfico de asistencias -->
            <div class="h-64">
              <AttendancePieChart :data="chartData" />
            </div>
          </div>

          <!-- Tabla de registros -->
          <div>
            <h4 class="text-lg font-medium mb-2">Registros detallados</h4>

            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="bg-gray-100 dark:bg-gray-700 text-xs uppercase">
                  <tr>
                    <th class="px-4 py-2">Fecha</th>
                    <th class="px-4 py-2">Estudiante</th>
                    <th class="px-4 py-2">Clase</th>
                    <th class="px-4 py-2">Estado</th>
                    <th class="px-4 py-2">Justificación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(record, index) in displayedRecords"
                    :key="index"
                    class="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td class="px-4 py-2">{{ formatDate(record.Fecha) }}</td>
                    <td class="px-4 py-2">{{ getStudentName(record.studentId) }}</td>
                    <td class="px-4 py-2">{{ getClassName(record.classId) }}</td>
                    <td class="px-4 py-2">
                      <span
                        :class="{
                          'bg-green-100 text-green-800': record.status === 'Presente',
                          'bg-red-100 text-red-800': record.status === 'Ausente',
                          'bg-yellow-100 text-yellow-800': record.status === 'Tardanza',
                          'bg-blue-100 text-blue-800': record.status === 'Justificado',
                        }"
                        class="px-2 py-1 rounded text-xs"
                      >
                        {{ record.status }}
                      </span>
                    </td>
                    <td class="px-4 py-2">{{ record.justification || "-" }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Paginación -->
            <div class="mt-4 flex justify-between items-center">
              <div class="text-sm text-gray-500">
                Mostrando {{ (currentPage - 1) * pageSize + 1 }} a
                {{ Math.min(currentPage * pageSize, filteredRecords.length) }} de
                {{ filteredRecords.length }}
              </div>
              <div class="flex gap-2">
                <button
                  :disabled="currentPage === 1"
                  class="btn btn-sm"
                  :class="{'opacity-50': currentPage === 1}"
                  @click="currentPage--"
                >
                  Anterior
                </button>
                <button
                  :disabled="currentPage >= totalPages"
                  class="btn btn-sm"
                  :class="{'opacity-50': currentPage >= totalPages}"
                  @click="currentPage++"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="flex justify-center py-6">
          <div
            class="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"
          />
        </div>

        <div v-else-if="error" class="bg-red-100 text-red-700 p-4 rounded-md mb-4">
          {{ error }}
        </div>

        <div v-else-if="!filteredRecords.length" class="text-center py-6 text-gray-500">
          No se encontraron registros con los filtros seleccionados.
        </div>

        <!-- Botones de acciones -->
        <div class="mt-8 flex justify-end gap-3">
          <button class="btn" @click="close">Cerrar</button>
          <button
            :disabled="!filteredRecords.length"
            class="btn btn-primary"
            @click="handleGenerateReport"
          >
            Generar Reporte
          </button>
        </div>
      </div>
    </div>
  </div>

  <AttendanceExportModal
    v-if="showExportModal"
    v-model="showExportModal"
    :filters="filters"
    @close="showExportModal = false"
  />
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {useAttendanceStore} from "../../Attendance/store/attendance"
import {useStudentsStore} from "../../Students/store/students"
import {useClassesStore} from "../../Classes/store/classes"
import {useOptimizedAttendance} from "../composables/useOptimizedAttendance"
import {format, parseISO} from "date-fns"
import {es} from "date-fns/locale"
import AttendancePieChart from "./AttendancePieChart.vue"
import AttendanceExportModal from "./AttendanceExportModal.vue"

defineProps<{
  modelValue: boolean
  classes: any[]
}>()

// Emits
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
  (e: "close"): void
  (e: "generate-report", filters: any): void
}>()

const close = () => {
  emit("update:modelValue", false)
  emit("close")
}

// Stores
const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()

// Composable optimizado
const {
  loading: optimizedLoading,
  error: optimizedError,
  documents: attendanceDocuments,
  searchByDateRange,
  getFilteredRecords,
} = useOptimizedAttendance()

// Estado local combinado con composable
const isLoading = computed(() => optimizedLoading.value)
const error = computed(() => optimizedError.value || localError.value)
// Estado local adicional
const localError = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const showExportModal = ref(false)

const filters = ref({
  startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
  endDate: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd"),
  class: "",
  student: "",
  status: "",
})

// Datos
const classes = computed(() => classesStore.classes)

const students = computed(() => studentsStore.students)

const isStudentInClass = (studentId: string, classId: string) => {
  const classItem = classes.value.find((c) => c.id.toString() === classId)
  if (!classItem) return false
  return classItem.studentIds.includes(studentId)
}

const filteredStudents = computed(() => {
  if (!filters.value.class) return students.value

  return students.value.filter((student) => isStudentInClass(student.id, filters.value.class))
})

// Registros filtrados usando composable optimizado
const filteredRecords = computed(() => {
  return getFilteredRecords.value({
    classId: filters.value.class,
    studentId: filters.value.student,
    status: filters.value.status,
  })
})

// Función para cargar registros optimizada por rango de fechas
const loadFilteredRecords = async () => {
  try {
    await searchByDateRange(filters.value.startDate, filters.value.endDate)
    localError.value = null
  } catch (err: any) {
    localError.value = `Error al cargar datos: ${err.message || err}`
    console.error("Error loading filtered records:", err)
  }
}

const totalPages = computed(() => Math.ceil(filteredRecords.value.length / pageSize.value))

const displayedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRecords.value.slice(start, end)
})

const stats = computed(() => {
  const total = filteredRecords.value.length
  const present = filteredRecords.value.filter((r) => r.status === "Presente").length
  const absent = filteredRecords.value.filter((r) => r.status === "Ausente").length
  const late = filteredRecords.value.filter((r) => r.status === "Tardanza").length
  const justified = filteredRecords.value.filter((r) => r.status === "Justificado").length

  const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0
  const absentPercentage = total > 0 ? Math.round((absent / total) * 100) : 0
  const latePercentage = total > 0 ? Math.round((late / total) * 100) : 0
  const justifiedPercentage = total > 0 ? Math.round((justified / total) * 100) : 0

  return {
    total,
    present,
    absent,
    late,
    justified,
    presentPercentage,
    absentPercentage,
    latePercentage,
    justifiedPercentage,
  }
})

// Definir el tipo esperado para el gráfico
type ChartDataType = {
  labels: string[]
  datasets: {
    data: number[]
    backgroundColor: string[]
    borderWidth?: number
  }[]
}

// Datos para el gráfico circular
const chartData = computed<ChartDataType>(() => ({
  labels: ["Presentes", "Ausentes", "Tardanzas", "Justificados"],
  datasets: [
    {
      data: [stats.value.present, stats.value.absent, stats.value.late, stats.value.justified],
      backgroundColor: ["#10B981", "#EF4444", "#F59E0B", "#3B82F6"],
    },
  ],
}))

// Formatear fecha
const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), "PPP", {locale: es})
  } catch (error) {
    return dateString
  }
}

// Obtener nombre del estudiante
const getStudentName = (studentId: string): string => {
  const student = studentsStore.students.find((s) => s.id === studentId)
  if (!student) return "Estudiante desconocido"
  return `${student.nombre} ${student.apellido}`
}

// Obtener nombre de la clase
const getClassName = (classId: string): string => {
  const classItem = classesStore.classes.find((c) => c.id.toString() === classId)
  if (!classItem) return "Clase desconocida"
  return classItem.name
}

// Watcher para cargar datos cuando cambien los filtros de fechas
watch(
  [() => filters.value.startDate, () => filters.value.endDate],
  async ([newStartDate, newEndDate]) => {
    if (newStartDate && newEndDate) {
      try {
        await searchByDateRange(newStartDate, newEndDate)
        localError.value = null
      } catch (err: any) {
        localError.value = `Error al cargar datos: ${err.message || err}`
      }
    }
    currentPage.value = 1
  },
  {immediate: false}
)

// Aplicar filtros y resetear página
watch([() => filters.value.class, () => filters.value.student, () => filters.value.status], () => {
  currentPage.value = 1
})

// Handle generate report
const handleGenerateReport = () => {
  emit("generate-report", filters.value)
}

// Cargar datos al montar el componente
onMounted(async () => {
  try {
    // Asegurarse de que todos los datos estén cargados
    await Promise.all([classesStore.fetchClasses(), studentsStore.fetchStudents()])

    // Cargar registros filtrados usando consulta optimizada
    await searchByDateRange(filters.value.startDate, filters.value.endDate)
  } catch (err: any) {
    localError.value = `Error al cargar datos iniciales: ${err.message || err}`
    console.error("Error al cargar datos:", err)
  }
})

// Make sure the component is exported as default
defineExpose({})
if (import.meta.env?.PROD === false) {
  // @ts-ignore - This ensures the component has a default export
  // which helps with certain bundlers and IDE tooling
  const _default = {}
}
</script>
