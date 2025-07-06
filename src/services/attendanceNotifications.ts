// Servicio de Notificaciones de Asistencia por WhatsApp
// Sistema inteligente con tono adaptativo según comportamiento semanal

import {
  collection,
  doc,
  getDoc,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore"
import {httpsCallable} from "firebase/functions"

// Lazy loading de Firebase para evitar errores de inicialización
let firebaseDb: any = null
let firebaseFunctions: any = null

const initializeFirebaseServices = async () => {
  if (!firebaseDb || !firebaseFunctions) {
    try {
      const {db, functions} = await import("../firebase")
      firebaseDb = db
      firebaseFunctions = functions
      console.log("✅ [AttendanceNotifications] Firebase servicios inicializados correctamente")
    } catch (error) {
      console.error("❌ [AttendanceNotifications] Error inicializando Firebase:", error)
      throw error
    }
  }
  return {db: firebaseDb, functions: firebaseFunctions}
}

// Interfaces
interface Student {
  id: string
  nombre: string
  apellido: string
  tlf_madre?: string
  tlf_padre?: string
}

interface AttendanceRecord {
  studentId: string
  status: "Presente" | "Ausente" | "Tardanza" | "Justificado"
  fecha: string
  classId: string
  timestamp: Date
}

interface MessageTemplate {
  id: string
  type:
    | "tardanza"
    | "ausencia_justificada"
    | "inasistencia_nivel_1"
    | "inasistencia_nivel_2"
    | "inasistencia_nivel_3"
    | "inasistencia_nivel_4"
  content: string
  level?: number
}

interface NotificationHistory {
  id?: string
  studentId: string
  studentName: string
  sentTo: string
  type: string
  messageContent: string
  timestamp: Date
  weeklyCount?: number
  escalationLevel?: number
}

// Colecciones Firebase
const STUDENTS_COLLECTION = "ALUMNOS"
const HISTORY_COLLECTION = "historial_mensajes_whatsapp"

// Inicializar Firebase Functions con verificación
const initializeFirebaseFunctions = async () => {
  console.log("🔍 [AttendanceNotifications] Inicializando Firebase Functions...")
  
  try {
    const {functions} = await initializeFirebaseServices()
    if (!functions) {
      console.error("❌ [AttendanceNotifications] Firebase Functions no está inicializado")
      throw new Error("Firebase Functions no está disponible")
    }
    
    console.log("✅ [AttendanceNotifications] Firebase Functions disponible, creando callable...")
    
    // Verificar que Firebase App esté inicializado antes de crear el callable
    const {getApp} = await import("firebase/app")
    try {
      getApp() // Verificar que la app existe
      const callable = httpsCallable(functions, "getStudentAttendanceSummary")
      console.log("✅ [AttendanceNotifications] Callable creado exitosamente")
      return callable
    } catch (appError) {
      console.error("❌ [AttendanceNotifications] Firebase App no está inicializado:", appError)
      throw new Error("Firebase App no está disponible para Functions")
    }
  } catch (error) {
    console.error("❌ [AttendanceNotifications] Error creando Firebase Functions callable:", error)
    throw error
  }
}

// Función de verificación que se inicializa de manera lazy
let getStudentAttendanceSummary: any = null

const ensureFunctionsInitialized = async () => {
  if (!getStudentAttendanceSummary) {
    try {
      console.log("🔍 [AttendanceNotifications] Inicializando Functions de manera lazy...")
      getStudentAttendanceSummary = await initializeFirebaseFunctions()
      console.log("✅ [AttendanceNotifications] Firebase Functions inicializado correctamente")
    } catch (error) {
      console.error("❌ [AttendanceNotifications] Error inicializando Functions:", error)
      // En lugar de lanzar error, devolver null para que el sistema continúe
      console.warn("⚠️ [AttendanceNotifications] Continuando sin Functions - funcionalidad limitada")
      return null
    }
  }
  return getStudentAttendanceSummary
}

// ==================== INICIALIZACIÓN DIFERIDA ====================

/**
 * Inicializa las notificaciones de asistencia después del login
 * Esta función se puede llamar de manera segura después de que el usuario esté autenticado
 */
export async function initializeAttendanceNotificationsAfterLogin(): Promise<boolean> {
  console.log("🔍 [AttendanceNotifications] Inicializando después del login...")
  
  try {
    // Pre-cargar Functions de manera asíncrona
    const functions = await ensureFunctionsInitialized()
    
    if (functions) {
      console.log("✅ [AttendanceNotifications] Sistema de notificaciones listo")
      return true
    } else {
      console.warn("⚠️ [AttendanceNotifications] Sistema iniciado con funcionalidad limitada")
      return false
    }
  } catch (error) {
    console.error("❌ [AttendanceNotifications] Error en inicialización post-login:", error)
    return false
  }
}

/**
 * Verifica si el sistema de notificaciones está completamente disponible
 */
export function isAttendanceNotificationSystemReady(): boolean {
  return getStudentAttendanceSummary !== null
}

/**
 * Plantillas de mensajes con tono adaptativo según escalación por inasistencias
 * Niveles basados en cantidad de ausencias injustificadas en la semana
 */
const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "tardanza",
    type: "tardanza",
    content: `Estimado representante, le informamos que el estudiante {studentName} ha sido registrado con una llegada tarde el día de hoy, {date}. Agradecemos su colaboración para asegurar la puntualidad en futuras clases. - Academia Musical El Sistema`,
  },
  {
    id: "ausencia_justificada",
    type: "ausencia_justificada",
    content: `Estimado representante, hemos registrado la ausencia justificada del estudiante {studentName}. Lamentamos que no pudiera acompañarnos. Le recordamos que su próxima actividad es el {nextClassDay} a las {nextClassTime}. ¡Esperamos contar con su valiosa presencia!`,
  },
  {
    id: "inasistencia_nivel_1",
    type: "inasistencia_nivel_1",
    level: 1,
    content: `Estimado representante, notamos la ausencia del estudiante {studentName} a su clase de hoy ({date}). Si hay alguna eventualidad, por favor comuníquela a la administración. Su participación es importante para su desarrollo musical. ¡Le esperamos en su próxima clase! 🎵 - Academia El Sistema`,
  },
  {
    id: "inasistencia_nivel_2",
    type: "inasistencia_nivel_2",
    level: 2,
    content: `Estimado representante, hemos registrado la SEGUNDA ausencia injustificada del estudiante {studentName} esta semana. Le recordamos que la asistencia regular y la disciplina son fundamentales para el progreso musical y el aprovechamiento de las clases. Es importante que se comunique con la administración para informar sobre cualquier situación. La constancia es clave en el aprendizaje musical. 📚🎵`,
  },
  {
    id: "inasistencia_nivel_3",
    type: "inasistencia_nivel_3",
    level: 3,
    content: `IMPORTANTE: El estudiante {studentName} ha registrado su TERCERA ausencia injustificada esta semana. Esta situación es preocupante y afecta significativamente su progreso académico. SOLICITAMOS que el representante se comunique con la dirección de la academia EN LAS PRÓXIMAS 24 HORAS para proporcionar una explicación sobre las razones de estas inasistencias. Es necesario evaluar la continuidad en el programa. ⚠️📞`,
  },
  {
    id: "inasistencia_nivel_4",
    type: "inasistencia_nivel_4",
    level: 4,
    content: `🚨 CASO EXTREMO - CITACIÓN OBLIGATORIA 🚨\n\nEl estudiante {studentName} ha registrado CUATRO O MÁS ausencias injustificadas esta semana. Esta es una situación CRÍTICA que requiere atención INMEDIATA.\n\nSE REQUIERE la presencia OBLIGATORIA del representante en las oficinas de la sede para una reunión con la dirección académica.\n\nTemas a tratar:\n• Explicación detallada de las ausencias\n• Evaluación de continuidad en el programa\n• Posibles medidas disciplinarias\n• Plan de recuperación académica\n\nPor favor, contactar URGENTEMENTE para agendar cita. La situación académica del estudiante está en riesgo.\n\n📍 Academia Musical El Sistema - Dirección Académica\n📞 [Número de contacto]\n⏰ Horario: Lunes a Viernes 8:00 AM - 5:00 PM`,
  },
]

