// Servicio Central de Notificaciones Administrativas
// Gestiona todas las notificaciones para roles de administración

import { db, isFirebaseReady } from '@/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

// Interfaces
interface BaseNotification {
  id?: string
  type: string
  title: string
  message: string
  timestamp: Date
  read: boolean
  urgency: 'low' | 'medium' | 'high'
  userId?: string
  userName?: string
  metadata?: Record<string, any>
}

interface TeacherLoginNotification extends BaseNotification {
  type: 'teacher_login'
  teacherId: string
  teacherName: string
  loginTime: Date
  deviceInfo?: string
}

interface AttendanceNotification extends BaseNotification {
  type: 'attendance_report'
  teacherId: string
  teacherName: string
  classId: string
  className: string
  totalStudents: number
  presentes: number
  ausentes: number
  tarde: number
  justificados: number
}

interface ObservationNotification extends BaseNotification {
  type: 'student_observation'
  teacherId: string
  teacherName: string
  studentId: string
  studentName: string
  observationType: 'positive' | 'negative' | 'neutral'
  severity?: 'low' | 'medium' | 'high'
}

type AdminNotification = TeacherLoginNotification | AttendanceNotification | ObservationNotification

// Colecciones
const NOTIFICATIONS_COLLECTION = 'ADMIN_NOTIFICATIONS';
const USERS_COLLECTION = 'USERS';

/**
 * Obtiene información del usuario
 */
