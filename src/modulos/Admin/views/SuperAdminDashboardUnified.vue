<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800"
  >
    <!-- Header Optimizado -->
    <div class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 py-6 sm:py-8">
        <div class="max-w-7xl mx-auto">
          <div
            class="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0"
          >
            <!-- Título y Descripción -->
            <div class="flex items-center space-x-3 sm:space-x-4">
              <div class="bg-gradient-to-r from-blue-500 to-purple-600 p-2 sm:p-3 rounded-xl">
                <CogIcon class="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1
                  class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                  Super Administrador
                </h1>
                <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                  Centro de comando integral - {{ currentDate }}
                </p>
              </div>
            </div>

            <!-- KPIs en Header -->
            <div class="w-full lg:w-auto">
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <div class="text-center">
                  <div class="text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {{ kpis.activeStudents }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Estudiantes</div>
                </div>
                <div class="text-center">
                  <div class="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">
                    {{ kpis.monthlyRevenue }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Ingresos</div>
                </div>
                <div class="text-center">
                  <div class="text-xl lg:text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {{ kpis.attendanceRate }}%
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Asistencia</div>
                </div>
                <div class="relative">
                  <!-- Notificaciones -->
                  <button
                    class="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    :class="{'text-red-500 hover:text-red-600': unreadCount > 0}"
                    @click="toggleNotifications"
                  >
                    <BellIcon class="w-6 h-6" />
                    <span
                      v-if="unreadCount > 0"
                      class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse"
                    >
                      {{ unreadCount > 9 ? "9+" : unreadCount }}
                    </span>
                  </button>

                  <!-- Dropdown de Notificaciones -->
                  <NotificationsDropdown
                    v-if="showNotifications"
                    :notifications="recentNotifications"
                    @close="showNotifications = false"
                    @mark-read="markAsRead"
                    @dismiss="dismissNotification"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas Críticas Banner -->
    <CriticalAlertsBar
      v-if="criticalAlerts.length > 0"
      :alerts="criticalAlerts"
      @dismiss="handleDismissAlert"
    />

    <!-- Contenido Principal -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <!-- Acciones Rápidas de Superpoderes -->
      <section class="mb-8">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">
          🚀 Acciones de Superpoderes
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <SuperPowerCard
            v-for="action in superActions"
            :key="action.id"
            :title="action.title"
            :description="action.description"
            :icon="action.icon"
            :gradient="action.gradient"
            @click="handleSuperAction(action.id)"
          />
        </div>
      </section>

      <!-- Dashboard Principal con Tabs -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <!-- Tabs Navigation -->
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="flex space-x-8 px-6" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
              ]"
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" class="w-4 h-4" />
              <span>{{ tab.label }}</span>
              <span
                v-if="tab.count"
                class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-0.5 px-2 rounded-full text-xs"
              >
                {{ tab.count }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Dashboard Overview Tab -->
          <div v-if="activeTab === 'overview'" class="space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Management Cards -->
              <div class="lg:col-span-2 space-y-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Gestión Principal
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ManagementCard
                    v-for="card in managementCards"
                    :key="card.id"
                    v-bind="card"
                    @action="handleManagementAction"
                  />
                </div>
              </div>

              <!-- Quick Stats -->
              <div class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Estado del Sistema
                </h3>
                <SystemStatusCard :status="systemStatus" />

                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Actividad Reciente
                </h3>
                <RecentActivityCard :activities="recentActivities" />
              </div>
            </div>
          </div>

          <!-- Students Tab -->
          <div v-if="activeTab === 'students'" class="space-y-6">
            <StudentsManagementPanel
              :students="students"
              @bulk-action="handleBulkAction"
              @export="handleExport"
              @import="handleImport"
            />
          </div>

          <!-- Teachers Tab -->
          <div v-if="activeTab === 'teachers'" class="space-y-6">
            <TeachersManagementPanel
              :teachers="teachers"
              @bulk-action="handleBulkAction"
              @schedule="handleSchedule"
            />
          </div>

          <!-- Classes Tab -->
          <div v-if="activeTab === 'classes'" class="space-y-6">
            <ClassesManagementPanel
              :classes="classes"
              @create="handleCreateClass"
              @schedule="handleScheduleClass"
            />
          </div>

          <!-- Analytics Tab -->
          <div v-if="activeTab === 'analytics'" class="space-y-6">
            <AnalyticsPanel :data="analyticsData" @generate-report="handleGenerateReport" />
          </div>

          <!-- System Tab -->
          <div v-if="activeTab === 'system'" class="space-y-6">
            <SystemConfigPanel
              :config="systemConfig"
              @update="handleSystemUpdate"
              @backup="handleBackup"
            />
          </div>
        </div>
      </div>

      <!-- Panel de Herramientas Avanzadas -->
      <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Comunicación Masiva -->
        <AdvancedToolCard
          title="Comunicación Masiva"
          description="Envío de mensajes, emails y notificaciones"
          icon="MegaphoneIcon"
          :tools="communicationTools"
          @action="handleCommunicationAction"
        />

        <!-- Herramientas de Datos -->
        <AdvancedToolCard
          title="Gestión de Datos"
          description="Importación, exportación y respaldos"
          icon="DatabaseIcon"
          :tools="dataTools"
          @action="handleDataAction"
        />
      </div>
    </div>

    <!-- Modales -->
    <Teleport to="body">
      <!-- Modal de Creación de Usuario -->
      <CreateUserModal
        v-if="showCreateUserModal"
        @close="showCreateUserModal = false"
        @created="handleUserCreated"
      />

      <!-- Modal de Vista Global -->
      <GlobalViewModal v-if="showGlobalViewModal" @close="showGlobalViewModal = false" />

      <!-- Modal de Configuración del Sistema -->
      <SystemConfigModal
        v-if="showSystemConfigModal"
        :config="systemConfig"
        @close="showSystemConfigModal = false"
        @updated="handleSystemConfigUpdated"
      />

      <!-- Modal de Generador de PDFs -->
      <PDFGeneratorModal
        v-if="showPDFGeneratorModal"
        @close="showPDFGeneratorModal = false"
        @generate="handlePDFGeneration"
      />

      <!-- Modal de Acción Masiva -->
      <BulkActionModal
        v-if="showBulkActionModal"
        :type="bulkActionType"
        :selection="bulkSelection"
        @close="showBulkActionModal = false"
        @execute="handleBulkActionExecute"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted} from "vue"
