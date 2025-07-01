<template>
  <div class="class-schedule-view">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Horarios de Clases</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Visualiza y gestiona los horarios de todas las clases.
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <!-- View Mode Toggle -->
          <div class="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <button
              :class="[
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                viewMode === 'week'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              ]"
              @click="viewMode = 'week'"
            >
              Semana
            </button>
            <button
              :class="[
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              ]"
              @click="viewMode = 'list'"
            >
              Lista
            </button>
          </div>

          <!-- Export Button -->
          <button
            class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            @click="exportSchedule"
          >
            <ArrowDownTrayIcon class="h-4 w-4 mr-1" />
            Exportar
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
    >
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Teacher Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Maestro
          </label>
          <select
            v-model="filters.teacherId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los maestros</option>
            <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
              {{ teacher.name }}
            </option>
          </select>
        </div>

        <!-- Instrument Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Instrumento
          </label>
          <select
            v-model="filters.instrument"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los instrumentos</option>
            <option value="piano">Piano</option>
            <option value="guitarra">Guitarra</option>
            <option value="violin">Violín</option>
            <option value="flauta">Flauta</option>
            <option value="bateria">Batería</option>
            <option value="canto">Canto</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <!-- Day Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Día
          </label>
          <select
            v-model="filters.day"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los días</option>
            <option value="monday">Lunes</option>
            <option value="tuesday">Martes</option>
            <option value="wednesday">Miércoles</option>
            <option value="thursday">Jueves</option>
            <option value="friday">Viernes</option>
            <option value="saturday">Sábado</option>
          </select>
        </div>

        <!-- Time Range Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Horario
          </label>
          <select
            v-model="filters.timeRange"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todo el día</option>
            <option value="morning">Mañana (6:00-12:00)</option>
            <option value="afternoon">Tarde (12:00-18:00)</option>
            <option value="evening">Noche (18:00-22:00)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Week View -->
    <div
      v-if="viewMode === 'week'"
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div class="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
        <!-- Time column header -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Hora</span>
        </div>

        <!-- Day headers -->
        <div
          v-for="day in weekDays"
          :key="day.value"
          class="p-4 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 last:border-r-0"
        >
          <div class="text-center">
            <div class="text-sm font-medium text-gray-900 dark:text-white">{{ day.label }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ getClassCountForDay(day.value) }} clases
            </div>
          </div>
        </div>
      </div>

      <!-- Time slots -->
      <div class="overflow-y-auto max-h-96">
        <div
          v-for="hour in timeSlots"
          :key="hour"
          class="grid grid-cols-8 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
        >
          <!-- Time label -->
          <div
            class="p-3 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
          >
            <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
              {{ formatHour(hour) }}
            </span>
          </div>

          <!-- Day cells -->
          <div
            v-for="day in weekDays"
            :key="`${day.value}-${hour}`"
            class="p-2 border-r border-gray-100 dark:border-gray-700 last:border-r-0 min-h-[60px]"
          >
            <div
              v-for="classItem in getClassesForTimeSlot(day.value, hour)"
              :key="classItem.id"
              class="mb-1 p-2 rounded text-xs cursor-pointer transition-all hover:shadow-sm"
              :class="getClassColor(classItem.instrument)"
              @click="$emit('class-selected', classItem)"
            >
              <div class="font-medium truncate">{{ classItem.name }}</div>
              <div class="text-xs opacity-75 truncate">
                {{ getTeacherName(classItem.teacherId) }}
              </div>
              <div class="text-xs opacity-75">
                {{ classItem.studentIds?.length || 0 }} estudiantes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="space-y-4">
      <div
        v-for="day in weekDays"
        :key="day.value"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ day.label }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ getClassCountForDay(day.value) }} clases programadas
          </p>
        </div>

        <div class="p-4">
          <div
            v-if="getClassesForDay(day.value).length === 0"
            class="text-center py-8 text-gray-500 dark:text-gray-400"
          >
            No hay clases programadas para este día
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="classItem in getClassesForDay(day.value)"
              :key="classItem.id"
              class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              @click="$emit('class-selected', classItem)"
            >
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  <div
:class="[
                    :class="['w-3 h-3 rounded-full', getInstrumentColor(classItem.instrument)]"
                  />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {{ classItem.name }}
                    </h4>
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        getInstrumentBadgeColor(classItem.instrument),
                      ]"
                    >
                      {{ classItem.instrument }}
                    </span>
                  </div>

                  <div
                    class="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
                  >
                    <span class="flex items-center">
                      <UserIcon class="h-4 w-4 mr-1" />
                      {{ getTeacherName(classItem.teacherId) }}
                    </span>
                    <span class="flex items-center">
                      <UsersIcon class="h-4 w-4 mr-1" />
                      {{ classItem.studentIds?.length || 0 }} estudiantes
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2 text-sm text-gray-900 dark:text-white">
                <ClockIcon class="h-4 w-4" />
                <span>{{ formatScheduleTime(classItem.schedule) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No classes state -->
    <div v-if="filteredClasses.length === 0" class="text-center py-12">
      <CalendarDaysIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        No hay clases programadas
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        No se encontraron clases que coincidan con los filtros seleccionados.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed} from "vue"
import {useTeachersStore} from "../../Teachers/store/teachers"
import type {ClassData} from "../types/class"
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  ArrowDownTrayIcon,
} from "@heroicons/vue/24/outline"

