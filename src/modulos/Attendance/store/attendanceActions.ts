import { defineStore } from 'pinia'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../../../firebase'
import { useAttendanceStateStore, type AttendanceRecord } from './attendanceState'

export interface SaveAttendanceData {
  classId: string
  date: string
  teacherId: string
  presentes: string[]
  ausentes: string[]
  tarde: string[]
  justificacion: Array<{
    studentId: string
    reason: string
    attachments?: string[]
  }>
  observations?: string
}

/**
 * Store para las acciones de asistencia
 * Maneja las operaciones CRUD con Firebase
 */
export const useAttendanceActionsStore = defineStore('attendanceActions', () => {
  const stateStore = useAttendanceStateStore()

  // Colección de Firebase
  const COLLECTION_NAME = 'ASISTENCIAS'

  /**
   * Obtener todos los registros de asistencia
   */
  const fetchAttendanceRecords = async () => {
    try {
      stateStore.setLoading(true)
      stateStore.setError(null)

      const attendanceCollection = collection(db, COLLECTION_NAME)
      const snapshot = await getDocs(attendanceCollection)
      
      const records: Record<string, AttendanceRecord> = {}
      
      snapshot.forEach(doc => {
        const data = doc.data()
        records[doc.id] = {
          id: doc.id,
          classId: data.classId,
          date: data.date,
          teacherId: data.teacherId,
          data: data.data || {},
          observations: data.observations,
          createdAt: (data.createdAt && typeof data.createdAt.toDate === 'function')
            ? data.createdAt.toDate()
            : (data.createdAt instanceof Date)
              ? data.createdAt
              : (typeof data.createdAt === 'string')
                ? new Date(data.createdAt)
                : new Date(),
          updatedAt: (data.updatedAt && typeof data.updatedAt.toDate === 'function')
            ? data.updatedAt.toDate()
            : (data.updatedAt instanceof Date)
              ? data.updatedAt
              : (typeof data.updatedAt === 'string')
                ? new Date(data.updatedAt)
                : new Date(),
          createdBy: data.createdBy,
          updatedBy: data.updatedBy
        }
      })

      stateStore.setAttendanceRecords(records)
      stateStore.setLastSync(new Date())
      
      return records
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      stateStore.setError('Error al cargar los registros de asistencia')
      throw error
    } finally {
      stateStore.setLoading(false)
    }
  }

  /**
   * Obtener registros de asistencia por fecha
   */
  const fetchAttendanceByDate = async (date: string) => {
    try {
      stateStore.setLoading(true)
      
      const attendanceCollection = collection(db, COLLECTION_NAME)
      const q = query(
        attendanceCollection,
        where('date', '==', date),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      const records: AttendanceRecord[] = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        records.push({
          id: doc.id,
          classId: data.classId,
          date: data.date,
          teacherId: data.teacherId,
          data: data.data || {},
          observations: data.observations,
          createdAt: (data.createdAt && typeof data.createdAt.toDate === 'function')
            ? data.createdAt.toDate()
            : (data.createdAt instanceof Date)
              ? data.createdAt
              : (typeof data.createdAt === 'string')
                ? new Date(data.createdAt)
                : new Date(),
          updatedAt: (data.updatedAt && typeof data.updatedAt.toDate === 'function')
            ? data.updatedAt.toDate()
            : (data.updatedAt instanceof Date)
              ? data.updatedAt
              : (typeof data.updatedAt === 'string')
                ? new Date(data.updatedAt)
                : new Date(),
          createdBy: data.createdBy,
          updatedBy: data.updatedBy
        })
      })

      // Actualizar el store con los registros obtenidos
      records.forEach(record => {
        stateStore.addAttendanceRecord(record)
      })
      
      return records
    } catch (error) {
      console.error('Error fetching attendance by date:', error)
      stateStore.setError('Error al cargar la asistencia para la fecha')
      throw error
    } finally {
      stateStore.setLoading(false)
    }
  }

  /**
   * Obtener registros de asistencia por clase
   */
  const fetchAttendanceByClass = async (classId: string) => {
    try {
      stateStore.setLoading(true)
      
      const attendanceCollection = collection(db, COLLECTION_NAME)
      const q = query(
        attendanceCollection,
        where('classId', '==', classId),
        orderBy('date', 'desc')
      )
      
      const snapshot = await getDocs(q)
      const records: AttendanceRecord[] = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        records.push({
          id: doc.id,
          classId: data.classId,
          date: data.date,
          teacherId: data.teacherId,
          data: data.data || {},
          observations: data.observations,
          createdAt: (data.createdAt && typeof data.createdAt.toDate === 'function')
            ? data.createdAt.toDate()
            : (data.createdAt instanceof Date)
              ? data.createdAt
              : (typeof data.createdAt === 'string')
                ? new Date(data.createdAt)
                : new Date(),
          updatedAt: (data.updatedAt && typeof data.updatedAt.toDate === 'function')
            ? data.updatedAt.toDate()
            : (data.updatedAt instanceof Date)
              ? data.updatedAt
              : (typeof data.updatedAt === 'string')
                ? new Date(data.updatedAt)
                : new Date(),
          createdBy: data.createdBy,
          updatedBy: data.updatedBy
        })
      })

      // Actualizar el store con los registros obtenidos
      records.forEach(record => {
        stateStore.addAttendanceRecord(record)
      })
      
      return records
    } catch (error) {
      console.error('Error fetching attendance by class:', error)
      stateStore.setError('Error al cargar la asistencia para la clase')
      throw error
    } finally {
      stateStore.setLoading(false)
    }
  }

  /**
   * Guardar registro de asistencia
   */
  const saveAttendanceRecord = async (data: SaveAttendanceData) => {
    try {
      stateStore.setLoading(true)
      stateStore.setError(null)

      const recordId = `${data.classId}_${data.date}`
      const docRef = doc(db, COLLECTION_NAME, recordId)
      
      const recordData = {
        classId: data.classId,
        date: data.date,
        teacherId: data.teacherId,
        data: {
          presentes: data.presentes,
          ausentes: data.ausentes,
          tarde: data.tarde,
          justificacion: data.justificacion
        },
        observations: data.observations || '',
        updatedAt: Timestamp.now(),
        updatedBy: data.teacherId
      }

      // Verificar si el documento existe
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        // Actualizar documento existente
        await updateDoc(docRef, recordData)
      } else {
        // Crear nuevo documento
        await setDoc(docRef, {
          ...recordData,
          createdAt: Timestamp.now(),
          createdBy: data.teacherId
        })
      }

      // Actualizar el store local
      const updatedRecord: AttendanceRecord = {
        id: recordId,
        classId: data.classId,
        date: data.date,
        teacherId: data.teacherId,
        data: recordData.data,
        observations: data.observations,
        createdAt: docSnap.exists() ? docSnap.data().createdAt?.toDate() : new Date(),
        updatedAt: new Date(),
        createdBy: docSnap.exists() ? docSnap.data().createdBy : data.teacherId,
        updatedBy: data.teacherId
      }

      stateStore.addAttendanceRecord(updatedRecord)
      
      return updatedRecord
    } catch (error) {
      console.error('Error saving attendance record:', error)
      stateStore.setError('Error al guardar el registro de asistencia')
      throw error
    } finally {
      stateStore.setLoading(false)
    }
  }

  /**
   * Actualizar observaciones de un registro
   */
  const updateObservations = async (recordId: string, observations: string) => {
    try {
      stateStore.setLoading(true)
      
      const docRef = doc(db, COLLECTION_NAME, recordId)
      await updateDoc(docRef, {
        observations,
        updatedAt: Timestamp.now()
      })

      // Actualizar el store local
      stateStore.updateAttendanceRecord(recordId, {
        observations,
        updatedAt: new Date()
      })

      return true
    } catch (error) {
      console.error('Error updating observations:', error)
      stateStore.setError('Error al actualizar las observaciones')
      throw error
    } finally {
      stateStore.setLoading(false)
    }
  }

  /**
   * Eliminar registro de asistencia
   */
  const deleteAttendanceRecord = async (recordId: string) => {
    try {
      stateStore.setLoading(true)
      
      const docRef = doc(db, COLLECTION_NAME, recordId)
      await deleteDoc(docRef)

      // Actualizar el store local
      stateStore.removeAttendanceRecord(recordId)
      
      return true
    } catch (error) {
      console.error('Error deleting attendance record:', error)
      stateStore.setError('Error al eliminar el registro de asistencia')
      throw error
    } finally {
      stateStore.setLoading(false)
    }
  }

  /**
   * Obtener estadísticas de asistencia para un rango de fechas
   */
  const getAttendanceStats = async (startDate: string, endDate: string, classId?: string) => {
    try {
      stateStore.setLoading(true)
      
      const attendanceCollection = collection(db, COLLECTION_NAME)
      let q = query(
        attendanceCollection,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      )

      if (classId) {
        q = query(q, where('classId', '==', classId))
      }
      
      const snapshot = await getDocs(q)
      const records: AttendanceRecord[] = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        records.push({
          id: doc.id,
          classId: data.classId,
          date: data.date,
          teacherId: data.teacherId,
          data: data.data || {},
          observations: data.observations,
          createdAt: (data.createdAt && typeof data.createdAt.toDate === 'function')
            ? data.createdAt.toDate()
            : (data.createdAt instanceof Date)
              ? data.createdAt
              : (typeof data.createdAt === 'string')
                ? new Date(data.createdAt)
                : new Date(),
          updatedAt: (data.updatedAt && typeof data.updatedAt.toDate === 'function')
            ? data.updatedAt.toDate()
            : (data.updatedAt instanceof Date)
              ? data.updatedAt
              : (typeof data.updatedAt === 'string')
                ? new Date(data.updatedAt)
                : new Date(),
          createdBy: data.createdBy,
          updatedBy: data.updatedBy
        })
      })

      // Calcular estadísticas
      const totalRecords = records.length
      const completedRecords = records.filter(record => 
        record.data.presentes?.length || 
        record.data.ausentes?.length || 
        record.data.tarde?.length
      ).length

      return {
        totalRecords,
        completedRecords,
        pendingRecords: totalRecords - completedRecords,
        completionRate: totalRecords > 0 ? (completedRecords / totalRecords) * 100 : 0,
        records
      }
    } catch (error) {
      console.error('Error getting attendance stats:', error)
      stateStore.setError('Error al obtener las estadísticas de asistencia')
      throw error
    } finally {
      stateStore.setLoading(false)
    }
  }

  return {
    fetchAttendanceRecords,
    fetchAttendanceByDate,
    fetchAttendanceByClass,
    saveAttendanceRecord,
    updateObservations,
    deleteAttendanceRecord,
    getAttendanceStats
  }
})
