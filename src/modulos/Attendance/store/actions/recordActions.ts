// Archivo para acciones relacionadas con registros de asistencia y justificaciones
import type {
  AttendanceDocument,
  JustificationData,
  AttendanceRecord as MainAttendanceRecord,
} from "../../types/attendance" // Use alias for imported type
import {
  addJustificationToAttendanceFirebase,
  addAttendanceRecord as addAttendanceRecordFirebase,
  updateAttendanceFirebase as updateAttendanceRecordFirebase,
  // updateAttendanceWithJustificationFirebase removed as it was unused
} from "../../service/attendance"

// ========== NUEVO SISTEMA DE PERMISOS ==========
import {usePermissions} from "../../../Auth/composables/usePermissions"
import {ResourceType, PermissionAction} from "../../../Auth/types/permissions"

// Enhanced record actions that support teacher collaboration
import {
  addAttendanceRecordWithPermissions,
  updateAttendanceRecordWithPermissions,
  canAddObservationWithPermissions,
} from "../../service/attendanceCollaboration"

// Define a type for the store's `this` context for recordActions
interface RecordActionsThisContext {
  isLoading: boolean
  error: string | null
  records: MainAttendanceRecord[] // Use the imported and aliased type
  attendanceDocuments: AttendanceDocument[]
  cachedJustifications: Record<string, {reason?: string; file?: File | null; documentUrl?: string}>
  // Methods from other action groups that might be called
  fetchAttendanceDocuments?: () => Promise<AttendanceDocument[]>
  fetchAttendanceByClassAndDate?: (
    classId: string,
    date: string
  ) => Promise<Record<string, string> | AttendanceDocument | null> // Adjusted return type
  // Internal helpers if they are part of the `this` context when actions are invoked
  _updateAttendanceDocumentsArray: (document: AttendanceDocument) => void
  _cleanJustifications: (document: {id: string}) => void // Simplified based on usage
}

// Extended interface to include teacher collaboration context
interface EnhancedRecordActionsThisContext extends RecordActionsThisContext {
  currentTeacherId?: string
}

export const recordActions = {
  _cleanJustifications(this: RecordActionsThisContext, document: {id: string}): void {
    if (this.cachedJustifications && document.id) {
      delete this.cachedJustifications[document.id]
    } else {
      console.warn("_cleanJustifications called with invalid state or document id", {
        hasCachedJustifications: !!this.cachedJustifications,
        documentId: document?.id,
      })
    }
  },

  _updateAttendanceDocumentsArray(
    this: RecordActionsThisContext,
    document: AttendanceDocument
  ): void {
    if (!this.attendanceDocuments) {
      console.error(
        "_updateAttendanceDocumentsArray called but attendanceDocuments is undefined on store state."
      )
      this.attendanceDocuments = []
    }
    const index = this.attendanceDocuments.findIndex(
      (d: AttendanceDocument) => d.id === document.id
    )
    if (index !== -1) {
      this.attendanceDocuments[index] = document
    } else {
      this.attendanceDocuments.push(document)
    }
  },

  async addJustificationToAttendance(
    this: RecordActionsThisContext,
    studentId: string,
    date: string,
    classId: string,
    reason: string,
    file: File | null
  ): Promise<boolean> {
    this.isLoading = true
    this.error = null
    try {
      const justificationPayload: JustificationData = {
        id: studentId,
        reason,
      }
      const docId = await addJustificationToAttendanceFirebase(
        date,
        classId,
        justificationPayload,
        file
      )

      if (typeof this.fetchAttendanceByClassAndDate === "function") {
        await this.fetchAttendanceByClassAndDate(classId, date)
      } else if (typeof this.fetchAttendanceDocuments === "function") {
        await this.fetchAttendanceDocuments()
      }

      // Ensure the object passed to _cleanJustifications matches its expected signature
      this._cleanJustifications({id: docId})
      return true
    } catch (err: any) {
      this.error = `Error al agregar justificación: ${err.message || String(err)}`
      console.error("Error en addJustificationToAttendance:", err)
      return false
    } finally {
      this.isLoading = false
    }
  },

  async addRecord(
    this: RecordActionsThisContext,
    recordData: Omit<MainAttendanceRecord, "id">
  ): Promise<MainAttendanceRecord | null> {
    this.isLoading = true
    this.error = null
    try {
      // Ensure recordData.status is of the correct union type before sending to Firebase
      const validStatus = ["Presente", "Ausente", "Tardanza", "Justificado"].includes(
        recordData.status
      )
        ? recordData.status
        : "Ausente" // Default or throw error if status is invalid

      const newRecord = await addAttendanceRecordFirebase({
        ...recordData,
        status: validStatus as MainAttendanceRecord["status"],
      })
      if (newRecord) {
        this.records.push(newRecord)
        if (typeof this.fetchAttendanceDocuments === "function") {
          await this.fetchAttendanceDocuments()
        }
      }
      return newRecord
    } catch (err: any) {
      this.error = `Error adding attendance record: ${err.message || String(err)}`
      console.error("Error in addRecord:", err)
      return null
    } finally {
      this.isLoading = false
    }
  },

  async updateRecord(
    this: RecordActionsThisContext,
    recordData: MainAttendanceRecord
  ): Promise<MainAttendanceRecord | null> {
    this.isLoading = true
    this.error = null
    try {
      const validStatus = ["Presente", "Ausente", "Tardanza", "Justificado"].includes(
        recordData.status
      )
        ? recordData.status
        : "Ausente"

      if (!recordData.id) {
        throw new Error("Record ID is required for updates.")
      }

      // updateAttendanceRecordFirebase (aliased updateAttendanceFirebase) returns a string (docId)
      const docId = await updateAttendanceRecordFirebase({
        ...recordData,
        status: validStatus as MainAttendanceRecord["status"],
      })

      if (docId) {
        // Since the service returns only the ID, we update the local record with the input data,
        // assuming the update was successful. For a more robust solution, you might re-fetch the record.
        const index = this.records.findIndex((r: MainAttendanceRecord) => r.id === recordData.id)
        if (index !== -1) {
          // Create a new object for the updated record to ensure reactivity if needed
          this.records[index] = {
            ...this.records[index],
            ...recordData,
            status: validStatus as MainAttendanceRecord["status"],
          }
        }
        // Optionally, re-fetch all documents or the specific document if necessary
        if (typeof this.fetchAttendanceDocuments === "function") {
          await this.fetchAttendanceDocuments()
        }
        // Return the modified recordData as the updated record
        return {...recordData, status: validStatus as MainAttendanceRecord["status"]}
      }
      return null // Or handle error if docId is not returned
    } catch (err: any) {
      this.error = `Error updating attendance record: ${err.message || String(err)}`
      console.error("Error in updateRecord:", err)
      return null
    } finally {
      this.isLoading = false
    }
  },
}

