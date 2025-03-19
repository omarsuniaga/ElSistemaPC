<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { auth, db } from '../firebase'
import { doc, getDoc, DocumentData } from 'firebase/firestore'

// Define the UpcomingClass interface
interface UpcomingClass {
  id: string;
  title: string;
  date: Date;
  time: string;
  teacher: string;
  students: number;
  room: string;
}

// Define interfaces for analytics data
interface BestAttendanceClass {
  id: string;
  name: string;
  total: number;
  attendanceRate: number;
}

// Importación de componentes
import DashboardHeader from '../components/DashboardHeader.vue'
import StatsCard from '../components/StatsCard.vue'
import PerformanceKpi from '../components/PerformanceKpi.vue'
import UpcomingClassesList from '../components/UpcomingClassesList.vue'
import ChartContainer from '../components/ChartContainer.vue'
import AnalysisPanel from '../components/AnalysisPanel.vue'
import AccessRequests from '../components/AccessRequests.vue'

// Iconos y gráficos
import { 
  UserGroupIcon, 
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon, 
  CurrencyDollarIcon,
  TrophyIcon
} from '@heroicons/vue/24/outline'
import { Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { useStudentsStore } from '../stores/students'
import { useTeachersStore } from '../stores/teachers'
import { useContentsStore } from '../stores/contents'
import { useClassesStore } from '../stores/classes'
import { useAttendanceStore } from '../stores/attendance'
import { useAnalyticsStore } from '../stores/analytics'
import { format, eachMonthOfInterval, subMonths, parseISO, addDays, addWeeks, isAfter, isBefore, startOfToday, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const user = ref<DocumentData | null>(null)
const userRole = ref('')
const showAnalytics = ref(false)

// Stores
const studentsStore = useStudentsStore()
const teachersStore = useTeachersStore()
const contentsStore = useContentsStore()
const classesStore = useClassesStore()
const attendanceStore = useAttendanceStore()
const analyticsStore = useAnalyticsStore()

// Simple metrics counts
const totalStudents = computed(() => studentsStore.students.length)
const totalTeachers = computed(() => teachersStore.teachers.length)
const totalContents = computed(() => contentsStore.contents.length)

// Performance KPIs
const performance = ref({
  studentProgress: 0,
  attendanceRate: 0,
  teachingHours: 0
})

// Get last 12 months
const months = eachMonthOfInterval({
  start: subMonths(new Date(), 11),
  end: new Date()
})

// Calculate students per month (demo data for line chart)
const studentsPerMonth = computed(() => {
  // Generate demo data with gradual growth
  const monthlyData = months.map((_, index) => {
    // Start with base number and add some growth
    return Math.floor(5 + (index * 0.8)) // Simulated growth
  })

  return {
    labels: months.map(month => format(month, 'MMM yyyy', { locale: es })),
    datasets: [
      {
        label: 'Total de Alumnos',
        data: monthlyData,
        borderColor: '#0ea5e9',
        backgroundColor: '#0ea5e9',
        tension: 0.4
      }
    ]
  }
})

// Line chart options configuration
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  }
}

