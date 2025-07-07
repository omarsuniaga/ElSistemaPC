// src/modulos/Montaje/service/montajeService.ts

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
  limit as limitToFirst,
  Timestamp,
} from "firebase/firestore"
import {db} from "../../../firebase/config"
import {TipoInstrumento, EstadoCompass} from "../types"
import type {
  Obra,
  PlanAccion,
  FraseMontaje,
  EstadoCompassDetalle,
  EvaluacionContinua,
  EvaluacionFinal,
  NotificacionMontaje,
  FiltrosMontaje,
  CambioEstadoCompass,
} from "../types"

/**
 * Servicio profesional para gestión de montajes en Firebase
 */
class MontajeService {
  private readonly obrasCollection = "obras"
  private readonly planesAccionCollection = "planes_accion"
  private readonly frasesCollection = "frases_montaje"
  private readonly evaluacionesCollection = "evaluaciones_continuas"
  private readonly evaluacionesFinalesCollection = "evaluaciones_finales"
  private readonly notificacionesCollection = "notificaciones_montaje"

  private cache = new Map<string, {data: any; expiry: number}>()
  private readonly cacheExpiry = 5 * 60 * 1000 // 5 minutos

  /**
   * Crear objeto de instrumentos con estado por defecto
   */
  private crearEstadoInstrumentos = (
    estadoDefecto: EstadoCompass = EstadoCompass.SIN_TRABAJAR
  ): Record<TipoInstrumento, EstadoCompass> => {
    return Object.values(TipoInstrumento).reduce(
      (acc, instrumento) => {
        acc[instrumento] = estadoDefecto
        return acc
      },
      {} as Record<TipoInstrumento, EstadoCompass>
    )
  }

