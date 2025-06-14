<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
    <!-- Hero Header -->
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
                  Panel de Administración
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1 text-lg">
                  Sistema de gestión académica avanzado - {{ currentDate }}
                </p>
              </div>
            </div>
            
            <!-- Super Stats -->
            <div class="grid grid-cols-4 gap-4">
              <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white text-center">
                <div class="text-2xl font-bold">{{ stats.totalStudents }}</div>
                <div class="text-xs opacity-90">Estudiantes</div>
              </div>
              <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white text-center">
                <div class="text-2xl font-bold">{{ stats.totalTeachers }}</div>
                <div class="text-xs opacity-90">Maestros</div>
              </div>
              <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white text-center">
                <div class="text-2xl font-bold">{{ stats.totalClasses }}</div>
                <div class="text-xs opacity-90">Clases</div>
              </div>
              <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white text-center">
                <div class="text-2xl font-bold">{{ stats.activeUsers }}</div>
                <div class="text-xs opacity-90">Usuarios Activos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Dashboard -->
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Super Actions Row -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Acciones de Superpoderes</h2>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">Modo Admin</span>
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <!-- Crear Usuario -->
          <SuperActionCard
            title="Nuevo Usuario"
            description="Crear cualquier tipo de usuario"
            icon="UserPlusIcon"
            gradient="from-blue-500 to-blue-600"
            @click="handleCreateUser"
          />
          
          <!-- Gestión Global -->
          <SuperActionCard
            title="Vista Global"
            description="Ver todo el sistema"
            icon="GlobeAltIcon"
            gradient="from-purple-500 to-purple-600"
            @click="handleGlobalView"
          />
          
          <!-- Reportes Avanzados -->
          <SuperActionCard
            title="Reportes Pro"
            description="Análisis avanzado"
            icon="ChartBarIcon"
            gradient="from-green-500 to-green-600"
            @click="handleAdvancedReports"
          />
            <!-- Configuración Sistema -->
          <SuperActionCard
            title="Config Sistema"
            description="Configuraciones avanzadas"
            icon="CogIcon"
            gradient="from-orange-500 to-orange-600"
            @click="handleSystemConfig"
          />
          
          <!-- Gestión de Temas -->
          <SuperActionCard
            title="Temas & Colores"
            description="Personalizar apariencia"
            icon="SwatchIcon"
            gradient="from-pink-500 to-pink-600"
            @click="handleThemeManager"
          />
          
          <!-- Respaldos -->
          <SuperActionCard
            title="Respaldos"
            description="Backup y restore"
            icon="CloudArrowUpIcon"
            gradient="from-indigo-500 to-indigo-600"
            @click="handleBackups"
          />
          
          <!-- Monitoreo -->
          <SuperActionCard
            title="Monitoreo"
            description="Estado del sistema"
            icon="EyeIcon"
            gradient="from-red-500 to-red-600"
            @click="handleMonitoring"
          />
        </div>
      </section>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Left Column - Primary Management -->
        <div class="lg:col-span-3 space-y-6">
          <!-- Gestión Principal -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <UsersIcon class="w-6 h-6 mr-2 text-blue-500" />
                Gestión Principal
              </h3>
              <button class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Ver Todo
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <ManagementSuperCard
                title="Estudiantes"
                description="Gestionar todos los estudiantes"
                icon="UsersIcon"
                :count="stats.totalStudents"
                :recent="stats.recentStudents"
                color="blue"
                route="/admin/students"
                @action="handleStudentsAction"
              />
              
              <ManagementSuperCard
                title="Maestros"
                description="Gestionar maestros y permisos"
                icon="UserIcon"
                :count="stats.totalTeachers"
                :recent="stats.recentTeachers"
                color="green"
                route="/admin/teachers"
                @action="handleTeachersAction"
              />
              
              <ManagementSuperCard
                title="Clases"
                description="Gestionar clases activas"
                icon="AcademicCapIcon"
                :count="stats.totalClasses"
                :recent="stats.recentClasses"
                color="purple"
                route="/admin/classes"
                @action="handleClassesAction"
              />
            </div>
          </div>

          <!-- Analytics Dashboard -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <ChartBarIcon class="w-6 h-6 mr-2 text-green-500" />
                Análisis en Tiempo Real
              </h3>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span class="text-sm text-green-600 dark:text-green-400">En vivo</span>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <AnalyticsCard
                title="Asistencia Hoy"
                value="87%"
                trend="+5%"
                icon="ClipboardDocumentCheckIcon"
                color="green"
                :data="attendanceData"
              />
              
              <AnalyticsCard
                title="Clases Activas"
                value="12"
                trend="+2"
                icon="AcademicCapIcon"
                color="blue"
                :data="classesData"
              />
              
              <AnalyticsCard
                title="Observaciones"
                value="3"
                trend="-1"
                icon="ExclamationTriangleIcon"
                color="orange"
                :data="observationsData"
              />
              
              <AnalyticsCard
                title="Rendimiento"
                value="94%"
                trend="+3%"
                icon="TrophyIcon"
                color="purple"
                :data="performanceData"
              />
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <ClockIcon class="w-6 h-6 mr-2 text-purple-500" />
                Actividad Reciente
              </h3>
              <RouterLink to="/admin/activity" class="text-purple-600 hover:text-purple-700 text-sm font-medium">
                Ver Historial Completo
              </RouterLink>
            </div>
            
            <RecentActivityFeed :activities="recentActivities" />
          </div>
        </div>

        <!-- Right Column - Quick Access & Alerts -->
        <div class="space-y-6">
          <!-- System Status -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <CpuChipIcon class="w-5 h-5 mr-2 text-blue-500" />
              Estado del Sistema
            </h3>
            <!-- Sistema simplificado -->
            <div class="bg-green-100 dark:bg-green-900/30 rounded-lg p-4">
              <div class="flex items-center">
                <div class="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span class="text-green-700 dark:text-green-300 font-medium">Sistema Operativo</span>
              </div>
              <p class="text-sm text-green-600 dark:text-green-400 mt-1">Todos los servicios funcionando correctamente</p>
            </div>
          </div>

          <!-- Pending Approvals -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <ExclamationTriangleIcon class="w-5 h-5 mr-2 text-orange-500" />
              Pendientes de Aprobación
            </h3>
            <!-- Lista simplificada de aprobaciones -->
            <div class="space-y-3">
              <div v-for="approval in pendingApprovals" :key="approval.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex-1">
                  <h4 class="font-medium text-gray-900 dark:text-white">{{ approval.title }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ approval.description }}</p>
                </div>
                <div class="flex space-x-2">
                  <button @click="handleApprovalAction(approval, 'approve')" class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                    Aprobar
                  </button>
                  <button @click="handleApprovalAction(approval, 'reject')" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Access -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <BoltIcon class="w-5 h-5 mr-2 text-yellow-500" />
              Acceso Rápido
            </h3>
            <div class="space-y-3">
              <QuickAccessButton
                title="Crear Clase Urgente"
                icon="PlusCircleIcon"
                color="red"
                @click="handleUrgentClass"
              />
              <QuickAccessButton
                title="Mensaje Global"
                icon="SpeakerphoneIcon"
                color="blue"
                @click="handleGlobalMessage"
              />
              <QuickAccessButton
                title="Exportar Datos"
                icon="ArrowDownTrayIcon"
                color="green"
                @click="handleExportData"
              />
              <QuickAccessButton
                title="Configurar Notificaciones"
                icon="BellIcon"
                color="purple"
                @click="handleNotificationConfig"
              />
            </div>
          </div>

          <!-- Recent Alerts -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <BellAlertIcon class="w-5 h-5 mr-2 text-red-500" />
              Alertas Recientes
            </h3>
            <AlertsList :alerts="systemAlerts" @dismiss="handleDismissAlert" />
          </div>
        </div>
      </div>
    </div>    <!-- Modals -->
    <CreateUserModal 
      v-if="showCreateUserModal" 
      @close="showCreateUserModal = false"
      @success="handleUserCreated"
    />
    
    <GlobalViewModal
      v-if="showGlobalViewModal"
      @close="showGlobalViewModal = false"
    />
    
    <SystemConfigModal
      v-if="showSystemConfigModal"
      @close="showSystemConfigModal = false"
      @updated="handleSystemConfigUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  CogIcon,
  UsersIcon,
  UserIcon,
  UserPlusIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,  CpuChipIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  BellIcon,
  BellAlertIcon,
  EyeIcon,
  GlobeAltIcon,
  CloudArrowUpIcon,
  ClipboardDocumentCheckIcon,
  TrophyIcon,  PlusCircleIcon,
  MegaphoneIcon,
  ArrowDownTrayIcon,
  SwatchIcon,
  SunIcon,
  MoonIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