// Próximas clases - Generadas a partir de datos reales
const upcomingClasses = computed(() => {
  // Si no hay clases, devolver array vacío
  if (!classesStore.classes || classesStore.classes.length === 0) {
    return []
  }

  const today = startOfToday()
  const nextWeek = addDays(today, 7) // Mostrar clases para exactamente una semana
  const result = []
  
  // Procesar cada clase
  classesStore.classes.forEach(classItem => {
    // Verificar si la clase tiene horario configurado
    if (!classItem.schedule || !classItem.schedule.days || classItem.schedule.days.length === 0) {
      return
    }
    
    // Mapear nombres de días en español a números (0 = domingo, 1 = lunes, etc.)
    const dayMap: Record<string, number> = {
      'domingo': 0,
      'lunes': 1,
      'martes': 2,
      'miércoles': 3,
      'jueves': 4,
      'viernes': 5,
      'sábado': 6
    }
    
    // Obtener el profesor correctamente
    let teacherName = 'Sin profesor asignado'
    if (classItem.teacherId) {
      const teacher = teachersStore.getTeacherById(classItem.teacherId)
      if (teacher) {
        teacherName = teacher.name || teacher.email || 'Sin nombre'
      }
    }

    // Obtener cantidad de estudiantes
    let studentCount = 0
    if (Array.isArray(classItem.studentIds)) {
      studentCount = classItem.studentIds.length
    }
    
    // Para cada día de la semana en que la clase está programada
    classItem.schedule.days.forEach(day => {
      // Normalizar el día a minúsculas
      const normalizedDay = day.toLowerCase().trim()
      const dayNumber = dayMap[normalizedDay]
      
      if (dayNumber === undefined) {
        console.warn(`Día no reconocido: ${day}`)
        return
      }
      
      // Calcular la próxima fecha para este día de la semana
      let nextDate = new Date(today)
      
      // Ajustar al próximo día de la semana que corresponda
      const currentDay = nextDate.getDay()
      const daysUntilNext = (dayNumber - currentDay + 7) % 7
      
      if (daysUntilNext === 0) {
        // Si es hoy, verificamos si ya pasó la hora para dejarlo hoy o moverlo a la próxima semana
        const currentTime = new Date().toTimeString().substring(0, 5); // Formato HH:MM
        if (classItem.schedule.startTime && currentTime > classItem.schedule.startTime) {
          // Si la hora de inicio ya pasó, mostrar la clase de la próxima semana
          nextDate = addDays(nextDate, 7)
        }
      } else {
        // Si no es el día actual, ajustamos a la próxima vez que ocurra
        nextDate = addDays(nextDate, daysUntilNext)
      }
      
      // Verificar si la fecha está dentro del rango deseado (una semana exacta)
      if (isBefore(nextDate, nextWeek) || nextDate.getTime() === nextWeek.getTime()) {
        result.push({
          id: classItem.id,
          title: classItem.name,
          date: nextDate,
          time: classItem.schedule.startTime && classItem.schedule.endTime 
            ? `${classItem.schedule.startTime} - ${classItem.schedule.endTime}`
            : 'Horario no especificado',
          teacher: teacherName,
          students: studentCount,
          room: (classItem as any).location || 'Consulta en administracion'
        })
      }
    })
  })
  
  // Ordenar por fecha y hora
  return result.sort((a, b) => {
    const dateComparison = a.date.getTime() - b.date.getTime()
    if (dateComparison !== 0) return dateComparison
    
    // Si las fechas son iguales, comparar por hora
    return a.time.localeCompare(b.time)
  }).slice(0, 5) // Mostrar solo las primeras 5
})

// Función para formatear fecha
const formatDate = (date) => {
  return format(date, 'EEEE, d MMMM', { locale: es })
}

// Gráfico de asistencia por día de semana
const attendanceByDayOfWeek = computed(() => {
  if (!analyticsStore.attendanceMetrics.attendanceByDayOfWeek.length) {
    return {
      labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      datasets: [{
        label: 'Tasa de Asistencia (%)',
        data: [92, 88, 85, 90, 86, 91, 82], // Default demo data
        backgroundColor: [
          '#3b82f6', '#4ade80', '#f97316', '#a855f7',
          '#ec4899', '#14b8a6', '#8b5cf6'
        ],
        borderWidth: 1,
      }]
    }
  }
  
  // Use data from the store
  const data = analyticsStore.attendanceMetrics.attendanceByDayOfWeek
  return {
    labels: data.map(d => d.day),
    datasets: [{
      label: 'Tasa de Asistencia (%)',
      data: data.map(d => d.rate),
      backgroundColor: [
        '#3b82f6', '#4ade80', '#f97316', '#a855f7',
        '#ec4899', '#14b8a6', '#8b5cf6'
      ],
      borderWidth: 1,
    }]
  }
})

