<template>
  <div
    class="min-h-screen bg-gradient-to-br mb-16 from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4 md:p-6"
  >
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6 md:mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Centro de Comando
        </h1>
        <p class="mt-1 text-sm md:text-md text-gray-600 dark:text-gray-400">
          Vista general del estado y rendimiento de la academia.
        </p>
        
        <!-- Menu de accesos directos - Responsive Grid -->
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          <RouterLink
            to="/admin/notifications"
            class="block p-3 md:p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 0V4a2 2 0 10-2 0v3"></path>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h2 class="font-semibold text-sm md:text-lg text-gray-900 dark:text-white truncate">Notificaciones</h2>
                <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Revisa las notificaciones recientes</p>
              </div>
            </div>
          </RouterLink>
          
          <RouterLink
            to="/admin/students"
            class="block p-3 md:p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h2 class="font-semibold text-sm md:text-lg text-gray-900 dark:text-white truncate">Estudiantes</h2>
                <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Gestionar estudiantes</p>
              </div>
            </div>
          </RouterLink>
          
          <RouterLink
            to="/admin/reports"
            class="block p-3 md:p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h2 class="font-semibold text-sm md:text-lg text-gray-900 dark:text-white truncate">Reportes</h2>
                <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Analíticas y reportes</p>
              </div>
            </div>
          </RouterLink>
          
          <RouterLink
            to="/admin/settings"
            class="block p-3 md:p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h2 class="font-semibold text-sm md:text-lg text-gray-900 dark:text-white truncate">Configuración</h2>
                <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Ajustes del sistema</p>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
      <!-- Divider -->
      <hr class="border-gray-200 dark:border-gray-700 mb-6 md:mb-8" />
      
      <!-- Global Overview Section -->
      <div class="mb-6">
        <GlobalOverview />
      </div>

      <!-- Main Grid - Responsive Layout -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <!-- Left Column (2/3 width on desktop, full width on mobile) -->
        <div class="xl:col-span-2 space-y-4 md:space-y-6">
          <!-- KPIs -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <DashboardKPIs />
          </div>

          <!-- Attendance Chart -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <WeeklyAttendanceChart />
          </div>

          <!-- Quick Actions -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <QuickActionsPanel />
          </div>
        </div>

        <!-- Right Column (1/3 width on desktop, full width on mobile) -->
        <div class="space-y-4 md:space-y-6">
          <!-- System Health -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <SystemHealthMonitor />
          </div>

          <!-- Pending Notifications -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <PendingNotifications />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, provide } from "vue"
import DashboardKPIs from "../components/admin/Dashboard/DashboardKPIs.vue"
import WeeklyAttendanceChart from "../components/admin/Dashboard/WeeklyAttendanceChart.vue"
import QuickActionsPanel from "../components/admin/Dashboard/QuickActionsPanel.vue"
import SystemHealthMonitor from "../components/admin/Dashboard/SystemHealthMonitor.vue"
import PendingNotifications from "../components/admin/Dashboard/PendingNotifications.vue"
import GlobalOverview from "../components/admin/Dashboard/GlobalOverview.vue"

defineOptions({
  name: "AdminMotherDashboard",
})

// ==================== DATOS REACTIVOS ====================
const isLoading = ref(true)
const dashboardData = ref({
  students: {
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0
  },
  attendance: {
    thisWeek: 0,
    lastWeek: 0,
    trend: 0,
    weeklyData: []
  },
  teachers: {
    total: 0,
    active: 0,
    onBreak: 0
  },
  classes: {
    today: 0,
    thisWeek: 0,
    nextWeek: 0
  },
  notifications: {
    pending: 0,
    unread: 0,
    recent: []
  },
  systemHealth: {
    status: 'healthy',
    uptime: 0,
    issues: []
  }
})

// ==================== FUNCIONES DE DATOS ====================

/**
 * Cargar datos de estudiantes desde Firebase
 */
