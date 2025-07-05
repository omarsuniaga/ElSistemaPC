/**
 * 🔧 SERVICIO UNIFICADO DE ASISTENCIA
 * Consolida attendance.ts, attendanceCollaboration.ts y otros servicios fragmentados
 * Fase 0 - Iniciativa 2: Capa de Servicios Unificada
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import {db} from "@/firebase"
import {useRBACStore} from "@/stores/rbacStore"
import {useAuthStore} from "@/stores/auth"
import {
  AttendanceRecordSchema,
  AttendanceCreateSchema,
  AttendanceUpdateSchema,
  ObservationSchema,
  ObservationCreateSchema,
  ObservationUpdateSchema,
  validateFirebaseData,
  validateAndTransform,
  type AttendanceRecord,
  type AttendanceCreate,
  type AttendanceUpdate,
  type ObservationData,
  type ObservationCreate,
  type ObservationUpdate,
} from "@/schemas"

/**
 * Interfaz para opciones de registro de asistencia
 */
interface RecordAttendanceOptions {
  validatePermissions?: boolean
  allowCollaboration?: boolean
  skipValidation?: boolean
}

/**
 * Resultado de operación de asistencia
 */
interface AttendanceOperationResult {
  success: boolean
  recordId?: string
  message: string
  data?: AttendanceRecord
}

/**
 * Servicio unificado de asistencia con gestión de permisos y colaboración integrada
 */
class UnifiedAttendanceService {
  // Stores se inicializarán dinámicamente para evitar problemas de Pinia
  private get rbacStore() {
    return useRBACStore()
  }

  private get authStore() {
    return useAuthStore()
  }

  // ==================== PERMISSION CHECKS ====================

  /**
   * Verifica si el usuario puede registrar asistencia para una clase específica
   */
  private async checkAttendancePermission(classId: string): Promise<boolean> {
    // Verificar permisos globales primero
    if (this.rbacStore.hasPermission("attendance_create")) {
      return true
    }

    // Verificar si es el maestro de la clase
    const currentUserId = this.authStore.user?.uid
    if (!currentUserId) return false

    // Aquí se podría integrar con classesStore para verificar si es el maestro titular
    // O si tiene permisos de colaboración en la clase
    return this.rbacStore.hasPermission("attendance_own_classes")
  }

  /**
   * Verifica permisos de colaboración en una clase
   */
  private async checkCollaborationPermission(classId: string, teacherId: string): Promise<boolean> {
    const currentUserId = this.authStore.user?.uid
    if (!currentUserId) return false

    // Verificar si es super admin
    if (this.rbacStore.hasPermission("attendance_all_classes")) {
      return true
    }

    // Verificar si es maestro colaborador en la clase específica
    return this.rbacStore.hasPermission("attendance_collaborate")
  }

  // ==================== CORE ATTENDANCE OPERATIONS ====================

  /**
   * 🎯 FUNCIÓN PRINCIPAL: Registrar asistencia con validación completa
   * Reemplaza las múltiples funciones dispersas en diferentes archivos
   */
  async recordAttendance(
    attendanceData: AttendanceCreate,
    options: RecordAttendanceOptions = {}
  ): Promise<AttendanceOperationResult> {
    try {
      const {
        validatePermissions = true,
        allowCollaboration = true,
        skipValidation = false,
      } = options

      // 1. Validar datos de entrada
      if (!skipValidation) {
        validateAndTransform(AttendanceCreateSchema, attendanceData)
      }

      // 2. Verificar permisos
      if (validatePermissions) {
        const hasPermission = await this.checkAttendancePermission(attendanceData.classId)
        if (!hasPermission) {
          // Si no tiene permisos directos, verificar colaboración
          if (allowCollaboration) {
            const hasCollabPermission = await this.checkCollaborationPermission(
              attendanceData.classId,
              attendanceData.teacherId
            )
            if (!hasCollabPermission) {
              return {
                success: false,
                message: "No tienes permisos para registrar asistencia en esta clase",
              }
            }
          } else {
            return {
              success: false,
              message: "No tienes permisos para registrar asistencia",
            }
          }
        }
      }

      // 3. Verificar si ya existe un registro para este estudiante/clase/fecha
      const existingRecord = await this.getAttendanceRecord(
        attendanceData.studentId,
        attendanceData.classId,
        attendanceData.date
      )

      let recordId: string
      let operation: string

      if (existingRecord) {
        // Actualizar registro existente
        await this.updateAttendance(existingRecord.id, {
          status: attendanceData.status,
          notes: attendanceData.notes,
          justification: attendanceData.justification,
          updatedBy: this.authStore.user?.uid,
        })
        recordId = existingRecord.id
        operation = "actualizado"
      } else {
        // Crear nuevo registro
        const dataToSave = {
          ...attendanceData,
          timestamp: new Date(),
          updatedBy: this.authStore.user?.uid,
        }

        const docRef = await addDoc(collection(db, "ASISTENCIA"), dataToSave)
        recordId = docRef.id
        operation = "creado"
      }

      // 4. Obtener el registro final para retornar
      const finalRecord = await this.getAttendanceRecordById(recordId)

      return {
        success: true,
        recordId,
        message: `Registro de asistencia ${operation} exitosamente`,
        data: finalRecord || undefined,
      }
    } catch (error: any) {
      console.error("Error recording attendance:", error)
      return {
        success: false,
        message: error.message || "Error al registrar asistencia",
      }
    }
  }

