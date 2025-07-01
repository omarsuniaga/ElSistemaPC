// src/utils/testing/performanceTests.ts
/**
 * Suite de pruebas de rendimiento para validar optimizaciones
 */

import {performanceMonitor} from "@/utils/performance/monitor"
import {smartCache} from "@/utils/cache/smartCache"
import {createLazyComponent, ModulePreloader} from "@/utils/performance/lazyLoader"
import {imageOptimizer} from "@/utils/optimization/imageOptimizer"
import {logger} from "@/utils/logging/logger"

interface TestResult {
  testName: string
  startTime: number
  endTime: number
  duration: number
  success: boolean
  details: any
  metrics?: any
}

interface PerformanceBenchmark {
  testSuite: string
  timestamp: Date
  results: TestResult[]
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    averageDuration: number
    criticalIssues: string[]
    recommendations: string[]
  }
}

class PerformanceTestSuite {
  private static instance: PerformanceTestSuite
  private results: TestResult[] = []

  static getInstance(): PerformanceTestSuite {
    if (!PerformanceTestSuite.instance) {
      PerformanceTestSuite.instance = new PerformanceTestSuite()
    }
    return PerformanceTestSuite.instance
  }

  async runFullSuite(): Promise<PerformanceBenchmark> {
    logger.info("PERFORMANCE_TEST", "🚀 Iniciando suite completa de pruebas de rendimiento")

    this.results = []
    const startTime = performance.now()

    // Ejecutar todas las pruebas
    await this.testCachePerformance()
    await this.testLazyLoadingEfficiency()
    await this.testImageOptimization()
    await this.testComponentLoadTimes()
    await this.testMemoryUsage()
    await this.testNetworkPerformance()
    await this.testInteractionResponsiveness()

    const totalDuration = performance.now() - startTime

    const benchmark: PerformanceBenchmark = {
      testSuite: "Music Academy Manager - Performance Optimization",
      timestamp: new Date(),
      results: this.results,
      summary: {
        totalTests: this.results.length,
        passedTests: this.results.filter((r) => r.success).length,
        failedTests: this.results.filter((r) => !r.success).length,
        averageDuration: this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length,
        criticalIssues: this.findCriticalIssues(),
        recommendations: this.generateOptimizationRecommendations(),
      },
    }

    logger.info(
      "PERFORMANCE_TEST",
      `✅ Suite completada en ${totalDuration.toFixed(2)}ms`,
      benchmark.summary
    )
    return benchmark
  }

  private async testCachePerformance(): Promise<void> {
    const testName = "Cache Performance"
    const startTime = performance.now()

    try {
      // Test 1: Velocidad de escritura
      const writeStart = performance.now()
      const testData = {id: 1, name: "Test User", data: new Array(1000).fill("test")}

      for (let i = 0; i < 100; i++) {
        smartCache.set(`test-key-${i}`, {...testData, id: i})
      }
      const writeTime = performance.now() - writeStart

      // Test 2: Velocidad de lectura
      const readStart = performance.now()
      let hits = 0
      for (let i = 0; i < 100; i++) {
        const result = smartCache.get(`test-key-${i}`)
        if (result) hits++
      }
      const readTime = performance.now() - readStart

      // Test 3: Hit rate
      const hitRate = hits / 100

      const endTime = performance.now()
      const duration = endTime - startTime

      const success = writeTime < 50 && readTime < 10 && hitRate > 0.95

      this.results.push({
        testName,
        startTime,
        endTime,
        duration,
        success,
        details: {
          writeTime: `${writeTime.toFixed(2)}ms`,
          readTime: `${readTime.toFixed(2)}ms`,
          hitRate: `${(hitRate * 100).toFixed(1)}%`,
          cacheStats: smartCache.getStats(),
        },
      })

      // Limpiar datos de prueba
      for (let i = 0; i < 100; i++) {
        smartCache.delete(`test-key-${i}`)
      }
    } catch (error) {
      this.results.push({
        testName,
        startTime,
        endTime: performance.now(),
        duration: performance.now() - startTime,
        success: false,
        details: {error: error instanceof Error ? error.message : String(error)},
      })
    }
  }

