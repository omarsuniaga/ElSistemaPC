// test-branding-system.js
/**
 * Script de pruebas automáticas para el sistema de branding
 * Ejecutar en consola del navegador: node test-branding-system.js
 */

console.log("🎨 Iniciando pruebas del Sistema de Branding...")
console.log("================================================")

// Función principal de pruebas
async function testBrandingSystem() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: [],
  }

  function addTest(name, passed, details = "") {
    results.total++
    if (passed) {
      results.passed++
      console.log(`✅ ${name}${details ? ` - ${details}` : ""}`)
    } else {
      results.failed++
      console.log(`❌ ${name}${details ? ` - ${details}` : ""}`)
    }
    results.tests.push({name, passed, details})
  }

  try {
    console.log("\n🔍 1. Verificando disponibilidad de funciones globales...")

    // Test funciones globales
    addTest("testBranding disponible", typeof window.testBranding === "function")
    addTest("quickTestBranding disponible", typeof window.quickTestBranding === "function")
    addTest("debugBranding disponible", typeof window.debugBranding === "function")

    console.log("\n🔍 2. Verificando stores y composables...")

    // Test stores (si están disponibles en window)
    const hasPinia = typeof window.Vue !== "undefined" || typeof window.__VUE__ !== "undefined"
    addTest("Pinia disponible", hasPinia, hasPinia ? "Vue detectado" : "Vue no detectado")

    console.log("\n🔍 3. Verificando DOM y CSS...")

    // Test variables CSS
    const root = document.documentElement
    const primaryColor = getComputedStyle(root).getPropertyValue("--ion-color-primary")
    addTest(
      "Variables CSS aplicadas",
      !!primaryColor.trim(),
      primaryColor.trim() || "No encontrada"
    )

    // Test título de página
    const titleChanged = document.title !== "Vite App" && document.title !== ""
    addTest("Título de página actualizado", titleChanged, document.title)

    // Test meta description
    const metaDesc = document.querySelector('meta[name="description"]')
    addTest(
      "Meta description presente",
      !!metaDesc,
      metaDesc?.content?.substring(0, 50) + "..." || "No encontrada"
    )

    console.log("\n🔍 4. Ejecutando pruebas rápidas...")

    // Ejecutar prueba rápida si está disponible
    if (typeof window.quickTestBranding === "function") {
      try {
        const quickResult = await window.quickTestBranding()
        addTest(
          "Prueba rápida del sistema",
          quickResult,
          typeof quickResult === "boolean"
            ? quickResult
              ? "PASS"
              : "FAIL"
            : "Resultado: " + quickResult
        )
      } catch (error) {
        addTest("Prueba rápida del sistema", false, "Error: " + error.message)
      }
    }

    console.log("\n🔍 5. Verificando acceso a rutas...")

    // Test acceso a rutas (simulado)
    const currentPath = window.location.pathname
    const isBrandingRoute = currentPath.includes("branding") || currentPath.includes("superusuario")
    addTest(
      "Ruta de branding accesible",
      isBrandingRoute || currentPath === "/",
      `Ruta actual: ${currentPath}`
    )

    console.log("\n🔍 6. Tests de componentes en DOM...")

    // Buscar elementos relacionados con branding
    const hasHeaders = document.querySelectorAll('ion-header, [class*="header"]').length > 0
    addTest(
      "Headers encontrados en DOM",
      hasHeaders,
      `${document.querySelectorAll('ion-header, [class*="header"]').length} elementos`
    )

    const hasIonElements = document.querySelectorAll('[class*="ion-"]').length > 0
    addTest(
      "Elementos Ionic encontrados",
      hasIonElements,
      `${document.querySelectorAll('[class*="ion-"]').length} elementos`
    )

    console.log("\n📊 RESULTADOS FINALES:")
    console.log("====================")
    console.log(`Total de pruebas: ${results.total}`)
    console.log(`✅ Exitosas: ${results.passed}`)
    console.log(`❌ Fallidas: ${results.failed}`)
    console.log(`📈 Tasa de éxito: ${((results.passed / results.total) * 100).toFixed(1)}%`)

    if (results.failed > 0) {
      console.log("\n🔍 PRUEBAS FALLIDAS:")
      results.tests
        .filter((t) => !t.passed)
        .forEach((test) => console.log(`   ❌ ${test.name}: ${test.details}`))
    }

    console.log("\n🚀 SIGUIENTES PASOS:")
    console.log("===================")
    if (typeof window.testBranding === "function") {
      console.log("• Ejecutar: testBranding() para suite completa")
    }
    if (typeof window.debugBranding === "function") {
      console.log("• Ejecutar: debugBranding() para herramientas de debug")
    }
    console.log("• Navegar a /superusuario/branding para configurar")
    console.log("• Navegar a /testing/branding para dashboard de pruebas")

    // Guardar resultados
    window.brandingSystemTestResults = results
    console.log("\n💾 Resultados guardados en: window.brandingSystemTestResults")

    return results
  } catch (error) {
    console.error("❌ Error ejecutando pruebas:", error)
    return {error: error.message, ...results}
  }
}

// Función de diagnóstico rápido
function quickDiagnosis() {
  console.log("⚡ DIAGNÓSTICO RÁPIDO - Sistema de Branding")
  console.log("===========================================")

  const checks = [
    {
      name: "Funciones globales de branding",
      check: () =>
        typeof window.testBranding === "function" && typeof window.quickTestBranding === "function",
    },
    {
      name: "Variables CSS aplicadas",
      check: () =>
        !!getComputedStyle(document.documentElement).getPropertyValue("--ion-color-primary").trim(),
    },
    {
      name: "Título personalizado",
      check: () => document.title !== "Vite App" && document.title !== "",
    },
    {
      name: "Elementos Ionic presentes",
      check: () => document.querySelectorAll('[class*="ion-"]').length > 0,
    },
  ]

  checks.forEach(({name, check}) => {
    try {
      const result = check()
      console.log(`${result ? "✅" : "❌"} ${name}`)
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error.message}`)
    }
  })

  console.log("\nUsar testBrandingSystem() para pruebas completas")
}

// Hacer disponibles las funciones
if (typeof window !== "undefined") {
  window.testBrandingSystem = testBrandingSystem
  window.quickDiagnosis = quickDiagnosis
}

// Auto-ejecutar diagnóstico rápido
console.log("Funciones disponibles:")
console.log("• testBrandingSystem() - Pruebas completas")
console.log("• quickDiagnosis() - Diagnóstico rápido")
console.log("")
quickDiagnosis()

// Si se ejecuta directamente, hacer pruebas completas
if (typeof module !== "undefined" && module.exports) {
  testBrandingSystem()
} else {
  console.log("\n🎯 Ejecutar testBrandingSystem() para pruebas completas")
}