  // ================== GESTIÓN DE OBRAS ==================
  /**
   * Obtener todas las obras de un repertorio
   */
  async obtenerObras(repertorioId: string): Promise<Obra[]> {
    try {
      const cacheKey = `obras_${repertorioId}`
      const cached = this.cache.get(cacheKey)

      if (cached && Date.now() < cached.expiry) {
        console.log("📦 Cache hit para obras:", repertorioId)
        return cached.data
      }
      console.log("🔍 Consultando obras desde Firestore:", repertorioId)

      // Consulta más simple posible para evitar problemas de índices
      const q = query(collection(db, this.obrasCollection))

      const snapshot = await getDocs(q)
      let obras = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Obra[]

      console.log("📊 Total de obras obtenidas desde Firestore:", obras.length)

      // Filtrar localmente por estado activo y repertorio
      obras = obras.filter((obra) => {
        const isActive = obra.auditoria?.activo !== false // por defecto activo si no está definido
        const matchesRepertorio =
          !repertorioId ||
          repertorioId === "default-repertorio" ||
          obra.repertorioId === repertorioId
        return isActive && matchesRepertorio
      })

      console.log("📊 Obras después del filtrado local:", obras.length)

      // Ordenar por fecha de creación (más recientes primero)
      obras.sort((a, b) => {
        const dateA = a.fechaCreacion?.toDate() || new Date(0)
        const dateB = b.fechaCreacion?.toDate() || new Date(0)
        return dateB.getTime() - dateA.getTime()
      })

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: obras,
        expiry: Date.now() + this.cacheExpiry,
      })
      console.log("✅ Obras obtenidas:", obras.length)
      return obras
    } catch (error) {
      console.error("❌ Error obteniendo obras:", error)
      // En lugar de lanzar error, devolver array vacío para no romper la app
      console.warn("⚠️ Devolviendo array vacío de obras debido al error")
      const cacheKey = `obras_${repertorioId}`
      this.cache.set(cacheKey, {
        data: [],
        expiry: Date.now() + this.cacheExpiry,
      })
      return []
    }
  }

  /**
   * Obtener una obra específica
   */
  async obtenerObra(id: string): Promise<Obra | null> {
    try {
      const cacheKey = `obra_${id}`
      const cached = this.cache.get(cacheKey)

      if (cached && Date.now() < cached.expiry) {
        return cached.data
      }

      const docRef = doc(db, this.obrasCollection, id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return null
      }

      const obra = {
        id: docSnap.id,
        ...docSnap.data(),
      } as Obra

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: obra,
        expiry: Date.now() + this.cacheExpiry,
      })

      return obra
    } catch (error) {
      console.error("Error obteniendo obra:", error)
      throw new Error("No se pudo obtener la obra")
    }
  }

  /**
   * Crear nueva obra
   */
  async crearObra(datos: Omit<Obra, "id">): Promise<string> {
    try {
      console.log("🔄 Creando obra:", datos.titulo)

      const docRef = await addDoc(collection(db, this.obrasCollection), datos)

      // Limpiar caché relacionado
      this.invalidarCacheObras(datos.repertorioId)

      console.log("✅ Obra creada con ID:", docRef.id)
      return docRef.id
    } catch (error) {
      console.error("Error creando obra:", error)
      throw new Error("No se pudo crear la obra")
    }
  }

  /**
   * Actualizar obra existente
   */
  async actualizarObra(id: string, datos: Partial<Obra>): Promise<void> {
    try {
      const docRef = doc(db, this.obrasCollection, id)
      await updateDoc(docRef, {
        ...datos,
        "auditoria.fechaModificacion": Timestamp.now(),
      })

      // Limpiar caché
      this.cache.delete(`obra_${id}`)

      // Si cambió el repertorio, limpiar ambos cachés
      if (datos.repertorioId) {
        this.invalidarCacheObras(datos.repertorioId)
      }

      console.log("✅ Obra actualizada:", id)
    } catch (error) {
      console.error("Error actualizando obra:", error)
      throw new Error("No se pudo actualizar la obra")
    }
  }

  /**
   * Eliminar obra (lógicamente)
   */
  async eliminarObra(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.obrasCollection, id)
      await updateDoc(docRef, {
        "auditoria.activo": false,
        "auditoria.fechaModificacion": Timestamp.now(),
      })

      // Limpiar caché
      this.cache.delete(`obra_${id}`)

      console.log("✅ Obra eliminada:", id)
    } catch (error) {
      console.error("Error eliminando obra:", error)
      throw new Error("No se pudo eliminar la obra")
    }
  }

  // ================== GESTIÓN DE NOTIFICACIONES ==================

  /**
   * Crear notificación
   */
  async crearNotificacion(datos: Omit<NotificacionMontaje, "id">): Promise<string> {
    try {
      const notificacionCompleta = {
        ...datos,
        fecha: Timestamp.now(),
        metadatos: {
          ...datos.metadatos,
          leida: false,
        },
      }

      const docRef = await addDoc(
        collection(db, this.notificacionesCollection),
        notificacionCompleta
      )
      return docRef.id
    } catch (error) {
      console.error("Error creando notificación:", error)
      throw new Error("No se pudo crear la notificación")
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async obtenerNotificaciones(
    destinatarioId: string,
    limit: number = 20
  ): Promise<NotificacionMontaje[]> {
    try {
      const q = query(
        collection(db, this.notificacionesCollection),
        where("destinatarioId", "==", destinatarioId),
        orderBy("fecha", "desc"),
        limitToFirst(limit)
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificacionMontaje[]
    } catch (error) {
      console.error("Error obteniendo notificaciones:", error)
      return []
    }
  }

  /**
   * Marcar notificación como leída
   */
  async marcarNotificacionLeida(notificacionId: string): Promise<void> {
    try {
      const docRef = doc(db, this.notificacionesCollection, notificacionId)
      await updateDoc(docRef, {
        "metadatos.leida": true,
        "metadatos.fechaLectura": Timestamp.now(),
      })
    } catch (error) {
      console.error("Error marcando notificación como leída:", error)
      throw new Error("No se pudo marcar la notificación como leída")
    }
  }

  // ================== GESTIÓN DE EVALUACIONES ==================

  /**
   * Crear evaluación continua
   */
  async crearEvaluacionContinua(datos: Omit<EvaluacionContinua, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.evaluacionesCollection), datos)
      return docRef.id
    } catch (error) {
      console.error("Error creando evaluación continua:", error)
      throw new Error("No se pudo crear la evaluación continua")
    }
  }

  /**
   * Crear evaluación final
   */
  async crearEvaluacionFinal(datos: Omit<EvaluacionFinal, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.evaluacionesFinalesCollection), datos)
      return docRef.id
    } catch (error) {
      console.error("Error creando evaluación final:", error)
      throw new Error("No se pudo crear la evaluación final")
    }
  }

  /**
   * Obtener evaluaciones de una obra
   */
  async obtenerEvaluaciones(
    obraId: string,
    tipo: "continua" | "final" = "continua"
  ): Promise<EvaluacionContinua[] | EvaluacionFinal[]> {
    try {
      const collectionName =
        tipo === "continua" ? this.evaluacionesCollection : this.evaluacionesFinalesCollection

      const q = query(
        collection(db, collectionName),
        where("obraId", "==", obraId),
        orderBy("fecha", "desc")
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any
    } catch (error) {
      console.error("Error obteniendo evaluaciones:", error)
      throw new Error("No se pudieron obtener las evaluaciones")
    }
  }

  // ================== BÚSQUEDA Y FILTROS ==================

  /**
   * Buscar obras con filtros avanzados
   */
  async buscarObras(filtros: FiltrosMontaje): Promise<Obra[]> {
    try {
      let q = query(collection(db, this.obrasCollection))

      // Aplicar filtros básicos
      if (filtros.repertorioId) {
        q = query(q, where("repertorioId", "==", filtros.repertorioId))
      }

      if (filtros.estado) {
        q = query(q, where("estado", "==", filtros.estado))
      }

      if (filtros.dificultad) {
        q = query(q, where("metadatos.complejidadGeneral", "==", filtros.dificultad))
      }

      // Solo obras activas
      q = query(q, where("auditoria.activo", "==", true))
      const snapshot = await getDocs(q)
      let obras = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Obra[]

      // Aplicar filtros adicionales en memoria
      if (filtros.estado) {
        obras = obras.filter((obra) => obra.estado === filtros.estado)
      }

      if (filtros.dificultad) {
        obras = obras.filter((obra) => obra.metadatos?.complejidadGeneral === filtros.dificultad)
      }

      if (filtros.instrumento) {
        obras = obras.filter((obra) =>
          obra.instrumentosRequeridos?.some((instr) => instr.instrumentoId === filtros.instrumento)
        )
      }

      // Los tags no están en la interfaz Obra actual, comentamos este filtro
      // if (filtros.tags && filtros.tags.length > 0) {
      //   obras = obras.filter(obra =>
      //     filtros.tags!.some(tag => obra.tags?.includes(tag))
      //   );
      // }

      return obras
    } catch (error) {
      console.error("Error buscando obras:", error)
      throw new Error("No se pudieron buscar las obras")
    }
  }

  // ================== ESTADÍSTICAS Y REPORTES ==================

  /**
   * Obtener estadísticas de una obra
   */
  async obtenerEstadisticasObra(obraId: string): Promise<any> {
    try {
      // Obtener datos de la obra
      const obra = await this.obtenerObra(obraId)
      if (!obra) {
        throw new Error("Obra no encontrada")
      }

      // Obtener evaluaciones
      const evaluacionesContinuas = (await this.obtenerEvaluaciones(
        obraId,
        "continua"
      )) as EvaluacionContinua[]
      const evaluacionesFinales = (await this.obtenerEvaluaciones(
        obraId,
        "final"
      )) as EvaluacionFinal[]

      // Calcular estadísticas
      const totalEvaluaciones = evaluacionesContinuas.length + evaluacionesFinales.length
      const promedioEvaluacionesContinuas =
        evaluacionesContinuas.reduce(
          (sum, e) => sum + (e.metadatos?.porcentajeCumplimiento || 0),
          0
        ) / (evaluacionesContinuas.length || 1)

      return {
        obra: {
          titulo: obra.titulo,
          progreso: obra.metadatos?.progresoPorcentaje || 0,
          estado: obra.estado,
        },
        evaluaciones: {
          total: totalEvaluaciones,
          continuas: evaluacionesContinuas.length,
          finales: evaluacionesFinales.length,
          promedioContinuas: Math.round(promedioEvaluacionesContinuas),
        },
      }
    } catch (error) {
      console.error("Error calculando estadísticas:", error)
      throw new Error("No se pudieron calcular las estadísticas")
    }
  }

  // ================== UTILIDADES PRIVADAS ==================

  /**
   * Invalidar caché de obras de un repertorio
   */
  private invalidarCacheObras(repertorioId: string): void {
    const cacheKey = `obras_${repertorioId}`
    this.cache.delete(cacheKey)
  }
  /**
   * Obtener estado del caché
   */
  obtenerEstadoCache(): {tamaño: number; entradas: string[]} {
    return {
      tamaño: this.cache.size,
      entradas: Array.from(this.cache.keys()),
    }
  }

  // ================== GESTIÓN DE PLANES DE ACCIÓN ==================
  /**
   * Obtener plan de acción de una obra
   */
  async obtenerPlanAccion(obraId: string): Promise<PlanAccion | null> {
    try {
      const cacheKey = `plan_${obraId}`
      const cached = this.cache.get(cacheKey)

      if (cached && Date.now() < cached.expiry) {
        return cached.data
      }

      const q = query(
        collection(db, this.planesAccionCollection),
        where("obraId", "==", obraId),
        where("auditoria.activo", "==", true),
        orderBy("auditoria.fechaCreacion", "desc"),
        limitToFirst(1)
      )

      const snapshot = await getDocs(q)
      const plan = snapshot.empty
        ? null
        : ({id: snapshot.docs[0].id, ...snapshot.docs[0].data()} as PlanAccion)

      this.cache.set(cacheKey, {data: plan, expiry: Date.now() + this.cacheExpiry})
      return plan
    } catch (error) {
      console.error("Error obteniendo plan de acción:", error)
      throw error
    }
  }

  /**
   * Crear plan de acción
   */
  async crearPlanAccion(datos: Omit<PlanAccion, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.planesAccionCollection), datos)
      this.invalidarCachePlanes(datos.obraId)
      return docRef.id
    } catch (error) {
      console.error("Error creando plan de acción:", error)
      throw error
    }
  }

  /**
   * Actualizar plan de acción
   */
  async actualizarPlanAccion(id: string, datos: Partial<PlanAccion>): Promise<void> {
    try {
      const docRef = doc(db, this.planesAccionCollection, id)
      await updateDoc(docRef, datos)

      // Invalidar caché relacionado
      if (datos.obraId) {
        this.invalidarCachePlanes(datos.obraId)
      }
    } catch (error) {
      console.error("Error actualizando plan de acción:", error)
      throw error
    }
  }

  // ================== GESTIÓN DE FRASES ==================
  /**
   * Obtener frases de un plan de acción
   */
  async obtenerFrases(planAccionId: string): Promise<FraseMontaje[]> {
    try {
      const cacheKey = `frases_${planAccionId}`
      const cached = this.cache.get(cacheKey)

      if (cached && Date.now() < cached.expiry) {
        return cached.data
      }

      const q = query(
        collection(db, this.frasesCollection),
        where("planAccionId", "==", planAccionId),
        where("auditoria.activo", "==", true),
        orderBy("orden", "asc")
      )

      const snapshot = await getDocs(q)
      const frases = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}) as FraseMontaje)

      this.cache.set(cacheKey, {data: frases, expiry: Date.now() + this.cacheExpiry})
      return frases
    } catch (error) {
      console.error("Error obteniendo frases:", error)
      throw error
    }
  }

  /**
   * Crear frase
   */
  async crearFrase(datos: Omit<FraseMontaje, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.frasesCollection), datos)
      this.invalidarCacheFrases(datos.planAccionId)
      return docRef.id
    } catch (error) {
      console.error("Error creando frase:", error)
      throw error
    }
  }

  /**
   * Actualizar frase existente
   */
  async actualizarFrase(id: string, datos: Partial<FraseMontaje>): Promise<void> {
    try {
      const docRef = doc(db, this.frasesCollection, id)
      await updateDoc(docRef, {
        ...datos,
        "auditoria.fechaModificacion": Timestamp.now(),
      })

      // Invalidar caché relacionado
      if (datos.planAccionId) {
        this.invalidarCacheFrases(datos.planAccionId)
      }

      console.log("✅ Frase actualizada:", id)
    } catch (error) {
      console.error("Error actualizando frase:", error)
      throw new Error("No se pudo actualizar la frase")
    }
  }

  /**
   * Obtener estados de compases de una obra
   */
  async obtenerEstadosCompases(obraId: string): Promise<Array<[number, EstadoCompassDetalle]>> {
    try {
      const cacheKey = `estados_compases_${obraId}`
      const cached = this.cache.get(cacheKey)

      if (cached && Date.now() < cached.expiry) {
        return cached.data
      }

      const q = query(collection(db, "estados_compases"), where("obraId", "==", obraId))

      const snapshot = await getDocs(q)
      const estados: Array<[number, EstadoCompassDetalle]> = []
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        estados.push([
          data.compas,
          {
            compas: data.compas,
            estado: data.estado,
            instrumentos: data.instrumentos || this.crearEstadoInstrumentos(),
            observaciones: data.observaciones || [],
            fechaUltimaModificacion: data.fechaUltimaModificacion || Timestamp.now(),
            modificadoPor: data.modificadoPor || "",
            sesionesEnsayo: data.sesionesEnsayo || 0,
            dificultadesEspecificas: data.dificultadesEspecificas || [],
          },
        ])
      })

      this.cache.set(cacheKey, {data: estados, expiry: Date.now() + this.cacheExpiry})
      return estados
    } catch (error) {
      console.error("Error obteniendo estados de compases:", error)
      return []
    }
  }

  // ================== GESTIÓN DE COMPASES ==================
  /**
   * Cambiar estado de un compás
   */
  async cambiarEstadoCompass(
    compassNumber: number,
    nuevoEstado: any,
    cambio: CambioEstadoCompass
  ): Promise<void> {
    try {
      // Aquí implementarías la lógica para cambiar el estado del compás
      // Por ahora, solo simularemos la operación
      const docRef = doc(db, "estados_compases", `${cambio.obraId}_${compassNumber}`)
      await updateDoc(docRef, {
        estado: nuevoEstado,
        fechaModificacion: Timestamp.now(),
        modificadoPor: cambio.maestroId,
      })

      console.log("Estado del compás actualizado:", cambio)
    } catch (error) {
      console.error("Error cambiando estado del compás:", error)
      throw error
    }
  }

  // ================== MÉTODOS PRIVADOS DE CACHÉ ==================
  /**
   * Invalidar caché de planes de una obra
   */
  private invalidarCachePlanes(obraId: string): void {
    const cacheKey = `plan_${obraId}`
    this.cache.delete(cacheKey)
  }

  /**
   * Invalidar caché de frases de un plan
   */
  private invalidarCacheFrases(planAccionId: string): void {
    const cacheKey = `frases_${planAccionId}`
    this.cache.delete(cacheKey)
  }
}

export const montajeService = new MontajeService()
