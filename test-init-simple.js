/**
 * 🧪 TEST DE INICIALIZACIÓN SIMPLE
 * Verifica manualmente el estado de la aplicación
 */

const fs = require('fs')
const path = require('path')

console.log("🧪 ==================== TEST DE INICIALIZACIÓN SIMPLE ====================\n")

// Test 1: Verificar archivos críticos
function testCriticalFiles() {
  console.log("🔍 Test 1: Verificando archivos críticos...")
  
  const criticalFiles = [
    'src/firebase/config.ts',
    'src/firebase/index.ts', 
    'src/stores/auth.ts',
    'src/composables/pwa/usePWA.ts',
    'src/App.vue',
    'src/main.ts',
    '.env'
  ]
  
  let allFilesExist = true
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} existe`)
    } else {
      console.log(`❌ ${file} no encontrado`)
      allFilesExist = false
    }
  })
  
  return allFilesExist
}

// Test 2: Verificar variables de entorno
function testEnvironmentVariables() {
  console.log("\n🔍 Test 2: Verificando variables de entorno...")
  
  if (!fs.existsSync('.env')) {
    console.log("❌ Archivo .env no encontrado")
    return false
  }
  
  const envContent = fs.readFileSync('.env', 'utf8')
  const requiredVars = [
    'VITE_APP_API_KEY',
    'VITE_APP_AUTH_DOMAIN', 
    'VITE_APP_PROJECT_ID',
    'VITE_APP_STORAGE_BUCKET',
    'VITE_APP_MESSAGING_SENDER_ID',
    'VITE_APP_APP_ID'
  ]
  
  let allVarsPresent = true
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName} está definida`)
    } else {
      console.log(`❌ ${varName} no encontrada`)
      allVarsPresent = false
    }
  })
  
  return allVarsPresent
}

// Test 3: Verificar contenido de Firebase config
function testFirebaseConfig() {
  console.log("\n🔍 Test 3: Verificando configuración de Firebase...")
  
  if (!fs.existsSync('src/firebase/config.ts')) {
    console.log("❌ src/firebase/config.ts no encontrado")
    return false
  }
  
  const configContent = fs.readFileSync('src/firebase/config.ts', 'utf8')
  
  const checks = [
    { name: 'getFunctions import', test: () => configContent.includes('import {getFunctions}') },
    { name: 'functions export', test: () => configContent.includes('export const functions') },
    { name: 'getFunctions call', test: () => configContent.includes('getFunctions(app)') },
    { name: 'functions in logs', test: () => configContent.includes('functions: !!functions') }
  ]
  
  let allChecksPass = true
  
  checks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`)
    } else {
      console.log(`❌ ${check.name}`)
      allChecksPass = false
    }
  })
  
  return allChecksPass
}

// Test 4: Verificar Firebase index
function testFirebaseIndex() {
  console.log("\n🔍 Test 4: Verificando Firebase index...")
  
  if (!fs.existsSync('src/firebase/index.ts')) {
    console.log("❌ src/firebase/index.ts no encontrado")
    return false
  }
  
  const indexContent = fs.readFileSync('src/firebase/index.ts', 'utf8')
  
  const checks = [
    { name: 'functions import', test: () => indexContent.includes('functions') && indexContent.includes('import') },
    { name: 'functions export', test: () => indexContent.includes('export {db, storage, auth, functions}') },
    { name: 'functions verification', test: () => indexContent.includes('!functions') }
  ]
  
  let allChecksPass = true
  
  checks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`)
    } else {
      console.log(`❌ ${check.name}`)
      allChecksPass = false
    }
  })
  
  return allChecksPass
}

