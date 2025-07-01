<template>
  <div class="observations-history bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-lg">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Historial de Observaciones
      </h2>
      <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button
          class="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          :disabled="loading"
          @click="refreshObservations"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            :class="{'animate-spin': loading}"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clip-rule="evenodd"
            />
          </svg>
          {{ loading ? "Actualizando..." : "Actualizar" }}
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="col-span-1">
        <label
          for="class-filter"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Filtrar por clase</label
        >
        <select
          id="class-filter"
          v-model="selectedClassFilter"
          class="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todas las clases</option>
          <option v-for="classItem in classes" :key="classItem.id" :value="classItem.id">
            {{ classItem.name }}
          </option>
        </select>
      </div>

      <div class="col-span-1">
        <label
          for="date-range"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Rango de fechas</label
        >
        <div class="flex gap-2 items-center">
          <input
            v-model="startDate"
            type="date"
            class="flex-1 py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <span class="text-gray-500 dark:text-gray-400">a</span>
          <input
            v-model="endDate"
            type="date"
            class="flex-1 py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            title="Limpiar filtro de fechas"
            @click="clearDateFilter"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="col-span-1">
        <label
          for="search-filter"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Buscar en observaciones</label
        >
        <div class="flex items-center relative">
          <input
            id="search-filter"
            v-model="searchQuery"
            type="text"
            placeholder="Buscar..."
            class="w-full py-2 pl-10 pr-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-gray-400 absolute left-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-10">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      <p class="mt-4 text-gray-500 dark:text-gray-400">Cargando observaciones...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg text-center mb-6">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        @click="refreshObservations"
      >
        Reintentar
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredObservations.length === 0"
      class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
    >
      <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-full inline-block mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 class="text-xl font-medium text-gray-700 dark:text-gray-300">
        No hay observaciones que mostrar
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mt-2">
        No se encontraron observaciones con los filtros seleccionados.
      </p>
    </div>

    <!-- Observations table -->
    <div v-else class="overflow-hidden bg-white dark:bg-gray-800 shadow-sm rounded-lg">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Fecha
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Clase
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Observación
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Autor
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="observation in paginatedObservations"
              :key="observation.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(observation.date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div
                    class="flex-shrink-0 h-8 w-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 text-blue-600 dark:text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-200">
                      {{ getClassName(observation.classId) }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div
                  class="max-w-md text-sm text-gray-900 dark:text-gray-200 whitespace-pre-line observation-text"
                >
                  {{ observation.text }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  {{ getTeacherName(observation.author) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6 flex items-center justify-between"
      >
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span class="font-medium">{{ paginationStart + 1 }}</span> a
              <span class="font-medium">{{ paginationEnd }}</span> de
              <span class="font-medium">{{ filteredObservations.length }}</span> observaciones
            </p>
          </div>
          <div>
            <nav
              class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                :disabled="currentPage === 1"
                :class="[
                  currentPage === 1
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
                  'relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium',
                ]"
                @click="currentPage = 1"
              >
                <span class="sr-only">Primera</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
              <button
                :disabled="currentPage === 1"
                :class="[
                  currentPage === 1
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
                  'relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium',
                ]"
                @click="currentPage--"
              >
                <span class="sr-only">Anterior</span>
                <svg
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>

              <button
                v-for="page in pageNumbers"
                :key="page"
                aria-current="page"
                :class="[
                  page === currentPage
                    ? 'z-10 bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                ]"
                @click="currentPage = page"
              >
                {{ page }}
              </button>

              <button
                :disabled="currentPage === totalPages"
                :class="[
                  currentPage === totalPages
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
                  'relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium',
                ]"
                @click="currentPage++"
              >
                <span class="sr-only">Siguiente</span>
                <svg
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
              <button
                :disabled="currentPage === totalPages"
                :class="[
                  currentPage === totalPages
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
                  'relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium',
                ]"
                @click="currentPage = totalPages"
              >
                <span class="sr-only">Última</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L8.586 10 4.293 14.293a1 1 0 000 1.414zm6 0a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L15.586 10l-4.293 4.293a1 1 0 000 1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
        <div class="flex items-center sm:hidden space-x-2">
          <button
            :disabled="currentPage === 1"
            :class="[
              currentPage === 1
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
              'relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium rounded-md',
            ]"
            @click="currentPage--"
          >
            <span>Anterior</span>
          </button>
          <span class="text-sm text-gray-700 dark:text-gray-300">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
          <button
            :disabled="currentPage === totalPages"
            :class="[
              currentPage === totalPages
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
              'relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium rounded-md',
            ]"
            @click="currentPage++"
          >
            <span>Siguiente</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {useAttendanceStore} from "../store/attendance"
import {useClassesStore} from "../../Classes/store/classes"
import {useTeachersStore} from "../../Teachers/store/teachers" // Import teachers store
import {useAuthStore} from "../../../stores/auth" // Import auth store
import {format, isValid, parseISO, isAfter, isBefore, isEqual} from "date-fns"
import {es} from "date-fns/locale"

// Props
interface Props {
  teacherFilter?: string
  initialClassFilter?: string
}
const props = defineProps<Props>()

// Stores
const attendanceStore = useAttendanceStore()
const classesStore = useClassesStore()
const teachersStore = useTeachersStore() // Instantiate teachers store

// Function to get teacher name from teacher ID
const getTeacherName = (teacherId: string): string => {
  if (!teacherId) return "Sistema"

  // If it's 'Sistema', return as is
  if (teacherId === "Sistema") return "Sistema"

  // Try to find teacher by ID in the teachers store
  const teacher = teachersStore.getTeacherById(teacherId)
  if (teacher) {
    return teacher.name
  }
  // If not found, try to find by auth UID (fallback)
  const teacherByUid = teachersStore.teachers.find((t) => t.uid === teacherId)
  if (teacherByUid) {
    return teacherByUid.name
  }

  // Return the original ID if no teacher found
  return teacherId || "Sistema"
}

