<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useScheduleStore} from "../modulos/Schedules/store/schedule"
import {useClassesStore} from "../modulos/Classes/store/classes"
import {useTeachersStore} from "../modulos/Teachers/store/teachers"

// Stores
const scheduleStore = useScheduleStore()
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()

// Estado
const isLoading = ref(false)
const error = ref(null)
const selectedTeacherId = ref("")
const selectedDay = ref("")
const loadingMessage = ref("")
const weekDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

// Función para cargar datos necesarios
const loadData = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = "Cargando datos de horarios..."

    // Cargar datos de los stores en paralelo
    await Promise.all([
      scheduleStore.fetchAllSchedules(),
      classesStore.fetchClasses(),
      teachersStore.fetchTeachers(),
    ])

    return true
  } catch (err: any) {
    error.value = `Error al cargar datos: ${err.message}`
    console.error("Error cargando datos:", err)
    return false
  } finally {
    isLoading.value = false
  }
}

// Ordenar las clases por día y hora
const schedulesGroupedByDay = computed(() => {
  // Crear un objeto para almacenar las clases por día
  const groupedSchedules = {}

  // Inicializar todos los días de la semana
  weekDays.forEach((day) => {
    groupedSchedules[day] = []
  })

  // Si hay un profesor seleccionado, filtrar por ese profesor
  const filteredSchedules = selectedTeacherId.value
    ? scheduleStore.getSchedulesByTeacher(selectedTeacherId.value)
    : scheduleStore.getAllSchedules

  // Agrupar por día
  filteredSchedules.forEach((schedule) => {
    const dayOfWeek = schedule.scheduleDay?.dayOfWeek || "Lunes" // Valor por defecto

    if (groupedSchedules[dayOfWeek]) {
      // Obtener los datos de la clase asociada al horario
      const classData = classesStore.getClassById(schedule.scheduleDay?.classId)

      // Crear un objeto para mostrar los datos relevantes
      const scheduleItem = {
        id: schedule.id,
        className: classData?.name || "Clase sin nombre",
        teacherName: teacherData(schedule.scheduleDay?.teacherId),
        startTime: schedule.scheduleDay?.timeSlot?.startTime || "",
        endTime: schedule.scheduleDay?.timeSlot?.endTime || "",
        room: schedule.scheduleDay?.roomId || "Sin aula asignada",
        studentCount: schedule.scheduleDay?.studentIds?.length || 0,
      }

      groupedSchedules[dayOfWeek].push(scheduleItem)
    }
  })

  // Ordenar cada día por hora de inicio
  Object.keys(groupedSchedules).forEach((day) => {
    groupedSchedules[day].sort((a, b) => {
      return convertTimeToMinutes(a.startTime) - convertTimeToMinutes(b.startTime)
    })
  })

  return groupedSchedules
})

// Función para convertir hora (HH:MM) a minutos para ordenar
const convertTimeToMinutes = (time) => {
  if (!time) return 0
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

// Obtener nombre del profesor
const teacherData = (teacherId) => {
  if (!teacherId) return "Sin profesor asignado"
  const teacher = teachersStore.teachers.find((t) => t.id === teacherId)
  return teacher?.name || "Profesor desconocido"
}

// Filtrados y selectores
const availableTeachers = computed(() => {
  return teachersStore.teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
  }))
})

// Cargar los datos al montar el componente
onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div class="schedule-view p-4 md:p-6 max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Vista de Horarios</h1>

    <!-- Estados de carga y error -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      <span class="ml-3">{{ loadingMessage }}</span>
    </div>

    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg text-red-700 dark:text-red-400 mb-4"
    >
      {{ error }}
      <button class="ml-2 underline" @click="loadData">Reintentar</button>
    </div>

    <div v-else class="space-y-6">
      <!-- Filtros -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="w-full sm:w-auto">
            <label
              for="teacher-filter"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Filtrar por profesor
            </label>
            <select
              id="teacher-filter"
              v-model="selectedTeacherId"
              class="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Todos los profesores</option>
              <option v-for="teacher in availableTeachers" :key="teacher.id" :value="teacher.id">
                {{ teacher.name }}
              </option>
            </select>
          </div>

          <div class="w-full sm:w-auto">
            <label
              for="day-filter"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Filtrar por día
            </label>
            <select
              id="day-filter"
              v-model="selectedDay"
              class="form-select mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Todos los días</option>
              <option v-for="day in weekDays" :key="day" :value="day">
                {{ day }}
              </option>
            </select>
          </div>

          <div class="w-full sm:w-auto ml-auto mt-4 sm:mt-0">
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              @click="loadData"
            >
              <i class="fas fa-sync-alt mr-2" />
              Recargar datos
            </button>
          </div>
        </div>
      </div>

      <!-- Vista de horarios por día -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="day in weekDays"
          v-show="!selectedDay || selectedDay === day"
          :key="day"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
        >
          <div class="bg-indigo-600 text-white py-2 px-4">
            <h2 class="text-lg font-medium">{{ day }}</h2>
          </div>

          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="schedule in schedulesGroupedByDay[day]"
              :key="schedule.id"
              class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-medium text-gray-900 dark:text-white">{{ schedule.className }}</h3>
                <span
                  class="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {{ schedule.startTime }} - {{ schedule.endTime }}
                </span>
              </div>

              <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><span class="font-medium">Profesor:</span> {{ schedule.teacherName }}</p>
                <p><span class="font-medium">Aula:</span> {{ schedule.room }}</p>
                <p><span class="font-medium">Estudiantes:</span> {{ schedule.studentCount }}</p>
              </div>
            </div>

            <!-- Mensaje cuando no hay horarios en un día -->
            <div
              v-if="schedulesGroupedByDay[day].length === 0"
              class="p-4 text-center text-gray-500 dark:text-gray-400"
            >
              No hay clases programadas para este día
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule-view {
  min-height: 70vh;
}
</style>