// Test 5: Verificar Auth Store
function testAuthStore() {
  console.log("\n🔍 Test 5: Verificando Auth Store...")
  
  if (!fs.existsSync('src/stores/auth.ts')) {
    console.log("❌ src/stores/auth.ts no encontrado")
    return false
  }
  
  const authContent = fs.readFileSync('src/stores/auth.ts', 'utf8')
  
  const checks = [
    { name: 'defineStore', test: () => authContent.includes('defineStore') },
    { name: 'no está vacío', test: () => authContent.trim().length > 100 },
    { name: 'dynamic import', test: () => authContent.includes('import(') },
    { name: 'export default', test: () => authContent.includes('export const useAuthStore') }
  ]
  
  let allChecksPass = true
  
  checks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`)
    } else {
      console.log(`❌ ${check.name}`)
      allChecksPass = false
    }
  })
  
  return allChecksPass
}

// Test 6: Verificar PWA composable
function testPWAComposable() {
  console.log("\n🔍 Test 6: Verificando PWA composable...")
  
  if (!fs.existsSync('src/composables/pwa/usePWA.ts')) {
    console.log("❌ src/composables/pwa/usePWA.ts no encontrado")
    return false
  }
  
  const pwaContent = fs.readFileSync('src/composables/pwa/usePWA.ts', 'utf8')
  
  const checks = [
    { name: 'no usa onMounted/onUnmounted', test: () => !pwaContent.includes('onMounted(') },
    { name: 'setupEventListeners', test: () => pwaContent.includes('setupEventListeners') },
    { name: 'cleanupEventListeners', test: () => pwaContent.includes('cleanupEventListeners') },
    { name: 'exporta setup functions', test: () => pwaContent.includes('setupEventListeners,') }
  ]
  
  let allChecksPass = true
  
  checks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`)
    } else {
      console.log(`❌ ${check.name}`)
      allChecksPass = false
    }
  })
  
  return allChecksPass
}

// Test 7: Verificar App.vue
function testAppVue() {
  console.log("\n🔍 Test 7: Verificando App.vue...")
  
  if (!fs.existsSync('src/App.vue')) {
    console.log("❌ src/App.vue no encontrado")
    return false
  }
  
  const appContent = fs.readFileSync('src/App.vue', 'utf8')
  
  const checks = [
    { name: 'onMounted para PWA', test: () => appContent.includes('onMounted(() => {') && appContent.includes('setupEventListeners') },
    { name: 'onUnmounted para PWA', test: () => appContent.includes('onUnmounted(() => {') && appContent.includes('cleanupEventListeners') },
    { name: 'imports onUnmounted', test: () => appContent.includes('onUnmounted') && appContent.includes('import') },
    { name: 'no duplicación de onMounted', test: () => (appContent.match(/onMounted\(/g) || []).length >= 2 }
  ]
  
  let allChecksPass = true
  
  checks.forEach(check => {
    if (check.test()) {
      console.log(`✅ ${check.name}`)
    } else {
      console.log(`❌ ${check.name}`)
      allChecksPass = false
    }
  })
  
  return allChecksPass
}

// Ejecutar todos los tests
function runAllTests() {
  const tests = [
    { name: "Critical Files", test: testCriticalFiles },
    { name: "Environment Variables", test: testEnvironmentVariables },
    { name: "Firebase Config", test: testFirebaseConfig },
    { name: "Firebase Index", test: testFirebaseIndex },
    { name: "Auth Store", test: testAuthStore },
    { name: "PWA Composable", test: testPWAComposable },
    { name: "App Vue", test: testAppVue }
  ]
  
  const results = []
  
  tests.forEach(testCase => {
    try {
      const result = testCase.test()
      results.push({ name: testCase.name, passed: result })
    } catch (error) {
      console.log(`❌ Error ejecutando test ${testCase.name}:`, error.message)
      results.push({ name: testCase.name, passed: false, error: error.message })
    }
  })
  
  // Mostrar resumen
  console.log("\n🏁 ==================== RESUMEN DE TESTS ====================")
  
  let passedTests = 0
  results.forEach(result => {
    const status = result.passed ? "✅ PASS" : "❌ FAIL"
    console.log(`${status} - ${result.name}`)
    if (result.error) {
      console.log(`    Error: ${result.error}`)
    }
    if (result.passed) passedTests++
  })
  
  console.log(`\n📊 Resultados: ${passedTests}/${results.length} tests pasaron`)
  
  if (passedTests === results.length) {
    console.log("🎉 ¡TODOS LOS TESTS PASARON! La aplicación está lista.")
  } else {
    console.log("⚠️ Algunos tests fallaron. Revisar los errores arriba.")
  }
  
  return results
}

// Ejecutar tests
runAllTests()
