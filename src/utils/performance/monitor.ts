// src/utils/performance/monitor.ts
/**
 * Monitor de rendimiento en tiempo real para Music Academy Manager
 */

import {logger} from "@/utils/logging/logger"

interface PerformanceMetric {
  name: string
  value: number
  timestamp: Date
  category: "loading" | "interaction" | "network" | "memory"
}

interface ComponentMetric {
  componentName: string
  mountTime: number
  renderTime: number
  updateCount: number
  lastUpdate: Date
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private componentMetrics = new Map<string, ComponentMetric>()
  private observers: PerformanceObserver[] = []
  private isMonitoring = false

  private constructor() {
    this.initializeObservers()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private initializeObservers() {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return
    }

    try {
      // Observer para métricas de navegación
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processNavigationEntry(entry as PerformanceNavigationTiming)
        }
      })

      // Observer para métricas de recursos
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processResourceEntry(entry as PerformanceResourceTiming)
        }
      })

      // Observer para paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPaintEntry(entry as PerformancePaintTiming)
        }
      })

      navigationObserver.observe({entryTypes: ["navigation"]})
      resourceObserver.observe({entryTypes: ["resource"]})
      paintObserver.observe({entryTypes: ["paint"]})

      this.observers.push(navigationObserver, resourceObserver, paintObserver)

      // Observer para Long Tasks (si está disponible)
      if ("PerformanceObserver" in window && "observe" in PerformanceObserver.prototype) {
        try {
          const longTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              this.processLongTask(entry)
            }
          })
          longTaskObserver.observe({entryTypes: ["longtask"]})
          this.observers.push(longTaskObserver)
        } catch (e) {
          // Long tasks no soportado en este navegador
        }
      }
    } catch (error) {
      logger.warn("PERFORMANCE", "Error inicializando observers", error)
    }
  }

  startMonitoring() {
    this.isMonitoring = true
    logger.info("PERFORMANCE", "Monitor de rendimiento iniciado")

    // Métricas cada 30 segundos
    setInterval(() => this.collectMemoryMetrics(), 30000)

    // Reporte cada 5 minutos
    setInterval(() => this.generateReport(), 300000)
  }

  stopMonitoring() {
    this.isMonitoring = false
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
    logger.info("PERFORMANCE", "Monitor de rendimiento detenido")
  }

  private addMetric(name: string, value: number, category: PerformanceMetric["category"]) {
    if (!this.isMonitoring) return

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      category,
    }

    this.metrics.push(metric)

    // Mantener solo las últimas 1000 métricas
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Log métricas críticas
    if (this.isCriticalMetric(name, value)) {
      logger.warn("PERFORMANCE", `Métrica crítica: ${name} = ${value}`, metric)
    }
  }

  private isCriticalMetric(name: string, value: number): boolean {
    const thresholds = {
      "First Contentful Paint": 3000,
      "Largest Contentful Paint": 4000,
      "Cumulative Layout Shift": 0.25,
      "First Input Delay": 300,
      "Long Task": 150,
      "Memory Usage": 100 * 1024 * 1024, // 100MB
    }

    return (thresholds as any)[name] && value > (thresholds as any)[name]
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming) {
    this.addMetric(
      "DOM Content Loaded",
      entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      "loading"
    )
    this.addMetric("Page Load Time", entry.loadEventEnd - entry.loadEventStart, "loading")
    this.addMetric("DNS Lookup", entry.domainLookupEnd - entry.domainLookupStart, "network")
    this.addMetric("TCP Connection", entry.connectEnd - entry.connectStart, "network")
  }

  private processResourceEntry(entry: PerformanceResourceTiming) {
    const loadTime = entry.responseEnd - entry.requestStart
    this.addMetric(`Resource Load: ${entry.name.split("/").pop()}`, loadTime, "network")
  }

  private processPaintEntry(entry: PerformancePaintTiming) {
    if (entry.name === "first-contentful-paint") {
      this.addMetric("First Contentful Paint", entry.startTime, "loading")
    } else if (entry.name === "first-paint") {
      this.addMetric("First Paint", entry.startTime, "loading")
    }
  }

  private processLongTask(entry: PerformanceEntry) {
    this.addMetric("Long Task", entry.duration, "interaction")
  }

  private collectMemoryMetrics() {
    if ("memory" in performance) {
      const memory = (performance as any).memory
      this.addMetric("Memory Usage", memory.usedJSHeapSize, "memory")
      this.addMetric("Memory Limit", memory.jsHeapSizeLimit, "memory")
    }
  }

  // Métodos para componentes Vue
  trackComponentMount(componentName: string, startTime: number) {
    const mountTime = performance.now() - startTime

    const existing = this.componentMetrics.get(componentName)
    if (existing) {
      existing.mountTime = mountTime
      existing.lastUpdate = new Date()
    } else {
      this.componentMetrics.set(componentName, {
        componentName,
        mountTime,
        renderTime: 0,
        updateCount: 0,
        lastUpdate: new Date(),
      })
    }

    this.addMetric(`Component Mount: ${componentName}`, mountTime, "loading")
  }

  trackComponentUpdate(componentName: string) {
    const metric = this.componentMetrics.get(componentName)
    if (metric) {
      metric.updateCount++
      metric.lastUpdate = new Date()

      this.addMetric(`Component Update: ${componentName}`, metric.updateCount, "interaction")
    }
  }

  measureInteraction(name: string, startTime: number) {
    const duration = performance.now() - startTime
    this.addMetric(`Interaction: ${name}`, duration, "interaction")
    return duration
  }

  // Métodos de análisis
  getMetrics(category?: PerformanceMetric["category"], minutes?: number): PerformanceMetric[] {
    let filtered = this.metrics

    if (category) {
      filtered = filtered.filter((m) => m.category === category)
    }

    if (minutes) {
      const cutoff = new Date(Date.now() - minutes * 60 * 1000)
      filtered = filtered.filter((m) => m.timestamp > cutoff)
    }

    return filtered
  }

  getAverageMetric(name: string, minutes?: number): number {
    const metrics = this.getMetrics(undefined, minutes).filter((m) => m.name === name)
    if (metrics.length === 0) return 0

    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
  }

  generateReport(): PerformanceReport {
    const now = new Date()
    const report: PerformanceReport = {
      timestamp: now,
      summary: {
        totalMetrics: this.metrics.length,
        avgLoadTime: this.getAverageMetric("Page Load Time", 60),
        avgInteractionTime: this.getAverageMetric("Interaction", 60),
        memoryUsage: this.getAverageMetric("Memory Usage", 10),
        componentsTracked: this.componentMetrics.size,
      },
      criticalIssues: this.findCriticalIssues(),
      recommendations: this.generateRecommendations(),
    }

    logger.performance("Reporte de rendimiento generado", report)
    return report
  }

  private findCriticalIssues(): string[] {
    const issues: string[] = []
    const recentMetrics = this.getMetrics(undefined, 30)

    // Buscar tiempos de carga lentos
    const slowLoads = recentMetrics.filter((m) => m.name.includes("Load") && m.value > 3000)
    if (slowLoads.length > 0) {
      issues.push(`${slowLoads.length} cargas lentas detectadas (>3s)`)
    }

    // Buscar memory leaks
    const memoryMetrics = recentMetrics.filter((m) => m.name === "Memory Usage")
    if (memoryMetrics.length > 5) {
      const trend = this.calculateTrend(memoryMetrics.map((m) => m.value))
      if (trend > 0.1) {
        issues.push("Posible memory leak detectado")
      }
    }

    // Buscar componentes lentos
    for (const [name, metric] of this.componentMetrics) {
      if (metric.mountTime > 100) {
        issues.push(`Componente lento: ${name} (${metric.mountTime.toFixed(2)}ms)`)
      }
    }

    return issues
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0

    const first = values[0]
    const last = values[values.length - 1]
    return (last - first) / first
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    // Analizar métricas y generar recomendaciones
    const avgFCP = this.getAverageMetric("First Contentful Paint", 60)
    if (avgFCP > 2500) {
      recommendations.push("Optimizar tiempo de First Contentful Paint con lazy loading")
    }

    const memoryUsage = this.getAverageMetric("Memory Usage", 10)
    if (memoryUsage > 50 * 1024 * 1024) {
      recommendations.push("Considerar optimización de memoria")
    }

    // Componentes con muchas actualizaciones
    for (const [name, metric] of this.componentMetrics) {
      if (metric.updateCount > 50) {
        recommendations.push(`Optimizar re-renders de ${name}`)
      }
    }

    return recommendations
  }
}

interface PerformanceReport {
  timestamp: Date
  summary: {
    totalMetrics: number
    avgLoadTime: number
    avgInteractionTime: number
    memoryUsage: number
    componentsTracked: number
  }
  criticalIssues: string[]
  recommendations: string[]
}

// Plugin para Vue 3
export function createPerformancePlugin() {
  const monitor = PerformanceMonitor.getInstance()

  return {
    install(app: any) {
      // Iniciar monitoreo
      monitor.startMonitoring()

      // Mixin global para tracking de componentes
      app.mixin({
        beforeMount() {
          if (this.$options.name) {
            this._mountStart = performance.now()
          }
        },
        mounted() {
          if (this.$options.name && this._mountStart) {
            monitor.trackComponentMount(this.$options.name, this._mountStart)
          }
        },
        beforeUpdate() {
          if (this.$options.name) {
            monitor.trackComponentUpdate(this.$options.name)
          }
        },
      })

      // Método global para medición de interacciones
      app.config.globalProperties.$measureInteraction = (name: string, fn: Function) => {
        const start = performance.now()
        const result = fn()
        monitor.measureInteraction(name, start)
        return result
      }
    },
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()
export type {PerformanceReport, PerformanceMetric, ComponentMetric}