  /**
   * Obtener registro de asistencia específico
   */
  private async getAttendanceRecord(
    studentId: string,
    classId: string,
    date: string
  ): Promise<AttendanceRecord | null> {
    try {
      const attendanceRef = collection(db, "ASISTENCIA")
      const q = query(
        attendanceRef,
        where("studentId", "==", studentId),
        where("classId", "==", classId),
        where("date", "==", date)
      )

      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        const rawData = {id: doc.id, ...doc.data()}
        return validateFirebaseData(AttendanceRecordSchema, rawData)
      }

      return null
    } catch (error) {
      console.error("Error getting attendance record:", error)
      return null
    }
  }

  /**
   * Obtener registro por ID
   */
  async getAttendanceRecordById(recordId: string): Promise<AttendanceRecord | null> {
    try {
      const recordDoc = await getDoc(doc(db, "ASISTENCIA", recordId))
      if (recordDoc.exists()) {
        const rawData = {id: recordDoc.id, ...recordDoc.data()}
        return validateFirebaseData(AttendanceRecordSchema, rawData)
      }
      return null
    } catch (error) {
      console.error("Error getting attendance record by ID:", error)
      return null
    }
  }

  /**
   * Actualizar registro de asistencia
   */
  async updateAttendance(recordId: string, updates: AttendanceUpdate): Promise<boolean> {
    try {
      // Validar actualizaciones
      const validatedUpdates = validateAndTransform(AttendanceUpdateSchema, updates)

      const recordDoc = doc(db, "ASISTENCIA", recordId)
      await updateDoc(recordDoc, {
        ...validatedUpdates,
        updatedAt: new Date(),
      })

      return true
    } catch (error) {
      console.error("Error updating attendance:", error)
      return false
    }
  }

  /**
   * Obtener registros de asistencia por fecha y clase
   */
  async getAttendanceByDateAndClass(classId: string, date: string): Promise<AttendanceRecord[]> {
    try {
      if (!this.rbacStore.hasPermission("attendance_view")) {
        throw new Error("No tienes permisos para ver registros de asistencia")
      }

      const attendanceRef = collection(db, "ASISTENCIA")
      const q = query(
        attendanceRef,
        where("classId", "==", classId),
        where("date", "==", date),
        orderBy("timestamp", "desc")
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => {
        const rawData = {id: doc.id, ...doc.data()}
        return validateFirebaseData(AttendanceRecordSchema, rawData)
      })
    } catch (error) {
      console.error("Error getting attendance by date and class:", error)
      return []
    }
  }

  /**
   * Obtener registros de asistencia por estudiante
   */
  async getAttendanceByStudent(
    studentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceRecord[]> {
    try {
      if (!this.rbacStore.hasPermission("attendance_view")) {
        throw new Error("No tienes permisos para ver registros de asistencia")
      }

      const attendanceRef = collection(db, "ASISTENCIA")
      let q = query(attendanceRef, where("studentId", "==", studentId), orderBy("date", "desc"))

      // Filtros opcionales por rango de fechas
      if (startDate) {
        q = query(q, where("date", ">=", startDate))
      }
      if (endDate) {
        q = query(q, where("date", "<=", endDate))
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => {
        const rawData = {id: doc.id, ...doc.data()}
        return validateFirebaseData(AttendanceRecordSchema, rawData)
      })
    } catch (error) {
      console.error("Error getting attendance by student:", error)
      return []
    }
  }

  // ==================== OBSERVATIONS ====================

  /**
   * Crear observación con validación
   */
  async createObservation(observationData: ObservationCreate): Promise<string | null> {
    try {
      if (!this.rbacStore.hasPermission("observations_create")) {
        throw new Error("No tienes permisos para crear observaciones")
      }

      // Validar datos
      const validatedData = validateAndTransform(ObservationCreateSchema, observationData)

      const dataToSave = {
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const docRef = await addDoc(collection(db, "OBSERVACIONES"), dataToSave)
      return docRef.id
    } catch (error) {
      console.error("Error creating observation:", error)
      return null
    }
  }

  /**
   * Actualizar observación
   */
  async updateObservation(observationId: string, updates: ObservationUpdate): Promise<boolean> {
    try {
      if (!this.rbacStore.hasPermission("observations_edit")) {
        throw new Error("No tienes permisos para editar observaciones")
      }

      const validatedUpdates = validateAndTransform(ObservationUpdateSchema, updates)

      const observationDoc = doc(db, "OBSERVACIONES", observationId)
      await updateDoc(observationDoc, {
        ...validatedUpdates,
        updatedAt: new Date(),
      })

      return true
    } catch (error) {
      console.error("Error updating observation:", error)
      return false
    }
  }

  /**
   * Obtener observaciones por clase y fecha
   */
  async getObservationsByClassAndDate(classId: string, date: string): Promise<ObservationData[]> {
    try {
      if (!this.rbacStore.hasPermission("observations_view")) {
        throw new Error("No tienes permisos para ver observaciones")
      }

      const observationsRef = collection(db, "OBSERVACIONES")
      const q = query(
        observationsRef,
        where("classId", "==", classId),
        where("date", "==", date),
        orderBy("createdAt", "desc")
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => {
        const rawData = {id: doc.id, ...doc.data()}
        return validateFirebaseData(ObservationSchema, rawData)
      })
    } catch (error) {
      console.error("Error getting observations:", error)
      return []
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Registrar asistencia en lote para múltiples estudiantes
   */
  async recordBulkAttendance(
    attendanceRecords: AttendanceCreate[],
    options: RecordAttendanceOptions = {}
  ): Promise<{success: AttendanceOperationResult[]; errors: AttendanceOperationResult[]}> {
    const success: AttendanceOperationResult[] = []
    const errors: AttendanceOperationResult[] = []

    for (const record of attendanceRecords) {
      const result = await this.recordAttendance(record, options)
      if (result.success) {
        success.push(result)
      } else {
        errors.push(result)
      }
    }

    return {success, errors}
  }

  // ==================== UTILITIES ====================

  /**
   * Validar fecha de asistencia (no puede ser futura)
   */
  validateAttendanceDate(date: string): boolean {
    const attendanceDate = new Date(date)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Permitir hasta el final del día actual

    return attendanceDate <= today
  }

  /**
   * Generar estadísticas de asistencia
   */
  async generateAttendanceStats(classId: string, startDate: string, endDate: string) {
    try {
      const attendanceRef = collection(db, "ASISTENCIA")
      const q = query(
        attendanceRef,
        where("classId", "==", classId),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      )

      const snapshot = await getDocs(q)
      const records = snapshot.docs.map((doc) => doc.data())

      const totalRecords = records.length
      const presentCount = records.filter((r) => r.status === "presente").length
      const absentCount = records.filter((r) => r.status === "ausente").length
      const lateCount = records.filter((r) => r.status === "tardanza").length
      const justifiedCount = records.filter((r) => r.status === "justificado").length

      return {
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        justifiedCount,
        attendanceRate: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
      }
    } catch (error) {
      console.error("Error generating attendance stats:", error)
      return null
    }
  }
}

// Exportar instancia singleton del servicio
export const attendanceService = new UnifiedAttendanceService()

// Exportar clase para testing o instanciación manual
export {UnifiedAttendanceService}
