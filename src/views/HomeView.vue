<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { auth, db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { 
  UserGroupIcon, 
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { useStudentsStore } from '../stores/students'
import { useTeachersStore } from '../stores/teachers'
import { useContentsStore } from '../stores/contents'
import { useClassesStore } from '../stores/classes'
import { format, eachMonthOfInterval, subMonths, isSameDay, parseISO, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import AccessRequests from '../components/AccessRequests.vue'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const user = ref(null)
const userRole = ref('')
const showAnalytics = ref(false)

const studentsStore = useStudentsStore()
const teachersStore = useTeachersStore()
const contentsStore = useContentsStore()
const classesStore = useClassesStore()

const totalStudents = computed(() => studentsStore.students.length)
const totalTeachers = computed(() => teachersStore.teachers.length)
const totalContents = computed(() => contentsStore.contents.length)

// Estado para los KPIs de rendimiento
const performance = reactive({
  studentProgress: 0,
  attendanceRate: 0,
  teachingHours: 0
})

// Get last 12 months
const months = eachMonthOfInterval({
  start: subMonths(new Date(), 11),
  end: new Date()
})

// Calculate students per month (demo data)
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

// Próximas clases (datos de ejemplo)
const upcomingClasses = ref([
  {
    id: 1,
    title: 'Piano - Nivel 1',
    date: addDays(new Date(), 1),
    time: '15:00 - 16:30',
    teacher: 'María García',
    students: 5,
    room: 'Sala A'
  },
  {
    id: 2,
    title: 'Violín - Nivel 2',
    date: addDays(new Date(), 1),
    time: '17:00 - 18:30',
    teacher: 'Carlos López',
    students: 3,
    room: 'Sala B'
  },
  {
    id: 3,
    title: 'Teoría Musical',
    date: addDays(new Date(), 2),
    time: '16:00 - 17:30',
    teacher: 'Laura Martínez',
    students: 8,
    room: 'Sala C'
  }
])

// Función para formatear fecha
const formatDate = (date) => {
  return format(date, 'EEEE, d MMMM', { locale: es })
}

onMounted(async () => {
  if (auth.currentUser) {
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
    if (userDoc.exists()) {
      user.value = userDoc.data()
      userRole.value = userDoc.data().role
    }
  }
  
  // Cargar datos de los stores
  await Promise.all([
    studentsStore.fetchStudents(),
    teachersStore.fetchTeachers(),
    contentsStore.fetchContents(),
    classesStore.fetchClasses()
  ]).catch(error => console.error('Error cargando datos:', error))
  
  // Simular KPIs de rendimiento (reemplazar con datos reales)
  performance.studentProgress = 78 // porcentaje
  performance.attendanceRate = 92 // porcentaje
  performance.teachingHours = 124 // horas mensuales
})

const isAdmin = computed(() => ['admin', 'director'].includes(userRole.value))
</script>

<template>
  <div class="py-6">
    <!-- Welcome message -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 dark:text-white">
        Bienvenido a la Academia de Música
      </h1>
      <p class="text-gray-600 dark:text-gray-300 mt-2">
        Gestiona tus clases, estudiantes y contenidos en un solo lugar.
      </p>
    </div>
    
    <!-- Show access requests only for admin/director -->
    <AccessRequests v-if="isAdmin" class="mb-8" />

    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Dashboard</h2>
      <button 
        @click="showAnalytics = !showAnalytics"
        class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        :title="showAnalytics ? 'Ocultar Análisis' : 'Ver Análisis'"
      >
        <ChartBarIcon class="w-5 h-5" />
        <ArrowTopRightOnSquareIcon class="w-5 h-5 sm:hidden" />
        <span class="hidden sm:inline">{{ showAnalytics ? 'Ocultar Análisis' : 'Ver Análisis' }}</span>
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Students Stats -->
      <div class="card hover:shadow-md transition-shadow duration-300">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
            <UserGroupIcon class="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Alumnos
            </p>
            <p class="text-2xl font-semibold">
              {{ totalStudents }}
            </p>
          </div>
        </div>
      </div>

      <!-- Teachers Stats -->
      <div class="card hover:shadow-md transition-shadow duration-300">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-green-100 dark:bg-green-900">
            <AcademicCapIcon class="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Maestros
            </p>
            <p class="text-2xl font-semibold">
              {{ totalTeachers }}
            </p>
          </div>
        </div>
      </div>

      <!-- Contents Stats -->
      <div class="card hover:shadow-md transition-shadow duration-300">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
            <BookOpenIcon class="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Contenidos
            </p>
            <p class="text-2xl font-semibold">
              {{ totalContents }}
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Performance KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="card hover:shadow-md transition-shadow duration-300">
        <h3 class="font-semibold mb-2 text-gray-700 dark:text-gray-300">Progreso Estudiantil</h3>
        <div class="flex items-center">
          <div class="w-16 h-16 rounded-full flex items-center justify-center border-4" 
               :class="[
                 performance.studentProgress >= 80 ? 'border-green-500 text-green-500' :
                 performance.studentProgress >= 60 ? 'border-yellow-500 text-yellow-500' : 
                 'border-red-500 text-red-500'
               ]">
            <span class="text-xl font-bold">{{ performance.studentProgress }}%</span>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Promedio de avance en los contenidos
            </p>
          </div>
        </div>
      </div>
      
      <div class="card hover:shadow-md transition-shadow duration-300">
        <h3 class="font-semibold mb-2 text-gray-700 dark:text-gray-300">Tasa de Asistencia</h3>
        <div class="flex items-center">
          <div class="w-16 h-16 rounded-full flex items-center justify-center border-4" 
               :class="[
                 performance.attendanceRate >= 90 ? 'border-green-500 text-green-500' :
                 performance.attendanceRate >= 75 ? 'border-yellow-500 text-yellow-500' : 
                 'border-red-500 text-red-500'
               ]">
            <span class="text-xl font-bold">{{ performance.attendanceRate }}%</span>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Promedio de asistencia a clases
            </p>
          </div>
        </div>
      </div>
      
      <div class="card hover:shadow-md transition-shadow duration-300">
        <h3 class="font-semibold mb-2 text-gray-700 dark:text-gray-300">Horas de Enseñanza</h3>
        <div class="flex items-center">
          <div class="w-16 h-16 rounded-full flex items-center justify-center border-4 border-blue-500 text-blue-500">
            <span class="text-xl font-bold">{{ performance.teachingHours }}</span>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Horas de clase este mes
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Two column layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Upcoming Classes -->
      <div class="card hover:shadow-md transition-shadow duration-300">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold flex items-center">
            <CalendarIcon class="w-5 h-5 mr-2 text-blue-500" />
            Próximas Clases
          </h3>
          <router-link to="/classes" class="text-sm text-blue-500 hover:underline">
            Ver todas
          </router-link>
        </div>
        
        <div class="space-y-4">
          <div v-for="classItem in upcomingClasses" :key="classItem.id" 
               class="p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-medium">{{ classItem.title }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {{ formatDate(classItem.date) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium flex items-center justify-end">
                  <ClockIcon class="w-4 h-4 mr-1 text-blue-500" />
                  {{ classItem.time }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Sala: {{ classItem.room }}
                </p>
              </div>
            </div>
            <div class="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Profesor: {{ classItem.teacher }}</span>
              <span>{{ classItem.students }} estudiantes</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Growth Chart -->
      <div class="card hover:shadow-md transition-shadow duration-300" :class="{ 'hidden': !showAnalytics }">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <ChartBarIcon class="w-5 h-5 mr-2 text-blue-500" />
          Crecimiento de Alumnos
        </h3>
        <div class="h-64">
          <Line
            :data="studentsPerMonth"
            :options="chartOptions"
          />
        </div>
      </div>
    </div>
  </div>
</template>