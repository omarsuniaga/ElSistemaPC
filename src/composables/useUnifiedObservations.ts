// Función para obtener observaciones de la colección unificada
// Agrega esta función al store de attendance o crea un nuevo composable

import {collection, query, where, getDocs} from "firebase/firestore"
import {db} from "../firebase"

/**
 * Obtiene observaciones unificadas para una clase específica
 * @param classId - ID de la clase
 * @returns Array de observaciones unificadas
 */
export async function fetchUnifiedObservationsForClass(classId: string) {
  try {
    console.log(`[UnifiedObservations] Fetching observations for class: ${classId}`)
    const q = query(collection(db, "OBSERVACIONES_UNIFICADAS"), where("classId", "==", classId))
    const querySnapshot = await getDocs(q)
    const observations: any[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      observations.push({
        id: doc.id,
        ...data,
        // Normalizar campos para compatibilidad con el componente existente
        observacion: data.text,
        studentName: data.studentName || null,
        authorName: data.author,
        fecha: data.date,
        type: data.type || "general",
      })
    })

    // Ordenar manualmente por fecha de creación (más reciente primero)
    observations.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date)
      const dateB = new Date(b.createdAt || b.date)
      return dateB.getTime() - dateA.getTime()
    })

    console.log(
      `[UnifiedObservations] Found ${observations.length} observations for class ${classId}`
    )
    return observations
  } catch (error) {
    console.error("[UnifiedObservations] Error fetching observations:", error)
    throw error
  }
}

/**
 * Obtiene todas las observaciones de un maestro
 * @param teacherId - ID del maestro
 * @returns Array de observaciones del maestro
 */
export async function fetchUnifiedObservationsForTeacher(teacherId: string) {
  try {
    console.log(`[UnifiedObservations] Fetching observations for teacher: ${teacherId}`)

    const q = query(collection(db, "OBSERVACIONES_UNIFICADAS"), where("authorId", "==", teacherId))

    const querySnapshot = await getDocs(q)
    const observations: any[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      observations.push({
        id: doc.id,
        ...data,
        // Normalizar campos para compatibilidad con el componente existente
        observacion: data.text,
        studentName: data.studentName || null,
        authorName: data.author,
        fecha: data.date,
        type: data.type || "general",
      })
    })

    // Ordenar manualmente por fecha de creación (más reciente primero)
    observations.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date)
      const dateB = new Date(b.createdAt || b.date)
      return dateB.getTime() - dateA.getTime()
    })

    console.log(
      `[UnifiedObservations] Found ${observations.length} observations for teacher ${teacherId}`
    )
    return observations
  } catch (error) {
    console.error("[UnifiedObservations] Error fetching teacher observations:", error)
    throw error
  }
}
