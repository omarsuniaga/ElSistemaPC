<template>
  <div
    class="p-4 mb-16 space-y-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow"
  >
    <h2 class="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400">
      Informe de Asistencia
    </h2>

    <!-- Admin/Director indicator when viewing other teacher's data -->
    <div
      v-if="isViewingOtherTeacher"
      class="bg-blue-50 border-l-4 border-blue-500 p-4 dark:bg-blue-900/20 dark:border-blue-600 mb-4"
    >
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <InformationCircleIcon class="h-5 w-5 text-blue-500" aria-hidden="true" />
        </div>
        <div class="ml-3">
          <p class="text-sm text-blue-700 dark:text-blue-300">
            Estas viendo el informe de asistencia de <strong>{{ teacherName }}</strong>
          </p>
        </div>
      </div>
    </div>

    <!-- Controles de fecha -->
    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <h3 class="text-lg font-semibold mb-3">Rango de Fechas</h3>
      <div class="flex flex-wrap gap-4 items-center">
        <div>
          <label class="block text-sm font-medium mb-1">Desde:</label>
          <input
            v-model="from"
            type="date"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Hasta:</label>
          <input
            v-model="to"
            type="date"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          />
        </div>
        <div class="flex gap-2">
          <button
            class="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
            @click="setRange('week')"
          >
            Esta Semana
          </button>
          <button
            class="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
            @click="setRange('month')"
          >
            Este Mes
          </button>
          <button
            class="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
            @click="setRange('quarter')"
          >
            Este Trimestre
          </button>
        </div>
        <button
          class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium"
          @click="fetchReport"
        >
          Generar Informe
        </button>
      </div>
    </div>

    <!-- Indicador de carga -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <svg
        class="animate-spin h-10 w-10 text-primary-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span class="ml-3">Generando informe...</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
    >
      {{ error }}
    </div>

    <!-- Contenido del informe -->
    <div v-else-if="classReports.length > 0">
      <!-- Estadisticas generales -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CheckCircleIcon class="h-8 w-8 text-green-500" />
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800 dark:text-green-200">Presentes</p>
              <p class="text-2xl font-bold text-green-900 dark:text-green-100">
                {{ totalPresentes }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <XCircleIcon class="h-8 w-8 text-red-500" />
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800 dark:text-red-200">Ausentes</p>
              <p class="text-2xl font-bold text-red-900 dark:text-red-100">{{ totalAusentes }}</p>
            </div>
          </div>
        </div>

        <div
          class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <ClockIcon class="h-8 w-8 text-yellow-500" />
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Tardes</p>
              <p class="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {{ totalTardes }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <DocumentTextIcon class="h-8 w-8 text-blue-500" />
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-blue-800 dark:text-blue-200">Justificados</p>
              <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {{ totalJustificados }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Porcentaje promedio de asistencia -->
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">Promedio de Asistencia</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ averageAttendancePercentage }}% en el rango seleccionado
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600 dark:text-gray-400">Mejor dia</p>
            <p class="font-semibold">{{ bestAttendanceDay }}</p>
          </div>
        </div>
      </div>

      <!-- Lista de clases -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Clases del Maestro</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="classData in classReports"
            :key="classData.classId"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            @click="selectClass(classData)"
          >
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold text-gray-800 dark:text-gray-200">
                {{ classData.className }}
              </h4>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ classData.students.length }} estudiantes
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Asistencia: {{ calculateAttendancePercentage(classData) }}%
              </span>
              <ChevronRightIcon class="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <!-- Vista de clase seleccionada -->
      <div v-if="selectedClassData" class="mt-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">{{ selectedClassData.className }} - Estudiantes</h3>
          <button
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            @click="selectedClassData = null"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Lista de estudiantes -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="student in selectedClassData.students"
            :key="student.id"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            @click="selectStudent(student)"
          >
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-medium text-gray-800 dark:text-gray-200">{{ student.name }}</h4>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{
                  calculateStudentAttendancePercentage(student, selectedClassData.relevantDates)
                }}%
              </span>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex flex-col w-full">
                <div
                  v-for="date in selectedClassData.relevantDates"
                  :key="date"
                  class="flex items-center gap-2 mb-1"
                >
                  <span class="text-xs text-gray-500 dark:text-gray-400 min-w-[90px]">{{
                    formatDate(date)
                  }}</span>
                  <template v-if="getJustificationTextObj(student.id, date)?.reason">
                    <span class="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      Justificado "{{ getJustificationTextObj(student.id, date)?.reason }}"
                    </span>
                  </template>
                  <template v-else>
                    <span
                      :class="getStatusClass(student.attendance[date])"
                      class="text-xs font-semibold"
                    >
                      {{
                        getStatusSymbol(student.attendance[date]) === "✓"
                          ? "Presente"
                          : getStatusSymbol(student.attendance[date]) === "✗"
                            ? "Ausente"
                            : getStatusSymbol(student.attendance[date])
                      }}
                    </span>
                  </template>
                </div>
              </div>
              <span class="text-sm text-gray-600 dark:text-gray-400"> Ver detalle </span>
              <ChevronRightIcon class="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <!-- Vista de estudiante seleccionado -->
      <div v-if="selectedStudent" class="mt-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">{{ selectedStudent.name }} - Detalle de Asistencias</h3>
          <button
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            @click="selectedStudent = null"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Tabla de asistencias -->
        <div
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Fecha
                  </th>
                  <th
                    class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Justificacion
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600"
              >
                <tr
                  v-for="date in selectedClassData?.relevantDates || []"
                  :key="date"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {{ formatDate(date) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-center">
                    <span
                      :class="getStatusClass(selectedStudent.attendance[date])"
                      class="inline-block px-2 py-1 rounded text-xs font-medium"
                    >
                      {{ getStatusSymbol(selectedStudent.attendance[date]) }}
                    </span>
                  </td>
                  <td
                    class="px-4 py-3 text-sm"
                    :class="{
                      'text-blue-700 dark:text-blue-300':
                        getJustificationText(selectedStudent.id, date) &&
                        getJustificationText(selectedStudent.id, date) !== 'Sin justificacion',
                    }"
                  >
                    {{ getJustificationText(selectedStudent.id, date) }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {{ getObservationText(selectedClassData?.classId, date) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensaje cuando no hay clases -->
    <div v-else-if="!loading" class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <UserGroupIcon class="h-16 w-16 mx-auto text-gray-400 mb-4" />
      <p class="text-lg text-gray-500 dark:text-gray-400 mb-2">
        No hay datos para mostrar en el rango seleccionado
      </p>
      <p class="text-sm text-gray-400 dark:text-gray-500">
        Intente seleccionar otro rango de fechas o verifique si hay asistencias registradas.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {
  InformationCircleIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from "@heroicons/vue/24/outline"
import {useAuthStore} from "../../../stores/auth"
import {useRoute} from "vue-router"
import {useAttendanceStore} from "../../../modulos/Attendance/store/attendance"
import {useClassesStore} from "../../../modulos/Classes/store/classes"
import {useStudentsStore} from "../../../modulos/Students/store/students"
import {useTeachersStore} from "../../../modulos/Teachers/store/teachers"
import {useObservationsStore} from "../../../stores/observations"

// Props
const props = defineProps({
  teacherId: {
    type: String,
    default: "",
  },
})

// Stores
const authStore = useAuthStore()
const route = useRoute()
const attendanceStore = useAttendanceStore()
const classesStore = useClassesStore()
const studentsStore = useStudentsStore()
const teachersStore = useTeachersStore()
const observationsStore = useObservationsStore()

// Estado reactivo
const loading = ref(false)
const error = ref<string | null>(null)
const from = ref("")
const to = ref("")

// Datos del informe
const classReports = ref<
  Array<{
    classId: string
    className: string
    students: Array<{
      id: string
      name: string
      attendance: Record<string, string>
    }>
    relevantDates: string[]
  }>
>([])

// Estado de seleccion
const selectedClassData = ref<any>(null)
const selectedStudent = ref<any>(null)

// Get teacher ID based on user role
const currentTeacherId = computed(() => {
  const userRole = authStore.user?.role

  // For Director or Admin roles, prioritize the query parameter
  if (userRole === "Director" || userRole === "Admin") {
    if (route.query.teacherId) {
      return route.query.teacherId as string
    }
  }

  // For teachers or as fallback, use the user's own ID
  return props.teacherId || authStore.user?.uid
})

// Flag to show admin indicator
const isViewingOtherTeacher = computed(() => {
  return (
    (authStore.user?.role === "Director" || authStore.user?.role === "Admin") &&
    route.query.teacherId &&
    route.query.teacherId !== authStore.user?.uid
  )
})

// Get teacher name from the store
const teacherName = computed(() => {
  if (!currentTeacherId.value) return authStore.user?.email || "Profesor"

  const teacher = teachersStore.teachers.find((t) => t.id === currentTeacherId.value)
  return teacher ? teacher.name : authStore.user?.email || "Profesor"
})

// Contadores para estadisticas
const totalPresentes = computed(() => {
  let total = 0
  classReports.value.forEach((classData) => {
    classData.students.forEach((student) => {
      Object.entries(student.attendance).forEach(([date, status]) => {
        // Si hay justificación, no contar como presente
        const justification = getJustificationText(student.id, date)
        if (status === "P" && (!justification || justification === "Sin justificacion")) total++
      })
    })
  })
  return total
})

const totalAusentes = computed(() => {
  let total = 0
  classReports.value.forEach((classData) => {
    classData.students.forEach((student) => {
      Object.entries(student.attendance).forEach(([date, status]) => {
        // Si hay justificación, no contar como ausente
        const justification = getJustificationText(student.id, date)
        if (status === "A" && (!justification || justification === "Sin justificacion")) total++
      })
    })
  })
  return total
})

const totalTardes = computed(() => {
  let total = 0
  classReports.value.forEach((classData) => {
    classData.students.forEach((student) => {
      Object.entries(student.attendance).forEach(([date, status]) => {
        // Si hay justificación, no contar como tarde
        const justification = getJustificationText(student.id, date)
        if (status === "T" && (!justification || justification === "Sin justificacion")) total++
      })
    })
  })
  return total
})

const totalJustificados = computed(() => {
  let total = 0
  classReports.value.forEach((classData) => {
    classData.students.forEach((student) => {
      Object.entries(student.attendance).forEach(([date, status]) => {
        const justification = getJustificationText(student.id, date)
        if (justification && justification !== "Sin justificacion") total++
      })
    })
  })
  return total
})

// Porcentaje promedio de asistencia
const averageAttendancePercentage = computed(() => {
  if (classReports.value.length === 0) return 0
  let totalPercentage = 0
  let classCount = 0
  classReports.value.forEach((classData) => {
    if (classData.relevantDates && classData.relevantDates.length > 0) {
      const classPercentage = calculateAttendancePercentage(classData)
      totalPercentage += classPercentage
      classCount++
    }
  })
  return classCount > 0 ? Math.round(totalPercentage / classCount) : 0
})

// Dia con mejor asistencia
const bestAttendanceDay = computed(() => {
  const attendanceByDay = [0, 0, 0, 0, 0, 0, 0]
  const countByDay = [0, 0, 0, 0, 0, 0, 0]

  classReports.value.forEach((classData) => {
    classData.students.forEach((student) => {
      Object.entries(student.attendance).forEach(([date, status]) => {
        const dayOfWeek = new Date(date).getDay()
        if (status === "P" || status === "J") {
          attendanceByDay[dayOfWeek]++
        }
        countByDay[dayOfWeek]++
      })
    })
  })

  const percentageByDay = attendanceByDay.map((count, idx) => ({
    day: idx,
    percentage: countByDay[idx] > 0 ? (count / countByDay[idx]) * 100 : 0,
  }))

  percentageByDay.sort((a, b) => b.percentage - a.percentage)

  if (percentageByDay.length === 0 || percentageByDay[0].percentage === 0) {
    return "No hay datos suficientes"
  }

  const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]
  return `${dayNames[percentageByDay[0].day]} (${Math.round(percentageByDay[0].percentage)}%)`
})

// Metodos
const setRange = (range: "week" | "month" | "quarter") => {
  const today = new Date()
  const start = new Date()

  switch (range) {
    case "week":
      start.setDate(today.getDate() - 7)
      break
    case "month":
      start.setMonth(today.getMonth() - 1)
      break
    case "quarter":
      start.setMonth(today.getMonth() - 3)
      break
  }

  from.value = start.toISOString().split("T")[0]
  to.value = today.toISOString().split("T")[0]
}

const calculateAttendancePercentage = (classData: any) => {
  if (!classData.relevantDates || classData.relevantDates.length === 0) return 0
  let totalPresent = 0
  let totalPossible = 0
  classData.students.forEach((student: any) => {
    classData.relevantDates.forEach((date: string) => {
      const status = student.attendance[date]
      const justification = getJustificationText(student.id, date)
      if (status === "P" && (!justification || justification === "Sin justificacion")) {
        totalPresent++
      }
      // Solo contar como posible si no es justificado
      if (!justification || justification === "Sin justificacion") {
        if (status) {
          totalPossible++
        }
      }
    })
  })
  return totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0
}

const calculateStudentAttendancePercentage = (student: any, relevantDates: string[]) => {
  if (!relevantDates || relevantDates.length === 0) return 0
  let present = 0
  let total = 0
  relevantDates.forEach((date) => {
    const status = student.attendance[date]
    const justification = getJustificationText(student.id, date)
    if (status === "P" && (!justification || justification === "Sin justificacion")) {
      present++
    }
    if (!justification || justification === "Sin justificacion") {
      if (status) {
        total++
      }
    }
  })
  return total > 0 ? Math.round((present / total) * 100) : 0
}

const getStatusSymbol = (status: string) => {
  switch (status) {
    case "P":
      return "✓"
    case "A":
      return "✗"
    case "T":
      return "⏰"
    case "J":
      return "📄"
    default:
      return "-"
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case "P":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    case "A":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    case "T":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    case "J":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const getJustificationText = (studentId: string, date: string) => {
  // Buscar justificacion en los documentos de asistencia
  const attendanceDoc = attendanceStore.attendanceDocuments.find(
    (doc) => doc.fecha === date && doc.classId === selectedClassData.value?.classId
  )
  if (attendanceDoc?.data?.justificacion) {
    const justification = attendanceDoc.data.justificacion.find((j: any) => j.id === studentId)
    return justification?.reason || "Sin justificacion"
  }
  return "Sin justificacion"
}

const getObservationText = (classId: string, date: string) => {
  // Buscar observaciones en los documentos de asistencia
  const attendanceDoc = attendanceStore.attendanceDocuments.find(
    (doc) => doc.fecha === date && doc.classId === classId
  )

  return attendanceDoc?.data?.observations || "Sin observaciones"
}

const selectClass = (classData: any) => {
  selectedClassData.value = classData
  selectedStudent.value = null
}

const selectStudent = (student: any) => {
  selectedStudent.value = student
}

const fetchReport = async () => {
  try {
    loading.value = true
    error.value = null

    if (!currentTeacherId.value) {
      throw new Error("No se pudo determinar el ID del profesor")
    }

    if (!from.value || !to.value) {
      throw new Error("Debe seleccionar un rango de fechas")
    }

    console.log("🔍 Generando informe para profesor:", currentTeacherId.value)
    console.log("📅 Rango de fechas:", from.value, "a", to.value)

    // Cargar datos necesarios
    await Promise.all([
      classesStore.getAllTeacherClasses(currentTeacherId.value),
      studentsStore.fetchStudents(),
      teachersStore.fetchTeachers(),
      attendanceStore.fetchAttendanceDocumentsByTeacher(
        currentTeacherId.value,
        from.value,
        to.value
      ),
    ])

    // Obtener clases del profesor
    const teacherClasses = classesStore.classes.filter((c) => {
      // Clases donde es el profesor titular
      if (c.teacherId === currentTeacherId.value) return true

      // Clases compartidas donde aparece en teachers[]
      if (c.teachers && Array.isArray(c.teachers)) {
        return c.teachers.some((teacher: any) => {
          const tId = teacher.teacherId || teacher.id || teacher.uid
          return tId === currentTeacherId.value
        })
      }

      return false
    })

    console.log("📚 Clases encontradas:", teacherClasses.length)

    // Generar reporte por clase
    classReports.value = await Promise.all(
      teacherClasses.map(async (classObj) => {
        // Obtener documentos de asistencia para esta clase
        const classAttendance = attendanceStore.attendanceDocuments.filter(
          (doc) => doc.classId === classObj.id
        )

        // Obtener estudiantes de esta clase
        let students: any[] = []
        if (classObj.studentIds && Array.isArray(classObj.studentIds)) {
          students = await Promise.all(
            classObj.studentIds.map(async (studentId) => {
              const studentData = studentsStore.students.find((s) => s.id === studentId) || {
                id: studentId,
                nombre: "Estudiante",
                apellido: "Desconocido",
              }

              // Preparar registro de asistencia para este estudiante
              const attendance: Record<string, string> = {}

              // Inicializar asistencia como vacia
              if (classAttendance.length > 0) {
                // Para cada documento de asistencia, verificar si el estudiante estuvo presente/ausente/etc
                classAttendance.forEach((doc) => {
                  const date = doc.fecha || ""
                  if (!date) return

                  // Determinar estado
                  let status = "-"
                  if (doc.data?.presentes?.includes(studentId)) {
                    status = "P"
                  } else if (doc.data?.ausentes?.includes(studentId)) {
                    status = "A"
                  } else if (doc.data?.tarde?.includes(studentId)) {
                    status = "T"
                  } else if (doc.data?.justificacion?.some((j: any) => j.id === studentId)) {
                    status = "J"
                  }

                  attendance[date] = status
                })
              }

              return {
                id: studentId,
                name: `${studentData.nombre} ${studentData.apellido}`,
                attendance,
              }
            })
          )
        }

        // Obtener fechas relevantes (todas las fechas en el rango donde hay asistencia)
        const relevantDates = classAttendance.map((doc) => doc.fecha).filter(Boolean)

        return {
          classId: classObj.id,
          className: classObj.name,
          students,
          relevantDates,
        }
      })
    )

    console.log("✅ Informe generado exitosamente")
  } catch (err) {
    console.error("❌ Error generando informe:", err)
    error.value = err instanceof Error ? err.message : "Error al generar el informe"
  } finally {
    loading.value = false
  }
}

// Agregar función auxiliar para obtener el objeto de justificación
function getJustificationTextObj(studentId: string, date: string) {
  const attendanceDoc = attendanceStore.attendanceDocuments.find(
    (doc) => doc.fecha === date && doc.classId === selectedClassData.value?.classId
  )
  if (attendanceDoc?.data?.justificacion) {
    return attendanceDoc.data.justificacion.find((j: any) => j.id === studentId)
  }
  return null
}

// Inicializacion
onMounted(async () => {
  try {
    console.log("🚀 Inicializando componente TeacherInformeAttendance...")
    console.log("👤 Usuario actual:", currentTeacherId.value)

    if (!currentTeacherId.value) {
      console.warn("⚠️ No se pudo determinar el ID del profesor actual")
      return
    }

    // Establecer rango por defecto (ultimo mes)
    setRange("month")

    console.log("📊 Generando informe inicial...")
    await fetchReport()
    console.log("✅ Componente inicializado correctamente")
  } catch (err) {
    console.error("❌ Error al inicializar componente:", err)
  }
})
</script>

<style scoped>
/* Transiciones suaves */
.class-card {
  transition: all 0.3s ease-in-out;
}

.class-card:hover {
  transform: translateY(-2px);
}

/* Responsive improvements */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-container {
    font-size: 0.875rem;
  }
}
</style>
