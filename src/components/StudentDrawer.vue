<template>
  <div
    class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity z-[100]"
    v-if="show"
    @click="$emit('close')"
  ></div>
  <div
    class="fixed inset-y-0 right-0 max-w-full flex z-[100] transform transition-all duration-300 ease-in-out"
    :class="{ 'translate-x-0': show, 'translate-x-full': !show }"
  >
    <div
      class="relative w-screen max-w-md bg-white dark:bg-gray-800 shadow-xl flex flex-col h-full"
      @click.stop
    >
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">Detalles del Alumno</h2>
        <button
          @click="$emit('close')"
          class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <span class="sr-only">Cerrar</span>
          <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto pb-16">
        <div v-if="isLoading" class="flex justify-center items-center h-full">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>

        <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {{ error }}
        </div>

        <div v-else-if="student" class="space-y-6">
          <!-- Student Profile -->
          <div class="flex items-center space-x-4">
            <img
              :src="student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.nombre}`"
              :alt="`${student.nombre} ${student.apellido}`"
              class="w-16 h-16 rounded-full"
            />
            <div>
              <h3 class="text-xl font-bold">{{ student.nombre }} {{ student.apellido }}</h3>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="grupo in student.grupo || []"
                  :key="grupo"
                  class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {{ grupo }}
                </span>
                <span
                  v-if="!student.grupo?.length"
                  class="px-2 py-0.5 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 rounded-full"
                >
                  Sin grupo asignado
                </span>
              </div>
            </div>
          </div>

          <!-- Student Info -->
          <div class="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-3">
            
      <!-- Action Buttons -->
      <div class="border-t border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-3 gap-3 mb-3">
          <button 
            @click="$emit('edit', student?.id)" 

            class="btn btn-outline-primary flex items-center justify-center dark:text-gray-800 dark:bg-gray-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar Alumno
          </button>
          <button 
            @click="viewProfile()" 
            class="btn btn-outline-secondary flex items-center justify-center  dark:text-gray-800 dark:bg-gray-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Ver Perfil
          </button>
          <button 
            @click="manageDocuments()" 
            class="btn btn-outline-info flex items-center justify-center  dark:text-gray-800 dark:bg-gray-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Documentos
          </button>
          <button 
            @click="viewSchedule()" 
            class="btn btn-outline-info flex items-center justify-center  dark:text-gray-800 dark:bg-gray-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Horario
          </button>
          
        </div>
      </div>
            <h4 class="font-medium">Información Personal</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
                
              <div>
                <span class="text-gray-500 dark:text-gray-400">Edad:</span>
                <span class="ml-1 font-medium">{{ student.edad || "No disponible" }} años</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Teléfono:</span>
                <span class="ml-1 font-medium">{{ student.tlf || "No disponible" }}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Email:</span>
                <span class="ml-1 font-medium">{{ student.email || "No disponible" }}</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Instrumento:</span>
                <span class="ml-1 font-medium">{{ student.instrumento || "Sin instrumento" }}</span>
              </div>
              <div class="col-span-2">
                <span class="text-gray-500 dark:text-gray-400">Fecha de inscripción:</span>
                <span class="ml-1 font-medium">{{ student.fecInscripcion || "No disponible" }}</span>
              </div>
            </div>
          </div>

          <!-- Attendance Analysis -->
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h4 class="font-medium">Análisis de Asistencia</h4>
            </div>
            <div class="p-4">
              <div v-if="attendanceStats">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Tasa de asistencia:</span>
                  <span 
                    class="font-bold" 
                    :class="{
                      'text-green-600 dark:text-green-400': attendanceRate >= 85,
                      'text-yellow-600 dark:text-yellow-400': attendanceRate >= 75 && attendanceRate < 85,
                      'text-red-600 dark:text-red-400': attendanceRate < 75
                    }"
                  >
                    {{ attendanceRate }}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                  <div 
                    class="h-2.5 rounded-full" 
                    :class="{
                      'bg-green-600': attendanceRate >= 85,
                      'bg-yellow-500': attendanceRate >= 75 && attendanceRate < 85,
                      'bg-red-600': attendanceRate < 75
                    }"
                    :style="{ width: `${attendanceRate}%` }"
                  ></div>
                </div>
                <div class="grid grid-cols-2 gap-3 text-center">
                  <div class="bg-green-100 dark:bg-green-900/30 p-2 rounded">
                    <div class="text-xl font-bold text-green-700 dark:text-green-400">{{ attendanceStats.present }}</div>
                    <div class="text-xs text-green-600 dark:text-green-500">Presentes</div>
                  </div>
                  <div class="bg-red-100 dark:bg-red-900/30 p-2 rounded">
                    <div class="text-xl font-bold text-red-700 dark:text-red-400">{{ attendanceStats.absent }}</div>
                    <div class="text-xs text-red-600 dark:text-red-500">Ausencias</div>
                  </div>
                  <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                    <div class="text-xl font-bold text-blue-700 dark:text-blue-400">{{ attendanceStats.justified }}</div>
                    <div class="text-xs text-blue-600 dark:text-blue-500">Justificadas</div>
                  </div>
                  <div class="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                    <div class="text-xl font-bold text-yellow-700 dark:text-yellow-400">{{ attendanceStats.late }}</div>
                    <div class="text-xs text-yellow-600 dark:text-yellow-500">Tardanzas</div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
                No hay datos de asistencia disponibles
              </div>
            </div>
          </div>

          <!-- Content Progress -->
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h4 class="font-medium">Progreso de Contenidos</h4>
            </div>
            <div class="p-4">
              <div v-if="contentProgress && contentProgress.length > 0">
                <div 
                  v-for="(content, index) in contentProgress" 
                  :key="index"
                  class="mb-3 last:mb-0"
                >
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium">{{ content.title }}</span>
                    <span class="text-sm font-bold">{{ content.progress }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      class="bg-primary-600 h-2 rounded-full" 
                      :style="{ width: `${content.progress}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
                No hay datos de progreso disponibles
              </div>
            </div>
          </div>

          <!-- Instrument Details -->
          <div v-if="student.instrumento" class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h4 class="font-medium">Detalles del Instrumento</h4>
            </div>
            <div class="p-4">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  <img 
                    :src="getInstrumentIcon(student.instrumento)" 
                    :alt="student.instrumento"
                    class="w-12 h-12"
                  />
                </div>
                <div>
                  <h5 class="font-medium">{{ student.instrumento }}</h5>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ getInstrumentDescription(student.instrumento) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Metrics -->
          <div class="mt-4 space-y-4">
            <div class="border-t pt-4">
              <h3 class="text-lg font-medium">Métricas de Rendimiento</h3>
              <div class="mt-2 space-y-2">
                <div class="flex justify-between">
                  <span>Rendimiento General:</span>
                  <span class="font-medium">{{ studentPerformance }}%</span>
                </div>
                <div class="flex justify-between">
                  <span>Asistencia:</span>
                  <span class="font-medium">{{ studentAttendance }}%</span>
                </div>
                <div class="flex justify-between">
                  <span>Último Acceso:</span>
                  <span class="font-medium">{{ lastAccess }}</span>
                </div>
              </div>
            </div>

            <div v-if="riskFactors.length > 0" class="border-t pt-4">
              <h3 class="text-lg font-medium">Factores de Riesgo</h3>
              <ul class="mt-2 list-disc list-inside">
                <li v-for="(factor, index) in riskFactors" :key="index">
                  {{ factor }}
                </li>
              </ul>
            </div>

            <div v-if="recommendedActions.length > 0" class="border-t pt-4">
              <h3 class="text-lg font-medium">Acciones Recomendadas</h3>
              <ul class="mt-2 list-disc list-inside">
                <li v-for="(action, index) in recommendedActions" :key="index">
                  {{ action }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Student, AttendanceRecord } from '../types'
import * as attendanceService from '../services/firestore/attendance'
import { useStudentsStore } from '../stores/students';
import { useAttendanceStore } from '../stores/attendance';
import { useAnalyticsStore } from '../stores/analytics';
import { useRouter } from 'vue-router'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  student: {
    type: Object,
    default: null
  },
  studentId: {
    type: String,
    default: ''
  },
  // Nueva prop para datos de análisis del estudiante
  studentAnalytics: {
    type: Object,
    default: () => ({
      performance: 0,
      attendance: 0,
      lastAccess: '',
      riskFactors: [],
      recommendedActions: []
    })
  }
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', id: string): void
  (e: 'view-profile', id: string): void
  (e: 'manage-documents', id: string): void
}>()

