/**
 * Script para limpiar la notificación problemática específica
 */
console.log('🧹 Limpiador de Notificaciones Específicas - Iniciado');

// ID de la notificación problemática que vimos en los logs
const PROBLEMATIC_NOTIFICATION_ID = 'xD1SZzY8yvRCplmtnj01';
const PROBLEMATIC_CLASS_ID = 'weYLW7FRK6eYsewQ45hy';

// Función para eliminar la notificación problemática específica
window.deleteProblematicNotification = async function () {
  console.log('🗑️ Eliminando notificación problemática...');

  try {
    // Verificar que Firebase esté disponible
    const app = await import('/src/firebase.ts');
    const { getFirestore, doc, deleteDoc, getDoc } = await import('firebase/firestore');

    const db = getFirestore();

    // Referencia a la notificación problemática
    const notificationRef = doc(db, 'generalNotifications', PROBLEMATIC_NOTIFICATION_ID);

    // Verificar que existe antes de eliminar
    const notificationDoc = await getDoc(notificationRef);

    if (notificationDoc.exists()) {
      const data = notificationDoc.data();
      console.log('📋 Notificación encontrada:', {
        id: PROBLEMATIC_NOTIFICATION_ID,
        title: data.title,
        classId: data.classId,
        status: data.status,
      });

      // Eliminar la notificación
      await deleteDoc(notificationRef);
      console.log('✅ Notificación problemática eliminada exitosamente');

      // Recargar la página para actualizar la UI
      console.log('🔄 Recargando página para actualizar la interfaz...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.log('⚠️ La notificación no existe o ya fue eliminada');
    }
  } catch (error) {
    console.error('❌ Error eliminando notificación:', error);
  }
};

// Función para buscar y limpiar TODAS las notificaciones con clases inexistentes
window.cleanAllInvalidNotifications = async function () {
  console.log('🧹 Limpiando todas las notificaciones inválidas...');

  try {
    const app = await import('/src/firebase.ts');
    const { getFirestore, collection, getDocs, doc, deleteDoc, query, where } = await import(
      'firebase/firestore'
    );

    const db = getFirestore();

    // Obtener todas las clases existentes
    const classesSnapshot = await getDocs(collection(db, 'classes'));
    const validClassIds = new Set();
    classesSnapshot.docs.forEach((doc) => {
      validClassIds.add(doc.id);
    });

    console.log(`📚 Clases válidas encontradas: ${validClassIds.size}`);

    // Obtener todas las notificaciones de invitación
    const notificationsQuery = query(
      collection(db, 'generalNotifications'),
      where('type', '==', 'class-invitation'),
    );

    const notificationsSnapshot = await getDocs(notificationsQuery);
    console.log(`📧 Notificaciones de invitación encontradas: ${notificationsSnapshot.size}`);

    let deletedCount = 0;

    // Verificar cada notificación
    for (const notificationDoc of notificationsSnapshot.docs) {
      const data = notificationDoc.data();

      if (data.classId && !validClassIds.has(data.classId)) {
        console.log(
          `🗑️ Eliminando notificación inválida: ${notificationDoc.id} (clase: ${data.classId})`,
        );
        await deleteDoc(notificationDoc.ref);
        deletedCount++;
      }
    }

    console.log(`✅ Limpieza completada. Notificaciones eliminadas: ${deletedCount}`);

    if (deletedCount > 0) {
      console.log('🔄 Recargando página para actualizar la interfaz...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    console.error('❌ Error en limpieza masiva:', error);
  }
};

// Función para verificar el estado actual
window.checkNotificationStatus = async function () {
  console.log('📊 Verificando estado de notificaciones...');

  try {
    const app = await import('/src/firebase.ts');
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');

    const db = getFirestore();

    // Verificar la notificación específica
    const notificationRef = doc(db, 'generalNotifications', PROBLEMATIC_NOTIFICATION_ID);
    const notificationDoc = await getDoc(notificationRef);

    if (notificationDoc.exists()) {
      console.log('📧 Notificación problemática aún existe:', notificationDoc.data());
    } else {
      console.log('✅ Notificación problemática ya no existe');
    }

    // Verificar la clase específica
    const classRef = doc(db, 'classes', PROBLEMATIC_CLASS_ID);
    const classDoc = await getDoc(classRef);

    if (classDoc.exists()) {
      console.log('📚 Clase existe:', classDoc.data().name);
    } else {
      console.log('❌ Clase no existe:', PROBLEMATIC_CLASS_ID);
    }
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
  }
};

console.log('🎮 Funciones disponibles:');
console.log('  - window.deleteProblematicNotification() - Eliminar notificación específica');
console.log('  - window.cleanAllInvalidNotifications() - Limpiar todas las inválidas');
console.log('  - window.checkNotificationStatus() - Verificar estado actual');
console.log('');
console.log('💡 Recomendación: Ejecutar window.deleteProblematicNotification() primero');

// Auto-verificar estado
setTimeout(() => {
  window.checkNotificationStatus();
}, 1000);