const getUserInfo = async (
  userId: string,
): Promise<{name: string; email?: string; role?: string}> => {
  try {
    if (!isFirebaseReady() || !db) {
      return { name: `Usuario ${userId}` };
    }

    const userQuery = query(collection(db, USERS_COLLECTION), where('uid', '==', userId), limit(1));

    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      return {
        name:
          `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Usuario desconocido',
        email: userData.email,
        role: userData.role,
      };
    }

    return { name: `Usuario ${userId}` };
  } catch (error) {
    console.error('Error obteniendo información del usuario:', error);
    return { name: `Usuario ${userId}` };
  }
};

/**
 * Crea notificación de login de profesor
 */
export const createTeacherLoginNotification = async (teacherId: string): Promise<void> => {
  try {
    if (!isFirebaseReady() || !db) {
      console.warn('Firebase no está listo, no se puede crear notificación de login');
      return;
    }

    const teacherInfo = await getUserInfo(teacherId);

    // Solo crear notificación si es un profesor
    if (teacherInfo.role !== 'Maestro') {
      return;
    }

    const notification: Omit<TeacherLoginNotification, 'id'> = {
      type: 'teacher_login',
      title: '👨‍🏫 Profesor Conectado',
      message: `${teacherInfo.name} ha iniciado sesión en el sistema`,
      teacherId,
      teacherName: teacherInfo.name,
      loginTime: new Date(),
      timestamp: new Date(),
      read: false,
      urgency: 'low',
      metadata: {
        userAgent: navigator.userAgent,
        loginIP: 'N/A', // Se podría implementar detección de IP
      },
    };

    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notification,
      timestamp: serverTimestamp(),
      loginTime: serverTimestamp(),
    });

    console.log(`✅ Notificación de login creada para: ${teacherInfo.name}`);
  } catch (error) {
    console.error('❌ Error creando notificación de login:', error);
  }
};

/**
 * Crea notificación de observación de estudiante
 */
export const createStudentObservationNotification = async (data: {
  teacherId: string
  studentId: string
  observationType: 'positive' | 'negative' | 'neutral'
  observationText: string
  severity?: 'low' | 'medium' | 'high'
}): Promise<void> => {
  try {
    if (!isFirebaseReady() || !db) {
      console.warn('Firebase no está listo, no se puede crear notificación de observación');
      return;
    }

    const [teacherInfo, studentInfo] = await Promise.all([
      getUserInfo(data.teacherId),
      getUserInfo(data.studentId),
    ]);

    // Determinar urgencia basada en el tipo y severidad
    let urgency: 'low' | 'medium' | 'high' = 'low';
    if (data.observationType === 'negative') {
      urgency = data.severity || 'medium';
    } else if (data.observationType === 'positive') {
      urgency = 'low';
    }

    // Crear mensaje contextualizado
    let message = `${teacherInfo.name} registró una observación ${data.observationType} para ${studentInfo.name}`;
    
    if (data.observationType === 'negative' && data.severity === 'high') {
      message += ' ⚠️ REQUIERE ATENCIÓN INMEDIATA';
    } else if (data.observationType === 'positive') {
      message += ' 🌟 ¡Felicitaciones!';
    }

    const notification: Omit<ObservationNotification, 'id'> = {
      type: 'student_observation',
      title: `📝 Nueva Observación ${data.observationType === 'positive' ? 'Positiva' : data.observationType === 'negative' ? 'Negativa' : ''}`,
      message,
      teacherId: data.teacherId,
      teacherName: teacherInfo.name,
      studentId: data.studentId,
      studentName: studentInfo.name,
      observationType: data.observationType,
      severity: data.severity,
      timestamp: new Date(),
      read: false,
      urgency,
      metadata: {
        observationText: data.observationText,
        createdAt: new Date().toISOString(),
      },
    };

    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notification,
      timestamp: serverTimestamp(),
    });

    console.log(
      `✅ Notificación de observación creada: ${data.observationType} para ${studentInfo.name}`,
    );
  } catch (error) {
    console.error('❌ Error creando notificación de observación:', error);
  }
};

/**
 * Obtiene todas las notificaciones no leídas
 */
export const getUnreadNotifications = async (): Promise<AdminNotification[]> => {
  try {
    if (!isFirebaseReady() || !db) {
      console.warn('Firebase no está listo para obtener notificaciones');
      return [];
    }

    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('read', '==', false),
      orderBy('timestamp', 'desc'),
      limit(50),
    );

    const notificationsSnapshot = await getDocs(notificationsQuery);

    return notificationsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        }) as AdminNotification,
    );
  } catch (error) {
    console.error('Error obteniendo notificaciones no leídas:', error);
    return [];
  }
};

/**
 * Obtiene todas las notificaciones (leídas y no leídas)
 */
export const getAllNotifications = async (
  limitCount: number = 100,
): Promise<AdminNotification[]> => {
  try {
    if (!isFirebaseReady() || !db) {
      console.warn('Firebase no está listo para obtener todas las notificaciones');
      return [];
    }

    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(limitCount),
    );

    const notificationsSnapshot = await getDocs(notificationsQuery);

    return notificationsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        }) as AdminNotification,
    );
  } catch (error) {
    console.error('Error obteniendo todas las notificaciones:', error);
    return [];
  }
};

/**
 * Marca una notificación como leída
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    if (!isFirebaseReady() || !db) {
      console.warn('Firebase no está listo para marcar notificación como leída');
      return;
    }

    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
      read: true,
      readAt: serverTimestamp(),
    });

    console.log(`✅ Notificación ${notificationId} marcada como leída`);
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
  }
};

/**
 * Marca todas las notificaciones como leídas
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    if (!isFirebaseReady() || !db) {
      console.warn('Firebase no está listo para marcar todas las notificaciones como leídas');
      return;
    }

    // Obtener todas las notificaciones no leídas
    const unreadQuery = query(collection(db, NOTIFICATIONS_COLLECTION), where('read', '==', false));

    const unreadSnapshot = await getDocs(unreadQuery);

    if (unreadSnapshot.empty) {
      console.log('No hay notificaciones no leídas');
      return;
    }

    // Usar batch para actualizar todas de una vez
    const batch = writeBatch(db);

    unreadSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        readAt: serverTimestamp(),
      });
    });

    await batch.commit();

    console.log(`✅ ${unreadSnapshot.docs.length} notificaciones marcadas como leídas`);
  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
  }
};

/**
 * Elimina una notificación específica
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    if (!isFirebaseReady() || !db) {
      console.warn('Firebase no está listo para eliminar notificación');
      return;
    }

    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));

    console.log(`✅ Notificación ${notificationId} eliminada`);
  } catch (error) {
    console.error('Error eliminando notificación:', error);
  }
};

/**
 * Limpia todas las notificaciones (usar con precaución)
 */
export const clearAllNotifications = async (): Promise<void> => {
  try {
    if (!isFirebaseReady() || !db) {
      console.warn('Firebase no está listo para limpiar notificaciones');
      return;
    }

    // Obtener todas las notificaciones en lotes para evitar problemas de memoria
    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      limit(500), // Procesar en lotes de 500
    );

    let hasMore = true;
    let totalDeleted = 0;

    while (hasMore) {
      const snapshot = await getDocs(notificationsQuery);
      
      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      // Usar batch para eliminar en lotes
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      totalDeleted += snapshot.docs.length;

      // Si obtuvimos menos documentos que el límite, ya no hay más
      if (snapshot.docs.length < 500) {
        hasMore = false;
      }
    }

    console.log(`✅ ${totalDeleted} notificaciones eliminadas de la colección`);
  } catch (error) {
    console.error('Error limpiando todas las notificaciones:', error);
  }
};

/**
 * Obtiene estadísticas de notificaciones
 */
export const getNotificationStats = async (): Promise<{
  total: number
  unread: number
  byType: Record<string, number>
  byUrgency: Record<string, number>
}> => {
  try {
    if (!isFirebaseReady() || !db) {
      return { total: 0, unread: 0, byType: {}, byUrgency: {} };
    }

    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(1000), // Limitar para performance
    );

    const snapshot = await getDocs(notificationsQuery);

    const stats = {
      total: 0,
      unread: 0,
      byType: {} as Record<string, number>,
      byUrgency: {} as Record<string, number>,
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      stats.total++;

      if (!data.read) {
        stats.unread++;
      }

      // Contar por tipo
      const type = data.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Contar por urgencia
      const urgency = data.urgency || 'low';
      stats.byUrgency[urgency] = (stats.byUrgency[urgency] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de notificaciones:', error);
    return { total: 0, unread: 0, byType: {}, byUrgency: {} };
  }
};

/**
 * Escucha notificaciones en tiempo real
 */
export const watchNotifications = (
  callback: (notifications: AdminNotification[]) => void,
): (() => void) => {
  try {
    if (!isFirebaseReady() || !db) {
      console.warn('Firebase no está listo para escuchar notificaciones');
      return () => {};
    }

    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(50),
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
          }) as AdminNotification,
      );

      callback(notifications);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error configurando listener de notificaciones:', error);
    return () => {};
  }
};

// Servicio principal exportado
export const adminNotificationService = {
  createTeacherLoginNotification,
  createStudentObservationNotification,
  getUnreadNotifications,
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationStats,
  watchNotifications,
};

export default adminNotificationService;
