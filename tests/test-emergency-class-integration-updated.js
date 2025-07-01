/**
 * Test script ACTUALIZADO para verificar la integración completa de clases emergentes
 * Run this in browser console when on AttendanceView with emergency class
 */

console.log("🔄 Testing UPDATED Emergency Class Integration...")

// Test emergency class ID
const emergencyClassId = "3sf0mBLxcam45CbTgmvK"

async function testUpdatedEmergencyClassIntegration() {
  console.log("🚀 Testing UPDATED emergency class integration...")

  try {
    // Test 1: Verificar que stores de Vue estén disponibles
    console.log("1. Checking Vue stores...")

    // Intentar acceder a los stores de diferentes formas
    const classesStore = null
    const attendanceStore = null

    // Método 1: A través del router de Vue
    if (window.$nuxt || window.__NUXT__) {
      console.log("📱 Nuxt environment detected")
    }

    // Método 2: A través del contexto global de Vue
    if (window.__VUE__) {
      console.log("🎯 Vue global context found")
    }

    // Método 3: Buscar en el DOM elementos Vue y extraer stores
    const vueElements = document.querySelectorAll("[data-v-]")
    console.log(`📍 Found ${vueElements.length} Vue elements in DOM`)

    // Test 2: Verificar acceso directo a Firebase si los stores no están disponibles
    console.log("2. Testing direct Firebase access...")

    if (window.firebase && window.firebase.firestore) {
      console.log("🔥 Firebase is available, testing direct query...")

      const db = window.firebase.firestore()
      const emergencyRef = db.collection("EMERGENCY_CLASSES").doc(emergencyClassId)

      try {
        const doc = await emergencyRef.get()
        if (doc.exists) {
          const data = doc.data()
          console.log("✅ Emergency class found via direct Firebase query:")
          console.log({
            id: doc.id,
            className: data.className,
            teacherId: data.teacherId,
            status: data.status,
            students: data.selectedStudents?.length || 0,
          })

          // Test 3: Verificar acceso a colección CLASSES regular
          console.log("3. Testing regular CLASSES collection...")
          const classesRef = db.collection("CLASSES").doc(emergencyClassId)
          const regularDoc = await classesRef.get()

          if (regularDoc.exists) {
            console.log("⚠️ Emergency class ALSO found in regular CLASSES collection")
          } else {
            console.log("✅ Emergency class correctly NOT in regular CLASSES collection")
          }
        } else {
          console.log("❌ Emergency class not found in EMERGENCY_CLASSES collection")
        }
      } catch (firebaseError) {
        console.error("❌ Firebase query failed:", firebaseError)
      }
    } else {
      console.log("⚠️ Firebase not available in global scope")
    }

    // Test 4: Verificar funcionalidad de la URL actual
    console.log("4. Testing current URL functionality...")
    const currentUrl = window.location.href
    console.log("📍 Current URL:", currentUrl)

    if (currentUrl.includes(emergencyClassId)) {
      console.log("✅ Emergency class ID found in URL")

      // Buscar elementos de error en la página
      const errorElements = document.querySelectorAll(
        '[class*="error"], [class*="red"], .bg-red-100'
      )
      console.log(`🔍 Found ${errorElements.length} potential error elements`)

      errorElements.forEach((element, index) => {
        const text = element.textContent || element.innerText
        if (text.includes("No se encontró") || text.includes("Error")) {
          console.log(`❌ Error element ${index + 1}:`, text)
        }
      })

      // Buscar elementos de loading
      const loadingElements = document.querySelectorAll(
        '[class*="loading"], [class*="spinner"], [class*="cargando"]'
      )
      console.log(`⏳ Found ${loadingElements.length} loading elements`)

      // Buscar elementos que muestran nombres de clases
      const classNameElements = document.querySelectorAll(
        'h1, h2, h3, .class-name, [class*="titulo"]'
      )
      console.log("📋 Class name elements found:")
      classNameElements.forEach((element, index) => {
        const text = element.textContent || element.innerText
        if (text.trim()) {
          console.log(`  ${index + 1}. ${text.trim()}`)
        }
      })
    } else {
      console.log("⚠️ Emergency class ID not found in current URL")
    }

    // Test 5: Verificar navegación programática
    console.log("5. Testing programmatic navigation...")
    const testUrl = `/attendance/20250627/${emergencyClassId}`
    console.log("🔗 Test navigation URL:", `${window.location.origin}${testUrl}`)

    console.log("💡 To manually test navigation, run:")
    console.log(`window.location.href = '${testUrl}'`)
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Test funcionalidad específica de stores si están disponibles
async function testStoreIntegration() {
  console.log("🔧 Testing store integration...")

  try {
    // Buscar instancias de Pinia en el DOM
    const appElements = document.querySelectorAll('#app, [id*="app"]')
    console.log(`📱 Found ${appElements.length} app elements`)

    for (const element of appElements) {
      if (element.__vue__ || element._vnode) {
        console.log("🎯 Vue instance found in app element")
        break
      }
    }
  } catch (error) {
    console.error("❌ Store integration test failed:", error)
  }
}

// Test directo del servicio de clases emergentes si está disponible
async function testEmergencyClassService() {
  console.log("🚑 Testing emergency class service...")

  try {
    // Intentar importar dinámicamente el servicio
    if (window.require) {
      console.log("📦 Require function available")
    }

    // Si no podemos importar, intentar acceso directo
    console.log("💡 Emergency class service test would require module import")
    console.log("   This needs to be tested from within the Vue application context")
  } catch (error) {
    console.error("❌ Emergency class service test failed:", error)
  }
}

// Función principal que ejecuta todos los tests
async function runComprehensiveTests() {
  console.log("🚀 Starting COMPREHENSIVE emergency class tests...")
  console.log("=".repeat(60))

  await testUpdatedEmergencyClassIntegration()
  console.log("-".repeat(40))

  await testStoreIntegration()
  console.log("-".repeat(40))

  await testEmergencyClassService()
  console.log("-".repeat(40))

  console.log("🏁 All comprehensive tests completed")
  console.log("=".repeat(60))

  // Resumen de acciones recomendadas
  console.log("📋 RECOMMENDED ACTIONS:")
  console.log("1. Check browser console for any error messages")
  console.log("2. Verify emergency class shows correct name (not ID)")
  console.log('3. Ensure no "No se encontró la clase" messages appear')
  console.log("4. Test attendance functionality with emergency class")
  console.log("5. Verify student list loads correctly")
}

// Export functions for manual testing
window.emergencyClassTestsUpdated = {
  runAll: runComprehensiveTests,
  testIntegration: testUpdatedEmergencyClassIntegration,
  testStores: testStoreIntegration,
  testService: testEmergencyClassService,
  emergencyClassId,
}

console.log("🔧 Updated emergency class test functions loaded:")
console.log("- emergencyClassTestsUpdated.runAll()")
console.log("- emergencyClassTestsUpdated.testIntegration()")
console.log("- emergencyClassTestsUpdated.testStores()")
console.log("- emergencyClassTestsUpdated.testService()")

// Auto-run comprehensive test if we're on an emergency class page
if (window.location.pathname.includes(emergencyClassId)) {
  console.log("🎯 Emergency class detected in URL, running comprehensive tests...")
  runComprehensiveTests()
} else {
  console.log("ℹ️  To test with emergency class, navigate to:")
  console.log(`${window.location.origin}/attendance/20250627/${emergencyClassId}`)
}