/**
 * Obtiene información del estudiante desde Firebase
 */
const getStudentData = async (studentId: string): Promise<Student | null> => {
  try {
    const {db} = await initializeFirebaseServices()
    const studentDoc = await getDoc(doc(db, STUDENTS_COLLECTION, studentId))
    if (studentDoc.exists()) {
      const data = studentDoc.data()
      return {
        id: studentId,
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        tlf_madre: data.tlf_madre || "",
        tlf_padre: data.tlf_padre || "",
      }
    }
    return null
  } catch (error) {
    console.error("Error obteniendo datos del estudiante:", error)
    return null
  }
}

/**
 * Determina el nivel de escalación para inasistencias injustificadas
 * Nivel 1: 1 inasistencia (tono suave)
 * Nivel 2: 2 inasistencias (tono reclamativo sobre disciplina)
 * Nivel 3: 3 inasistencias (solicitud de explicación al representante)
 * Nivel 4: 4+ inasistencias (caso extremo - citación obligatoria)
 */
const getEscalationLevel = (absences: number): number => {
  if (absences === 1) return 1
  if (absences === 2) return 2
  if (absences === 3) return 3
  if (absences >= 4) return 4
  return 1
}

/**
 * Personaliza el mensaje con datos del estudiante
 */
const personalizeMessage = (
  template: string,
  student: Student,
  additionalData: any = {}
): string => {
  const message = template
    .replace(/{studentName}/g, `${student.nombre} ${student.apellido}`)
    .replace(/{date}/g, new Date().toLocaleDateString("es-ES"))
    .replace(/{nextClassDay}/g, additionalData.nextClassDay || "próximo día de clase")
    .replace(/{nextClassTime}/g, additionalData.nextClassTime || "la hora habitual")

  return message
}

