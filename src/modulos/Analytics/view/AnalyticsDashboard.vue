<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAnalyticsStore } from '../store/analytics'
import { useStudentsStore } from '../../Students/store/students'
import { useTeachersStore } from '../../Teachers/store/teachers'
import { useClassesStore } from '../../Classes/store/classes'
import { useAttendanceStore } from '../../Attendance/store/attendance'
import { useContentsStore } from '../../Contents/store/contents'
import { useInstrumentoStore } from '../../Instruments/store/instrumento'
import PerformanceKpi from '../components/PerformanceKpi.vue'
import ChartContainer from '../components/ChartContainer.vue'
import AnalysisPanel from '../components/AnalysisPanel.vue'
import ReportGenerator from '../components/ReportGenerator.vue'
import { UserIcon, UsersIcon, UserPlusIcon } from '@heroicons/vue/24/outline'
import { Line, Doughnut } from 'vue-chartjs'

const analyticsStore = useAnalyticsStore();
const studentsStore = useStudentsStore();
const teachersStore = useTeachersStore();
const classesStore = useClassesStore();
const attendanceStore = useAttendanceStore();
const contentsStore = useContentsStore();
const instrumentsStore = useInstrumentoStore();

// Dashboard state
const isLoading = ref(true);
const error = ref('');
const activeTab = ref('overview')
// Lista de pestañas disponibles
const tabs = [
  { id: 'overview', label: 'Resumen' },
  { id: 'attendance', label: 'Asistencias' },
  { id: 'performance', label: 'Rendimiento' },
  { id: 'academic', label: 'Contenidos y Evaluaciones' },
  { id: 'teachers', label: 'Profesores' }
]

// Ejemplo de computed agregando datos cruzados
const aggregatedData = computed(() => {
  return {
    // Puede procesar aquí métricas combinadas a partir de cada store
    totalStudents: dashboardData.value.totalStudents,
    totalTeachers: dashboardData.value.totalTeachers,
    totalClasses: dashboardData.value.totalClasses,
    averageAttendance: dashboardData.value.averageAttendance,
    averagePerformance: dashboardData.value.averagePerformance
  }
})

// Filter state
const filters = ref({
  teacherId: '',
  classId: '',
  instrument: '',
  level: ''
});

// Dashboard data
const dashboardData = ref({
  totalStudents: 0,
  totalTeachers: 0,
  totalClasses: 0,
  totalInstruments: 0,
  averageAttendance: 0,
  averagePerformance: 0,
  studentsGrowth: 0,
  instruments: {
    distribution: [],
    availableCount: 0,
    assignedCount: 0,
    needsRepairCount: 0,
    mostPopular: ''
  },
  classes: {
    bySize: [],
    byHours: [],
    byContent: [],
    mostPopular: ''
  },
  teachers: {
    byClasses: [],
    byStudents: [],
    byHours: [],
    topPerformer: ''
  },
  attendance: {
    byMonth: [],
    byClass: [],
    byDay: []
  },
  performance: {
    distribution: { excellent: 0, good: 0, average: 0, needsImprovement: 0 },
    byClass: [],
    trend: []
  },
  students: {
    atRisk: [],
    topPerformers: [],
    byInstrument: [],
    byLevel: []
  }
});

// Time range options
const timeRangeOptions = [
  { value: 'last3Months', label: 'Últimos 3 meses' },
  { value: 'last6Months', label: 'Últimos 6 meses' },
  { value: 'lastYear', label: 'Último año' },
  { value: 'custom', label: 'Personalizado' }
];

// Load dashboard data
const loadDashboardData = async () => {
  isLoading.value = true;
  error.value = '';
  
  try {
    await Promise.all([
      studentsStore.fetchStudents(),
      teachersStore.fetchTeachers(),
      classesStore.fetchClasses(),
      attendanceStore.fetchAttendance(),
      contentsStore.fetchContents(),
      instrumentsStore.fetchInstruments(),
      analyticsStore.fetchAnalytics()
    ]);
    
    dashboardData.value.totalStudents = studentsStore.students.length;
    dashboardData.value.totalTeachers = teachersStore.teachers.length;
    dashboardData.value.totalClasses = classesStore.classes.length;
    dashboardData.value.totalInstruments = instrumentsStore.instruments.length;
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    error.value = 'Error cargando datos del dashboard';
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await loadDashboardData();
});
// Método para cambiar de pestaña
const changeTab = (tabId: string) => {
  activeTab.value = tabId
}

