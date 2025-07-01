// SCRIPT DE PRUEBAS DE RENDIMIENTO - Music Academy Manager
// Ejecutar paso a paso en la consola del navegador (F12)

console.log("🚀 INICIANDO PRUEBAS DE RENDIMIENTO - Music Academy Manager")

// ===== PASO 1: VERIFICAR SISTEMAS DISPONIBLES =====
console.group("📋 PASO 1: Verificación de Sistemas")

if (typeof window.performanceMonitor !== "undefined") {
  console.log("✅ Performance Monitor: DISPONIBLE")
} else {
  console.log("❌ Performance Monitor: NO DISPONIBLE")
}

if (typeof window.smartCache !== "undefined") {
  console.log("✅ Smart Cache: DISPONIBLE")
} else {
  console.log("❌ Smart Cache: NO DISPONIBLE")
}

if (typeof window.lazyLoader !== "undefined") {
  console.log("✅ Lazy Loader: DISPONIBLE")
} else {
  console.log("❌ Lazy Loader: NO DISPONIBLE")
}

if (typeof window.imageOptimizer !== "undefined") {
  console.log("✅ Image Optimizer: DISPONIBLE")
} else {
  console.log("❌ Image Optimizer: NO DISPONIBLE")
}

if (typeof window.quickPerformanceCheck === "function") {
  console.log("✅ Función de Chequeo Rápido: DISPONIBLE")
} else {
  console.log("❌ Función de Chequeo Rápido: NO DISPONIBLE")
}

if (typeof window.runPerformanceTests === "function") {
  console.log("✅ Suite de Pruebas: DISPONIBLE")
} else {
  console.log("❌ Suite de Pruebas: NO DISPONIBLE")
}

console.groupEnd()

// ===== PASO 2: CHEQUEO RÁPIDO =====
console.group("⚡ PASO 2: Chequeo Rápido de Rendimiento")

function ejecutarChequeoRapido() {
  try {
    console.log("🔍 Ejecutando chequeo rápido...")

    if (typeof window.quickPerformanceCheck === "function") {
      window.quickPerformanceCheck()
    } else {
      console.warn("Función de chequeo rápido no disponible, ejecutando manualmente...")

      // Obtener métricas básicas manualmente
      if (window.performanceMonitor) {
        const report = window.performanceMonitor.generateReport()
        console.log("📊 Reporte de rendimiento:", report)
      }

      if (window.smartCache) {
        const cacheStats = window.smartCache.getStats()
        console.log("💾 Estadísticas de cache:", cacheStats)
      }
    }

    console.log("✅ Chequeo rápido completado")
  } catch (error) {
    console.error("❌ Error en chequeo rápido:", error)
  }
}

ejecutarChequeoRapido()
console.groupEnd()

// ===== PASO 3: PRUEBAS DE CACHE =====
console.group("💾 PASO 3: Pruebas de Sistema de Cache")

function probarCache() {
  try {
    console.log("🧪 Probando sistema de cache...")

    if (!window.smartCache) {
      console.error("❌ Sistema de cache no disponible")
      return
    }

    const startTime = performance.now()

    // Test de escritura
    console.log("📝 Test de escritura...")
    for (let i = 0; i < 10; i++) {
      window.smartCache.set(
        `test-key-${i}`,
        {
          id: i,
          data: `Datos de prueba ${i}`,
          timestamp: new Date(),
        },
        {ttl: 60000}
      ) // 1 minuto TTL
    }
    const writeTime = performance.now() - startTime

    // Test de lectura
    console.log("📖 Test de lectura...")
    const readStart = performance.now()
    let hits = 0
    for (let i = 0; i < 10; i++) {
      const result = window.smartCache.get(`test-key-${i}`)
      if (result) hits++
    }
    const readTime = performance.now() - readStart

    // Resultados
    console.log(`⏱️ Tiempo de escritura: ${writeTime.toFixed(2)}ms`)
    console.log(`⏱️ Tiempo de lectura: ${readTime.toFixed(2)}ms`)
    console.log(`🎯 Hit rate: ${((hits / 10) * 100).toFixed(1)}%`)

    // Estadísticas del cache
    const stats = window.smartCache.getStats()
    console.log("📊 Estadísticas actuales:", stats)

    // Limpiar datos de prueba
    for (let i = 0; i < 10; i++) {
      window.smartCache.delete(`test-key-${i}`)
    }

    console.log("✅ Pruebas de cache completadas")
  } catch (error) {
    console.error("❌ Error en pruebas de cache:", error)
  }
}

probarCache()
console.groupEnd()

// ===== PASO 4: PRUEBAS DE LAZY LOADING =====
console.group("🔄 PASO 4: Pruebas de Lazy Loading")

async function probarLazyLoading() {
  try {
    console.log("🧪 Probando lazy loading...")

    if (!window.lazyLoader) {
      console.error("❌ Sistema de lazy loading no disponible")
      return
    }

    const startTime = performance.now()

    // Simular carga de componente
    console.log("📦 Cargando componente de prueba...")
    const mockComponent = await window.lazyLoader.loadComponent("TestComponent", () =>
      Promise.resolve({
        default: {
          name: "TestComponent",
          template: "<div>Componente de prueba</div>",
        },
      })
    )

    const loadTime = performance.now() - startTime

    console.log(`⏱️ Tiempo de carga: ${loadTime.toFixed(2)}ms`)
    console.log("📦 Componente cargado:", mockComponent)
    console.log("✅ Pruebas de lazy loading completadas")
  } catch (error) {
    console.error("❌ Error en pruebas de lazy loading:", error)
  }
}

