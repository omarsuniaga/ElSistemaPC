// src/modulos/Montaje/store/montaje.ts

import {defineStore} from "pinia"
import {ref, computed} from "vue"
import {Timestamp} from "firebase/firestore"
import type {
  Obra,
  PlanAccion,
  FraseMontaje,
  EstadoCompassDetalle,
  ObservacionPedagogica,
  EvaluacionContinua,
  EvaluacionFinal,
  NotificacionMontaje,
  FiltrosMontaje,
  CambioEstadoCompass,
} from "../types"
import {EstadoCompass, DificultadFrase, TipoInstrumento} from "../types"
import {montajeService} from "../service/montajeService"
import {useAuthStore} from "@/stores/auth"

export const useMontajeStore = defineStore("montaje", () => {
  // ================== ESTADO ==================
  const obras = ref<Obra[]>([])
  const obraActual = ref<Obra | null>(null)
  const planAccion = ref<PlanAccion | null>(null)
  const frases = ref<FraseMontaje[]>([])
  const fraseActual = ref<FraseMontaje | null>(null)
  const estadosCompases = ref<Map<number, EstadoCompassDetalle>>(new Map())
  const observaciones = ref<ObservacionPedagogica[]>([])
  const evaluacionesContinuas = ref<EvaluacionContinua[]>([])
  const evaluacionesFinales = ref<EvaluacionFinal[]>([])
  const notificaciones = ref<NotificacionMontaje[]>([])

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filtros = ref<FiltrosMontaje>({})

  // ================== GETTERS ==================
  const obrasActivasPorRepertorio = computed(
    () => (repertorioId: string) => obras.value.filter((obra) => obra.repertorioId === repertorioId)
  )

  const frasesActuales = computed(() =>
    frases.value.filter((f) => f.planAccionId === planAccion.value?.id)
  )

  const frasesCompletadas = computed(() =>
    frasesActuales.value.filter((f) => f.metadatos.progresoPorcentaje === 100)
  )

  const frasesPendientes = computed(() =>
    frasesActuales.value.filter((f) => f.metadatos.progresoPorcentaje < 100)
  )

  const frasesConDificultad = computed(() =>
    frasesActuales.value.filter((f) =>
      Object.values(f.metadatos.estadosCompases).some(
        (estado) => estado === EstadoCompass.CON_DIFICULTAD
      )
    )
  )

  const progresoGeneral = computed(() => {
    if (frasesActuales.value.length === 0) return 0
    const total = frasesActuales.value.reduce((sum, f) => sum + f.metadatos.progresoPorcentaje, 0)
    return Math.round(total / frasesActuales.value.length)
  })

  const compassesProblematicos = computed(() => {
    const problematicos: number[] = []
    estadosCompases.value.forEach((detalle, compas) => {
      if (detalle.estado === EstadoCompass.CON_DIFICULTAD) {
        problematicos.push(compas)
      }
    })
    return problematicos.sort((a, b) => a - b)
  })

  const estadisticasEvaluacion = computed(() => {
    const continuas = evaluacionesContinuas.value
    const finales = evaluacionesFinales.value

    return {
      totalEvaluacionesContinuas: continuas.length,
      totalEvaluacionesFinales: finales.length,
      promedioGeneral:
        continuas.reduce((sum, e) => sum + e.metadatos.porcentajeCumplimiento, 0) /
          continuas.length || 0,
      estudiantesEvaluados: [...new Set(continuas.map((e) => e.estudianteId))].length,
      criteriosMejorados: continuas.filter((e) => e.metadatos.porcentajeCumplimiento > 75).length,
    }
  })

  const notificacionesSinLeer = computed(() =>
    notificaciones.value.filter((n) => !n.metadatos.leida)
  )

  // ================== ACCIONES DE OBRAS ==================

  /**
   * Cargar obras de un repertorio
   */
  const cargarObras = async (repertorioId: string) => {
    try {
      isLoading.value = true
      error.value = null

      const obrasData = await montajeService.obtenerObras(repertorioId)
      obras.value = obrasData

      console.log("✅ Obras cargadas:", obrasData.length)
    } catch (err) {
      console.error("❌ Error cargando obras:", err)
      error.value = "No se pudieron cargar las obras"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cargar una obra específica
   */ const cargarObra = async (obraId: string) => {
    try {
      isLoading.value = true
      error.value = null

      console.log("🔍 Buscando obra en múltiples colecciones...")

      // Primero intentar en la colección 'obras'
      let obra = await montajeService.obtenerObra(obraId)

      // Si no se encuentra, intentar en 'repertorios'
      if (!obra) {
        console.log('📚 Obra no encontrada en "obras", intentando en "repertorios"...')
        try {
          // doc y getDoc ya están importados arriba

          const docRef = doc(db, "repertorios", obraId)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            obra = {
              id: docSnap.id,
              ...docSnap.data(),
            } as any // Convertir de repertorio a obra
            console.log('✅ Obra encontrada en colección "repertorios"')
          }
        } catch (repoError) {
          console.log("⚠️ Error buscando en repertorios:", repoError)
        }
      }

      // Si aún no se encuentra, intentar en 'montaje-repertorios'
      if (!obra) {
        console.log('📖 Intentando en "montaje-repertorios"...')
        try {
          // doc y getDoc ya están importados arriba

          const docRef = doc(db, "montaje-repertorios", obraId)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            obra = {
              id: docSnap.id,
              ...docSnap.data(),
            } as any
            console.log('✅ Obra encontrada en colección "montaje-repertorios"')
          }
        } catch (montajeRepoError) {
          console.log("⚠️ Error buscando en montaje-repertorios:", montajeRepoError)
        }
      }

      if (obra) {
        obraActual.value = obra
        // También agregar a la lista si no está
        if (!obras.value.find((o) => o.id === obraId)) {
          obras.value.push(obra)
        }
        console.log("✅ Obra cargada:", obra?.titulo || obra?.title || obra?.nombre)
      } else {
        console.error("❌ Obra no encontrada en ninguna colección")
        error.value = "Obra no encontrada"
      }
    } catch (err) {
      console.error("❌ Error cargando obra:", err)
      error.value = "No se pudo cargar la obra"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Crear nueva obra
   */
  const crearObra = async (obraData: Omit<Obra, "id" | "fechaCreacion" | "auditoria">) => {
    try {
      isLoading.value = true
      error.value = null

      console.log("🔄 Creando obra con datos:", obraData)

      // Preparar datos completos con auditoría
      const authStore = useAuthStore()
      const datosCompletos: Omit<Obra, "id"> = {
        ...obraData,
        fechaCreacion: Timestamp.now(),
        auditoria: {
          creadoPor: authStore.user?.uid || "unknown",
          fechaCreacion: Timestamp.now(),
          version: 1,
          activo: true,
        }, // Asegurar metadatos básicos
        metadatos: {
          ...obraData.metadatos,
          complejidadGeneral: obraData.metadatos?.complejidadGeneral || DificultadFrase.MEDIO,
          totalCompases: obraData.metadatos?.totalCompases || 0,
          frasesDefinidas: obraData.metadatos?.frasesDefinidas || 0,
          frasesCompletadas: obraData.metadatos?.frasesCompletadas || 0,
          progresoPorcentaje: 0,
          horasEnsayoEstimadas: obraData.metadatos?.horasEnsayoEstimadas || 0,
          horasEnsayoReales: 0,
        },
      }

      const obraId = await montajeService.crearObra(datosCompletos)

      // Cargar la obra creada y agregarla al estado
      const obraCreada = await montajeService.obtenerObra(obraId)
      if (obraCreada) {
        obras.value.unshift(obraCreada)
        obraActual.value = obraCreada
      }

      console.log("✅ Obra creada con ID:", obraId)
      return obraId
    } catch (err) {
      console.error("❌ Error creando obra:", err)
      error.value = "No se pudo crear la obra"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Actualizar obra existente
   */
  const actualizarObra = async (obraId: string, datos: Partial<Obra>) => {
    try {
      isLoading.value = true
      error.value = null

      await montajeService.actualizarObra(obraId, datos)

      // Actualizar en el estado local
      const index = obras.value.findIndex((o) => o.id === obraId)
      if (index !== -1) {
        obras.value[index] = {...obras.value[index], ...datos}
      }

      if (obraActual.value?.id === obraId) {
        obraActual.value = {...obraActual.value, ...datos}
      }

      console.log("✅ Obra actualizada:", obraId)
    } catch (err) {
      console.error("❌ Error actualizando obra:", err)
      error.value = "No se pudo actualizar la obra"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Eliminar obra
   */
  const eliminarObra = async (obraId: string) => {
    try {
      isLoading.value = true
      error.value = null

      await montajeService.eliminarObra(obraId)

      // Remover del estado local
      obras.value = obras.value.filter((o) => o.id !== obraId)

      if (obraActual.value?.id === obraId) {
        obraActual.value = null
      }

      console.log("✅ Obra eliminada:", obraId)
    } catch (err) {
      console.error("❌ Error eliminando obra:", err)
      error.value = "No se pudo eliminar la obra"
      throw err
    } finally {
      isLoading.value = false
    }
  }
  // ================== ACCIONES DE PLANES ==================

  /**
   * Cargar plan de acción de una obra
   */
  const cargarPlanAccion = async (obraId: string) => {
    try {
      isLoading.value = true
      error.value = null

      console.log("🔍 Cargando plan de acción para obra:", obraId)
      const planData = await montajeService.obtenerPlanAccion(obraId)
      planAccion.value = planData

      console.log("✅ Plan de acción cargado para obra:", obraId)
    } catch (err) {
      console.error("❌ Error cargando plan de acción:", err)
      error.value = "No se pudo cargar el plan de acción"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Crear nuevo plan de acción
   */
  const crearPlanAccion = async (planData: Omit<PlanAccion, "id" | "auditoria">) => {
    try {
      isLoading.value = true
      error.value = null

      const authStore = useAuthStore()
      const datosCompletos: Omit<PlanAccion, "id"> = {
        ...planData,
        auditoria: {
          creadoPor: authStore.user?.uid || "unknown",
          fechaCreacion: Timestamp.now(),
          version: 1,
          activo: true,
        },
        metadatos: {
          ...planData.metadatos,
          progresoPorcentaje: 0,
          fasesCompletadas: 0,
          totalFases: planData.fases?.length || 0,
          horasEstimadas: planData.metadatos?.horasEstimadas || 0,
          horasReales: 0,
        },
      }

      console.log("🔄 Creando plan de acción con datos:", datosCompletos)
      const planId = await montajeService.crearPlanAccion(datosCompletos)

      // Cargar el plan creado
      const planCreado = await montajeService.obtenerPlanAccion(planData.obraId)
      if (planCreado) {
        planAccion.value = planCreado
      }

      console.log("✅ Plan de acción creado con ID:", planId)
      return planId
    } catch (err) {
      console.error("❌ Error creando plan de acción:", err)
      error.value = "No se pudo crear el plan de acción"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Actualizar plan de acción
   */
  const actualizarPlanAccion = async (planId: string, datos: Partial<PlanAccion>) => {
    try {
      isLoading.value = true
      error.value = null

      await montajeService.actualizarPlanAccion(planId, datos)

      // Actualizar en el estado local
      if (planAccion.value?.id === planId) {
        planAccion.value = {...planAccion.value, ...datos}
      }

      console.log("✅ Plan de acción actualizado:", planId)
    } catch (err) {
      console.error("❌ Error actualizando plan de acción:", err)
      error.value = "No se pudo actualizar el plan de acción"
      throw err
    } finally {
      isLoading.value = false
    }
  }
  // ================== ACCIONES DE FRASES ==================
  /**
   * Cargar frases de un plan
   */
  const cargarFrases = async (planAccionId: string) => {
    try {
      isLoading.value = true
      error.value = null

      console.log("🔍 Cargando frases para plan:", planAccionId)
      const frasesData = await montajeService.obtenerFrases(planAccionId)
      frases.value = frasesData

      console.log("✅ Frases cargadas:", frasesData.length)
    } catch (err) {
      console.error("❌ Error cargando frases:", err)
      error.value = "No se pudieron cargar las frases"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Crear nueva frase
   */
  const crearFrase = async (fraseData: Omit<FraseMontaje, "id" | "auditoria">) => {
    try {
      isLoading.value = true
      error.value = null

      const authStore = useAuthStore()
      const datosCompletos: Omit<FraseMontaje, "id"> = {
        ...fraseData,
        auditoria: {
          creadoPor: authStore.user?.uid || "unknown",
          fechaCreacion: Timestamp.now(),
          version: 1,
          activo: true,
        },
        metadatos: {
          ...fraseData.metadatos,
          totalCompases: fraseData.compasFinalizacion - fraseData.compasInicio + 1,
          estadosCompases: {},
          progresoPorcentaje: 0,
          horasEnsayoAcumuladas: 0,
          dificultadesIdentificadas: [],
          logrosAlcanzados: [],
        },
      }

      console.log("🔄 Creando frase con datos:", datosCompletos)
      const fraseId = await montajeService.crearFrase(datosCompletos)

      // Actualizar la lista de frases
      await cargarFrases(fraseData.planAccionId)

      console.log("✅ Frase creada con ID:", fraseId)
      return fraseId
    } catch (err) {
      console.error("❌ Error creando frase:", err)
      error.value = "No se pudo crear la frase"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Actualizar frase existente
   */
  const actualizarFrase = async (fraseId: string, datos: Partial<FraseMontaje>) => {
    try {
      isLoading.value = true
      error.value = null

      await montajeService.actualizarFrase(fraseId, datos)

      // Actualizar en el estado local
      const index = frases.value.findIndex((f) => f.id === fraseId)
      if (index !== -1) {
        frases.value[index] = {...frases.value[index], ...datos}
      }

      if (fraseActual.value?.id === fraseId) {
        fraseActual.value = {...fraseActual.value, ...datos}
      }

      console.log("✅ Frase actualizada:", fraseId)
    } catch (err) {
      console.error("❌ Error actualizando frase:", err)
      error.value = "No se pudo actualizar la frase"
      throw err
    } finally {
      isLoading.value = false
    }
  }
  // ================== ACCIONES DE EVALUACIONES ==================
  /**
   * Cargar evaluaciones continuas
   */
  const cargarEvaluacionesContinuas = async (obraId: string) => {
    try {
      isLoading.value = true
      error.value = null
      console.log("🔍 Cargando evaluaciones continuas para obra:", obraId)
      const evaluacionesData = (await montajeService.obtenerEvaluaciones(
        obraId,
        "continua"
      )) as EvaluacionContinua[]
      evaluacionesContinuas.value = evaluacionesData

      console.log("✅ Evaluaciones continuas cargadas:", evaluacionesData.length)
    } catch (err) {
      console.error("❌ Error cargando evaluaciones continuas:", err)
      error.value = "No se pudieron cargar las evaluaciones continuas"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cargar evaluaciones finales
   */
  const cargarEvaluacionesFinales = async (obraId: string) => {
    try {
      isLoading.value = true
      error.value = null

      console.log("🔍 Cargando evaluaciones finales para obra:", obraId)
      const evaluacionesData = (await montajeService.obtenerEvaluaciones(
        obraId,
        "final"
      )) as EvaluacionFinal[]
      evaluacionesFinales.value = evaluacionesData

      console.log("✅ Evaluaciones finales cargadas:", evaluacionesData.length)
    } catch (err) {
      console.error("❌ Error cargando evaluaciones finales:", err)
      error.value = "No se pudieron cargar las evaluaciones finales"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Crear evaluación continua
   */
  const crearEvaluacionContinua = async (
    evaluacionData: Omit<EvaluacionContinua, "id" | "auditoria">
  ) => {
    try {
      isLoading.value = true
      error.value = null

      const authStore = useAuthStore()
      const datosCompletos: Omit<EvaluacionContinua, "id"> = {
        ...evaluacionData,
        auditoria: {
          creadoPor: authStore.user?.uid || "unknown",
          fechaCreacion: Timestamp.now(),
          version: 1,
          activo: true,
        },
      }

      console.log("🔄 Creando evaluación continua con datos:", datosCompletos)
      const evaluacionId = await montajeService.crearEvaluacionContinua(datosCompletos)

      // Actualizar la lista de evaluaciones
      await cargarEvaluacionesContinuas(evaluacionData.obraId)

      console.log("✅ Evaluación continua creada con ID:", evaluacionId)
      return evaluacionId
    } catch (err) {
      console.error("❌ Error creando evaluación continua:", err)
      error.value = "No se pudo crear la evaluación continua"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Crear evaluación final
   */
  const crearEvaluacionFinal = async (
    evaluacionData: Omit<EvaluacionFinal, "id" | "auditoria">
  ) => {
    try {
      isLoading.value = true
      error.value = null

      const authStore = useAuthStore()
      const datosCompletos: Omit<EvaluacionFinal, "id"> = {
        ...evaluacionData,
        auditoria: {
          creadoPor: authStore.user?.uid || "unknown",
          fechaCreacion: Timestamp.now(),
          version: 1,
          activo: true,
        },
      }

      console.log("🔄 Creando evaluación final con datos:", datosCompletos)
      const evaluacionId = await montajeService.crearEvaluacionFinal(datosCompletos)

      // Actualizar la lista de evaluaciones
      await cargarEvaluacionesFinales(evaluacionData.obraId)

      console.log("✅ Evaluación final creada con ID:", evaluacionId)
      return evaluacionId
    } catch (err) {
      console.error("❌ Error creando evaluación final:", err)
      error.value = "No se pudo crear la evaluación final"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ================== ACCIONES DE NOTIFICACIONES ==================

  /**
   * Cargar notificaciones del usuario
   */
  const cargarNotificaciones = async () => {
    try {
      isLoading.value = true
      error.value = null

      const authStore = useAuthStore()
      if (!authStore.user?.uid) {
        console.warn("⚠️ Usuario no autenticado para cargar notificaciones")
        return
      }

      const notificacionesData = await montajeService.obtenerNotificaciones(authStore.user.uid)
      notificaciones.value = notificacionesData

      console.log("✅ Notificaciones cargadas:", notificacionesData.length)
    } catch (err) {
      console.error("❌ Error cargando notificaciones:", err)
      error.value = "No se pudieron cargar las notificaciones"
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Marcar notificación como leída
   */
  const marcarNotificacionLeida = async (notificacionId: string) => {
    try {
      await montajeService.marcarNotificacionLeida(notificacionId)

      // Actualizar en el estado local
      const notificacion = notificaciones.value.find((n) => n.id === notificacionId)
      if (notificacion) {
        notificacion.metadatos.leida = true
      }

      console.log("✅ Notificación marcada como leída:", notificacionId)
    } catch (err) {
      console.error("❌ Error marcando notificación como leída:", err)
      throw err
    }
  }

  // ================== ACCIONES DE CAMBIO DE ESTADO ==================
  /**
   * Cambiar estado de compás
   */
  const cambiarEstadoCompass = async (
    compassNumber: number,
    nuevoEstado: EstadoCompass,
    fraseId: string,
    razon: string = ""
  ) => {
    try {
      const authStore = useAuthStore()
      const estadoAnterior =
        estadosCompases.value.get(compassNumber)?.estado || EstadoCompass.SIN_TRABAJAR

      const cambio: CambioEstadoCompass = {
        id: `cambio-${Date.now()}`,
        obraId: obraActual.value?.id || "",
        fraseId,
        compas: compassNumber,
        instrumento: undefined,
        estadoAnterior,
        estadoNuevo: nuevoEstado,
        razon,
        maestroId: authStore.user?.uid || "unknown",
        fecha: Timestamp.now(),
      }

      console.log("🔄 Aplicando cambio de estado:", cambio)
      await montajeService.cambiarEstadoCompass(compassNumber, nuevoEstado, cambio) // Actualizar el estado local
      estadosCompases.value.set(compassNumber, {
        compas: compassNumber,
        estado: nuevoEstado,
        instrumentos: crearEstadoInstrumentos(nuevoEstado),
        observaciones: razon ? [razon] : [],
        fechaUltimaModificacion: Timestamp.now(),
        modificadoPor: authStore.user?.uid || "unknown",
        sesionesEnsayo: 1,
        dificultadesEspecificas: [],
      })

      console.log("✅ Estado de compás cambiado:", compassNumber, nuevoEstado)
    } catch (err) {
      console.error("❌ Error cambiando estado de compás:", err)
      throw err
    }
  }

  /**
   * Cargar estados de compases de una obra
   */
  const cargarEstadosCompases = async (obraId: string) => {
    try {
      isLoading.value = true
      error.value = null

      // Cargar estados desde el servicio
      const estados = await montajeService.obtenerEstadosCompases(obraId)
      estadosCompases.value = new Map(estados)

      console.log("✅ Estados de compases cargados:", estados.length)
    } catch (err) {
      console.error("❌ Error cargando estados de compases:", err)
      error.value = "No se pudieron cargar los estados de compases"
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ================== UTILIDADES ==================

  /**
   * Limpiar estado del store
   */
  const limpiarEstado = () => {
    obras.value = []
    obraActual.value = null
    planAccion.value = null
    frases.value = []
    fraseActual.value = null
    estadosCompases.value.clear()
    observaciones.value = []
    evaluacionesContinuas.value = []
    evaluacionesFinales.value = []
    notificaciones.value = []
    error.value = null
    isLoading.value = false
  }

  /**
   * Actualizar filtros
   */
  const actualizarFiltros = (nuevosFiltros: Partial<FiltrosMontaje>) => {
    filtros.value = {...filtros.value, ...nuevosFiltros}
  }

  // ================== UTILIDADES PRIVADAS ==================

  /**
   * Crear objeto de instrumentos con estado por defecto
   */
  const crearEstadoInstrumentos = (estadoDefecto: EstadoCompass = EstadoCompass.SIN_TRABAJAR) => {
    return Object.values(TipoInstrumento).reduce(
      (acc, instrumento) => {
        acc[instrumento] = estadoDefecto
        return acc
      },
      {} as Record<TipoInstrumento, EstadoCompass>
    )
  }

  return {
    // Estado
    obras,
    obraActual,
    planAccion,
    frases,
    fraseActual,
    estadosCompases,
    observaciones,
    evaluacionesContinuas,
    evaluacionesFinales,
    notificaciones,
    isLoading,
    error,
    filtros,

    // Getters computados
    obrasActivasPorRepertorio,
    frasesActuales,
    frasesCompletadas,
    frasesPendientes,
    frasesConDificultad,
    progresoGeneral,
    compassesProblematicos,
    estadisticasEvaluacion,
    notificacionesSinLeer,

    // Acciones principales
    cargarObras,
    cargarObra,
    crearObra,
    actualizarObra,
    eliminarObra,

    // Acciones de planes
    cargarPlanAccion,
    crearPlanAccion,
    actualizarPlanAccion,
    // Acciones de frases
    cargarFrases,
    crearFrase,
    actualizarFrase,

    // Acciones de evaluaciones
    cargarEvaluacionesContinuas,
    cargarEvaluacionesFinales,
    crearEvaluacionContinua,
    crearEvaluacionFinal,

    // Acciones de notificaciones
    cargarNotificaciones,
    marcarNotificacionLeida,
    // Acciones de estados
    cambiarEstadoCompass,
    cargarEstadosCompases,

    // Utilidades
    limpiarEstado,
    actualizarFiltros,

    // Utilidades privadas
    crearEstadoInstrumentos,
  }
})
