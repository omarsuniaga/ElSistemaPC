// Sistema de Notificaciones de Asistencia para Admin/Director
// Detecta nuevos registros de asistencia y notifica a roles administrativos

import {db} from "../firebase"
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore"

// Interfaces
interface AttendanceNotification {
  id?: string
  type: "new_attendance_report"
  title: string
  message: string
  date: string
  teacherId: string
  teacherName: string
  classId: string
  className: string
  totalStudents: number
  presentes: number
  ausentes: number
  tarde: number
  justificados: number
  timestamp: Date
  read: boolean
  urgency: "low" | "medium" | "high"
}

interface NotificationTrigger {
  watchForNewAttendance: () => () => void // Retorna función de cleanup
  markAsRead: (notificationId: string) => Promise<void>
  getUnreadNotifications: () => Promise<AttendanceNotification[]>
}

// Colecciones
const NOTIFICATIONS_COLLECTION = "admin_notifications"
const ATTENDANCE_COLLECTION = "ASISTENCIAS"
const CLASSES_COLLECTION = "CLASES"
const USERS_COLLECTION = "users"

/**
 * Obtiene información del maestro
 */
const getTeacherInfo = async (teacherId: string): Promise<{name: string; email?: string}> => {
  try {
    const teacherQuery = query(
      collection(db, USERS_COLLECTION),
      where("uid", "==", teacherId),
      limit(1)
    )

    const teacherSnapshot = await getDocs(teacherQuery)

    if (!teacherSnapshot.empty) {
      const teacherData = teacherSnapshot.docs[0].data()
      return {
        name:
          `${teacherData.firstName || ""} ${teacherData.lastName || ""}`.trim() ||
          "Maestro desconocido",
        email: teacherData.email,
      }
    }

    return {name: `Maestro ${teacherId}`}
  } catch (error) {
    console.error("Error obteniendo información del maestro:", error)
    return {name: `Maestro ${teacherId}`}
  }
}

/**
 * Obtiene información de la clase
 */
const getClassInfo = async (classId: string): Promise<{name: string; studentCount: number}> => {
  try {
    const classQuery = query(
      collection(db, CLASSES_COLLECTION),
      where("id", "==", classId),
      limit(1)
    )

    const classSnapshot = await getDocs(classQuery)

    if (!classSnapshot.empty) {
      const classData = classSnapshot.docs[0].data()
      return {
        name: classData.name || classData.className || `Clase ${classId}`,
        studentCount: (classData.studentIds || []).length,
      }
    }

    return {name: `Clase ${classId}`, studentCount: 0}
  } catch (error) {
    console.error("Error obteniendo información de la clase:", error)
    return {name: `Clase ${classId}`, studentCount: 0}
  }
}

/**
 * Determina la urgencia basada en los datos de asistencia
 */
const calculateUrgency = (stats: {
  presentes: number
  ausentes: number
  tarde: number
  total: number
}): "low" | "medium" | "high" => {
  const {presentes, ausentes, tarde, total} = stats

  if (total === 0) return "low"

  const absenteeRate = (ausentes + tarde) / total
  const lateRate = tarde / total

  // Urgencia alta: más del 30% de ausentes o más del 20% de tardanzas
  if (absenteeRate > 0.3 || lateRate > 0.2) {
    return "high"
  }

  // Urgencia media: más del 15% de ausentes o más del 10% de tardanzas
  if (absenteeRate > 0.15 || lateRate > 0.1) {
    return "medium"
  }

  return "low"
}

/**
 * Crea una notificación de nuevo reporte de asistencia
 */
