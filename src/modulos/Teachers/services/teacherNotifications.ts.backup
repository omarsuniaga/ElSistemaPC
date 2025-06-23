import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  limit,
  deleteDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../../firebase';

// Tipos de notificaciones
export interface TeacherNotification {
  id?: string;
  type: 'class-invitation' | 'general' | 'reminder';
  title: string;
  message: string;
  teacherId: string; // ID del maestro destinatario
  fromUserId?: string; // ID del usuario que envía (para invitaciones)
  fromUserName?: string; // Nombre del usuario que envía
  classId?: string; // ID de la clase (para invitaciones)
  className?: string; // Nombre de la clase
  permissions?: {
    canTakeAttendance: boolean;
    canAddObservations: boolean;
    canViewAttendanceHistory: boolean;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'read' | 'unread' | 'invalid';
  createdAt: Date | Timestamp;
  expiresAt?: Date | Timestamp;
  data?: any; // Datos adicionales específicos del tipo de notificación
}

const TEACHER_NOTIFICATIONS_COLLECTION = 'TEACHER_NOTIFICATIONS';

/**
 * Crear una notificación de invitación a clase compartida
 */
export const createClassInvitationNotification = async (
  inviteData: {
    teacherId: string;
    teacherName: string;
    classId: string;
    className: string;
    fromUserId: string;
    fromUserName: string;
    permissions: {
      canTakeAttendance: boolean;
      canAddObservations: boolean;
      canViewAttendanceHistory: boolean;
    };
  }
): Promise<string> => {
  try {
    const notification: Omit<TeacherNotification, 'id'> = {
      type: 'class-invitation',
      title: 'Invitación a Clase Compartida',
      message: `${inviteData.fromUserName} te ha invitado a colaborar en la clase "${inviteData.className}"`,      teacherId: inviteData.teacherId,
      fromUserId: inviteData.fromUserId,
      fromUserName: inviteData.fromUserName,
      classId: inviteData.classId,
      className: inviteData.className,
      permissions: inviteData.permissions,
      status: 'pending',
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)), // Expira en 7 días
      data: {
        originalInviteData: inviteData
      }
    };

    const docRef = await addDoc(collection(db, TEACHER_NOTIFICATIONS_COLLECTION), notification);
    console.log('Notificación de invitación creada:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creando notificación de invitación:', error);
    throw error;
  }
};

/**
 * Obtener todas las notificaciones de un maestro
 */
export const getTeacherNotifications = async (teacherId: string): Promise<TeacherNotification[]> => {
  try {
    // Consulta simple sin orderBy para evitar requerir índice compuesto
    const q = query(
      collection(db, TEACHER_NOTIFICATIONS_COLLECTION),
      where('teacherId', '==', teacherId),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    const notifications: TeacherNotification[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt
      } as TeacherNotification);
    });    // Ordenar manualmente por fecha de creación (más reciente primero)
    notifications.sort((a, b) => {
      const getTimestamp = (date: Date | Timestamp | any): number => {
        if (date instanceof Date) {
          return date.getTime();
        }
        if (date && typeof date.toDate === 'function') {
          return date.toDate().getTime();
        }
        if (date && typeof date.seconds === 'number') {
          return date.seconds * 1000;
        }
        return 0;
      };
      
      return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
    });

    return notifications;
  } catch (error) {
    console.error('Error obteniendo notificaciones del maestro:', error);
    return [];
  }
};

/**
 * Obtener notificaciones pendientes de un maestro (solo invitaciones sin responder)
 */
export const getPendingInvitations = async (teacherId: string): Promise<TeacherNotification[]> => {
  try {
    // Usar consulta simple para evitar requerir índice compuesto
    const q = query(
      collection(db, TEACHER_NOTIFICATIONS_COLLECTION),
      where('teacherId', '==', teacherId),
      where('type', '==', 'class-invitation'),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    const notifications: TeacherNotification[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt
      } as TeacherNotification);
    });

    // Ordenar manualmente por fecha de creación (más reciente primero)
    notifications.sort((a, b) => {
      const getTimestamp = (date: Date | Timestamp | any): number => {
        if (date instanceof Date) {
          return date.getTime();
        }
        if (date && typeof date.toDate === 'function') {
          return date.toDate().getTime();
        }
        if (date && typeof date.seconds === 'number') {
          return date.seconds * 1000;
        }
        return 0;
      };
      
      return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
    });

    return notifications;
  } catch (error) {
    console.error('Error obteniendo invitaciones pendientes:', error);
    return [];
  }
};

/**
 * Aceptar una invitación de clase compartida
 */
