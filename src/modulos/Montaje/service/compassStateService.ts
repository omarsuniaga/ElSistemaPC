// src/modulos/Montaje/service/compassStateService.ts

import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  writeBatch,
  serverTimestamp,
  DocumentReference,
  Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { 
  EstadoCompassInstrumento, 
  EstadisticasProgreso, 
  ActualizacionMasiva,
  NotificacionProgreso,
  EstadoCompass
} from '../types';
import { permissionsService } from './permissionsService';
import { MontajePermission } from '../types/permissions';
import { teacherService } from './teacherService';
import { notificationsService } from '@/services/notifications.js';

/**
 * Servicio para gestión de estados de compases por instrumento
 * con verificación de permisos RBAC
 */
export const compassStateService = {
  /**
   * Actualiza el estado de un compás específico para un instrumento
   * Verifica permisos RBAC antes de realizar la operación
   * @param estadoCompass Datos del estado del compás a actualizar
   * @returns Promise con el ID del documento actualizado o error
   */
  async actualizarEstadoCompass(estadoCompass: EstadoCompassInstrumento): Promise<string> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }
      
      // Verificar permisos RBAC para actualizar estados de compases por instrumento
      const tienePermiso = await permissionsService.hasPermission(
        MontajePermission.UPDATE_INSTRUMENT_COMPASS_STATES
      );
      
      if (!tienePermiso) {
        throw new Error('No tiene permisos para actualizar estados de compases');
      }
      
      // Verificar si el maestro tiene asignado este instrumento
      const puedeActualizarInstrumento = await permissionsService.canUpdateInstrumentState(
        currentUser.uid, 
        estadoCompass.instrumentoId
      );
      
      if (!puedeActualizarInstrumento) {
        throw new Error('No tiene permisos para actualizar este instrumento específico');
      }
      
      const db = getFirestore();
      
      // Buscar si ya existe un estado para este compás e instrumento
      const estadosRef = collection(db, 'estadosCompassInstrumento');
      const q = query(
        estadosRef, 
        where('obraId', '==', estadoCompass.obraId),
        where('instrumentoId', '==', estadoCompass.instrumentoId),
        where('numeroCompas', '==', estadoCompass.numeroCompas)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Completar datos de auditoría
      estadoCompass.ultimaActualizacion = new Date();
      estadoCompass.actualizadoPor = currentUser.uid;
      
      // Obtener nombre del usuario
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        estadoCompass.actualizadoPorNombre = userData.displayName || userData.email;
      }
      
      let estadoId: string;
      
      if (querySnapshot.empty) {
        // Crear nuevo estado
        const nuevoEstado = await addDoc(estadosRef, {
          ...estadoCompass,
          ultimaActualizacion: serverTimestamp(),
        });
        estadoId = nuevoEstado.id;
      } else {
        // Actualizar estado existente
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          estado: estadoCompass.estado,
          notas: estadoCompass.notas,
          ultimaActualizacion: serverTimestamp(),
          actualizadoPor: estadoCompass.actualizadoPor,
          actualizadoPorNombre: estadoCompass.actualizadoPorNombre
        });
        estadoId = querySnapshot.docs[0].id;
      }
      
      // Notificar a directores y administradores
      await this._notificarActualizacionEstado(estadoCompass);
      
      return estadoId;
    } catch (error) {
      console.error('Error al actualizar estado de compás:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene los estados de compases para un instrumento específico en una obra
   * @param obraId ID de la obra
   * @param instrumentoId ID del instrumento
   * @returns Promise con la lista de estados de compases
   */
  async obtenerEstadosCompasesPorInstrumento(
    obraId: string, 
    instrumentoId: string
  ): Promise<EstadoCompassInstrumento[]> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }
      
      // Verificar permisos para leer estados de compases por instrumento
      const tienePermiso = await permissionsService.hasPermission(
        MontajePermission.READ_INSTRUMENT_COMPASS_STATES
      );
      
      if (!tienePermiso) {
        throw new Error('No tiene permisos para ver estados de compases por instrumento');
      }
      
      const db = getFirestore();
      const estadosRef = collection(db, 'estadosCompassInstrumento');
      const q = query(
        estadosRef, 
        where('obraId', '==', obraId),
        where('instrumentoId', '==', instrumentoId)
      );
      
      const querySnapshot = await getDocs(q);
      const estados: EstadoCompassInstrumento[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        estados.push({
          id: doc.id,
          obraId: data.obraId,
          instrumentoId: data.instrumentoId,
          numeroCompas: data.numeroCompas,
          estado: data.estado,
          notas: data.notas,
          ultimaActualizacion: data.ultimaActualizacion instanceof Timestamp 
            ? data.ultimaActualizacion.toDate() 
            : new Date(data.ultimaActualizacion),
          actualizadoPor: data.actualizadoPor,
          actualizadoPorNombre: data.actualizadoPorNombre
        });
      });
      
      return estados;
    } catch (error) {
      console.error('Error al obtener estados de compases:', error);
      throw error;
    }
  },
  
  /**
   * Actualiza múltiples estados de compases para un instrumento
   * @param actualizacion Datos de la actualización masiva
   * @returns Promise con los IDs de los documentos actualizados
   */
  async actualizarMasivamente(actualizacion: ActualizacionMasiva): Promise<string[]> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }
      
      // Verificar permisos RBAC
      const tienePermiso = await permissionsService.hasPermission(
        MontajePermission.UPDATE_INSTRUMENT_COMPASS_STATES
      );
      
      if (!tienePermiso) {
        throw new Error('No tiene permisos para actualizar estados de compases');
      }
      
      // Verificar si el maestro tiene asignado este instrumento
      const puedeActualizarInstrumento = await permissionsService.canUpdateInstrumentState(
        currentUser.uid, 
        actualizacion.instrumentoId
      );
      
      if (!puedeActualizarInstrumento) {
        throw new Error('No tiene permisos para actualizar este instrumento específico');
      }
      
      const db = getFirestore();
      const batch = writeBatch(db);
      const estadosRef = collection(db, 'estadosCompassInstrumento');
      const idsActualizados: string[] = [];
      
      // Obtener nombre del usuario para auditoría
      let nombreUsuario = currentUser.displayName || currentUser.email;
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        nombreUsuario = userData.displayName || userData.email;
      }
      
      // Procesar cada compás en la actualización masiva
      for (const numeroCompas of actualizacion.compasesIds) {
        // Buscar si ya existe un estado para este compás
        const q = query(
          estadosRef, 
          where('obraId', '==', actualizacion.obraId),
          where('instrumentoId', '==', actualizacion.instrumentoId),
          where('numeroCompas', '==', numeroCompas)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          // Crear nuevo estado
          const nuevoEstadoRef = doc(collection(db, 'estadosCompassInstrumento'));
          batch.set(nuevoEstadoRef, {
            obraId: actualizacion.obraId,
            instrumentoId: actualizacion.instrumentoId,
            numeroCompas: numeroCompas,
            estado: actualizacion.nuevoEstado,
            notas: actualizacion.notas || '',
            ultimaActualizacion: serverTimestamp(),
            actualizadoPor: currentUser.uid,
            actualizadoPorNombre: nombreUsuario
          });
          idsActualizados.push(nuevoEstadoRef.id);
        } else {
          // Actualizar estado existente
          const docRef = querySnapshot.docs[0].ref;
          batch.update(docRef, {
            estado: actualizacion.nuevoEstado,
            notas: actualizacion.notas,
            ultimaActualizacion: serverTimestamp(),
            actualizadoPor: currentUser.uid,
            actualizadoPorNombre: nombreUsuario
          });
          idsActualizados.push(querySnapshot.docs[0].id);
        }
      }
      
      // Ejecutar todas las operaciones como una transacción
      await batch.commit();
      
      // Notificar a directores sobre la actualización masiva
      await this._notificarActualizacionMasiva(actualizacion, nombreUsuario as string);
      
      return idsActualizados;
    } catch (error) {
      console.error('Error en actualización masiva:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene estadísticas de progreso para un instrumento específico en una obra
   * @param obraId ID de la obra
   * @param instrumentoId ID del instrumento
   * @returns Promise con las estadísticas de progreso
   */
  async obtenerEstadisticas(obraId: string, instrumentoId: string): Promise<EstadisticasProgreso> {
    try {
      // Obtener todos los estados de compases para este instrumento
      const estados = await this.obtenerEstadosCompasesPorInstrumento(obraId, instrumentoId);
      
      // Obtener información del instrumento y la obra
      const db = getFirestore();
      const obraDoc = await getDoc(doc(db, 'obras', obraId));
      
      if (!obraDoc.exists()) {
        throw new Error('La obra no existe');
      }
      
      const obraData = obraDoc.data();
      const totalCompases = obraData.compas || 0;
      
      // Buscar el instrumento en la obra
      let nombreInstrumento = instrumentoId;
      if (obraData.instruments && Array.isArray(obraData.instruments)) {
        const instrumento = obraData.instruments.find((i: any) => i.id === instrumentoId);
        if (instrumento) {
          nombreInstrumento = instrumento.name;
        }
      }
      
      // Inicializar estadísticas
      const estadisticas: EstadisticasProgreso = {
        instrumentoId,
        nombreInstrumento,
        totalCompases,
        sinTrabajar: 0,
        leido: 0,
        enProgreso: 0,
        conDificultad: 0,
        logrado: 0,
        dominado: 0,
        completado: 0,
        noTrabajado: 0,
        porcentajeCompletado: 0
      };
      
      // Contar compases por estado
      for (const estado of estados) {
        switch (estado.estado) {
          case EstadoCompass.SIN_TRABAJAR:
            estadisticas.sinTrabajar++;
            break;
          case EstadoCompass.LEIDO:
            estadisticas.leido++;
            break;
          case EstadoCompass.EN_PROGRESO:
            estadisticas.enProgreso++;
            break;
          case EstadoCompass.CON_DIFICULTAD:
            estadisticas.conDificultad++;
            break;
          case EstadoCompass.LOGRADO:
            estadisticas.logrado++;
            break;
          case EstadoCompass.DOMINADO:
            estadisticas.dominado++;
            break;
          case EstadoCompass.COMPLETADO:
            estadisticas.completado++;
            break;
          case EstadoCompass.NO_TRABAJADO:
            estadisticas.noTrabajado++;
            break;
        }
      }
      
      // Calcular compases sin estado asignado
      const compasesConEstado = estados.length;
      estadisticas.sinTrabajar += (totalCompases - compasesConEstado);
      
      // Calcular porcentaje completado (dominado + completado)
      const compasesCompletados = estadisticas.dominado + estadisticas.completado;
      estadisticas.porcentajeCompletado = totalCompases > 0 
        ? Math.round((compasesCompletados / totalCompases) * 100) 
        : 0;
      
      return estadisticas;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },
  
  /**
   * Método privado para notificar a directores y administradores
   * sobre actualizaciones en estados de compases
   * @param estadoCompass Estado del compás actualizado
   */
  async _notificarActualizacionEstado(estadoCompass: EstadoCompassInstrumento): Promise<void> {
    try {
      const db = getFirestore();
      
      // Obtener información de la obra
      const obraDoc = await getDoc(doc(db, 'obras', estadoCompass.obraId));
      if (!obraDoc.exists()) {
        return;
      }
      
      const obraData = obraDoc.data();
      
      // Buscar el instrumento en la obra
      let nombreInstrumento = estadoCompass.instrumentoId;
      if (obraData.instruments && Array.isArray(obraData.instruments)) {
        const instrumento = obraData.instruments.find((i: any) => i.id === estadoCompass.instrumentoId);
        if (instrumento) {
          nombreInstrumento = instrumento.name;
        }
      }
      
      // Obtener directores y administradores para notificar
      const usersRef = collection(db, 'users');
      const directoresQuery = query(usersRef, where('role', 'in', ['director', 'admin']));
      const directoresSnapshot = await getDocs(directoresQuery);
      
      const destinatariosIds: string[] = [];
      directoresSnapshot.forEach((doc) => {
        destinatariosIds.push(doc.id);
      });
      
      if (destinatariosIds.length === 0) {
        return;
      }
      
      // Crear notificación
      const notificacion: NotificacionProgreso = {
        tipo: 'actualizacion_progreso',
        titulo: `Actualización de progreso en ${obraData.name}`,
        mensaje: `El compás ${estadoCompass.numeroCompas} de ${nombreInstrumento} ha sido actualizado a estado: ${estadoCompass.estado} por ${estadoCompass.actualizadoPorNombre}.`,
        obraId: estadoCompass.obraId,
        instrumentoId: estadoCompass.instrumentoId,
        maestroId: estadoCompass.actualizadoPor,
        maestroNombre: estadoCompass.actualizadoPorNombre || 'Maestro',
        fechaCreacion: new Date(),
        leida: false,
        destinatariosIds
      };
      
      // Guardar notificación
      await notificationsService.createNotification({
        type: 'montaje_update',
        title: notificacion.titulo,
        message: notificacion.mensaje,
        data: {
          obraId: notificacion.obraId,
          instrumentoId: notificacion.instrumentoId,
          compassNumber: estadoCompass.numeroCompas,
          state: estadoCompass.estado
        },
        userIds: destinatariosIds,
        read: false,
        createdAt: new Date()
      });
      
    } catch (error) {
      console.error('Error al notificar actualización:', error);
      // No lanzar el error para evitar que falle la actualización principal
    }
  },
  
  /**
   * Método privado para notificar actualizaciones masivas
   * @param actualizacion Datos de la actualización masiva
   * @param nombreMaestro Nombre del maestro que realizó la actualización
   */
  async _notificarActualizacionMasiva(
    actualizacion: ActualizacionMasiva, 
    nombreMaestro: string
  ): Promise<void> {
    try {
      const db = getFirestore();
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return;
      }
      
      // Obtener información de la obra
      const obraDoc = await getDoc(doc(db, 'obras', actualizacion.obraId));
      if (!obraDoc.exists()) {
        return;
      }
      
      const obraData = obraDoc.data();
      
      // Buscar el instrumento en la obra
      let nombreInstrumento = actualizacion.instrumentoId;
      if (obraData.instruments && Array.isArray(obraData.instruments)) {
        const instrumento = obraData.instruments.find((i: any) => i.id === actualizacion.instrumentoId);
        if (instrumento) {
          nombreInstrumento = instrumento.name;
        }
      }
      
      // Obtener directores y administradores para notificar
      const usersRef = collection(db, 'users');
      const directoresQuery = query(usersRef, where('role', 'in', ['director', 'admin']));
      const directoresSnapshot = await getDocs(directoresQuery);
      
      const destinatariosIds: string[] = [];
      directoresSnapshot.forEach((doc) => {
        destinatariosIds.push(doc.id);
      });
      
      if (destinatariosIds.length === 0) {
        return;
      }
      
      // Crear notificación
      await notificationsService.createNotification({
        type: 'montaje_update',
        title: `Actualización masiva en ${obraData.name}`,
        message: `${nombreMaestro} actualizó ${actualizacion.compasesIds.length} compases de ${nombreInstrumento} al estado: ${actualizacion.nuevoEstado}.`,
        data: {
          obraId: actualizacion.obraId,
          instrumentoId: actualizacion.instrumentoId,
          compassCount: actualizacion.compasesIds.length,
          state: actualizacion.nuevoEstado
        },
        userIds: destinatariosIds,
        read: false,
        createdAt: new Date()
      });
      
    } catch (error) {
      console.error('Error al notificar actualización masiva:', error);
      // No lanzar el error para evitar que falle la actualización principal
    }
  }
};

export default compassStateService;
