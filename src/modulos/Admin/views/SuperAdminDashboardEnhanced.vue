<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
    <!-- Enhanced Hero Header -->
    <div class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-8">
        <div class="max-w-7xl mx-auto">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                <CogIcon class="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Panel de Super Administrador
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1 text-lg">
                  Sistema de gestión académica integral - {{ currentDate }}
                </p>
              </div>
            </div>
            
            <!-- Real-time metrics in header -->
            <div class="hidden lg:flex items-center space-x-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ systemMetrics.activeStudents }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Estudiantes Activos</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">${{ systemMetrics.monthlyRevenue.toLocaleString() }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Ingresos Mes</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ systemMetrics.attendanceRate }}%</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Asistencia</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto p-6">
      <!-- Critical Alerts Banner -->
      <div v-if="criticalAlerts.length > 0" class="mb-6">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div class="flex items-center">
            <ExclamationTriangleIcon class="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
            <div>
              <h3 class="text-red-800 dark:text-red-200 font-medium">Alertas Críticas</h3>
              <p class="text-red-700 dark:text-red-300 text-sm">
                {{ criticalAlerts.length }} situaciones requieren atención inmediata
              </p>
            </div>
            <button 
              @click="showAlertsModal = true"
              class="ml-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Ver Detalles
            </button>
          </div>
        </div>
      </div>

      <!-- Management Tabs -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="flex space-x-8 px-6" aria-label="Tabs">
            <button
              v-for="tab in managementTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              ]"
            >
              <component :is="tab.icon" class="w-5 h-5 inline mr-2" />
              {{ tab.name }}
              <span v-if="tab.count" class="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                {{ tab.count }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Students Tab -->
          <div v-if="activeTab === 'students'" class="space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Gestión de Estudiantes</h2>
              <button 
                @click="showAdvancedStudentsModal = true"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <UsersIcon class="w-4 h-4" />
                <span>Gestión Avanzada</span>
              </button>
            </div>
              <!-- Students Quick Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                :icon="UsersIcon"
                :value="studentMetrics.totalStudents"
                label="Total"
                color="blue"
              />
              
              <MetricCard
                :icon="CheckCircleIcon"
                :value="studentMetrics.activeStudents"
                label="Activos"
                color="green"
              />
              
              <MetricCard
                :icon="ExclamationTriangleIcon"
                :value="studentMetrics.riskStudents"
                label="En Riesgo"
                color="yellow"
              />
              
              <MetricCard
                :icon="CurrencyDollarIcon"
                :value="`$${studentMetrics.revenueImpact.toLocaleString()}`"
                label="Ingresos"
                color="purple"
              />
            </div>            <!-- Recent Students -->
            <StudentsList 
              :students="recentStudents"
              title="Estudiantes Recientes"
              :show-status="true"
            />
          </div>          <!-- Teachers Tab -->
          <div v-if="activeTab === 'teachers'" class="space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Gestión de Maestros</h2>
              <div class="flex items-center space-x-3">
                <button 
                  @click="$router.push('/admin/teachers/advanced')"
                  class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <ChartBarIcon class="w-4 h-4" />
                  <span>Gestión Avanzada</span>
                </button>
                <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <UserPlusIcon class="w-4 h-4" />
                  <span>Nuevo Maestro</span>
                </button>
              </div>
            </div>
            
            <!-- Teachers Quick Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Total Maestros</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ teacherMetrics.total || 0 }}</p>
                  </div>
                  <AcademicCapIcon class="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Maestros Activos</p>
                    <p class="text-2xl font-bold text-green-600">{{ teacherMetrics.active || 0 }}</p>
                  </div>
                  <CheckCircleIcon class="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Evaluación Promedio</p>
                    <p class="text-2xl font-bold text-yellow-600">{{ teacherMetrics.rating || '0.0' }}</p>
                  </div>
                  <StarIcon class="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>

            <!-- Quick Actions for Teachers -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6">              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Acciones Rápidas - Maestros</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ActionButton
                  :icon="ChartBarIcon"
                  title="Análisis de Desempeño"
                  color="purple"
                  @click="$router.push('/admin/teachers/advanced')"
                />
                <ActionButton
                  :icon="ClockIcon"
                  title="Horarios"
                  color="blue"
                  @click="() => {}"
                />
                <ActionButton
                  :icon="CurrencyDollarIcon"
                  title="Nómina"
                  color="green"
                  @click="() => {}"
                />
                <ActionButton
                  :icon="DocumentTextIcon"
                  title="Reportes"
                  color="orange"
                  @click="() => {}"
                />
              </div>
            </div>
          </div>

          <!-- Classes Tab -->
          <div v-if="activeTab === 'classes'" class="space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Gestión de Clases</h2>
              <button class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <PlusIcon class="w-4 h-4" />
                <span>Nueva Clase</span>
              </button>
            </div>
            
            <!-- Classes content placeholder -->
            <div class="text-center py-12 text-gray-500 dark:text-gray-400">
              <BookOpenIcon class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>Gestión de clases en desarrollo...</p>
            </div>
          </div>

          <!-- Analytics Tab -->
          <div v-if="activeTab === 'analytics'" class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Análisis y Reportes</h2>
            
            <!-- Analytics content placeholder -->
            <div class="text-center py-12 text-gray-500 dark:text-gray-400">
              <ChartBarIcon class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>Panel de análisis en desarrollo...</p>
            </div>
          </div>

          <!-- System Tab -->
          <div v-if="activeTab === 'system'" class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Configuración del Sistema</h2>
            
            <!-- System content placeholder -->
            <div class="text-center py-12 text-gray-500 dark:text-gray-400">
              <Cog6ToothIcon class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>Configuración del sistema en desarrollo...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Import/Export -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Importar/Exportar</h3>
          <div class="space-y-3">
            <button class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center">
              <DocumentArrowUpIcon class="w-4 h-4 mr-2" />
              Importar Estudiantes
            </button>
            <button class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center">
              <DocumentArrowDownIcon class="w-4 h-4 mr-2" />
              Exportar Datos
            </button>
          </div>
        </div>

        <!-- Communication -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comunicación</h3>
          <div class="space-y-3">
            <button class="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center">
              <EnvelopeIcon class="w-4 h-4 mr-2" />
              Envío Masivo Email
            </button>
            <button class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center">
              <ChatBubbleLeftRightIcon class="w-4 h-4 mr-2" />
              WhatsApp Masivo
            </button>
          </div>
        </div>

        <!-- Reports -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reportes</h3>
          <div class="space-y-3">
            <button class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center">
              <DocumentTextIcon class="w-4 h-4 mr-2" />
              Reporte de Asistencia
            </button>
            <button class="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center justify-center">
              <ChartBarIcon class="w-4 h-4 mr-2" />
              Análisis Financiero
            </button>
          </div>
        </div>
      </div>
    </div>    <!-- Advanced Students Modal -->
    <Modal 
      :show="showAdvancedStudentsModal" 
      title="Gestión Avanzada de Estudiantes"
      @close="showAdvancedStudentsModal = false"
    >
      <AdvancedStudentsManagementNew />
    </Modal>

    <!-- Alerts Modal -->
    <Modal 
      :show="showAlertsModal" 
      title="Alertas Críticas"
      @close="showAlertsModal = false"
    >
      <div class="p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Alertas Críticas</h2>
        <div class="space-y-4">
          <div v-for="alert in criticalAlerts" :key="alert.id" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div class="flex items-start">
              <ExclamationTriangleIcon class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
              <div>
                <h4 class="font-medium text-red-900 dark:text-red-100">{{ alert.title }}</h4>
                <p class="text-red-700 dark:text-red-300 text-sm mt-1">{{ alert.message }}</p>
                <p class="text-red-600 dark:text-red-400 text-xs mt-2">{{ formatDate(alert.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  CogIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UserPlusIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/vue/24/outline'

import { useAdminStudentsStore } from '../store/adminStudents'
import { advancedStudentsService } from '../services/advancedStudentsService'
import { advancedTeachersService } from '../services/advancedTeachersService'
import type { StudentMetrics, DropoutRisk } from '../services/advancedStudentsService'

// Components
import Modal from '../../../components/shared/Modal.vue'
import AdvancedStudentsManagementNew from '../components/AdvancedStudentsManagementNew.vue'
import MetricCard from '../components/MetricCard.vue'
import ActionButton from '../components/ActionButton.vue'
import TabContainer from '../components/TabContainer.vue'
import StudentsList from '../components/StudentsList.vue'
import QuickActionsCard from '../components/QuickActionsCard.vue'

// Store
const studentsStore = useAdminStudentsStore()

// State
const activeTab = ref('students')
const showAdvancedStudentsModal = ref(false)
const showAlertsModal = ref(false)

const systemMetrics = ref({
  activeStudents: 0,
  monthlyRevenue: 0,
  attendanceRate: 0
})

const studentMetrics = ref<StudentMetrics>({
  totalStudents: 0,
  activeStudents: 0,
  newThisMonth: 0,
  retentionRate: 0,
  averageAttendance: 0,
  riskStudents: 0,
  topPerformers: 0,
  revenueImpact: 0
})

const teacherMetrics = ref({
  total: 0,
  active: 0,
  rating: '0.0'
})

const criticalAlerts = ref<any[]>([])

// Computed
const currentDate = computed(() => {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const managementTabs = computed(() => [
  {
    id: 'students',
    name: 'Estudiantes',
    icon: UsersIcon,
    count: studentMetrics.value.totalStudents
  },
  {
    id: 'teachers',
    name: 'Maestros',
    icon: AcademicCapIcon,
    count: 0
  },
  {
    id: 'classes',
    name: 'Clases',
    icon: BookOpenIcon,
    count: 0
  },
  {
    id: 'analytics',
    name: 'Análisis',
    icon: ChartBarIcon
  },
  {
    id: 'system',
    name: 'Sistema',
    icon: Cog6ToothIcon
  }
])

const recentStudents = computed(() => {
  return studentsStore.students
    .slice()
    .sort((a, b) => {
      // Handle Firestore Timestamp or Date objects
      const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0)
      const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0)
      return bDate.getTime() - aDate.getTime()
    })
    .slice(0, 5)
})

// Quick Actions Data
const importExportActions = computed(() => [
  {
    id: 'import-students',
    label: 'Importar Estudiantes',
    icon: DocumentArrowUpIcon,
    color: 'green' as const
  },
  {
    id: 'export-data',
    label: 'Exportar Datos',
    icon: DocumentArrowDownIcon,
    color: 'blue' as const
  }
])

const communicationActions = computed(() => [
  {
    id: 'mass-email',
    label: 'Envío Masivo Email',
    icon: EnvelopeIcon,
    color: 'purple' as const
  },
  {
    id: 'mass-whatsapp',
    label: 'WhatsApp Masivo',
    icon: ChatBubbleLeftRightIcon,
    color: 'green' as const
  }
])

const reportsActions = computed(() => [
  {
    id: 'attendance-report',
    label: 'Reporte de Asistencia',
    icon: DocumentTextIcon,
    color: 'indigo' as const
  },
  {
    id: 'financial-analysis',
    label: 'Análisis Financiero',
    icon: ChartBarIcon,
    color: 'yellow' as const
  }
])

// Methods
const loadData = async () => {
  try {
    // Load students
    await studentsStore.loadStudents()
    
    // Load student metrics
    const metrics = await advancedStudentsService.getStudentMetrics()
    studentMetrics.value = metrics
    
    // Load teacher metrics
    try {
      const teacherMetricsData = await advancedTeachersService.getTeacherMetrics()
      teacherMetrics.value = {
        total: teacherMetricsData.totalTeachers,
        active: teacherMetricsData.activeTeachers,
        rating: teacherMetricsData.averageRating.toFixed(1)
      }
    } catch (error) {
      console.error('Error loading teacher metrics:', error)
      // Keep default values if teacher metrics fail
    }
    
    // Update system metrics
    systemMetrics.value = {
      activeStudents: metrics.activeStudents,
      monthlyRevenue: metrics.revenueImpact,
      attendanceRate: Math.round(metrics.averageAttendance)
    }
    
    // Load critical alerts (mock data)
    criticalAlerts.value = [
      {
        id: 1,
        title: 'Estudiantes en riesgo de deserción',
        message: `${metrics.riskStudents} estudiantes requieren atención inmediata`,
        createdAt: new Date(),
        type: 'warning'
      }
    ]
    
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

const formatDate = (date: any) => {
  // Handle Firestore Timestamp or Date objects
  const d = date instanceof Date ? date : new Date(date || 0)
  return d.toLocaleDateString('es-ES')
}

const handleQuickAction = (actionId: string) => {
  console.log('Quick action clicked:', actionId)
  
  switch (actionId) {
    case 'import-students':
      // TODO: Implement student import functionality
      console.log('Opening student import dialog...')
      break
    case 'export-data':
      // TODO: Implement data export functionality
      console.log('Starting data export...')
      break
    case 'mass-email':
      // TODO: Implement mass email functionality
      console.log('Opening mass email dialog...')
      break
    case 'mass-whatsapp':
      // TODO: Implement mass WhatsApp functionality
      console.log('Opening mass WhatsApp dialog...')
      break
    case 'attendance-report':
      // TODO: Implement attendance report functionality
      console.log('Generating attendance report...')
      break
    case 'financial-analysis':
      // TODO: Implement financial analysis functionality
      console.log('Opening financial analysis...')
      break
    default:
      console.log('Unknown action:', actionId)
  }
}

// Initialize
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* Custom animations and transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Custom gradient text */
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}
</style>
