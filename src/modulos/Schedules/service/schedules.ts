import { db } from '../../../firebase'
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
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import type { 
  Schedule,
  ScheduleAssignment,
  ScheduleDay,
  ScheduleResponse,
  LegacySchedule,
  TimeSlot
} from '../types/schedule'

const COLLECTION_NAME = 'HORARIOS'

export function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) {
    console.warn('Invalid time values:', { startTime, endTime })
    return 0
  }
  
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    console.warn('Invalid time format:', { startTime, endTime })
    return 0
  }
  
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)
  
  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes
  
  return endTotalMinutes - startTotalMinutes
}

export async function getAllSchedulesFirebase(): Promise<ScheduleResponse> {
  try {
    // Obtener datos del usuario desde el store de autenticación
    const { useAuthStore } = await import('../../../stores/auth')
    const { fetchClassesFirestore } = await import('../../Classes/service/classes')
    
    const authStore = useAuthStore()
    const currentUser = authStore.user
    const role = currentUser?.role || ''
    const uid = currentUser?.uid || ''
    
    // Generar clave para caché específica por usuario/rol
    const cacheKey = `schedules_${role}_${uid}`
    
    // Intentar obtener del caché primero
    const cachedData = localStorage.getItem(cacheKey)
    if (cachedData) {
      try {
        const cached = JSON.parse(cachedData)
        // Verificar si el caché es reciente (menos de 5 minutos)
        if (cached.timestamp && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
          console.log('[Caché] Usando horarios en caché')
          return {
            success: true,
            data: cached.data,
            error: undefined
          }
        }
      } catch (e) {
        console.warn('Error al leer caché de horarios:', e)
      }
    }
    
    console.log('🔄 Fetching schedules from Firestore...')
    
    // Aplicar filtrado según el rol
    if (['Maestro', 'Teacher', 'teacher'].includes(role) && uid) {
      // Para maestros, filtrar horarios por sus clases
      console.log(`[Filtro] Obteniendo horarios para maestro: ${uid}`)
      
      // Opción 1: Consulta directa por teacherId
      const teacherQuery = query(collection(db, COLLECTION_NAME), where('teacherId', '==', uid))
      const querySnapshot = await getDocs(teacherQuery)
      
      // Opción 2: Si necesitamos incluir horarios basados en las clases que imparte
      // 1. Obtener primero las clases del maestro
      const teacherClasses = await fetchClassesFirestore()
      const classIds = teacherClasses.map(cls => cls.id)
      
      // Si el maestro no tiene clases asignadas y no hay registros directos
      if (classIds.length === 0 && querySnapshot.empty) {
        console.log('[Filtro] El maestro no tiene horarios asignados')
        
        // Guardar en caché un resultado vacío
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: []
          }))
        } catch (e) {
          console.warn('Error al guardar caché de horarios:', e)
        }
        
        return {
          success: true,
          data: [],
          error: undefined
        }
      }
      
      // Combinar resultados de la consulta directa y buscar horarios por classId
      let schedules: Schedule[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Schedule[]
      
      // Si hay clases del maestro, buscar horarios para esas clases si aún no se encontraron por teacherId
      if (classIds.length > 0) {
        // Solo realizar consultas adicionales si es necesario (maestros con pocas clases)
        for (const classId of classIds) {
          // Evitar consultas innecesarias si ya tenemos el horario para esta clase
          if (!schedules.some(s => s.classId === classId)) {
            const classQuery = query(collection(db, COLLECTION_NAME), where('classId', '==', classId))
            const classSnapshot = await getDocs(classQuery)
            
            if (!classSnapshot.empty) {
              const classSchedules = classSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Schedule[]
              
              schedules = [...schedules, ...classSchedules]
            }
          }
        }
      }
      
      // Eliminar duplicados basados en id
      const uniqueSchedules = Array.from(
        new Map(schedules.map(schedule => [schedule.id, schedule])).values()
      )
      
      console.log(`✅ Fetched ${uniqueSchedules.length} schedules for teacher ${uid}`)
      
      // Guardar en caché
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: uniqueSchedules
        }))
      } catch (e) {
        console.warn('Error al guardar caché de horarios:', e)
      }
      
      return {
        success: true,
        data: uniqueSchedules,
        error: undefined
      }
    } else {
      // Para directores, admin u otros roles: obtener todos los horarios
      console.log('[Filtro] Obteniendo todos los horarios (rol admin/director)')
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
      
      const schedules = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Schedule[]
      
      // Guardar en caché
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: schedules
        }))
      } catch (e) {
        console.warn('Error al guardar caché de horarios:', e)
      }
      
      console.log(`✅ Successfully fetched ${schedules.length} schedules`)
      return {
        success: true,
        data: schedules,
        error: undefined
      }
    }
  } catch (error: any) {
    console.error('❌ Error fetching schedules:', error)
    return {
      success: false,
      data: null,
      error: error.message
    }
  }
}

