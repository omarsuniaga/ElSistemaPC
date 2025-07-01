<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Overlay -->
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div class="absolute inset-0 bg-gray-500 opacity-75" @click="closeModal" />
      </div>

      <!-- Modal -->
      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
      >
        <!-- Header -->
        <div class="bg-white px-6 py-4 border-b">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                {{ classData?.className || "Detalle de Clase" }}
              </h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ formatDateRange }} • {{ totalStudents }} estudiantes
              </p>
            </div>
            <button
              class="text-gray-400 hover:text-gray-600 focus:outline-none"
              @click="closeModal"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>

          <!-- Tabs -->
          <div class="mt-4">
            <nav class="flex space-x-8" aria-label="Tabs">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                :class="[
                  'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ]"
                @click="activeTab = tab.id"
              >
                {{ tab.name }}
                <span
                  v-if="tab.count"
                  class="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs"
                >
                  {{ tab.count }}
                </span>
              </button>
            </nav>
          </div>
        </div>

        <!-- Content -->
        <div class="bg-white px-6 py-4 max-h-96 overflow-y-auto">
          <!-- Resumen -->
          <div v-if="activeTab === 'summary'" class="space-y-6">
            <!-- Estadísticas generales -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="flex items-center">
                  <CheckCircleIcon class="h-8 w-8 text-green-600" />
                  <div class="ml-3">
                    <p class="text-2xl font-semibold text-green-900">{{ summary.totalPresent }}</p>
                    <p class="text-sm text-green-600">Presentes</p>
                  </div>
                </div>
              </div>

              <div class="bg-red-50 p-4 rounded-lg">
                <div class="flex items-center">
                  <XCircleIcon class="h-8 w-8 text-red-600" />
                  <div class="ml-3">
                    <p class="text-2xl font-semibold text-red-900">{{ summary.totalAbsent }}</p>
                    <p class="text-sm text-red-600">Ausentes</p>
                  </div>
                </div>
              </div>

              <div class="bg-yellow-50 p-4 rounded-lg">
                <div class="flex items-center">
                  <ClockIcon class="h-8 w-8 text-yellow-600" />
                  <div class="ml-3">
                    <p class="text-2xl font-semibold text-yellow-900">{{ summary.totalLate }}</p>
                    <p class="text-sm text-yellow-600">Tardanzas</p>
                  </div>
                </div>
              </div>

              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="flex items-center">
                  <ChartBarIcon class="h-8 w-8 text-blue-600" />
                  <div class="ml-3">
                    <p class="text-2xl font-semibold text-blue-900">
                      {{ summary.attendanceRate }}%
                    </p>
                    <p class="text-sm text-blue-600">Asistencia</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Información de la clase -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-3">Información de la clase</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="font-medium text-gray-700">Instrumento:</span>
                  <span class="ml-2 text-gray-900">{{
                    classData?.instrument || "No especificado"
                  }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Nivel:</span>
                  <span class="ml-2 text-gray-900">{{
                    classData?.level || "No especificado"
                  }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Horario:</span>
                  <span class="ml-2 text-gray-900">{{
                    classData?.schedule || "No especificado"
                  }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Modalidad:</span>
                  <span class="ml-2 text-gray-900">{{
                    classData?.modality || "No especificado"
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Lista de estudiantes -->
          <div v-if="activeTab === 'students'" class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="font-medium text-gray-900">Estudiantes en la clase</h4>
              <div class="flex items-center space-x-2">
                <select v-model="studentFilter" class="text-sm border rounded px-2 py-1">
                  <option value="">Todos</option>
                  <option value="present">Solo presentes</option>
                  <option value="absent">Solo ausentes</option>
                  <option value="late">Solo tardanzas</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <div
                v-for="student in filteredStudents"
                :key="student.id"
                class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div
                      class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"
                    >
                      <span class="text-sm font-medium text-blue-600">
                        {{ getInitials(student.firstName, student.lastName) }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900">
                      {{ student.firstName }} {{ student.lastName }}
                    </p>
                    <p class="text-xs text-gray-500">{{ student.email || "Sin email" }}</p>
                  </div>
                </div>

                <div class="flex items-center space-x-4">
                  <div class="text-right">
                    <div class="text-sm text-gray-900">
                      {{ student.stats.attendanceRate }}% asistencia
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ student.stats.present }}P / {{ student.stats.absent }}A /
                      {{ student.stats.late }}T
                    </div>
                  </div>
                  <div class="flex items-center space-x-1">
                    <span
                      v-for="record in student.recentAttendance.slice(0, 5)"
                      :key="record.date"
                      :class="getStatusDot(record.status)"
                      class="w-2 h-2 rounded-full"
                      :title="`${formatDate(record.date)}: ${getStatusText(record.status)}`"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Calendario de asistencia -->
          <div v-if="activeTab === 'calendar'" class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="font-medium text-gray-900">Calendario de Asistencia</h4>
              <div class="flex items-center space-x-2 text-xs">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-green-500 rounded mr-1" />
                  <span>Presente</span>
                </div>
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-red-500 rounded mr-1" />
                  <span>Ausente</span>
                </div>
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-yellow-500 rounded mr-1" />
                  <span>Tardanza</span>
                </div>
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-gray-300 rounded mr-1" />
                  <span>Sin clase</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-7 gap-1 text-xs">
              <!-- Headers de días -->
              <div
                v-for="day in ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']"
                :key="day"
                class="p-2 text-center font-medium text-gray-500"
              >
                {{ day }}
              </div>

              <!-- Días del calendario -->
              <div
                v-for="day in calendarDays"
                :key="day.date"
                :class="[
                  'p-2 text-center border rounded',
                  day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
                  day.hasClass ? getCalendarDayColor(day.status) : 'bg-gray-100',
                ]"
                :title="day.tooltip"
              >
                {{ day.day }}
              </div>
            </div>
          </div>

          <!-- Observaciones -->
          <div v-if="activeTab === 'observations'" class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="font-medium text-gray-900">Observaciones de clase</h4>
              <span class="text-sm text-gray-500"
                >{{ classObservations.length }} observaciones</span
              >
            </div>

            <div v-if="classObservations.length === 0" class="text-center py-8 text-gray-500">
              No hay observaciones registradas para esta clase.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="observation in classObservations"
                :key="observation.id"
                class="border rounded-lg p-4"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-2">
                      <span class="text-sm font-medium text-gray-900">
                        {{ observation.teacherName || "Profesor" }}
                      </span>
                      <span class="text-xs text-gray-500">
                        {{ formatDate(observation.date) }}
                      </span>
                      <span
                        v-if="observation.type"
                        :class="getObservationTypeColor(observation.type)"
                        class="px-2 py-1 text-xs rounded-full"
                      >
                        {{ observation.type }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-700">{{ observation.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-6 py-3 flex items-center justify-between">
          <div class="text-sm text-gray-500">
            Última actualización: {{ formatDate(lastUpdate) }}
          </div>
          <div class="flex items-center space-x-3">
            <button
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="exportClassData"
            >
              Exportar datos
            </button>
            <button
              class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="closeModal"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch} from "vue"
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
} from "@heroicons/vue/24/outline"
import {format, eachDayOfInterval, startOfMonth, endOfMonth, getDay} from "date-fns"
import {es} from "date-fns/locale"

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  classData: {
    type: Object,
    default: null,
  },
  dateRange: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["close", "export"])

// Estado reactivo
const activeTab = ref("summary")
const studentFilter = ref("")

// Tabs disponibles
const tabs = computed(() => [
  {
    id: "summary",
    name: "Resumen",
    count: null,
  },
  {
    id: "students",
    name: "Estudiantes",
    count: props.classData?.students?.length || 0,
  },
  {
    id: "calendar",
    name: "Calendario",
    count: null,
  },
  {
    id: "observations",
    name: "Observaciones",
    count: classObservations.value.length,
  },
])

// Resumen de estadísticas
const summary = computed(() => {
  if (!props.classData?.students) {
    return {
      totalPresent: 0,
      totalAbsent: 0,
      totalLate: 0,
      totalJustified: 0,
      attendanceRate: 0,
    }
  }

  let totalPresent = 0
  let totalAbsent = 0
  let totalLate = 0
  let totalJustified = 0
  let totalRecords = 0

  props.classData.students.forEach((student) => {
    student.attendance?.forEach((record) => {
      totalRecords++
      switch (record.status) {
        case "present":
          totalPresent++
          break
        case "absent":
          totalAbsent++
          break
        case "late":
          totalLate++
          break
        case "justified":
          totalJustified++
          break
      }
    })
  })

  return {
    totalPresent,
    totalAbsent,
    totalLate,
    totalJustified,
    attendanceRate: totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0,
  }
})

// Estudiantes filtrados
const filteredStudents = computed(() => {
  if (!props.classData?.students) return []

  const students = props.classData.students.filter((student) => {
    if (!studentFilter.value) return true

    const lastRecord = student.attendance?.[0]
    return lastRecord?.status === studentFilter.value
  })

  return students
})

// Total de estudiantes
const totalStudents = computed(() => {
  return props.classData?.students?.length || 0
})

// Observaciones de clase
const classObservations = computed(() => {
  return props.classData?.observations || []
})

// Rango de fechas formateado
const formatDateRange = computed(() => {
  if (!props.dateRange.startDate || !props.dateRange.endDate) return "Rango no especificado"

  const start = format(new Date(props.dateRange.startDate), "dd/MM/yyyy", {locale: es})
  const end = format(new Date(props.dateRange.endDate), "dd/MM/yyyy", {locale: es})

  return `${start} - ${end}`
})

// Última actualización
const lastUpdate = computed(() => {
  return new Date()
})

// Días del calendario
const calendarDays = computed(() => {
  if (!props.dateRange.startDate || !props.dateRange.endDate) return []

  const start = startOfMonth(new Date(props.dateRange.startDate))
  const end = endOfMonth(new Date(props.dateRange.endDate))

  const days = eachDayOfInterval({start, end})

  return days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd")

    // Buscar registros de asistencia para este día
    const dayAttendance = []
    props.classData?.students?.forEach((student) => {
      const record = student.attendance?.find(
        (a) => format(new Date(a.date), "yyyy-MM-dd") === dateStr
      )
      if (record) dayAttendance.push(record)
    })

    const hasClass = dayAttendance.length > 0
    let status = "none"
    let tooltip = format(day, "dd/MM/yyyy", {locale: es})

    if (hasClass) {
      const presents = dayAttendance.filter((a) => a.status === "present").length
      const total = dayAttendance.length
      const rate = Math.round((presents / total) * 100)

      if (rate >= 80) status = "good"
      else if (rate >= 60) status = "medium"
      else status = "poor"

      tooltip += ` - ${presents}/${total} presentes (${rate}%)`
    } else {
      tooltip += " - Sin clase"
    }

    return {
      date: dateStr,
      day: format(day, "d"),
      isCurrentMonth: true,
      hasClass,
      status,
      tooltip,
    }
  })
})

