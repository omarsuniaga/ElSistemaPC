import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore"
import {ref, uploadBytes, getDownloadURL} from "firebase/storage"
import {db, storage} from "../../../firebase/config"
import type {AttendanceRecord, ClassObservation, JustificationData} from "../types/attendance"

/**
 * Get attendance records by date and class ID
 * @param date The date in 'YYYY-MM-DD' or 'YYYYMMDD' format
 * @param classId The class ID
 * @returns Promise resolving to array of attendance records
 */
export async function getAttendanceByDateAndClassFirebase(
  date: string,
  classId: string
): Promise<AttendanceRecord[]> {
  try {
    if (!date || !classId) {
      throw new Error("Date and classId are required")
    }

    // Normalizar formato de fecha a yyyy-MM-dd
    let formattedDate = date
    const dateRegexCompact = /^\d{8}$/
    if (dateRegexCompact.test(date)) {
      // Convertir de YYYYMMDD a YYYY-MM-DD
      formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      throw new Error("Invalid date format. Expected YYYY-MM-DD or YYYYMMDD.")
    }

    // Get Firestore references
    const db = getFirestore()
    const attendancesCollection = collection(db, "attendances")

    // Query for attendance records matching date and class
    const q = query(
      attendancesCollection,
      where("fecha", "==", formattedDate),
      where("classId", "==", classId)
    )

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No attendance records found for date ${formattedDate} and class ${classId}`)
      return []
    }

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        studentId: data.studentId,
        classId: data.classId,
        fecha: data.fecha,
        status: data.status,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as AttendanceRecord
    })
  } catch (error) {
    console.error("Error in getAttendanceByDateAndClassFirebase:", error)
    throw error
  }
}

/**
 * Agrega una observación de clase con formato enriquecido compatible con la estructura de Firestore
 */
export const addClassObservationFirebase = async (
  observation: Omit<ClassObservation, "id" | "createdAt" | "updatedAt">
): Promise<ClassObservation> => {
  try {
    console.log("Saving observation to Firestore:", observation)
    const observationRef = collection(db, "OBSERVACIONES")

    // Extraer taggedStudents del objeto observation si existe
    const observationAny = observation as any
    const taggedStudents = observationAny.taggedStudents || observationAny.taggedStudentIds || []

    // Preparar datos compatibles con la estructura de Firestore
    const firestoreData = {
      // Campos principales requeridos
      classId: observation.classId,
      date: observation.date, // YYYY-MM-DD format
      fecha: observation.date, // Para compatibilidad
      authorId: observation.authorId,
      author: observation.authorId, // En Firestore author es el ID del usuario
      text: observation.text,

      // Estructura content como mapa
      content: observation.content || {
        text: observation.text,
        taggedStudents,
      },

      // Array de estudiantes etiquetados
      taggedStudents,

      // Campos de metadata
      type: observation.type || "general",
      priority: observation.priority || "media",
      requiresFollowUp: observation.requiresFollowUp || false,

      // Timestamps de Firestore
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    console.log("Firestore data to save:", firestoreData)
    const docRef = await addDoc(observationRef, firestoreData)

    // Construir el objeto de respuesta
    const createdObservation: ClassObservation = {
      id: docRef.id,
      classId: firestoreData.classId,
      date: firestoreData.date,
      authorId: firestoreData.authorId,
      text: firestoreData.text,
      content: firestoreData.content,
      type: firestoreData.type,
      priority: firestoreData.priority,
      requiresFollowUp: firestoreData.requiresFollowUp,
      createdAt: firestoreData.createdAt.toDate(),
      updatedAt: firestoreData.updatedAt.toDate(),
      taggedStudentIds: taggedStudents,
    }

    console.log("Observation saved successfully with ID:", docRef.id)

    // Notificar a los profesores si la observación es de alta prioridad o requiere seguimiento
    if (observation.priority === "alta" || observation.requiresFollowUp) {
      await notifyTeachersAboutObservation(createdObservation)
    }

    return createdObservation
  } catch (error) {
    console.error("Error adding class observation to Firestore:", error)
    throw error
  }
}

/**
 * Agrega una justificación con validación de tiempo
 */
export const addJustificationFirebase = async (
  justification: Omit<JustificationData, "id" | "createdAt" | "updatedAt">
): Promise<JustificationData> => {
  try {
    // Validar el límite de tiempo (48 horas desde la fecha de la clase)
    const classDate = new Date(justification.fecha)
    const timeLimit = new Date(classDate.getTime() + 48 * 60 * 60 * 1000)

    if (new Date() > timeLimit) {
      throw new Error("No se pueden agregar justificaciones después de 48 horas de la clase")
    }

    const justificationRef = collection(db, "justifications")
    const newJustification = {
      ...justification,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      timeLimit: timeLimit.toISOString(),
    }

    const docRef = await addDoc(justificationRef, newJustification)
    return {
      ...newJustification,
      id: docRef.id,
      createdAt: newJustification.createdAt.toDate(),
      updatedAt: newJustification.updatedAt.toDate(),
      timeLimit: new Date(newJustification.timeLimit),
    } as JustificationData
  } catch (error) {
    console.error("Error adding justification:", error)
    throw error
  }
}

/**
 * Obtiene observaciones de una clase con filtros
 */
export const getClassObservationsFirebase = async (
  classId: string,
  date?: string
): Promise<ClassObservation[]> => {
  try {
    console.log("Fetching observations from Firestore for classId:", classId, "date:", date)
    const observationsRef = collection(db, "OBSERVACIONES")
    let q = query(observationsRef, where("classId", "==", classId))

    if (date) {
      q = query(q, where("date", "==", date))
    }

    const querySnapshot = await getDocs(q)
    console.log("Found", querySnapshot.docs.length, "observations in Firestore")

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      console.log("Processing observation document:", doc.id, data)

      // Extraer texto de diferentes posibles estructuras
      let text = ""
      if (data.text) {
        text = data.text
      } else if (data.content && data.content.text) {
        text = data.content.text
      }

      // Extraer estudiantes etiquetados
      const taggedStudents = data.taggedStudents || []

      // Crear un objeto compatible con ClassObservation
      const observation: ClassObservation = {
        id: doc.id,
        classId: data.classId || "",

        // Mapear campos de texto y contenido
        text,
        content: data.content || {text},

        // Mapear campos de autor - usar authorId como principal
        authorId: data.authorId || data.author || "",
        authorName: data.authorName || "",

        // Manejar campos de fecha
        date: data.date || data.fecha || "",
        createdAt: data.createdAt
          ? data.createdAt.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt)
          : new Date(),
        updatedAt: data.updatedAt
          ? data.updatedAt.toDate
            ? data.updatedAt.toDate()
            : new Date(data.updatedAt)
          : new Date(),

        // Campos de historial y metadata
        lastModified: data.lastModified
          ? data.lastModified.toDate
            ? data.lastModified.toDate()
            : new Date(data.lastModified)
          : undefined,
        modifiedBy: data.modifiedBy || "",
        modifiedByName: data.modifiedByName || "",

        // Campos específicos de la estructura de Firestore
        type: data.type || "general",
        priority: data.priority || "media",
        requiresFollowUp: data.requiresFollowUp || false,
        taggedStudentIds: taggedStudents,

        // Campos adicionales para compatibilidad
        studentId: data.studentId,
        studentName: data.studentName,
        images: data.images || [],
      }

      console.log("Mapped observation:", observation)
      return observation
    })
  } catch (error) {
    console.error("Error getting class observations from Firestore:", error)
    throw error
  }
}

/**
 * Notifica a los profesores sobre observaciones importantes
 */
const notifyTeachersAboutObservation = async (observation: ClassObservation): Promise<void> => {
  try {
    // Aquí iría la lógica para notificar a los profesores
    // Por ejemplo, enviar un correo electrónico o una notificación push
    console.log("Notificando a los profesores sobre la observación:", observation)
  } catch (error) {
    console.error("Error notifying teachers:", error)
    // No lanzamos el error para no interrumpir el flujo principal
  }
}

export const uploadJustificationDocument = async (
  file: File,
  studentId: string,
  classId: string
): Promise<string> => {
  try {
    const storageRef = ref(storage, `justifications/${studentId}/${classId}/${file.name}`)
    const snapshot = await uploadBytes(storageRef, file)
    return await getDownloadURL(snapshot.ref)
  } catch (error) {
    console.error("Error uploading justification document:", error)
    throw error
  }
}

/**
 * Actualiza una observación existente con historial de modificaciones
 */
export const updateClassObservationFirebase = async (
  observation: ClassObservation
): Promise<ClassObservation> => {
  try {
    if (!observation.id) {
      throw new Error("Se requiere el ID de la observación para actualizarla")
    }

    const observationRef = doc(db, "OBSERVACIONES", observation.id)

    // Preparamos los datos con la estructura requerida para OBSERVACIONES
    const updateData = {
      // Campos principales según la estructura requerida
      author: observation.authorId || observation.modifiedBy || observation.author || "",
      classId: observation.classId || observation.categoryId || "",
      date: observation.fecha || "",
      text:
        typeof observation.content === "object"
          ? observation.content.text || observation.text
          : observation.text || "",

      // Campos de historial y fechas
      createdAt:
        observation.createdAt instanceof Date
          ? observation.createdAt.toISOString()
          : observation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),

      // Campos adicionales que pueden ser útiles
      modifiedBy: observation.modifiedBy || observation.authorId || "",
      modifiedByName: observation.modifiedByName || "",
    }

    await updateDoc(observationRef, updateData)

    // Devolver la observación actualizada con fechas como Date
    return {
      ...observation,
      updatedAt: new Date(),
      lastModified:
        observation.lastModified instanceof Date
          ? observation.lastModified
          : new Date(observation.lastModified || Date.now()),
    } as ClassObservation
  } catch (error) {
    console.error("Error updating class observation:", error)
    throw error
  }
}

/**
 * Elimina una observación de clase
 */
export const deleteClassObservationFirebase = async (observationId: string): Promise<void> => {
  try {
    console.log("Deleting observation from Firestore:", observationId)
    const observationRef = doc(db, "OBSERVACIONES", observationId)
    await updateDoc(observationRef, {
      deleted: true,
      deletedAt: Timestamp.now(),
    })
    console.log("Observation marked as deleted successfully")
  } catch (error) {
    console.error("Error deleting class observation from Firestore:", error)
    throw error
  }
}