probarLazyLoading()
console.groupEnd()

// ===== PASO 5: PRUEBAS DE MEMORIA =====
console.group("🧠 PASO 5: Pruebas de Memoria")

function probarMemoria() {
  try {
    console.log("🧪 Probando gestión de memoria...")

    // Memoria inicial
    const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0

    console.log(`📊 Memoria inicial: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`)

    // Crear datos de prueba
    console.log("💾 Creando datos de prueba...")
    const testData = []
    for (let i = 0; i < 100; i++) {
      testData.push({
        id: i,
        data: new Array(1000).fill(`test-${i}`),
        timestamp: new Date(),
      })
    }

    // Memoria pico
    const peakMemory = performance.memory ? performance.memory.usedJSHeapSize : 0

    console.log(`📈 Memoria pico: ${(peakMemory / 1024 / 1024).toFixed(2)} MB`)
    console.log(`📊 Incremento: ${((peakMemory - initialMemory) / 1024 / 1024).toFixed(2)} MB`)

    // Limpiar datos
    testData.length = 0

    // Forzar garbage collection si está disponible
    if ("gc" in window) {
      console.log("🗑️ Ejecutando garbage collection...")
      window.gc()
    }

    setTimeout(() => {
      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0

      console.log(`📉 Memoria final: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`)

      const recovered = peakMemory - finalMemory
      const recoveryRate = (recovered / (peakMemory - initialMemory)) * 100

      console.log(`♻️ Memoria recuperada: ${(recovered / 1024 / 1024).toFixed(2)} MB`)
      console.log(`📊 Tasa de recuperación: ${recoveryRate.toFixed(1)}%`)
      console.log("✅ Pruebas de memoria completadas")
    }, 1000)
  } catch (error) {
    console.error("❌ Error en pruebas de memoria:", error)
  }
}

probarMemoria()
console.groupEnd()

// ===== PASO 6: SUITE COMPLETA (OPCIONAL) =====
console.group("🎯 PASO 6: Suite Completa (Opcional)")

async function ejecutarSuiteCompleta() {
  try {
    console.log("🚀 Ejecutando suite completa de pruebas...")
    console.log("⏳ Esto puede tomar 2-3 minutos...")

    if (typeof window.runPerformanceTests === "function") {
      const startTime = performance.now()
      const results = await window.runPerformanceTests()
      const totalTime = performance.now() - startTime

      console.log(`⏱️ Suite completada en: ${totalTime.toFixed(2)}ms`)
      console.log("📊 Resultados completos:", results)

      // Resumen de resultados
      const {summary} = results
      console.log("📈 RESUMEN DE RESULTADOS:")
      console.log(`   • Pruebas totales: ${summary.totalTests}`)
      console.log(`   • Pruebas exitosas: ${summary.passedTests}`)
      console.log(`   • Pruebas fallidas: ${summary.failedTests}`)
      console.log(
        `   • Tasa de éxito: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%`
      )

      if (summary.criticalIssues.length > 0) {
        console.warn("⚠️ Issues críticos encontrados:", summary.criticalIssues)
      }

      if (summary.recommendations.length > 0) {
        console.log("💡 Recomendaciones:", summary.recommendations)
      }
    } else {
      console.warn("❌ Función de suite completa no disponible")
    }
  } catch (error) {
    console.error("❌ Error en suite completa:", error)
  }
}

// No ejecutar automáticamente - dejar que el usuario decida
console.log("🎯 Para ejecutar la suite completa, ejecuta: ejecutarSuiteCompleta()")
window.ejecutarSuiteCompleta = ejecutarSuiteCompleta

console.groupEnd()

// ===== FUNCIONES ADICIONALES =====
console.group("🛠️ FUNCIONES ADICIONALES DISPONIBLES")

// Función para monitoreo continuo
window.iniciarMonitoreo = function () {
  console.log("📊 Iniciando monitoreo continuo...")

  const interval = setInterval(() => {
    if (window.performanceMonitor) {
      const report = window.performanceMonitor.generateReport()
      console.log(`📈 [${new Date().toLocaleTimeString()}] Métricas:`, {
        loadTime: `${report.summary.avgLoadTime.toFixed(0)}ms`,
        interactionTime: `${report.summary.avgInteractionTime.toFixed(0)}ms`,
        memoryUsage: `${(report.summary.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
        componentsTracked: report.summary.componentsTracked,
      })
    }
  }, 30000) // Cada 30 segundos

  console.log("✅ Monitoreo iniciado (cada 30 segundos)")
  console.log("🛑 Para detener: clearInterval(" + interval + ")")

  return interval
}

// Función para limpiar todo
window.limpiarSistemas = function () {
  console.log("🧹 Limpiando sistemas...")

  if (window.smartCache) {
    window.smartCache.clear()
    console.log("✅ Cache limpiado")
  }

  if (window.imageOptimizer) {
    window.imageOptimizer.clearCache()
    console.log("✅ Cache de imágenes limpiado")
  }

  console.log("✅ Sistemas limpiados")
}

console.log("📊 iniciarMonitoreo() - Inicia monitoreo cada 30 segundos")
console.log("🧹 limpiarSistemas() - Limpia todos los caches")
console.log("🎯 ejecutarSuiteCompleta() - Ejecuta suite completa de pruebas")

console.groupEnd()

console.log("🎉 SCRIPT DE PRUEBAS CARGADO - ¡Listo para usar!")
console.log("💡 Tip: Abre las DevTools (F12) para ver todos los logs detallados")
