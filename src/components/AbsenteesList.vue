<!-- components/AbsenteesList.vue -->

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { format, parseISO, differenceInDays, differenceInWeeks, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { useStudentsStore } from "../modulos/Students/store/students"
import { useAttendanceStore } from '../modulos/Attendance/store/attendance'

// Definición de propiedades (props) del componente
const props = defineProps<{
  className?: string
  limit?: number
}>()

const studentsStore = useStudentsStore()
const attendanceStore = useAttendanceStore()

// Track which groups are expanded
const expandedGroups = ref({
  critical: true,
  concerning: true,
  moderate: false
})

// Date range selection with default values set immediately
const dateRanges = {
  '7d': 'Últimos 7 días',
  '14d': 'Últimos 14 días',
  '30d': 'Últimos 30 días',
  'month': 'Este mes',
  'prevMonth': 'Mes anterior',
  'custom': 'Personalizado'
}

// Initialize with a default value that's guaranteed to exist
const selectedDateRange = ref('30d')
const today = new Date()
const customDateRange = ref({
  start: format(subDays(today, 30), 'yyyy-MM-dd'),
  end: format(today, 'yyyy-MM-dd')
})

const showDateRangePicker = ref(false)

// Add defensive logic to ensure actualDateRange always returns an object with a label
const actualDateRange = computed(() => {
  if (!selectedDateRange.value || !dateRanges[selectedDateRange.value]) {
    // Return a default if selectedDateRange is invalid
    return {
      start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd'),
      label: 'Últimos 30 días' // Default label
    };
  }

  const today = new Date()
  let start, end

  try {
    switch (selectedDateRange.value) {
      case '7d':
        start = subDays(today, 7)
        end = today
        break
      case '14d':
        start = subDays(today, 14)
        end = today
        break
      case '30d':
        start = subDays(today, 30)
        end = today
        break
      case 'month':
        start = startOfMonth(today)
        end = endOfMonth(today)
        break
      case 'prevMonth':
        const lastMonth = subMonths(today, 1)
        start = startOfMonth(lastMonth)
        end = endOfMonth(lastMonth)
        break
      case 'custom':
        // Add validation to ensure custom dates are valid
        start = parseISO(customDateRange.value?.start || format(subDays(today, 30), 'yyyy-MM-dd'))
        end = parseISO(customDateRange.value?.end || format(today, 'yyyy-MM-dd'))
        if (!isValid(start) || !isValid(end)) {
          console.error('Invalid custom date range', customDateRange.value)
          start = subDays(today, 30)
          end = today
        }
        break
      default:
        start = subDays(today, 30)
        end = today
    }

    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      label: selectedDateRange.value === 'custom' 
        ? `${format(start, 'P', { locale: es })} - ${format(end, 'P', { locale: es })}`
        : dateRanges[selectedDateRange.value] || 'Periodo personalizado'
    }
  } catch (err) {
    console.error('Error calculating date range:', err)
    // Return safe fallback values
    return {
      start: format(subDays(today, 30), 'yyyy-MM-dd'),
      end: format(today, 'yyyy-MM-dd'),
      label: 'Últimos 30 días'
    }
  }
})

// Apply custom date range
function applyCustomRange() {
  selectedDateRange.value = 'custom'
  showDateRangePicker.value = false
  fetchAbsenceData()
}

// Toggle group expansion
const toggleGroup = (group) => {
  expandedGroups.value[group] = !expandedGroups.value[group]
}

// Attendance data state
const absenceData = ref([])
const isLoading = ref(false)
const error = ref(null)

// Fetch attendance data with date range
async function fetchAbsenceData() {
  isLoading.value = true
  error.value = null
  
  try {
    const { start, end } = actualDateRange.value
    // Use the AttendanceStore to get data within the specified date range
    const data = await attendanceStore.getStudentAbsencesByDateRange(
      start, 
      end, 
      props.className,
      props.limit ? props.limit * 3 : 15
    )
    absenceData.value = data
  } catch (err) {
    console.error('Error fetching absence data:', err)
    error.value = err.message || 'Error al obtener datos de ausencia'
  } finally {
    isLoading.value = false
  }
}

// Watch for date range changes to refresh data
watch(selectedDateRange, fetchAbsenceData)

// Group students by absence severity
const groupedAbsentStudents = computed(() => {
  const today = new Date()
  
  // Group students into categories
  const groups = {
    critical: [], // Students with many absences or long time since last attendance
    concerning: [], // Students with moderate absences 
    moderate: [] // Students with few absences
  }
  
  absenceData.value.forEach(student => {
    const attendanceRate = getAttendanceRate(student.studentId)
    const daysSinceLastAttendance = differenceInDays(today, parseISO(student.lastAttendance))
    const absenceRatio = student.absences / differenceInWeeks(today, parseISO(actualDateRange.value.start))
    
    // Updated thresholds to include specific absence counts:
    // - Critical: 6+ absences or attendance < 50% or 30+ days since last attendance
    // - Concerning: 4-5 absences or attendance < 75% or 14+ days since last attendance
    // - Moderate: fewer than 4 absences and better metrics
    if (student.absences >= 6 || attendanceRate < 50 || daysSinceLastAttendance > 30) {
      groups.critical.push(student)
    } else if (student.absences >= 4 || attendanceRate < 75 || daysSinceLastAttendance > 14) {
      groups.concerning.push(student)
    } else {
      groups.moderate.push(student)
    }
  })
  
  return groups
})