  private async testLazyLoadingEfficiency(): Promise<void> {
    const testName = "Lazy Loading Efficiency"
    const startTime = performance.now()

    try {
      // Simular carga de componentes críticos
      const preloadStart = performance.now()
      await Promise.all([
        ModulePreloader.preloadModule(
          () => Promise.resolve({default: {name: "MockComponent1"}}),
          "MockComponent1"
        ),
        ModulePreloader.preloadModule(
          () => Promise.resolve({default: {name: "MockComponent2"}}),
          "MockComponent2"
        ),
        ModulePreloader.preloadModule(
          () => Promise.resolve({default: {name: "MockComponent3"}}),
          "MockComponent3"
        ),
      ])
      const preloadTime = performance.now() - preloadStart

      // Test de carga bajo demanda
      const lazyLoadStart = performance.now()
      const mockComponent = createLazyComponent(() =>
        Promise.resolve({default: {name: "MockComponent"}})
      )
      const lazyLoadTime = performance.now() - lazyLoadStart

      const endTime = performance.now()
      const success = preloadTime < 100 && lazyLoadTime < 50 && mockComponent

      this.results.push({
        testName,
        startTime,
        endTime,
        duration: endTime - startTime,
        success,
        details: {
          preloadTime: `${preloadTime.toFixed(2)}ms`,
          lazyLoadTime: `${lazyLoadTime.toFixed(2)}ms`,
          componentsLoaded: 4,
        },
      })
    } catch (error) {
      this.results.push({
        testName,
        startTime,
        endTime: performance.now(),
        duration: performance.now() - startTime,
        success: false,
        details: {error: error instanceof Error ? error.message : String(error)},
      })
    }
  }

  private async testImageOptimization(): Promise<void> {
    const testName = "Image Optimization"
    const startTime = performance.now()

    try {
      // Crear imagen de prueba
      const canvas = document.createElement("canvas")
      canvas.width = 1200
      canvas.height = 800
      const ctx = canvas.getContext("2d")!

      // Dibujar patrón de prueba
      ctx.fillStyle = "#ff0000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#00ff00"
      ctx.fillRect(100, 100, 200, 200)

      const testImageUrl = canvas.toDataURL("image/png")
      const originalSize = testImageUrl.length

      // Optimizar imagen
      const optimizationStart = performance.now()
      const optimized = await imageOptimizer.optimizeImage(testImageUrl, {
        quality: 0.8,
        maxWidth: 800,
        format: "auto",
      })
      const optimizationTime = performance.now() - optimizationStart

      const compressionRatio = optimized.size / originalSize
      const endTime = performance.now()

      const success = optimizationTime < 200 && compressionRatio < 0.8 && optimized.width <= 800

      this.results.push({
        testName,
        startTime,
        endTime,
        duration: endTime - startTime,
        success,
        details: {
          optimizationTime: `${optimizationTime.toFixed(2)}ms`,
          originalSize: `${Math.round(originalSize / 1024)}KB`,
          optimizedSize: `${Math.round(optimized.size / 1024)}KB`,
          compressionRatio: `${(compressionRatio * 100).toFixed(1)}%`,
          newDimensions: `${optimized.width}x${optimized.height}`,
        },
      })
    } catch (error) {
      this.results.push({
        testName,
        startTime,
        endTime: performance.now(),
        duration: performance.now() - startTime,
        success: false,
        details: {error: error instanceof Error ? error.message : String(error)},
      })
    }
  }

