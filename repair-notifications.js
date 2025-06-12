/**
 * Script para reparar notificaciones con IDs de clase inválidos
 */
console.log('🔧 Reparador de Notificaciones - Iniciado');

// Función para verificar y reparar notificaciones
window.repairNotifications = async function() {
  console.log('🔍 Verificando notificaciones...');
  
  try {
    // Esta función debe ejecutarse en la consola del navegador donde Firebase esté disponible
    if (typeof firebase === 'undefined' && typeof window.firebase === 'undefined') {
      console.error('❌ Firebase no está disponible. Ejecuta este script en la consola del navegador.');
      return;
    }
    
    const db = firebase.firestore ? firebase.firestore() : window.firebase.firestore();
    
    // Obtener todas las notificaciones
    const notificationsSnapshot = await db.collection('generalNotifications').get();
    console.log(`📊 Total de notificaciones: ${notificationsSnapshot.size}`);
    
    // Obtener todas las clases para verificar IDs válidos
    const classesSnapshot = await db.collection('classes').get();
    const validClassIds = new Set();
    classesSnapshot.docs.forEach(doc => {
      validClassIds.add(doc.id);
    });
    
    console.log(`📚 Total de clases válidas: ${validClassIds.size}`);
    console.log('📋 IDs de clases válidas:', Array.from(validClassIds));
    
    // Verificar notificaciones
    let invalidCount = 0;
    let repairedCount = 0;
    
    for (const doc of notificationsSnapshot.docs) {
      const data = doc.data();
      
      if (data.type === 'class-invitation' && data.classId) {
        if (!validClassIds.has(data.classId)) {
          console.warn(`⚠️ Notificación ${doc.id} tiene classId inválido: ${data.classId}`);
          invalidCount++;
          
          // Opción 1: Eliminar la notificación inválida
          console.log(`🗑️ Eliminando notificación inválida: ${doc.id}`);
          await doc.ref.delete();
          repairedCount++;
          
          /* Opción 2: Intentar reparar con el primer ID de clase válido
          if (validClassIds.size > 0) {
            const firstValidClassId = Array.from(validClassIds)[0];
            console.log(`🔧 Reparando notificación ${doc.id}: ${data.classId} → ${firstValidClassId}`);
            await doc.ref.update({ classId: firstValidClassId });
            repairedCount++;
          }
          */
        }
      }
    }
    
    console.log(`✅ Verificación completada:`);
    console.log(`  - Notificaciones inválidas encontradas: ${invalidCount}`);
    console.log(`  - Notificaciones reparadas: ${repairedCount}`);
    
  } catch (error) {
    console.error('❌ Error reparando notificaciones:', error);
  }
};

// Función para crear notificaciones de prueba con IDs válidos
window.createValidTestNotifications = async function() {
  console.log('📝 Creando notificaciones de prueba con IDs válidos...');
  
  try {
    const db = firebase.firestore ? firebase.firestore() : window.firebase.firestore();
    
    // Obtener el primer ID de clase válido
    const classesSnapshot = await db.collection('classes').limit(1).get();
    if (classesSnapshot.empty) {
      console.error('❌ No hay clases disponibles para crear notificaciones de prueba');
      return;
    }
    
    const validClassId = classesSnapshot.docs[0].id;
    const className = classesSnapshot.docs[0].data().name;
    
    console.log(`✅ Usando clase válida: ${className} (${validClassId})`);
    
    // Crear notificación de invitación válida
    const testNotification = {
      title: 'Invitación de Clase de Prueba',
      message: `Has sido invitado como asistente a la clase: ${className}`,
      type: 'class-invitation',
      status: 'pending',
      teacherId: 'current-teacher-id', // Se debe reemplazar con el ID real del maestro
      classId: validClassId,
      fromUserId: 'test-admin-id',
      permissions: {
        canTakeAttendance: true,
        canViewStudents: true,
        canAddObservations: true,
        canEditClass: false,
        canManageTeachers: false
      },
      createdAt: firebase.firestore.Timestamp.now(),
      expiresAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    };
    
    await db.collection('generalNotifications').add(testNotification);
    console.log('✅ Notificación de prueba creada exitosamente');
    
  } catch (error) {
    console.error('❌ Error creando notificación de prueba:', error);
  }
};

console.log('🎮 Funciones disponibles:');
console.log('  - window.repairNotifications() - Verificar y reparar notificaciones inválidas');
console.log('  - window.createValidTestNotifications() - Crear notificaciones de prueba válidas');
console.log('');
console.log('💡 Para usar: Abre la consola del navegador en la página del dashboard y ejecuta las funciones.');