// Count students in each group
const groupCounts = computed(() => ({
  critical: groupedAbsentStudents.value.critical.length,
  concerning: groupedAbsentStudents.value.concerning.length,
  moderate: groupedAbsentStudents.value.moderate.length,
  total: absenceData.value.length
}))

// Funciones para obtener información del estudiante y tasa de asistencia
const getStudent = (studentId: string) =>
  studentsStore.students.find(s => s.id === studentId)

const getAttendanceRate = (studentId: string) => {
  if (props.className) {
    return attendanceStore.getStudentAttendanceRate(studentId, props.className, actualDateRange.value.start, actualDateRange.value.end)
  }
  return attendanceStore.getStudentAttendanceRate(studentId, undefined, actualDateRange.value.start, actualDateRange.value.end)
}

// Función para formatear la fecha
const formatDate = (date: string) =>
  format(parseISO(date), 'PPP', { locale: es })

// Función para obtener la clase de estilo según la tasa de asistencia
const getAttendanceRateClass = (rate: number) => {
  if (rate >= 90) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
  if (rate >= 75) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
  return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
}

// Get style for absence level indicator
const getAbsenceSeverityClass = (level) => {
  switch(level) {
    case 'critical': return 'bg-red-600 dark:bg-red-700'
    case 'concerning': return 'bg-orange-500 dark:bg-orange-600'
    case 'moderate': return 'bg-yellow-400 dark:bg-yellow-500'
    default: return 'bg-gray-400 dark:bg-gray-500'
  }
}

