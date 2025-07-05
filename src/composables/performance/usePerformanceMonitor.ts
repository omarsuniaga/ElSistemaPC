/**
 * 📊 SISTEMA DE MONITOREO DE PERFORMANCE EN TIEMPO REAL
 * Fase 2 - Iniciativa 1: Performance Monitoring Avanzado
 */

import {ref, computed, onMounted, onUnmounted} from "vue"
import {defineStore} from "pinia"

// ==================== TIPOS ====================

interface PerformanceMetrics {
  // Web Vitals
  FCP: number | null // First Contentful Paint
  LCP: number | null // Largest Contentful Paint
  FID: number | null // First Input Delay
  CLS: number | null // Cumulative Layout Shift
  TTI: number | null // Time to Interactive

  // Custom Metrics
  routeLoadTime: number | null
  componentMountTime: number | null
  bundleSize: number | null

  // Resource Metrics
  totalResources: number
  jsSize: number
  cssSize: number
  imageSize: number

  // Runtime Metrics
  memoryUsage: number | null
  longTasks: number

  // Network
  connectionType: string
  downlink: number | null
}

interface PerformanceEntry {
  metric: keyof PerformanceMetrics
  value: number
  timestamp: number
  url?: string
  component?: string
}

interface PerformanceThresholds {
  FCP: {good: number; poor: number}
  LCP: {good: number; poor: number}
  FID: {good: number; poor: number}
  CLS: {good: number; poor: number}
  bundleSize: {good: number; poor: number}
}

// ==================== THRESHOLDS (Google Web Vitals) ====================

const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  FCP: {good: 1800, poor: 3000}, // ms
  LCP: {good: 2500, poor: 4000}, // ms
  FID: {good: 100, poor: 300}, // ms
  CLS: {good: 0.1, poor: 0.25}, // score
  bundleSize: {good: 500000, poor: 1000000}, // bytes
}

// ==================== STORE DE PERFORMANCE ====================