// States
const loading = ref(false)
const error = ref<string | null>(null)
const observations = ref<any[]>([])

// Filters
const selectedClassFilter = ref(props.initialClassFilter || "")
const startDate = ref("")
const endDate = ref("")
const searchQuery = ref("")

// Pagination
const itemsPerPage = ref(10)
const currentPage = ref(1)

// Computed properties
const classes = computed(() => {
  return classesStore.classes.filter((c) => {
    if (!props.teacherFilter) return true
    return c.teacherId === props.teacherFilter
  })
})

// Filter observations
const filteredObservations = computed(() => {
  let filtered = [...observations.value]

  // Filter by class
  if (selectedClassFilter.value) {
    filtered = filtered.filter((obs) => obs.classId === selectedClassFilter.value)
  }

  // Filter by date range
  if (startDate.value && endDate.value) {
    filtered = filtered.filter((obs) => {
      const obsDate = parseISO(obs.date)
      const start = parseISO(startDate.value)
      const end = parseISO(endDate.value)

      if (!isValid(obsDate) || !isValid(start) || !isValid(end)) return true

      return (
        (isAfter(obsDate, start) || isEqual(obsDate, start)) &&
        (isBefore(obsDate, end) || isEqual(obsDate, end))
      )
    })
  } else if (startDate.value) {
    filtered = filtered.filter((obs) => {
      const obsDate = parseISO(obs.date)
      const start = parseISO(startDate.value)

      if (!isValid(obsDate) || !isValid(start)) return true

      return isAfter(obsDate, start) || isEqual(obsDate, start)
    })
  } else if (endDate.value) {
    filtered = filtered.filter((obs) => {
      const obsDate = parseISO(obs.date)
      const end = parseISO(endDate.value)

      if (!isValid(obsDate) || !isValid(end)) return true

      return isBefore(obsDate, end) || isEqual(obsDate, end)
    })
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((obs) => {
      const text = (typeof obs.text === "string" ? obs.text : "").toLowerCase()
      const className = getClassName(obs.classId).toLowerCase()
      const author = (obs.author || "").toLowerCase()

      return text.includes(query) || className.includes(query) || author.includes(query)
    })
  }

  // Sort by newest first
  filtered.sort((a, b) => {
    const dateA = parseISO(a.date)
    const dateB = parseISO(b.date)

    if (!isValid(dateA) || !isValid(dateB)) return 0

    return dateB.getTime() - dateA.getTime()
  })

  return filtered
})

// Pagination calculations
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredObservations.value.length / itemsPerPage.value))
})

const paginationStart = computed(() => {
  return (currentPage.value - 1) * itemsPerPage.value
})

const paginationEnd = computed(() => {
  return Math.min(paginationStart.value + itemsPerPage.value, filteredObservations.value.length)
})

const paginatedObservations = computed(() => {
  return filteredObservations.value.slice(paginationStart.value, paginationEnd.value)
})

// Generate page numbers to display (show max 5 pages)
const pageNumbers = computed(() => {
  const maxPagesToShow = 5
  const pages = []

  if (totalPages.value <= maxPagesToShow) {
    // If total pages is less than maxPagesToShow, show all pages
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    // Always include first page
    pages.push(1)

    let startPage = Math.max(2, currentPage.value - 1)
    let endPage = Math.min(totalPages.value - 1, currentPage.value + 1)

    // Adjust if at the start or end
    if (currentPage.value <= 3) {
      endPage = Math.min(totalPages.value - 1, maxPagesToShow - 1)
    } else if (currentPage.value >= totalPages.value - 2) {
      startPage = Math.max(2, totalPages.value - maxPagesToShow + 2)
    }

    // Add ellipsis if needed
    if (startPage > 2) {
      pages.push("...")
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    // Add ellipsis if needed
    if (endPage < totalPages.value - 1) {
      pages.push("...")
    }

    // Always include last page
    pages.push(totalPages.value)
  }

  return pages
})

// Functions
async function refreshObservations() {
  loading.value = true
  error.value = null

  try {
    // Make sure classes are loaded
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses()
    } // Fetch all observations
    const authStore = useAuthStore()
    const teacherId = authStore.user?.uid || ""
    const allObservations = await attendanceStore.fetchAllObservationsForTeacher(teacherId)
    observations.value = allObservations

    // Reset pagination
    currentPage.value = 1
  } catch (err) {
    console.error("Error fetching observations:", err)
    error.value = "Ocurrió un error al cargar las observaciones. Por favor, intente nuevamente."
  } finally {
    loading.value = false
  }
}

function getClassName(classId) {
  if (!classId) return "Sin clase"
  const classObj = classesStore.getClassById(classId)
  return classObj ? classObj.name : `Clase ${classId}`
}

function formatDate(dateStr) {
  if (!dateStr) return "Sin fecha"

  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return dateStr

    return format(date, "d 'de' MMMM yyyy", {locale: es})
  } catch (err) {
    return dateStr
  }
}

function clearDateFilter() {
  startDate.value = ""
  endDate.value = ""
}

// Watchers
watch([selectedClassFilter, startDate, endDate, searchQuery], () => {
  currentPage.value = 1 // Reset pagination when filters change
})

// Initialize component
onMounted(() => {
  refreshObservations()
})
</script>

<style scoped>
.observation-text {
  max-height: 100px;
  overflow-y: auto;
}

/* Custom scrollbar for WebKit browsers */
.observation-text::-webkit-scrollbar {
  width: 4px;
}

.observation-text::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.observation-text::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.observation-text::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
