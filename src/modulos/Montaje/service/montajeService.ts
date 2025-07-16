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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { TipoInstrumento, EstadoCompass } from '../types';
import type {
  Obra,
  Repertorio,
  PlanAccion,
  FraseMontaje,
  EstadoCompassDetalle,
  EvaluacionContinua,
  EvaluacionFinal,
  NotificacionMontaje,
  FiltrosMontaje,
  CambioEstadoCompass,
  MontajeProject,
} from '../types';

/**
 * Servicio profesional para gestión de montajes en Firebase
 */
class MontajeService {
  private readonly repertoriosCollection = 'montaje_repertories';
  private readonly obrasCollection = 'montaje_works';
  private readonly notificacionesCollection = 'notificaciones_montaje';
  private readonly projectsCollection = 'montaje_projects';
  private readonly historialTrabajoMaestroCollection = 'historial_trabajo_maestro'; // Nueva colección

  // ================== GESTIÓN DE PROYECTOS DE MONTAJE ==================
  async createMontajeProject(projectData: Omit<MontajeProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.projectsCollection), {
        ...projectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creando proyecto de montaje:', error);
      throw error;
    }
  }

  async loadMontajeProjects(userId: string): Promise<MontajeProject[]> {
    try {
      const q = query(collection(db, this.projectsCollection), where('members.id', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const userProjects: MontajeProject[] = [];
      querySnapshot.forEach((doc) => {
        userProjects.push({ id: doc.id, ...doc.data() } as MontajeProject);
      });
      return userProjects;
    } catch (error) {
      console.error('Error cargando proyectos de montaje:', error);
      throw error;
    }
  }

  async saveMontajeProject(project: MontajeProject): Promise<void> {
    try {
      const projectRef = doc(db, this.projectsCollection, project.id);
      await setDoc(projectRef, { ...project, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error('Error guardando proyecto de montaje:', error);
      throw error;
    }
  }

  private cache = new Map<string, {data: any; expiry: number}>();
  private readonly cacheExpiry = 5 * 60 * 1000; // 5 minutos

  /**
   * Crear objeto de instrumentos con estado por defecto
   */
  private crearEstadoInstrumentos = (
    estadoDefecto: EstadoCompass = EstadoCompass.SIN_TRABAJAR,
  ): Record<TipoInstrumento, EstadoCompass> => {
    return Object.values(TipoInstrumento).reduce(
      (acc, instrumento) => {
        acc[instrumento] = estadoDefecto;
        return acc;
      },
      {} as Record<TipoInstrumento, EstadoCompass>,
    );
  };

  // ================== GESTIÓN DE REPERTORIOS ==================
  async crearRepertorio(datos: Omit<Repertorio, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.repertoriosCollection), datos);
      this.invalidarCacheRepertorios();
      return docRef.id;
    } catch (error) {
      console.error('Error creando repertorio:', error);
      throw new Error('No se pudo crear el repertorio');
    }
  }

  async obtenerRepertorios(): Promise<Repertorio[]> {
    try {
      const cacheKey = 'repertorios_all';
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        return cached.data;
      }

      const q = query(collection(db, this.repertoriosCollection));
      const snapshot = await getDocs(q);
      const repertorios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Repertorio[];
      this.cache.set(cacheKey, { data: repertorios, expiry: Date.now() + this.cacheExpiry });
      return repertorios;
    } catch (error) {
      console.error('Error obteniendo repertorios:', error);
      return [];
    }
  }

  async obtenerRepertorio(id: string): Promise<Repertorio | null> {
    try {
      const cacheKey = `repertorio_${id}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        return cached.data;
      }

      const docRef = doc(db, this.repertoriosCollection, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;

      const repertorio = { id: docSnap.id, ...docSnap.data() } as Repertorio;
      this.cache.set(cacheKey, { data: repertorio, expiry: Date.now() + this.cacheExpiry });
      return repertorio;
    } catch (error) {
      console.error('Error obteniendo repertorio:', error);
      throw new Error('No se pudo obtener el repertorio');
    }
  }

  async actualizarRepertorio(id: string, datos: Partial<Repertorio>): Promise<void> {
    try {
      const docRef = doc(db, this.repertoriosCollection, id);
      await updateDoc(docRef, datos);
      this.invalidarCacheRepertorios(id);
    } catch (error) {
      console.error('Error actualizando repertorio:', error);
      throw new Error('No se pudo actualizar el repertorio');
    }
  }

  async eliminarRepertorio(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.repertoriosCollection, id));
      this.invalidarCacheRepertorios(id);
    } catch (error) {
      console.error('Error eliminando repertorio:', error);
      throw new Error('No se pudo eliminar el repertorio');
    }
  }

  private invalidarCacheRepertorios(id?: string): void {
    if (id) this.cache.delete(`repertorio_${id}`);
    this.cache.delete('repertorios_all');
  }

  // ================== GESTIÓN DE OBRAS ==================
  /**
   * Obtener todas las obras
   */
  async obtenerObras(): Promise<Obra[]> {
    try {
      const cacheKey = 'obras_all';
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() < cached.expiry) {
        console.log('📦 Cache hit para obras: all');
        return cached.data;
      }
      console.log('🔍 Consultando obras desde Firestore: all');

      const obrasRef = collection(db, this.obrasCollection);
      // Eliminamos el filtro para obtener todas las obras
    
      const snapshot = await getDocs(obrasRef);
      const obras = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Obra[];

      console.log('📊 Total de obras obtenidas desde Firestore:', obras.length);

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: obras,
        expiry: Date.now() + this.cacheExpiry,
      });
      console.log('✅ Obras obtenidas:', obras.length);
      return obras;
    } catch (error) {
      console.error('❌ Error obteniendo obras:', error);
      console.warn('⚠️ Devolviendo array vacío de obras debido al error');
      const cacheKey = 'obras_all';
      this.cache.set(cacheKey, {
        data: [],
        expiry: Date.now() + this.cacheExpiry,
      });
      return [];
    }
  }

  /**
   * Obtener una obra específica
   */
  async obtenerObra(id: string): Promise<Obra | null> {
    try {
      const cacheKey = `obra_${id}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() < cached.expiry) {
        return cached.data;
      }

      const docRef = doc(db, this.obrasCollection, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const obra = {
        id: docSnap.id,
        ...docSnap.data(),
      } as Obra;

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: obra,
        expiry: Date.now() + this.cacheExpiry,
      });

      return obra;
    } catch (error) {
      console.error('Error obteniendo obra:', error);
      throw new Error('No se pudo obtener la obra');
    }
  }

  /**
   * Obtener una obra específica buscando en múltiples colecciones.
   */
  async obtenerObraEnMultiplesColecciones(obraId: string): Promise<Obra | null> {
    try {
      // Primero intentar en la colección 'montaje_works'
      const obra = await this.obtenerObra(obraId);
      if (obra) return obra;

      console.log('📚 Obra no encontrada en "montaje_works", intentando en "repertorios"...');
      // Si no se encuentra, intentar en 'repertorios'
      const repertoriosRef = doc(db, 'repertorios', obraId);
      const repertoriosSnap = await getDoc(repertoriosRef);
      if (repertoriosSnap.exists()) {
        return { id: repertoriosSnap.id, ...repertoriosSnap.data() } as Obra;
      }

      console.log('📖 Intentando en "montaje-repertorios"...');
      // Si aún no se encuentra, intentar en 'montaje-repertorios'
      const montajeRepertoriosRef = doc(db, 'montaje-repertorios', obraId);
      const montajeRepertoriosSnap = await getDoc(montajeRepertoriosRef);
      if (montajeRepertoriosSnap.exists()) {
        return { id: montajeRepertoriosSnap.id, ...montajeRepertoriosSnap.data() } as Obra;
      }

      return null;
    } catch (error) {
      console.error('Error obteniendo obra en múltiples colecciones:', error);
      throw new Error('No se pudo obtener la obra en múltiples colecciones');
    }
  }

  /**
   * Crear nueva obra
   */
  async crearObra(datos: Omit<Obra, 'id'>): Promise<string> {
    try {
      console.log('🔄 Creando obra:', datos.titulo || datos.name);
      
      const obrasRef = collection(db, this.obrasCollection);
      const docRef = await addDoc(obrasRef, {
        ...datos,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Limpiar caché relacionado
      this.invalidarCacheObras();

      console.log('✅ Obra creada con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creando obra:', error);
      throw new Error('No se pudo crear la obra');
    }
  }

  /**
   * Actualizar obra existente
   */
  async actualizarObra(id: string, datos: Partial<Obra>): Promise<void> {
    try {
      const docRef = doc(db, this.obrasCollection, id);
      await updateDoc(docRef, {
        ...datos,
        'auditoria.fechaModificacion': serverTimestamp(),
      });

      // Limpiar caché
      this.cache.delete(`obra_${id}`);
      this.invalidarCacheObras();

      console.log('✅ Obra actualizada:', id);
    } catch (error) {
      console.error('Error actualizando obra:', error);
      throw new Error('No se pudo actualizar la obra');
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
        'auditoria.fechaModificacion': serverTimestamp(),
      });

      // Limpiar caché
      this.cache.delete(`obra_${id}`);
      this.invalidarCacheObras();

      console.log('✅ Obra eliminada:', id);
    } catch (error) {
      console.error('Error eliminando obra:', error);
      throw new Error('No se pudo eliminar la obra');
    }
  }

  // ================== GESTIÓN DE NOTIFICACIONES ==================

  /**
   * Crear notificación
   */
  async crearNotificacion(datos: Omit<NotificacionMontaje, 'id'>): Promise<string> {
    try {
      const notificacionCompleta = {
        ...datos,
        fecha: serverTimestamp(),
        metadatos: {
          ...datos.metadatos,
          leida: false,
        },
      };

      const docRef = await addDoc(
        collection(db, this.notificacionesCollection),
        notificacionCompleta,
      );
      return docRef.id;
    } catch (error) {
      console.error('Error creando notificación:', error);
      throw new Error('No se pudo crear la notificación');
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async obtenerNotificaciones(
    destinatarioId: string,
    limit: number = 20,
  ): Promise<NotificacionMontaje[]> {
    try {
      const q = query(
        collection(db, this.notificacionesCollection),
        where('destinatarioId', '==', destinatarioId),
        orderBy('fecha', 'desc'),
        limitToFirst(limit),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificacionMontaje[];
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return [];
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
        'metadatos.fechaLectura': serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw new Error('No se pudo marcar la notificación como leída');
    }
  }

  // ================== GESTIÓN DE EVALUACIONES ==================

  /**
   * Crear evaluación continua
   */
  async crearEvaluacionContinua(obraId: string, datos: Omit<EvaluacionContinua, 'id'>): Promise<string> {
    try {
      const evaluacionesRef = collection(db, this.obrasCollection, obraId, 'evaluaciones_continuas');
      const docRef = await addDoc(evaluacionesRef, {
        ...datos,
        auditoria: {
          ...datos.auditoria,
          fechaCreacion: serverTimestamp(),
        },
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creando evaluación continua:', error);
      throw new Error('No se pudo crear la evaluación continua');
    }
  }

  /**
   * Crear evaluación final
   */
  async crearEvaluacionFinal(obraId: string, datos: Omit<EvaluacionFinal, 'id'>): Promise<string> {
    try {
      const evaluacionesRef = collection(db, this.obrasCollection, obraId, 'evaluaciones_finales');
      const docRef = await addDoc(evaluacionesRef, {
        ...datos,
        auditoria: {
          ...datos.auditoria,
          fechaCreacion: serverTimestamp(),
        },
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creando evaluación final:', error);
      throw new Error('No se pudo crear la evaluación final');
    }
  }

  /**
   * Obtener evaluaciones de una obra
   */
  async obtenerEvaluaciones(
    obraId: string,
    tipo: 'continua' | 'final' = 'continua',
  ): Promise<EvaluacionContinua[] | EvaluacionFinal[]> {
    try {
      const collectionName = tipo === 'continua' ? 'evaluaciones_continuas' : 'evaluaciones_finales';
      const evaluacionesRef = collection(db, this.obrasCollection, obraId, collectionName);

      const q = query(
        evaluacionesRef,
        orderBy('fecha', 'desc'),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any;
    } catch (error) {
      console.error('Error obteniendo evaluaciones:', error);
      throw new Error('No se pudieron obtener las evaluaciones');
    }
  }

  // ================== GESTIÓN DE PLANES DE ACCIÓN ==================
  /**
   * Obtener plan de acción de una obra
   */
  async obtenerPlanAccion(obraId: string): Promise<PlanAccion | null> {
    try {
      const cacheKey = `plan_${obraId}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() < cached.expiry) {
        return cached.data;
      }

      const planesAccionRef = collection(db, this.obrasCollection, obraId, 'planes_accion');
      const q = query(
        planesAccionRef,
        where('auditoria.activo', '==', true),
        orderBy('auditoria.fechaCreacion', 'desc'),
        limitToFirst(1),
      );

      const snapshot = await getDocs(q);
      const plan = snapshot.empty
        ? null
        : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as PlanAccion);

      this.cache.set(cacheKey, { data: plan, expiry: Date.now() + this.cacheExpiry });
      return plan;
    } catch (error) {
      console.error('Error obteniendo plan de acción:', error);
      throw error;
    }
  }

  /**
   * Crear plan de acción
   */
  async crearPlanAccion(obraId: string, datos: Omit<PlanAccion, 'id'>): Promise<string> {
    try {
      const planesAccionRef = collection(db, this.obrasCollection, obraId, 'planes_accion');
      const docRef = await addDoc(planesAccionRef, {
        ...datos,
        auditoria: {
          ...datos.auditoria,
          fechaCreacion: serverTimestamp(),
        },
      });
      this.invalidarCachePlanes(obraId);
      return docRef.id;
    } catch (error) {
      console.error('Error creando plan de acción:', error);
      throw error;
    }
  }

  /**
   * Actualizar plan de acción
   */
  async actualizarPlanAccion(obraId: string, id: string, datos: Partial<PlanAccion>): Promise<void> {
    try {
      const docRef = doc(db, this.obrasCollection, obraId, 'planes_accion', id);
      await updateDoc(docRef, {
        ...datos,
        'auditoria.fechaModificacion': serverTimestamp(),
      });

      // Invalidar caché relacionado
      this.invalidarCachePlanes(obraId);
    } catch (error) {
      console.error('Error actualizando plan de acción:', error);
      throw error;
    }
  }

  // ================== GESTIÓN DE FRASES ==================
  /**
   * Obtener frases de un plan de acción
   */
  async obtenerFrases(obraId: string, planAccionId: string): Promise<FraseMontaje[]> {
    try {
      const cacheKey = `frases_${obraId}_${planAccionId}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() < cached.expiry) {
        return cached.data;
      }

      const frasesRef = collection(db, this.obrasCollection, obraId, 'planes_accion', planAccionId, 'frases');
      const q = query(
        frasesRef,
        where('auditoria.activo', '==', true),
        orderBy('orden', 'asc'),
      );

      const snapshot = await getDocs(q);
      const frases = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FraseMontaje);

      this.cache.set(cacheKey, { data: frases, expiry: Date.now() + this.cacheExpiry });
      return frases;
    } catch (error) {
      console.error('Error obteniendo frases:', error);
      throw error;
    }
  }

  /**
   * Crear frase
   */
  async crearFrase(obraId: string, planAccionId: string, datos: Omit<FraseMontaje, 'id'>): Promise<string> {
    try {
      const frasesRef = collection(db, this.obrasCollection, obraId, 'planes_accion', planAccionId, 'frases');
      const docRef = await addDoc(frasesRef, {
        ...datos,
        auditoria: {
          ...datos.auditoria,
          fechaCreacion: serverTimestamp(),
        },
      });
      this.invalidarCacheFrases(obraId, planAccionId);
      return docRef.id;
    } catch (error) {
      console.error('Error creando frase:', error);
      throw error;
    }
  }

  /**
   * Actualizar frase existente
   */
  async actualizarFrase(obraId: string, planAccionId: string, id: string, datos: Partial<FraseMontaje>): Promise<void> {
    try {
      const docRef = doc(db, this.obrasCollection, obraId, 'planes_accion', planAccionId, 'frases', id);
      await updateDoc(docRef, {
        ...datos,
        'auditoria.fechaModificacion': serverTimestamp(),
      });

      // Invalidar caché relacionado
      this.invalidarCacheFrases(obraId, planAccionId);

      console.log('✅ Frase actualizada:', id);
    } catch (error) {
      console.error('Error actualizando frase:', error);
      throw new Error('No se pudo actualizar la frase');
    }
  }

  /**
   * Obtener estados de compases de una obra
   */
  async obtenerEstadosCompases(obraId: string): Promise<Array<[number, EstadoCompassDetalle]>> {
    try {
      const cacheKey = `estados_compases_${obraId}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() < cached.expiry) {
        return cached.data;
      }

      const estadosCompasesRef = collection(db, this.obrasCollection, obraId, 'estados_compases');
      const q = query(estadosCompasesRef);

      const snapshot = await getDocs(q);
      const estados: Array<[number, EstadoCompassDetalle]> = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        estados.push([
          data.compas,
          {
            compas: data.compas,
            estado: data.estado,
            instrumentos: data.instrumentos || this.crearEstadoInstrumentos(),
            observaciones: data.observaciones || [],
            fechaUltimaModificacion: data.fechaUltimaModificacion || Timestamp.now(),
            modificadoPor: data.modificadoPor || '',
            sesionesEnsayo: data.sesionesEnsayo || 0,
            dificultadesEspecificas: data.dificultadesEspecificas || [],
          },
        ]);
      });

      this.cache.set(cacheKey, { data: estados, expiry: Date.now() + this.cacheExpiry });
      return estados;
    } catch (error) {
      console.error('Error obteniendo estados de compases:', error);
      return [];
    }
  }

  // ================== GESTIÓN DE COMPASES ==================
  /**
   * Cambiar estado de un compás
   */
  async cambiarEstadoCompass(
    obraId: string,
    compassNumber: number,
    nuevoEstado: EstadoCompass,
    cambio: CambioEstadoCompass,
  ): Promise<void> {
    try {
      const docRef = doc(db, this.obrasCollection, obraId, 'estados_compases', `${obraId}_${compassNumber}`);
      await updateDoc(docRef, {
        // Actualizar el estado general del compás si es necesario, o solo el del instrumento
        // Por ahora, actualizaremos el estado para el instrumento específico
        [`instrumentos.${cambio.instrumento}`]: nuevoEstado, // Actualiza el estado para el instrumento específico
        fechaUltimaModificacion: serverTimestamp(),
        modificadoPor: cambio.maestroId,
        // También podemos incrementar sesionesEnsayo o intentosRealizados aquí si es relevante
        sesionesEnsayo: increment(1), // Asumiendo que cada cambio es una sesión de ensayo
      });

      // Registrar en el historial de trabajo del maestro
      const historialRef = collection(db, 'historial_trabajo_maestro');
      await addDoc(historialRef, {
        maestroId: cambio.maestroId,
        obraId: obraId,
        instrumentoId: cambio.instrumento,
        compas: compassNumber,
        estadoAnterior: cambio.estadoAnterior,
        estadoNuevo: nuevoEstado,
        fechaCambio: serverTimestamp(),
        observacionClase: cambio.observacionClase || '', // Si se pasa una observación de clase
        razonCambio: cambio.razon || '', // Razón específica del cambio de compás
      });

      console.log('Estado del compás actualizado:', cambio);
    } catch (error) {
      console.error('Error cambiando estado del compás:', error);
      throw error;
    }
  }

  // ================== BÚSQUEDA Y FILTROS ==================

  /**
   * Buscar obras con filtros avanzados
   */
  async buscarObras(filtros: FiltrosMontaje): Promise<Obra[]> {
    try {
      const obrasRef = collection(db, this.obrasCollection);
      let q: any = query(obrasRef);

      // Aplicar filtros básicos
      if (filtros.repertorioId) {
        q = query(q, where('repertorioId', '==', filtros.repertorioId));
      }

      if (filtros.estado) {
        q = query(q, where('estado', '==', filtros.estado));
      }

      if (filtros.dificultad) {
        q = query(q, where('metadatos.complejidadGeneral', '==', filtros.dificultad));
      }

      // Solo obras activas
      q = query(q, where('auditoria.activo', '!=', false));
      const snapshot = await getDocs(q);
      const obras = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Obra[];

      // Los tags no están en la interfaz Obra actual, comentamos este filtro
      // if (filtros.tags && filtros.tags.length > 0) {
      //   obras = obras.filter(obra =>
      //     filtros.tags!.some(tag => obra.tags?.includes(tag))
      //   );
      // }

      return obras;
    } catch (error) {
      console.error('Error buscando obras:', error);
      throw new Error('No se pudieron buscar las obras');
    }
  }

  // ================== ESTADÍSTICAS Y REPORTES ==================

  /**
   * Obtener estadísticas de una obra
   */
  async obtenerEstadisticasObra(obraId: string): Promise<any> {
    try {
      // Obtener datos de la obra
      const obra = await this.obtenerObra(obraId);
      if (!obra) {
        throw new Error('Obra no encontrada');
      }

      // Obtener evaluaciones
      const evaluacionesContinuas = (await this.obtenerEvaluaciones(
        obraId,
        'continua',
      )) as EvaluacionContinua[];
      const evaluacionesFinales = (await this.obtenerEvaluaciones(
        obraId,
        'final',
      )) as EvaluacionFinal[];

      // Calcular estadísticas
      const totalEvaluaciones = evaluacionesContinuas.length + evaluacionesFinales.length;
      const promedioEvaluacionesContinuas =
        evaluacionesContinuas.reduce(
          (sum, e) => sum + (e.metadatos?.porcentajeCumplimiento || 0),
          0,
        ) / (evaluacionesContinuas.length || 1);

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
      };
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
      throw new Error('No se pudieron calcular las estadísticas');
    }
  }

  // ================== UTILIDADES PRIVADAS ==================

  /**
   * Invalidar caché de obras de un proyecto
   */
  private invalidarCacheObras(): void {
    const cacheKey = 'obras_all';
    this.cache.delete(cacheKey);
  }
  /**
   * Obtener estado del caché
   */
  obtenerEstadoCache(): {tamaño: number; entradas: string[]} {
    return {
      tamaño: this.cache.size,
      entradas: Array.from(this.cache.keys()),
    };
  }

  /**
   * Invalidar caché de planes de una obra
   */
  private invalidarCachePlanes(obraId: string): void {
    const cacheKey = `plan_${obraId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Invalidar caché de frases de un plan
   */
  private invalidarCacheFrases(obraId: string, planAccionId: string): void {
    const cacheKey = `frases_${obraId}_${planAccionId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Invalidar caché de estados de compases de una obra
   */
  private invalidarCacheEstadosCompases(obraId: string): void {
    const cacheKey = `estados_compases_${obraId}`;
    this.cache.delete(cacheKey);
  }
}

export default new MontajeService();