const isLoading = ref(false)
const error = ref<string | null>(null)
const attendanceRecords = ref<AttendanceRecord[]>([])
const contentProgress = ref<{ title: string; progress: number }[]>([])

// Computed attendance stats
const attendanceStats = computed(() => {
  if (!attendanceRecords.value.length) return null
  
  return {
    total: attendanceRecords.value.length,
    present: attendanceRecords.value.filter(r => r.status === 'Presente').length,
    absent: attendanceRecords.value.filter(r => r.status === 'Ausente').length,
    justified: attendanceRecords.value.filter(r => r.status === 'Justificado').length,
    late: attendanceRecords.value.filter(r => r.status === 'Tardanza').length
  }
})

// Computed attendance rate
const attendanceRate = computed(() => {
  if (!attendanceStats.value) return 0
  const { total, present, justified } = attendanceStats.value
  return Math.round(((present + justified) / total) * 100)
})

// Load student data when student changes
watch(() => props.student, async (newStudent) => {
  if (newStudent) {
    await loadStudentData(newStudent.id)
  }
}, { immediate: true })

// Load student attendance and content data
async function loadStudentData(studentId: string) {
  isLoading.value = true
  error.value = null
  
  try {
    // Load attendance records
    const records = await fetchStudentAttendance(studentId)
    attendanceRecords.value = records
    
    // Mock content progress data (replace with actual API call when available)
    contentProgress.value = [
      { title: 'Teoría Musical', progress: Math.floor(Math.random() * 100) },
      { title: 'Técnica', progress: Math.floor(Math.random() * 100) },
      { title: 'Repertorio', progress: Math.floor(Math.random() * 100) },
      { title: 'Lectura a primera vista', progress: Math.floor(Math.random() * 100) }
    ]
  } catch (err: any) {
    console.error('Error loading student data:', err)
    error.value = err.message || 'Error al cargar los datos del estudiante'
  } finally {
    isLoading.value = false
  }
}

