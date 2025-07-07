// src/modulos/Montaje/service/montajeService.ts

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  arrayUnion,
  increment,
  runTransaction,
  onSnapshot,
  startAfter,
  endBefore
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import type { 
  Obra,
  PlanAccion,
  FraseMontaje,
  EstadoCompassDetalle,
  ObservacionPedagogica,
  EvaluacionContinua,
  EvaluacionFinal,
  NotificacionMontaje,
  CambioEstadoCompass,
  Repertorio,
  ParticipanteRepertorio,
  CreateWorkInput,
  CreateEvaluationInput,
  FiltrosMontaje,
  EstadoObra,
  DificultadFrase,
  TipoInstrumento
} from '../types';
import { EstadoCompass } from '../types';

/**
 * Servicio profesional para gestión de montajes en Firebase
 * Incluye manejo de errores, transacciones, paginación y caché
 */
class MontajeService {
  private obrasCollection = 'montaje-obras';
  private repertoriosCollection = 'montaje-repertorios';
  private planesCollection = 'montaje-planes';
  private frasesCollection = 'montaje-frases';
  private estadosCollection = 'montaje-estados-compases';
  private evaluacionesCollection = 'montaje-evaluaciones';
  private notificacionesCollection = 'montaje-notificaciones';
  private observacionesCollection = 'montaje-observaciones';
  
  // Cache simple para mejorar performance
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos

  // ================== GESTIÓN DE CACHE ==================

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // ================== GESTIÓN DE REPERTORIOS ==================

  /**
   * Obtener todos los repertorios activos
   */
  async obtenerRepertorios(): Promise<Repertorio[]> {
    try {
      const cacheKey = 'repertorios-activos';
      const cached = this.getCachedData<Repertorio[]>(cacheKey);
      if (cached) return cached;

      const q = query(
        collection(db, this.repertoriosCollection),
        where('auditoria.activo', '==', true),
        orderBy('fechaCreacion', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const repertorios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Repertorio));

      this.setCachedData(cacheKey, repertorios);
      return repertorios;
    } catch (error) {
      console.error('Error obteniendo repertorios:', error);
      throw new Error('No se pudieron cargar los repertorios');
    }
  }

