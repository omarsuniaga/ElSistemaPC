import { db } from '../../../firebase'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore'
import type { Schedule } from '../types/schedule'

const COLLECTION_NAME = 'HORARIOS'

/**
 * Obtiene todos los horarios de la colección HORARIOS
 */
export const getAllSchedules = async (): Promise<Schedule[]> => {
  try {
    console.log('🔄 Consultando horarios en Firestore...')
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    console.log(`✅ Horarios recuperados: ${querySnapshot.size}`)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Schedule[]
  } catch (error) {
    console.error('❌ Error al obtener horarios:', error)
    throw new Error('Error al obtener la lista de horarios')
  }
}

/**
 * Fetches all schedules from Firestore
 * @returns Promise with all schedules
 */
export const getAllSchedulesFirebase = async () => {
  try {
    console.log('🔄 Fetching all schedules from Firestore...')
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    
    const schedules = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`✅ Successfully fetched ${schedules.length} schedules`)
    return {
      success: true,
      data: schedules,
      error: null
    }
  } catch (error: any) {
    console.error('❌ Error fetching schedules:', error)
    return {
      success: false,
      data: [],
      error: error.message
    }
  }
}

/**
 * Obtiene un horario específico por ID
 */
export const getScheduleById = async (id: string): Promise<Schedule | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Schedule
    }
    
    return null
  } catch (error) {
    console.error(`❌ Error al obtener horario ${id}:`, error)
    throw new Error('Error al obtener los datos del horario')
  }
}

/**
 * Obtiene horarios por ID de clase
 */
export const getSchedulesByClassId = async (classId: string): Promise<Schedule[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('classId', '==', classId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Schedule[]
  } catch (error) {
    console.error(`❌ Error al obtener horarios para la clase ${classId}:`, error)
    throw new Error('Error al obtener horarios por clase')
  }
}

/**
 * Obtiene horarios por ID de profesor
 */
export const getSchedulesByTeacherId = async (teacherId: string): Promise<Schedule[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('teacherId', '==', teacherId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Schedule[]
  } catch (error) {
    console.error(`❌ Error al obtener horarios para el profesor ${teacherId}:`, error)
    throw new Error('Error al obtener horarios por profesor')
  }
}

/**
 * Obtiene horarios por ID de estudiante
 */
export const getSchedulesByStudentId = async (studentId: string): Promise<Schedule[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('studentIds', 'array-contains', studentId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Schedule[]
  } catch (error) {
    console.error(`❌ Error al obtener horarios para el estudiante ${studentId}:`, error)
    throw new Error('Error al obtener horarios por estudiante')
  }
}

/**
 * Crea un nuevo horario
 */
export const createSchedule = async (schedule: Omit<Schedule, 'id'>): Promise<Schedule> => {
  try {
    console.log('🔄 Creando nuevo horario en Firestore...')
    
    // Si se proporciona un ID específico, usar setDoc
    if (schedule.customId) {
      const docRef = doc(db, COLLECTION_NAME, schedule.customId)
      await setDoc(docRef, {
        ...schedule,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      return {
        id: docRef.id,
        ...schedule
      } as Schedule
    } 
    
    // Si no hay ID personalizado, usar addDoc para generar uno automáticamente
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...schedule,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    console.log(`✅ Horario creado con ID: ${docRef.id}`)
    return {
      id: docRef.id,
      ...schedule
    } as Schedule
  } catch (error) {
    console.error('❌ Error al crear horario:', error)
    throw new Error('Error al crear el horario')
  }
}

/**
 * Actualiza un horario existente
 */
export const updateSchedule = async (id: string, updates: Partial<Schedule>): Promise<void> => {
  try {
    console.log(`🔄 Actualizando horario ${id} en Firestore...`)
    const docRef = doc(db, COLLECTION_NAME, id)
    
    // Verificar que el documento existe
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      throw new Error(`No se encontró el horario con ID: ${id}`)
    }
    
    // Filtrar propiedades undefined
    const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = value
      return acc
    }, {} as Record<string, any>)
    
    await updateDoc(docRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp()
    })
    
    console.log(`✅ Horario ${id} actualizado correctamente`)
  } catch (error) {
    console.error(`❌ Error al actualizar horario ${id}:`, error)
    throw new Error('Error al actualizar el horario')
  }
}

/**
 * Elimina un horario
 */
