// 🔍 Script de diagnóstico Firebase
// Verifica problemas de inicialización y configuración

console.log("🔍 [Firebase Debug] Iniciando diagnóstico Firebase...")

// Verificar variables de entorno
console.log("\n📋 [Firebase Debug] Variables de entorno:")
console.log("VITE_APP_API_KEY:", import.meta.env.VITE_APP_API_KEY ? "✅ Definida" : "❌ Faltante")
console.log("VITE_APP_AUTH_DOMAIN:", import.meta.env.VITE_APP_AUTH_DOMAIN ? "✅ Definida" : "❌ Faltante")
console.log("VITE_APP_PROJECT_ID:", import.meta.env.VITE_APP_PROJECT_ID ? "✅ Definida" : "❌ Faltante")
console.log("VITE_USE_EMULATORS:", import.meta.env.VITE_USE_EMULATORS)

// Verificar imports dinámicos
console.log("\n🔧 [Firebase Debug] Verificando imports...")

import("../firebase")
  .then((firebaseModule) => {
    console.log("✅ [Firebase Debug] Firebase module importado correctamente")
    
    const { app, db, auth, storage, functions, isFirebaseReady } = firebaseModule
    
    console.log("\n📊 [Firebase Debug] Estado de servicios:")
    console.log("App:", app ? "✅ Inicializada" : "❌ No inicializada")
    console.log("Database:", db ? "✅ Disponible" : "❌ No disponible")
    console.log("Auth:", auth ? "✅ Disponible" : "❌ No disponible")
    console.log("Storage:", storage ? "✅ Disponible" : "❌ No disponible")
    console.log("Functions:", functions ? "✅ Disponible" : "❌ No disponible")
    
    if (isFirebaseReady) {
      console.log("\n✅ [Firebase Debug] Firebase está completamente listo:", isFirebaseReady())
    } else {
      console.log("\n❌ [Firebase Debug] Firebase NO está listo")
    }
    
    // Verificar si functions está correctamente inicializado
    if (functions) {
      try {
        console.log("🔧 [Firebase Debug] Verificando Functions...")
        import("firebase/functions")
          .then((functionsModule) => {
            const { httpsCallable } = functionsModule
            const testFunction = httpsCallable(functions, "getStudentAttendanceSummary")
            console.log("✅ [Firebase Debug] Functions callable creado correctamente")
          })
          .catch((error) => {
            console.error("❌ [Firebase Debug] Error creando callable:", error)
          })
      } catch (error) {
        console.error("❌ [Firebase Debug] Error verificando Functions:", error)
      }
    }
    
  })
  .catch((error) => {
    console.error("❌ [Firebase Debug] Error importando Firebase:", error)
  })

// Verificar attendanceNotifications
console.log("\n📱 [Firebase Debug] Verificando attendanceNotifications...")
import("../services/attendanceNotifications")
  .then((notificationsModule) => {
    console.log("✅ [Firebase Debug] AttendanceNotifications importado correctamente")
  })
  .catch((error) => {
    console.error("❌ [Firebase Debug] Error importando AttendanceNotifications:", error)
    console.error("Error details:", error.message)
  })

export {}