  /**
   * Crear nuevo repertorio
   */
  async crearRepertorio(datos: Omit<Repertorio, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.repertoriosCollection), datos);
      this.invalidateCache('repertorios');
      return docRef.id;
    } catch (error) {
      console.error('Error creando repertorio:', error);
      throw new Error('No se pudo crear el repertorio');
    }
  }

  // ================== GESTIÓN DE OBRAS ==================

  /**
   * Obtener obras de un repertorio con filtros avanzados
   */
  async obtenerObras(repertorioId: string, filtros?: FiltrosMontaje): Promise<Obra[]> {
    try {
      const cacheKey = `obras-${repertorioId}-${JSON.stringify(filtros)}`;
      const cached = this.getCachedData<Obra[]>(cacheKey);
      if (cached) return cached;

      let q = query(
        collection(db, this.obrasCollection),
        where('repertorioId', '==', repertorioId),
        where('auditoria.activo', '==', true)
      );

      // Aplicar filtros adicionales
      if (filtros?.estado) {
        q = query(q, where('estado', '==', filtros.estado));
      }

      if (filtros?.dificultad) {
        q = query(q, where('metadatos.complejidadGeneral', '==', filtros.dificultad));
      }

      const snapshot = await getDocs(q);
      let obras = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Obra));

      // Filtros adicionales que no se pueden hacer en Firestore
      if (filtros?.instrumento) {
        obras = obras.filter(obra => 
          obra.instrumentosRequeridos.some(inst => inst.instrumentoId === filtros.instrumento)
        );
      }

      if (filtros?.tags && filtros.tags.length > 0) {
        obras = obras.filter(obra => 
          filtros.tags!.some(tag => obra.metadatos?.tags?.includes(tag))
        );
      }

      // Ordenar por fecha de creación descendente
      obras.sort((a, b) => {
        const dateA = a.fechaCreacion?.toMillis?.() || 0;
        const dateB = b.fechaCreacion?.toMillis?.() || 0;
        return dateB - dateA;
      });

      this.setCachedData(cacheKey, obras);
      return obras;
    } catch (error) {
      console.error('Error obteniendo obras:', error);
      throw new Error('No se pudieron cargar las obras');
    }
  }

  /**
   * Obtener obra por ID
   */
  async obtenerObra(id: string): Promise<Obra | null> {
    try {
      const cacheKey = `obra-${id}`;
      const cached = this.getCachedData<Obra>(cacheKey);
      if (cached) return cached;

      const docRef = doc(db, this.obrasCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const obra = {
          id: docSnap.id,
          ...docSnap.data()
        } as Obra;
        
        this.setCachedData(cacheKey, obra);
        return obra;
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo obra:', error);
      throw new Error('No se pudo cargar la obra');
    }
  }
  /**
   * Crear nueva obra con validaciones completas
   */
  async crearObra(datos: Omit<Obra, 'id'>): Promise<string> {
    try {
      // Validaciones básicas
      if (!datos.titulo?.trim()) {
        throw new Error('El título de la obra es requerido');
      }

      if (!datos.compositor?.trim()) {
        throw new Error('El compositor es requerido');
      }

      if (!datos.repertorioId?.trim()) {
        throw new Error('El repertorio es requerido');
      }

      // Preparar datos con valores por defecto
      const obraCompleta: Omit<Obra, 'id'> = {
        ...datos,
        estado: datos.estado || EstadoObra.PENDIENTE,
        metadatos: {
          complejidadGeneral: datos.metadatos?.complejidadGeneral || DificultadFrase.MEDIO,
          totalCompases: datos.metadatos?.totalCompases || 0,
          frasesDefinidas: datos.metadatos?.frasesDefinidas || 0,
          frasesCompletadas: datos.metadatos?.frasesCompletadas || 0,
          progresoPorcentaje: 0,
          horasEnsayoEstimadas: datos.metadatos?.horasEnsayoEstimadas || 0,
          horasEnsayoReales: 0,
          ...datos.metadatos
        },
        instrumentosRequeridos: datos.instrumentosRequeridos || [],
        fechaCreacion: datos.fechaCreacion || Timestamp.now(),
        auditoria: {
          ...datos.auditoria,
          fechaCreacion: datos.auditoria?.fechaCreacion || Timestamp.now(),
          version: 1,
          activo: true
        }
      };

      const docRef = await addDoc(collection(db, this.obrasCollection), obraCompleta);
      
      // Invalidar cache
      this.invalidateCache('obras');
      this.invalidateCache(datos.repertorioId);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creando obra:', error);
      throw new Error(`No se pudo crear la obra: ${error.message}`);
    }
  }

  /**
   * Actualizar obra con transacciones
   */
  async actualizarObra(id: string, datos: Partial<Obra>): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, this.obrasCollection, id);
        const docSnap = await transaction.get(docRef);
        
        if (!docSnap.exists()) {
          throw new Error('La obra no existe');
        }

        const obraActual = docSnap.data() as Obra;
        
        // Actualizar datos con versionado
        const datosActualizados = {
          ...datos,
          'auditoria.fechaModificacion': Timestamp.now(),
          'auditoria.version': increment(1)
        };

        // Calcular progreso automáticamente si se actualizan frases
        if (datos.metadatos?.frasesCompletadas !== undefined || datos.metadatos?.frasesDefinidas !== undefined) {
          const frasesDefinidas = datos.metadatos?.frasesDefinidas ?? obraActual.metadatos.frasesDefinidas;
          const frasesCompletadas = datos.metadatos?.frasesCompletadas ?? obraActual.metadatos.frasesCompletadas;
          
          if (frasesDefinidas > 0) {
            datosActualizados['metadatos.progresoPorcentaje'] = Math.round((frasesCompletadas / frasesDefinidas) * 100);
          }
        }

        transaction.update(docRef, datosActualizados);
      });

      // Invalidar cache
      this.invalidateCache('obras');
      this.invalidateCache(`obra-${id}`);
      
    } catch (error) {
      console.error('Error actualizando obra:', error);
      throw new Error(`No se pudo actualizar la obra: ${error.message}`);
    }
  }

  /**
   * Eliminar obra (lógicamente)
   */
  async eliminarObra(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.obrasCollection, id);
      await updateDoc(docRef, {
        'auditoria.activo': false,
        'auditoria.fechaModificacion': Timestamp.now()
      });

      // Invalidar cache
      this.invalidateCache('obras');
      this.invalidateCache(`obra-${id}`);
      
    } catch (error) {
      console.error('Error eliminando obra:', error);
      throw new Error('No se pudo eliminar la obra');
    }
  }

  // ================== GESTIÓN DE EVALUACIONES ==================

  /**
   * Crear evaluación con datos completos
   */
  async crearEvaluacion(datos: CreateEvaluationInput): Promise<string> {
    try {
      // Validar datos requeridos
      if (!datos.estudianteId || !datos.obraId || !datos.maestroEvaluadorId) {
        throw new Error('Datos incompletos para la evaluación');
      }

      const evaluacion: Omit<EvaluacionContinua, 'id'> = {
        estudianteId: datos.estudianteId,
        obraId: datos.workId || datos.obraId,
        maestroEvaluadorId: datos.maestroEvaluadorId,
        fecha: datos.fecha ? Timestamp.fromDate(datos.fecha) : Timestamp.now(),
        tipo: datos.tipo || 'continua',
        criterios: datos.criterios || {},
        puntuacionGeneral: datos.score || 0,
        comentarios: datos.comments || datos.comentarios || '',
        fortalezas: [],
        areasAMejorar: [],
        recomendaciones: datos.recomendaciones || [],
        objetivosProximaSesion: [],
        metadatos: {
          duracionEvaluacion: datos.tiempoSesion || 0,
          tiempoPreparacion: 0,
          condicionesEvaluacion: '',
          porcentajeCumplimiento: datos.score || 0,
          ...datos.metadatos
        },
        auditoria: {
          creadoPor: datos.maestroEvaluadorId,
          fechaCreacion: Timestamp.now(),
          version: 1,
          activo: true
        }
      };

      const docRef = await addDoc(collection(db, this.evaluacionesCollection), evaluacion);
      
      // Invalidar cache relacionado
      this.invalidateCache('evaluaciones');
      this.invalidateCache(datos.estudianteId);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creando evaluación:', error);
      throw new Error(`No se pudo crear la evaluación: ${error.message}`);
    }
  }

  /**
   * Obtener evaluaciones de un estudiante
   */
  async obtenerEvaluacionesEstudiante(estudianteId: string, obraId?: string): Promise<EvaluacionContinua[]> {
    try {
      let q = query(
        collection(db, this.evaluacionesCollection),
        where('estudianteId', '==', estudianteId),
        orderBy('fecha', 'desc')
      );

      if (obraId) {
        q = query(q, where('obraId', '==', obraId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EvaluacionContinua));
    } catch (error) {
      console.error('Error obteniendo evaluaciones:', error);
      throw new Error('No se pudieron cargar las evaluaciones');
    }
  }

  // ================== GESTIÓN DE NOTIFICACIONES ==================

  /**
   * Crear notificación
   */
  async crearNotificacion(notificacion: Omit<NotificacionMontaje, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.notificacionesCollection), notificacion);
      this.invalidateCache('notificaciones');
      return docRef.id;
    } catch (error) {
      console.error('Error creando notificación:', error);
      throw new Error('No se pudo crear la notificación');
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async obtenerNotificaciones(destinatarioId: string, limit?: number): Promise<NotificacionMontaje[]> {
    try {
      const cacheKey = `notificaciones-${destinatarioId}`;
      const cached = this.getCachedData<NotificacionMontaje[]>(cacheKey);
      if (cached) return cached;

      let q = query(
        collection(db, this.notificacionesCollection),
        where('destinatarioId', '==', destinatarioId),
        orderBy('fechaCreacion', 'desc')
      );

      if (limit) {
        q = query(q, limit(limit));
      }

      const snapshot = await getDocs(q);
      const notificaciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NotificacionMontaje));

      this.setCachedData(cacheKey, notificaciones);
      return notificaciones;
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      throw new Error('No se pudieron cargar las notificaciones');
    }
  }

  /**
   * Marcar notificación como leída
   */
  async marcarNotificacionLeida(notificacionId: string): Promise<void> {
    try {
      const docRef = doc(db, this.notificacionesCollection, notificacionId);
      await updateDoc(docRef, {
        'metadatos.leida': true,
        'metadatos.fechaLectura': Timestamp.now()
      });

      this.invalidateCache('notificaciones');
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw new Error('No se pudo marcar la notificación como leída');
    }
  }

  // ================== UTILIDADES Y VALIDACIONES ==================

  /**
   * Validar datos de obra antes de crear/actualizar
   */
  private validarDatosObra(datos: Partial<Obra>): void {
    if (!datos.titulo?.trim()) {
      throw new Error('El título de la obra es requerido');
    }

    if (!datos.compositor?.trim()) {
      throw new Error('El compositor es requerido');
    }

    if (!datos.repertorioId?.trim()) {
      throw new Error('El repertorio es requerido');
    }

    if (datos.duracionEstimada !== undefined && datos.duracionEstimada <= 0) {
      throw new Error('La duración estimada debe ser mayor a 0');
    }

    if (datos.metadatos?.totalCompases !== undefined && datos.metadatos.totalCompases < 0) {
      throw new Error('El número de compases no puede ser negativo');
    }
  }

  /**
   * Obtener estadísticas de progreso de un repertorio
   */
  async obtenerEstadisticasRepertorio(repertorioId: string): Promise<{
    totalObras: number;
    obrasCompletadas: number;
    progresoPorcentaje: number;
    horasEnsayoTotal: number;
    distribucianDificultad: Record<DificultadFrase, number>;
    distribucianEstado: Record<EstadoObra, number>;
  }> {
    try {
      const obras = await this.obtenerObras(repertorioId);
      
      const stats = {
        totalObras: obras.length,
        obrasCompletadas: obras.filter(o => o.estado === EstadoObra.PRESENTADA || o.estado === EstadoObra.LISTA).length,
        progresoPorcentaje: 0,
        horasEnsayoTotal: obras.reduce((sum, obra) => sum + (obra.metadatos.horasEnsayoReales || 0), 0),
        distribucianDificultad: {} as Record<DificultadFrase, number>,
        distribucianEstado: {} as Record<EstadoObra, number>
      };

      // Calcular progreso promedio
      if (obras.length > 0) {
        const progresoTotal = obras.reduce((sum, obra) => sum + obra.metadatos.progresoPorcentaje, 0);
        stats.progresoPorcentaje = Math.round(progresoTotal / obras.length);
      }

      // Distribución por dificultad
      Object.values(DificultadFrase).forEach(dif => {
        stats.distribucianDificultad[dif] = obras.filter(o => o.metadatos.complejidadGeneral === dif).length;
      });

      // Distribución por estado
      Object.values(EstadoObra).forEach(estado => {
        stats.distribucianEstado[estado] = obras.filter(o => o.estado === estado).length;
      });

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw new Error('No se pudieron obtener las estadísticas del repertorio');
    }
  }

  /**
   * Limpiar cache manualmente
   */
  limpiarCache(): void {
    this.cache.clear();
  }
  /**
   * Obtener estado del cache
   */
  obtenerEstadoCache(): { tamaño: number; entradas: string[] } {
    return {
      tamaño: this.cache.size,
      entradas: Array.from(this.cache.keys())    };
  }
}