import {useRouter} from "vue-router"
import {
  CogIcon,
  BellIcon,
  UsersIcon,
  UserIcon,
  AcademicCapIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  MegaphoneIcon,
  DatabaseIcon,
  UserPlusIcon,
  GlobeAltIcon,
  CommandLineIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  DocumentChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CloudArrowDownIcon,
  DocumentArrowUpIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/vue/24/outline"

// Composables
import {useSuperAdminData} from "../composables/useSuperAdminData"
import {useSuperAdminFilters} from "../composables/useSuperAdminFilters"
import {useSuperAdminActions} from "../composables/useSuperAdminActions"
import {useSuperAdminCharts} from "../composables/useSuperAdminCharts"

// Components
import SuperPowerCard from "../components/SuperPowerCard.vue"
import ManagementCard from "../components/ManagementCard.vue"
import SystemStatusCard from "../components/SystemStatusCard.vue"
import RecentActivityCard from "../components/RecentActivityCard.vue"
import NotificationsDropdown from "../components/NotificationsDropdown.vue"
import CriticalAlertsBar from "../components/CriticalAlertsBar.vue"
import StudentsManagementPanel from "../components/StudentsManagementPanel.vue"
import TeachersManagementPanel from "../components/TeachersManagementPanel.vue"
import ClassesManagementPanel from "../components/ClassesManagementPanel.vue"
import AnalyticsPanel from "../components/AnalyticsPanel.vue"
import SystemConfigPanel from "../components/SystemConfigPanel.vue"
import AdvancedToolCard from "../components/AdvancedToolCard.vue"

// Modales
import CreateUserModal from "../components/CreateUserModal.vue"
import GlobalViewModal from "../components/GlobalViewModal.vue"
import SystemConfigModal from "../components/SystemConfigModal.vue"
import PDFGeneratorModal from "../components/PDFGeneratorModal.vue"
import BulkActionModal from "../components/BulkActionModal.vue"

// Setup
const router = useRouter()

// Composables principales
const {
  isLoading,
  lastUpdated,
  kpis,
  students,
  teachers,
  classes,
  systemStatus,
  recentActivities,
  analyticsData,
  loadAllData,
  refreshData,
  startAutoRefresh,
} = useSuperAdminData()

const {
  searchQuery,
  selectedStatus,
  selectedInstrument,
  selectedTeacher,
  selectedDateRange,
  sortBy,
  sortOrder,
  filteredStudents,
  filteredTeachers,
  filteredClasses,
  filterStats,
  quickFilters,
  clearAllFilters,
  toggleSortOrder,
  applyQuickFilter,
} = useSuperAdminFilters()

const {
  isProcessing,
  showBulkActions,
  selectedItems,
  confirmationModal,
  quickActions,
  bulkActions,
  hasSelection,
  selectionCount,
  canPerformBulkActions,
  navigateToAddStudent,
  navigateToAddTeacher,
  navigateToCreateClass,
  navigateToSettings,
  navigateToWhatsApp,
  performBackup,
  exportSelectedData,
  confirmBulkAction,
  executeConfirmedAction,
  closeConfirmationModal,
  toggleItemSelection,
  selectAllItems,
  clearSelection,
  toggleBulkActions,
} = useSuperAdminActions()

const {
  instrumentDistributionChart,
  enrollmentTrendChart,
  revenueChart,
  attendanceChart,
  ageDistributionChart,
  teacherPerformanceChart,
  advancedAnalytics,
  chartTheme,
  exportChartData,
} = useSuperAdminCharts()

// State local
const activeTab = ref("overview")
const showNotifications = ref(false)
const showCreateUserModal = ref(false)
const showGlobalViewModal = ref(false)
const showSystemConfigModal = ref(false)
const showPDFGeneratorModal = ref(false)
const showBulkActionModal = ref(false)
const bulkActionType = ref("")
const bulkSelection = ref([])
const autoRefreshInterval = ref(null)

// Computed
const currentDate = computed(() => {
  return new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
})

const unreadCount = computed(() => {
  return recentActivities.value.filter((activity) => !activity.read).length
})

const criticalAlerts = computed(() => {
  return recentActivities.value.filter(
    (activity) => activity.type === "error" || activity.type === "critical"
  )
})

// Data
const tabs = ref([
  {id: "overview", label: "Panel General", icon: CogIcon},
  {
    id: "students",
    label: "Estudiantes",
    icon: UsersIcon,
    count: computed(() => students.value.length),
  },
  {id: "teachers", label: "Maestros", icon: UserIcon, count: computed(() => teachers.value.length)},
  {
    id: "classes",
    label: "Clases",
    icon: AcademicCapIcon,
    count: computed(() => classes.value.length),
  },
  {id: "analytics", label: "Análisis", icon: ChartBarIcon},
  {id: "system", label: "Sistema", icon: Cog6ToothIcon},
])

const superActions = ref([
  {
    id: "create-user",
    title: "Nuevo Usuario",
    description: "Crear cualquier tipo de usuario",
    icon: "UserPlusIcon",
    gradient: "from-blue-500 to-blue-600",
    action: () => (showCreateUserModal.value = true),
  },
  {
    id: "global-view",
    title: "Vista Global",
    description: "Monitoreo integral del sistema",
    icon: "GlobeAltIcon",
    gradient: "from-purple-500 to-purple-600",
    action: () => (showGlobalViewModal.value = true),
  },
  {
    id: "advanced-reports",
    title: "Reportes Pro",
    description: "Análisis y reportes avanzados",
    icon: "ChartBarIcon",
    gradient: "from-green-500 to-green-600",
    action: () => (activeTab.value = "analytics"),
  },
  {
    id: "system-config",
    title: "Config Sistema",
    description: "Configuración avanzada",
    icon: "CogIcon",
    gradient: "from-orange-500 to-orange-600",
    action: () => (showSystemConfigModal.value = true),
  },
  {
    id: "bulk-operations",
    title: "Operaciones Masivas",
    description: "Acciones en lote",
    icon: "CommandLineIcon",
    gradient: "from-red-500 to-red-600",
    action: () => toggleBulkActions(),
  },
  {
    id: "pdf-generator",
    title: "PDFs Avanzados",
    description: "Generación de documentos",
    icon: "DocumentTextIcon",
    gradient: "from-emerald-500 to-emerald-600",
    action: () => (showPDFGeneratorModal.value = true),
  },
  {
    id: "whatsapp-management",
    title: "WhatsApp",
    description: "Gestión de comunicaciones",
    icon: "ChatBubbleLeftRightIcon",
    gradient: "from-green-500 to-green-600",
    action: () => navigateToWhatsApp(),
  },
])

const managementCards = ref([
  {
    id: "students",
    title: "Estudiantes",
    description: "Gestión integral de estudiantes",
    icon: "UsersIcon",
    count: computed(() => students.value.length),
    color: "blue",
    actions: ["view", "create", "export", "bulk"],
  },
  {
    id: "teachers",
    title: "Maestros",
    description: "Gestión de maestros y permisos",
    icon: "UserIcon",
    count: computed(() => teachers.value.length),
    color: "green",
    actions: ["view", "create", "schedule", "permissions"],
  },
  {
    id: "classes",
    title: "Clases",
    description: "Administración de clases",
    icon: "AcademicCapIcon",
    count: computed(() => classes.value.length),
    color: "purple",
    actions: ["view", "create", "schedule", "monitor"],
  },
  {
    id: "finances",
    title: "Finanzas",
    description: "Control financiero",
    icon: "CurrencyDollarIcon",
    count: computed(() => kpis.value.monthlyRevenue),
    color: "yellow",
    actions: ["view", "reports", "invoices"],
  },
])

const communicationTools = ref([
  {id: "mass-email", label: "Email Masivo", icon: "EnvelopeIcon"},
  {id: "mass-whatsapp", label: "WhatsApp Masivo", icon: "ChatBubbleLeftIcon"},
  {id: "notifications", label: "Notificaciones Push", icon: "BellIcon"},
  {id: "announcements", label: "Anuncios Generales", icon: "SpeakerWaveIcon"},
])

const dataTools = ref([
  {id: "import-students", label: "Importar Estudiantes", icon: "ArrowUpTrayIcon"},
  {id: "export-all", label: "Exportar Todo", icon: "ArrowDownTrayIcon"},
  {id: "backup-system", label: "Respaldo Completo", icon: "CloudArrowUpIcon"},
  {id: "migrate-data", label: "Migrar Datos", icon: "ArrowsRightLeftIcon"},
])

// Methods
const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

const handleSuperAction = (actionId: string) => {
  const action = superActions.value.find((a) => a.id === actionId)
  if (action && action.action) {
    action.action()
  }
}

const handleManagementAction = (action: string, type: string) => {
  switch (type) {
    case "students":
      if (action === "view") activeTab.value = "students"
      else if (action === "create") navigateToAddStudent()
      else if (action === "export") exportSelectedData()
      else if (action === "bulk") toggleBulkActions()
      break
    case "teachers":
      if (action === "view") activeTab.value = "teachers"
      else if (action === "create") navigateToAddTeacher()
      break
    case "classes":
      if (action === "view") activeTab.value = "classes"
      else if (action === "create") navigateToCreateClass()
      break
    case "finances":
      if (action === "view") activeTab.value = "analytics"
      break
  }
}

const handleBulkAction = (action: string, selection: any[]) => {
  bulkActionType.value = action
  bulkSelection.value = selection
  confirmBulkAction(action, `Ejecutar ${action} en ${selection.length} elementos`)
}

const handleBulkActionExecute = async (action: string, data: any) => {
  // Implementar lógica específica de cada acción masiva
  await executeConfirmedAction()
}

const handleExport = (format: string, data: any) => {
  exportSelectedData()
}

const handleImport = (file: File) => {
  // Implementar importación de datos
  console.log("Importing file:", file.name)
}

const handleSchedule = (data: any) => {
  // Implementar programación
  console.log("Scheduling:", data)
}

const handleCreateClass = (data: any) => {
  navigateToCreateClass()
}

const handleScheduleClass = (data: any) => {
  console.log("Scheduling class:", data)
}

const handleGenerateReport = (type: string, params: any) => {
  console.log("Generating report:", type, params)
}

const handleSystemUpdate = (config: any) => {
  console.log("Updating system config:", config)
}

const handleUserCreated = (user: any) => {
  console.log("User created:", user)
  showCreateUserModal.value = false
  refreshData()
}

const handleSystemConfigUpdated = (config: any) => {
  console.log("System config updated:", config)
  showSystemConfigModal.value = false
}

const handlePDFGeneration = (params: any) => {
  console.log("Generating PDF:", params)
  showPDFGeneratorModal.value = false
}

const handleCommunicationAction = (toolId: string) => {
  console.log("Communication action:", toolId)
}

const handleDataAction = (toolId: string) => {
  switch (toolId) {
    case "backup-system":
      performBackup()
      break
    case "export-all":
      exportSelectedData()
      break
    default:
      console.log("Data action:", toolId)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await loadAllData()
    autoRefreshInterval.value = startAutoRefresh()
  } catch (error) {
    console.error("Error loading dashboard data:", error)
  }
})

onUnmounted(() => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
  }
})
</script>

<style scoped>
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}
</style>
