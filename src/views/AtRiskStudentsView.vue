<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useStudentsStore } from '../stores/students'
import { useAttendanceStore } from '../stores/attendance'
import { useAnalyticsStore } from '../stores/analytics'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  ExclamationTriangleIcon, 
  CalendarIcon, 
  MusicalNoteIcon, 
  BookOpenIcon, 
  ClockIcon 
} from '@heroicons/vue/24/outline'

// Stores
const studentsStore = useStudentsStore()
const attendanceStore = useAttendanceStore()
const analyticsStore = useAnalyticsStore()

// Estado de la UI
const isLoading = ref(true)
const atRiskStudents = computed(() => analyticsStore.studentMetrics.atRiskStudents || [])

// Factores de riesgo y sus pesos
const riskFactors = reactive({
  attendance: { 
    weight: 30,
    threshold: 75,
    label: 'Asistencia'
  },
  musicalLanguage: { 
    weight: 20,
    threshold: 70,
    label: 'Lenguaje Musical'
  },
  basicConcepts: { 
    weight: 15, 
    threshold: 70,
    label: 'Conceptos Básicos'
  },
  weeklyActivities: { 
    weight: 10,
    threshold: 2,
    label: 'Actividades Semanales'
  },
  instrumentMastery: { 
    weight: 15,
    threshold: 65,
    label: 'Dominio del Instrumento'
  },
  repertoireMastery: { 
    weight: 10,
    threshold: 60,
    label: 'Dominio del Repertorio'
  }
})

// Método para calcular el nivel de riesgo
const calculateRiskLevel = (performance: number, attendance: number) => {
  if (performance < 60 || attendance < 70) return 'Alto'
  if (performance < 75 || attendance < 85) return 'Medio'
  return 'Bajo'
}

// Cargar los datos de análisis
onMounted(async () => {
  try {
    await analyticsStore.fetchAnalytics()
    isLoading.value = false
  } catch (error) {
    console.error('Error al cargar los datos:', error)
  }
})

// Identificar factores de riesgo específicos para un estudiante
const identifyRiskFactors = (student) => {
  const factors = []
  
  // Verificar asistencia
  if (student.attendance < riskFactors.attendance.threshold) {
    factors.push({
      factor: 'Baja asistencia',
      value: `${student.attendance}%`,
      threshold: `${riskFactors.attendance.threshold}%`,
      icon: CalendarIcon,
      suggestion: 'Programar reunión para discutir dificultades de asistencia'
    })
  }
  
  // Verificar lenguaje musical
  if (student.musicalLanguage < riskFactors.musicalLanguage.threshold) {
    factors.push({
      factor: 'Bajo nivel en lenguaje musical',
      value: `${student.musicalLanguage}%`,
      threshold: `${riskFactors.musicalLanguage.threshold}%`,
      icon: MusicalNoteIcon,
      suggestion: 'Ofrecer material complementario y clases de refuerzo'
    })
  }
  
  // Verificar conceptos básicos
  if (student.basicConcepts < riskFactors.basicConcepts.threshold) {
    factors.push({
      factor: 'Debilidad en conceptos básicos',
      value: `${student.basicConcepts}%`,
      threshold: `${riskFactors.basicConcepts.threshold}%`,
      icon: BookOpenIcon,
      suggestion: 'Asignar tutor para nivelación en conceptos fundamentales'
    })
  }
  
  // Verificar factores específicos para estudiantes con instrumento
  if (student.hasInstrument) {
    // Verificar actividades semanales
    if (student.weeklyActivities < riskFactors.weeklyActivities.threshold) {
      factors.push({
        factor: 'Pocas actividades semanales',
        value: `${student.weeklyActivities}`,
        threshold: `${riskFactors.weeklyActivities.threshold}`,
        icon: ClockIcon,
        suggestion: 'Incrementar actividades prácticas y seguimiento de horario'
      })
    }
    
    // Verificar dominio del instrumento
    if (student.instrumentMastery < riskFactors.instrumentMastery.threshold) {
      factors.push({
        factor: 'Bajo dominio del instrumento',
        value: `${student.instrumentMastery}%`,
        threshold: `${riskFactors.instrumentMastery.threshold}%`,
        icon: MusicalNoteIcon,
        suggestion: 'Evaluar dificultades técnicas específicas y adaptar ejercicios'
      })
    }
    
    // Verificar dominio del repertorio
    if (student.repertoireMastery < riskFactors.repertoireMastery.threshold) {
      factors.push({
        factor: 'Bajo dominio del repertorio',
        value: `${student.repertoireMastery}%`,
        threshold: `${riskFactors.repertoireMastery.threshold}%`,
        icon: BookOpenIcon,
        suggestion: 'Ajustar repertorio al nivel actual y establecer plan progresivo'
      })
    }
  }
  
  return factors
}
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Análisis de Estudiantes en Riesgo
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Monitoreo y seguimiento de estudiantes que requieren atención especial
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>

    <!-- Contenido principal -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="student in atRiskStudents" 
        :key="student.id" 
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
      >
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ student.name }}
          </h3>
          <span 
            :class="{
              'px-2 py-1 text-sm rounded-full': true,
              'bg-red-100 text-red-800': calculateRiskLevel(student.performance, student.attendance) === 'Alto',
              'bg-yellow-100 text-yellow-800': calculateRiskLevel(student.performance, student.attendance) === 'Medio',
              'bg-green-100 text-green-800': calculateRiskLevel(student.performance, student.attendance) === 'Bajo'
            }"
          >
            Riesgo {{ calculateRiskLevel(student.performance, student.attendance) }}
          </span>
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Rendimiento:</span>
            <span class="font-medium">{{ student.performance }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Asistencia:</span>
            <span class="font-medium">{{ student.attendance }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Último acceso:</span>
            <span class="font-medium">{{ student.lastAccess }}</span>
          </div>
          
          <div class="mt-4">
            <h4 class="font-medium mb-2">Factores de riesgo:</h4>
            <ul class="list-disc list-inside text-gray-600 dark:text-gray-400">
              <li v-for="(factor, index) in student.riskFactors" :key="index">
                {{ factor }}
              </li>
            </ul>
          </div>
          
          <div class="mt-4">
            <h4 class="font-medium mb-2">Acciones recomendadas:</h4>
            <ul class="list-disc list-inside text-gray-600 dark:text-gray-400">
              <li v-for="(action, index) in student.recommendedActions" :key="index">
                {{ action }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos del componente si son necesarios */
</style>
