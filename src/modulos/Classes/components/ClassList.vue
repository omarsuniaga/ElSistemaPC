<template>
  <div class="class-list">
    <!-- Barra de búsqueda mejorada -->
    <div class="mb-6">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nombre, nivel, instrumento o maestro..."
          class="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-200"
        />
        <!-- Limpiar búsqueda -->
        <div v-if="search" class="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            @click="search = ''"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Resultados de búsqueda -->
      <div
        v-if="search && filteredClasses.length > 0"
        class="mt-2 text-sm text-gray-600 dark:text-gray-400"
      >
        Mostrando {{ filteredClasses.length }} de {{ classes.length }} clases
      </div>
    </div>

    <!-- Loading state mejorado -->
    <div v-if="loading" class="flex justify-center items-center py-16">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"
        />
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando clases...</p>
      </div>
    </div>

    <!-- No data state mejorado -->
    <div v-else-if="filteredClasses.length === 0 && !loading" class="text-center py-16">
      <div
        class="mx-auto h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-6"
      >
        <AcademicCapIcon class="h-12 w-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ search ? "No se encontraron clases" : "No hay clases disponibles" }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        {{
          search
            ? `No hay clases que coincidan con "${search}". Intenta con otros términos de búsqueda.`
            : "Comienza creando una nueva clase para organizar estudiantes y horarios."
        }}
      </p>
      <div v-if="search" class="mt-4">
        <button
          class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          @click="search = ''"
        >
          <XMarkIcon class="mr-2 h-4 w-4" />
          Limpiar búsqueda
        </button>
      </div>
    </div>

    <!-- Desktop Table mejorada -->
    <div v-else class="hidden lg:block">
      <div
        class="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200"
      >
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                scope="col"
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Información de la Clase
              </th>
              <th
                scope="col"
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Maestro
              </th>
              <th
                scope="col"
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Estudiantes
              </th>
              <th
                scope="col"
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Horario
              </th>
              <th
                scope="col"
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Estado
              </th>
              <th
                scope="col"
                class="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="item in filteredClasses"
              :key="item.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 group"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div
                      class="h-12 w-12 rounded-lg flex items-center justify-center transition-colors duration-200"
                      :class="getInstrumentBgColor(item.instrument)"
                    >
                      <MusicalNoteIcon
                        class="h-6 w-6"
                        :class="getInstrumentTextColor(item.instrument)"
                      />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div
                      class="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                    >
                      {{ item.name }}
                    </div>
                    <div
                      class="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2"
                    >
                      <span>{{ item.level }}</span>
                      <span class="text-gray-300 dark:text-gray-600">•</span>
                      <span>{{ item.instrument }}</span>
                      <span
                        v-if="item.sharedWith && item.sharedWith.length > 0"
                        class="text-purple-500 dark:text-purple-400 text-xs"
                      >
                        (Compartida)
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-8 w-8">
                    <div
                      class="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                    >
                      <UserIcon class="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ getTeacherName(item.teacherId) }}
                    </div>
                    <div
                      v-if="item.sharedWith && item.sharedWith.length > 0"
                      class="text-xs text-purple-600 dark:text-purple-400"
                    >
                      +{{ item.sharedWith.length }} colaborador{{
                        item.sharedWith.length !== 1 ? "es" : ""
                      }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <UsersIcon class="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                  <span class="text-sm text-gray-900 dark:text-white font-medium">
                    {{ item.studentIds?.length || 0 }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    estudiante{{ (item.studentIds?.length || 0) !== 1 ? "s" : "" }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ formatSchedule(item.schedule) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getStatusBadgeClass(item.status)"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ getStatusText(item.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <!-- Tooltip wrapper for edit button -->
                  <div class="relative group/tooltip">
                    <button
                      class="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all duration-200 transform hover:scale-105"
                      title="Editar clase"
                      @click="$emit('edit', item)"
                    >
                      <PencilIcon class="h-4 w-4" />
                    </button>
                    <div
                      class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
                    >
                      Editar clase
                    </div>
                  </div>

                  <!-- Manage sharing button -->
                  <div class="relative group/tooltip">
                    <button
                      class="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/50 transition-all duration-200 transform hover:scale-105"
                      title="Gestionar compartir"
                      @click="$emit('manage-sharing', item)"
                    >
                      <ShareIcon class="h-4 w-4" />
                    </button>
                    <div
                      class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
                    >
                      Gestionar compartir
                    </div>
                  </div>

                  <!-- Tooltip wrapper for schedule button -->
                  <div class="relative group/tooltip">
                    <button
                      class="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/50 transition-all duration-200 transform hover:scale-105"
                      title="Ver horario"
                      @click="$emit('view-schedule', item)"
                    >
                      <CalendarDaysIcon class="h-4 w-4" />
                    </button>
                    <div
                      class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
                    >
                      Ver horario
                    </div>
                  </div>

                  <!-- Tooltip wrapper for delete button -->
                  <div class="relative group/tooltip">
                    <button
                      class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50 transition-all duration-200 transform hover:scale-105"
                      title="Eliminar clase"
                      @click="$emit('delete', item)"
                    >
                      <TrashIcon class="h-4 w-4" />
                    </button>
                    <div
                      class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
                    >
                      Eliminar clase
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Cards mejoradas -->
    <div class="lg:hidden space-y-4">
      <div
        v-for="item in filteredClasses"
        :key="item.id"
        class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-xl dark:hover:border-gray-600 transition-all duration-200 transform hover:-translate-y-1"
      >
        <!-- Header de la tarjeta -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center flex-1">
            <div class="flex-shrink-0 mr-3">
              <div
                class="h-12 w-12 rounded-lg flex items-center justify-center transition-colors duration-200"
                :class="getInstrumentBgColor(item.instrument)"
              >
                <MusicalNoteIcon class="h-6 w-6" :class="getInstrumentTextColor(item.instrument)" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white truncate">
                {{ item.name }}
              </h3>
              <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>{{ item.level }}</span>
                <span class="mx-2">•</span>
                <span>{{ item.instrument }}</span>
              </div>
              <div v-if="item.sharedWith && item.sharedWith.length > 0" class="mt-1">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                >
                  <ShareIcon class="h-3 w-3 mr-1" />
                  Compartida
                </span>
              </div>
            </div>
          </div>

          <!-- Estado -->
          <div class="flex-shrink-0 ml-2">
            <span
              :class="getStatusBadgeClass(item.status)"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            >
              {{ getStatusText(item.status) }}
            </span>
          </div>
        </div>

        <!-- Información detallada -->
        <div class="space-y-3">
          <!-- Maestro -->
          <div class="flex items-center">
            <UserIcon class="h-4 w-4 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0" />
            <div class="flex-1">
              <span class="text-sm text-gray-600 dark:text-gray-400">Maestro:</span>
              <span class="ml-1 text-sm font-medium text-gray-900 dark:text-white">{{
                getTeacherName(item.teacherId)
              }}</span>
              <div
                v-if="item.sharedWith && item.sharedWith.length > 0"
                class="text-xs text-purple-600 dark:text-purple-400 mt-1"
              >
                Colaboradores: {{ item.sharedWith.length }}
              </div>
            </div>
          </div>

          <!-- Estudiantes -->
          <div class="flex items-center">
            <UsersIcon class="h-4 w-4 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0" />
            <div class="flex-1">
              <span class="text-sm text-gray-600 dark:text-gray-400">Estudiantes:</span>
              <span class="ml-1 text-sm font-medium text-gray-900 dark:text-white">
                {{ item.studentIds?.length || 0 }} inscrito{{
                  (item.studentIds?.length || 0) !== 1 ? "s" : ""
                }}
              </span>
            </div>
          </div>

          <!-- Horario -->
          <div class="flex items-center">
            <ClockIcon class="h-4 w-4 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0" />
            <div class="flex-1">
              <span class="text-sm text-gray-600 dark:text-gray-400">Horario:</span>
              <span class="ml-1 text-sm font-medium text-gray-900 dark:text-white">{{
                formatSchedule(item.schedule)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <button
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                @click="$emit('edit', item)"
              >
                <PencilIcon class="h-3 w-3 mr-1" />
                Editar
              </button>
              <button
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                @click="$emit('manage-sharing', item)"
              >
                <ShareIcon class="h-3 w-3 mr-1" />
                Compartir
              </button>
            </div>

            <div class="flex items-center space-x-2">
              <button
                class="inline-flex items-center p-1.5 border border-transparent rounded-md text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                title="Ver horario"
                @click="$emit('view-schedule', item)"
              >
                <CalendarDaysIcon class="h-4 w-4" />
              </button>
              <button
                class="inline-flex items-center p-1.5 border border-transparent rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                title="Eliminar clase"
                @click="$emit('delete', item)"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from "vue"
import {useTeachersStore} from "../../Teachers/store/teachers"
import type {ClassData} from "../types/class"
import {
  MagnifyingGlassIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  UsersIcon,
  UserIcon,
  ClockIcon,
  CalendarDaysIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline"

const props = defineProps<{
  classes: ClassData[]
  loading?: boolean
}>()

defineEmits<{
  (e: "edit", classItem: ClassData): void
  (e: "delete", classItem: ClassData): void
  (e: "view-schedule", classItem: ClassData): void
  (e: "manage-sharing", classItem: ClassData): void
}>()

const search = ref("")
const teachersStore = useTeachersStore()

const filteredClasses = computed(() => {
  if (!search.value.trim()) {
    return props.classes
  }

  const searchTerm = search.value.toLowerCase()
  return props.classes.filter(
    (cls) =>
      cls.name?.toLowerCase().includes(searchTerm) ||
      cls.level?.toLowerCase().includes(searchTerm) ||
      cls.instrument?.toLowerCase().includes(searchTerm) ||
      getTeacherName(cls.teacherId).toLowerCase().includes(searchTerm)
  )
})

function getTeacherName(teacherId?: string): string {
  if (!teacherId) return "Sin asignar"
  const teacher = teachersStore.teachers.find((t) => t.id === teacherId)
  return teacher ? teacher.name : "Maestro no encontrado"
}

function formatSchedule(schedule: any): string {
  if (!schedule) return "Sin horario"

  // Helper function to format time in 12-hour format
  const formatTime = (time: string): string => {
    if (!time) return ""
    
    // Handle both HH:mm and HH:mm:ss formats
    const [hours, minutes] = time.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return time
    
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    const ampm = hours >= 12 ? 'pm' : 'am'
    const minutesStr = minutes.toString().padStart(2, '0')
    
    return `${hour12}:${minutesStr} ${ampm}`
  }

  // Helper function to translate day names to Spanish
  const translateDay = (day: string): string => {
    const dayTranslations: Record<string, string> = {
      'Monday': 'Lunes',
      'Tuesday': 'Martes', 
      'Wednesday': 'Miércoles',
      'Thursday': 'Jueves',
      'Friday': 'Viernes',
      'Saturday': 'Sábado',
      'Sunday': 'Domingo',
      'Lunes': 'Lunes',
      'Martes': 'Martes',
      'Miércoles': 'Miércoles', 
      'Jueves': 'Jueves',
      'Viernes': 'Viernes',
      'Sábado': 'Sábado',
      'Domingo': 'Domingo'
    }
    return dayTranslations[day] || day
  }

  // Handle array of schedules (multiple time slots)
  if (Array.isArray(schedule)) {
    const formattedSlots = schedule
      .filter(slot => slot.day && slot.startTime && slot.endTime)
      .map(slot => {
        const day = translateDay(slot.day)
        const startTime = formatTime(slot.startTime)
        const endTime = formatTime(slot.endTime)
        return `${day} ${startTime} a ${endTime}`
      })
    
    return formattedSlots.length > 0 ? formattedSlots.join(' y ') : "Sin horario válido"
  }

  // Handle schedule with slots property
  if (schedule.slots && Array.isArray(schedule.slots)) {
    const formattedSlots = schedule.slots
      .filter((slot: any) => slot.day && slot.startTime && slot.endTime)
      .map((slot: any) => {
        const day = translateDay(slot.day)
        const startTime = formatTime(slot.startTime)
        const endTime = formatTime(slot.endTime)
        return `${day} ${startTime} a ${endTime}`
      })
    
    return formattedSlots.length > 0 ? formattedSlots.join(' y ') : "Sin horario válido"
  }

  // Handle single schedule object
  if (schedule.day && schedule.startTime && schedule.endTime) {
    const day = translateDay(schedule.day)
    const startTime = formatTime(schedule.startTime)
    const endTime = formatTime(schedule.endTime)
    return `${day} ${startTime} a ${endTime}`
  }

  return "Sin horario válido"
}

function getInstrumentBgColor(instrument?: string): string {
  if (!instrument) return "bg-gray-100 dark:bg-gray-700"

  const colors: Record<string, string> = {
    Piano: "bg-blue-100 dark:bg-blue-900",
    piano: "bg-blue-100 dark:bg-blue-900",
    Guitarra: "bg-green-100 dark:bg-green-900",
    guitarra: "bg-green-100 dark:bg-green-900",
    Violín: "bg-purple-100 dark:bg-purple-900",
    violin: "bg-purple-100 dark:bg-purple-900",
    Batería: "bg-red-100 dark:bg-red-900",
    bateria: "bg-red-100 dark:bg-red-900",
    Canto: "bg-yellow-100 dark:bg-yellow-900",
    canto: "bg-yellow-100 dark:bg-yellow-900",
    Saxofón: "bg-indigo-100 dark:bg-indigo-900",
    Trompeta: "bg-orange-100 dark:bg-orange-900",
    Flauta: "bg-pink-100 dark:bg-pink-900",
    flauta: "bg-pink-100 dark:bg-pink-900",
    Bajo: "bg-gray-100 dark:bg-gray-700",
  }
  return colors[instrument] || "bg-gray-100 dark:bg-gray-700"
}

function getInstrumentTextColor(instrument?: string): string {
  if (!instrument) return "text-gray-600 dark:text-gray-400"

  const colors: Record<string, string> = {
    Piano: "text-blue-600 dark:text-blue-400",
    piano: "text-blue-600 dark:text-blue-400",
    Guitarra: "text-green-600 dark:text-green-400",
    guitarra: "text-green-600 dark:text-green-400",
    Violín: "text-purple-600 dark:text-purple-400",
    violin: "text-purple-600 dark:text-purple-400",
    Batería: "text-red-600 dark:text-red-400",
    bateria: "text-red-600 dark:text-red-400",
    Canto: "text-yellow-600 dark:text-yellow-400",
    canto: "text-yellow-600 dark:text-yellow-400",
    Saxofón: "text-indigo-600 dark:text-indigo-400",
    Trompeta: "text-orange-600 dark:text-orange-400",
    Flauta: "text-pink-600 dark:text-pink-400",
    flauta: "text-pink-600 dark:text-pink-400",
    Bajo: "text-gray-600 dark:text-gray-400",
  }
  return colors[instrument] || "text-gray-600 dark:text-gray-400"
}

function getStatusBadgeClass(status?: string): string {
  if (!status) return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"

  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "inactive":
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    case "suspended":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  }
}

function getStatusText(status?: string): string {
  if (!status) return "Sin estado"

  switch (status) {
    case "active":
      return "Activa"
    case "inactive":
      return "Inactiva"
    case "suspended":
      return "Suspendida"
    default:
      return "Sin estado"
  }
}
</script>

<style scoped>
/* Custom animations and styles */
.class-list {
  padding: 1.5rem;
}

/* Tooltip positioning */
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}

/* Table hover effects */
.table-row-hover {
  transition: all 0.2s;
}

.table-row-hover:hover {
  transform: scale(1.01);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Mobile card hover effects */
.mobile-card {
  transition: all 0.2s;
}

.mobile-card:hover {
  transform: translateY(-0.25rem);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Loading spinner */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Action button hover effects */
.action-btn {
  transition: all 0.2s;
  transform: scale(1);
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn:active {
  transform: scale(0.95);
}
</style>