const createAttendanceNotification = async (attendanceDoc: any): Promise<void> => {
  try {
    const data = attendanceDoc.data()

    if (!data.data) {
      console.log("Documento sin datos de asistencia, saltando...")
      return
    }

    // Obtener información adicional
    const [teacherInfo, classInfo] = await Promise.all([
      getTeacherInfo(data.teacherId || data.uid),
      getClassInfo(data.classId),
    ])

    // Calcular estadísticas
    const presentes = data.data.presentes?.length || 0
    const ausentes = data.data.ausentes?.length || 0
    const tarde = data.data.tarde?.length || 0
    const justificados = data.data.justificacion?.length || 0
    const totalStudents = presentes + ausentes + tarde

    // Determinar urgencia
    const urgency = calculateUrgency({presentes, ausentes, tarde, total: totalStudents})

    // Crear mensaje contextualizado
    let message = `${teacherInfo.name} ha registrado la asistencia para ${classInfo.name}`

    if (urgency === "high") {
      if (ausentes > tarde) {
        message += `. ⚠️ ATENCIÓN: ${ausentes} estudiantes ausentes de ${totalStudents}`
      } else {
        message += `. ⚠️ ATENCIÓN: ${tarde} estudiantes llegaron tarde`
      }
    } else if (urgency === "medium") {
      message += `. Hay ${ausentes + tarde} estudiantes que requieren seguimiento`
    } else {
      message += `. Reporte sin incidencias mayores`
    }

    // Crear notificación
    const notification: AttendanceNotification = {
      type: "new_attendance_report",
      title: "📊 Nuevo Reporte de Asistencia",
      message,
      date: data.fecha || new Date().toISOString().split("T")[0],
      teacherId: data.teacherId || data.uid,
      teacherName: teacherInfo.name,
      classId: data.classId,
      className: classInfo.name,
      totalStudents,
      presentes,
      ausentes,
      tarde,
      justificados,
      timestamp: new Date(),
      read: false,
      urgency,
    }

    // Guardar en Firebase
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notification,
      timestamp: serverTimestamp(),
    })

    console.log(`✅ Notificación creada para reporte de asistencia:`, {
      teacher: teacherInfo.name,
      class: classInfo.name,
      urgency,
      stats: {presentes, ausentes, tarde, justificados},
    })
  } catch (error) {
    console.error("❌ Error creando notificación de asistencia:", error)
  }
}

/**
 * Observa nuevos documentos de asistencia en tiempo real
 */
const watchForNewAttendance = (): (() => void) => {
  console.log("🔍 Iniciando observador de nuevos reportes de asistencia...")

  // Obtener timestamp actual para solo detectar documentos nuevos
  const startTime = Timestamp.now()

  const attendanceQuery = query(
    collection(db, ATTENDANCE_COLLECTION),
    where("createdAt", ">=", startTime),
    orderBy("createdAt", "desc")
  )

  // Listener en tiempo real
  const unsubscribe = onSnapshot(
    attendanceQuery,
    (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          console.log("📋 Nuevo reporte de asistencia detectado:", change.doc.id)

          // Crear notificación de forma asíncrona
          try {
            await createAttendanceNotification(change.doc)
          } catch (error) {
            console.error("Error procesando nuevo reporte:", error)
          }
        }
      })
    },
    (error) => {
      console.error("❌ Error en observador de asistencia:", error)
    }
  )

  console.log("✅ Observador de asistencia activo")

  // Retornar función de cleanup
  return () => {
    console.log("🛑 Deteniendo observador de asistencia")
    unsubscribe()
  }
}

/**
 * Marca una notificación como leída
 */
const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
      read: true,
      readAt: serverTimestamp(),
    })

    console.log(`✅ Notificación ${notificationId} marcada como leída`)
  } catch (error) {
    console.error("Error marcando notificación como leída:", error)
  }
}

/**
 * Obtiene notificaciones no leídas para admin/director
 */
const getUnreadNotifications = async (): Promise<AttendanceNotification[]> => {
  try {
    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("read", "==", false),
      where("type", "==", "new_attendance_report"),
      orderBy("timestamp", "desc"),
      limit(20)
    )

    const notificationsSnapshot = await getDocs(notificationsQuery)

    return notificationsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        }) as AttendanceNotification
    )
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error)
    return []
  }
}

/**
 * Obtiene estadísticas de notificaciones por urgencia
 */
const getNotificationStats = async (): Promise<{
  total: number
  high: number
  medium: number
  low: number
}> => {
  try {
    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("read", "==", false),
      where("type", "==", "new_attendance_report")
    )

    const notificationsSnapshot = await getDocs(notificationsQuery)

    const stats = {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    notificationsSnapshot.forEach((doc) => {
      const data = doc.data()
      stats.total++

      switch (data.urgency) {
        case "high":
          stats.high++
          break
        case "medium":
          stats.medium++
          break
        case "low":
          stats.low++
          break
      }
    })

    return stats
  } catch (error) {
    console.error("Error obteniendo estadísticas de notificaciones:", error)
    return {total: 0, high: 0, medium: 0, low: 0}
  }
}

/**
 * Sistema de notificaciones completo
 */
export const attendanceNotificationSystem: NotificationTrigger = {
  watchForNewAttendance,
  markAsRead,
  getUnreadNotifications,
}

// Funciones exportadas adicionales
export {getNotificationStats, createAttendanceNotification}

export default attendanceNotificationSystem
