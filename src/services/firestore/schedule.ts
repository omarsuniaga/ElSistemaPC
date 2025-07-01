import {db} from "../../firebase"
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
} from "firebase/firestore"
import type {
  ScheduleAssignment,
  ScheduleResponse,
  ScheduleCreationRequest,
  ScheduleUpdateRequest,
} from "../../types/schedule"

const COLLECTION_NAME = "HORARIOS"

export async function getAllSchedules(): Promise<ScheduleResponse> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    const schedules = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduleAssignment[]

    return {
      success: true,
      data: schedules,
    }
  } catch (error: any) {
    console.error("Error getting schedules:", error)
    return {
      success: false,
      data: null,
      error: error.message,
    }
  }
}

export async function getScheduleById(id: string): Promise<ScheduleResponse> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return {
        success: false,
        data: null,
        error: "Schedule not found",
      }
    }

    return {
      success: true,
      data: [
        {
          id: docSnap.id,
          ...docSnap.data(),
        },
      ] as ScheduleAssignment[],
    }
  } catch (error: any) {
    console.error("Error getting schedule:", error)
    return {
      success: false,
      data: null,
      error: error.message,
    }
  }
}

export async function getSchedulesByTeacher(teacherId: string): Promise<ScheduleResponse> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("scheduleDay.teacherId", "==", teacherId)
    )
    const querySnapshot = await getDocs(q)
    const schedules = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduleAssignment[]

    return {
      success: true,
      data: schedules,
    }
  } catch (error: any) {
    console.error("Error getting teacher schedules:", error)
    return {
      success: false,
      data: null,
      error: error.message,
    }
  }
}

export async function getSchedulesByClass(classId: string): Promise<ScheduleResponse> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("scheduleDay.classId", "==", classId))
    const querySnapshot = await getDocs(q)
    const schedules = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduleAssignment[]

    return {
      success: true,
      data: schedules,
    }
  } catch (error: any) {
    console.error("Error getting class schedules:", error)
    return {
      success: false,
      data: null,
      error: error.message,
    }
  }
}

export async function createSchedule(data: ScheduleCreationRequest): Promise<ScheduleResponse> {
  try {
    const newScheduleRef = doc(collection(db, COLLECTION_NAME))
    const timestamp = new Date()

    const scheduleData: ScheduleAssignment = {
      id: newScheduleRef.id,
      scheduleDay: {
        dayOfWeek: data.dayOfWeek,
        timeSlot: data.timeSlot,
        classId: data.classId,
        teacherId: data.teacherId,
        roomId: data.roomId,
        studentIds: data.studentIds,
        capacity: 0, // Se actualizará después de validar
        isActive: true,
      },
      class: {} as any, // Se completará con datos reales
      teacher: {} as any, // Se completará con datos reales
      students: [], // Se completará con datos reales
      room: {} as any, // Se completará con datos reales
      createdAt: timestamp,
      updatedAt: timestamp,
      status: "active",
    }

    await setDoc(newScheduleRef, scheduleData)

    return {
      success: true,
      data: [scheduleData],
    }
  } catch (error: any) {
    console.error("Error creating schedule:", error)
    return {
      success: false,
      data: null,
      error: error.message,
    }
  }
}

export async function updateSchedule(request: ScheduleUpdateRequest): Promise<ScheduleResponse> {
  try {
    const {scheduleId, updates} = request
    const docRef = doc(db, COLLECTION_NAME, scheduleId)

    // Añadir timestamp de actualización
    const updatedData = {
      ...updates,
      updatedAt: new Date(),
    }

    await updateDoc(docRef, updatedData)

    // Obtener el documento actualizado
    const updatedDoc = await getDoc(docRef)

    return {
      success: true,
      data: [
        {
          id: updatedDoc.id,
          ...updatedDoc.data(),
        },
      ] as ScheduleAssignment[],
    }
  } catch (error: any) {
    console.error("Error updating schedule:", error)
    return {
      success: false,
      data: null,
      error: error.message,
    }
  }
}

export async function deleteSchedule(id: string): Promise<ScheduleResponse> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id))
    return {
      success: true,
      data: null,
    }
  } catch (error: any) {
    console.error("Error deleting schedule:", error)
    return {
      success: false,
      data: null,
      error: error.message,
    }
  }
}

export async function getScheduleConflicts(schedule: ScheduleCreationRequest) {
  const conflicts = []

  // Verificar conflictos de profesor
  const teacherSchedules = await getSchedulesByTeacher(schedule.teacherId)
  if (teacherSchedules.data) {
    const conflictingTeacherSchedules = teacherSchedules.data.filter(
      (s) =>
        s.scheduleDay.dayOfWeek === schedule.dayOfWeek &&
        doTimePeriodsOverlap(s.scheduleDay.timeSlot, schedule.timeSlot)
    )
    if (conflictingTeacherSchedules.length > 0) {
      conflicts.push({
        type: "teacher",
        description: "El profesor ya tiene una clase asignada en este horario",
      })
    }
  }

  // Verificar conflictos de salón
  const roomSchedules = await getRoomSchedules(schedule.roomId)
  if (roomSchedules.data) {
    const conflictingRoomSchedules = roomSchedules.data.filter(
      (s) =>
        s.scheduleDay.dayOfWeek === schedule.dayOfWeek &&
        doTimePeriodsOverlap(s.scheduleDay.timeSlot, schedule.timeSlot)
    )
    if (conflictingRoomSchedules.length > 0) {
      conflicts.push({
        type: "room",
        description: "El salón ya está ocupado en este horario",
      })
    }
  }

  // Verificar conflictos de estudiantes
  for (const studentId of schedule.studentIds) {
    const studentSchedules = await getStudentSchedules(studentId)
    if (studentSchedules.data) {
      const conflictingStudentSchedules = studentSchedules.data.filter(
        (s) =>
          s.scheduleDay.dayOfWeek === schedule.dayOfWeek &&
          doTimePeriodsOverlap(s.scheduleDay.timeSlot, schedule.timeSlot)
      )
      if (conflictingStudentSchedules.length > 0) {
        conflicts.push({
          type: "student",
          description: `El estudiante ${studentId} ya tiene una clase asignada en este horario`,
        })
        break // Solo reportamos un conflicto de estudiante
      }
    }
  }

  return conflicts
}

// Funciones auxiliares
function doTimePeriodsOverlap(period1: TimeSlot, period2: TimeSlot): boolean {
  const start1 = convertTimeToMinutes(period1.startTime)
  const end1 = convertTimeToMinutes(period1.endTime)
  const start2 = convertTimeToMinutes(period2.startTime)
  const end2 = convertTimeToMinutes(period2.endTime)

  return start1 < end2 && start2 < end1
}

function convertTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

// Funciones adicionales para consultas específicas
async function getRoomSchedules(roomId: string): Promise<ScheduleResponse> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("scheduleDay.roomId", "==", roomId))
    const querySnapshot = await getDocs(q)
    const schedules = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduleAssignment[]

    return {
      success: true,
      data: schedules,
    }
  } catch (error: any) {
    console.error("Error getting room schedules:", error)
    return {
      success: false,
      data: null,
      error: error.message,
    }
  }
}

async function getStudentSchedules(studentId: string): Promise<ScheduleResponse> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("scheduleDay.studentIds", "array-contains", studentId)
    )
    const querySnapshot = await getDocs(q)
    const schedules = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduleAssignment[]

    return {
      success: true,
      data: schedules,
    }
  } catch (error: any) {
    console.error("Error getting student schedules:", error)
    return {
      success: false,
      data: null,
      error: error.message,
    }
  }
}