// Chart configuration options
const commonChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
});

// Chart data
const attendanceByDayChart = computed(() => {
  return {
    labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    datasets: [{
      label: 'Asistencia',
      data: [90, 85, 88, 92, 87], // Sample data
      backgroundColor: 'rgba(99, 102, 241, 0.5)',
      borderColor: 'rgb(99, 102, 241)',
      borderWidth: 1
    }]
  };
});

const performanceDistributionChart = computed(() => {
  return {
    labels: ['Excelente', 'Bueno', 'Promedio', 'Necesita Mejorar'],
    datasets: [{
      label: 'Distribución de Rendimiento',
      data: [
        dashboardData.value.performance.distribution.excellent,
        dashboardData.value.performance.distribution.good,
        dashboardData.value.performance.distribution.average,
        dashboardData.value.performance.distribution.needsImprovement
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.6)',
        'rgba(59, 130, 246, 0.6)',
        'rgba(250, 204, 21, 0.6)',
        'rgba(239, 68, 68, 0.6)'
      ],
      borderWidth: 1
    }]
  };
});
</script>

<template>
  <div class="analytics-dashboard p-4 space-y-6">
    <header class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Dashboard de Análisis</h1>
      <!-- Ejemplo: botones para cambiar formato de visualización -->
      <div class="flex items-center space-x-2">
        <!-- ...botones de filtros y fechas... -->
      </div>
    </header>
    
    <!-- Loading and error states remain unchanged -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      <span class="ml-3">Cargando estadísticas...</span>
    </div>
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
      {{ error }}
      <button @click="loadDashboardData" class="ml-2 underline">Reintentar</button>
    </div>
    
    <div v-else>
      <!-- Tabs Navigation -->
      <div class="mb-6 border-b border-gray-200">
        <nav class="-mb-px flex space-x-4">
          <button 
            v-for="tab in tabs" 
            :key="tab.id" 
            @click="changeTab(tab.id)"
            :class="[
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Pestañas de contenido -->
      <div v-if="activeTab === 'overview'">
        <!-- Ejemplo de KPI Cards con datos agregados -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PerformanceKpi title="Total Estudiantes" :value="aggregatedData.totalStudents" :trend="5.2" icon="UserIcon" metricType="default" />
          <PerformanceKpi title="Total Profesores" :value="aggregatedData.totalTeachers" :trend="3.1" icon="UsersIcon" metricType="default" />
          <PerformanceKpi title="Total Clases" :value="aggregatedData.totalClasses" :trend="2.8" icon="AcademicCapIcon" metricType="default" />
          <PerformanceKpi title="Asistencia Promedio" :value="aggregatedData.averageAttendance" :trend="3" icon="CalendarIcon" metricType="percentage" />
          <PerformanceKpi title="Rendimiento Promedio" :value="aggregatedData.averagePerformance" :trend="1.5" icon="ChartBarIcon" metricType="percentage" />
        </div>
      </div>
      
      <div v-else-if="activeTab === 'attendance'">
        <!-- Sección de asistencias -->
        <ChartContainer title="Asistencia por Día" icon="ChartBarIcon">
          <!-- Suponiendo que attendanceByDayChart ya esté definido en computed -->
          <Line :data="attendanceByDayChart" :options="commonChartOptions"/>
        </ChartContainer>
      </div>
      
      <div v-else-if="activeTab === 'performance'">
        <!-- Sección de rendimiento -->
        <ChartContainer title="Distribución de Rendimiento" icon="ChartBarIcon">
          <Doughnut :data="performanceDistributionChart" :options="commonChartOptions"/>
        </ChartContainer>
      </div>
      
      <div v-else-if="activeTab === 'academic'">
        <!-- Sección de Evaluaciones y Contenidos -->
        <AnalysisPanel />
      </div>
      
      <div v-else-if="activeTab === 'teachers'">
        <!-- Sección de Reportes específicos de profesores -->
        <ReportGenerator />
      </div>
    </div>
  </div>
</template>