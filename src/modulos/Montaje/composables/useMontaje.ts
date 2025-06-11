// src/modulos/Montaje/composables/useMontaje.ts

import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useMontajeStore } from '../store/montaje'
import type {
  Obra,
  PlanAccion as Plan,
  EvaluacionContinua as Evaluacion
} from '../types'
import { DificultadFrase } from '../types'
import { CompasService, Compas, HistorialCompas } from '../service/compasService'

// Additional types for English interface compatibility
type Work = Obra
type CreateEvaluationInput = Omit<Evaluacion, 'id' | 'auditoria'>

/**
 * Composable para gestión completa del módulo Montaje
 * Proporciona funcionalidades de obras, planes, frases, evaluaciones y notificaciones
 */
export function useMontaje() {
  const { user } = useAuthStore()
  const montajeStore = useMontajeStore()
  const compasService = new CompasService()
  
  // Extraer estado reactivo del store
  const {
    obras,
    obraActual,
    planAccion,
    frases,
    fraseActual,
    notificaciones,
    isLoading,
    error
  } = storeToRefs(montajeStore)

  // Estado local para UI
  const selectedObra = ref<Obra | null>(null)
  const selectedPlan = ref<Plan | null>(null)
  const activeTab = ref<'obras' | 'planes' | 'frases' | 'evaluaciones' | 'analytics'>('obras')
  // Getters computados
  const obrasActivas = computed(() => 
    obras.value.filter(obra => obra.metadatos.progresoPorcentaje < 100)
  )

  const obrasCompletadas = computed(() =>
    obras.value.filter(obra => obra.metadatos.progresoPorcentaje === 100)
  )

  const planesActuales = computed(() =>
    planAccion.value ? [planAccion.value] : []
  )
  const notificacionesSinLeer = computed(() =>
    notificaciones.value.filter(notif => !notif.metadatos.leida)
  )

  // Transform Obra to Work interface for component compatibility
  const transformObraToWork = (obra: Obra): any => ({
    ...obra,
    title: obra.titulo,
    composer: obra.compositor,
    description: obra.descripcion,
    estimatedDuration: obra.duracionEstimada,
    instruments: obra.instrumentosRequeridos,
    sheetMusicUrl: obra.archivoPartitura,
    status: obra.estado
  })

  const worksForUI = computed(() => 
    obras.value.map(transformObraToWork)
  )

  const activeWorksForUI = computed(() =>
    obrasActivas.value.map(transformObraToWork)
  )

  const completedWorksForUI = computed(() =>
    obrasCompletadas.value.map(transformObraToWork)
  )

  const selectedWorkForUI = computed(() =>
    selectedObra.value ? transformObraToWork(selectedObra.value) : null
  )

  // Gestión de obras
  const crearObra = async (obraData: Omit<Obra, 'id' | 'fechaCreacion' | 'auditoria'>) => {
    try {
      const obraId = await montajeStore.crearObra(obraData)
      // Find the created obra in the store
      const obra = obras.value.find(o => o.id === obraId)
      if (obra) {
        selectedObra.value = obra
        return obra
      }
      throw new Error('Obra created but not found in store')
    } catch (error) {
      console.error('Error creating obra:', error)
      throw error
    }
  }

  const cargarObra = async (obraId: string) => {
    try {
      await montajeStore.cargarObra(obraId)
    } catch (error) {
      console.error('Error loading obra:', error)
      throw error
    }
  }

  // Gestión de planes
  const crearPlan = async (planData: Omit<Plan, 'id' | 'fechaCreacion' | 'auditoria'>) => {
    try {
      const planId = await montajeStore.crearPlanAccion(planData)
      // For now, just return the planId since store structure might be different
      console.log('Plan created:', planId)
      return planId
    } catch (error) {
      console.error('Error creating plan:', error)
      throw error
    }
  }

  const cargarPlan = async (obraId: string) => {
    try {
      await montajeStore.cargarPlanAccion(obraId)
    } catch (error) {
      console.error('Error loading plan:', error)
      throw error
    }
  }  // Gestión de evaluaciones
  const crearEvaluacion = async (evaluacionData: Omit<Evaluacion, 'id' | 'auditoria'>) => {
    try {
      const evaluacionId = await montajeStore.crearEvaluacionContinua(evaluacionData)
      console.log('Evaluation created:', evaluacionId)
      return evaluacionId
    } catch (error) {
      console.error('Error creating evaluation:', error)
      throw error
    }
  }

  // Gestión de notificaciones
  const marcarNotificacionLeida = async (notificationId: string) => {
    try {
      await montajeStore.marcarNotificacionLeida(notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  const marcarTodasLeidas = async () => {
    try {
      const unreadIds = notificacionesSinLeer.value.map(n => n.id)
      await Promise.all(unreadIds.map(id => montajeStore.marcarNotificacionLeida(id)))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  // Cargar datos iniciales
  const inicializar = async (repertorioId?: string) => {
    try {
      if (repertorioId) {
        await montajeStore.cargarObras(repertorioId)
      }
      await montajeStore.cargarNotificaciones()
    } catch (error) {
      console.error('Error initializing montaje:', error)
      throw error
    }
  }

  // Funciones utilitarias
  const setActiveTab = (tab: 'obras' | 'planes' | 'frases' | 'evaluaciones' | 'analytics') => {
    activeTab.value = tab
  }

  const selectObra = (obra: Obra | null) => {
    selectedObra.value = obra
  }

  const selectPlan = (plan: Plan | null) => {
    selectedPlan.value = plan
  }  // Additional methods needed by MontajeView
  const updateWork = async (workId: string, workData: any) => {
    try {
      // Transform workData back to Obra format if needed
      const obraData: Partial<Obra> = {
        titulo: workData.title || workData.titulo,
        compositor: workData.composer || workData.compositor,
        descripcion: workData.description || workData.descripcion,
        duracionEstimada: workData.estimatedDuration || workData.duracionEstimada,
        instrumentosRequeridos: workData.instruments || workData.instrumentosRequeridos,
        archivoPartitura: workData.sheetMusicUrl || workData.archivoPartitura,
        estado: workData.status || workData.estado,
        // Actualizar metadatos si es necesario
        metadatos: workData.metadatos || {
          complejidadGeneral: workData.difficulty || workData.complejidadGeneral || DificultadFrase.MEDIO,
          frasesDefinidas: workData.frasesDefinidas || 0,
          frasesCompletadas: workData.frasesCompletadas || 0,
          progresoPorcentaje: workData.progresoPorcentaje || 0
        },
        // Mantener otros campos de Obra según sea necesario
      }
      
      // Si workData incluye propiedades adicionales de la interfaz Work, manejarlas por separado
      if (workData.audioUrl || workData.videoUrl || workData.imagenPortada) {
        // Estas propiedades no están en el tipo Obra pero sí en Work, manejar según sea necesario
        console.log('Propiedades adicionales detectadas:', { 
          audioUrl: workData.audioUrl, 
          videoUrl: workData.videoUrl, 
          imagenPortada: workData.imagenPortada 
        });
      }
      
      // Asegurándonos que el store tenga la función disponible
      if (typeof montajeStore.actualizarObra === 'function') {
        await montajeStore.actualizarObra(workId, obraData)
      } else {
        console.error('La función actualizarObra no está disponible en el store')
        throw new Error('No se pudo actualizar la obra: función no disponible')
      }
      return workId
    } catch (error) {
      console.error('Error updating work:', error)
      throw error
    }
  }

  const deleteWork = async (workId: string) => {
    try {
      // Eliminar la obra usando la función del store, verificando su disponibilidad
      if (typeof montajeStore.eliminarObra === 'function') {
        await montajeStore.eliminarObra(workId)
      } else {
        console.error('La función eliminarObra no está disponible en el store')
        throw new Error('No se pudo eliminar la obra: función no disponible')
      }
      return workId
    } catch (error) {
      console.error('Error deleting work:', error)
      throw error
    }
  }
  const createWork = async (workData: any) => {
    console.log('🔄 createWork llamado con datos:', workData)
    
    try {
      // Add default metadatos if not provided
      const obraData = {
        ...workData,
        metadatos: workData.metadatos || {
          complejidadGeneral: 'medio' as any,
          frasesDefinidas: 0,
          frasesCompletadas: 0,
          progresoPorcentaje: 0
        }
      }
      
      console.log('📊 Datos de obra transformados:', obraData)
      
      // Verificar que tenemos un repertorioId
      if (!obraData.repertorioId) {
        console.warn('⚠️ No se proporcionó repertorioId, usando valor por defecto')
        obraData.repertorioId = 'default-repertorio'
      }
      
      const result = await crearObra(obraData)
      console.log('✅ Obra creada exitosamente en createWork:', result)
      return result
    } catch (error) {
      console.error('❌ Error en createWork:', error)
      throw error
    }
  }

  const createEvaluation = async (evaluationData: CreateEvaluationInput) => {
    return await crearEvaluacion(evaluationData)
  }

  const getAverageScore = (_workId: string): number => {
    // Calculate average score for a work based on evaluaciones
    // For now, return a dummy value
    return Math.floor(Math.random() * 100)
  }

  const clearSelection = () => {
    selectedObra.value = null
    selectedPlan.value = null
  }

  const selectWork = (work: Work | null) => {
    selectedObra.value = work
  }

  // Nuevas funciones para el mapa de calor y compases
  const cargarCompases = async (obraId: string): Promise<Compas[]> => {
    try {
      return await compasService.obtenerCompases(obraId);
    } catch (error) {
      console.error('Error al cargar compases:', error);
      return [];
    }
  };

  const guardarCompas = async (obraId: string, compas: Compas): Promise<string> => {
    try {
      // Guardar el estado anterior para el historial
      const compases = await cargarCompases(obraId);
      const compasAnterior = compases.find(c => c.numero === compas.numero);
      const estadoAnterior = compasAnterior?.estado || 'sin_trabajar';
      
      // Guardar el compás
      const compasId = await compasService.guardarCompas(obraId, compas);
      
      // Si cambió el estado, registrar en historial
      if (compasAnterior && estadoAnterior !== compas.estado) {
        await compasService.guardarHistorial({
          compas: compas.numero,
          estadoAnterior,
          estadoNuevo: compas.estado,
          fecha: new Date(),
          autorId: user?.uid || '',
          autorNombre: user?.email || 'unknown',
          obraId
        });
      }
      
      // Actualizar el progreso global de la obra
      const todosCompases = [...compases];
      const indexToUpdate = todosCompases.findIndex(c => c.numero === compas.numero);
      if (indexToUpdate !== -1) {
        todosCompases[indexToUpdate] = { ...compas, autoId: compasId };
      } else {
        todosCompases.push({ ...compas, autoId: compasId });
      }
      
      const logradosCount = todosCompases.filter(c => c.estado === 'logrado').length;
      const totalCount = todosCompases.length;
      const progreso = totalCount > 0 ? Math.round((logradosCount / totalCount) * 100) : 0;
      await compasService.actualizarProgresoObra(obraId, progreso);
      
      return compasId;
    } catch (error) {
      console.error('Error al guardar compás:', error);
      throw error;
    }
  };

  const cargarHistorial = async (obraId: string): Promise<HistorialCompas[]> => {
    try {
      return await compasService.obtenerHistorial(obraId);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      return [];
    }
  };

  const obtenerObservaciones = async (obraId: string): Promise<any[]> => {
    try {
      return await compasService.obtenerObservaciones(obraId);
    } catch (error) {
      console.error('Error al obtener observaciones:', error);
      return [];
    }
  };

  const agregarObservacion = async (obraId: string, observacion: any): Promise<string> => {
    try {
      return await compasService.agregarObservacion(obraId, {
        ...observacion,
        autor: user?.uid || '',
        autorNombre: user?.email || '',
        fecha: new Date()
      });
    } catch (error) {
      console.error('Error al agregar observación:', error);
      throw error;
    }
  };

  const cargarUsuario = async () => {
    return user;
  };

  // Función para generar un reporte PDF de una obra
  const generarReporteObra = async (obraId: string): Promise<string> => {
    try {
      // Cargar todos los datos necesarios
      await cargarObra(obraId);
      
      
      // Aquí se implementaría la generación del PDF
      console.log('Generando reporte para', montajeStore.obraActual?.titulo);
      
      // Para esta versión, solo retornamos un mensaje de éxito
      return 'Reporte generado con éxito';
    } catch (error) {
      console.error('Error al generar reporte:', error);
      throw error;
    }
  };

  return {
    // Estado - Spanish names
    obras,
    obraActual,
    planAccion,
    frases,
    fraseActual,
    notificaciones,
    isLoading,
    error,
    selectedObra,
    selectedPlan,
    activeTab,    // Estado - English aliases for MontajeView
    works: worksForUI,
    plans: computed(() => planAccion.value ? [planAccion.value] : []),
    phrases: frases,
    states: computed(() => []), // Empty for now
    evaluations: computed(() => []), // Empty for now
    notifications: notificaciones,
    loading: isLoading,
    selectedWork: selectedWorkForUI,

    // Computed - Spanish names
    obrasActivas,
    obrasCompletadas,
    planesActuales,
    notificacionesSinLeer,    // Computed - English aliases
    activeWorks: activeWorksForUI,
    completedWorks: completedWorksForUI,
    currentPlans: planesActuales,
    recentEvaluations: computed(() => []), // Empty for now
    unreadNotifications: notificacionesSinLeer,

    // Métodos - Spanish names
    crearObra,
    cargarObra,
    crearPlan,
    cargarPlan,
    crearEvaluacion,
    marcarNotificacionLeida,
    marcarTodasLeidas,
    inicializar,
    setActiveTab,
    selectObra,
    selectPlan,    // Métodos - English aliases
    createWork,
    updateWork,
    deleteWork,
    createEvaluation,
    getAverageScore,
    markNotificationAsRead: marcarNotificacionLeida,
    markAllNotificationsAsRead: marcarTodasLeidas,
    loadMontajeData: inicializar,
    selectWork,
    clearSelection,
    
    // Nuevos métodos para mapa de calor y compases
    cargarCompases,
    guardarCompas,
    cargarHistorial,
    obtenerObservaciones,
    agregarObservacion,
    cargarUsuario,
    generarReporteObra
  }
}
