import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
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
  MontajeProject,
  ProjectMember,
  MontajeSettings,
} from '../types';
import { EstadoCompass, DificultadFrase, TipoInstrumento } from '../types';
import montajeService from '../service/montajeService';
import { teacherService } from '../service/teacherService';
import { useAuthStore } from '@/stores/auth';
import { permissionsService } from '../service/permissionsService';
import { MontajePermission } from '../types/permissions'; // Asumo que esta es la ruta correcta para MontajePermission
import { compassStateService } from '../service/compassStateService'; // Asumo que esta es la ruta correcta
// eslint-disable-next-line import/order
import { ActualizacionMasiva } from '../types/instrumentProgress'; // Asumo que esta es la ruta correcta

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
  const selectedWork = ref<Obra | null>(null);

  const currentProject = ref<MontajeProject | null>(null);
  const projects = ref<MontajeProject[]>([]);
  const isLoadingProjects = ref(false);
  
  // Estado para instrumentos del profesor actual
  const teacherInstruments = ref<TipoInstrumento[]>([]);
  const isLoadingInstruments = ref(false);
  const selectedInstrument = ref<TipoInstrumento | null>(null);
  
  // Estados de compases por instrumento
  const instrumentCompassStates = ref<EstadoCompassInstrumento[]>([]);
  const instrumentStatistics = ref<EstadisticasProgreso | null>(null);
  const isLoadingInstrumentStates = ref(false);
  const hasInstrumentStatePermission = ref(false);

  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const filtros = ref<FiltrosMontaje>({});
  const activeTab = ref<'obras' | 'planes' | 'evaluaciones' | 'analytics'>('obras');
  const searchQuery = ref('');
  const statusFilter = ref('');
  const difficultyFilter = ref('');
  const instrumentFilter = ref<TipoInstrumento | null>(null);

  // ================== GETTERS ==================
  const obrasActivasPorRepertorio = computed(
    () => (repertorioId: string) => obras.value.filter((obra) => obra.repertorioId === repertorioId),
  );

  const frasesActuales = computed(() =>
    frases.value.filter((f) => f.planAccionId === planAccion.value?.id),
  );

  const frasesCompletadas = computed(() =>
    frasesActuales.value.filter((f) => f.metadatos.progresoPorcentaje === 100),
  );

  const frasesPendientes = computed(() =>
    frasesActuales.value.filter((f) => f.metadatos.progresoPorcentaje < 100),
  );

  const frasesConDificultad = computed(() =>
    frasesActuales.value.filter((f) =>
      Object.values(f.metadatos.estadosCompases).some(
        (estado) => estado === EstadoCompass.CON_DIFICULTAD,
      ),
    ),
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

  // Getter para obras filtradas por instrumentos del maestro
  const obrasFiltradasPorMaestro = computed(() => {
    if (!teacherInstruments.value.length) return obras.value;
    
    return obras.value.filter(obra => {
      if (!obra.instruments || !Array.isArray(obra.instruments)) return false;
      
      // Verificar si al menos uno de los instrumentos del maestro está en la obra
      return obra.instruments.some(instrumento => 
        teacherInstruments.value.includes(instrumento.id as TipoInstrumento),
      );
    });
  });
  
  // Getter para verificar si hay compases con dificultad para el instrumento seleccionado
  const compassesDificultadPorInstrumento = computed(() => {
    if (!selectedInstrument.value) return [];
    
    return instrumentCompassStates.value
      .filter(estado => estado.estado === EstadoCompass.CON_DIFICULTAD)
      .map(estado => estado.numeroCompas)
      .sort((a, b) => a - b);
  });
  
  // Getter para estadísticas de progreso del instrumento seleccionado
  const estadisticasInstrumento = computed(() => instrumentStatistics.value);
  
  // Getter para verificar si el usuario puede actualizar estados por instrumento
  const puedeActualizarEstadosInstrumento = computed(() => hasInstrumentStatePermission.value);

  const estadisticasEvaluacion = computed(() => {
    const continuas = evaluacionesContinuas.value;
    const finales = evaluacionesFinales.value;

    return {
      totalEvaluacionesContinuas: continuas.length,
      totalEvaluacionesFinales: finales.length,
      promedioGeneral:
        continuas.reduce((sum, e) => sum + e.metadatos.porcentajeCumplimiento, 0) /
          continuas.length || 0,
      estudiantesEvaluados: [...new Set(continuas.map((e) => e.estudianteId))].length,
      criteriosMejorados: continuas.filter((e) => e.metadatos.porcentajeCumplimiento > 75).length,
    };
  });

  const notificacionesSinLeer = computed(() =>
    notificaciones.value.filter((n) => !n.metadatos.leida),
  );

  const calculateProjectProgress = (project: MontajeProject): number => {
    const totalDays = Math.ceil(
      (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24),
    );
    const elapsedDays = Math.ceil(
      (new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24),
    );
    
    return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  };

  const getProjectStats = computed(() => {
    if (!currentProject.value) return null;

    return {
      totalWorks: currentProject.value.works.length,
      totalMembers: currentProject.value.members.length,
      daysRemaining: Math.max(0, Math.ceil(
        (new Date(currentProject.value.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      )),
      progress: calculateProjectProgress(currentProject.value),
    };
  });

  // ================== ACCIONES DE PROYECTOS DE MONTAJE ==================

  const createMontajeProject = async (
    name: string,
    description: string,
    director: string,
    organization: string,
    season: string,
    startDate: string,
    endDate: string,
  ): Promise<string> => {
    isLoadingProjects.value = true;
    const authStore = useAuthStore();
    if (!authStore.user) throw new Error('Usuario no autenticado.');

    try {
      const newMember: ProjectMember = {
        id: authStore.user.uid,
        name: authStore.user.email || 'Sin nombre',
        email: authStore.user.email || 'unknown@example.com', // Assuming email is available
        role: 'director',
        instruments: [], // Or default instruments
        joinedAt: new Date().toISOString(),
        permissions: [], // Or default permissions
      };

      const newProject: Omit<MontajeProject, 'id' | 'createdAt' | 'updatedAt'> = {
        name,
        description,
        director,
        organization,
        season,
        startDate,
        endDate,
        status: 'planning',
        works: [],
        members: [newMember],
        settings: getDefaultSettings(),
        ownerId: authStore.user.uid,
      };

      const docId = await montajeService.createMontajeProject(newProject);
      
      const createdProject: MontajeProject = {
        ...newProject,
        id: docId,
        createdAt: new Date().toISOString(), // Placeholder, actual timestamp from service
        updatedAt: new Date().toISOString(),  // Placeholder, actual timestamp from service
      };

      projects.value.push(createdProject);
      currentProject.value = createdProject;
      
      return docId;
    } catch (error) {
      console.error('Error creando el proyecto de montaje:', error);
      throw error;
    } finally {
      isLoadingProjects.value = false;
    }
  };

  const loadMontajeProjects = async () => {
    isLoadingProjects.value = true;
    const authStore = useAuthStore();
    if (!authStore.user) {
      isLoadingProjects.value = false;
      return;
    }
    
    try {
      const userProjects = await montajeService.loadMontajeProjects(authStore.user.uid);
      projects.value = userProjects;
      
      if (projects.value.length > 0) {
        const lastProjectId = localStorage.getItem('montaje_current_project');
        const projectToSelect = projects.value.find(p => p.id === lastProjectId) || projects.value[0];
        selectMontajeProject(projectToSelect.id);
      }

    } catch (error) {
      console.error('Error cargando proyectos de montaje:', error);
    } finally {
      isLoadingProjects.value = false;
    }
  };

  const selectMontajeProject = (projectId: string) => {
    const project = projects.value.find(p => p.id === projectId);
    if (project) {
      currentProject.value = project;
      localStorage.setItem('montaje_current_project', projectId);
    }
  };

  const addMemberToMontajeProject = async (projectId: string, member: Omit<ProjectMember, 'id' | 'joinedAt'>) => {
    const project = projects.value.find(p => p.id === projectId);
    if (!project) return;

    const newMember: ProjectMember = {
      ...member,
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Idealmente usar UID de usuario real
      joinedAt: new Date().toISOString(),
    };

    project.members.push(newMember);
    await montajeService.saveMontajeProject(project);
  };

  const updateMontajeProjectSettings = async (projectId: string, settings: Partial<MontajeSettings>) => {
    const project = projects.value.find(p => p.id === projectId);
    if (!project) return;

    project.settings = { ...project.settings, ...settings };
    await montajeService.saveMontajeProject(project);
  };

  const saveMontajeProject = async (project: MontajeProject) => {
    try {
      await montajeService.saveMontajeProject(project);
      console.log('Project saved:', project.id);
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  };

  const getDefaultSettings = (): MontajeSettings => ({
    evaluationFrequency: 'weekly',
    autoReminders: true,
    reportGeneration: 'manual',
    exportFormats: ['pdf', 'excel'],
    integrations: {
      calendar: true,
      email: true,
      metronome: false,
      tuner: false,
    },
  });

  // ================== ACCIONES DE OBRAS ==================

  /**
   * Cargar obras de un repertorio
   */
  const cargarObras = async (repertorioId: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      const obrasResult = await montajeService.obtenerObras();
      const obrasDelRepertorio = obrasResult.filter(
        (obra) => obra.repertorioId === repertorioId && obra.auditoria?.activo !== false,
      );
      obras.value = obrasDelRepertorio;

      console.log('✅ Obras cargadas:', obrasDelRepertorio.length);
    } catch (err) {
      console.error('❌ Error cargando obras:', err);
      error.value = 'No se pudieron cargar las obras';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Cargar obras filtradas por instrumento del profesor
   * Esta función carga solo las obras que tienen instrumentos
   * asignados al profesor actual
   */
  const cargarObrasPorInstrumentoProfesor = async (repertorioId: string) => {
    try {
      const authStore = useAuthStore();
      if (!authStore.user?.uid) {
        throw new Error('Usuario no autenticado');
      }
      
      isLoading.value = true;
      error.value = null;
      
      // Primero cargar los instrumentos del profesor si no están cargados
      if (teacherInstruments.value.length === 0) {
        await cargarInstrumentosMaestro();
      }
      
      // Luego cargar todas las obras del repertorio especificado o todas si no hay repertorio
      const obrasResult = await montajeService.obtenerObras();
      // Filtramos por repertorio si se proporciona, y solo obras activas
      const obrasDelRepertorio = obrasResult.filter((obra) => {
        const coincideRepertorio = repertorioId ? obra.repertorioId === repertorioId : true;
        return coincideRepertorio && obra.auditoria?.activo !== false;
      });
      
      // Filtrar obras que contengan al menos uno de los instrumentos del profesor
      if (teacherInstruments.value.length > 0) {
        const obrasFiltradas = obrasDelRepertorio.filter(obra => {
          // Verificar si la obra tiene instrumentos que coinciden con los del profesor
          return obra.instrumentacion?.some((instrumento: string) => 
            teacherInstruments.value.includes(instrumento as TipoInstrumento),
          );
        });
        
        obras.value = obrasFiltradas;
        console.log(`✅ Obras filtradas por instrumentos del profesor: ${obrasFiltradas.length}`);
      } else {
        // Si el profesor no tiene instrumentos asignados, mostrar todas las obras
        obras.value = obrasDelRepertorio;
        console.log('⚠️ El profesor no tiene instrumentos asignados, mostrando todas las obras');
      }
    } catch (err) {
      console.error('❌ Error cargando obras por instrumento:', err);
      error.value = 'No se pudieron cargar las obras filtradas por instrumento';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Cargar instrumentos asignados al profesor
   */
  const cargarInstrumentosProfesor = async (userId: string) => {
    try {
      isLoadingInstruments.value = true;
      error.value = null;
      
      const instrumentos = await teacherService.getUserInstruments(userId);
      teacherInstruments.value = instrumentos;
      
      console.log(`✅ Instrumentos del profesor cargados: ${instrumentos.length}`, instrumentos);
      return instrumentos;
    } catch (err) {
      console.error('❌ Error cargando instrumentos del profesor:', err);
      error.value = 'No se pudieron cargar los instrumentos del profesor';
      throw err;
    } finally {
      isLoadingInstruments.value = false;
    }
  };

  /**
   * Cargar una obra específica
   */ 
  const cargarObra = async (obraId: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      console.log('🔍 Buscando obra en múltiples colecciones a través del servicio...');
      const obra = await montajeService.obtenerObraEnMultiplesColecciones(obraId);

      if (obra) {
        obraActual.value = obra;
        // También agregar a la lista si no está
        if (!obras.value.find((o) => o.id === obraId)) {
          obras.value.push(obra);
        }
        console.log('✅ Obra cargada:', obra?.titulo || obra?.title || obra?.nombre);
      } else {
        console.error('❌ Obra no encontrada en ninguna colección a través del servicio');
        error.value = 'Obra no encontrada';
      }
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
  const crearObra = async (obraData: Omit<Obra, 'id' | 'auditoria'>) => {
    try {
      isLoading.value = true;
      error.value = null;

      console.log('🔄 Creando obra con datos:', obraData);

      // Preparar datos completos con auditoría
      const authStore = useAuthStore();
      const datosCompletos: Omit<Obra, 'id'> = {
        ...obraData,
        auditoria: {
          creadoPor: authStore.user?.uid || 'unknown',
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
      const index = obras.value.findIndex((o) => o.id === obraId);
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
      obras.value = obras.value.filter((o) => o.id !== obraId);

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

  const selectWork = (work: Obra | null) => {
    selectedWork.value = work;
  };

  const clearSelectedWork = () => {
    selectedWork.value = null;
  };
  // ================== ACCIONES DE PLANES ==================

  /**
   * Cargar plan de acción de una obra
   */
  const cargarPlanAccion = async (obraId: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      console.log('🔍 Cargando plan de acción para obra:', obraId);
      const planData = await montajeService.obtenerPlanAccion(obraId);
      planAccion.value = planData;

      console.log('✅ Plan de acción cargado para obra:', obraId);
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
      };

      console.log('🔄 Creando plan de acción con datos:', datosCompletos);
      const planId = await montajeService.crearPlanAccion(planData.obraId, datosCompletos);

      // Cargar el plan creado
      const planCreado = await montajeService.obtenerPlanAccion(planData.obraId);
      if (planCreado) {
        planAccion.value = planCreado;
      }

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

      console.log('🔍 Cargando frases para plan:', planAccionId);
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
      };

      console.log('🔄 Creando frase con datos:', datosCompletos);
      const fraseId = await montajeService.crearFrase(fraseData.obraId, fraseData.planAccionId, datosCompletos);

      // Actualizar la lista de frases
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

  /**
   * Actualizar frase existente
   */
  const actualizarFrase = async (fraseId: string, datos: Partial<FraseMontaje>) => {
    try {
      isLoading.value = true;
      error.value = null;

      await montajeService.actualizarFrase(fraseId, datos);

      // Actualizar en el estado local
      const index = frases.value.findIndex((f) => f.id === fraseId);
      if (index !== -1) {
        frases.value[index] = { ...frases.value[index], ...datos };
      }

      if (fraseActual.value?.id === fraseId) {
        fraseActual.value = { ...fraseActual.value, ...datos };
      }

      console.log('✅ Frase actualizada:', fraseId);
    } catch (err) {
      console.error('❌ Error actualizando frase:', err);
      error.value = 'No se pudo actualizar la frase';
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
      console.log('🔍 Cargando evaluaciones continuas para obra:', obraId);
      const evaluacionesData = (await montajeService.obtenerEvaluaciones(
        obraId,
        'continua',
      )) as EvaluacionContinua[];
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
   * Cargar evaluaciones finales
   */
  const cargarEvaluacionesFinales = async (obraId: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      console.log('🔍 Cargando evaluaciones finales para obra:', obraId);
      const evaluacionesData = (await montajeService.obtenerEvaluaciones(
        obraId,
        'final',
      )) as EvaluacionFinal[];
      evaluacionesFinales.value = evaluacionesData;

      console.log('✅ Evaluaciones finales cargadas:', evaluacionesData.length);
    } catch (err) {
      console.error('❌ Error cargando evaluaciones finales:', err);
      error.value = 'No se pudieron cargar las evaluaciones finales';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Crear evaluación continua
   */
  const crearEvaluacionContinua = async (
    evaluacionData: Omit<EvaluacionContinua, 'id' | 'auditoria'>,
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      const authStore = useAuthStore();
      const datosCompletos: Omit<EvaluacionContinua, 'id'> = {
        ...evaluacionData,
        auditoria: {
          creadoPor: authStore.user?.uid || 'unknown',
          version: 1,
          activo: true,
        },
      };

      console.log('🔄 Creando evaluación continua con datos:', datosCompletos);
      const evaluacionId = await montajeService.crearEvaluacionContinua(evaluacionData.obraId, datosCompletos);

      // Actualizar la lista de evaluaciones
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

  /**
   * Crear evaluación final
   */
  const crearEvaluacionFinal = async (
    evaluacionData: Omit<EvaluacionFinal, 'id' | 'auditoria'>,
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      const authStore = useAuthStore();
      const datosCompletos: Omit<EvaluacionFinal, 'id'> = {
        ...evaluacionData,
        auditoria: {
          creadoPor: authStore.user?.uid || 'unknown',
          version: 1,
          activo: true,
        },
      };

      console.log('🔄 Creando evaluación final con datos:', datosCompletos);
      const evaluacionId = await montajeService.crearEvaluacionFinal(evaluacionData.obraId, datosCompletos);

      // Actualizar la lista de evaluaciones
      await cargarEvaluacionesFinales(evaluacionData.obraId);

      console.log('✅ Evaluación final creada con ID:', evaluacionId);
      return evaluacionId;
    } catch (err) {
      console.error('❌ Error creando evaluación final:', err);
      error.value = 'No se pudo crear la evaluación final';
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
      const notificacion = notificaciones.value.find((n) => n.id === notificacionId);
      if (notificacion) {
        notificacion.metadatos.leida = true;
      }

      console.log('✅ Notificación marcada como leída:', notificacionId);
    } catch (err) {
      console.error('❌ Error marcando notificación como leída:', err);
      throw err;
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const authStore = useAuthStore();
      if (!authStore.user?.uid) {
        console.warn('⚠️ Usuario no autenticado para marcar notificaciones como leídas');
        return;
      }

      for (const notification of notificaciones.value) {
        if (!notification.metadatos.leida) {
          await montajeService.marcarNotificacionLeida(notification.id);
          notification.metadatos.leida = true;
        }
      }
      console.log('✅ Todas las notificaciones marcadas como leídas');
    } catch (err) {
      console.error('❌ Error marcando todas las notificaciones como leídas:', err);
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
    razon: string = '',
  ) => {
    try {
      const authStore = useAuthStore();
      const estadoAnterior =
        estadosCompases.value.get(compassNumber)?.estado || EstadoCompass.SIN_TRABAJAR;

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
      };

      console.log('🔄 Aplicando cambio de estado:', cambio);
      await montajeService.cambiarEstadoCompass(obraActual.value?.id || '', compassNumber, nuevoEstado, cambio);
      
      // Recargar estados de compases para obtener el estado más reciente de la obra
      await cargarEstadosCompases(obraActual.value?.id || '');

      // Recalcular progreso de la obra
      if (obraActual.value) {
        const totalCompasesObra = obraActual.value.totalCompases;
        let compasesLogrados = 0;
        let compasesDominados = 0;

        estadosCompases.value.forEach(estadoDetalle => {
          // Considerar el estado más avanzado entre todos los instrumentos para el progreso general
          const estadosInstrumentos = Object.values(estadoDetalle.instrumentos);
          if (estadosInstrumentos.includes(EstadoCompass.DOMINADO)) {
            compasesDominados++;
          } else if (estadosInstrumentos.includes(EstadoCompass.LOGRADO)) {
            compasesLogrados++;
          }
        });

        // Definir el progreso como el porcentaje de compases logrados o dominados
        const nuevoProgresoPorcentaje = totalCompasesObra > 0
          ? Math.round(((compasesLogrados + compasesDominados) / totalCompasesObra) * 100)
          : 0;

        // Actualizar la obra en Firebase con el nuevo progreso
        await montajeService.actualizarObra(obraActual.value.id, {
          metadatos: {
            ...obraActual.value.metadatos,
            progresoPorcentaje: nuevoProgresoPorcentaje,
          },
        });

        // Actualizar el estado local de obraActual
        obraActual.value = {
          ...obraActual.value,
          metadatos: {
            ...obraActual.value.metadatos,
            progresoPorcentaje: nuevoProgresoPorcentaje,
          },
        };
      }

      console.log('✅ Estado de compás cambiado y progreso de obra actualizado:', compassNumber, nuevoEstado);
    } catch (err) {
      console.error('❌ Error cambiando estado de compás:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Cargar estados de compases de una obra
   */
  const cargarEstadosCompases = async (obraId: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      // Cargar estados desde el servicio
      const estados = await montajeService.obtenerEstadosCompases(obraId);
      estadosCompases.value = new Map(estados);

      console.log('✅ Estados de compases cargados:', estados.length);
    } catch (err) {
      console.error('❌ Error cargando estados de compases:', err);
      error.value = 'No se pudieron cargar los estados de compases';
      throw err;
    } finally {
      isLoading.value = false;
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

  const setActiveTab = (tab: 'obras' | 'planes' | 'evaluaciones' | 'analytics') => {
    activeTab.value = tab;
  };

  // ================== UTILIDADES PRIVADAS ==================

  /**
   * Crear objeto de instrumentos con estado por defecto
   */
  const crearEstadoInstrumentos = (estadoDefecto: EstadoCompass = EstadoCompass.SIN_TRABAJAR) => {
    return Object.values(TipoInstrumento).reduce(
      (acc, instrumento) => {
        acc[instrumento] = estadoDefecto;
        return acc;
      },
      {} as Record<TipoInstrumento, EstadoCompass>,
    );
  };

  // ================== ACCIONES PARA PROGRESO POR INSTRUMENTO Y RBAC ==================

  

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
    currentProject,
    projects,
    isLoadingProjects,
    activeTab,
    selectedWork,
    teacherInstruments,
    isLoadingInstruments,
    instrumentFilter,
    
    // Estado para progreso por instrumento
    selectedInstrument,
    instrumentCompassStates,
    instrumentStatistics,
    isLoadingInstrumentStates,
    hasInstrumentStatePermission,

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
    getProjectStats,
    obrasFiltradasPorMaestro,
    compassesDificultadPorInstrumento,
    estadisticasInstrumento,
    puedeActualizarEstadosInstrumento,

    // Acciones principales
    cargarObras,
    cargarObrasPorInstrumentoProfesor,
    cargarObra,
    crearObra,
    actualizarObra,
    eliminarObra,
    // Definimos aliases para compatibilidad con código existente
    selectWork: cargarObra,
    clearSelectedWork: () => { obraActual.value = null; },

    // Acciones de proyectos de montaje
    createMontajeProject,
    loadMontajeProjects,
    selectMontajeProject,
    addMemberToMontajeProject,
    updateMontajeProjectSettings,
    saveMontajeProject,
    getDefaultSettings,

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
    markAllNotificationsAsRead,
    // Acciones de estados
    cambiarEstadoCompass,
    cargarEstadosCompases,

    // Utilidades
    limpiarEstado,
    actualizarFiltros,
    setActiveTab,
    
    // Acciones para gestión de progreso por instrumento con RBAC
    cargarInstrumentosProfesor,
    async cargarObrasParaMaestro() {
      // TODO: Implementar lógica para cargar obras específicas para el maestro
      console.log('Cargando obras para maestro...');
    },
    seleccionarInstrumento: (instrumento: TipoInstrumento | null) => {
      console.log('Seleccionando instrumento:', instrumento);
      selectedInstrument.value = instrumento;
    },
    actualizarEstadoCompassInstrumento: async (compassNumber: number, nuevoEstado: EstadoCompass, instrumento: TipoInstrumento, obraId: string, maestroId: string) => {
      console.log('Actualizando estado de compás por instrumento:', { compassNumber, nuevoEstado, instrumento, obraId, maestroId });
      // Lógica para actualizar el estado del compás para un instrumento específico
      // Esto debería interactuar con compassStateService
    },
    actualizarCompassesMasivamente,
    verificarPermisosReportesAgregados,

    // Utilidades privadas
    crearEstadoInstrumentos,
  };
});