// Fetch student attendance records
async function fetchStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
  try {
    // Get all attendance records
    const allRecords = await attendanceService.getAttendancesFirebase()
    // Filter by student ID
    return allRecords.filter(record => record.studentId === studentId)
  } catch (err) {
    console.error('Error fetching attendance:', err)
    throw err
  }
}

// Get instrument icon based on instrument name
function getInstrumentIcon(instrument: string): string {
  const instruments: Record<string, string> = {
    'Piano': 'https://cdn-icons-png.flaticon.com/512/3119/3119718.png',
    'Guitarra': 'https://cdn-icons-png.flaticon.com/512/3079/3079213.png',
    'Violín': 'https://cdn-icons-png.flaticon.com/512/3079/3079267.png',
    'Flauta': 'https://cdn-icons-png.flaticon.com/512/3079/3079183.png',
    'Batería': 'https://cdn-icons-png.flaticon.com/512/3079/3079218.png',
    'Saxofón': 'https://cdn-icons-png.flaticon.com/512/3079/3079257.png',
    'Trompeta': 'https://cdn-icons-png.flaticon.com/512/3079/3079264.png',
    'Violonchelo': 'https://cdn-icons-png.flaticon.com/512/3079/3079268.png'
  }
  
  return instruments[instrument] || 'https://cdn-icons-png.flaticon.com/512/3079/3079165.png'
}

// Get instrument description
function getInstrumentDescription(instrument: string): string {
  const descriptions: Record<string, string> = {
    'Piano': 'Instrumento de teclado con amplio rango tonal',
    'Guitarra': 'Instrumento de cuerda pulsada versátil',
    'Violín': 'Instrumento de cuerda frotada de registro agudo',
    'Flauta': 'Instrumento de viento-madera de sonido brillante',
    'Batería': 'Conjunto de instrumentos de percusión',
    'Saxofón': 'Instrumento de viento-madera con lengüeta simple',
    'Trompeta': 'Instrumento de viento-metal brillante',
    'Violonchelo': 'Instrumento de cuerda frotada de registro grave'
  }
  
  return descriptions[instrument] || 'Instrumento musical'
}

// Function to view detailed profile
function viewProfile() {
  if (props.student?.id) {
    emit('view-profile', props.student.id)
  }
}

// Function to manage student documents
function manageDocuments() {
  if (props.student?.id) {
    emit('manage-documents', props.student.id)
  }
}

// Nuevas propiedades calculadas
const studentsStore = useStudentsStore();
const attendanceStore = useAttendanceStore();
const analyticsStore = useAnalyticsStore();

const studentPerformance = computed(() => {
  // Usar datos de la prop si están disponibles
  if (props.studentAnalytics && props.studentAnalytics.performance !== undefined) {
    return props.studentAnalytics.performance;
  }
  
  // Fallback a cálculos anteriores o valor por defecto
  // ...código existente para calcular el rendimiento si es necesario...
  return 0;
});

const studentAttendance = computed(() => {
  // Usar datos de la prop si están disponibles
  if (props.studentAnalytics && props.studentAnalytics.attendance !== undefined) {
    return props.studentAnalytics.attendance;
  }
  
  // Fallback a cálculos anteriores o valor por defecto
  // ...código existente para calcular asistencia si es necesario...
  return 0;
});

const lastAccess = computed(() => {
  // Usar datos de la prop si están disponibles
  if (props.studentAnalytics && props.studentAnalytics.lastAccess) {
    return props.studentAnalytics.lastAccess;
  }
  
  // Fallback
  return 'No registrado';
});

const riskFactors = computed(() => {
  // Usar datos de la prop si están disponibles
  if (props.studentAnalytics && props.studentAnalytics.riskFactors) {
    return props.studentAnalytics.riskFactors;
  }
  
  return [];
});

const recommendedActions = computed(() => {
  // Usar datos de la prop si están disponibles
  if (props.studentAnalytics && props.studentAnalytics.recommendedActions) {
    return props.studentAnalytics.recommendedActions;
  }
  
  return [];
});

// Agregar el router
const router = useRouter()

// Agregar la función viewSchedule
const viewSchedule = () => {
  if (props.student && props.student.id) {
    router.push(`/student-schedule/${props.student.id}`)
  } else {
    console.error('No se puede mostrar el horario: ID de estudiante no disponible')
  }
}
</script>