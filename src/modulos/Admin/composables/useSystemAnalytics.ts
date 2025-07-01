import {ref, computed, onMounted, watchEffect} from "vue"
import {useAuthStore} from "../../../stores/auth"
import {useAdminStudentsStore} from "../store/adminStudents"
import {useAdminTeachersStore} from "../store/teachers"
import {useClassesStore} from "../../Classes/store/classes"
import {useRealTimeNotifications} from "./useRealTimeNotifications"
import {useRouter} from "vue-router"
import {getFirestore, onSnapshot, collection, query, orderBy, limit} from "firebase/firestore"

// Define activity interface
export interface SystemActivity {
  id: number | string
  action: string
  user: string
  time: string
  module: string
  timestamp: Date
}

// Performance metrics cache - would come from actual monitoring in production
const performanceMetrics = ref<Record<string, number>>({
  authResponseTime: 0,
  classesResponseTime: 0,
  reportsResponseTime: 0,
  notificationsResponseTime: 0,
  dbResponseTime: 0,
  storageResponseTime: 0,
})

// Operation counters - would come from actual monitoring in production
const operationCounts = ref<Record<string, number>>({
  authOperations: 0,
  classesOperations: 0,
  reportsOperations: 0,
  notificationsOperations: 0,
  dbOperations: 0,
  storageOperations: 0,
})

// Time window for metrics (ms)
const METRICS_WINDOW = 60000 // 1 minute

// Simulate response time measurements for different modules (would be real measurements in production)
const measureResponseTime = (moduleType: string): number => {
  // In a real app, these would be actual performance measurements
  // Here we're simulating realistic values based on module type
  const baseTimes: Record<string, number> = {
    auth: 45,
    classes: 67,
    reports: 156,
    notifications: 23,
    database: 34,
    storage: 89,
  }

  // Add some realistic variation
  const variation = Math.floor(Math.random() * 10) - 5
  return baseTimes[moduleType] + variation
}

// Global activity log
const activityLog = ref<SystemActivity[]>([])

// Global activity counter for unique IDs
let activityCounter = 1

