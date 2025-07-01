<!-- src/components/teachers/TeacherSchedule.vue -->
<template>
  <div class="teacher-schedule-container">
    <!-- Header con información del profesor -->
    <div class="schedule-header bg-white rounded-lg shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Horarios de Profesores</h2>
          <p class="text-gray-600 mt-1">Gestiona y visualiza los horarios de clases</p>
        </div>
        <div class="flex space-x-3">
          <button
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            @click="toggleViewMode"
          >
            <CalendarIcon class="w-4 h-4 mr-2" />
            {{ viewMode === "calendar" ? "Vista Lista" : "Vista Calendario" }}
          </button>
          <button
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            @click="openScheduleModal"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Agregar Horario
          </button>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-section bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Profesor</label>
          <select
            v-model="selectedTeacher"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            @change="filterSchedules"
          >
            <option value="">Todos los profesores</option>
            <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
              {{ teacher.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Día de la semana</label>
          <select
            v-model="selectedDay"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            @change="filterSchedules"
          >
            <option value="">Todos los días</option>
            <option value="lunes">Lunes</option>
            <option value="martes">Martes</option>
            <option value="miercoles">Miércoles</option>
            <option value="jueves">Jueves</option>
            <option value="viernes">Viernes</option>
            <option value="sabado">Sábado</option>
            <option value="domingo">Domingo</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Instrumento</label>
          <select
            v-model="selectedInstrument"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            @change="filterSchedules"
          >
            <option value="">Todos los instrumentos</option>
            <option value="piano">Piano</option>
            <option value="guitarra">Guitarra</option>
            <option value="violin">Violín</option>
            <option value="bateria">Batería</option>
            <option value="canto">Canto</option>
            <option value="flauta">Flauta</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            v-model="selectedStatus"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            @change="filterSchedules"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="pausado">Pausado</option>
            <option value="completado">Completado</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Vista de Calendario -->
    <div v-if="viewMode === 'calendar'" class="calendar-view bg-white rounded-lg shadow-sm p-6">
      <div class="calendar-header flex items-center justify-between mb-6">
        <h3 class="text-lg font-medium text-gray-900">
          {{ currentWeekRange }}
        </h3>
        <div class="flex space-x-2">
          <button
            class="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
            @click="previousWeek"
          >
            <ChevronLeftIcon class="w-4 h-4" />
          </button>
          <button class="p-2 border border-gray-300 rounded-md hover:bg-gray-50" @click="nextWeek">
            <ChevronRightIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Calendario Semanal -->
      <div class="grid grid-cols-8 gap-1">
        <!-- Header de horas -->
        <div class="text-xs font-medium text-gray-500 p-2" />
        <div
          v-for="day in weekDays"
          :key="day"
          class="text-xs font-medium text-gray-500 p-2 text-center"
        >
          {{ day }}
        </div>

        <!-- Filas de horarios -->
        <template v-for="hour in timeSlots" :key="hour">
          <div class="text-xs text-gray-500 p-2 border-r border-gray-200">
            {{ hour }}
          </div>
          <div
            v-for="day in weekDays"
            :key="`${day}-${hour}`"
            class="border border-gray-200 p-1 min-h-[60px] relative"
          >
            <div
              v-for="schedule in getSchedulesForDayAndHour(day, hour)"
              :key="schedule.id"
              class="schedule-item bg-indigo-100 text-indigo-800 p-1 rounded text-xs cursor-pointer hover:bg-indigo-200 mb-1"
              @click="openScheduleDetail(schedule)"
            >
              <div class="font-medium">{{ schedule.teacherName }}</div>
              <div>{{ schedule.instrument }}</div>
              <div>{{ schedule.studentName }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Vista de Lista -->
    <div v-else class="list-view">
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Profesor
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Estudiante
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Instrumento
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Día y Hora
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Duración
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="schedule in filteredSchedules" :key="schedule.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div
                        class="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center"
                      >
                        <span class="text-white text-sm font-medium">
                          {{ schedule.teacherName.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ schedule.teacherName }}
                      </div>
                      <div class="text-sm text-gray-500">{{ schedule.teacherEmail }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ schedule.studentName }}</div>
                  <div class="text-sm text-gray-500">{{ schedule.studentLevel }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ schedule.instrument }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>{{ schedule.dayOfWeek }}</div>
                  <div class="text-gray-500">{{ schedule.startTime }} - {{ schedule.endTime }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ schedule.duration }} min
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusBadgeClass(schedule.status)">
                    {{ getStatusText(schedule.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      class="text-indigo-600 hover:text-indigo-900"
                      @click="editSchedule(schedule)"
                    >
                      <PencilIcon class="w-4 h-4" />
                    </button>
                    <button
                      class="text-red-600 hover:text-red-900"
                      @click="deleteSchedule(schedule.id)"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal para crear/editar horario -->
    <div
      v-if="showScheduleModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">
              {{ editingSchedule ? "Editar Horario" : "Nuevo Horario" }}
            </h3>
            <button class="text-gray-400 hover:text-gray-600" @click="closeScheduleModal">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="saveSchedule">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Profesor</label>
              <select
                v-model="scheduleForm.teacherId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Seleccionar profesor</option>
                <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Estudiante</label>
              <select
                v-model="scheduleForm.studentId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Seleccionar estudiante</option>
                <option v-for="student in students" :key="student.id" :value="student.id">
                  {{ student.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Instrumento</label>
              <select
                v-model="scheduleForm.instrument"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Seleccionar instrumento</option>
                <option value="piano">Piano</option>
                <option value="guitarra">Guitarra</option>
                <option value="violin">Violín</option>
                <option value="bateria">Batería</option>
                <option value="canto">Canto</option>
                <option value="flauta">Flauta</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Día de la semana</label>
              <select
                v-model="scheduleForm.dayOfWeek"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Seleccionar día</option>
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sabado">Sábado</option>
                <option value="domingo">Domingo</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                <input
                  v-model="scheduleForm.startTime"
                  type="time"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
                <select
                  v-model="scheduleForm.duration"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                </select>
              </div>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                @click="closeScheduleModal"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {{ editingSchedule ? "Actualizar" : "Crear" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, reactive} from "vue"
import {
  CalendarIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline"

// Data
const viewMode = ref<"calendar" | "list">("list")
const currentWeek = ref(new Date())
const selectedTeacher = ref("")
const selectedDay = ref("")
const selectedInstrument = ref("")
const selectedStatus = ref("")
const showScheduleModal = ref(false)
const editingSchedule = ref<any>(null)

// Formulario para crear/editar horarios
const scheduleForm = reactive({
  teacherId: "",
  studentId: "",
  instrument: "",
  dayOfWeek: "",
  startTime: "",
  duration: 60,
})

// Datos mock - en una app real vendrían de stores
const teachers = ref([
  {id: "1", name: "Ana García", email: "ana@academia.com"},
  {id: "2", name: "Carlos López", email: "carlos@academia.com"},
  {id: "3", name: "María González", email: "maria@academia.com"},
])

const students = ref([
  {id: "1", name: "Juan Pérez", level: "Principiante"},
  {id: "2", name: "Sara Martín", level: "Intermedio"},
  {id: "3", name: "Pedro Ruiz", level: "Avanzado"},
])

const schedules = ref([
  {
    id: "1",
    teacherId: "1",
    teacherName: "Ana García",
    teacherEmail: "ana@academia.com",
    studentId: "1",
    studentName: "Juan Pérez",
    studentLevel: "Principiante",
    instrument: "piano",
    dayOfWeek: "lunes",
    startTime: "10:00",
    endTime: "11:00",
    duration: 60,
    status: "activo",
  },
  {
    id: "2",
    teacherId: "2",
    teacherName: "Carlos López",
    teacherEmail: "carlos@academia.com",
    studentId: "2",
    studentName: "Sara Martín",
    studentLevel: "Intermedio",
    instrument: "guitarra",
    dayOfWeek: "martes",
    startTime: "15:00",
    endTime: "16:00",
    duration: 60,
    status: "activo",
  },
])

// Computed
const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
]

const currentWeekRange = computed(() => {
  const start = new Date(currentWeek.value)
  const end = new Date(currentWeek.value)
  end.setDate(start.getDate() + 6)

  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
})

const filteredSchedules = computed(() => {
  return schedules.value.filter((schedule) => {
    return (
      (!selectedTeacher.value || schedule.teacherId === selectedTeacher.value) &&
      (!selectedDay.value || schedule.dayOfWeek === selectedDay.value) &&
      (!selectedInstrument.value || schedule.instrument === selectedInstrument.value) &&
      (!selectedStatus.value || schedule.status === selectedStatus.value)
    )
  })
})

// Methods
const toggleViewMode = () => {
  viewMode.value = viewMode.value === "calendar" ? "list" : "calendar"
}

const previousWeek = () => {
  currentWeek.value.setDate(currentWeek.value.getDate() - 7)
}

const nextWeek = () => {
  currentWeek.value.setDate(currentWeek.value.getDate() + 7)
}

const filterSchedules = () => {
  // Los filtros ya están reactivos en el computed
}

const getSchedulesForDayAndHour = (day: string, hour: string) => {
  const dayMap: {[key: string]: string} = {
    Lun: "lunes",
    Mar: "martes",
    Mié: "miercoles",
    Jue: "jueves",
    Vie: "viernes",
    Sáb: "sabado",
    Dom: "domingo",
  }

  return filteredSchedules.value.filter(
    (schedule) => schedule.dayOfWeek === dayMap[day] && schedule.startTime === hour
  )
}

const openScheduleModal = () => {
  editingSchedule.value = null
  resetScheduleForm()
  showScheduleModal.value = true
}

const closeScheduleModal = () => {
  showScheduleModal.value = false
  editingSchedule.value = null
  resetScheduleForm()
}

const resetScheduleForm = () => {
  Object.assign(scheduleForm, {
    teacherId: "",
    studentId: "",
    instrument: "",
    dayOfWeek: "",
    startTime: "",
    duration: 60,
  })
}

const editSchedule = (schedule: any) => {
  editingSchedule.value = schedule
  Object.assign(scheduleForm, {
    teacherId: schedule.teacherId,
    studentId: schedule.studentId,
    instrument: schedule.instrument,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    duration: schedule.duration,
  })
  showScheduleModal.value = true
}

const saveSchedule = () => {
  // Aquí iría la lógica para guardar el horario
  console.log("Guardando horario:", scheduleForm)
  closeScheduleModal()
}

const deleteSchedule = (scheduleId: string) => {
  if (confirm("¿Estás seguro de que quieres eliminar este horario?")) {
    schedules.value = schedules.value.filter((s) => s.id !== scheduleId)
  }
}

const openScheduleDetail = (schedule: any) => {
  console.log("Detalle del horario:", schedule)
}

const getStatusBadgeClass = (status: string) => {
  const classes = {
    activo:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800",
    pausado:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800",
    completado:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800",
  }
  return classes[status as keyof typeof classes] || classes.activo
}

const getStatusText = (status: string) => {
  const texts = {
    activo: "Activo",
    pausado: "Pausado",
    completado: "Completado",
  }
  return texts[status as keyof typeof texts] || "Activo"
}

// Lifecycle
onMounted(() => {
  // Cargar datos iniciales
})
</script>

<style scoped>
.teacher-schedule-container {
  padding: 1.5rem;
  max-width: 80rem;
  margin: 0 auto;
}

.schedule-item {
  font-size: 10px;
  line-height: 1.2;
}

.calendar-view {
  min-height: 600px;
}

.schedule-item:hover {
  transform: scale(1.02);
}
</style>