// Métodos auxiliares
const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase()
}

const getStatusDot = (status) => {
  const colors = {
    present: "bg-green-500",
    absent: "bg-red-500",
    late: "bg-yellow-500",
    justified: "bg-blue-500",
  }
  return colors[status] || "bg-gray-300"
}

const getStatusText = (status) => {
  const texts = {
    present: "Presente",
    absent: "Ausente",
    late: "Tardanza",
    justified: "Justificado",
  }
  return texts[status] || status
}

const getCalendarDayColor = (status) => {
  const colors = {
    good: "bg-green-200 text-green-800",
    medium: "bg-yellow-200 text-yellow-800",
    poor: "bg-red-200 text-red-800",
    none: "bg-gray-100 text-gray-500",
  }
  return colors[status] || "bg-gray-100"
}

const getObservationTypeColor = (type) => {
  const colors = {
    positive: "bg-green-100 text-green-800",
    negative: "bg-red-100 text-red-800",
    neutral: "bg-gray-100 text-gray-800",
    important: "bg-blue-100 text-blue-800",
  }
  return colors[type] || "bg-gray-100 text-gray-800"
}

const formatDate = (date) => {
  if (!date) return "N/A"
  return format(new Date(date), "dd/MM/yyyy", {locale: es})
}

// Acciones
const closeModal = () => {
  emit("close")
}

const exportClassData = () => {
  emit("export", props.classData)
}

// Resetear tab al abrir modal
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      activeTab.value = "summary"
      studentFilter.value = ""
    }
  }
)
</script>