export const usePerformanceStore = defineStore("performance", () => {
  // Estado
  const metrics = ref<PerformanceMetrics>({
    FCP: null,
    LCP: null,
    FID: null,
    CLS: null,
    TTI: null,
    routeLoadTime: null,
    componentMountTime: null,
    bundleSize: null,
    totalResources: 0,
    jsSize: 0,
    cssSize: 0,
    imageSize: 0,
    memoryUsage: null,
    longTasks: 0,
    connectionType: "unknown",
    downlink: null,
  })

  const entries = ref<PerformanceEntry[]>([])
  const isMonitoring = ref(false)
  const lastUpdate = ref<Date | null>(null)

  // Computed
  const performanceScore = computed(() => {
    const scores: Record<string, number> = {}

    // Calculate Web Vitals scores (0-100)
    if (metrics.value.FCP !== null) {
      scores.FCP =
        metrics.value.FCP <= PERFORMANCE_THRESHOLDS.FCP.good
          ? 100
          : metrics.value.FCP <= PERFORMANCE_THRESHOLDS.FCP.poor
            ? 50
            : 0
    }

    if (metrics.value.LCP !== null) {
      scores.LCP =
        metrics.value.LCP <= PERFORMANCE_THRESHOLDS.LCP.good
          ? 100
          : metrics.value.LCP <= PERFORMANCE_THRESHOLDS.LCP.poor
            ? 50
            : 0
    }

    if (metrics.value.FID !== null) {
      scores.FID =
        metrics.value.FID <= PERFORMANCE_THRESHOLDS.FID.good
          ? 100
          : metrics.value.FID <= PERFORMANCE_THRESHOLDS.FID.poor
            ? 50
            : 0
    }

    if (metrics.value.CLS !== null) {
      scores.CLS =
        metrics.value.CLS <= PERFORMANCE_THRESHOLDS.CLS.good
          ? 100
          : metrics.value.CLS <= PERFORMANCE_THRESHOLDS.CLS.poor
            ? 50
            : 0
    }

    const validScores = Object.values(scores).filter((score) => score !== null)
    return validScores.length > 0
      ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
      : 0
  })

  const bundleHealthStatus = computed(() => {
    if (!metrics.value.bundleSize) return "unknown"

    if (metrics.value.bundleSize <= PERFORMANCE_THRESHOLDS.bundleSize.good) return "good"
    if (metrics.value.bundleSize <= PERFORMANCE_THRESHOLDS.bundleSize.poor)
      return "needs-improvement"
    return "poor"
  })

  const memoryStatus = computed(() => {
    if (!metrics.value.memoryUsage) return "unknown"

    // Memory thresholds (MB)
    if (metrics.value.memoryUsage <= 50 * 1024 * 1024) return "good"
    if (metrics.value.memoryUsage <= 100 * 1024 * 1024) return "needs-improvement"
    return "poor"
  })

  const recommendations = computed(() => {
    const recs: string[] = []

    if (metrics.value.FCP && metrics.value.FCP > PERFORMANCE_THRESHOLDS.FCP.poor) {
      recs.push("🎨 Optimizar First Contentful Paint: considerar critical CSS y preload de fonts")
    }

    if (metrics.value.LCP && metrics.value.LCP > PERFORMANCE_THRESHOLDS.LCP.poor) {
      recs.push("🖼️ Optimizar Largest Contentful Paint: comprimir imágenes y usar lazy loading")
    }

    if (
      metrics.value.bundleSize &&
      metrics.value.bundleSize > PERFORMANCE_THRESHOLDS.bundleSize.poor
    ) {
      recs.push("📦 Bundle demasiado grande: implementar code splitting más agresivo")
    }

    if (metrics.value.longTasks > 5) {
      recs.push("⏰ Muchas Long Tasks detectadas: optimizar código JavaScript")
    }

    if (metrics.value.memoryUsage && metrics.value.memoryUsage > 100 * 1024 * 1024) {
      recs.push("🧠 Alto uso de memoria: revisar memory leaks y optimizar componentes")
    }

    return recs
  })

  // ==================== MÉTODOS DE MEDICIÓN ====================

  function startMonitoring() {
    if (isMonitoring.value) return

    isMonitoring.value = true
    console.log("📊 Iniciando monitoreo de performance...")

    // Medir Web Vitals
    measureWebVitals()

    // Medir recursos
    measureResources()

    // Medir memoria
    measureMemory()

    // Medir conexión
    measureNetworkInfo()

    // Configurar observadores
    setupPerformanceObserver()

    lastUpdate.value = new Date()
  }

  function stopMonitoring() {
    isMonitoring.value = false
    console.log("📊 Deteniendo monitoreo de performance...")
  }

  function measureWebVitals() {
    // First Contentful Paint
    const paintEntries = performance.getEntriesByType("paint")
    const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint")
    if (fcpEntry) {
      updateMetric("FCP", fcpEntry.startTime)
    }

    // Largest Contentful Paint (usando PerformanceObserver en setupPerformanceObserver)

    // Time to Interactive (aproximado usando domContentLoadedEventEnd)
    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[]
    if (navEntries.length > 0) {
      const navEntry = navEntries[0]
      if (navEntry.domContentLoadedEventEnd) {
        updateMetric("TTI", navEntry.domContentLoadedEventEnd)
      }
    }
  }

  function measureResources() {
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[]

    let jsSize = 0
    let cssSize = 0
    let imageSize = 0
    let totalSize = 0

    resources.forEach((resource) => {
      const size = resource.transferSize || 0
      totalSize += size

      if (resource.name.includes(".js")) {
        jsSize += size
      } else if (resource.name.includes(".css")) {
        cssSize += size
      } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        imageSize += size
      }
    })

    metrics.value.totalResources = resources.length
    metrics.value.jsSize = jsSize
    metrics.value.cssSize = cssSize
    metrics.value.imageSize = imageSize
    metrics.value.bundleSize = totalSize
  }

  function measureMemory() {
    // Solo en navegadores que soporten la API de memoria
    if ("memory" in performance) {
      const memInfo = (performance as any).memory
      updateMetric("memoryUsage", memInfo.usedJSHeapSize)
    }
  }

  function measureNetworkInfo() {
    // Solo en navegadores que soporten la API de conexión
    if ("connection" in navigator) {
      const connection = (navigator as any).connection
      metrics.value.connectionType = connection.effectiveType || "unknown"
      metrics.value.downlink = connection.downlink || null
    }
  }

  function setupPerformanceObserver() {
    if (!("PerformanceObserver" in window)) return

    try {
      // Observer para LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        if (lastEntry) {
          updateMetric("LCP", lastEntry.startTime)
        }
      })
      lcpObserver.observe({entryTypes: ["largest-contentful-paint"]})

      // Observer para FID
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          updateMetric("FID", entry.processingStart - entry.startTime)
        })
      })
      fidObserver.observe({entryTypes: ["first-input"]})

      // Observer para CLS
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            updateMetric("CLS", clsValue)
          }
        })
      })
      clsObserver.observe({entryTypes: ["layout-shift"]})

      // Observer para Long Tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        metrics.value.longTasks += entries.length
      })
      longTaskObserver.observe({entryTypes: ["longtask"]})
    } catch (error) {
      console.warn("📊 No se pudieron configurar algunos PerformanceObservers:", error)
    }
  }

  function updateMetric(
    metric: keyof PerformanceMetrics,
    value: number,
    metadata?: {url?: string; component?: string}
  ) {
    ;(metrics.value as any)[metric] = value

    entries.value.push({
      metric,
      value,
      timestamp: Date.now(),
      url: metadata?.url || window.location.pathname,
      component: metadata?.component,
    })

    // Mantener solo las últimas 100 entradas
    if (entries.value.length > 100) {
      entries.value = entries.value.slice(-100)
    }

    lastUpdate.value = new Date()
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================

  function measureRouteLoadTime(routeName: string, startTime: number) {
    const loadTime = performance.now() - startTime
    updateMetric("routeLoadTime", loadTime, {url: routeName})
  }

  function measureComponentMountTime(componentName: string, startTime: number) {
    const mountTime = performance.now() - startTime
    updateMetric("componentMountTime", mountTime, {component: componentName})
  }

  function clearEntries() {
    entries.value = []
  }

  function exportReport() {
    return {
      timestamp: new Date().toISOString(),
      metrics: metrics.value,
      score: performanceScore.value,
      recommendations: recommendations.value,
      recentEntries: entries.value.slice(-20),
    }
  }

  // ==================== RETURN ====================

  return {
    // Estado
    metrics,
    entries,
    isMonitoring,
    lastUpdate,

    // Computed
    performanceScore,
    bundleHealthStatus,
    memoryStatus,
    recommendations,

    // Métodos
    startMonitoring,
    stopMonitoring,
    measureRouteLoadTime,
    measureComponentMountTime,
    updateMetric,
    clearEntries,
    exportReport,
  }
})

