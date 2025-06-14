<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Panel de Administración
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Sistema de gestión académica - El Sistema PC
            </p>
          </div>
            <!-- Actions and Stats -->
          <div class="flex items-center space-x-6">
            <!-- Super Admin Button -->
            <RouterLink 
              to="/admin/super"
              class="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
            >
              <BoltIcon class="w-5 h-5" />
              <span>Superpoderes</span>
            </RouterLink>
            
            <!-- Stats rápidas -->
            <div class="flex items-center space-x-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ stats.totalStudents }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Estudiantes</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ stats.totalTeachers }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Maestros</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ stats.totalClasses }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Clases</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="p-6">
      <!-- Quick Actions Row -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Crear Estudiante -->
          <QuickActionCard
            title="Nuevo Estudiante"
            description="Registrar nuevo estudiante"
            icon="UserPlusIcon"
            color="blue"
            @click="navigateTo('/students/new')"
            :permission="{ module: 'students', action: 'create' }"
          />
          
          <!-- Crear Clase -->
          <QuickActionCard
            title="Nueva Clase"
            description="Crear nueva clase"
            icon="AcademicCapIcon"
            color="green"
            @click="openCreateClassModal"
            :permission="{ module: 'classes', action: 'create' }"
          />
          
          <!-- Asignar Maestro -->
          <QuickActionCard
            title="Asignar Maestro"
            description="Asignar maestro a clase"
            icon="UserGroupIcon"
            color="purple"
            @click="openAssignTeacherModal"
            :permission="{ module: 'teachers', action: 'assign' }"
          />
          
          <!-- Gestionar Horarios -->
          <QuickActionCard
            title="Gestionar Horarios"
            description="Crear y editar horarios"
            icon="CalendarIcon"
            color="orange"
            @click="navigateTo('/admin/schedules')"
            :permission="{ module: 'schedules', action: 'manage' }"
          />
        </div>
      </section>

      <!-- Main Dashboard Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column - Management Modules -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Gestión de Recursos -->
          <DashboardSection
            title="Gestión de Recursos"
            icon="CogIcon"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">              <ManagementCard
                title="Estudiantes"
                description="Gestionar estudiantes registrados"
                icon="UsersIcon"
                route="/admin/students"
                :count="stats.totalStudents"
                color="blue"
                :permission="{ module: 'students', action: 'view_all' }"
                @quick-action="handleManagementCardAction"
              />
              
              <ManagementCard
                title="Maestros"
                description="Gestionar maestros y permisos"
                icon="UserIcon"
                route="/admin/teachers"
                :count="stats.totalTeachers"
                color="green"
                :permission="{ module: 'teachers', action: 'view_all' }"
                @quick-action="handleManagementCardAction"
              />
              
              <ManagementCard
                title="Clases"
                description="Gestionar clases y asignaciones"
                icon="AcademicCapIcon"
                route="/admin/classes"
                :count="stats.totalClasses"
                color="purple"
                :permission="{ module: 'classes', action: 'view_all' }"
                @quick-action="handleManagementCardAction"
              />
              
              <ManagementCard
                title="Horarios"
                description="Configurar horarios académicos"
                icon="CalendarDaysIcon"
                route="/admin/schedules"
                :count="stats.totalSchedules"
                color="orange"
                :permission="{ module: 'schedules', action: 'view_all' }"
                @quick-action="handleManagementCardAction"
              />
            </div>
          </DashboardSection>

          <!-- Análisis y Reportes -->
          <DashboardSection
            title="Análisis y Reportes"
            icon="ChartBarIcon"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">              <ReportCard
                title="Asistencias"
                description="Reporte de asistencias"
                icon="ClipboardDocumentCheckIcon"
                route="/admin/reports/attendance"
                value="92%"
                trend="+5%"
                color="green"
                :permission="{ module: 'reports', action: 'view_attendance' }"
                @quick-action="handleReportCardAction"
              />
              
              <ReportCard
                title="Rendimiento"
                description="Análisis de rendimiento"
                icon="TrophyIcon"
                route="/admin/reports/performance"
                value="87%"
                trend="+3%"
                color="blue"
                :permission="{ module: 'reports', action: 'view_performance' }"
                @quick-action="handleReportCardAction"
              />
              
              <ReportCard
                title="Inventario"
                description="Estado del inventario"
                icon="CubeIcon"
                route="/admin/inventory"
                value="234"
                trend="-2"
                color="orange"
                :permission="{ module: 'inventory', action: 'view' }"
                @quick-action="handleReportCardAction"
              />
            </div>
          </DashboardSection>
        </div>

        <!-- Right Column - Activity & Notifications -->
        <div class="space-y-6">
          <!-- Recent Activity -->          <DashboardSection
            title="Actividad Reciente"
            icon="BellIcon"
          >
            <RecentActivityList 
              :activities="recentActivities" 
              @activity-click="handleActivityClick"
              @load-more="handleActivityLoadMore"
            />
          </DashboardSection>

          <!-- System Status -->
          <DashboardSection
            title="Estado del Sistema"
            icon="ServerIcon"
          >
            <SystemStatusWidget 
              :status="systemStatus" 
              @refresh="handleSystemStatusRefresh"
              @view-details="handleSystemStatusViewDetails"
            />
          </DashboardSection>

          <!-- Pending Approvals -->
          <DashboardSection
            title="Aprobaciones Pendientes"
            icon="ExclamationTriangleIcon"
          >
            <PendingApprovalsList 
              :approvals="pendingApprovals" 
              @approve="(approval) => handleApprovalAction(approval, 'approve')"
              @reject="(approval, reason) => handleApprovalAction(approval, 'reject', reason)"
              @load-more="handleApprovalsLoadMore"
            />
          </DashboardSection>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <CreateClassModal
      v-if="showCreateClassModal"
      @close="showCreateClassModal = false"
      @created="handleClassCreated"
    />
    
    <AssignTeacherModal
      v-if="showAssignTeacherModal"
      @close="showAssignTeacherModal = false"
      @assigned="handleTeacherAssigned"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { BoltIcon } from '@heroicons/vue/24/outline'
