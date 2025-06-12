import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { collection, query, getDocs, orderBy, limit, where, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase'

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalSchedules: number
  activeUsers: number
  attendanceRate: number
  performanceAverage: number
  inventoryItems: number
}

interface Activity {
  id: string
  type: 'create' | 'update' | 'delete' | 'login' | 'assignment'
  entity: string
  description: string
  user: string
  timestamp: Date
  icon: string
  color: string
}

interface SystemStatus {
  database: 'online' | 'offline' | 'warning'
  storage: 'online' | 'offline' | 'warning'
  auth: 'online' | 'offline' | 'warning'
  lastBackup: Date
  systemLoad: number
  activeConnections: number
}

interface PendingApproval {
  id: string
  type: 'teacher_registration' | 'schedule_change' | 'class_creation' | 'student_enrollment'
  title: string
  description: string
  requestedBy: string
  requestedAt: Date
  priority: 'low' | 'medium' | 'high'
  data: any
}

export const useAdminStore = defineStore('admin', () => {
  // State
  const dashboardStats = ref<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSchedules: 0,
    activeUsers: 0,
    attendanceRate: 0,
    performanceAverage: 0,
    inventoryItems: 0
  })

  const recentActivities = ref<Activity[]>([])
  const systemStatus = ref<SystemStatus>({
    database: 'online',
    storage: 'online',
    auth: 'online',
    lastBackup: new Date(),
    systemLoad: 0,
    activeConnections: 0
  })

  const pendingApprovals = ref<PendingApproval[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const totalEntities = computed(() => 
    dashboardStats.value.totalStudents + 
    dashboardStats.value.totalTeachers + 
    dashboardStats.value.totalClasses
  )

  const systemHealthScore = computed(() => {
    const statuses = [systemStatus.value.database, systemStatus.value.storage, systemStatus.value.auth]
    const onlineCount = statuses.filter(status => status === 'online').length
    return Math.round((onlineCount / statuses.length) * 100)
  })

  const highPriorityApprovals = computed(() =>
    pendingApprovals.value.filter(approval => approval.priority === 'high')
  )

  // Actions
  const loadDashboardStats = async () => {
    try {
      isLoading.value = true
      error.value = null

      // Load students count
      const studentsQuery = query(collection(db, 'STUDENTS'))
      const studentsSnapshot = await getDocs(studentsQuery)
      dashboardStats.value.totalStudents = studentsSnapshot.size

      // Load teachers count
      const teachersQuery = query(
        collection(db, 'USERS'),
        where('role', '==', 'Maestro')
      )
      const teachersSnapshot = await getDocs(teachersQuery)
      dashboardStats.value.totalTeachers = teachersSnapshot.size

      // Load classes count
      const classesQuery = query(collection(db, 'CLASSES'))
      const classesSnapshot = await getDocs(classesQuery)
      dashboardStats.value.totalClasses = classesSnapshot.size

      // Load schedules count
      const schedulesQuery = query(collection(db, 'SCHEDULES'))
      const schedulesSnapshot = await getDocs(schedulesQuery)
      dashboardStats.value.totalSchedules = schedulesSnapshot.size

      // Calculate attendance rate (example calculation)
      dashboardStats.value.attendanceRate = 92.5

      // Calculate performance average (example calculation)
      dashboardStats.value.performanceAverage = 87.3

      console.log('📊 Dashboard stats loaded:', dashboardStats.value)

    } catch (err: any) {
      console.error('Error loading dashboard stats:', err)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const loadRecentActivities = async () => {
    try {
      // Load from activity log collection
      const activitiesQuery = query(
        collection(db, 'ACTIVITY_LOG'),
        orderBy('timestamp', 'desc'),
        limit(10)
      )
      
      const activitiesSnapshot = await getDocs(activitiesQuery)
      recentActivities.value = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Activity[]

      // If no activities exist, create sample data
      if (recentActivities.value.length === 0) {
        recentActivities.value = [
          {
            id: '1',
            type: 'create',
            entity: 'student',
            description: 'Nuevo estudiante registrado: María González',
            user: 'Director Principal',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            icon: 'UserPlusIcon',
            color: 'blue'
          },
          {
            id: '2',
            type: 'assignment',
            entity: 'class',
            description: 'Maestro asignado a clase de Piano Avanzado',
            user: 'Admin Sistema',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            icon: 'AcademicCapIcon',
            color: 'green'
          },
          {
            id: '3',
            type: 'update',
            entity: 'schedule',
            description: 'Horario actualizado para clases de guitarra',
            user: 'Director Principal',
            timestamp: new Date(Date.now() - 1000 * 60 * 90),
            icon: 'CalendarIcon',
            color: 'orange'
          }
        ]
      }

    } catch (err: any) {
      console.error('Error loading recent activities:', err)
      error.value = err.message
    }
  }

  const loadSystemStatus = async () => {
    try {
      // Check system status (simplified for demo)
      systemStatus.value = {
        database: 'online',
        storage: 'online',
        auth: 'online',
        lastBackup: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        systemLoad: Math.random() * 100,
        activeConnections: Math.floor(Math.random() * 50) + 10
      }

    } catch (err: any) {
      console.error('Error loading system status:', err)
      error.value = err.message
    }
  }

  const loadPendingApprovals = async () => {
    try {
      const approvalsQuery = query(
        collection(db, 'PENDING_APPROVALS'),
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'desc')
      )
      
      const approvalsSnapshot = await getDocs(approvalsQuery)
      pendingApprovals.value = approvalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date()
      })) as PendingApproval[]

      // Sample data if empty
      if (pendingApprovals.value.length === 0) {
        pendingApprovals.value = [
          {
            id: '1',
            type: 'teacher_registration',
            title: 'Nuevo maestro de violín',
            description: 'Carlos Méndez solicita registro como maestro',
            requestedBy: 'Carlos Méndez',
            requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
            priority: 'high',
            data: { teacherId: 'teacher_123' }
          },
          {
            id: '2',
            type: 'schedule_change',
            title: 'Cambio de horario - Piano Básico',
            description: 'Solicitud de cambio de horario para clase de piano',
            requestedBy: 'Ana López',
            requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
            priority: 'medium',
            data: { classId: 'class_456' }
          }
        ]
      }

    } catch (err: any) {
      console.error('Error loading pending approvals:', err)
      error.value = err.message
    }
  }

  const approveRequest = async (approvalId: string, approved: boolean) => {
    try {
      const approvalRef = doc(db, 'PENDING_APPROVALS', approvalId)
      await updateDoc(approvalRef, {
        status: approved ? 'approved' : 'rejected',
        resolvedAt: new Date(),
        resolvedBy: 'current_user_id' // Replace with actual user ID
      })

      // Remove from local state
      pendingApprovals.value = pendingApprovals.value.filter(
        approval => approval.id !== approvalId
      )

      // Log activity
      await logActivity({
        type: approved ? 'create' : 'delete',
        entity: 'approval',
        description: `Solicitud ${approved ? 'aprobada' : 'rechazada'}`,
        user: 'Admin', // Replace with actual user name
        icon: approved ? 'CheckIcon' : 'XMarkIcon',
        color: approved ? 'green' : 'red'
      })

    } catch (err: any) {
      console.error('Error approving request:', err)
      throw err
    }
  }

  const logActivity = async (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    try {
      const activityData = {
        ...activity,
        timestamp: new Date()
      }

      await addDoc(collection(db, 'ACTIVITY_LOG'), activityData)
      
      // Add to local state
      recentActivities.value.unshift({
        id: Date.now().toString(),
        ...activityData
      })

      // Keep only last 20 activities in local state
      if (recentActivities.value.length > 20) {
        recentActivities.value = recentActivities.value.slice(0, 20)
      }

    } catch (err: any) {
      console.error('Error logging activity:', err)
    }
  }

  const refreshDashboardStats = async () => {
    await loadDashboardStats()
  }

  const createClass = async (classData: any) => {
    try {
      const docRef = await addDoc(collection(db, 'CLASSES'), {
        ...classData,
        createdAt: new Date(),
        createdBy: 'current_user_id' // Replace with actual user ID
      })

      await logActivity({
        type: 'create',
        entity: 'class',
        description: `Nueva clase creada: ${classData.name}`,
        user: 'Admin',
        icon: 'AcademicCapIcon',
        color: 'green'
      })

      await refreshDashboardStats()
      return docRef.id

    } catch (err: any) {
      console.error('Error creating class:', err)
      throw err
    }
  }

  const assignTeacher = async (classId: string, teacherId: string) => {
    try {
      const classRef = doc(db, 'CLASSES', classId)
      await updateDoc(classRef, {
        teacherId,
        assignedAt: new Date(),
        assignedBy: 'current_user_id'
      })

      await logActivity({
        type: 'assignment',
        entity: 'teacher',
        description: `Maestro asignado a clase`,
        user: 'Admin',
        icon: 'UserGroupIcon',
        color: 'purple'
      })

      await refreshDashboardStats()

    } catch (err: any) {
      console.error('Error assigning teacher:', err)
      throw err
    }
  }

  // Reset function
  const $reset = () => {
    dashboardStats.value = {
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      totalSchedules: 0,
      activeUsers: 0,
      attendanceRate: 0,
      performanceAverage: 0,
      inventoryItems: 0
    }
    recentActivities.value = []
    systemStatus.value = {
      database: 'online',
      storage: 'online',
      auth: 'online',
      lastBackup: new Date(),
      systemLoad: 0,
      activeConnections: 0
    }
    pendingApprovals.value = []
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    dashboardStats,
    recentActivities,
    systemStatus,
    pendingApprovals,
    isLoading,
    error,

    // Getters
    totalEntities,
    systemHealthScore,
    highPriorityApprovals,

    // Actions
    loadDashboardStats,
    loadRecentActivities,
    loadSystemStatus,
    loadPendingApprovals,
    approveRequest,
    logActivity,
    refreshDashboardStats,
    createClass,
    assignTeacher,
    $reset
  }
})