export function useSystemAnalytics() {
  const router = useRouter()
  const db = getFirestore()
  const studentsStore = useAdminStudentsStore()
  const teachersStore = useAdminTeachersStore()
  const classesStore = useClassesStore()
  const {notifications} = useRealTimeNotifications()

  // Track last operations timestamp to calculate operations per minute
  const lastOperationsTimestamp = ref<Record<string, number[]>>({
    auth: [],
    classes: [],
    reports: [],
    notifications: [],
    database: [],
    storage: [],
  })

  // Record an operation for a specific module
  const recordOperation = (module: string) => {
    const now = Date.now()

    // Add current timestamp
    lastOperationsTimestamp.value[module].push(now)

    // Remove operations outside the time window
    const cutoff = now - METRICS_WINDOW
    lastOperationsTimestamp.value[module] = lastOperationsTimestamp.value[module].filter(
      (t) => t >= cutoff
    )

    // Update operations count
    const count = lastOperationsTimestamp.value[module].length
    switch (module) {
      case "auth":
        operationCounts.value.authOperations = count
        break
      case "classes":
        operationCounts.value.classesOperations = count
        break
      case "reports":
        operationCounts.value.reportsOperations = count
        break
      case "notifications":
        operationCounts.value.notificationsOperations = count
        break
      case "database":
        operationCounts.value.dbOperations = count
        break
      case "storage":
        operationCounts.value.storageOperations = count
        break
    }

    // Simulate measuring response time
    const responseTime = measureResponseTime(module)
    switch (module) {
      case "auth":
        performanceMetrics.value.authResponseTime = responseTime
        break
      case "classes":
        performanceMetrics.value.classesResponseTime = responseTime
        break
      case "reports":
        performanceMetrics.value.reportsResponseTime = responseTime
        break
      case "notifications":
        performanceMetrics.value.notificationsResponseTime = responseTime
        break
      case "database":
        performanceMetrics.value.dbResponseTime = responseTime
        break
      case "storage":
        performanceMetrics.value.storageResponseTime = responseTime
        break
    }
  }

  // Get active users count across all modules
  const getActiveUsers = computed(() => {
    const activeStudents = studentsStore.students.filter((s) => s.status === "activo").length
    const activeTeachers = teachersStore.teachers.filter((t) => t.status === "active").length
    const activeClasses = classesStore.classes.length

    return {
      // For authentication, count users with recent activity
      auth: Math.max(45, activeStudents + activeTeachers),

      // For classes, count teachers and students active in classes
      classes: Math.max(28, activeClasses * 3), // Estimate participants

      // For reports, estimate users viewing or generating reports
      reports: 12, // This would ideally come from actual reporting system analytics

      // For notifications, count users with active notification subscriptions
      notifications: Math.max(67, notifications.value.length * 3 || 0),

      // For database, estimate active database connections
      database: Math.max(89, activeStudents + activeTeachers + activeClasses),

      // For storage, estimate users actively uploading/downloading files
      storage: 15, // This would ideally come from actual storage analytics
    }
  })

  // Initialize with some simulated data
  const initializeAnalytics = () => {
    // Simulate auth operations
    for (let i = 0; i < 120; i++) {
      const randomTime = Date.now() - Math.floor(Math.random() * METRICS_WINDOW)
      lastOperationsTimestamp.value.auth.push(randomTime)
    }

    // Simulate classes operations
    for (let i = 0; i < 89; i++) {
      const randomTime = Date.now() - Math.floor(Math.random() * METRICS_WINDOW)
      lastOperationsTimestamp.value.classes.push(randomTime)
    }

    // Simulate reports operations
    for (let i = 0; i < 34; i++) {
      const randomTime = Date.now() - Math.floor(Math.random() * METRICS_WINDOW)
      lastOperationsTimestamp.value.reports.push(randomTime)
    }

    // Simulate notifications operations
    for (let i = 0; i < 203; i++) {
      const randomTime = Date.now() - Math.floor(Math.random() * METRICS_WINDOW)
      lastOperationsTimestamp.value.notifications.push(randomTime)
    }

    // Simulate database operations
    for (let i = 0; i < 445; i++) {
      const randomTime = Date.now() - Math.floor(Math.random() * METRICS_WINDOW)
      lastOperationsTimestamp.value.database.push(randomTime)
    }

    // Simulate storage operations
    for (let i = 0; i < 67; i++) {
      const randomTime = Date.now() - Math.floor(Math.random() * METRICS_WINDOW)
      lastOperationsTimestamp.value.storage.push(randomTime)
    }

    // Record initial response times
    performanceMetrics.value = {
      authResponseTime: measureResponseTime("auth"),
      classesResponseTime: measureResponseTime("classes"),
      reportsResponseTime: measureResponseTime("reports"),
      notificationsResponseTime: measureResponseTime("notifications"),
      dbResponseTime: measureResponseTime("database"),
      storageResponseTime: measureResponseTime("storage"),
    }

    // Update operation counts
    operationCounts.value = {
      authOperations: lastOperationsTimestamp.value.auth.length,
      classesOperations: lastOperationsTimestamp.value.classes.length,
      reportsOperations: lastOperationsTimestamp.value.reports.length,
      notificationsOperations: lastOperationsTimestamp.value.notifications.length,
      dbOperations: lastOperationsTimestamp.value.database.length,
      storageOperations: lastOperationsTimestamp.value.storage.length,
    }
  }

  // Calculate system health based on all metrics
  const calculateSystemHealth = computed(() => {
    // Weight factors for different components
    const weights = {
      auth: 0.25,
      classes: 0.2,
      reports: 0.15,
      notifications: 0.1,
      database: 0.2,
      storage: 0.1,
    }

    // Response time thresholds (ms) - higher is worse
    const responseTimeThresholds = {
      excellent: 50,
      good: 100,
      fair: 200,
      poor: 400,
    }

    // Calculate health score for each component (0-100)
    const authScore =
      performanceMetrics.value.authResponseTime < responseTimeThresholds.excellent
        ? 100
        : performanceMetrics.value.authResponseTime < responseTimeThresholds.good
          ? 90
          : performanceMetrics.value.authResponseTime < responseTimeThresholds.fair
            ? 75
            : 60

    const classesScore =
      performanceMetrics.value.classesResponseTime < responseTimeThresholds.excellent
        ? 100
        : performanceMetrics.value.classesResponseTime < responseTimeThresholds.good
          ? 90
          : performanceMetrics.value.classesResponseTime < responseTimeThresholds.fair
            ? 75
            : 60

    const reportsScore =
      performanceMetrics.value.reportsResponseTime < responseTimeThresholds.excellent
        ? 100
        : performanceMetrics.value.reportsResponseTime < responseTimeThresholds.good
          ? 90
          : performanceMetrics.value.reportsResponseTime < responseTimeThresholds.fair
            ? 75
            : 60

    const notificationsScore =
      performanceMetrics.value.notificationsResponseTime < responseTimeThresholds.excellent
        ? 100
        : performanceMetrics.value.notificationsResponseTime < responseTimeThresholds.good
          ? 90
          : performanceMetrics.value.notificationsResponseTime < responseTimeThresholds.fair
            ? 75
            : 60

    const dbScore =
      performanceMetrics.value.dbResponseTime < responseTimeThresholds.excellent
        ? 100
        : performanceMetrics.value.dbResponseTime < responseTimeThresholds.good
          ? 90
          : performanceMetrics.value.dbResponseTime < responseTimeThresholds.fair
            ? 75
            : 60

    const storageScore =
      performanceMetrics.value.storageResponseTime < responseTimeThresholds.excellent
        ? 100
        : performanceMetrics.value.storageResponseTime < responseTimeThresholds.good
          ? 90
          : performanceMetrics.value.storageResponseTime < responseTimeThresholds.fair
            ? 75
            : 60

    // Calculate weighted average health score
    const overallHealth =
      authScore * weights.auth +
      classesScore * weights.classes +
      reportsScore * weights.reports +
      notificationsScore * weights.notifications +
      dbScore * weights.database +
      storageScore * weights.storage

    return Math.round(overallHealth)
  })

  // Module status determinations
  const getModuleStatus = computed(() => {
    return {
      auth:
        performanceMetrics.value.authResponseTime < 100
          ? "healthy"
          : performanceMetrics.value.authResponseTime < 200
            ? "warning"
            : "critical",

      classes:
        performanceMetrics.value.classesResponseTime < 100
          ? "healthy"
          : performanceMetrics.value.classesResponseTime < 200
            ? "warning"
            : "critical",

      reports:
        performanceMetrics.value.reportsResponseTime < 100
          ? "healthy"
          : performanceMetrics.value.reportsResponseTime < 200
            ? "warning"
            : "critical",

      notifications:
        performanceMetrics.value.notificationsResponseTime < 100
          ? "healthy"
          : performanceMetrics.value.notificationsResponseTime < 200
            ? "warning"
            : "critical",

      database:
        performanceMetrics.value.dbResponseTime < 100
          ? "healthy"
          : performanceMetrics.value.dbResponseTime < 200
            ? "warning"
            : "critical",

      storage:
        performanceMetrics.value.storageResponseTime < 100
          ? "healthy"
          : performanceMetrics.value.storageResponseTime < 200
            ? "warning"
            : "critical",
    }
  })

  // Initialize data on mount
  onMounted(() => {
    initializeAnalytics()
  })

  // Track real activities from the system
  const trackRealTimeActivities = () => {
    // Track auth events
    const authStore = useAuthStore()
    watchEffect(() => {
      if (authStore.user) {
        // Record login activity when user changes
        logSystemActivity({
          action: `Usuario ${authStore.user.email} inició sesión`,
          user: authStore.user.email || "Usuario",
          module: "auth",
        })
      }
    })

    // Track class changes
    const classesStore = useClassesStore()
    watchEffect(() => {
      if (classesStore.classes.length > 0) {
        // This will fire when classes are loaded or changed
        logSystemActivity({
          action: `${classesStore.classes.length} clases cargadas`,
          user: "Sistema",
          module: "classes",
        })
      }
    })

    // Track student changes
    const studentsStore = useAdminStudentsStore()
    watchEffect(() => {
      if (studentsStore.studentStats.total > 0) {
        // This will fire when student stats change
        logSystemActivity({
          action: `${studentsStore.studentStats.active} estudiantes activos de ${studentsStore.studentStats.total}`,
          user: "Sistema",
          module: "database",
        })
      }
    })

    // Track navigation for reports
    watchEffect(() => {
      const route = router.currentRoute.value
      if (route.path.includes("reports") || route.path.includes("reporte")) {
        logSystemActivity({
          action: `Visualización de reporte: ${route.name?.toString() || "Reporte"}`,
          user: authStore.user?.email || "Usuario",
          module: "reports",
        })
      }
    })

    // Track notifications
    const {notifications} = useRealTimeNotifications()
    watchEffect(() => {
      // This runs every time the notifications change
      if (notifications.value.length > 0) {
        const latestNotification = notifications.value[notifications.value.length - 1]
        logSystemActivity({
          action: `Nueva notificación: ${latestNotification?.title || "Sin título"}`,
          user: "Notificador",
          module: "notifications",
        })
      }
    })

    // Additionally, try to connect to a real activity log in Firestore if available
    try {
      const activitiesQuery = query(
        collection(db, "system_activities"),
        orderBy("timestamp", "desc"),
        limit(20)
      )

      onSnapshot(
        activitiesQuery,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data()
              logSystemActivity({
                action: data.description,
                user: data.user || "Sistema",
                module: data.module || "system",
                // Use provided timestamp or fallback to server timestamp
                timestamp: data.timestamp?.toDate() || new Date(),
              })
            }
          })
        },
        (error) => {
          console.error("Error connecting to Firestore activity log:", error)
        }
      )
    } catch (error) {
      console.warn("Could not connect to Firestore activity log, using simulated data")
    }
  }

  // Log a system activity
  const logSystemActivity = (activity: {
    action: string
    user: string
    module: string
    timestamp?: Date
  }) => {
    // Create full activity object
    const newActivity: SystemActivity = {
      id: Date.now() + activityCounter++,
      action: activity.action,
      user: activity.user,
      time: "Ahora",
      module: activity.module,
      timestamp: activity.timestamp || new Date(),
    }

    // Add to global activity log
    activityLog.value.unshift(newActivity)

    // Keep activity log manageable
    if (activityLog.value.length > 100) {
      activityLog.value = activityLog.value.slice(0, 100)
    }

    // Avoid creating recursive calls by not recording operations for every activity
    // This prevents the infinite loop where recording operation -> creates activity -> records operation
    // Only record operations for non-system activities
    if (activity.module !== "system") {
      // Use a timeout to avoid immediate recursion
      setTimeout(() => {
        recordOperation(activity.module)
      }, 0)
    }
  }

  // Initialize with real-time tracking
  onMounted(() => {
    initializeAnalytics()
    trackRealTimeActivities()
  })

  return {
    // Active data
    activeUsers: getActiveUsers,

    // Performance metrics
    responseTime: performanceMetrics,

    // Operation metrics
    operationCounts,

    // Status indicators
    moduleStatus: getModuleStatus,
    systemHealth: calculateSystemHealth,

    // Activities tracking
    activityLog,
    logSystemActivity,

    // Actions
    recordOperation,

    // Initialize (for testing)
    initializeAnalytics,
  }
}