// Gráfico de distribución de rendimiento de estudiantes
const studentPerformance = computed(() => {
  const distribution = analyticsStore.studentMetrics.performanceDistribution
  
  // Use default data if not available yet
  if (!distribution.excellent && !distribution.good) {
    return {
      labels: ['Excelente (90-100%)', 'Bueno (80-89%)', 'Regular (70-79%)', 'Necesita Mejorar (<70%)'],
      datasets: [{
        data: [30, 45, 15, 10], // Default demo percentages
        backgroundColor: ['#22c55e', '#3b82f6', '#eab308', '#ef4444'],
      }]
    }
  }
  
  // Use data from the store
  return {
    labels: ['Excelente (90-100%)', 'Bueno (80-89%)', 'Regular (70-79%)', 'Necesita Mejorar (<70%)'],
    datasets: [{
      data: [
        distribution.excellent,
        distribution.good,
        distribution.average,
        distribution.needsImprovement
      ],
      backgroundColor: ['#22c55e', '#3b82f6', '#eab308', '#ef4444'],
    }]
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        boxWidth: 15,
        font: {
          size: 12
        }
      }
    }
  }
}

// Add new state for at-risk students detail view
const showAtRiskDetails = ref(false)
const selectedAtRiskStudents = computed(() => analyticsStore.studentMetrics.atRiskStudents || [])

// Add method to handle showing details
const openAtRiskDetails = () => {
  showAtRiskDetails.value = true
}

// Load all data for dashboard
async function loadDashboardData() {
  try {
    // Load data from stores
    await Promise.all([
      studentsStore.fetchStudents(),
      teachersStore.fetchTeachers(),
      contentsStore.fetchContents(),
      classesStore.fetchClasses()
    ]).catch(error => console.error('Error cargando datos básicos:', error))
    
    // Get all metrics from analytics store
    await analyticsStore.fetchAnalytics()
    
    // Update performance KPIs
    performance.value = {
      studentProgress: analyticsStore.studentMetrics.averagePerformance || 78,
      attendanceRate: analyticsStore.attendanceMetrics.averageRate || 92,
      teachingHours: Object.values(analyticsStore.teacherMetrics.teachingHours)
        .reduce((sum, hours) => sum + Number(hours), 0) || 124
    }
  } catch (error) {
    console.error('Error cargando datos del dashboard:', error)
  }
}

onMounted(async () => {
  if (auth.currentUser) {
    const userDoc = await getDoc(doc(db, 'USERS', auth.currentUser.uid))
    if (userDoc.exists()) {
      user.value = userDoc.data()
      userRole.value = userDoc.data().role
    }
  }
  
  // Load initial dashboard data
  await loadDashboardData()
})

// Reload metrics when analytics panel is shown
watch(showAnalytics, async (newValue) => {
  if (newValue) {
    await analyticsStore.fetchAnalytics()
  }
})

const isAdmin = computed(() => ['admin', 'director'].includes(userRole.value))
</script>

