// Test simple para verificar comunicación con Firestore RBAC
// Se puede ejecutar desde la consola del navegador

window.testRBACFirestore = async function() {
  console.log('🚀 Iniciando test de comunicación RBAC con Firestore...')
  
  try {
    // Intentar importar el servicio RBAC desde el módulo correcto
    let RBACPersistenceService
    
    try {
      // Primero intentar la importación directa
      const module = await import('./src/services/rbac/rbacPersistenceService.ts')
      RBACPersistenceService = module.RBACPersistenceService
    } catch (error) {
      console.log('⚠️ Importación directa fallida, intentando método alternativo...')
      
      // Método alternativo: usar el composable
      const { useRBACManagement } = await import('./src/composables/useRBACManagement.ts')
      const rbac = useRBACManagement()
      
      // Simular el servicio usando el composable
      RBACPersistenceService = {
        getRoles: () => rbac.loadRoles().then(() => rbac.roles.value),
        getPermissions: () => rbac.loadPermissions().then(() => rbac.permissions.value),
        getNavigationConfig: () => rbac.loadNavigationConfig().then(() => rbac.navigationConfig.value),
        initializeDefaultConfig: rbac.forceInitializeRBAC
      }
    }
    
    console.log('✅ Servicio RBAC cargado correctamente')
    
    // Test 1: Intentar leer roles existentes
    console.log('\n📖 Test 1: Leyendo roles desde Firestore...')
    const roles = await RBACPersistenceService.getRoles()
    console.log(`✅ Roles obtenidos: ${Array.isArray(roles) ? roles.length : 'N/A'}`)
    
    if (Array.isArray(roles) && roles.length > 0) {
      console.log('🎭 Roles encontrados:')
      roles.forEach((role, index) => {
        console.log(`  ${index + 1}. ${role.name} (${role.permissions?.length || 0} permisos) - ${role.isActive ? 'Activo' : 'Inactivo'}`)
      })
    }
    
    // Test 2: Intentar leer permisos existentes
    console.log('\n📖 Test 2: Leyendo permisos desde Firestore...')
    const permissions = await RBACPersistenceService.getPermissions()
    console.log(`✅ Permisos obtenidos: ${Array.isArray(permissions) ? permissions.length : 'N/A'}`)
    
    if (Array.isArray(permissions) && permissions.length > 0) {
      const moduleCount = {}
      permissions.forEach(permission => {
        const module = permission.module || 'sin-modulo'
        moduleCount[module] = (moduleCount[module] || 0) + 1
      })
      
      console.log('🔑 Permisos por módulo:')
      Object.entries(moduleCount).forEach(([module, count]) => {
        console.log(`  📁 ${module}: ${count} permisos`)
      })
    }
    
    // Test 3: Intentar leer configuración de navegación
    console.log('\n📖 Test 3: Leyendo configuración de navegación...')
    const navigation = await RBACPersistenceService.getNavigationConfig()
    console.log(`✅ Elementos de navegación obtenidos: ${Array.isArray(navigation) ? navigation.length : 'N/A'}`)
    
    // Test 4: Probar inicialización si no hay datos
    if ((!Array.isArray(roles) || roles.length === 0) || (!Array.isArray(permissions) || permissions.length === 0)) {
      console.log('\n🔄 Test 4: No hay datos suficientes, probando inicialización...')
      try {
        await RBACPersistenceService.initializeDefaultConfig('test-user')
        console.log('✅ Inicialización completada')
        
        // Verificar datos después de inicialización
        const newRoles = await RBACPersistenceService.getRoles()
        const newPermissions = await RBACPersistenceService.getPermissions()
        console.log(`📊 Después de inicialización: ${newRoles?.length || 0} roles, ${newPermissions?.length || 0} permisos`)
      } catch (initError) {
        console.log('⚠️ Error en inicialización:', initError.message)
      }
    }
    
    console.log('\n🎉 ¡Test completado!')
    console.log('✅ La comunicación con Firestore parece estar funcionando')
    
    return {
      success: true,
      rolesCount: Array.isArray(roles) ? roles.length : 0,
      permissionsCount: Array.isArray(permissions) ? permissions.length : 0,
      navigationCount: Array.isArray(navigation) ? navigation.length : 0
    }
    
  } catch (error) {
    console.error('❌ Error en el test de Firestore:', error)
    console.error('🔍 Detalles del error:', error.message)
    console.error('📚 Stack trace:', error.stack)
    
    // Sugerencias de solución
    console.log('\n💡 Posibles soluciones:')
    console.log('1. Verificar que Firebase esté correctamente configurado')
    console.log('2. Verificar reglas de Firestore')
    console.log('3. Verificar que el usuario esté autenticado')
    console.log('4. Intentar ejecutar desde la interfaz web en /rbac-test')
    
    return {
      success: false,
      error: error.message
    }
  }
}

// Función para mostrar el estado actual de RBAC
window.showRBACStatus = async function() {
  try {
    console.log('📊 Estado actual del sistema RBAC')
    console.log('================================')
    
    const result = await window.testRBACFirestore()
    
    if (result.success) {
      console.log(`🎭 Roles: ${result.rolesCount}`)
      console.log(`🔑 Permisos: ${result.permissionsCount}`)
      console.log(`🧭 Navegación: ${result.navigationCount}`)
    } else {
      console.log('❌ No se pudo obtener el estado')
    }
    
    console.log('================================')
    
  } catch (error) {
    console.error('❌ Error obteniendo estado:', error)
  }
}

// Función para probar conexión básica con Firebase
window.testFirebaseConnection = async function() {
  try {
    console.log('🔥 Probando conexión básica con Firebase...')
    
    // Intentar acceder a Firebase
    const { db } = await import('./src/firebase.ts')
    console.log('✅ Firebase DB disponible')
    
    // Probar una operación básica
    const { doc, getDoc } = await import('firebase/firestore')
    const testDoc = doc(db, 'test', 'connection')
    
    console.log('🔍 Probando lectura básica...')
    const snapshot = await getDoc(testDoc)
    console.log('✅ Operación de lectura exitosa')
    
    return { success: true, message: 'Firebase funciona correctamente' }
    
  } catch (error) {
    console.error('❌ Error de conexión con Firebase:', error)
    return { success: false, error: error.message }
  }
}

console.log('🔧 Funciones de test RBAC cargadas:')
console.log('• testRBACFirestore() - Ejecutar test completo de RBAC')
console.log('• showRBACStatus() - Mostrar estado actual del sistema')
console.log('• testFirebaseConnection() - Probar conexión básica con Firebase')
console.log('\n💡 También puedes visitar /rbac-test para una interfaz visual')
