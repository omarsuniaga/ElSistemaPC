<template>
  <div class="student-conflict-analyzer">
    <!-- Header -->
    <div
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4"
    >
      <div class="flex items-center">
        <svg
          class="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100">
          Análisis de Conflictos de Estudiantes
        </h3>
      </div>
      <p class="text-sm text-blue-700 dark:text-blue-300 mt-2">
        Verificación automática: ningún alumno debe estar en más de una clase al mismo tiempo
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isValidating" class="flex items-center justify-center p-6">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <span class="ml-3 text-gray-600 dark:text-gray-400"
        >Analizando horarios de estudiantes...</span
      >
    </div>

    <!-- Results Summary -->
    <div v-else class="space-y-4">
      <!-- Overall Status -->
      <div class="p-4 rounded-lg border" :class="summaryClasses">
        <div class="flex items-start">
          <component :is="summaryIcon" class="h-6 w-6 mt-0.5 mr-3" :class="summaryIconClasses" />
          <div>
            <h4 class="font-medium" :class="summaryTextClasses">
              {{ formatStudentConflictSummary }}
            </h4>
            <p v-if="conflictSummary.length > 0" class="text-sm mt-1" :class="summaryTextClasses">
              {{ conflictSummary.join(" • ") }}
            </p>
          </div>
        </div>
      </div>

      <!-- Detailed Conflicts by Student -->
      <div v-if="hasStudentConflicts" class="space-y-3">
        <h4 class="font-medium text-gray-900 dark:text-gray-100">
          Conflictos Detallados por Estudiante:
        </h4>

        <div
          v-for="conflicted in conflictedStudents"
          :key="conflicted.studentId"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div class="flex items-start">
            <svg class="h-5 w-5 text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="flex-1">
              <h5 class="font-medium text-red-800 dark:text-red-300 mb-2">
                Estudiante: {{ getStudentNameFromConflict(conflicted.conflicts[0]) }}
              </h5>
              <ul class="space-y-1">
                <li
                  v-for="(conflict, index) in conflicted.conflicts"
                  :key="index"
                  class="text-sm text-red-700 dark:text-red-300"
                >
                  • {{ conflict.message }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Success State -->
      <div
        v-else-if="studentIds && studentIds.length > 0"
        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
      >
        <div class="flex items-center">
          <svg class="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="text-green-800 dark:text-green-300 font-medium">
            ✅ Todos los estudiantes pueden asistir sin conflictos de horario
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="hasStudentConflicts" class="flex gap-3 pt-4">
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          @click="analyzeAgain"
        >
          Analizar Nuevamente
        </button>
        <button
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          @click="showDetailedReport"
        >
          Ver Reporte Detallado
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, watch, onMounted} from "vue"
import {useStudentScheduleValidation} from "../composables/useStudentScheduleValidation"
import type {TimeSlot} from "../../../utils/scheduleConflicts"

const props = defineProps<{
  classId?: string
  studentIds?: string[]
  schedule?: {
    slots: TimeSlot[]
  }
  autoValidate?: boolean
}>()

const emit = defineEmits<{
  conflictsDetected: [hasConflicts: boolean, conflictCount: number]
  validationComplete: [result: any]
}>()

const {
  isValidating,
  hasStudentConflicts,
  conflictedStudents,
  conflictSummary,
  totalStudentConflicts,
  formatStudentConflictSummary,
  validateStudentConflicts,
  clearStudentValidation,
} = useStudentScheduleValidation()

// Computed styles based on validation state
const summaryClasses = computed(() => {
  if (hasStudentConflicts.value) {
    return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
  }
  return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
})

const summaryIcon = computed(() => {
  return hasStudentConflicts.value ? "svg" : "svg"
})

const summaryIconClasses = computed(() => {
  return hasStudentConflicts.value ? "text-red-500" : "text-green-500"
})

const summaryTextClasses = computed(() => {
  if (hasStudentConflicts.value) {
    return "text-red-800 dark:text-red-300"
  }
  return "text-green-800 dark:text-green-300"
})

// Helper function to extract student name from conflict
const getStudentNameFromConflict = (conflict: any) => {
  return conflict.conflictingEntity?.name || "Estudiante"
}

// Validation logic
const runValidation = async () => {
  if (!props.studentIds || props.studentIds.length === 0) {
    clearStudentValidation()
    return
  }

  const result = await validateStudentConflicts({
    id: props.classId,
    studentIds: props.studentIds,
    schedule: props.schedule,
  })

  emit("conflictsDetected", result.hasConflicts, totalStudentConflicts.value)
  emit("validationComplete", result)
}

// Actions
const analyzeAgain = () => {
  runValidation()
}

const showDetailedReport = () => {
  // Implementar modal o vista detallada
  console.log("Showing detailed report:", conflictedStudents.value)
}

// Watchers
watch(
  () => [props.studentIds, props.schedule],
  () => {
    if (props.autoValidate !== false) {
      runValidation()
    }
  },
  {deep: true}
)

// Initialize
onMounted(() => {
  if (props.autoValidate !== false) {
    runValidation()
  }
})

// Expose validation method for manual triggering
defineExpose({
  validate: runValidation,
  clearValidation: clearStudentValidation,
})
</script>

<style scoped>
.student-conflict-analyzer {
  /* Custom styles if needed */
}
</style>
