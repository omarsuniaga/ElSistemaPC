/**
 * 🧪 TEST DE INICIALIZACIÓN COMPLETA
 * Verifica que todos los sistemas estén funcionando correctamente
 */

console.log("🧪 ==================== INICIANDO TEST DE INICIALIZACIÓN ====================")

// Test 1: Verificar que la aplicación esté corriendo
async function testAppRunning() {
  console.log("\n🔍 Test 1: Verificando que la aplicación esté corriendo...")
  
  try {
    const response = await fetch('http://localhost:3000')
    if (response.ok) {
      console.log("✅ Aplicación corriendo en puerto 3000")
      return true
    } else {
      console.log("❌ Aplicación no responde correctamente")
      return false
    }
  } catch (error) {
    console.log("❌ Error conectando a la aplicación:", error.message)
    return false
  }
}

// Test 2: Verificar Firebase Config
async function testFirebaseConfig() {
  console.log("\n🔍 Test 2: Verificando configuración de Firebase...")
  
  try {
    // Simular importación de Firebase config
    const configTest = {
      hasApiKey: !!process.env.VITE_APP_API_KEY,
      hasAuthDomain: !!process.env.VITE_APP_AUTH_DOMAIN,
      hasProjectId: !!process.env.VITE_APP_PROJECT_ID,
      hasStorageBucket: !!process.env.VITE_APP_STORAGE_BUCKET,
      hasMessagingSenderId: !!process.env.VITE_APP_MESSAGING_SENDER_ID,
      hasAppId: !!process.env.VITE_APP_APP_ID
    }
    
    const allConfigured = Object.values(configTest).every(Boolean)
    
    if (allConfigured) {
      console.log("✅ Variables de Firebase configuradas correctamente")
      console.log("📊 Config status:", configTest)
      return true
    } else {
      console.log("❌ Faltan variables de configuración de Firebase")
      console.log("📊 Config status:", configTest)
      return false
    }
  } catch (error) {
    console.log("❌ Error verificando Firebase config:", error.message)
    return false
  }
}

// Test 3: Verificar servicios de Firebase
async function testFirebaseServices() {
  console.log("\n🔍 Test 3: Verificando servicios de Firebase...")
  
  try {
    const response = await fetch('http://localhost:3000')
    const html = await response.text()
    
    // Verificar que no haya errores de Firebase en el HTML inicial
    const hasFirebaseErrors = html.includes('Firebase:') && html.includes('error')
    
    if (!hasFirebaseErrors) {
      console.log("✅ No se detectaron errores de Firebase en la carga inicial")
      return true
    } else {
      console.log("❌ Se detectaron posibles errores de Firebase")
      return false
    }
  } catch (error) {
    console.log("❌ Error verificando servicios Firebase:", error.message)
    return false
  }
}

// Test 4: Verificar estructura de archivos críticos
async function testCriticalFiles() {
  console.log("\n🔍 Test 4: Verificando archivos críticos...")
  
  const fs = require('fs').promises
  const path = require('path')
  
  const criticalFiles = [
    'src/firebase/config.ts',
    'src/firebase/index.ts',
    'src/stores/auth.ts',
    'src/composables/pwa/usePWA.ts',
    'src/App.vue',
    'src/main.ts'
  ]
  
  let allFilesExist = true
  
  for (const file of criticalFiles) {
    try {
      await fs.access(file)
      console.log(`✅ ${file} existe`)
    } catch (error) {
      console.log(`❌ ${file} no encontrado`)
      allFilesExist = false
    }
  }
  
  return allFilesExist
}

// Test 5: Verificar contenido de archivos críticos
async function testFileContents() {
  console.log("\n🔍 Test 5: Verificando contenido de archivos críticos...")
  
  const fs = require('fs').promises
  
  try {
    // Verificar que auth.ts no esté vacío
    const authContent = await fs.readFile('src/stores/auth.ts', 'utf8')
    const authHasDefineStore = authContent.includes('defineStore')
    
    // Verificar que config.ts tenga functions
    const configContent = await fs.readFile('src/firebase/config.ts', 'utf8')
    const configHasFunctions = configContent.includes('getFunctions') && configContent.includes('export const functions')
    
    // Verificar que index.ts exporte functions
    const indexContent = await fs.readFile('src/firebase/index.ts', 'utf8')
    const indexExportsFunctions = indexContent.includes('functions')
    
    console.log("📊 Verificaciones de contenido:")
    console.log(`  Auth store tiene defineStore: ${authHasDefineStore ? '✅' : '❌'}`)
    console.log(`  Config tiene functions: ${configHasFunctions ? '✅' : '❌'}`)
    console.log(`  Index exporta functions: ${indexExportsFunctions ? '✅' : '❌'}`)
    
    return authHasDefineStore && configHasFunctions && indexExportsFunctions
  } catch (error) {
    console.log("❌ Error verificando contenido de archivos:", error.message)
    return false
  }
}

// Test 6: Verificar sintaxis de TypeScript
async function testTypeScriptSyntax() {
  console.log("\n🔍 Test 6: Verificando sintaxis de TypeScript...")
  
  try {
    const { execSync } = require('child_process')
    
    // Ejecutar verificación de TypeScript
    const result = execSync('npx tsc --noEmit --skipLibCheck', { 
      encoding: 'utf8',
      timeout: 30000
    })
    
    console.log("✅ Sintaxis de TypeScript correcta")
    return true
  } catch (error) {
    console.log("❌ Errores de TypeScript encontrados:")
    console.log(error.stdout || error.message)
    return false
  }
}

// Test 7: Verificar que no haya imports circulares
async function testCircularImports() {
  console.log("\n🔍 Test 7: Verificando imports circulares...")
  
  const fs = require('fs').promises
  
  try {
    // Verificar auth.ts no importe directamente de firebase/config
    const authContent = await fs.readFile('src/stores/auth.ts', 'utf8')
    const authHasDirectFirebaseImport = authContent.includes('from "../firebase/config"')
    
    if (!authHasDirectFirebaseImport) {
      console.log("✅ No se detectaron imports circulares en auth.ts")
      return true
    } else {
      console.log("⚠️ Posible import circular detectado en auth.ts")
      return false
    }
  } catch (error) {
    console.log("❌ Error verificando imports circulares:", error.message)
    return false
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log("🚀 Ejecutando batería completa de tests...\n")
  
  const tests = [
    { name: "App Running", test: testAppRunning },
    { name: "Firebase Config", test: testFirebaseConfig },
    { name: "Firebase Services", test: testFirebaseServices },
    { name: "Critical Files", test: testCriticalFiles },
    { name: "File Contents", test: testFileContents },
    { name: "TypeScript Syntax", test: testTypeScriptSyntax },
    { name: "Circular Imports", test: testCircularImports }
  ]
  
  const results = []
  
  for (const testCase of tests) {
    try {
      const result = await testCase.test()
      results.push({ name: testCase.name, passed: result })
    } catch (error) {
      console.log(`❌ Error ejecutando test ${testCase.name}:`, error.message)
      results.push({ name: testCase.name, passed: false, error: error.message })
    }
  }
  
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

// Exportar para uso en Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests }
}

// Ejecutar automáticamente si se corre directamente
if (typeof window === 'undefined') {
  runAllTests().catch(console.error)
}