export const montajeService = new MontajeService();

  /**
   * Eliminar obra (lógicamente)
   */
  async eliminarObra(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.obrasCollection, id);
      await updateDoc(docRef, {
        'auditoria.activo': false,
        'auditoria.fechaModificacion': Timestamp.now()
      });
    } catch (error) {
      console.error('Error eliminando obra:', error);
      throw new Error('No se pudo eliminar la obra');
    }
  }

  // ================== GESTIÓN DE PLANES DE ACCIÓN ==================

  /**
   * Obtener plan de acción de una obra
   */  async obtenerPlanAccion(obraId: string): Promise<PlanAccion | null> {
    try {
      // Query for obra plan - filter in memory to avoid composite index
      const q = query(
        collection(db, this.planesCollection),
        where('obraId', '==', obraId)
      );
      
      const snapshot = await getDocs(q);
      
      // Filter active plans in memory
      const activePlans = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PlanAccion))
        .filter(plan => plan.auditoria?.activo === true);
      
      return activePlans.length > 0 ? activePlans[0] : null;
    } catch (error) {
      console.error('Error obteniendo plan de acción:', error);
      throw new Error('No se pudo cargar el plan de acción');
    }
  }

  /**
   * Crear plan de acción
   */
  async crearPlanAccion(datos: Omit<PlanAccion, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.planesCollection), datos);
      return docRef.id;
    } catch (error) {
      console.error('Error creando plan de acción:', error);
      throw new Error('No se pudo crear el plan de acción');
    }
  }

  /**
   * Actualizar plan de acción
   */
  async actualizarPlanAccion(id: string, datos: Partial<PlanAccion>): Promise<void> {
    try {
      const docRef = doc(db, this.planesCollection, id);
      await updateDoc(docRef, {
        ...datos,
        'auditoria.fechaModificacion': Timestamp.now()
      });
    } catch (error) {
      console.error('Error actualizando plan de acción:', error);
      throw new Error('No se pudo actualizar el plan de acción');
    }
  }

  // ================== GESTIÓN DE FRASES ==================

  /**
   * Obtener frases de un plan de acción
   */  async obtenerFrases(planAccionId: string): Promise<FraseMontaje[]> {
    try {
      // Query for plan phrases - filter and sort in memory to avoid composite index
      const q = query(
        collection(db, this.frasesCollection),
        where('planAccionId', '==', planAccionId)
      );
      
      const snapshot = await getDocs(q);
      const frases = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FraseMontaje));
      
      // Filter active phrases and sort in memory
      return frases
        .filter(frase => frase.auditoria?.activo === true)
        .sort((a, b) => {
          // First sort by priority (desc), then by compassInicio (asc)
          if (a.prioridad !== b.prioridad) {
            return (b.prioridad || 0) - (a.prioridad || 0);
          }
          return (a.compassInicio || 0) - (b.compassInicio || 0);
        });
    } catch (error) {
      console.error('Error obteniendo frases:', error);
      throw new Error('No se pudieron cargar las frases');
    }
  }

  /**
   * Crear nueva frase
   */
  async crearFrase(datos: Omit<FraseMontaje, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.frasesCollection), datos);
      
      // Actualizar contador de frases en el plan de acción
      const planRef = doc(db, this.planesCollection, datos.planAccionId);
      await updateDoc(planRef, {
        'metadatos.totalFrases': increment(1),
        'metadatos.totalCompases': increment(datos.compassFin - datos.compassInicio + 1)
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creando frase:', error);
      throw new Error('No se pudo crear la frase');
    }
  }

  /**
   * Actualizar frase
   */
  async actualizarFrase(id: string, datos: Partial<FraseMontaje>): Promise<void> {
    try {
      const docRef = doc(db, this.frasesCollection, id);
      await updateDoc(docRef, {
        ...datos,
        'auditoria.fechaModificacion': Timestamp.now()
      });
    } catch (error) {
      console.error('Error actualizando frase:', error);
      throw new Error('No se pudo actualizar la frase');
    }
  }

  // ================== GESTIÓN DE ESTADOS DE COMPASES ==================

  /**
   * Obtener estados de compases para una frase
   */
  async obtenerEstadosCompases(fraseId: string): Promise<EstadoCompassDetalle[]> {
    try {
      const q = query(
        collection(db, this.estadosCollection),
        where('fraseId', '==', fraseId),
        orderBy('compassNumber', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data()
      } as EstadoCompassDetalle));
    } catch (error) {
      console.error('Error obteniendo estados de compases:', error);
      throw new Error('No se pudieron cargar los estados de compases');
    }
  }

  /**
   * Cambiar estado de un compás
   */
  async cambiarEstadoCompass(
    compassNumber: number, 
    nuevoEstado: EstadoCompass,
    cambio: CambioEstadoCompass
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Crear o actualizar el estado del compás
      const estadoRef = doc(db, this.estadosCollection, `compass-${compassNumber}`);
      batch.set(estadoRef, {
        compassNumber,
        estado: nuevoEstado,
        fechaUltimaActualizacion: Timestamp.now(),
        maestroActualizador: cambio.maestroId,
        observaciones: cambio.observaciones || '',
        tiempoTrabajado: increment(5), // Incrementar 5 minutos por defecto
        intentosRealizados: increment(1),
        auditoria: {
          historialCambios: arrayUnion(cambio)
        }
      }, { merge: true });
      
      // Crear notificación del cambio
      const notificacionRef = doc(collection(db, this.notificacionesCollection));
      batch.set(notificacionRef, {
        tipo: 'cambio_estado',
        titulo: `Estado de compás ${compassNumber} actualizado`,
        mensaje: `El compás ${compassNumber} cambió a estado: ${nuevoEstado}`,
        fechaCreacion: Timestamp.now(),
        remitenteId: cambio.maestroId,
        destinatarioId: 'todos', // Se filtrarán por permisos
        entidadRelacionada: {
          tipo: 'compass',
          id: `compass-${compassNumber}`
        },
        prioridad: 'media',
        metadatos: {
          leida: false,
          accionRequerida: nuevoEstado === EstadoCompass.CON_DIFICULTAD
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error cambiando estado de compás:', error);
      throw new Error('No se pudo cambiar el estado del compás');
    }
  }

  // ================== GESTIÓN DE EVALUACIONES ==================

  /**
   * Crear evaluación continua
   */
  async crearEvaluacionContinua(datos: Omit<EvaluacionContinua, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.evaluacionesCollection), {
        ...datos,
        tipo: 'continua'
      });
      
      // Crear notificación de nueva evaluación
      await this.crearNotificacion({
        tipo: 'evaluacion',
        titulo: 'Nueva evaluación continua registrada',
        mensaje: `Se registró una evaluación para el estudiante`,
        fechaCreacion: Timestamp.now(),
        destinatarioId: datos.estudianteId,
        remitenteId: datos.maestroEvaluadorId,
        entidadRelacionada: {
          tipo: 'evaluacion',
          id: docRef.id
        },
        prioridad: 'media',
        metadatos: {
          leida: false,
          accionRequerida: false
        }
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creando evaluación continua:', error);
      throw new Error('No se pudo crear la evaluación continua');
    }
  }
  /**
   * Obtener evaluaciones continuas
   */
  async obtenerEvaluacionesContinuas(obraId: string): Promise<EvaluacionContinua[]> {
    try {
      // Query for obra evaluations - filter and sort in memory to avoid composite index
      const q = query(
        collection(db, this.evaluacionesCollection),
        where('obraId', '==', obraId)
      );
      
      const snapshot = await getDocs(q);
      const evaluaciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EvaluacionContinua));
      
      // Filter by type and sort in memory
      return evaluaciones
        .filter(evaluacion => evaluacion.tipo === 'continua')
        .sort((a, b) => {
          const dateA = a.fecha?.toMillis?.() || 0;
          const dateB = b.fecha?.toMillis?.() || 0;
          return dateB - dateA; // desc order
        });
    } catch (error) {
      console.error('Error obteniendo evaluaciones continuas:', error);
      throw new Error('No se pudieron cargar las evaluaciones continuas');
    }
  }

  /**
   * Crear evaluación final
   */
  async crearEvaluacionFinal(datos: Omit<EvaluacionFinal, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.evaluacionesCollection), {
        ...datos,
        tipo: 'final'
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creando evaluación final:', error);
      throw new Error('No se pudo crear la evaluación final');
    }
  }

  // ================== GESTIÓN DE OBSERVACIONES ==================

  /**
   * Crear observación pedagógica
   */
  async crearObservacion(datos: Omit<ObservacionPedagogica, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.observacionesCollection), datos);
      
      // Crear notificación de nueva observación
      await this.crearNotificacion({
        tipo: 'nueva_observacion',
        titulo: 'Nueva observación pedagógica',
        mensaje: `Se agregó una observación: ${datos.tipo}`,
        fechaCreacion: Timestamp.now(),
        destinatarioId: 'todos', // Se filtrará por permisos
        remitenteId: datos.autorId,        entidadRelacionada: {
          tipo: 'frase',
          id: docRef.id
        },
        prioridad: datos.prioridad === 'critica' ? 'urgente' : 'media',
        metadatos: {
          leida: false,
          accionRequerida: datos.prioridad === 'critica'
        }
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creando observación:', error);
      throw new Error('No se pudo crear la observación');
    }
  }

  /**
   * Obtener observaciones
   */  async obtenerObservaciones(filtros: {
    obraId?: string;
    fraseId?: string;
    tipo?: string;
    resuelto?: boolean;
  }): Promise<ObservacionPedagogica[]> {
    try {
      // Start with base collection
      let q = query(collection(db, this.observacionesCollection));
      
      // Apply primary filter if provided
      if (filtros.obraId) {
        q = query(q, where('obraId', '==', filtros.obraId));
      } else if (filtros.fraseId) {
        q = query(q, where('fraseId', '==', filtros.fraseId));
      }
      
      // Get documents and filter/sort in memory to avoid composite indexes
      const snapshot = await getDocs(q);
      let observaciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ObservacionPedagogica));
      
      // Apply additional filters in memory
      if (filtros.fraseId && !filtros.obraId) {
        // fraseId filter already applied above
      } else if (filtros.fraseId && filtros.obraId) {
        observaciones = observaciones.filter(obs => obs.fraseId === filtros.fraseId);
      }
      
      if (filtros.resuelto !== undefined) {
        observaciones = observaciones.filter(obs => obs.metadatos?.resuelto === filtros.resuelto);
      }
      
      // Sort by creation date in memory
      return observaciones.sort((a, b) => {
        const dateA = a.fechaCreacion?.toMillis?.() || 0;
        const dateB = b.fechaCreacion?.toMillis?.() || 0;
        return dateB - dateA; // desc order
      });
    } catch (error) {
      console.error('Error obteniendo observaciones:', error);
      throw new Error('No se pudieron cargar las observaciones');
    }
  }

  // ================== GESTIÓN DE NOTIFICACIONES ==================

  /**
   * Crear notificación
   */
  async crearNotificacion(datos: Omit<NotificacionMontaje, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.notificacionesCollection), datos);
      return docRef.id;
    } catch (error) {
      console.error('Error creando notificación:', error);
      throw new Error('No se pudo crear la notificación');
    }
  }
  /**
   * Obtener notificaciones de un usuario
   */
  async obtenerNotificaciones(userId: string): Promise<NotificacionMontaje[]> {
    try {
      // Query for user-specific notifications
      const userQuery = query(
        collection(db, this.notificacionesCollection),
        where('destinatarioId', '==', userId),
        orderBy('fechaCreacion', 'desc'),
        limit(25)
      );
      
      // Query for general notifications
      const generalQuery = query(
        collection(db, this.notificacionesCollection),
        where('destinatarioId', '==', 'todos'),
        orderBy('fechaCreacion', 'desc'),
        limit(25)
      );
      
      // Execute both queries
      const [userSnapshot, generalSnapshot] = await Promise.all([
        getDocs(userQuery),
        getDocs(generalQuery)
      ]);
      
      // Combine and sort results
      const userNotifications = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NotificacionMontaje));
      
      const generalNotifications = generalSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NotificacionMontaje));
      
      const allNotifications = [...userNotifications, ...generalNotifications];
      
      // Sort by date and limit to 50
      return allNotifications
        .sort((a, b) => {
          const dateA = a.fechaCreacion instanceof Date ? a.fechaCreacion : a.fechaCreacion.toDate();
          const dateB = b.fechaCreacion instanceof Date ? b.fechaCreacion : b.fechaCreacion.toDate();
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 50);
        
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      throw new Error('No se pudieron cargar las notificaciones');
    }
  }

  /**
   * Marcar notificación como leída
   */
  async marcarNotificacionLeida(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.notificacionesCollection, id);
      await updateDoc(docRef, {
        'metadatos.leida': true,
        fechaLeida: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw new Error('No se pudo marcar la notificación como leída');
    }
  }

  // ================== UTILIDADES ==================

  /**
   * Operación en lote para múltiples cambios
   */
  async operacionEnLote(operaciones: Array<{
    collection: string;
    operation: 'create' | 'update' | 'delete';
    id?: string;
    data: any;
  }>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      operaciones.forEach(op => {
        switch (op.operation) {
          case 'create':
            const newDocRef = doc(collection(db, op.collection));
            batch.set(newDocRef, op.data);
            break;
            
          case 'update':
            if (op.id) {
              const docRef = doc(db, op.collection, op.id);
              batch.update(docRef, op.data);
            }
            break;
            
          case 'delete':
            if (op.id) {
              const docRef = doc(db, op.collection, op.id);
              batch.update(docRef, { 'auditoria.activo': false });
            }
            break;
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error en operación en lote:', error);
      throw new Error('No se pudo completar la operación en lote');
    }
  }

  /**
   * Calcular estadísticas de progreso
   */
  async calcularEstadisticasProgreso(obraId: string): Promise<{
    totalCompases: number;
    compassLogrados: number;
    compassConDificultad: number;
    porcentajeProgreso: number;
  }> {
    try {
      const obra = await this.obtenerObra(obraId);
      if (!obra) throw new Error('Obra no encontrada');
      
      const q = query(
        collection(db, this.estadosCollection),
        where('obraId', '==', obraId)
      );
      
      const snapshot = await getDocs(q);
      const estados = snapshot.docs.map(doc => doc.data() as EstadoCompassDetalle);
      
      const totalCompases = obra.totalCompases;
      const compassLogrados = estados.filter(e => e.estado === EstadoCompass.LOGRADO).length;
      const compassConDificultad = estados.filter(e => e.estado === EstadoCompass.CON_DIFICULTAD).length;
      const porcentajeProgreso = Math.round((compassLogrados / totalCompases) * 100);
      
      return {
        totalCompases,
        compassLogrados,
        compassConDificultad,
        porcentajeProgreso
      };
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
      throw new Error('No se pudieron calcular las estadísticas');
    }
  }
}

export const montajeService = new MontajeService();