export const acceptClassInvitation = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, TEACHER_NOTIFICATIONS_COLLECTION, notificationId);
    const notificationDoc = await getDoc(notificationRef);

    if (!notificationDoc.exists()) {
      throw new Error('Notificación no encontrada');
    }

    const notification = notificationDoc.data() as TeacherNotification;

    if (notification.type !== 'class-invitation') {
      throw new Error('Esta notificación no es una invitación de clase');
    }

    if (notification.status !== 'pending') {
      throw new Error('Esta invitación ya fue procesada');
    }    // Importar la función para añadir al maestro como asistente
    const { addAssistantTeacherToClass } = await import('../../Classes/service/classes');    console.log('🔍 [acceptClassInvitation] Notification data:', {
      id: notificationId,
      type: notification.type,
      classId: notification.classId,
      teacherId: notification.teacherId,
      status: notification.status,
      fromUserId: notification.fromUserId,
      permissions: notification.permissions
    });    // Verificar que la clase existe antes de proceder
    const classExists = await verifyClassExists(notification.classId!);
    if (!classExists) {
      console.error('❌ [acceptClassInvitation] La clase no existe:', notification.classId);
      
      // Listar clases disponibles para debug
      try {
        const { getDocs, collection } = await import('firebase/firestore');
        const classesSnapshot = await getDocs(collection(db, 'classes'));
        console.log('📋 [acceptClassInvitation] Clases disponibles:');
        classesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log(`  - ID: ${doc.id}, Name: ${data.name || 'Sin nombre'}`);
        });
      } catch (listError) {
        console.error('Error listando clases:', listError);
      }
      
      // Marcar la notificación como inválida en lugar de fallar
      await updateDoc(notificationRef, {
        status: 'invalid',
        invalidReason: 'Class not found',
        invalidAt: Timestamp.now()
      });
      
      throw new Error(`La clase con ID ${notification.classId} no existe en el sistema. La notificación ha sido marcada como inválida.`);
    }

    console.log('✅ [acceptClassInvitation] Clase verificada, procediendo a añadir maestro asistente...');

    // Añadir al maestro como asistente en la clase
    await addAssistantTeacherToClass({
      classId: notification.classId!,
      teacherId: notification.teacherId,
      permissions: notification.permissions!,
      invitedBy: notification.fromUserId!
    });// Actualizar el estado de la notificación
    await updateDoc(notificationRef, {
      status: 'accepted',
      acceptedAt: Timestamp.now()
    });

    console.log('Invitación aceptada exitosamente');
  } catch (error) {
    console.error('Error aceptando invitación:', error);
    throw error;
  }
};

/**
 * Rechazar una invitación de clase compartida
 */
export const rejectClassInvitation = async (notificationId: string, reason?: string): Promise<void> => {
  try {
    const notificationRef = doc(db, TEACHER_NOTIFICATIONS_COLLECTION, notificationId);
    const notificationDoc = await getDoc(notificationRef);

    if (!notificationDoc.exists()) {
      throw new Error('Notificación no encontrada');
    }

    const notification = notificationDoc.data() as TeacherNotification;

    if (notification.type !== 'class-invitation') {
      throw new Error('Esta notificación no es una invitación de clase');
    }

    if (notification.status !== 'pending') {
      throw new Error('Esta invitación ya fue procesada');
    }    // Actualizar el estado de la notificación
    await updateDoc(notificationRef, {
      status: 'rejected',
      rejectedAt: Timestamp.now(),
      rejectionReason: reason
    });

    console.log('Invitación rechazada');
  } catch (error) {
    console.error('Error rechazando invitación:', error);
    throw error;
  }
};

/**
 * Marcar una notificación como leída
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, TEACHER_NOTIFICATIONS_COLLECTION, notificationId);    await updateDoc(notificationRef, {
      status: 'read',
      readAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    throw error;
  }
};

/**
 * Eliminar una notificación
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, TEACHER_NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    throw error;
  }
};

/**
 * Escuchar notificaciones en tiempo real
 */
export const subscribeToTeacherNotifications = (
  teacherId: string, 
  callback: (notifications: TeacherNotification[]) => void
): (() => void) => {
  console.log('Configurando listener para notificaciones del maestro:', teacherId);
  
  // Usar consulta simple sin orderBy para evitar requerir índice compuesto
  const q = query(
    collection(db, TEACHER_NOTIFICATIONS_COLLECTION),
    where('teacherId', '==', teacherId),
    limit(50)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    console.log('Listener de notificaciones ejecutado, documentos recibidos:', querySnapshot.size);
    
    const notifications: TeacherNotification[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt
      } as TeacherNotification);
    });
    
    // Ordenar manualmente por fecha de creación (más reciente primero)
    notifications.sort((a, b) => {
      const getTimestamp = (date: Date | Timestamp | any): number => {
        if (date instanceof Date) {
          return date.getTime();
        }
        if (date && typeof date.toDate === 'function') {
          return date.toDate().getTime();
        }
        if (date && typeof date.seconds === 'number') {
          return date.seconds * 1000;
        }
        return 0;
      };
      
      return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
    });
    
    console.log('Notificaciones procesadas:', notifications.length);
    console.log('Invitaciones pendientes:', notifications.filter(n => n.type === 'class-invitation' && n.status === 'pending').length);
    
    callback(notifications);
  }, (error) => {
    console.error('Error en listener de notificaciones:', error);
  });
};

/**
 * Crear notificación general para un maestro
 */
export const createGeneralNotification = async (
  teacherId: string,
  title: string,
  message: string,
  data?: any
): Promise<string> => {
  try {    const notification: Omit<TeacherNotification, 'id'> = {
      type: 'general',
      title,
      message,
      teacherId,
      status: 'unread',
      createdAt: Timestamp.now(),
      data
    };

    const docRef = await addDoc(collection(db, TEACHER_NOTIFICATIONS_COLLECTION), notification);
    return docRef.id;
  } catch (error) {
    console.error('Error creando notificación general:', error);
    throw error;
  }
};

/**
 * Verifica que un classId existe en la base de datos
 */
const verifyClassExists = async (classId: string): Promise<boolean> => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const classRef = doc(db, 'classes', classId);
    const classDoc = await getDoc(classRef);
    return classDoc.exists();
  } catch (error) {
    console.error('Error verificando clase:', error);
    return false;
  }
};

/**
 * Filtrar notificaciones válidas (excluye las marcadas como inválidas)
 */
export const filterValidTeacherNotifications = (notifications: TeacherNotification[]): TeacherNotification[] => {
  return notifications.filter(notification => notification.status !== 'invalid');
};