// Ensure data is fetched on mount with proper error handling
onMounted(() => {
  try {
    fetchAbsenceData();
  } catch (error) {
    console.error("Error loading absence data:", error);
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Alumnos con Mayor Ausencia</h3>
      
      <!-- Date range selection with null check -->
      <div class="relative">
        <button 
          @click="showDateRangePicker = !showDateRangePicker" 
          class="flex items-center gap-1 text-sm px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <!-- Add null check to prevent "Cannot read properties of undefined" error -->
          <span>{{ actualDateRange?.label || 'Seleccionar periodo' }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <!-- Date range dropdown -->
        <div v-show="showDateRangePicker" class="absolute right-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg z-50">
          <div class="p-3 space-y-3">
            <div class="space-y-2">
              <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Seleccionar período</label>
              <div class="grid grid-cols-2 gap-2">
                <button 
                  v-for="(label, key) in dateRanges" 
                  :key="key" 
                  @click="selectedDateRange = key; key !== 'custom' && (showDateRangePicker = false)"
                  :class="[
                    'px-2 py-1 text-xs rounded border',
                    selectedDateRange === key 
                      ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300' 
                      : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ label }}
                </button>
              </div>
            </div>
            
            <!-- Custom date range picker -->
            <div v-if="selectedDateRange === 'custom'" class="space-y-2">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Inicio</label>
                  <input 
                    type="date" 
                    v-model="customDateRange.start"
                    class="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800" 
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fin</label>
                  <input 
                    type="date" 
                    v-model="customDateRange.end"
                    class="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800" 
                  />
                </div>
              </div>
              <button 
                @click="applyCustomRange"
                class="w-full px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center items-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-md flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>{{ error }}</span>
      <button @click="fetchAbsenceData" class="ml-auto text-blue-600 dark:text-blue-400 underline text-sm">Reintentar</button>
    </div>
    
    <div v-else>
      <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Total: {{ groupCounts.total }} estudiantes con ausencias 
        ({{ groupCounts.critical }} críticas, {{ groupCounts.concerning }} preocupantes, {{ groupCounts.moderate }} moderadas)
      </div>
      
      <!-- Critical Absences Group -->
      <div v-if="groupCounts.critical > 0" class="border border-red-200 dark:border-red-900 rounded-lg overflow-hidden mb-3">
        <div 
          @click="toggleGroup('critical')" 
          class="bg-red-50 dark:bg-red-900/20 p-3 cursor-pointer flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <span class="h-3 w-3 rounded-full bg-red-600"></span>
            <h4 class="font-medium text-red-800 dark:text-red-200">Ausencias Críticas ({{ groupCounts.critical }})</h4>
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-4 w-4 text-red-600 dark:text-red-400"
            :class="{'transform rotate-180': expandedGroups.critical}"
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </div>
        
        <div v-show="expandedGroups.critical" class="space-y-2 p-2">
          <div
            v-for="student in groupedAbsentStudents.critical"
            :key="student.studentId"
            class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="relative">
                  <img
                    :src="getStudent(student.studentId)?.avatar || '/assets/default-avatar.png'"
                    :alt="getStudent(student.studentId)?.nombre"
                    class="w-10 h-10 rounded-full border-2 border-red-500"
                  />
                  <span class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600"></span>
                </div>
                <div>
                  <p class="font-medium">
                    {{ getStudent(student.studentId)?.nombre }}
                    {{ getStudent(student.studentId)?.apellido }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ getStudent(student.studentId)?.clase }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-red-600 dark:text-red-400">
                  {{ student.absences }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">ausencias</p>
              </div>
            </div>

            <div class="mt-2 pt-2 border-t dark:border-gray-700">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Última asistencia: {{ formatDate(student.lastAttendance) }}
              </p>
              <div class="mt-1 flex gap-2">
                <span
                  class="px-2 py-1 text-xs rounded-full"
                  :class="getAttendanceRateClass(getAttendanceRate(student.studentId))"
                >
                  {{ Math.round(getAttendanceRate(student.studentId)) }}% asistencia
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Concerning Absences Group -->
      <div v-if="groupCounts.concerning > 0" class="border border-orange-200 dark:border-orange-900/50 rounded-lg overflow-hidden mb-3">
        <div 
          @click="toggleGroup('concerning')" 
          class="bg-orange-50 dark:bg-orange-900/20 p-3 cursor-pointer flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <span class="h-3 w-3 rounded-full bg-orange-500"></span>
            <h4 class="font-medium text-orange-800 dark:text-orange-200">Ausencias Preocupantes ({{ groupCounts.concerning }})</h4>
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-4 w-4 text-orange-600 dark:text-orange-400"
            :class="{'transform rotate-180': expandedGroups.concerning}"
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </div>
        
        <div v-show="expandedGroups.concerning" class="space-y-2 p-2">
          <div
            v-for="student in groupedAbsentStudents.concerning"
            :key="student.studentId"
            class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="relative">
                  <img
                    :src="getStudent(student.studentId)?.avatar || '/assets/default-avatar.png'"
                    :alt="getStudent(student.studentId)?.nombre"
                    class="w-10 h-10 rounded-full border-2 border-orange-400"
                  />
                  <span class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500"></span>
                </div>
                <div>
                  <p class="font-medium">
                    {{ getStudent(student.studentId)?.nombre }}
                    {{ getStudent(student.studentId)?.apellido }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ getStudent(student.studentId)?.clase }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {{ student.absences }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">ausencias</p>
              </div>
            </div>

            <div class="mt-2 pt-2 border-t dark:border-gray-700">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Última asistencia: {{ formatDate(student.lastAttendance) }}
              </p>
              <div class="mt-1 flex gap-2">
                <span
                  class="px-2 py-1 text-xs rounded-full"
                  :class="getAttendanceRateClass(getAttendanceRate(student.studentId))"
                >
                  {{ Math.round(getAttendanceRate(student.studentId)) }}% asistencia
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Moderate Absences Group -->
      <div v-if="groupCounts.moderate > 0" class="border border-yellow-200 dark:border-yellow-900/50 rounded-lg overflow-hidden">
        <div 
          @click="toggleGroup('moderate')" 
          class="bg-yellow-50 dark:bg-yellow-900/20 p-3 cursor-pointer flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <span class="h-3 w-3 rounded-full bg-yellow-400"></span>
            <h4 class="font-medium text-yellow-800 dark:text-yellow-200">Ausencias Moderadas ({{ groupCounts.moderate }})</h4>
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-4 w-4 text-yellow-600 dark:text-yellow-400"
            :class="{'transform rotate-180': expandedGroups.moderate}"
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </div>
        
        <div v-show="expandedGroups.moderate" class="space-y-2 p-2">
          <div
            v-for="student in groupedAbsentStudents.moderate"
            :key="student.studentId"
            class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="relative">
                  <img
                    :src="getStudent(student.studentId)?.avatar || '/assets/default-avatar.png'"
                    :alt="getStudent(student.studentId)?.nombre"
                    class="w-10 h-10 rounded-full border-2 border-yellow-400"
                  />
                  <span class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-400"></span>
                </div>
                <div>
                  <p class="font-medium">
                    {{ getStudent(student.studentId)?.nombre }}
                    {{ getStudent(student.studentId)?.apellido }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ getStudent(student.studentId)?.clase }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {{ student.absences }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">ausencias</p>
              </div>
            </div>

            <div class="mt-2 pt-2 border-t dark:border-gray-700">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Última asistencia: {{ formatDate(student.lastAttendance) }}
              </p>
              <div class="mt-1 flex gap-2">
                <span
                  class="px-2 py-1 text-xs rounded-full"
                  :class="getAttendanceRateClass(getAttendanceRate(student.studentId))"
                >
                  {{ Math.round(getAttendanceRate(student.studentId)) }}% asistencia
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty state -->
      <div v-if="groupCounts.total === 0" class="text-center p-8 text-gray-500 dark:text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 opacity-30" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <p>No hay estudiantes con ausencias en el período seleccionado</p>
      </div>
    </div>
  </div>
</template>