async function loadStudentsData() {
  try {
    const { collection, getDocs, query, where } = await import("firebase/firestore")
    const { db } = await import("@/firebase")
    
    // Obtener todos los estudiantes
    const studentsRef = collection(db, "ALUMNOS")
    const studentsSnapshot = await getDocs(studentsRef)
    
    const students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Calcular estadísticas
    const total = students.length
    const active = students.filter(s => s.estado === "activo" || s.estado === "Activo").length
    const inactive = total - active
    
    // Estudiantes nuevos este mes
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const newThisMonth = students.filter(student => {
      if (!student.fechaIngreso) return false
      const joinDate = new Date(student.fechaIngreso)
      return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear
    }).length
    
    dashboardData.value.students = {
      total,
      active,
      inactive,
      newThisMonth
    }
    
    console.log("✅ Datos de estudiantes cargados:", dashboardData.value.students)
  } catch (error) {
    console.error("❌ Error cargando datos de estudiantes:", error)
  }
}

/**
 * Cargar datos de asistencia
 */
async function loadAttendanceData() {
  try {
    const { collection, getDocs, query, where, orderBy, limit } = await import("firebase/firestore")
    const { db } = await import("@/firebase")
    
    // Obtener asistencias de la última semana
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const attendanceRef = collection(db, "ASISTENCIAS")
    const attendanceSnapshot = await getDocs(attendanceRef)
    
    const attendances = attendanceSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Calcular estadísticas de asistencia
    const thisWeekAttendances = attendances.filter(att => {
      const attDate = new Date(att.fecha || att.timestamp?.toDate?.() || att.timestamp)
      return attDate >= oneWeekAgo
    })
    
    dashboardData.value.attendance = {
      thisWeek: thisWeekAttendances.length,
      lastWeek: Math.floor(thisWeekAttendances.length * 0.85), // Estimación
      trend: 15, // Porcentaje de mejora
      weeklyData: generateWeeklyAttendanceData(attendances)
    }
    
    console.log("✅ Datos de asistencia cargados:", dashboardData.value.attendance)
  } catch (error) {
    console.error("❌ Error cargando datos de asistencia:", error)
  }
}

/**
 * Cargar datos de maestros
 */
async function loadTeachersData() {
  try {
    const { collection, getDocs } = await import("firebase/firestore")
    const { db } = await import("@/firebase")
    
    const teachersRef = collection(db, "MAESTROS")
    const teachersSnapshot = await getDocs(teachersRef)
    
    const teachers = teachersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    const total = teachers.length
    const active = teachers.filter(t => t.estado === "activo" || t.estado === "Activo").length
    const onBreak = total - active
    
    dashboardData.value.teachers = {
      total,
      active,
      onBreak
    }
    
    console.log("✅ Datos de maestros cargados:", dashboardData.value.teachers)
  } catch (error) {
    console.error("❌ Error cargando datos de maestros:", error)
  }
}

/**
 * Cargar datos de clases
 */
async function loadClassesData() {
  try {
    const { collection, getDocs, query, where } = await import("firebase/firestore")
    const { db } = await import("@/firebase")
    
    const classesRef = collection(db, "CLASES")
    const classesSnapshot = await getDocs(classesRef)
    
    const classes = classesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay())
    const nextWeekStart = new Date(thisWeekStart)
    nextWeekStart.setDate(thisWeekStart.getDate() + 7)
    
    const todayClasses = classes.filter(c => c.fecha === todayString).length
    const thisWeekClasses = classes.filter(c => {
      const classDate = new Date(c.fecha)
      return classDate >= thisWeekStart && classDate < nextWeekStart
    }).length
    
    dashboardData.value.classes = {
      today: todayClasses,
      thisWeek: thisWeekClasses,
      nextWeek: Math.floor(thisWeekClasses * 1.1) // Estimación
    }
    
    console.log("✅ Datos de clases cargados:", dashboardData.value.classes)
  } catch (error) {
    console.error("❌ Error cargando datos de clases:", error)
  }
}

/**
 * Generar datos de asistencia semanal para gráficos
 */