/**
 * Envía mensaje a través de la API de WhatsApp
 */
const sendWhatsAppMessage = async (phoneNumber: string, message: string): Promise<boolean> => {
  try {
    console.log(`📱 Enviando WhatsApp a ${phoneNumber}: ${message.substring(0, 50)}...`)

    const response = await fetch("https://whatsappapi-4ffilcsmva-uc.a.run.app/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: phoneNumber,
        message,
      }),
    })

    const result = await response.json()

    if (response.ok && result.success) {
      console.log("✅ Mensaje enviado exitosamente")
      return true
    } else {
      console.error("❌ Error enviando mensaje:", result.error || result.message)
      return false
    }
  } catch (error) {
    console.error("❌ Error en envío de WhatsApp:", error)
    return false
  }
}

/**
 * Registra el mensaje en el historial
 */
const saveMessageHistory = async (historyData: NotificationHistory): Promise<string | null> => {
  try {
    const {db} = await initializeFirebaseServices()
    const docRef = await addDoc(collection(db, HISTORY_COLLECTION), {
      ...historyData,
      timestamp: serverTimestamp(),
    })

    console.log("📝 Mensaje guardado en historial:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error guardando historial:", error)
    return null
  }
}

/**
 * FUNCIÓN PRINCIPAL: Notifica tardanzas
 */