const props = defineProps<{
  classes: ClassData[]
}>()

defineEmits<{
  (e: "class-selected", classItem: ClassData): void
}>()

const teachersStore = useTeachersStore()

const viewMode = ref<"week" | "list">("week")

const filters = ref({
  teacherId: "",
  instrument: "",
  day: "",
  timeRange: "",
})

const weekDays = [
  {label: "Lunes", value: "monday"},
  {label: "Martes", value: "tuesday"},
  {label: "Miércoles", value: "wednesday"},
  {label: "Jueves", value: "thursday"},
  {label: "Viernes", value: "friday"},
  {label: "Sábado", value: "saturday"},
  {label: "Domingo", value: "sunday"},
]

const timeSlots = Array.from({length: 16}, (_, i) => i + 6) // 6:00 to 21:00

const teachers = computed(() => teachersStore.teachers)

const filteredClasses = computed(() => {
  return props.classes.filter((classItem) => {
    // Filter by teacher
    if (filters.value.teacherId && classItem.teacherId !== filters.value.teacherId) {
      return false
    }

    // Filter by instrument
    if (filters.value.instrument && classItem.instrument !== filters.value.instrument) {
      return false
    }

    // Filter by day
    if (filters.value.day && !hasScheduleForDay(classItem, filters.value.day)) {
      return false
    }

    // Filter by time range
    if (filters.value.timeRange && !isInTimeRange(classItem, filters.value.timeRange)) {
      return false
    }

    return true
  })
})

function hasScheduleForDay(classItem: ClassData, day: string): boolean {
  if (Array.isArray(classItem.schedule?.slots)) {
    return classItem.schedule.slots.some((slot) => slot.day === day)
  }
  return (classItem.schedule as any)?.day === day
}

function isInTimeRange(classItem: ClassData, timeRange: string): boolean {
  let startTime: string | undefined

  if (Array.isArray(classItem.schedule?.slots)) {
    startTime = classItem.schedule.slots[0]?.startTime
  } else {
    startTime = (classItem.schedule as any)?.startTime
  }

  if (!startTime) return false

  const hour = parseInt(startTime.split(":")[0])
  switch (timeRange) {
    case "morning":
      return hour >= 6 && hour < 12
    case "afternoon":
      return hour >= 12 && hour < 18
    case "evening":
      return hour >= 18 && hour < 22
    default:
      return true
  }
}

function getTeacherName(teacherId?: string): string {
  if (!teacherId) return "Sin asignar"
  const teacher = teachers.value.find((t) => t.id === teacherId)
  return teacher ? teacher.name : "Maestro no encontrado"
}

function getClassCountForDay(day: string): number {
  return filteredClasses.value.filter((c) => hasScheduleForDay(c, day)).length
}

