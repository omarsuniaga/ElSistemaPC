// src/modulos/Montaje/service/repertorioService.ts

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from "firebase/firestore"
import {db} from "../../../firebase/config"
import type {Repertorio, MetricasProgreso} from "../types"

/**
 * Servicio para gestión de repertorios en Firebase
 */
class RepertorioService {
  private collectionName = "montaje-repertorios"

  /**
   * Obtener todos los repertorios activos
   */
  async obtenerTodos(): Promise<Repertorio[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("auditoria.activo", "==", true),
        orderBy("fechaCreacion", "desc")
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Repertorio
      )
    } catch (error) {
      console.error("Error obteniendo repertorios:", error)
      throw new Error("No se pudieron cargar los repertorios")
    }
  }

  /**
   * Obtener repertorio por ID
   */
  async obtenerPorId(id: string): Promise<Repertorio | null> {
    try {
      const docRef = doc(db, this.collectionName, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Repertorio
      }

      return null
    } catch (error) {
      console.error("Error obteniendo repertorio:", error)
      throw new Error("No se pudo cargar el repertorio")
    }
  }

  /**
   * Crear nuevo repertorio
   */
  async crear(datos: Omit<Repertorio, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...datos,
        fechaCreacion: datos.fechaCreacion || Timestamp.now(),
      })

      return docRef.id
    } catch (error) {
      console.error("Error creando repertorio:", error)
      throw new Error("No se pudo crear el repertorio")
    }
  }

  /**
   * Actualizar repertorio existente
   */
  async actualizar(id: string, datos: Partial<Repertorio>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id)
      await updateDoc(docRef, {
        ...datos,
        "auditoria.fechaModificacion": Timestamp.now(),
      })
    } catch (error) {
      console.error("Error actualizando repertorio:", error)
      throw new Error("No se pudo actualizar el repertorio")
    }
  }

  /**
   * Buscar repertorios por término
   */
  async buscar(termino: string): Promise<Repertorio[]> {
    try {
      // Firebase no tiene búsqueda de texto completo nativa
      // Implementamos búsqueda básica por nombre
      const q = query(
        collection(db, this.collectionName),
        where("auditoria.activo", "==", true),
        orderBy("nombre")
      )

      const snapshot = await getDocs(q)
      const repertorios = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Repertorio
      )

      // Filtrar localmente por el término de búsqueda
      return repertorios.filter(
        (repertorio) =>
          repertorio.nombre.toLowerCase().includes(termino.toLowerCase()) ||
          (repertorio.descripcion &&
            repertorio.descripcion.toLowerCase().includes(termino.toLowerCase()))
      )
    } catch (error) {
      console.error("Error buscando repertorios:", error)
      throw new Error("Error en la búsqueda")
    }
  }

  /**
   * Obtener repertorios por director
   */
  async obtenerPorDirector(directorId: string): Promise<Repertorio[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("directorId", "==", directorId),
        where("auditoria.activo", "==", true),
        orderBy("fechaCreacion", "desc")
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Repertorio
      )
    } catch (error) {
      console.error("Error obteniendo repertorios por director:", error)
      throw new Error("No se pudieron cargar los repertorios del director")
    }
  }

  /**
   * Obtener métricas de progreso de un repertorio
   */
  async obtenerMetricas(repertorioId: string): Promise<MetricasProgreso | null> {
    try {
      // Las métricas se pueden calcular en tiempo real o almacenar pre-calculadas
      const docRef = doc(db, `${this.collectionName}/${repertorioId}/metricas`, "actual")
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return docSnap.data() as MetricasProgreso
      }

      // Si no existen métricas, calcularlas
      return await this.calcularMetricas(repertorioId)
    } catch (error) {
      console.error("Error obteniendo métricas:", error)
      return null
    }
  }

  /**
   * Calcular métricas de progreso
   */
  private async calcularMetricas(repertorioId: string): Promise<MetricasProgreso> {
    try {
      // Obtener todas las obras del repertorio
      const obrasQuery = query(
        collection(db, "montaje-obras"),
        where("repertorioId", "==", repertorioId),
        where("auditoria.activo", "==", true)
      )

      const obrasSnapshot = await getDocs(obrasQuery)
      const obras = obrasSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}))

      // Calcular estadísticas básicas
      const totalObras = obras.length
      const frasesTotales = obras.reduce(
        (sum: number, obra: any) => sum + (obra.metadatos?.frasesDefinidas || 0),
        0
      )
      const frasesCompletadas = obras.reduce(
        (sum: number, obra: any) => sum + (obra.metadatos?.frasesCompletadas || 0),
        0
      )
      const compassTotales = obras.reduce(
        (sum: number, obra: any) => sum + (obra.totalCompases || 0),
        0
      )

      // Calcular progreso general
      const porcentajeGeneral =
        frasesTotales > 0 ? Math.round((frasesCompletadas / frasesTotales) * 100) : 0

      const metricas: MetricasProgreso = {
        repertorioId,
        fechaCalculada: Timestamp.now(),
        progreso: {
          frasesCompletadas,
          frasesTotales,
          porcentajeGeneral,
          compassTrabajados: 0, // Se calcularía consultando estados de compases
          compassTotales,
        },
        rendimiento: {
          tiempoPromedioporCompass: 0, // Se calcularía con datos de tiempo de trabajo
          frasesConDificultades: 0, // Se calcularía consultando estados problemáticos
          evaluacionesRealizadas: 0, // Se calcularía consultando evaluaciones
          participacionMaestros: 0, // Se calcularía consultando participantes activos
        },
        calidad: {
          promedioEvaluacionesContinuas: 0, // Se calcularía con evaluaciones
          porcentajeCumplimientoCriterios: 0, // Se calcularía con criterios de evaluación
          observacionesPendientes: 0, // Se calcularía consultando observaciones sin resolver
          notificacionesSinLeer: 0, // Se calcularía consultando notificaciones
        },
      }

      // Guardar métricas calculadas para futura consulta
      await this.guardarMetricas(repertorioId, metricas)

      return metricas
    } catch (error) {
      console.error("Error calculando métricas:", error)
      throw new Error("No se pudieron calcular las métricas")
    }
  }

  /**
   * Guardar métricas calculadas
   */
  private async guardarMetricas(repertorioId: string, metricas: MetricasProgreso): Promise<void> {
    try {
      const docRef = doc(db, `${this.collectionName}/${repertorioId}/metricas`, "actual")
      await updateDoc(docRef, metricas).catch(async () => {
        // Si el documento no existe, crearlo
        await addDoc(collection(db, `${this.collectionName}/${repertorioId}/metricas`), metricas)
      })
    } catch (error) {
      console.error("Error guardando métricas:", error)
    }
  }

  /**
   * Actualizar métricas de un repertorio
   */
  async actualizarMetricas(repertorioId: string): Promise<void> {
    try {
      const metricas = await this.calcularMetricas(repertorioId)

      // También actualizar el campo de metadatos en el repertorio principal
      await this.actualizar(repertorioId, {
        metadatos: {
          totalObras:
            metricas.progreso.frasesTotales > 0
              ? Math.ceil(metricas.progreso.frasesTotales / 10)
              : 0, // Estimación
          totalCompases: metricas.progreso.compassTotales,
          horasEstimadas: Math.ceil(metricas.progreso.compassTotales / 20), // Estimación: 20 compases por hora
          progresoPorcentaje: metricas.progreso.porcentajeGeneral,
        },
      })
    } catch (error) {
      console.error("Error actualizando métricas:", error)
    }
  }

  /**
   * Eliminar repertorio (soft delete)
   */
  async eliminar(id: string): Promise<void> {
    try {
      await this.actualizar(id, {
        auditoria: {
          activo: false,
          fechaModificacion: Timestamp.now(),
        } as any,
      })
    } catch (error) {
      console.error("Error eliminando repertorio:", error)
      throw new Error("No se pudo eliminar el repertorio")
    }
  }

  /**
   * Operaciones en lote para múltiples repertorios
   */
  async operacionEnLote(
    operaciones: Array<{
      tipo: "crear" | "actualizar" | "eliminar"
      id?: string
      datos: any
    }>
  ): Promise<void> {
    try {
      const batch = writeBatch(db)

      operaciones.forEach((operacion) => {
        switch (operacion.tipo) {
          case "crear":
            const nuevoDocRef = doc(collection(db, this.collectionName))
            batch.set(nuevoDocRef, operacion.datos)
            break

          case "actualizar":
            if (operacion.id) {
              const docRef = doc(db, this.collectionName, operacion.id)
              batch.update(docRef, operacion.datos)
            }
            break

          case "eliminar":
            if (operacion.id) {
              const docRef = doc(db, this.collectionName, operacion.id)
              batch.update(docRef, {"auditoria.activo": false})
            }
            break
        }
      })

      await batch.commit()
    } catch (error) {
      console.error("Error en operación en lote:", error)
      throw new Error("No se pudo completar la operación en lote")
    }
  }
}

export const repertorioService = new RepertorioService()
