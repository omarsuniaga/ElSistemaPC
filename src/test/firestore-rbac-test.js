// Test de comunicación con Firestore para RBAC
// src/test/firestore-rbac-test.js

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

// Configuración de Firebase (usando las mismas credenciales del proyecto)
const firebaseConfig = {
  // Estas deberían ser las mismas credenciales de tu firebase.ts
  // Por seguridad, las tomaremos del archivo existente
}

// Función para probar la conexión con Firestore
async function testFirestoreConnection() {
  try {
    console.log('🔄 Iniciando test de conexión con Firestore...')
    
    // Intentar leer la configuración desde el archivo de Firebase existente
    const { db } = await import('../firebase.js')
    
    console.log('✅ Conexión con Firebase establecida')
    
    // Test 1: Verificar si las colecciones RBAC existen
    await testRBACCollections(db)
    
    // Test 2: Probar escritura y lectura de datos de prueba
    await testWriteReadData(db)
    
    // Test 3: Verificar la estructura de datos
    await testDataStructure(db)
    
    console.log('🎉 ¡Todos los tests de Firestore completados exitosamente!')
    
  } catch (error) {
    console.error('❌ Error en el test de Firestore:', error)
    throw error
  }
}

// Test 1: Verificar colecciones RBAC
async function testRBACCollections(db) {
  console.log('\n📂 Test 1: Verificando colecciones RBAC...')
  
  try {
    // Verificar colección de roles
    const rolesRef = doc(db, 'RBAC_CONFIG', 'roles')
    const rolesSnap = await getDoc(rolesRef)
    
    if (rolesSnap.exists()) {
      const rolesData = rolesSnap.data()
      console.log('✅ Colección de roles encontrada:', rolesData.roles?.length || 0, 'roles')
    } else {
      console.log('⚠️  Colección de roles no existe aún')
    }
    
    // Verificar colección de permisos
    const permissionsRef = doc(db, 'RBAC_CONFIG', 'permissions')
    const permissionsSnap = await getDoc(permissionsRef)
    
    if (permissionsSnap.exists()) {
      const permissionsData = permissionsSnap.data()
      console.log('✅ Colección de permisos encontrada:', permissionsData.permissions?.length || 0, 'permisos')
    } else {
      console.log('⚠️  Colección de permisos no existe aún')
    }
    
    // Verificar colección de navegación
    const navRef = doc(db, 'NAVIGATION_CONFIG', 'config')
    const navSnap = await getDoc(navRef)
    
    if (navSnap.exists()) {
      const navData = navSnap.data()
      console.log('✅ Colección de navegación encontrada:', navData.navigationItems?.length || 0, 'elementos')
    } else {
      console.log('⚠️  Colección de navegación no existe aún')
    }
    
  } catch (error) {
    console.error('❌ Error verificando colecciones:', error)
    throw error
  }
}

// Test 2: Probar escritura y lectura
async function testWriteReadData(db) {
  console.log('\n💾 Test 2: Probando escritura y lectura...')
  
  try {
    const testDocRef = doc(db, 'RBAC_TEST', 'connection_test')
    
    // Escribir datos de prueba
    const testData = {
      message: 'Test de conexión RBAC',
      timestamp: serverTimestamp(),
      testId: `test-${Date.now()}`
    }
    
    console.log('📝 Escribiendo datos de prueba...')
    await setDoc(testDocRef, testData)
    console.log('✅ Datos escritos exitosamente')
    
    // Leer datos de prueba
    console.log('📖 Leyendo datos de prueba...')
    const testSnap = await getDoc(testDocRef)
    
    if (testSnap.exists()) {
      const readData = testSnap.data()
      console.log('✅ Datos leídos exitosamente:', readData.message)
      console.log('📅 Timestamp:', readData.timestamp?.toDate?.() || readData.timestamp)
    } else {
      throw new Error('No se pudieron leer los datos de prueba')
    }
    
  } catch (error) {
    console.error('❌ Error en escritura/lectura:', error)
    throw error
  }
}