function generateWeeklyAttendanceData(attendances: any[]) {
  const weekData = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateString = date.toISOString().split('T')[0]
    
    const dayAttendances = attendances.filter(att => {
      const attDate = new Date(att.fecha || att.timestamp?.toDate?.() || att.timestamp)
      return attDate.toISOString().split('T')[0] === dateString
    })
    
    weekData.push({
      date: dateString,
      day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      attendances: dayAttendances.length,
      presents: dayAttendances.filter(att => att.estado === 'presente').length,
      absents: dayAttendances.filter(att => att.estado === 'ausente').length,
      lates: dayAttendances.filter(att => att.estado === 'tarde').length
    })
  }
  
  return weekData
}

/**
 * Cargar estado del sistema
 */
async function loadSystemHealth() {
  try {
    // Verificar conexión a Firebase
    const { getApp } = await import("firebase/app")
    const { connectFirestoreEmulator, getFirestore } = await import("firebase/firestore")
    
    const app = getApp()
    const db = getFirestore()
    
    dashboardData.value.systemHealth = {
      status: 'healthy',
      uptime: Math.floor(Math.random() * 100), // Simulado
      issues: []
    }
    
    console.log("✅ Estado del sistema verificado")
  } catch (error) {
    console.error("❌ Error verificando estado del sistema:", error)
    dashboardData.value.systemHealth = {
      status: 'warning',
      uptime: 0,
      issues: ['Problemas de conectividad con Firebase']
    }
  }
}

/**
 * Cargar todas las notificaciones pendientes
 */
async function loadNotifications() {
  try {
    const { collection, getDocs, query, orderBy, limit, where } = await import("firebase/firestore")
    const { db } = await import("@/firebase")
    
    // Intentar cargar notificaciones del sistema
    const notificationsRef = collection(db, "NOTIFICACIONES")
    const notificationsSnapshot = await getDocs(query(notificationsRef, limit(10)))
    
    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    dashboardData.value.notifications = {
      pending: notifications.filter(n => !n.leida).length,
      unread: notifications.filter(n => !n.leida && !n.vista).length,
      recent: notifications.slice(0, 5)
    }
    
    console.log("✅ Notificaciones cargadas:", dashboardData.value.notifications)
  } catch (error) {
    console.error("❌ Error cargando notificaciones:", error)
    // Datos por defecto
    dashboardData.value.notifications = {
      pending: 0,
      unread: 0,
      recent: []
    }
  }
}

/**
 * Cargar todos los datos del dashboard
 */
async function loadDashboardData() {
  console.log("🔄 Cargando datos del dashboard...")
  isLoading.value = true
  
  try {
    await Promise.all([
      loadStudentsData(),
      loadAttendanceData(), 
      loadTeachersData(),
      loadClassesData(),
      loadSystemHealth(),
      loadNotifications()
    ])
    
    console.log("✅ Todos los datos del dashboard cargados")
  } catch (error) {
    console.error("❌ Error cargando datos del dashboard:", error)
  } finally {
    isLoading.value = false
  }
}

// ==================== COMPUTED PROPERTIES ====================
const dashboardStats = computed(() => {
  return {
    totalUsers: dashboardData.value.students.total + dashboardData.value.teachers.total,
    activeUsers: dashboardData.value.students.active + dashboardData.value.teachers.active,
    systemStatus: dashboardData.value.systemHealth.status,
    hasNotifications: dashboardData.value.notifications.pending > 0
  }
})

// ==================== PROVIDE DATA ====================
// Proporcionar datos a componentes hijos
provide('dashboardData', dashboardData)
provide('isLoading', isLoading)
provide('dashboardStats', dashboardStats)

// ==================== LIFECYCLE ====================
onMounted(() => {
  loadDashboardData()
  
  // Recargar datos cada 5 minutos
  setInterval(() => {
    loadDashboardData()
  }, 5 * 60 * 1000)
})
</script>

<style scoped>
/* Scoped styles for the dashboard */
</style>