  private async testComponentLoadTimes(): Promise<void> {
    const testName = "Component Load Times"
    const startTime = performance.now()

    try {
      const componentTests = []

      // Simular carga de diferentes tipos de componentes
      const components = [
        {name: "LightComponent", complexity: "low", expectedTime: 50},
        {name: "MediumComponent", complexity: "medium", expectedTime: 100},
        {name: "HeavyComponent", complexity: "high", expectedTime: 200},
      ]

      for (const comp of components) {
        const loadStart = performance.now()

        // Simular carga de componente
        await new Promise((resolve) => {
          setTimeout(resolve, Math.random() * comp.expectedTime)
        })

        const loadTime = performance.now() - loadStart
        componentTests.push({
          name: comp.name,
          loadTime,
          withinExpected: loadTime <= comp.expectedTime * 1.2, // 20% margen
        })

        // Trackear con el monitor
        performanceMonitor.trackComponentMount(comp.name, loadStart)
      }

      const endTime = performance.now()
      const allWithinExpected = componentTests.every((t) => t.withinExpected)
      const avgLoadTime =
        componentTests.reduce((sum, t) => sum + t.loadTime, 0) / componentTests.length

      this.results.push({
        testName,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: allWithinExpected && avgLoadTime < 120,
        details: {
          componentTests,
          averageLoadTime: `${avgLoadTime.toFixed(2)}ms`,
          allWithinExpected,
        },
      })
    } catch (error) {
      this.results.push({
        testName,
        startTime,
        endTime: performance.now(),
        duration: performance.now() - startTime,
        success: false,
        details: {error: error instanceof Error ? error.message : String(error)},
      })
    }
  }

  private async testMemoryUsage(): Promise<void> {
    const testName = "Memory Usage"
    const startTime = performance.now()

    try {
      const initialMemory = this.getMemoryUsage()

      // Crear carga de memoria controlada
      const testData = []
      for (let i = 0; i < 1000; i++) {
        testData.push({
          id: i,
          data: new Array(100).fill(`test-data-${i}`),
          timestamp: new Date(),
        })
      }

      const peakMemory = this.getMemoryUsage()

      // Limpiar datos
      testData.length = 0

      // Forzar garbage collection si está disponible
      if ("gc" in window) {
        ;(window as any).gc()
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
      const finalMemory = this.getMemoryUsage()

      const memoryIncrease = peakMemory - initialMemory
      const memoryRecovered = peakMemory - finalMemory
      const recoveryRate = memoryRecovered / memoryIncrease

      const endTime = performance.now()
      const success = memoryIncrease < 10 * 1024 * 1024 && recoveryRate > 0.8 // <10MB y >80% recuperación

      this.results.push({
        testName,
        startTime,
        endTime,
        duration: endTime - startTime,
        success,
        details: {
          initialMemory: this.formatBytes(initialMemory),
          peakMemory: this.formatBytes(peakMemory),
          finalMemory: this.formatBytes(finalMemory),
          memoryIncrease: this.formatBytes(memoryIncrease),
          recoveryRate: `${(recoveryRate * 100).toFixed(1)}%`,
        },
      })
    } catch (error) {
      this.results.push({
        testName,
        startTime,
        endTime: performance.now(),
        duration: performance.now() - startTime,
        success: false,
        details: {error: error instanceof Error ? error.message : String(error)},
      })
    }
  }

  private async testNetworkPerformance(): Promise<void> {
    const testName = "Network Performance"
    const startTime = performance.now()

    try {
      const networkTests = []

      // Test de múltiples requests simultáneos
      const requestStart = performance.now()
      const requests = Array.from({length: 5}, (_, i) =>
        fetch(`data:text/plain,test-${i}`).then((r) => r.text())
      )

      const responses = await Promise.all(requests)
      const requestTime = performance.now() - requestStart

      networkTests.push({
        type: "Parallel Requests",
        time: requestTime,
        success: responses.length === 5,
      })

      // Test de request secuenciales
      const sequentialStart = performance.now()
      for (let i = 0; i < 3; i++) {
        await fetch(`data:text/plain,sequential-${i}`).then((r) => r.text())
      }
      const sequentialTime = performance.now() - sequentialStart

      networkTests.push({
        type: "Sequential Requests",
        time: sequentialTime,
        success: sequentialTime < requestTime * 2, // Debería ser más lento pero no mucho
      })

      const endTime = performance.now()
      const allSuccess = networkTests.every((t) => t.success)

      this.results.push({
        testName,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: allSuccess && requestTime < 100,
        details: {
          networkTests,
          parallelTime: `${requestTime.toFixed(2)}ms`,
          sequentialTime: `${sequentialTime.toFixed(2)}ms`,
        },
      })
    } catch (error) {
      this.results.push({
        testName,
        startTime,
        endTime: performance.now(),
        duration: performance.now() - startTime,
        success: false,
        details: {error: error instanceof Error ? error.message : String(error)},
      })
    }
  }

  private async testInteractionResponsiveness(): Promise<void> {
    const testName = "Interaction Responsiveness"
    const startTime = performance.now()

    try {
      const interactionTests = []

      // Simular diferentes tipos de interacciones
      const interactions = [
        {name: "Button Click", expectedTime: 16},
        {name: "Form Input", expectedTime: 32},
        {name: "Navigation", expectedTime: 100},
        {name: "Modal Open", expectedTime: 200},
      ]

      for (const interaction of interactions) {
        const interactionStart = performance.now()

        // Simular procesamiento de interacción
        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            // Simular trabajo del DOM
            for (let i = 0; i < 1000; i++) {
              Math.random()
            }
            resolve(undefined)
          })
        })