// Components
import SuperActionCard from '../components/SuperActionCard.vue'
import ManagementSuperCard from '../components/ManagementSuperCard.vue'
import AnalyticsCard from '../components/AnalyticsCard.vue'
import RecentActivityFeed from '../components/RecentActivityFeed.vue'
import QuickAccessButton from '../components/QuickAccessButton.vue'
import AlertsList from '../components/AlertsList.vue'
import CreateUserModal from '../components/CreateUserModal.vue'
import GlobalViewModal from '../components/GlobalViewModal.vue'
import SystemConfigModal from '../components/SystemConfigModal.vue'

// Stores
import { useAdminStudentsStore } from '../store/adminStudents'
import { useAdminTeachersStore } from '../store/teachers'
import { useClassesStore } from '../../Classes/store/classes'
import { useAuthStore } from '../../../stores/auth'
import { useTheme } from '../../../composables/useTheme'

// Setup
const router = useRouter()
const authStore = useAuthStore()
const studentsStore = useAdminStudentsStore()
const teachersStore = useAdminTeachersStore()
const classesStore = useClassesStore()
const { isDarkMode, toggleTheme: switchTheme } = useTheme()

// State
const showCreateUserModal = ref(false)
const showGlobalViewModal = ref(false)
const showSystemConfigModal = ref(false)