function getClassesForDay(day: string): ClassData[] {
  return filteredClasses.value
    .filter((c) => hasScheduleForDay(c, day))
    .sort((a, b) => {
      const timeA = getClassStartTime(a) || "00:00"
      const timeB = getClassStartTime(b) || "00:00"
      return timeA.localeCompare(timeB)
    })
}

function getClassStartTime(classItem: ClassData): string | undefined {
  if (Array.isArray(classItem.schedule?.slots)) {
    return classItem.schedule.slots[0]?.startTime
  }
  return (classItem.schedule as any)?.startTime
}

function getClassesForTimeSlot(day: string, hour: number): ClassData[] {
  return filteredClasses.value.filter((classItem) => {
    if (!hasScheduleForDay(classItem, day)) return false

    const startTime = getClassStartTime(classItem)
    if (!startTime) return false

    const classHour = parseInt(startTime.split(":")[0])
    return classHour === hour
  })
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`
}

function formatScheduleTime(schedule: any): string {
  if (!schedule) return "Sin horario"

  if (Array.isArray(schedule.slots) && schedule.slots.length > 0) {
    const slot = schedule.slots[0]
    return `${slot.startTime} - ${slot.endTime}`
  }

  if (schedule.startTime && schedule.endTime) {
    return `${schedule.startTime} - ${schedule.endTime}`
  }

  return "Sin horario"
}

function getClassColor(instrument?: string): string {
  if (!instrument)
    return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600"

  const colors: Record<string, string> = {
    piano:
      "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700",
    guitarra:
      "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700",
    violin:
      "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700",
    flauta:
      "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700",
    bateria:
      "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700",
    canto:
      "bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 border-pink-200 dark:border-pink-700",
  }
  return (
    colors[instrument] ||
    "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600"
  )
}

function getInstrumentColor(instrument?: string): string {
  if (!instrument) return "bg-gray-500"

  const colors: Record<string, string> = {
    piano: "bg-blue-500",
    guitarra: "bg-green-500",
    violin: "bg-purple-500",
    flauta: "bg-yellow-500",
    bateria: "bg-red-500",
    canto: "bg-pink-500",
  }
  return colors[instrument] || "bg-gray-500"
}

function getInstrumentBadgeColor(instrument?: string): string {
  if (!instrument) return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"

  const colors: Record<string, string> = {
    piano: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    guitarra: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    violin: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
    flauta: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
    bateria: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    canto: "bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200",
  }
  return colors[instrument] || "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
}

function exportSchedule() {
  // Implementar lógica de exportación
  console.log("Exportando horarios...")

  // Crear CSV con los horarios
  const csvData = filteredClasses.value.map((classItem) => {
    const startTime = getClassStartTime(classItem) || ""
    const endTime = getClassEndTime(classItem) || ""
    const day = getClassDay(classItem) || ""

    return {
      Clase: classItem.name,
      Instrumento: classItem.instrument || "",
      Nivel: classItem.level,
      Maestro: getTeacherName(classItem.teacherId),
      Día: weekDays.find((d) => d.value === day)?.label || "",
      "Hora Inicio": startTime,
      "Hora Fin": endTime,
      Estudiantes: classItem.studentIds?.length || 0,
    }
  })

  const csvContent = [
    Object.keys(csvData[0] || {}).join(","),
    ...csvData.map((row) => Object.values(row).join(",")),
  ].join("\n")

  const blob = new Blob([csvContent], {type: "text/csv"})
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "horarios-clases.csv"
  a.click()
  window.URL.revokeObjectURL(url)
}

function getClassEndTime(classItem: ClassData): string | undefined {
  if (Array.isArray(classItem.schedule?.slots)) {
    return classItem.schedule.slots[0]?.endTime
  }
  return (classItem.schedule as any)?.endTime
}

function getClassDay(classItem: ClassData): string | undefined {
  if (Array.isArray(classItem.schedule?.slots)) {
    return classItem.schedule.slots[0]?.day
  }
  return (classItem.schedule as any)?.day
}
</script>

<style scoped>
.class-schedule-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