// getScheduleByIdFirebase: async (id: string): Promise<ScheduleResponse> => {
export async function getScheduleByIdFirebase(id: string): Promise<ScheduleResponse> {
  try {
    console.log(`🔄 Fetching schedule ${id} from Firestore...`)
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      throw new Error(`Schedule not found with ID: ${id}`)
    }
    
    console.log(`✅ Schedule ${id} fetched successfully`)
    return {
      success: true,
      data: [{
        id: docSnap.id,
        ...docSnap.data()
      }] as Schedule[],
      error: undefined
    }
  } catch (error: any) {
    console.error(`❌ Error fetching schedule ${id}:`, error)
    return {
      success: false,
      data: null,
      error: error.message
    }
  }
}
export async function createSchedule(schedule: Schedule): Promise<ScheduleResponse> {
  try {
    console.log('🔄 Creating new schedule in Firestore...')
    const docRef = doc(db, COLLECTION_NAME, schedule.id)
    
    // Convert Date objects to Firestore Timestamps
    const processedSchedule = {
      ...schedule,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      timeSlot: {
        ...schedule.timeSlot,
        startTime: Timestamp.fromDate(new Date(schedule.timeSlot.startTime)),
        endTime: Timestamp.fromDate(new Date(schedule.timeSlot.endTime))
      }
    }
    
    await setDoc(docRef, processedSchedule)
    
    console.log(`✅ Schedule ${schedule.id} created successfully`)
    return {
      success: true,
      data: [processedSchedule] as Schedule[],
      error: undefined
    }
  } catch (error: any) {
    console.error('❌ Error creating schedule:', error)
    return {
      success: false,
      data: null,
      error: error.message
    }
  }
}
export async function deleteSchedule(id: string): Promise<ScheduleResponse> {
  try {
    console.log(`🔄 Deleting schedule ${id} from Firestore...`)
    const docRef = doc(db, COLLECTION_NAME, id)
    
    // Verify document exists
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      throw new Error(`Schedule not found with ID: ${id}`)
    }
    
    await deleteDoc(docRef)
    
    console.log(`✅ Schedule ${id} deleted successfully`)
    return {
      success: true,
      data: null,
      error: undefined
    }
  } catch (error: any) {
    console.error(`❌ Error deleting schedule ${id}:`, error)
    return {
      success: false,
      data: null,
      error: error.message
    }
  }
}
export async function migrateLegacySchedules(legacySchedules: LegacySchedule[]): Promise<ScheduleResponse> {
  try {
    console.log('🔄 Migrating legacy schedules to new format...')
    const migratedSchedules: Schedule[] = legacySchedules.map(legacy => convertLegacyToNewFormat(legacy))
    
    // Create new schedules in Firestore
    const batch = db.batch()
    migratedSchedules.forEach(schedule => {
      const docRef = doc(db, COLLECTION_NAME, schedule.id)
      batch.set(docRef, schedule)
    })
    
    await batch.commit()
    
    console.log(`✅ Successfully migrated ${migratedSchedules.length} legacy schedules`)
    return {
      success: true,
      data: migratedSchedules,
      error: undefined
    }
  } catch (error: any) {
    console.error('❌ Error migrating legacy schedules:', error)
    return {
      success: false,
      data: null,
      error: error.message
    }
  }
}

