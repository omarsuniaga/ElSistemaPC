<template>
  <div class="class-observations-container">
    <h1 class="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
      Observaciones por Clase
    </h1>

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
        @click="fetchAllObservations"
      >
        Reintentar
      </button>
    </div>

    <!-- No observations state -->
    <div v-else-if="observations.length === 0" class="text-center py-12">
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
        No hay observaciones registradas
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mt-2">
        No se encontraron observaciones para ninguna de las clases.
      </p>
    </div>

    <!-- Filter controls -->
    <div v-else class="mb-6 flex flex-wrap gap-4">
      <div class="flex-grow">
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
          <option v-for="classItem in uniqueClasses" :key="classItem" :value="classItem">
            {{ getClassName(classItem) }}
          </option>
        </select>
      </div>

      <div class="flex-grow">
        <label
          for="date-filter"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Filtrar por fecha</label
        >
        <div class="flex items-center gap-2">
          <input
            id="date-filter"
            v-model="selectedDateFilter"
            type="date"
            class="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            v-if="selectedDateFilter"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            @click="selectedDateFilter = ''"
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
    </div>

    <!-- Observations list -->
    <div v-if="filteredObservations.length > 0" class="space-y-8">
      <div
        v-for="(classObservations, classId) in groupedObservations"
        :key="classId"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
      >
        <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 mr-2 text-blue-500"
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
          {{ getClassName(classId) }}
        </h2>

        <div class="mt-4 space-y-4">
          <div
            v-for="observation in classObservations"
            :key="observation.id"
            class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500"
          >
            <div class="flex justify-between mb-2">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
                {{ formatDate(observation.fecha) }}
              </span>
              <span
                class="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full"
              >
                {{ getTeacherName(observation.author) }}
              </span>
            </div>
            <p class="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {{ observation.content.text }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- No matching observations with filters -->
    <div v-else-if="observations.length > 0" class="text-center py-12">
      <div class="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 text-yellow-500 mx-auto mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p class="text-yellow-800 dark:text-yellow-200">
          No se encontraron observaciones con los filtros seleccionados.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {format} from "date-fns"
import {es} from "date-fns/locale"
import {useAttendanceStore} from "../store/attendance"
import {useClassesStore} from "../../Classes/store/classes"
import {useTeachersStore} from "../../Teachers/store/teachers" // Import teachers store
import type {ClassObservation} from "../types/attendance"

// Stores
const attendanceStore = useAttendanceStore()
const classesStore = useClassesStore()
const teachersStore = useTeachersStore() // Instantiate teachers store

// Function to get teacher name from teacher ID
const getTeacherName = (teacherId: string): string => {
  if (!teacherId) return "Usuario no registrado"

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
  return teacherId || "Usuario no registrado"
}

// State
const observations = ref<ClassObservation[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const selectedClassFilter = ref("")
const selectedDateFilter = ref("")

// Fetch all observations on component mount
onMounted(() => {
  fetchAllObservations()
})

// Fetch observations from all classes
async function fetchAllObservations() {
  loading.value = true
  error.value = null
  observations.value = []

  try {
    // Get all classes
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses()
    }
    // Fetch all observations in one call
    const allObservations = await attendanceStore.fetchAllObservationsForTeacher("")
    if (allObservations.length > 0) {
      observations.value = allObservations
    }
  } catch (err) {
    console.error("Error fetching all observations:", err)
    error.value = "Ocurrió un error al cargar las observaciones. Por favor, intente nuevamente."
  } finally {
    loading.value = false
  }
}

// Get unique class IDs from all observations
const uniqueClasses = computed(() => {
  return [...new Set(observations.value.map((obs) => obs.classId))]
})

// Filter observations based on selected class and date
const filteredObservations = computed(() => {
  return observations.value.filter((obs) => {
    let matchesClass = true
    let matchesDate = true

    if (selectedClassFilter.value) {
      matchesClass = obs.classId === selectedClassFilter.value
    }
    if (selectedDateFilter.value) {
      matchesDate = obs.fecha === selectedDateFilter.value
    }

    return matchesClass && matchesDate
  })
})

// Group observations by classId for display
const groupedObservations = computed(() => {
  const grouped: Record<string, ClassObservation[]> = {}

  filteredObservations.value.forEach((obs) => {
    if (!grouped[obs.classId]) {
      grouped[obs.classId] = []
    }
    grouped[obs.classId].push(obs)
  })
  // Sort observations by date (newest first)
  for (const classId in grouped) {
    grouped[classId].sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    })
  }

  return grouped
})

// Helper to get class name from classId
function getClassName(classId: string): string {
  const classData = classesStore.getClassById(classId)
  return classData ? classData.name : `Clase ${classId}`
}

// Format date for display
function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), "d 'de' MMMM yyyy", {locale: es})
  } catch (err) {
    return dateString || "Fecha desconocida"
  }
}
</script>

<style scoped>
.class-observations-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 768px) {
  .class-observations-container {
    padding: 2rem;
  }
}
</style>