// Test 3: Verificar estructura de datos
async function testDataStructure(db) {
  console.log('\n🏗️  Test 3: Verificando estructura de datos...')
  
  try {
    // Verificar estructura de roles
    const rolesRef = doc(db, 'RBAC_CONFIG', 'roles')
    const rolesSnap = await getDoc(rolesRef)
    
    if (rolesSnap.exists()) {
      const rolesData = rolesSnap.data()
      const roles = rolesData.roles || []
      
      console.log('📊 Análisis de roles:')
      roles.forEach((role, index) => {
        console.log(`  ${index + 1}. ${role.name} - ${role.permissions?.length || 0} permisos - ${role.isActive ? 'Activo' : 'Inactivo'}`)
      })
      
      // Verificar campos requeridos
      const requiredFields = ['id', 'name', 'description', 'permissions', 'isActive']
      const validRoles = roles.filter(role => 
        requiredFields.every(field => role.hasOwnProperty(field))
      )
      
      console.log(`✅ Roles válidos: ${validRoles.length}/${roles.length}`)
    }
    
    // Verificar estructura de permisos
    const permissionsRef = doc(db, 'RBAC_CONFIG', 'permissions')
    const permissionsSnap = await getDoc(permissionsRef)
    
    if (permissionsSnap.exists()) {
      const permissionsData = permissionsSnap.data()
      const permissions = permissionsData.permissions || []
      
      console.log('📊 Análisis de permisos:')
      const moduleGroups = {}
      permissions.forEach(permission => {
        const module = permission.module || 'sin-modulo'
        if (!moduleGroups[module]) moduleGroups[module] = 0
        moduleGroups[module]++
      })
      
      Object.entries(moduleGroups).forEach(([module, count]) => {
        console.log(`  📁 ${module}: ${count} permisos`)
      })
      
      console.log(`✅ Total de permisos: ${permissions.length}`)
    }
    
  } catch (error) {
    console.error('❌ Error verificando estructura:', error)
    throw error
  }
}

// Función auxiliar para mostrar el estado de Firestore
async function showFirestoreStatus() {
  try {
    const { db } = await import('../firebase.js')
    
    console.log('\n📋 Estado actual de Firestore RBAC:')
    console.log('=====================================')
    
    // Mostrar roles
    const rolesRef = doc(db, 'RBAC_CONFIG', 'roles')
    const rolesSnap = await getDoc(rolesRef)
    if (rolesSnap.exists()) {
      const rolesData = rolesSnap.data()
      console.log(`🎭 Roles: ${rolesData.roles?.length || 0}`)
      console.log(`📅 Última actualización: ${rolesData.lastUpdated?.toDate?.() || 'N/A'}`)
      console.log(`👤 Actualizado por: ${rolesData.updatedBy || 'N/A'}`)
    } else {
      console.log('🎭 Roles: No inicializados')
    }
    
    // Mostrar permisos
    const permissionsRef = doc(db, 'RBAC_CONFIG', 'permissions')
    const permissionsSnap = await getDoc(permissionsRef)
    if (permissionsSnap.exists()) {
      const permissionsData = permissionsSnap.data()
      console.log(`🔑 Permisos: ${permissionsData.permissions?.length || 0}`)
      console.log(`📅 Última actualización: ${permissionsData.lastUpdated?.toDate?.() || 'N/A'}`)
    } else {
      console.log('🔑 Permisos: No inicializados')
    }
    
    // Mostrar navegación
    const navRef = doc(db, 'NAVIGATION_CONFIG', 'config')
    const navSnap = await getDoc(navRef)
    if (navSnap.exists()) {
      const navData = navSnap.data()
      console.log(`🧭 Navegación: ${navData.navigationItems?.length || 0} elementos`)
    } else {
      console.log('🧭 Navegación: No inicializada')
    }
    
    console.log('=====================================\n')
    
  } catch (error) {
    console.error('❌ Error obteniendo estado:', error)
  }
}

// Exportar funciones para uso en consola del navegador
if (typeof window !== 'undefined') {
  window.testFirestoreRBAC = testFirestoreConnection
  window.showFirestoreStatus = showFirestoreStatus
}

// Ejecutar automáticamente si se ejecuta como script
if (import.meta.url === new URL(import.meta.resolve('./firestore-rbac-test.js'))) {
  testFirestoreConnection()
    .then(() => showFirestoreStatus())
    .catch(console.error)
}

export { testFirestoreConnection, showFirestoreStatus }