export const notifyLateStudents = async (
  lateStudents: string[]
): Promise<{success: number; failed: number; messages: NotificationHistory[]}> => {
  const results = {success: 0, failed: 0, messages: [] as NotificationHistory[]}

  console.log(`🚀 Iniciando notificaciones de tardanza para ${lateStudents.length} estudiantes`)

  for (const studentId of lateStudents) {
    try {
      const student = await getStudentData(studentId)
      if (!student) {
        console.error(`❌ Estudiante ${studentId} no encontrado`)
        results.failed++
        continue
      }

      const template = MESSAGE_TEMPLATES.find((t) => t.type === "tardanza")
      if (!template) {
        console.error("❌ Plantilla de tardanza no encontrada")
        results.failed++
        continue
      }

      const message = personalizeMessage(template.content, student)

      // Enviar a ambos padres si tienen números
      const phoneNumbers = [student.tlf_madre, student.tlf_padre].filter((phone): phone is string =>
        Boolean(phone)
      )

      for (const phoneNumber of phoneNumbers) {
        const sent = await sendWhatsAppMessage(phoneNumber, message)

        if (sent) {
          const historyData: NotificationHistory = {
            studentId: student.id,
            studentName: `${student.nombre} ${student.apellido}`,
            sentTo: phoneNumber,
            type: "Tardanza",
            messageContent: message,
            timestamp: new Date(),
          }

          await saveMessageHistory(historyData)
          results.messages.push(historyData)
          results.success++
        } else {
          results.failed++
        }
      }
    } catch (error) {
      console.error(`Error procesando estudiante ${studentId}:`, error)
      results.failed++
    }
  }

  console.log(`✅ Notificaciones completadas: ${results.success} éxitos, ${results.failed} fallos`)
  return results
}

/**
 * FUNCIÓN PRINCIPAL: Notifica ausencias justificadas
 */
export const notifyJustifiedAbsences = async (
  justifiedStudents: string[]
): Promise<{success: number; failed: number; messages: NotificationHistory[]}> => {
  const results = {success: 0, failed: 0, messages: [] as NotificationHistory[]}

  console.log(
    `🚀 Iniciando notificaciones de ausencias justificadas para ${justifiedStudents.length} estudiantes`
  )

  for (const studentId of justifiedStudents) {
    try {
      const student = await getStudentData(studentId)
      if (!student) {
        console.error(`❌ Estudiante ${studentId} no encontrado`)
        results.failed++
        continue
      }

      const template = MESSAGE_TEMPLATES.find((t) => t.type === "ausencia_justificada")
      if (!template) {
        console.error("❌ Plantilla de ausencia justificada no encontrada")
        results.failed++
        continue
      }

      const message = personalizeMessage(template.content, student)

      // Enviar a ambos padres si tienen números
      const phoneNumbers = [student.tlf_madre, student.tlf_padre].filter((phone): phone is string =>
        Boolean(phone)
      )

      for (const phoneNumber of phoneNumbers) {
        const sent = await sendWhatsAppMessage(phoneNumber, message)

        if (sent) {
          const historyData: NotificationHistory = {
            studentId: student.id,
            studentName: `${student.nombre} ${student.apellido}`,
            sentTo: phoneNumber,
            type: "Ausencia Justificada",
            messageContent: message,
            timestamp: new Date(),
          }

          await saveMessageHistory(historyData)
          results.messages.push(historyData)
          results.success++
        } else {
          results.failed++
        }
      }
    } catch (error) {
      console.error(`Error procesando estudiante ${studentId}:`, error)
      results.failed++
    }
  }

  console.log(`✅ Notificaciones completadas: ${results.success} éxitos, ${results.failed} fallos`)
  return results
}

/**
 * FUNCIÓN PRINCIPAL: Notifica inasistencias injustificadas con tono adaptativo
 */
