// src/modulos/Montaje/service/instrumentProgressService.ts
import { db } from '@/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { EstadoCompass, TipoInstrumento } from '../types';
import { useAuthStore } from '@/stores/auth';

class InstrumentProgressService {
  /**
   * Actualiza el estado de un compás para un instrumento específico
   * y notifica al director sobre el cambio.
   * 
   * @param obraId ID de la obra
   * @param instrumentId Tipo de instrumento
   * @param compassNumber Número de compás
   * @param nuevoEstado Nuevo estado del compás
   * @returns Promise con el resultado de la operación
   */
  async actualizarEstadoCompasPorInstrumento(
    obraId: string, 
    instrumentId: TipoInstrumento,
    compassNumber: number, 
    nuevoEstado: EstadoCompass,
  ) {
    try {
      const authStore = useAuthStore();
      if (!authStore.user?.uid) {
        throw new Error('Usuario no autenticado');
      }
      
      // Referencia al documento de estados de la obra
      const estadosRef = doc(db, 'MONTAJE_ESTADOS', obraId);
      
      // Obtenemos el documento actual para verificar si existe
      const estadosDoc = await getDoc(estadosRef);
      
      // Fecha de la actualización
      const timestamp = Timestamp.now();
      
      // Datos del usuario
      const teacherName = authStore.user.displayName || 'Maestro';
      const teacherId = authStore.user.uid;
      
      if (!estadosDoc.exists()) {
        // Si no existe el documento, lo creamos con el estado inicial
        await setDoc(estadosRef, {
          obraId,
          instrumentos: {
            [instrumentId]: {
              compases: {
                [compassNumber]: {
                  estado: nuevoEstado,
                  ultimaActualizacion: timestamp,
                  actualizadoPor: teacherId,
                  nombreActualizador: teacherName,
                },
              },
            },
          },
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      } else {
        // Si existe, actualizamos el estado específico del compás para el instrumento
        const data = estadosDoc.data();
        const instrumentos = data.instrumentos || {};
        const instrumento = instrumentos[instrumentId] || { compases: {} };
        
        // Actualizamos o añadimos el estado del compás
        await updateDoc(estadosRef, {
          [`instrumentos.${instrumentId}.compases.${compassNumber}`]: {
            estado: nuevoEstado,
            ultimaActualizacion: timestamp,
            actualizadoPor: teacherId,
            nombreActualizador: teacherName,
          },
          updatedAt: timestamp,
        });
      }
      
      // Crear notificación para el director
      await this.notificarCambioEstado({
        obraId,
        instrumentId,
        compassNumber,
        nuevoEstado,
        profesorId: teacherId,
        profesorNombre: teacherName,
        timestamp,
      });
      
      return {
        success: true,
        message: `Estado del compás ${compassNumber} actualizado para ${instrumentId}`,
      };
    } catch (error) {
      console.error('Error al actualizar estado por instrumento:', error);
      throw error;
    }
  }
  
  /**
   * Crea una notificación para el director sobre el cambio de estado
   * de un compás por parte de un profesor.
   */
  private async notificarCambioEstado({
    obraId,
    instrumentId,
    compassNumber,
    nuevoEstado,
    profesorId,
    profesorNombre,
    timestamp,
  }: {
    obraId: string
    instrumentId: TipoInstrumento
    compassNumber: number
    nuevoEstado: EstadoCompass
    profesorId: string
    profesorNombre: string
    timestamp: Timestamp
  }) {
    try {
      // Obtener información de la obra
      const obraDoc = await getDoc(doc(db, 'MONTAJE_OBRAS', obraId));
      if (!obraDoc.exists()) {
        console.warn('No se encontró la obra para notificar cambio de estado');
        return;
      }
      
      const obraData = obraDoc.data();
      const obraTitulo = obraData.titulo || 'Obra sin título';
      
      // Crear notificación
      const notificacionId = `estado_${obraId}_${instrumentId}_${compassNumber}_${Date.now()}`;
      const notificacionesRef = collection(db, 'MONTAJE_NOTIFICACIONES');
      
      // Texto según el estado
      let estadoTexto = 'actualizó el estado';
      switch(nuevoEstado) {
      case EstadoCompass.Completado:
        estadoTexto = 'marcó como completado';
        break;
      case EstadoCompass.EnProceso:
        estadoTexto = 'marcó como en progreso';
        break;
      case EstadoCompass.Problematico:
        estadoTexto = 'marcó como problemático';
        break;
      case EstadoCompass.SinIniciar:
        estadoTexto = 'reinició el estado';
        break;
      }
      
      // Crear notificación para directores
      await setDoc(doc(notificacionesRef, notificacionId), {
        id: notificacionId,
        titulo: `Actualización de progreso - ${obraTitulo}`,
        mensaje: `${profesorNombre} ${estadoTexto} del compás ${compassNumber} para el instrumento ${instrumentId}`,
        tipo: 'progreso',
        estado: 'sin_leer',
        obraId,
        instrumento: instrumentId,
        compass: compassNumber,
        nuevoEstado,
        profesorId,
        createdAt: timestamp,
        destinatarios: {
          roles: ['Director', 'Admin'],
          usuarios: [],
        },
      });
      
      return true;
    } catch (error) {
      console.error('Error al notificar cambio de estado:', error);
      // No propagamos el error ya que es una operación secundaria
      return false;
    }
  }
  
  /**
   * Carga los estados de los compases para un instrumento específico
   * 
   * @param obraId ID de la obra
   * @param instrumentId Tipo de instrumento
   * @returns Estados de los compases para el instrumento
   */
  async cargarEstadosCompasesPorInstrumento(obraId: string, instrumentId: TipoInstrumento) {
    try {
      const estadosRef = doc(db, 'MONTAJE_ESTADOS', obraId);
      const estadosDoc = await getDoc(estadosRef);
      
      if (!estadosDoc.exists()) {
        return {};
      }
      
      const data = estadosDoc.data();
      const instrumentos = data.instrumentos || {};
      const instrumento = instrumentos[instrumentId] || { compases: {} };
      
      return instrumento.compases || {};
    } catch (error) {
      console.error('Error al cargar estados por instrumento:', error);
      throw error;
    }
  }
}

export const instrumentProgressService = new InstrumentProgressService();
