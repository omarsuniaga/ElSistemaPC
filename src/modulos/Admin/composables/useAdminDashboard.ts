import { ref, computed } from 'vue'
import { useAdminStore } from '../store/admin'
import { useRBACStore } from '@/stores/rbacStore'
import { useNotificationsStore } from '@/stores/notifications'

export const useAdminDashboard = () => {
  const adminStore = useAdminStore()
  const rbacStore = useRBACStore()
  const notificationsStore = useNotificationsStore()
  const { showNotification } = { showNotification: notificationsStore.addNotification }

  // State
  const isLoading = ref(false)
  const refreshInterval = ref<number | null>(null)

  // Computed properties
  const dashboardStats = computed(() => adminStore.dashboardStats)
  const recentActivities = computed(() => adminStore.recentActivities)
  const systemStatus = computed(() => adminStore.systemStatus)
  const pendingApprovals = computed(() => adminStore.pendingApprovals)

  const systemHealthScore = computed(() => {
    const status = systemStatus.value
    const statuses = [status.database, status.storage, status.auth]
    const onlineCount = statuses.filter(s => s === 'online').length
    const warningCount = statuses.filter(s => s === 'warning').length
    
    // Calculate score: online = 100%, warning = 50%, offline = 0%
    const score = (onlineCount * 100 + warningCount * 50) / (statuses.length * 100) * 100
    return Math.round(score)
  })

  const totalEntities = computed(() =>
    dashboardStats.value.totalStudents +
    dashboardStats.value.totalTeachers +
    dashboardStats.value.totalClasses
  )

  const highPriorityApprovals = computed(() =>
    pendingApprovals.value.filter(approval => approval.priority === 'high')
  )

  // Methods
  const loadDashboardData = async () => {
    try {
      isLoading.value = true
      
      await Promise.all([
        adminStore.loadDashboardStats(),
        adminStore.loadRecentActivities(),
        adminStore.loadSystemStatus(),
        adminStore.loadPendingApprovals()
      ])

      console.log('📊 Dashboard data loaded successfully')
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      showNotification('Error al cargar datos del dashboard', 'error')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const refreshDashboardStats = async () => {
    try {
      await adminStore.loadDashboardStats()
      showNotification('Estadísticas actualizadas', 'success')
    } catch (error) {
      console.error('Error refreshing stats:', error)
      showNotification('Error al actualizar estadísticas', 'error')
    }
  }

  const refreshSystemStatus = async () => {
    try {
      await adminStore.loadSystemStatus()
      showNotification('Estado del sistema actualizado', 'success')
    } catch (error) {
      console.error('Error refreshing system status:', error)
      showNotification('Error al actualizar estado del sistema', 'error')
    }
  }
  const handleApproval = async (approval: any, action: 'approve' | 'reject', reason?: string) => {
    try {
      if (action === 'approve') {
        // TODO: Implementar método approveRequest en store
        // await adminStore.approveRequest(approval.id)
        console.log('Approving request:', approval.id)
        showNotification(`Solicitud "${approval.title}" aprobada`, 'success')
      } else {
        // TODO: Implementar método rejectRequest en store
        // await adminStore.rejectRequest(approval.id, reason)
        console.log('Rejecting request:', approval.id, reason)
        showNotification(`Solicitud "${approval.title}" rechazada`, 'warning')
      }
      
      // Refresh approvals list
      await adminStore.loadPendingApprovals()
    } catch (error) {
      console.error('Error handling approval:', error)
      showNotification('Error al procesar solicitud', 'error')
    }
  }

  const handleQuickAction = async (actionType: string, data?: any) => {
    try {
      switch (actionType) {
        case 'create_student':
          // Navigate to student creation
          break
        case 'create_class':
          // Open create class modal
          break
        case 'assign_teacher':
          // Open assign teacher modal
          break
        case 'manage_schedules':
          // Navigate to schedules management
          break
        default:
          console.warn('Unknown quick action:', actionType)
      }
    } catch (error) {
      console.error('Error handling quick action:', error)
      showNotification('Error al ejecutar acción', 'error')
    }
  }

  const startAutoRefresh = (intervalMinutes: number = 5) => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
    }
    
    refreshInterval.value = window.setInterval(() => {
      loadDashboardData()
    }, intervalMinutes * 60 * 1000)
  }

  const stopAutoRefresh = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
  }
  // Permission checks
  const canCreateClass = computed(() => 
    rbacStore.hasPermission('classes_create')
  )

  const canAssignTeacher = computed(() => 
    rbacStore.hasPermission('teachers_assign')
  )

  const canViewReports = computed(() => 
    rbacStore.hasPermission('reports_view')
  )

  const canManageUsers = computed(() => 
    rbacStore.hasPermission('users_manage')
  )

  const canViewSystemStatus = computed(() => 
    rbacStore.hasPermission('system_view_status')
  )

  const canApproveRequests = computed(() => 
    rbacStore.hasPermission('requests_approve')
  )

  // Navigation helpers
  const getQuickActions = () => {
    const actions = []

    if (canCreateClass.value) {
      actions.push({
        id: 'create_class',
        title: 'Nueva Clase',
        description: 'Crear nueva clase',
        icon: 'AcademicCapIcon',
        color: 'green'
      })
    }

    if (canAssignTeacher.value) {
      actions.push({
        id: 'assign_teacher',
        title: 'Asignar Maestro',
        description: 'Asignar maestro a clase',
        icon: 'UserGroupIcon',
        color: 'purple'
      })
    }

    return actions
  }

  const getManagementCards = () => {
    const cards = []

    if (canManageUsers.value) {
      cards.push(
        {
          title: 'Estudiantes',
          description: 'Gestionar estudiantes registrados',
          icon: 'UsersIcon',
          route: '/admin/students',
          count: dashboardStats.value.totalStudents,
          color: 'blue'
        },
        {
          title: 'Maestros',
          description: 'Gestionar maestros y permisos',
          icon: 'UserIcon',
          route: '/admin/teachers',
          count: dashboardStats.value.totalTeachers,
          color: 'green'
        }
      )
    }

    if (canCreateClass.value) {
      cards.push({
        title: 'Clases',
        description: 'Gestionar clases y asignaciones',
        icon: 'AcademicCapIcon',
        route: '/admin/classes',
        count: dashboardStats.value.totalClasses,
        color: 'purple'
      })
    }

    return cards
  }

  return {
    // State
    isLoading,
    
    // Computed
    dashboardStats,
    recentActivities,
    systemStatus,
    pendingApprovals,
    systemHealthScore,
    totalEntities,
    highPriorityApprovals,
    
    // Permissions
    canCreateClass,
    canAssignTeacher,
    canViewReports,
    canManageUsers,
    canViewSystemStatus,
    canApproveRequests,
    
    // Methods
    loadDashboardData,
    refreshDashboardStats,
    refreshSystemStatus,
    handleApproval,
    handleQuickAction,
    startAutoRefresh,
    stopAutoRefresh,
    getQuickActions,
    getManagementCards
  }
}
