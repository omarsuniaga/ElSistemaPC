import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useClassesStore } from '../modulos/Classes/store/classes';

/**
 * Envía notificaciones a los estudiantes sobre clases emergentes
 * @param {Array} emergentClasses - Lista de clases emergentes para notificar
 * @returns {Promise} - Promesa con el resultado del envío
 */
export const sendEmergentClassNotifications = async (emergentClasses) => {
  if (!emergentClasses || emergentClasses.length === 0) {
    throw new Error('No hay clases emergentes para notificar');
  }

  try {
    const classesStore = useClassesStore();
    const results = [];

    // Para cada clase emergente, enviar notificaciones a sus estudiantes
    for (const emergentClass of emergentClasses) {
      // Obtener la clase regular para saber qué estudiantes están matriculados
      const regularClass = classesStore.getClassById(emergentClass.classId);
      
      if (!regularClass || !regularClass.studentIds || regularClass.studentIds.length === 0) {
        console.warn(`No se encontraron estudiantes para la clase ${emergentClass.title}`);
        continue;
      }

      // Crear una notificación para cada estudiante
      for (const studentId of regularClass.studentIds) {
        const notification = {
          userId: studentId,
          title: 'Clase Emergente',
          message: `Tu clase de ${emergentClass.title} se llevará a cabo hoy con el profesor ${emergentClass.replacementTeacher}`,
          details: {
            type: 'emergent-class',
            classId: emergentClass.classId,
            startTime: emergentClass.startTime,
            endTime: emergentClass.endTime,
            location: emergentClass.location,
            reason: emergentClass.reason
          },
          status: 'unread',
          createdAt: new Date(),
          expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) // expira en 24h
        };

        // Verificar si ya existe una notificación para esta clase y estudiante
        const notificationsRef = collection(db, 'NOTIFICACIONES');
        const q = query(
          notificationsRef, 
          where('userId', '==', studentId),
          where('details.classId', '==', emergentClass.classId),
          where('details.type', '==', 'emergent-class')
        );
        
        const existingNotifications = await getDocs(q);
        
        // Si no existe notificación previa, crearla
        if (existingNotifications.empty) {
          const docRef = await addDoc(notificationsRef, notification);
          results.push({
            studentId,
            notificationId: docRef.id,
            status: 'sent'
          });
        } else {
          results.push({
            studentId,
            status: 'already-sent'
          });
        }
      }
    }

    return {
      success: true,
      sentNotifications: results.filter(r => r.status === 'sent').length,
      skippedNotifications: results.filter(r => r.status === 'already-sent').length,
      results
    };
  } catch (error) {
    console.error('Error al enviar notificaciones:', error);
    throw error;
  }
};

/**
 * Marca una notificación como leída
 * @param {String} notificationId - ID de la notificación
 * @returns {Promise} - Promesa con el resultado de la operación
 */
export const markNotificationAsRead = async (notificationId) => {
  // Implementación pendiente
};

/**
 * Obtiene las notificaciones de un usuario
 * @param {String} userId - ID del usuario
 * @returns {Promise} - Promesa con las notificaciones del usuario
 */
export const getUserNotifications = async (userId) => {
  // Implementación pendiente
};