export const deleteSchedule = async (id: string): Promise<void> => {
  try {
    console.log(`🔄 Eliminando horario ${id} de Firestore...`)
    
    // Verificar que el ID sea válido
    if (!id) {
      throw new Error('ID de horario inválido')
    }
    
    const docRef = doc(db, COLLECTION_NAME, id)
    
    // Verificar que el documento existe
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      throw new Error(`No se encontró el horario con ID: ${id}`)
    }
    
    await deleteDoc(docRef)
    console.log(`✅ Horario ${id} eliminado correctamente`)
  } catch (error) {
    console.error(`❌ Error al eliminar horario ${id}:`, error)
    throw new Error('Error al eliminar el horario')
  }
}

/**
 * Busca horarios por día de la semana
 */
export const getSchedulesByDay = async (dayOfWeek: string): Promise<Schedule[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('dayOfWeek', '==', dayOfWeek))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Schedule[]
  } catch (error) {
    console.error(`❌ Error al obtener horarios para el día ${dayOfWeek}:`, error)
    throw new Error('Error al obtener horarios por día')
  }
}

/**
 * Busca horarios por aula
 */
export const getSchedulesByRoom = async (room: string): Promise<Schedule[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('classroom', '==', room))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Schedule[]
  } catch (error) {
    console.error(`❌ Error al obtener horarios para el aula ${room}:`, error)
    throw new Error('Error al obtener horarios por aula')
  }
}

/**
 * Verifica si hay conflictos de horario para un profesor
 */
export const checkTeacherScheduleConflicts = async (teacherId: string, dayOfWeek: string, startTime: string, endTime: string, excludeScheduleId?: string): Promise<boolean> => {
  try {
    const teacherSchedules = await getSchedulesByTeacherId(teacherId)
    
    // Filtrar horarios del mismo día y excluir el horario actual si se está editando
    const sameDaySchedules = teacherSchedules.filter(schedule => 
      schedule.dayOfWeek === dayOfWeek && 
      (!excludeScheduleId || schedule.id !== excludeScheduleId)
    )
    
    // Verificar si hay conflictos (solapamiento de horarios)
    return sameDaySchedules.some(schedule => {
      const existingStart = schedule.startTime
      const existingEnd = schedule.endTime
      
      // Solapamiento si:
      // - El nuevo inicio está entre el inicio y fin existente
      // - El nuevo fin está entre el inicio y fin existente
      // - El nuevo horario contiene completamente al existente
      return (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      )
    })
  } catch (error) {
    console.error(`❌ Error al verificar conflictos de horario para el profesor ${teacherId}:`, error)
    throw new Error('Error al verificar conflictos de horario')
  }
}

/**
 * Verifica conflictos de horario para un nuevo horario
 */
export const getScheduleConflicts = async (request: ScheduleCreationRequest | ScheduleUpdateRequest): Promise<Array<{type: string, description: string}>> => {
  try {
    const conflicts: Array<{type: string, description: string}> = []
    
    // Verificar conflictos de profesor
    const teacherConflict = await checkTeacherScheduleConflicts(
      request.teacherId,
      request.dayOfWeek,
      request.startTime,
      request.endTime,
      'id' in request ? request.id : undefined
    )
    
    if (teacherConflict) {
      conflicts.push({
        type: 'teacher',
        description: 'El profesor ya tiene una clase programada en este horario'
      })
    }
    
    // Verificar conflictos de aula (similar a teacher conflict pero para aula)
    const roomSchedules = await getSchedulesByRoom(request.roomId)
    const roomConflict = roomSchedules.some(schedule => {
      if ('id' in request && schedule.id === request.id) return false
      
      return (
        schedule.dayOfWeek === request.dayOfWeek &&
        ((request.startTime >= schedule.startTime && request.startTime < schedule.endTime) ||
         (request.endTime > schedule.startTime && request.endTime <= schedule.endTime) ||
         (request.startTime <= schedule.startTime && request.endTime >= schedule.endTime))
      )
    })
    
    if (roomConflict) {
      conflicts.push({
        type: 'room',
        description: 'El aula ya está reservada en este horario'
      })
    }
    
    return conflicts
  } catch (error) {
    console.error('❌ Error al verificar conflictos de horario:', error)
    throw new Error('Error al verificar conflictos de horario')
  }
}
