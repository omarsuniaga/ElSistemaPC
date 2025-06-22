import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/firebase'

// Tipos
export interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalSchedules: number
  activeUsers: number
  attendanceRate: number
  performanceAverage: number
  inventoryItems: number
}

export interface Activity {
  id: string
  type: 'create' | 'update' | 'delete' | 'login' | 'assignment'
  entity: string
  description: string
  user: string
  timestamp: Date
  icon: string
  color: string
}

// Servicio para manejar todas las consultas a Firestore
export const adminService = {
  // Obtener estadísticas del dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    // Obtener maestros activos
    const activeTeachersQuery = query(
      collection(db, 'USERS'),
      where('role', '==', 'Maestro'),
      where('isActive', '==', true)
    )
    
    // Obtener estudiantes
    const studentsQuery = query(collection(db, 'STUDENTS'))
    
    // Obtener maestros (todos)
    const teachersQuery = query(
      collection(db, 'USERS'),
      where('role', '==', 'Maestro')
    )
    
    // Obtener clases
    const classesQuery = query(collection(db, 'CLASSES'))
    
    // Obtener horarios
    const schedulesQuery = query(collection(db, 'SCHEDULES'))
    
    // Ejecutar todas las consultas en paralelo
    const [
      activeTeachersSnapshot,
      studentsSnapshot,
      teachersSnapshot,
      classesSnapshot,
      schedulesSnapshot
    ] = await Promise.all([
      getDocs(activeTeachersQuery),
      getDocs(studentsQuery),
      getDocs(teachersQuery),
      getDocs(classesQuery),
      getDocs(schedulesQuery)
    ])

    return {
      totalStudents: studentsSnapshot.size,
      totalTeachers: teachersSnapshot.size,
      totalClasses: classesSnapshot.size,
      totalSchedules: schedulesSnapshot.size,
      activeUsers: activeTeachersSnapshot.size,
      attendanceRate: 0, // Se calculará en el store
      performanceAverage: 0, // Se calculará en el store
      inventoryItems: 0 // Se actualizará cuando se implemente el inventario
    }
  },

  // Obtener actividades recientes
  async getRecentActivities(limitCount = 10): Promise<Activity[]> {
    const activitiesQuery = query(
      collection(db, 'ACTIVITY_LOG'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    
    const snapshot = await getDocs(activitiesQuery)
    
    // Si no hay actividades, retornar un array vacío
    if (snapshot.empty) {
      return []
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    })) as Activity[]
  },

  // Obtener estado del sistema (ejemplo simplificado)
  async getSystemStatus() {
    // En una implementación real, aquí podrías hacer pings a diferentes servicios
    return {
      database: 'online',
      storage: 'online',
      auth: 'online',
      lastBackup: new Date(),
      systemLoad: 0,
      activeConnections: 0
    }
  },

  // Obtener aprobaciones pendientes
  async getPendingApprovals(): Promise<any[]> {
    const approvalsQuery = query(
      collection(db, 'PENDING_APPROVALS'),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'desc')
    )
    
    const snapshot = await getDocs(approvalsQuery)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toDate() || new Date()
    }))
  }
}
