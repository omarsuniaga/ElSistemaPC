// Sistema de Notificaciones de Asistencia para Admin

// Detecta nuevos registros de asistencia y notifica a roles administrativos

import {db, isFirebaseReady} from "../firebase"
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
const NOTIFICATIONS_COLLECTION = "ADMIN_NOTIFICATIONS"
const ATTENDANCE_COLLECTION = "ASISTENCIAS"
const CLASSES_COLLECTION = "CLASES"
const USERS_COLLECTION = "USERS"

/**
 * Verifica si una colección existe y tiene documentos
 */
const checkCollectionExists = async (collectionName: string): Promise<boolean> => {
  try {
    if (!isFirebaseReady() || !db) {
      return false
    }

    const collectionRef = collection(db, collectionName)
    const snapshot = await getDocs(query(collectionRef, limit(1)))
    return !snapshot.empty
  } catch (error) {
    console.warn(`⚠️ No se pudo verificar la colección ${collectionName}:`, error)
    return false
  }
}

/**
 * Obtiene información del maestro
 */
const getTeacherInfo = async (teacherId: string): Promise<{name: string; email?: string}> => {
  try {
    if (!isFirebaseReady() || !db) {
      console.warn("Firebase no está listo, usando datos por defecto")
      return {name: `Maestro ${teacherId}`}
    }

    // Verificar si la colección de usuarios existe
    const usersCollectionExists = await checkCollectionExists(USERS_COLLECTION)
    if (!usersCollectionExists) {
      console.warn(`⚠️ Colección '${USERS_COLLECTION}' no existe o está vacía`)
      return {name: `Maestro ${teacherId}`}
    }

    // Verificar db antes de crear query
    if (!db) {
      console.warn("❌ db instance no disponible para consulta de maestro")
      return {name: `Maestro ${teacherId}`}
    }

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
    if (!isFirebaseReady() || !db) {
      console.warn("Firebase no está listo, usando datos por defecto")
      return {name: `Clase ${classId}`, studentCount: 0}
    }

    // Verificar si la colección de clases existe
    const classesCollectionExists = await checkCollectionExists(CLASSES_COLLECTION)
    if (!classesCollectionExists) {
      console.warn(`⚠️ Colección '${CLASSES_COLLECTION}' no existe o está vacía`)
      return {name: `Clase ${classId}`, studentCount: 0}
    }

    // Verificar db antes de crear query
    if (!db) {
      console.warn("❌ db instance no disponible para consulta de clase")
      return {name: `Clase ${classId}`, studentCount: 0}
    }

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
  const {ausentes, tarde, total} = stats

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
    if (!isFirebaseReady() || !db) {
      console.error("❌ Firebase no está listo, no se puede crear notificación")
      return
    }

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
    const notification = {
      type: "attendance_report", // Actualizado para coincidir con el nuevo servicio
      title: "📊 Nuevo Reporte de Asistencia",
      message,
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
      metadata: {
        date: data.fecha || new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      },
    }

    // Guardar en Firebase
    if (!db) {
      console.error("❌ db instance no disponible para guardar notificación")
      return
    }
    
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

  // Verificar que Firebase esté inicializado inmediatamente
  if (!isFirebaseReady() || !db) {
    console.error(
      "❌ Firebase no está inicializado correctamente. No se puede iniciar el observador."
    )
    // Retornar función de cleanup vacía
    return () => {
      console.log("🛑 Observador no estaba activo (Firebase no inicializado)")
    }
  }

  let cleanupFunction: (() => void) | null = null

  // Función asíncrona para la inicialización
  const initializeWatcher = async () => {
    try {
      // Verificar que Firebase esté inicializado (segunda verificación)
      if (!isFirebaseReady() || !db) {
        console.error("❌ Firebase no está inicializado correctamente en initializeWatcher")
        return
      }

      // Verificar que las colecciones necesarias existan
      const attendanceExists = await checkCollectionExists(ATTENDANCE_COLLECTION)
      const notificationsExists = await checkCollectionExists(NOTIFICATIONS_COLLECTION)

      if (!attendanceExists) {
        console.warn(
          `⚠️ Colección de asistencias '${ATTENDANCE_COLLECTION}' no existe. El observador estará inactivo hasta que se cree.`
        )
        return
      }

      if (!notificationsExists) {
        console.warn(
          `⚠️ Colección de notificaciones '${NOTIFICATIONS_COLLECTION}' no existe. Creando primera notificación...`
        )
        try {
          // Verificar db nuevamente antes de usar collection()
          if (!db) {
            console.error("❌ db instance perdida durante inicialización")
            return
          }
          
          await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
            type: "system_init",
            title: "🔧 Sistema de Notificaciones Iniciado",
            message: "El sistema de notificaciones de asistencia está ahora activo",
            timestamp: serverTimestamp(),
            read: false,
            urgency: "low",
            _isSystemGenerated: true,
          })
          console.log("✅ Colección de notificaciones inicializada")
        } catch (error) {
          console.error("❌ Error creando colección de notificaciones:", error)
          return
        }
      }

      // Obtener timestamp actual para solo detectar documentos nuevos
      const startTime = Timestamp.now()

      // Verificar db otra vez antes de crear query
      if (!db) {
        console.error("❌ db instance perdida antes de crear query")
        return
      }

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
      
      // Guardar la función de cleanup
      cleanupFunction = () => {
        console.log("🛑 Deteniendo observador de asistencia")
        unsubscribe()
      }
    } catch (error) {
      console.error("❌ Error inicializando observador de asistencia:", error)
    }
  }

  // Inicializar de forma asíncrona
  initializeWatcher()

  // Retornar función de cleanup inmediatamente
  return () => {
    if (cleanupFunction) {
      cleanupFunction()
    } else {
      console.log("🛑 Observador no estaba activo")
    }
  }
}

/**
 * Marca una notificación como leída
 */
const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    if (!isFirebaseReady() || !db) {
      console.error("❌ Firebase no está listo para marcar notificación como leída")
      return
    }

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
    if (!isFirebaseReady() || !db) {
      console.error("❌ Firebase no está listo para obtener notificaciones no leídas")
      return []
    }

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
    if (!isFirebaseReady() || !db) {
      console.error("❌ Firebase no está listo para obtener estadísticas de notificaciones")
      return {total: 0, high: 0, medium: 0, low: 0}
    }

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