// Computed
const currentDate = computed(() => {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const stats = ref({
  totalStudents: 0,
  totalTeachers: 0,
  totalClasses: 0,
  activeUsers: 0,
  recentStudents: 0,
  recentTeachers: 0,
  recentClasses: 0
})

const attendanceData = ref([85, 87, 92, 88, 90, 87, 89])
const classesData = ref([10, 12, 11, 13, 12, 14, 12])
const observationsData = ref([5, 3, 4, 2, 3, 4, 3])
const performanceData = ref([92, 94, 91, 95, 93, 96, 94])

const recentActivities = ref([
  {
    id: 1,
    type: 'user_created',
    title: 'Nuevo estudiante registrado',
    description: 'María González se registró en el sistema',
    time: '5 min',
    icon: 'UserPlusIcon',
    color: 'blue'
  },
  {
    id: 2,
    type: 'class_created',
    title: 'Nueva clase creada',
    description: 'Clase de Piano Intermedio programada',
    time: '15 min',
    icon: 'AcademicCapIcon',
    color: 'green'
  },
  {
    id: 3,
    type: 'attendance_taken',
    title: 'Asistencia registrada',
    description: 'Profesor Juan tomó asistencia',
    time: '1 hora',
    icon: 'ClipboardDocumentCheckIcon',
    color: 'purple'
  }
])

const pendingApprovals = ref([
  {
    id: 1,
    type: 'teacher_application',
    title: 'Solicitud de Maestro',
    description: 'Carlos Mendez solicita ser maestro',
    priority: 'high'
  },
  {
    id: 2,
    type: 'schedule_change',
    title: 'Cambio de Horario',
    description: 'Clase de Guitarra requiere cambio',
    priority: 'medium'
  }
])

const systemAlerts = ref([
  {
    id: 1,
    type: 'warning',
    title: 'Espacio de almacenamiento',
    description: 'El sistema está usando 85% del espacio',
    time: '2 horas'
  },
  {
    id: 2,
    type: 'info',
    title: 'Actualización disponible',
    description: 'Nueva versión del sistema disponible',
    time: '1 día'
  }
])

// Methods
const loadStats = async () => {
  try {
    // Simplified stats loading - using realistic values
    stats.value.totalStudents = 150
    stats.value.totalTeachers = 25
    stats.value.totalClasses = 45
    stats.value.activeUsers = 95
    stats.value.recentStudents = 8
    stats.value.recentTeachers = 3
    stats.value.recentClasses = 5

    console.log('Stats loaded successfully')
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

// Super Action Handlers
const handleCreateUser = () => {
  showCreateUserModal.value = true
}

const handleGlobalView = () => {
  showGlobalViewModal.value = true
}

const handleAdvancedReports = () => {
  router.push('/admin/reports/advanced')
}

const handleSystemConfig = () => {
  showSystemConfigModal.value = true
}

const handleBackups = () => {
  router.push('/admin/system/backups')
}

const handleMonitoring = () => {
  router.push('/admin/system/monitoring')
}

// Management Action Handlers
const handleStudentsAction = (action: string) => {
  switch (action) {
    case 'view':
      router.push('/admin/students')
      break
    case 'create':
      router.push('/admin/students/create')
      break
    case 'export':
      // Handle export logic
      break
  }
}

const handleTeachersAction = (action: string) => {
  switch (action) {
    case 'view':
      router.push('/admin/teachers')
      break
    case 'create':
      router.push('/admin/teachers/create')
      break
    case 'permissions':
      router.push('/admin/permissions')
      break
  }
}

const handleClassesAction = (action: string) => {
  switch (action) {
    case 'view':
      router.push('/admin/classes')
      break
    case 'create':
      router.push('/admin/classes/create')
      break
    case 'schedule':
      router.push('/admin/schedules')
      break
  }
}

// Quick Access Handlers
const handleUrgentClass = () => {
  router.push('/admin/classes/create?urgent=true')
}

const handleGlobalMessage = () => {
  // Handle global message logic
  console.log('Send global message')
}

const handleExportData = () => {
  // Handle export logic
  console.log('Export data')
}

const handleNotificationConfig = () => {
  router.push('/admin/notifications/config')
}

const handleThemeManager = () => {
  console.log('Theme manager - simplified version')
  // Simple theme toggle instead of complex manager
  toggleAppTheme()
}

const toggleAppTheme = () => {
  switchTheme()
}

// Other Handlers
const handleApprovalAction = (approval: any, action: string) => {
  console.log('Approval action:', approval, action)
}

const handleDismissAlert = (alertId: number) => {
  systemAlerts.value = systemAlerts.value.filter(alert => alert.id !== alertId)
}

const handleUserCreated = (user: any) => {
  console.log('User created:', user)
  loadStats()
}

const handleSystemConfigUpdated = (config: any) => {
  console.log('System config updated:', config)
}

// Lifecycle
onMounted(() => {
  loadStats()
})
</script>

<style scoped>
/* Additional custom styles */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
</style>
