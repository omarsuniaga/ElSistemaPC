import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  updateDoc,
  addDoc,
} from "firebase/firestore"
import {db} from "@/firebase"

// Tipos
export interface Compas {
  numero: number
  estado: "sin_trabajar" | "leido" | "con_dificultad" | "logrado"
  observacion?: string
  ultimaActualizacion?: Date
  seccion?: string
  autoId?: string
  maestroId?: string
  alumnosObservados?: {
    alumnoId: string
    comentario: string
  }[]
}

export interface HistorialCompas {
  compas: number
  estadoAnterior: string
  estadoNuevo: string
  fecha: Date
  autorId: string
  autorNombre?: string
  obraId: string
  id?: string
}

export class CompasService {
  private db: Firestore

  constructor() {
    this.db = db
  }

  /**
   * Obtiene todos los compases de una obra
   */
  async obtenerCompases(obraId: string): Promise<Compas[]> {
    try {
      const compasesRef = collection(this.db, `OBRAS/${obraId}/compasesTrabajados`)
      const snapshot = await getDocs(compasesRef)

      const compases: Compas[] = []
      snapshot.forEach((doc) => {
        compases.push({
          ...(doc.data() as Compas),
          autoId: doc.id,
        })
      })

      return compases.sort((a, b) => a.numero - b.numero)
    } catch (error) {
      console.error("Error al obtener compases:", error)
      throw error
    }
  }

  /**
   * Guarda o actualiza un compás
   */
  async guardarCompas(obraId: string, compas: Compas): Promise<string> {
    try {
      // Si el compás ya tiene ID lo actualizamos, si no, creamos uno nuevo
      if (compas.autoId) {
        const compasRef = doc(this.db, `OBRAS/${obraId}/compasesTrabajados`, compas.autoId)
        await updateDoc(compasRef, {...compas})
        return compas.autoId
      } else {
        const compasesRef = collection(this.db, `OBRAS/${obraId}/compasesTrabajados`)
        const docRef = await addDoc(compasesRef, {...compas})
        return docRef.id
      }
    } catch (error) {
      console.error("Error al guardar compás:", error)
      throw error
    }
  }

  /**
   * Guarda un registro en el historial de cambios
   */
  async guardarHistorial(historial: HistorialCompas): Promise<string> {
    try {
      const historialRef = collection(this.db, `OBRAS/${historial.obraId}/historialCambios`)
      const docRef = await addDoc(historialRef, {
        ...historial,
        fecha: new Date(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error al guardar historial:", error)
      throw error
    }
  }

  /**
   * Obtiene el historial de cambios de una obra
   */
  async obtenerHistorial(obraId: string): Promise<HistorialCompas[]> {
    try {
      const historialRef = collection(this.db, `OBRAS/${obraId}/historialCambios`)
      const q = query(historialRef, orderBy("fecha", "desc"))
      const snapshot = await getDocs(q)

      const historial: HistorialCompas[] = []
      snapshot.forEach((doc) => {
        historial.push({
          ...(doc.data() as HistorialCompas),
          id: doc.id,
        })
      })

      return historial
    } catch (error) {
      console.error("Error al obtener historial:", error)
      throw error
    }
  }

  /**
   * Obtiene las observaciones de una obra
   */
  async obtenerObservaciones(obraId: string): Promise<any[]> {
    try {
      const obsRef = collection(this.db, `OBRAS/${obraId}/observaciones`)
      const snapshot = await getDocs(obsRef)

      const observaciones: any[] = []
      snapshot.forEach((doc) => {
        observaciones.push({
          ...doc.data(),
          id: doc.id,
        })
      })

      return observaciones
    } catch (error) {
      console.error("Error al obtener observaciones:", error)
      throw error
    }
  }

  /**
   * Agrega una observación general a la obra
   */
  async agregarObservacion(obraId: string, observacion: any): Promise<string> {
    try {
      const obsRef = collection(this.db, `OBRAS/${obraId}/observaciones`)
      const docRef = await addDoc(obsRef, {
        ...observacion,
        fecha: new Date(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error al agregar observación:", error)
      throw error
    }
  }

  /**
   * Actualiza el progreso global de una obra
   */
  async actualizarProgresoObra(obraId: string, progreso: number): Promise<void> {
    try {
      const obraRef = doc(this.db, "OBRAS", obraId)
      await updateDoc(obraRef, {
        "estadoGlobal.progreso": progreso,
        "estadoGlobal.ultimaActualizacion": new Date(),
      })
    } catch (error) {
      console.error("Error al actualizar progreso:", error)
      throw error
    }
  }
}