// ==================== COMPOSABLE ====================

export function usePerformanceMonitor() {
  const store = usePerformanceStore()

  onMounted(() => {
    // Iniciar monitoreo automáticamente
    store.startMonitoring()
  })

  onUnmounted(() => {
    // No detener el monitoreo al desmontar componentes individuales
    // El monitoreo es global
  })

  return {
    ...store,

    // Método de conveniencia para medir performance de componentes
    measureComponent: (name: string) => {
      const startTime = performance.now()

      return {
        finish: () => {
          store.measureComponentMountTime(name, startTime)
        },
      }
    },
  }
}

// ==================== DIRECTIVA VUE ====================

// Directiva para medir automáticamente performance de componentes
export const vPerformanceMonitor = {
  mounted(el: HTMLElement, binding: any) {
    const componentName = binding.value || el.tagName.toLowerCase()
    const startTime = performance.now()

    // Medir cuando el componente termine de renderizar
    requestAnimationFrame(() => {
      const store = usePerformanceStore()
      store.measureComponentMountTime(componentName, startTime)
    })
  },
}

// ==================== DECORADOR PARA FUNCIONES ====================

export function measurePerformance(functionName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = function (...args: any[]) {
      const startTime = performance.now()
      const result = method.apply(this, args)

      if (result instanceof Promise) {
        return result.finally(() => {
          const store = usePerformanceStore()
          const duration = performance.now() - startTime
          store.updateMetric("componentMountTime", duration, {component: functionName})
        })
      } else {
        const store = usePerformanceStore()
        const duration = performance.now() - startTime
        store.updateMetric("componentMountTime", duration, {component: functionName})
        return result
      }
    }

    return descriptor
  }
}