export async function getSchedulesByClassId(classId: string): Promise<ScheduleResponse> {
  try {
    console.log(`🔄 Fetching schedules for class ${classId} from Firestore...`)
    const q = query(collection(db, COLLECTION_NAME), where('classId', '==', classId))
    const querySnapshot = await getDocs(q)
    
    const schedules = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Schedule[]
    
    console.log(`✅ Successfully fetched ${schedules.length} schedules for class ${classId}`)
    return {
      success: true,
      data: schedules,
      error: undefined
    }
  } catch (error: any) {
    console.error(`❌ Error fetching schedules for class ${classId}:`, error)
    return {
      success: false,
      data: null,
      error: error.message
    }
  }
}
export async function getSchedulesByTeacherId(teacherId: string): Promise<ScheduleResponse> {
  try {
    console.log(`🔄 Fetching schedules for teacher ${teacherId} from Firestore...`)
    const q = query(collection(db, COLLECTION_NAME), where('teacherId', '==', teacherId))
    const querySnapshot = await getDocs(q)
    
    const schedules = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Schedule[]
    
    console.log(`✅ Successfully fetched ${schedules.length} schedules for teacher ${teacherId}`)
    return {
      success: true,
      data: schedules,
      error: undefined
    }
  } catch (error: any) {
    console.error(`❌ Error fetching schedules for teacher ${teacherId}:`, error)
    return {
      success: false,
      data: null,
      error: error.message
    }
  }
}
export async function getSchedulesByRoomId(roomId: string): Promise<ScheduleResponse> {
  try {
    console.log(`🔄 Fetching schedules for room ${roomId} from Firestore...`)
    const q = query(collection(db, COLLECTION_NAME), where('roomId', '==', roomId))
    const querySnapshot = await getDocs(q)
    
    const schedules = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Schedule[]
    
    console.log(`✅ Successfully fetched ${schedules.length} schedules for room ${roomId}`)
    return {
      success: true,
      data: schedules,
      error: undefined
    }
  } catch (error: any) {
    console.error(`❌ Error fetching schedules for room ${roomId}:`, error)
    return {
      success: false,
      data: null,
      error: error.message
    }
  }
}

export async function updateSchedule(id: string, updates: Partial<Schedule>): Promise<ScheduleResponse> {
  try {
    console.log(`🔄 Updating schedule ${id} in Firestore...`)
    const docRef = doc(db, COLLECTION_NAME, id)
    
    // Verify document exists
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      throw new Error(`Schedule not found with ID: ${id}`)
    }
    
    // Filter out undefined properties
    const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = value
      return acc
    }, {} as Record<string, any>)
    
    // Convert Date objects to Firestore Timestamps
    const processedUpdates = Object.entries(cleanUpdates).reduce((acc, [key, value]) => {
      if (value instanceof Date) {
        acc[key] = Timestamp.fromDate(value)
      } else {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)
    
    await updateDoc(docRef, {
      ...processedUpdates,
      updatedAt: serverTimestamp()
    })
    
    // Get updated document
    const updatedDoc = await getDoc(docRef)
    if (!updatedDoc.exists()) {
      throw new Error(`Error getting updated schedule ${id}`)
    }
    
    console.log(`✅ Schedule ${id} updated successfully`)
    return {
      success: true,
      data: [{
        id: updatedDoc.id,
        ...updatedDoc.data()
      }] as Schedule[],
      error: undefined
    }
  } catch (error: any) {
    console.error(`❌ Error updating schedule ${id}:`, error)
    return {
      success: false,
      data: null,
      error: error.message
    }
  }
}

function convertLegacyToNewFormat(legacy: LegacySchedule): ScheduleDay {
  return {
    dayOfWeek: legacy.dayOfWeek as ScheduleDay['dayOfWeek'] || 'Lunes',
    timeSlot: {
      startTime: legacy.startTime || '08:00',
      endTime: legacy.endTime || '09:30',
      duration: calculateDuration(
        legacy.startTime || '08:00',
        legacy.endTime || '09:30'
      )
    },
    classId: legacy.classId || '',
    teacherId: legacy.teacherId || '',
    roomId: legacy.roomId || legacy.classroom || '',
    studentIds: legacy.studentIds || [],
    capacity: legacy.capacity || 0,
    isActive: legacy.isActive !== undefined ? legacy.isActive : true
  }
}
