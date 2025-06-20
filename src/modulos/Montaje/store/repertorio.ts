// src/modulos/Montaje/store/repertorio.ts

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Timestamp } from 'firebase/firestore';
import type { 
  Repertorio, 
  ParticipanteRepertorio,
  FiltrosMontaje,
  MetricasProgreso
} from '../types';
import { EstadoRepertorio } from '../types';
import { repertorioService } from '../service/repertorioService.js';
import { useAuthStore } from '@/stores/auth';

export const useRepertorioStore = defineStore('repertorio-montaje', () => {
  // ================== ESTADO ==================
  const repertorios = ref<Repertorio[]>([]);
  const repertorioActual = ref<Repertorio | null>(null);
  const metricas = ref<MetricasProgreso | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const filtros = ref<FiltrosMontaje>({});

  // ================== GETTERS ==================
  const repertoriosActivos = computed(() => 
    repertorios.value.filter(r => r.estado !== EstadoRepertorio.ARCHIVADO)
  );

  const repertoriosPorEstado = computed(() => ({
    planificando: repertorios.value.filter(r => r.estado === EstadoRepertorio.PLANIFICANDO),
    enMontaje: repertorios.value.filter(r => r.estado === EstadoRepertorio.EN_MONTAJE),
    finalizados: repertorios.value.filter(r => r.estado === EstadoRepertorio.FINALIZADO),
    archivados: repertorios.value.filter(r => r.estado === EstadoRepertorio.ARCHIVADO)
  }));

  const repertoriosProximos = computed(() => 
    repertorios.value
      .filter(r => r.fechaConcierto && r.fechaConcierto.toDate() > new Date())
      .sort((a, b) => (a.fechaConcierto?.toDate().getTime() || 0) - (b.fechaConcierto?.toDate().getTime() || 0))
  );

  const estadisticasGenerales = computed(() => {
    const total = repertorios.value.length;
    const activos = repertoriosActivos.value.length;
    const progresoPromedio = repertorios.value.reduce((sum, r) => sum + r.metadatos.progresoPorcentaje, 0) / total || 0;
    
    return {
      total,
      activos,
      progresoPromedio: Math.round(progresoPromedio),
      obrasTotal: repertorios.value.reduce((sum, r) => sum + r.metadatos.totalObras, 0),
      horasEstimadas: repertorios.value.reduce((sum, r) => sum + r.metadatos.horasEstimadas, 0)
    };
  });

  // ================== ACCIONES ==================

  /**
   * Cargar todos los repertorios
   */
  const cargarRepertorios = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      repertorios.value = await repertorioService.obtenerTodos();
    } catch (err) {
      error.value = 'Error al cargar repertorios: ' + (err as Error).message;
      console.error('Error cargando repertorios:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Cargar un repertorio específico por ID
   */
  const cargarRepertorio = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      repertorioActual.value = await repertorioService.obtenerPorId(id);
      return repertorioActual.value;
    } catch (err) {
      error.value = 'Error al cargar repertorio: ' + (err as Error).message;
      console.error('Error cargando repertorio:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Crear un nuevo repertorio
   */
  const createRepertoireItem = async (datos: Omit<Repertorio, 'id' | 'fechaCreacion' | 'auditoria'>) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const authStore = useAuthStore();
      const nuevoRepertorio: Omit<Repertorio, 'id'> = {
        ...datos,
        fechaCreacion: Timestamp.now(),
        estado: EstadoRepertorio.PLANIFICANDO,        metadatos: {
          totalObras: datos.metadatos?.totalObras || 0,
          totalCompases: datos.metadatos?.totalCompases || 0,
          horasEstimadas: datos.metadatos?.horasEstimadas || 0,
          progresoPorcentaje: datos.metadatos?.progresoPorcentaje || 0
        },
        participantes: datos.participantes || [],
        auditoria: {
          creadoPor: authStore.user?.uid || 'unknown',
          fechaCreacion: Timestamp.now(),
          version: 1,
          activo: true
        }
      };

      const id = await repertorioService.crear(nuevoRepertorio);
      await cargarRepertorios(); // Recargar lista
      return id;
    } catch (err) {
      error.value = 'Error al crear repertorio: ' + (err as Error).message;
      console.error('Error creando repertorio:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Actualizar un repertorio existente
   */
  const updateRepertoireItem = async (id: string, cambios: Partial<Repertorio>) => {
    isLoading.value = true;
    error.value = null;
    
    try {      const authStore = useAuthStore();
      const currentRepertorio = repertorioActual.value || repertorios.value.find(r => r.id === id);
      const datosActualizacion = {
        ...cambios,
        auditoria: {
          creadoPor: currentRepertorio?.auditoria.creadoPor || 'unknown',
          fechaCreacion: currentRepertorio?.auditoria.fechaCreacion || Timestamp.now(),
          activo: currentRepertorio?.auditoria.activo ?? true,
          ...cambios.auditoria,
          modificadoPor: authStore.user?.uid || 'unknown',
          fechaModificacion: Timestamp.now(),
          version: (cambios.auditoria?.version || currentRepertorio?.auditoria.version || 1) + 1
        }
      };

      await repertorioService.actualizar(id, datosActualizacion);
      
      // Actualizar en el estado local
      const index = repertorios.value.findIndex(r => r.id === id);
      if (index !== -1) {
        repertorios.value[index] = { ...repertorios.value[index], ...datosActualizacion };
      }
      
      if (repertorioActual.value?.id === id) {
        repertorioActual.value = { ...repertorioActual.value, ...datosActualizacion };
      }
    } catch (err) {
      error.value = 'Error al actualizar repertorio: ' + (err as Error).message;
      console.error('Error actualizando repertorio:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Cambiar estado de un repertorio
   */
  const cambiarEstado = async (id: string, nuevoEstado: EstadoRepertorio) => {
    await updateRepertoireItem(id, { estado: nuevoEstado });
  };

  /**
   * Eliminar un repertorio existente
   */
  const deleteRepertoireItem = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      await repertorioService.eliminar(id);
      repertorios.value = repertorios.value.filter(r => r.id !== id);
      if (repertorioActual.value?.id === id) {
        repertorioActual.value = null;
      }
    } catch (err) {
      error.value = 'Error al eliminar repertorio: ' + (err as Error).message;
      console.error('Error eliminando repertorio:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Agregar participante a un repertorio
   */
  const addParticipant = async (repertorioId: string, participante: ParticipanteRepertorio) => {
    const repertorio = repertorios.value.find(r => r.id === repertorioId);
    if (!repertorio) {
      throw new Error('Repertorio no encontrado');
    }

    const participantesActualizados = [...repertorio.participantes, participante];
    await updateRepertoireItem(repertorioId, { participantes: participantesActualizados });
  };

  /**
   * Actualizar un participante existente en un repertorio
   */
  const updateParticipant = async (repertorioId: string, participanteId: string, cambios: Partial<ParticipanteRepertorio>) => {
    const repertorio = repertorios.value.find(r => r.id === repertorioId);
    if (!repertorio) {
      throw new Error('Repertorio no encontrado');
    }

    const index = repertorio.participantes.findIndex(p => p.estudianteId === participanteId);
    if (index === -1) {
      throw new Error('Participante no encontrado en el repertorio');
    }

    const participantesActualizados = [...repertorio.participantes];
    participantesActualizados[index] = { ...participantesActualizados[index], ...cambios };

    await updateRepertoireItem(repertorioId, { participantes: participantesActualizados });
  };

  /**
   * Remover participante de un repertorio
   */
  const removeParticipant = async (repertorioId: string, userId: string) => {
    const repertorio = repertorios.value.find(r => r.id === repertorioId);
    if (!repertorio) {
      throw new Error('Repertorio no encontrado');
    }

    const participantesActualizados = repertorio.participantes.filter(p => p.estudianteId !== userId);
    await updateRepertoireItem(repertorioId, { participantes: participantesActualizados });
  };

  /**
   * Cargar métricas de progreso
   */
  const cargarMetricas = async (repertorioId: string) => {
    try {
      metricas.value = await repertorioService.obtenerMetricas(repertorioId);
    } catch (err) {
      console.error('Error cargando métricas:', err);
    }
  };

  /**
   * Eliminar repertorio (soft delete)
   */
  const eliminarRepertorio = async (id: string) => {
    await updateRepertoireItem(id, {
      estado: EstadoRepertorio.ARCHIVADO,
      auditoria: {
        activo: false,
        modificadoPor: useAuthStore().user?.uid || 'unknown',
        fechaModificacion: Timestamp.now(),
        version: (repertorioActual.value?.auditoria.version || 1) + 1,
        creadoPor: repertorioActual.value?.auditoria.creadoPor || 'unknown',
        fechaCreacion: repertorioActual.value?.auditoria.fechaCreacion || Timestamp.now()
      }
    });
  };

  /**
   * Aplicar filtros
   */
  const aplicarFiltros = (nuevosFiltros: FiltrosMontaje) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros };
  };

  /**
   * Limpiar filtros
   */
  const limpiarFiltros = () => {
    filtros.value = {};
  };

  /**
   * Buscar repertorios
   */
  const buscarRepertorios = async (termino: string) => {
    isLoading.value = true;
    try {
      return await repertorioService.buscar(termino);
    } catch (err) {
      error.value = 'Error en búsqueda: ' + (err as Error).message;
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Limpiar estado
   */
  const limpiarEstado = () => {
    repertorios.value = [];
    repertorioActual.value = null;
    metricas.value = null;
    error.value = null;
    filtros.value = {};
  };

  return {
    // Estado
    repertorios,
    repertorioActual,
    metricas,
    isLoading,
    error,
    filtros,
    
    // Getters
    repertoriosActivos,
    repertoriosPorEstado,
    repertoriosProximos,
    estadisticasGenerales,
    
    // Acciones
    cargarRepertorios,
    cargarRepertorio,
    createRepertoireItem,
    updateRepertoireItem,
    cambiarEstado,
    deleteRepertoireItem,
    addParticipant,
    updateParticipant,
    removeParticipant,
    cargarMetricas,
    eliminarRepertorio,
    aplicarFiltros,
    limpiarFiltros,
    buscarRepertorios,
    limpiarEstado
  };
});