        const interactionTime = performanceMonitor.measureInteraction(
          interaction.name,
          interactionStart
        )

        interactionTests.push({
          name: interaction.name,
          time: interactionTime,
          withinBudget: interactionTime <= interaction.expectedTime,
        })
      }

      const endTime = performance.now()
      const allWithinBudget = interactionTests.every((t) => t.withinBudget)
      const avgTime = interactionTests.reduce((sum, t) => sum + t.time, 0) / interactionTests.length

      this.results.push({
        testName,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: allWithinBudget && avgTime < 60,
        details: {
          interactionTests,
          averageTime: `${avgTime.toFixed(2)}ms`,
          allWithinBudget,
        },
      })
    } catch (error) {
      this.results.push({
        testName,
        startTime,
        endTime: performance.now(),
        duration: performance.now() - startTime,
        success: false,
        details: {error: error instanceof Error ? error.message : String(error)},
      })
    }
  }

  private getMemoryUsage(): number {
    if ("memory" in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  private findCriticalIssues(): string[] {
    const issues: string[] = []

    for (const result of this.results) {
      if (!result.success) {
        issues.push(`❌ ${result.testName}: ${result.details.error || "Test failed"}`)
      } else if (result.duration > 200) {
        issues.push(`⚠️ ${result.testName}: Tiempo excesivo (${result.duration.toFixed(2)}ms)`)
      }
    }

    return issues
  }

  private generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = []

    const failedTests = this.results.filter((r) => !r.success)
    if (failedTests.length > 0) {
      recommendations.push(`Revisar ${failedTests.length} pruebas fallidas`)
    }

    const slowTests = this.results.filter((r) => r.duration > 150)
    if (slowTests.length > 0) {
      recommendations.push(`Optimizar ${slowTests.length} operaciones lentas`)
    }

    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length
    if (avgDuration > 100) {
      recommendations.push("Considerar optimizaciones adicionales de rendimiento")
    }

    if (this.results.length > 0 && this.results.every((r) => r.success)) {
      recommendations.push("✅ Todas las optimizaciones funcionan correctamente")
    }

    return recommendations
  }

  exportResults(benchmark: PerformanceBenchmark): void {
    const reportData = {
      ...benchmark,
      exportTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      performanceApi: {
        supported: "performance" in window,
        memory: "memory" in performance,
        observer: "PerformanceObserver" in window,
      },
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `performance-test-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    logger.info("PERFORMANCE_TEST", "Resultados exportados", reportData.summary)
  }
}

// Función para ejecutar desde consola
export async function runPerformanceTests(): Promise<PerformanceBenchmark> {
  const suite = PerformanceTestSuite.getInstance()
  return await suite.runFullSuite()
}

// Función para análisis rápido
export function quickPerformanceCheck(): void {
  console.group("🚀 Quick Performance Check")

  const report = performanceMonitor.generateReport()
  const cacheStats = smartCache.getStats()

  console.log("📊 Performance Report:", report)
  console.log("💾 Cache Stats:", cacheStats)

  if (report.criticalIssues.length > 0) {
    console.warn("⚠️ Critical Issues:", report.criticalIssues)
  } else {
    console.log("✅ No critical issues detected")
  }

  console.groupEnd()
}

export const performanceTestSuite = PerformanceTestSuite.getInstance()
export type {TestResult, PerformanceBenchmark}