import { useAdminDashboard } from '../composables/useAdminDashboard'
import QuickActionCard from '../components/QuickActionCard.vue'
import DashboardSection from '../components/DashboardSection.vue'
import ManagementCard from '../components/ManagementCard.vue'
import ReportCard from '../components/ReportCard.vue'
import RecentActivityList from '../components/RecentActivityList.vue'
import SystemStatusWidget from '../components/SystemStatusWidget.vue'
import PendingApprovalsList from '../components/PendingApprovalsList.vue'
import CreateClassModal from '../components/CreateClassModal.vue'
import AssignTeacherModal from '../components/AssignTeacherModal.vue'

const router = useRouter()
const {
  // State
  isLoading,
  
  // Computed
  dashboardStats: stats,
  recentActivities,
  systemStatus,
  pendingApprovals,
  systemHealthScore,
  
  // Permissions
  canCreateClass,
  canAssignTeacher,
  canViewReports,
  canManageUsers,
  canApproveRequests,
  
  // Methods
  loadDashboardData,
  refreshDashboardStats,
  refreshSystemStatus,
  handleApproval,
  startAutoRefresh,
  stopAutoRefresh,
  getQuickActions,
  getManagementCards
} = useAdminDashboard()

// Modal states
const showCreateClassModal = ref(false)
const showAssignTeacherModal = ref(false)

// Methods
const navigateTo = async (route: string) => {
  try {
    await router.push(route)
  } catch (error) {
    console.error('Navigation error:', error)
  }
}

const openCreateClassModal = () => {
  if (canCreateClass.value) {
    showCreateClassModal.value = true
  }
}

const openAssignTeacherModal = () => {
  if (canAssignTeacher.value) {
    showAssignTeacherModal.value = true
  }
}

const handleClassCreated = async (classData: any) => {
  showCreateClassModal.value = false
  console.log('Clase creada:', classData)
  await refreshDashboardStats()
}

const handleTeacherAssigned = async (assignmentData: any) => {
  showAssignTeacherModal.value = false
  console.log('Maestro asignado:', assignmentData)
  await refreshDashboardStats()
}

const handleApprovalAction = async (approval: any, action: 'approve' | 'reject', reason?: string) => {
  await handleApproval(approval, action, reason)
}

const handleSystemStatusRefresh = async () => {
  await refreshSystemStatus()
}

const handleManagementCardAction = (action: any) => {
  console.log('Management card action:', action)
}

const handleReportCardAction = (action: string) => {
  console.log('Report card action:', action)
}

const handleActivityClick = (activity: any) => {
  console.log('Activity clicked:', activity)
}

const handleActivityLoadMore = () => {
  console.log('Load more activities')
}

const handleApprovalsLoadMore = () => {
  console.log('Load more approvals')
}

const handleSystemStatusViewDetails = () => {
  console.log('View system status details')
}

// Lifecycle
onMounted(async () => {
  await loadDashboardData()
  startAutoRefresh(5) // Auto-refresh every 5 minutes
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
/* Dashboard específico styles */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 2fr 1fr;
  }
}
</style>
