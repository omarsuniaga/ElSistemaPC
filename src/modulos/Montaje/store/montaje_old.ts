// src/modulos/Montaje/store/montaje.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Timestamp } from 'firebase/firestore';
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
  CambioEstadoCompass
} from '../types';
import { EstadoCompass } from '../types';
import { montajeService } from '../service/montajeService.js';
import { useAuthStore } from '@/stores/auth';

export const useMontajeStore = defineStore('montaje', () => {
  // ================== ESTADO ==================
  const obras = ref<Obra[]>([]);
  const obraActual = ref<Obra | null>(null);
  const planAccion = ref<PlanAccion | null>(null);
  const frases = ref<FraseMontaje[]>([]);
  const fraseActual = ref<FraseMontaje | null>(null);
  const estadosCompases = ref<Map<number, EstadoCompassDetalle>>(new Map());
  const observaciones = ref<ObservacionPedagogica[]>([]);
  const evaluacionesContinuas = ref<EvaluacionContinua[]>([]);
  const evaluacionesFinales = ref<EvaluacionFinal[]>([]);
  const notificaciones = ref<NotificacionMontaje[]>([]);
  
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const filtros = ref<FiltrosMontaje>({});

  // ================== GETTERS ==================
  const obrasActivasPorRepertorio = computed(() => (repertorioId: string) => 
    obras.value.filter(obra => obra.repertorioId === repertorioId)
  );

  const frasesActuales = computed(() => 
    frases.value.filter(f => f.planAccionId === planAccion.value?.id)
  );

  const frasesCompletadas = computed(() => 
    frasesActuales.value.filter(f => f.metadatos.progresoPorcentaje === 100)
  );

  const frasesPendientes = computed(() => 
    frasesActuales.value.filter(f => f.metadatos.progresoPorcentaje < 100)
  );

  const frasesConDificultad = computed(() => 
    frasesActuales.value.filter(f => 
      Object.values(f.metadatos.estadosCompases).some(estado => estado === EstadoCompass.CON_DIFICULTAD)
    )
  );

  const progresoGeneral = computed(() => {
    if (frasesActuales.value.length === 0) return 0;
    const total = frasesActuales.value.reduce((sum, f) => sum + f.metadatos.progresoPorcentaje, 0);
    return Math.round(total / frasesActuales.value.length);
  });

  const compassesProblematicos = computed(() => {
    const problematicos: number[] = [];
    estadosCompases.value.forEach((detalle, compas) => {
      if (detalle.estado === EstadoCompass.CON_DIFICULTAD) {
        problematicos.push(compas);
      }
    });
    return problematicos.sort((a, b) => a - b);
  });

  const estadisticasEvaluacion = computed(() => {
    const continuas = evaluacionesContinuas.value;
    const finales = evaluacionesFinales.value;
    
    return {
      totalEvaluacionesContinuas: continuas.length,
      totalEvaluacionesFinales: finales.length,
      promedioGeneral: continuas.reduce((sum, e) => sum + e.metadatos.porcentajeCumplimiento, 0) / continuas.length || 0,
      estudiantesEvaluados: [...new Set(continuas.map(e => e.estudianteId))].length,
      criteriosMejorados: continuas.filter(e => e.metadatos.porcentajeCumplimiento > 75).length
    };
  });

  const notificacionesSinLeer = computed(() => 
    notificaciones.value.filter(n => !n.metadatos.leida)
  );

  // ================== ACCIONES DE OBRAS ==================

  /**
   * Cargar obras de un repertorio
   */
  const cargarObras = async (repertorioId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const obrasData = await montajeService.obtenerObras(repertorioId);
      obras.value = obrasData;
      
      console.log('✅ Obras cargadas:', obrasData.length);
    } catch (err) {
      console.error('❌ Error cargando obras:', err);
      error.value = 'No se pudieron cargar las obras';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Cargar una obra específica
   */
  const cargarObra = async (obraId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const obra = await montajeService.obtenerObra(obraId);
      if (obra) {
        obraActual.value = obra;
        // También agregar a la lista si no está
        if (!obras.value.find(o => o.id === obraId)) {
          obras.value.push(obra);
        }
      }
      
      console.log('✅ Obra cargada:', obra?.titulo);
    } catch (err) {
      console.error('❌ Error cargando obra:', err);
      error.value = 'No se pudo cargar la obra';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Crear nueva obra
   */
  const crearObra = async (obraData: Omit<Obra, 'id' | 'fechaCreacion' | 'auditoria'>) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      console.log('🔄 Creando obra con datos:', obraData);
      
      // Preparar datos completos con auditoría
      const authStore = useAuthStore();
      const datosCompletos: Omit<Obra, 'id'> = {
        ...obraData,
        fechaCreacion: Timestamp.now(),
        auditoria: {
          creadoPor: authStore.user?.uid || 'unknown',
          fechaCreacion: Timestamp.now(),
          version: 1,
          activo: true
        },
        // Asegurar metadatos básicos
        metadatos: {
          complejidadGeneral: DificultadFrase.MEDIO,
          totalCompases: 0,
          frasesDefinidas: 0,
          frasesCompletadas: 0,
          progresoPorcentaje: 0,
          horasEnsayoEstimadas: 0,
          horasEnsayoReales: 0,
          ...obraData.metadatos
        }
      };
      
      const obraId = await montajeService.crearObra(datosCompletos);
      
      // Cargar la obra creada y agregarla al estado
      const obraCreada = await montajeService.obtenerObra(obraId);
      if (obraCreada) {
        obras.value.unshift(obraCreada);
        obraActual.value = obraCreada;
      }
      
      console.log('✅ Obra creada con ID:', obraId);
      return obraId;
    } catch (err) {
      console.error('❌ Error creando obra:', err);
      error.value = 'No se pudo crear la obra';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Actualizar obra existente
   */
  const actualizarObra = async (obraId: string, datos: Partial<Obra>) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      await montajeService.actualizarObra(obraId, datos);
      
      // Actualizar en el estado local
      const index = obras.value.findIndex(o => o.id === obraId);
      if (index !== -1) {
        obras.value[index] = { ...obras.value[index], ...datos };
      }
      
      if (obraActual.value?.id === obraId) {
        obraActual.value = { ...obraActual.value, ...datos };
      }
      
      console.log('✅ Obra actualizada:', obraId);
    } catch (err) {
      console.error('❌ Error actualizando obra:', err);
      error.value = 'No se pudo actualizar la obra';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Eliminar obra
   */
  const eliminarObra = async (obraId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      await montajeService.eliminarObra(obraId);
      
      // Remover del estado local
      obras.value = obras.value.filter(o => o.id !== obraId);
      
      if (obraActual.value?.id === obraId) {
        obraActual.value = null;
      }
      
      console.log('✅ Obra eliminada:', obraId);
    } catch (err) {
      console.error('❌ Error eliminando obra:', err);
      error.value = 'No se pudo eliminar la obra';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ================== ACCIONES DE PLANES ==================

  /**
   * Cargar plan de acción de una obra
   */
  const cargarPlanAccion = async (obraId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const plan = await montajeService.obtenerPlanAccion(obraId);
      planAccion.value = plan;
      
      console.log('✅ Plan de acción cargado:', plan?.nombre);
    } catch (err) {
      console.error('❌ Error cargando plan de acción:', err);
      error.value = 'No se pudo cargar el plan de acción';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Crear nuevo plan de acción
   */
  const crearPlanAccion = async (planData: Omit<PlanAccion, 'id' | 'auditoria'>) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const authStore = useAuthStore();
      const datosCompletos: Omit<PlanAccion, 'id'> = {
        ...planData,
        auditoria: {
          creadoPor: authStore.user?.uid || 'unknown',
          fechaCreacion: Timestamp.now(),
          version: 1,
          activo: true
        },
        metadatos: {
          progresoPorcentaje: 0,
          fasesCompletadas: 0,
          totalFases: planData.fases?.length || 0,
          horasEstimadas: 0,
          horasReales: 0,
          ...planData.metadatos
        }
      };
      
      const planId = await montajeService.crearPlanAccion(datosCompletos);
      
      // Cargar el plan creado
      await cargarPlanAccion(planData.obraId);
      
      console.log('✅ Plan de acción creado con ID:', planId);
      return planId;
    } catch (err) {
      console.error('❌ Error creando plan de acción:', err);
      error.value = 'No se pudo crear el plan de acción';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Actualizar plan de acción
   */
  const actualizarPlanAccion = async (planId: string, datos: Partial<PlanAccion>) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      await montajeService.actualizarPlanAccion(planId, datos);
      
      // Actualizar en el estado local
      if (planAccion.value?.id === planId) {
        planAccion.value = { ...planAccion.value, ...datos };
      }
      
      console.log('✅ Plan de acción actualizado:', planId);
    } catch (err) {
      console.error('❌ Error actualizando plan de acción:', err);
      error.value = 'No se pudo actualizar el plan de acción';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ================== ACCIONES DE FRASES ==================

  /**
   * Cargar frases de un plan
   */
  const cargarFrases = async (planAccionId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const frasesData = await montajeService.obtenerFrases(planAccionId);
      frases.value = frasesData;
      
      console.log('✅ Frases cargadas:', frasesData.length);
    } catch (err) {
      console.error('❌ Error cargando frases:', err);
      error.value = 'No se pudieron cargar las frases';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Crear nueva frase
   */
  const crearFrase = async (fraseData: Omit<FraseMontaje, 'id' | 'auditoria'>) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const authStore = useAuthStore();
      const datosCompletos: Omit<FraseMontaje, 'id'> = {
        ...fraseData,
        auditoria: {
          creadoPor: authStore.user?.uid || 'unknown',
          fechaCreacion: Timestamp.now(),
          version: 1,
          activo: true
        },
        metadatos: {
          totalCompases: fraseData.compasFinalizacion - fraseData.compasInicio + 1,
          estadosCompases: {},
          progresoPorcentaje: 0,
          horasEnsayoAcumuladas: 0,
          dificultadesIdentificadas: [],
          logrosAlcanzados: [],
          ...fraseData.metadatos
        }
      };
      
      const fraseId = await montajeService.crearFrase(datosCompletos);
      
      // Recargar frases del plan
      await cargarFrases(fraseData.planAccionId);
      
      console.log('✅ Frase creada con ID:', fraseId);
      return fraseId;
    } catch (err) {
      console.error('❌ Error creando frase:', err);
      error.value = 'No se pudo crear la frase';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ================== ACCIONES DE EVALUACIONES ==================

  /**
   * Cargar evaluaciones continuas
   */
  const cargarEvaluacionesContinuas = async (obraId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const evaluacionesData = await montajeService.obtenerEvaluacionesContinuas(obraId);
      evaluacionesContinuas.value = evaluacionesData;
      
      console.log('✅ Evaluaciones continuas cargadas:', evaluacionesData.length);
    } catch (err) {
      console.error('❌ Error cargando evaluaciones continuas:', err);
      error.value = 'No se pudieron cargar las evaluaciones continuas';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Crear evaluación continua
   */
  const crearEvaluacionContinua = async (evaluacionData: Omit<EvaluacionContinua, 'id' | 'auditoria'>) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const authStore = useAuthStore();
      const datosCompletos: Omit<EvaluacionContinua, 'id'> = {
        ...evaluacionData,
        auditoria: {
          creadoPor: authStore.user?.uid || 'unknown',
          fechaCreacion: Timestamp.now(),
          version: 1,
          activo: true
        }
      };
      
      const evaluacionId = await montajeService.crearEvaluacionContinua(datosCompletos);
      
      // Recargar evaluaciones
      await cargarEvaluacionesContinuas(evaluacionData.obraId);
      
      console.log('✅ Evaluación continua creada con ID:', evaluacionId);
      return evaluacionId;
    } catch (err) {
      console.error('❌ Error creando evaluación continua:', err);
      error.value = 'No se pudo crear la evaluación continua';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ================== ACCIONES DE NOTIFICACIONES ==================

  /**
   * Cargar notificaciones del usuario
   */
  const cargarNotificaciones = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const authStore = useAuthStore();
      if (!authStore.user?.uid) {
        console.warn('⚠️ Usuario no autenticado para cargar notificaciones');
        return;
      }
      
      const notificacionesData = await montajeService.obtenerNotificaciones(authStore.user.uid);
      notificaciones.value = notificacionesData;
      
      console.log('✅ Notificaciones cargadas:', notificacionesData.length);
    } catch (err) {
      console.error('❌ Error cargando notificaciones:', err);
      error.value = 'No se pudieron cargar las notificaciones';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Marcar notificación como leída
   */
  const marcarNotificacionLeida = async (notificacionId: string) => {
    try {
      await montajeService.marcarNotificacionLeida(notificacionId);
      
      // Actualizar en el estado local
      const notificacion = notificaciones.value.find(n => n.id === notificacionId);
      if (notificacion) {
        notificacion.metadatos.leida = true;
      }
      
      console.log('✅ Notificación marcada como leída:', notificacionId);
    } catch (err) {
      console.error('❌ Error marcando notificación como leída:', err);
      throw err;
    }
  };

  // ================== ACCIONES DE CAMBIO DE ESTADO ==================

  /**
   * Cambiar estado de compás
   */
  const cambiarEstadoCompass = async (
    compassNumber: number,
    nuevoEstado: EstadoCompass,
    fraseId: string,
    razon: string = ''
  ) => {
    try {
      const authStore = useAuthStore();
      const estadoAnterior = estadosCompases.value.get(compassNumber)?.estado || EstadoCompass.SIN_TRABAJAR;
      
      const cambio: CambioEstadoCompass = {
        id: `cambio-${Date.now()}`,
        obraId: obraActual.value?.id || '',
        fraseId,
        compas: compassNumber,
        instrumento: undefined,
        estadoAnterior,
        estadoNuevo: nuevoEstado,
        razon,
        maestroId: authStore.user?.uid || 'unknown',
        fecha: Timestamp.now()
      };
      
      await montajeService.cambiarEstadoCompass(compassNumber, nuevoEstado, cambio);
      
      // Actualizar estado local
      const estadoActual = estadosCompases.value.get(compassNumber) || {
        compas: compassNumber,
        estado: EstadoCompass.SIN_TRABAJAR,
        instrumentos: {},
        observaciones: [],
        fechaUltimaModificacion: Timestamp.now(),
        modificadoPor: authStore.user?.uid || 'unknown',
        sesionesEnsayo: 0,
        dificultadesEspecificas: []
      };
      
      estadoActual.estado = nuevoEstado;
      estadoActual.fechaUltimaModificacion = Timestamp.now();
      estadoActual.modificadoPor = authStore.user?.uid || 'unknown';
      
      estadosCompases.value.set(compassNumber, estadoActual);
      
      console.log('✅ Estado de compás cambiado:', compassNumber, nuevoEstado);
    } catch (err) {
      console.error('❌ Error cambiando estado de compás:', err);
      throw err;
    }
  };

  // ================== UTILIDADES ==================

  /**
   * Limpiar estado del store
   */
  const limpiarEstado = () => {
    obras.value = [];
    obraActual.value = null;
    planAccion.value = null;
    frases.value = [];
    fraseActual.value = null;
    estadosCompases.value.clear();
    observaciones.value = [];
    evaluacionesContinuas.value = [];
    evaluacionesFinales.value = [];
    notificaciones.value = [];
    error.value = null;
    isLoading.value = false;
  };

  /**
   * Actualizar filtros
   */
  const actualizarFiltros = (nuevosFiltros: Partial<FiltrosMontaje>) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros };
  };
    
    const nuevaObra: Omit<Obra, 'id'> = {
      ...datos,
      fechaCreacion: Timestamp.now(),
      auditoria: {
        creadoPor: authStore.user?.uid || 'unknown',
        fechaCreacion: Timestamp.now(),
        version: 1,
        activo: true
      }
    };
    
    try {
      const id = await montajeService.crearObra(nuevaObra);
      await cargarObras(datos.repertorioId);
      const obra = obras.value.find(o => o.id === id);
      if (obra) {
        obraActual.value = obra;
      }
      return id;
    } catch (err) {
      error.value = 'Error al crear obra: ' + (err as Error).message;
      console.error('Error creando obra:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Actualizar una obra existente
   */
  const actualizarObra = async (id: string, datos: Partial<Obra>) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const authStore = useAuthStore();
      
      // Obtener la obra actual para no perder datos
      const obraExistente = obras.value.find(o => o.id === id);
      if (!obraExistente) {
        throw new Error('Obra no encontrada');
      }
      
      const datosActualizados = {
        ...datos,
        auditoria: {
          ...obraExistente.auditoria,
          modificadoPor: authStore.user?.uid || 'unknown',
          fechaModificacion: Timestamp.now(),
          version: (obraExistente.auditoria.version || 1) + 1
        }
      };
      
      await montajeService.actualizarObra(id, datosActualizados);
      
      // Actualizar la obra en el estado local
      const index = obras.value.findIndex(o => o.id === id);
      if (index !== -1) {
        obras.value[index] = {
          ...obras.value[index],
          ...datosActualizados
        };
        
        // Si es la obra actual, actualizarla también
        if (obraActual.value?.id === id) {
          obraActual.value = {
            ...obraActual.value,
            ...datosActualizados
          };
        }
      }
      
      return id;
    } catch (err) {
      error.value = 'Error al actualizar obra: ' + (err as Error).message;
      console.error('Error actualizando obra:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Eliminar una obra
   */
  const eliminarObra = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // Obtener los datos de repertorio antes de eliminar
      const obra = obras.value.find(o => o.id === id);
      if (!obra) {
        throw new Error('Obra no encontrada');
      }
      
      const repertorioId = obra.repertorioId;
      
      // Eliminar la obra y todos los datos relacionados
      await montajeService.eliminarObra(id);
      
      // Si la obra eliminada es la actual, limpiar la selección
      if (obraActual.value?.id === id) {
        obraActual.value = null;
      }
      
      // Actualizar la lista de obras
      obras.value = obras.value.filter(o => o.id !== id);
      
      return repertorioId;
    } catch (err) {
      error.value = 'Error al eliminar obra: ' + (err as Error).message;
      console.error('Error eliminando obra:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // ================== ACCIONES DE PLAN DE ACCIÓN ==================

  /**
   * Cargar plan de acción de una obra
   */
  const cargarPlanAccion = async (obraId: string) => {
    try {
      planAccion.value = await montajeService.obtenerPlanAccion(obraId);
      if (planAccion.value) {
        await cargarFrases(planAccion.value.id);
      }
    } catch (err) {
      console.error('Error cargando plan de acción:', err);
    }
  };

  /**
   * Crear plan de acción
   */
  const crearPlanAccion = async (datos: Omit<PlanAccion, 'id' | 'fechaCreacion' | 'auditoria'>) => {
    const authStore = useAuthStore();
    const nuevoPlan: Omit<PlanAccion, 'id'> = {
      ...datos,
      fechaCreacion: Timestamp.now(),
      auditoria: {
        creadoPor: authStore.user?.uid || 'unknown',
        fechaCreacion: Timestamp.now(),
        version: 1,
        activo: true
      }
    };

    const id = await montajeService.crearPlanAccion(nuevoPlan);
    await cargarPlanAccion(datos.obraId);
    return id;
  };

  // ================== ACCIONES DE FRASES ==================

  /**
   * Cargar frases de un plan de acción
   */
  const cargarFrases = async (planAccionId: string) => {
    try {
      frases.value = await montajeService.obtenerFrases(planAccionId);
    } catch (err) {
      console.error('Error cargando frases:', err);
    }
  };

  /**
   * Crear nueva frase
   */
  const crearFrase = async (datos: Omit<FraseMontaje, 'id' | 'fechaCreacion' | 'auditoria'>) => {
    const authStore = useAuthStore();
    const nuevaFrase: Omit<FraseMontaje, 'id'> = {
      ...datos,
      fechaCreacion: Timestamp.now(),      metadatos: {
        progresoPorcentaje: datos.metadatos?.progresoPorcentaje || 0,
        estadosCompases: datos.metadatos?.estadosCompases || {},
        maestrosAsignados: datos.metadatos?.maestrosAsignados || []
      },
      auditoria: {
        creadoPor: authStore.user?.uid || 'unknown',
        fechaCreacion: Timestamp.now(),
        version: 1,
        activo: true
      }
    };

    const id = await montajeService.crearFrase(nuevaFrase);
    await cargarFrases(datos.planAccionId);
    return id;
  };

  // ================== ACCIONES DE ESTADO DE COMPASES ==================

  /**
   * Cargar estados de compases para una frase
   */
  const cargarEstadosCompases = async (fraseId: string) => {
    try {
      const estados = await montajeService.obtenerEstadosCompases(fraseId);
      estados.forEach((estado: any) => {
        estadosCompases.value.set(estado.compassNumber, estado);
      });
    } catch (err) {
      console.error('Error cargando estados de compases:', err);
    }
  };

  /**
   * Cambiar estado de un compás
   */
  const cambiarEstadoCompass = async (
    compassNumber: number, 
    nuevoEstado: EstadoCompass,
    observaciones?: string
  ) => {
    const authStore = useAuthStore();
    const estadoActual = estadosCompases.value.get(compassNumber);
    
    const cambio: CambioEstadoCompass = {
      estadoAnterior: estadoActual?.estado || EstadoCompass.SIN_TRABAJAR,
      estadoNuevo: nuevoEstado,
      fecha: Timestamp.now(),
      maestroId: authStore.user?.uid || 'unknown',
      observaciones
    };

    try {
      await montajeService.cambiarEstadoCompass(compassNumber, nuevoEstado, cambio);
      
      // Actualizar estado local
      if (estadoActual) {
        estadoActual.estado = nuevoEstado;
        estadoActual.fechaUltimaActualizacion = Timestamp.now();
        estadoActual.maestroActualizador = authStore.user?.uid || 'unknown';
        if (observaciones) estadoActual.observaciones = observaciones;
      }
      
      // Recalcular progreso de la frase
      await recalcularProgresoFrase();
    } catch (err) {
      console.error('Error cambiando estado de compás:', err);
      throw err;
    }
  };

  /**
   * Recalcular progreso de frase actual
   */
  const recalcularProgresoFrase = async () => {
    if (!fraseActual.value) return;
    
    const totalCompases = fraseActual.value.compassFin - fraseActual.value.compassInicio + 1;
    let compassLogrados = 0;
    
    for (let i = fraseActual.value.compassInicio; i <= fraseActual.value.compassFin; i++) {
      const estado = estadosCompases.value.get(i);
      if (estado?.estado === EstadoCompass.LOGRADO) {
        compassLogrados++;
      }
    }
    
    const progreso = Math.round((compassLogrados / totalCompases) * 100);
    fraseActual.value.metadatos.progresoPorcentaje = progreso;
    
    // Actualizar en Firebase
    await montajeService.actualizarFrase(fraseActual.value.id, {
      metadatos: fraseActual.value.metadatos
    });
  };

  // ================== ACCIONES DE EVALUACIONES ==================

  /**
   * Crear evaluación continua
   */
  const crearEvaluacionContinua = async (datos: Omit<EvaluacionContinua, 'id' | 'auditoria'>) => {
    const authStore = useAuthStore();
    const criteriosCumplidos = Object.values(datos.criterios).filter(Boolean).length;
    const totalCriterios = Object.keys(datos.criterios).length;
    
    const nuevaEvaluacion: Omit<EvaluacionContinua, 'id'> = {
      ...datos,      metadatos: {
        puntuacionTotal: datos.metadatos?.puntuacionTotal || criteriosCumplidos,
        porcentajeCumplimiento: datos.metadatos?.porcentajeCumplimiento || Math.round((criteriosCumplidos / totalCriterios) * 100),
        criteriosCumplidos: datos.metadatos?.criteriosCumplidos || criteriosCumplidos,
        criteriosNoCumplidos: datos.metadatos?.criteriosNoCumplidos || (totalCriterios - criteriosCumplidos)
      },
      auditoria: {
        creadoPor: authStore.user?.uid || 'unknown',
        fechaCreacion: Timestamp.now(),
        version: 1,
        activo: true
      }
    };

    const id = await montajeService.crearEvaluacionContinua(nuevaEvaluacion);
    await cargarEvaluacionesContinuas(datos.obraId);
    return id;
  };

  /**
   * Cargar evaluaciones continuas
   */
  const cargarEvaluacionesContinuas = async (obraId: string) => {
    try {
      evaluacionesContinuas.value = await montajeService.obtenerEvaluacionesContinuas(obraId);
    } catch (err) {
      console.error('Error cargando evaluaciones continuas:', err);
    }
  };

  // ================== ACCIONES DE NOTIFICACIONES ==================

  /**
   * Cargar notificaciones del usuario
   */
  const cargarNotificaciones = async () => {
    const authStore = useAuthStore();
    if (!authStore.user?.uid) return;
    
    try {
      notificaciones.value = await montajeService.obtenerNotificaciones(authStore.user.uid);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    }
  };

  /**
   * Marcar notificación como leída
   */
  const marcarNotificacionLeida = async (id: string) => {
    try {
      await montajeService.marcarNotificacionLeida(id);
      const notificacion = notificaciones.value.find(n => n.id === id);
      if (notificacion) {
        notificacion.metadatos.leida = true;
        notificacion.fechaLeida = Timestamp.now();
      }
    } catch (err) {
      console.error('Error marcando notificación:', err);
    }
  };

  /**
   * Crear notificación
   */
  const crearNotificacion = async (datos: Omit<NotificacionMontaje, 'id' | 'fechaCreacion'>) => {
    const authStore = useAuthStore();
    const nuevaNotificacion: Omit<NotificacionMontaje, 'id'> = {
      ...datos,
      fechaCreacion: Timestamp.now(),
      remitenteId: authStore.user?.uid || 'system',      metadatos: {
        leida: datos.metadatos?.leida || false,
        accionRequerida: datos.metadatos?.accionRequerida || false,
        ...(datos.metadatos?.fechaVencimiento && { fechaVencimiento: datos.metadatos.fechaVencimiento })
      }
    };

    await montajeService.crearNotificacion(nuevaNotificacion);
  };

  /**
   * Limpiar estado
   */
  const limpiarEstado = () => {
    obras.value = [];
    obraActual.value = null;
    planAccion.value = null;
    frases.value = [];
    fraseActual.value = null;
    estadosCompases.value.clear();
    observaciones.value = [];
    evaluacionesContinuas.value = [];
    evaluacionesFinales.value = [];
  /**
   * Limpiar estado del store
   */
  const limpiarEstado = () => {
    obras.value = [];
    obraActual.value = null;
    planAccion.value = null;
    frases.value = [];
    fraseActual.value = null;
    estadosCompases.value.clear();
    observaciones.value = [];
    evaluacionesContinuas.value = [];
    evaluacionesFinales.value = [];
    notificaciones.value = [];
    error.value = null;
    filtros.value = {};
  };

  /**
   * Actualizar filtros
   */
  const actualizarFiltros = (nuevosFiltros: Partial<FiltrosMontaje>) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros };
  };

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
    
    // Acciones de evaluaciones
    cargarEvaluacionesContinuas,
    crearEvaluacionContinua,
    
    // Acciones de notificaciones
    cargarNotificaciones,
    marcarNotificacionLeida,
    
    // Acciones de estados
    cambiarEstadoCompass,
    
    // Utilidades
    limpiarEstado,
    actualizarFiltros
  };
});