<template>
  <div class="py-6">
    <!-- Header y welcome message -->
    <DashboardHeader 
      :showAnalytics="showAnalytics" 
      @toggle-analytics="showAnalytics = !showAnalytics"
    >
      <template #access-requests>
        <AccessRequests v-if="isAdmin" class="mb-8" />
      </template>
    </DashboardHeader>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Students Stats -->
      <StatsCard 
        :icon="UserGroupIcon"
        title="Total Alumnos"
        :value="totalStudents"
        bgColorClass="bg-blue-100 dark:bg-blue-900"
        iconColorClass="text-blue-600 dark:text-blue-400"
      />

      <!-- Teachers Stats -->
      <StatsCard 
        :icon="AcademicCapIcon"
        title="Total Maestros"
        :value="totalTeachers"
        bgColorClass="bg-green-100 dark:bg-green-900"
        iconColorClass="text-green-600 dark:text-green-400"
      />

      <!-- Contents Stats -->
      <StatsCard 
        :icon="BookOpenIcon"
        title="Total Contenidos"
        :value="totalContents"
        bgColorClass="bg-purple-100 dark:bg-purple-900"
        iconColorClass="text-purple-600 dark:text-purple-400"
      />
    </div>
    
    <!-- Performance KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <PerformanceKpi 
        title="Progreso Estudiantil" 
        :value="performance.studentProgress" 
        description="Promedio de avance en los contenidos"
        isPercentage
        :thresholds="{high: 80, medium: 60}"
      />
      
      <PerformanceKpi 
        title="Tasa de Asistencia" 
        :value="performance.attendanceRate" 
        description="Promedio de asistencia a clases"
        isPercentage
        :thresholds="{high: 90, medium: 75}"
      />
      
      <PerformanceKpi 
        title="Horas de Enseñanza" 
        :value="performance.teachingHours" 
        description="Horas de clase este mes"
        :colorClasses="{high: '', medium: '', low: '', default: 'border-blue-500 text-blue-500'}"
      />
    </div>

    <!-- Two column layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Upcoming Classes -->
      <UpcomingClassesList :classes="upcomingClasses" />
      
      <!-- Chart - Only show when analytics is enabled -->
      <ChartContainer 
        v-if="showAnalytics" 
        title="Crecimiento de Alumnos" 
        :icon="ChartBarIcon"
        iconClass="text-blue-500"
      >
        <Line
          :data="studentsPerMonth"
          :options="chartOptions"
        />
      </ChartContainer>
    </div>

    <!-- Analytics Dashboard - Only shown when showAnalytics is true -->
    <AnalysisPanel
      v-if="showAnalytics"
      :attendanceByDayOfWeek="attendanceByDayOfWeek"
      :studentPerformance="studentPerformance"
      :chartOptions="chartOptions"
      :doughnutOptions="doughnutOptions"
      :atRiskStudents="analyticsStore.studentMetrics.atRiskStudents"
      :bestAttendanceClasses="analyticsStore.attendanceMetrics.bestAttendanceClasses"
      :lowestPerformanceIndicators="analyticsStore.academicMetrics.lowestPerformanceIndicators"
      @show-at-risk-details="openAtRiskDetails"
    />

    <!-- Modal for At-Risk Students Details -->
    <div v-if="showAtRiskDetails" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              Estudiantes en Riesgo - Detalles
            </h2>
            <button 
              @click="showAtRiskDetails = false"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <span class="sr-only">Cerrar</span>
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-6">
            <div v-for="student in selectedAtRiskStudents" :key="student.id" 
                 class="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20">
              <h3 class="font-semibold text-lg text-red-800 dark:text-red-200">
                {{ student.name }}
              </h3>
              <div class="mt-2 space-y-2">
                <p class="text-red-700 dark:text-red-300">
                  <span class="font-medium">Rendimiento:</span> {{ student.performance }}%
                </p>
                <p class="text-red-700 dark:text-red-300">
                  <span class="font-medium">Asistencia:</span> {{ student.attendance }}%
                </p>
                <p class="text-red-700 dark:text-red-300">
                  <span class="font-medium">Último acceso:</span> {{ student.lastAccess }}
                </p>
                <div class="mt-3">
                  <h4 class="font-medium text-red-800 dark:text-red-200">Factores de riesgo:</h4>
                  <ul class="list-disc list-inside mt-1 text-red-700 dark:text-red-300">
                    <li v-for="(factor, index) in student.riskFactors" :key="index">
                      {{ factor }}
                    </li>
                  </ul>
                </div>
                <div class="mt-3">
                  <h4 class="font-medium text-red-800 dark:text-red-200">Acciones recomendadas:</h4>
                  <ul class="list-disc list-inside mt-1 text-red-700 dark:text-red-300">
                    <li v-for="(action, index) in student.recommendedActions" :key="index">
                      {{ action }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button 
              @click="showAtRiskDetails = false"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>