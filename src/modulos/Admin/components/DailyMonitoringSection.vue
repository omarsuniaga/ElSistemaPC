// src/modulos/Admin/components/DailyMonitoringSection.vue
<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
        <ChartBarIcon class="w-6 h-6 mr-2 text-blue-500" />
        Monitoreo Diario de Asistencia
      </h3>
      <div class="flex items-center space-x-3">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ formatDate(new Date()) }}
        </span>
        <RouterLink 
          to="/admin/monitoring" 
          class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
        >
          Ver Completo
          <ArrowRightIcon class="w-4 h-4 ml-1" />
        </RouterLink>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">        <div class="flex items-center">
          <div class="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
            <CheckIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div class="ml-3">
            <p class="text-lg font-semibold text-green-600 dark:text-green-400">{{ stats.present }}</p>
            <p class="text-xs text-green-600 dark:text-green-400">Presentes</p>
          </div>
        </div>
      </div>

      <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
        <div class="flex items-center">
          <div class="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
            <UserMinusIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div class="ml-3">
            <p class="text-lg font-semibold text-red-600 dark:text-red-400">{{ stats.absent }}</p>
            <p class="text-xs text-red-600 dark:text-red-400">Ausentes</p>
          </div>
        </div>
      </div>

      <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
        <div class="flex items-center">
          <div class="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
            <ClockIcon class="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div class="ml-3">
            <p class="text-lg font-semibold text-amber-600 dark:text-amber-400">{{ stats.late }}</p>
            <p class="text-xs text-amber-600 dark:text-amber-400">Tarde</p>
          </div>
        </div>
      </div>

      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div class="flex items-center">
          <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
            <DocumentCheckIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="ml-3">
            <p class="text-lg font-semibold text-blue-600 dark:text-blue-400">{{ attendanceRate }}%</p>
            <p class="text-xs text-blue-600 dark:text-blue-400">Asistencia</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de clases activas hoy -->
    <div v-if="todayClasses.length > 0">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Clases de Hoy</h4>
      <div class="space-y-3">
        <div 
          v-for="classItem in todayClasses.slice(0, 3)" 
          :key="classItem.id"
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div class="flex items-center">
            <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
              <AcademicCapIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h5 class="font-medium text-gray-900 dark:text-white">{{ classItem.name }}</h5>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ classItem.instrument }} - {{ classItem.level }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ classItem.time }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ classItem.studentCount || 0 }} estudiantes
            </p>
          </div>
        </div>

        <div v-if="todayClasses.length > 3" class="text-center">
          <RouterLink 
            to="/admin/monitoring" 
            class="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Ver todas las clases ({{ todayClasses.length }})
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Estado cuando no hay clases -->
    <div v-else class="text-center py-8">
      <AcademicCapIcon class="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        No hay clases programadas para hoy
      </p>
    </div>

    <!-- Alertas de ausencias -->
    <div v-if="absentStudents.length > 0" class="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
      <h4 class="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center">
        <ExclamationTriangleIcon class="w-4 h-4 mr-1" />
        Estudiantes Ausentes Hoy
      </h4>
      <div class="space-y-2">
        <div 
          v-for="student in absentStudents.slice(0, 3)" 
          :key="student.id"
          class="flex items-center justify-between text-sm"
        >
          <span class="text-amber-700 dark:text-amber-300">{{ student.name }}</span>
          <span class="text-amber-600 dark:text-amber-400">{{ student.className }}</span>
        </div>
        <div v-if="absentStudents.length > 3" class="text-xs text-amber-600 dark:text-amber-400">
          Y {{ absentStudents.length - 3 }} más...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ChartBarIcon,
  ArrowRightIcon,
  CheckIcon,
  UserMinusIcon,
  ClockIcon,
  DocumentCheckIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Tipos
interface AttendanceStats {
  present: number
  absent: number
  late: number
  justified: number
  total: number
}

interface TodayClass {
  id: string
  name: string
  instrument: string
  level: string
  time: string
  studentCount: number
}

interface AbsentStudent {
  id: string
  name: string
  className: string
}

// Estado reactivo
const stats = ref<AttendanceStats>({
  present: 0,
  absent: 0,
  late: 0,
  justified: 0,
  total: 0
})

const todayClasses = ref<TodayClass[]>([])
const absentStudents = ref<AbsentStudent[]>([])

// Computed
const attendanceRate = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.present / stats.value.total) * 100)
})

// Métodos
const formatDate = (date: Date) => {
  return format(date, 'EEEE, d MMMM yyyy', { locale: es })
}

const loadTodayData = async () => {
  try {
    // Simulación de datos - en una implementación real, esto vendría de Firebase
    // Basándose en datos reales de la aplicación
    
    // Estadísticas de asistencia del día
    stats.value = {
      present: 28,
      absent: 5,
      late: 3,
      justified: 2,
      total: 38
    }

    // Clases del día
    todayClasses.value = [
      {
        id: '1',
        name: 'Piano Básico A',
        instrument: 'Piano',
        level: 'Básico',
        time: '09:00 - 10:00',
        studentCount: 8
      },
      {
        id: '2',
        name: 'Guitarra Intermedio',
        instrument: 'Guitarra',
        level: 'Intermedio',
        time: '10:30 - 11:30',
        studentCount: 12
      },
      {
        id: '3',
        name: 'Canto Avanzado',
        instrument: 'Canto',
        level: 'Avanzado',
        time: '14:00 - 15:00',
        studentCount: 6
      },
      {
        id: '4',
        name: 'Violín Básico',
        instrument: 'Violín',
        level: 'Básico',
        time: '15:30 - 16:30',
        studentCount: 5
      },
      {
        id: '5',
        name: 'Batería Intermedio',
        instrument: 'Batería',
        level: 'Intermedio',
        time: '17:00 - 18:00',
        studentCount: 7
      }
    ]

    // Estudiantes ausentes
    absentStudents.value = [
      { id: '1', name: 'María González', className: 'Piano Básico A' },
      { id: '2', name: 'Carlos Mendoza', className: 'Guitarra Intermedio' },
      { id: '3', name: 'Ana Ruiz', className: 'Canto Avanzado' },
      { id: '4', name: 'Pedro López', className: 'Violín Básico' },
      { id: '5', name: 'Sofia Martinez', className: 'Batería Intermedio' }
    ]

  } catch (error) {
    console.error('Error loading today data:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadTodayData()
})
</script>

<style scoped>
/* Animaciones para las estadísticas */
.animate-count {
  animation: countUp 0.5s ease-out;
}

@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