export const enhancedRecordActions = {
  ...recordActions,

  /**
   * Versión mejorada de addRecord que verifica permisos de maestro
   */
  async addRecordWithPermissions(
    this: EnhancedRecordActionsThisContext,
    recordData: Omit<MainAttendanceRecord, "id">,
    teacherId?: string
  ): Promise<MainAttendanceRecord | null> {
    this.isLoading = true
    this.error = null

    try {
      // Usar el teacherId proporcionado o el del contexto actual
      const currentTeacherId = teacherId || this.currentTeacherId

      if (!currentTeacherId) {
        throw new Error("No se puede identificar el maestro actual")
      }

      // Validar el estado de asistencia
      const validStatus = ["Presente", "Ausente", "Tardanza", "Justificado"].includes(
        recordData.status
      )
        ? recordData.status
        : "Ausente"

      const recordWithValidStatus = {
        ...recordData,
        status: validStatus as MainAttendanceRecord["status"],
      }

      // Usar el servicio con verificación de permisos
      const newRecord = await addAttendanceRecordWithPermissions(
        recordWithValidStatus,
        currentTeacherId
      )

      if (newRecord) {
        // Actualizar el store con el nuevo registro
        if (!this.records) {
          this.records = []
        }
        this.records.push(newRecord)

        // Refrescar documentos de asistencia si es necesario
        if (typeof this.fetchAttendanceDocuments === "function") {
          await this.fetchAttendanceDocuments()
        }
      }

      return newRecord
    } catch (err: any) {
      this.error = `Error al agregar registro: ${err.message || String(err)}`
      console.error("Error en addRecordWithPermissions:", err)
      return null
    } finally {
      this.isLoading = false
    }
  },

  /**
   * Versión mejorada de updateRecord que verifica permisos de maestro
   */
  async updateRecordWithPermissions(
    this: EnhancedRecordActionsThisContext,
    recordId: string,
    updates: Partial<MainAttendanceRecord>,
    classId: string,
    teacherId?: string
  ): Promise<boolean> {
    this.isLoading = true
    this.error = null

    try {
      // Usar el teacherId proporcionado o el del contexto actual
      const currentTeacherId = teacherId || this.currentTeacherId

      if (!currentTeacherId) {
        throw new Error("No se puede identificar el maestro actual")
      }

      // Usar el servicio con verificación de permisos
      await updateAttendanceRecordWithPermissions(recordId, updates, currentTeacherId, classId)

      // Actualizar el record en el store local
      if (this.records) {
        const index = this.records.findIndex((r) => r.id === recordId)
        if (index !== -1) {
          this.records[index] = {...this.records[index], ...updates}
        }
      }

      // Refrescar documentos de asistencia si es necesario
      if (typeof this.fetchAttendanceDocuments === "function") {
        await this.fetchAttendanceDocuments()
      }

      return true
    } catch (err: any) {
      this.error = `Error al actualizar registro: ${err.message || String(err)}`
      console.error("Error en updateRecordWithPermissions:", err)
      return false
    } finally {
      this.isLoading = false
    }
  },

  /**
   * Verifica si el maestro actual puede agregar observaciones
   */
  async canAddObservation(
    this: EnhancedRecordActionsThisContext,
    classId: string,
    teacherId?: string
  ): Promise<boolean> {
    try {
      const currentTeacherId = teacherId || this.currentTeacherId

      if (!currentTeacherId) {
        return false
      }

      return await canAddObservationWithPermissions(classId, currentTeacherId)
    } catch (err) {
      console.error("Error checking observation permissions:", err)
      return false
    }
  },
}
