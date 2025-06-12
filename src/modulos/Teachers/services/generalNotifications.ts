import { 
  collection, 
  addDoc, 
  doc, 
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

// Tipos de notificaciones generales
export interface GeneralNotification {
  id?: string;
  type: 'student-registration' | 'general-announcement' | 'class-update' | 'system-update';
  title: string;
  message: string;
  teacherId: string; // ID del maestro destinatario
  fromUserId?: string; // ID del usuario que envía (admin/director)
  fromUserName?: string; // Nombre del usuario que envía
  studentId?: string; // ID del estudiante (para registros de estudiantes)
  studentName?: string; // Nombre del estudiante
  studentData?: any; // Datos completos del estudiante para registro rápido
  classId?: string; // ID de la clase relacionada
  className?: string; // Nombre de la clase relacionada
  status: 'unread' | 'read' | 'dismissed' | 'action-taken' | 'invalid';
  createdAt: Date | Timestamp;
  expiresAt?: Date | Timestamp;
  actionType?: 'assign-to-class' | 'none'; // Tipo de acción disponible
  data?: any; // Datos adicionales específicos del tipo de notificación
}

const GENERAL_NOTIFICATIONS_COLLECTION = 'GENERAL_NOTIFICATIONS';

/**
 * Crear una notificación de registro de estudiante
 */
export const createStudentRegistrationNotification = async (
  notificationData: {
    teacherId: string;
    studentId: string;
    studentName: string;
    studentData: any;
    fromUserId: string;
    fromUserName: string;
  }
): Promise<string> => {
  try {
    const notification: Omit<GeneralNotification, 'id'> = {
      type: 'student-registration',
      title: 'Nuevo Estudiante Registrado',
      message: `Se ha registrado un nuevo estudiante: ${notificationData.studentName}`,
      teacherId: notificationData.teacherId,
      fromUserId: notificationData.fromUserId,
      fromUserName: notificationData.fromUserName,
      studentId: notificationData.studentId,
      studentName: notificationData.studentName,
      studentData: notificationData.studentData,
      status: 'unread',
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)), // Expira en 30 días
      actionType: 'assign-to-class',
      data: {
        canAssignToClass: true
      }
    };

    const docRef = await addDoc(collection(db, GENERAL_NOTIFICATIONS_COLLECTION), notification);
    console.log('Notificación de registro de estudiante creada:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creando notificación de registro:', error);
    throw error;
  }
};

/**
 * Crear una notificación general para todos los maestros
 */
export const createGeneralAnnouncementForAllTeachers = async (
  announcementData: {
    title: string;
    message: string;
    fromUserId: string;
    fromUserName: string;
    teacherIds: string[]; // Array de IDs de maestros
    expiresInDays?: number; // Días hasta que expire (por defecto 7)
  }
): Promise<string[]> => {
  try {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + (announcementData.expiresInDays || 7));

    const notificationPromises = announcementData.teacherIds.map(async (teacherId) => {
      const notification: Omit<GeneralNotification, 'id'> = {
        type: 'general-announcement',
        title: announcementData.title,
        message: announcementData.message,
        teacherId: teacherId,
        fromUserId: announcementData.fromUserId,
        fromUserName: announcementData.fromUserName,
        status: 'unread',
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expirationDate),
        actionType: 'none'
      };

      const docRef = await addDoc(collection(db, GENERAL_NOTIFICATIONS_COLLECTION), notification);
      return docRef.id;
    });

    const notificationIds = await Promise.all(notificationPromises);
    console.log(`Notificación general creada para ${notificationIds.length} maestros`);
    return notificationIds;
  } catch (error) {
    console.error('Error creando notificación general:', error);
    throw error;
  }
};

/**
 * Obtener todas las notificaciones de un maestro
 */
export const getGeneralNotifications = async (teacherId: string): Promise<GeneralNotification[]> => {
  try {
    const q = query(
      collection(db, GENERAL_NOTIFICATIONS_COLLECTION),
      where('teacherId', '==', teacherId),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    const notifications: GeneralNotification[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt
      } as GeneralNotification);
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
    console.error('Error obteniendo notificaciones generales:', error);
    return [];
  }
};

/**
 * Obtener notificaciones no leídas de un maestro
 */
export const getUnreadNotifications = async (teacherId: string): Promise<GeneralNotification[]> => {
  try {
    const q = query(
      collection(db, GENERAL_NOTIFICATIONS_COLLECTION),
      where('teacherId', '==', teacherId),
      where('status', '==', 'unread')
    );

    const querySnapshot = await getDocs(q);
    const notifications: GeneralNotification[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt
      } as GeneralNotification);
    });

    // Ordenar por fecha
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
    console.error('Error obteniendo notificaciones no leídas:', error);
    return [];
  }
};

/**
 * Marcar una notificación como leída
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, GENERAL_NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      status: 'read',
      readAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    throw error;
  }
};

/**
 * Marcar una notificación como desestimada
 */
export const dismissNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, GENERAL_NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      status: 'dismissed',
      dismissedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error desestimando notificación:', error);
    throw error;
  }
};

/**
 * Marcar que se tomó acción en una notificación
 */
export const markActionTaken = async (
  notificationId: string, 
  actionDetails?: any
): Promise<void> => {
  try {
    const notificationRef = doc(db, GENERAL_NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      status: 'action-taken',
      actionTakenAt: Timestamp.now(),
      actionDetails: actionDetails
    });
  } catch (error) {
    console.error('Error marcando acción tomada:', error);
    throw error;
  }
};

/**
 * Eliminar una notificación
 */
export const deleteGeneralNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, GENERAL_NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error('Error eliminando notificación general:', error);
    throw error;
  }
};

/**
 * Escuchar notificaciones generales en tiempo real
 */
export const subscribeToGeneralNotifications = (
  teacherId: string, 
  callback: (notifications: GeneralNotification[]) => void
): (() => void) => {
  console.log('Configurando listener para notificaciones generales del maestro:', teacherId);
  
  const q = query(
    collection(db, GENERAL_NOTIFICATIONS_COLLECTION),
    where('teacherId', '==', teacherId),
    limit(50)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    console.log('Listener de notificaciones generales ejecutado, documentos recibidos:', querySnapshot.size);
    
    const notifications: GeneralNotification[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt
      } as GeneralNotification);
    });
    
    // Ordenar por fecha
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
    
    console.log('Notificaciones generales procesadas:', notifications.length);
    console.log('No leídas:', notifications.filter(n => n.status === 'unread').length);
    
    callback(notifications);
  }, (error) => {
    console.error('Error en listener de notificaciones generales:', error);
  });
};

/**
 * Filtrar notificaciones válidas (excluye las marcadas como inválidas)
 */
export const filterValidNotifications = (notifications: GeneralNotification[]): GeneralNotification[] => {
  return notifications.filter(notification => notification.status !== 'invalid');
};