export const notifyUnexcusedAbsences = async (
  absentStudents: string[]
): Promise<{success: number; failed: number; messages: NotificationHistory[]}> => {
  const results = {success: 0, failed: 0, messages: [] as NotificationHistory[]}

  console.log(
    `🚀 Iniciando notificaciones de inasistencias injustificadas para ${absentStudents.length} estudiantes`
  )

  for (const studentId of absentStudents) {
    try {
      const student = await getStudentData(studentId)
      if (!student) {
        console.error(`❌ Estudiante ${studentId} no encontrado`)
        results.failed++
        continue
      }

      // Contar ausencias usando la Firebase Function
      let totalAbsences = 0
      try {
        const getStudentSummary = await ensureFunctionsInitialized()
        
        if (!getStudentSummary) {
          console.warn(`⚠️ Functions no disponible para ${student.nombre}, saltando...`)
          results.failed++
          continue
        }
        
        const summaryResult = await getStudentSummary({studentId})
        const summary = summaryResult.data as {absentCount: number; lateCount: number}
        totalAbsences = summary.absentCount
      } catch (functionError: any) {
        console.warn(
          `⚠️ Cloud Function no disponible para ${student.nombre}. Error:`,
          functionError?.message || functionError
        )
        // Si hay error CORS o de Functions, saltar este estudiante por ahora
        results.failed++
        continue
      }

      const escalationLevel = getEscalationLevel(totalAbsences)

      console.log(
        `📊 Estudiante ${student.nombre}: ${totalAbsences} ausencias, nivel ${escalationLevel}`
      )

      // Obtener la plantilla apropiada según el nivel
      const templateType = `inasistencia_nivel_${escalationLevel}` as const
      const template = MESSAGE_TEMPLATES.find((t) => t.type === templateType)

      if (!template) {
        console.error(`❌ Plantilla ${templateType} no encontrada`)
        results.failed++
        continue
      }

      const message = personalizeMessage(template.content, student)

      // Enviar a ambos padres si tienen números
      const phoneNumbers = [student.tlf_madre, student.tlf_padre].filter((phone): phone is string =>
        Boolean(phone)
      )

      for (const phoneNumber of phoneNumbers) {
        const sent = await sendWhatsAppMessage(phoneNumber, message)

        if (sent) {
          const historyData: NotificationHistory = {
            studentId: student.id,
            studentName: `${student.nombre} ${student.apellido}`,
            sentTo: phoneNumber,
            type: `Inasistencia Nivel ${escalationLevel}`,
            messageContent: message,
            timestamp: new Date(),
            weeklyCount: totalAbsences,
            escalationLevel,
          }

          await saveMessageHistory(historyData)
          results.messages.push(historyData)
          results.success++
        } else {
          results.failed++
        }
      }
    } catch (error) {
      console.error(`Error procesando estudiante ${studentId}:`, error)
      results.failed++
    }
  }

  console.log(`✅ Notificaciones completadas: ${results.success} éxitos, ${results.failed} fallos`)
  return results
}

/**
 * Obtiene el historial de mensajes para un estudiante específico
 */
export const getStudentMessageHistory = async (
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<NotificationHistory[]> => {
  try {
    const {db} = await initializeFirebaseServices()
    let historyQuery = query(
      collection(db, HISTORY_COLLECTION),
      where("studentId", "==", studentId),
      orderBy("timestamp", "desc")
    )

    if (startDate && endDate) {
      historyQuery = query(
        collection(db, HISTORY_COLLECTION),
        where("studentId", "==", studentId),
        where("timestamp", ">=", new Date(startDate)),
        where("timestamp", "<=", new Date(endDate)),
        orderBy("timestamp", "desc")
      )
    }

    const historySnapshot = await getDocs(historyQuery)

    return historySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as NotificationHistory
    )
  } catch (error) {
    console.error("Error obteniendo historial de mensajes:", error)
    return []
  }
}

/**
 * Obtiene estadísticas de mensajes por tipo y período
 */
export const getMessageStatistics = async (
  startDate: string,
  endDate: string
): Promise<{type: string; count: number}[]> => {
  try {
    const {db} = await initializeFirebaseServices()
    const statsQuery = query(
      collection(db, HISTORY_COLLECTION),
      where("timestamp", ">=", new Date(startDate)),
      where("timestamp", "<=", new Date(endDate))
    )

    const statsSnapshot = await getDocs(statsQuery)

    const stats: {[key: string]: number} = {}

    statsSnapshot.forEach((doc) => {
      const data = doc.data()
      const type = data.type || "Sin tipo"
      stats[type] = (stats[type] || 0) + 1
    })

    return Object.entries(stats).map(([type, count]) => ({type, count}))
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error)
    return []
  }
}

export default {
  notifyLateStudents,
  notifyJustifiedAbsences,
  notifyUnexcusedAbsences,
  getStudentMessageHistory,
  getMessageStatistics,
}
