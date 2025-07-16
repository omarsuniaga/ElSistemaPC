// 🔍 Script de diagnóstico Firebase
// Verifica problemas de inicialización y configuración

console.log('🔍 [Firebase Debug] Iniciando diagnóstico Firebase...');

// Verificar variables de entorno
console.log('\n📋 [Firebase Debug] Variables de entorno:');
console.log('VITE_APP_API_KEY:', import.meta.env.VITE_APP_API_KEY ? '✅ Definida' : '❌ Faltante');
console.log(
  'VITE_APP_AUTH_DOMAIN:',
  import.meta.env.VITE_APP_AUTH_DOMAIN ? '✅ Definida' : '❌ Faltante',
);
console.log(
  'VITE_APP_PROJECT_ID:',
  import.meta.env.VITE_APP_PROJECT_ID ? '✅ Definida' : '❌ Faltante',
);
console.log('VITE_USE_EMULATORS:', import.meta.env.VITE_USE_EMULATORS);

// Verificar imports dinámicos
console.log('\n🔧 [Firebase Debug] Verificando imports...');

import('../firebase')
  .then((firebaseModule) => {
    console.log('✅ [Firebase Debug] Firebase module importado correctamente');
    
    const { app, db, auth, storage, functions, isFirebaseReady } = firebaseModule;
    
    console.log('\n📊 [Firebase Debug] Estado de servicios:');
    console.log('App:', app ? '✅ Inicializada' : '❌ No inicializada');
    console.log('Database:', db ? '✅ Disponible' : '❌ No disponible');
    console.log('Auth:', auth ? '✅ Disponible' : '❌ No disponible');
    console.log('Storage:', storage ? '✅ Disponible' : '❌ No disponible');
    console.log('Functions:', functions ? '✅ Disponible' : '❌ No disponible');
    
    if (isFirebaseReady) {
      console.log('\n✅ [Firebase Debug] Firebase está completamente listo:', isFirebaseReady());
    } else {
      console.log('\n❌ [Firebase Debug] Firebase NO está listo');
    }
    
    // Verificar si functions está correctamente inicializado
    if (functions) {
      try {
        console.log('🔧 [Firebase Debug] Verificando Functions...');
        import('firebase/functions')
          .then((functionsModule) => {
            const { httpsCallable } = functionsModule;
            const _testFunction = httpsCallable(functions, 'getStudentAttendanceSummary');
            console.log('✅ [Firebase Debug] Functions callable creado correctamente');
          })
          .catch((error) => {
            console.error('❌ [Firebase Debug] Error creando callable:', error);
          });
      } catch (error) {
        console.error('❌ [Firebase Debug] Error verificando Functions:', error);
      }
    }
  })
  .catch((error) => {
    console.error('❌ [Firebase Debug] Error importando Firebase:', error);
  });

// Verificar attendanceNotifications con inicialización diferida
console.log('\n📱 [Firebase Debug] Verificando attendanceNotifications...');

// Usar el nuevo inicializador de Firebase
import('../services/firebaseInitializer')
  .then(({ waitForFirebase }) => {
    console.log('🔍 [Firebase Debug] Esperando que Firebase esté completamente listo...');
    return waitForFirebase(10000); // 10 segundos de timeout
  })
  .then((firebaseState) => {
    console.log('✅ [Firebase Debug] Firebase está listo:', firebaseState.isReady);
    
    // Ahora intentar importar attendanceNotifications
    return import('../services/attendanceNotifications');
  })
  .then((notificationsModule) => {
    console.log('✅ [Firebase Debug] AttendanceNotifications importado correctamente');
    
    // Intentar inicializar después del login (simulado)
    if (notificationsModule.initializeAttendanceNotificationsAfterLogin) {
      return notificationsModule.initializeAttendanceNotificationsAfterLogin();
    }
    return false;
  })
  .then((initialized) => {
    console.log('📱 [Firebase Debug] Inicialización post-login:', initialized ? '✅' : '⚠️');
  })
  .catch((error) => {
    console.error('❌ [Firebase Debug] Error en la secuencia de inicialización:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', errorMessage);
  });

export {};
