<!--
🎛️ DASHBOARD CENTRAL FASE 2
Performance & Security Monitoring
-->

<template>
  <div class="phase-2-dashboard">
    <!-- Header del Dashboard -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="dashboard-title">
            <v-icon color="primary">mdi-gauge</v-icon>
            Dashboard Fase 2: Performance & Security
          </h1>
          <p class="dashboard-subtitle">
            Monitoreo en tiempo real del rendimiento y seguridad del sistema
          </p>
        </div>

        <div class="status-indicators">
          <v-chip :color="getOverallStatusColor()" variant="flat" size="large" class="status-chip">
            <v-icon start>{{ getOverallStatusIcon() }}</v-icon>
            {{ getOverallStatusText() }}
          </v-chip>

          <v-chip color="info" variant="outlined" class="last-update-chip">
            <v-icon start>mdi-clock</v-icon>
            Actualizado: {{ formatTime(lastUpdate) }}
          </v-chip>
        </div>
      </div>
    </div>

    <!-- Métricas Principales -->
    <div class="main-metrics">
      <v-row>
        <v-col cols="12" md="3">
          <MetricCard
            title="Performance Score"
            :value="performanceMetrics.overallScore"
            suffix="%"
            :color="getScoreColor(performanceMetrics.overallScore)"
            icon="mdi-speedometer"
            :trend="performanceMetrics.trend"
            description="Score general de rendimiento"
          />
        </v-col>

        <v-col cols="12" md="3">
          <MetricCard
            title="Security Score"
            :value="securityMetrics.score"
            suffix="%"
            :color="getScoreColor(securityMetrics.score)"
            icon="mdi-shield-check"
            :trend="securityMetrics.trend"
            description="Nivel de seguridad del sistema"
          />
        </v-col>

        <v-col cols="12" md="3">
          <MetricCard
            title="Cache Hit Rate"
            :value="cacheMetrics.hitRate"
            suffix="%"
            :color="getScoreColor(cacheMetrics.hitRate)"
            icon="mdi-database-arrow-up"
            :trend="cacheMetrics.trend"
            description="Efectividad del sistema de caché"
          />
        </v-col>

        <v-col cols="12" md="3">
          <MetricCard
            title="Code Quality"
            :value="codeQualityMetrics.overallScore"
            suffix="%"
            :color="getScoreColor(codeQualityMetrics.overallScore)"
            icon="mdi-code-braces"
            :trend="codeQualityMetrics.trend"
            description="Calidad del código y cumplimiento"
          />
        </v-col>
      </v-row>
    </div>

    <!-- Tabs de Secciones -->
    <v-tabs v-model="activeTab" bg-color="surface" color="primary" class="dashboard-tabs">
      <v-tab value="performance">
        <v-icon start>mdi-speedometer</v-icon>
        Performance
      </v-tab>
      <v-tab value="security">
        <v-icon start>mdi-shield-check</v-icon>
        Security
      </v-tab>
      <v-tab value="cache">
        <v-icon start>mdi-database</v-icon>
        Cache
      </v-tab>
      <v-tab value="monitoring">
        <v-icon start>mdi-monitor-dashboard</v-icon>
        RUM
      </v-tab>
      <v-tab value="quality">
        <v-icon start>mdi-code-braces</v-icon>
        Code Quality
      </v-tab>
    </v-tabs>

    <!-- Contenido de las Tabs -->
    <v-window v-model="activeTab" class="dashboard-content">
      <!-- Performance Tab -->
      <v-window-item value="performance">
        <PerformanceSection
          :metrics="performanceMetrics"
          :web-vitals="webVitals"
          :resources="resourceMetrics"
          @analyze="analyzePerformance"
          @optimize="optimizePerformance"
        />
      </v-window-item>

      <!-- Security Tab -->
      <v-window-item value="security">
        <SecuritySection
          :config="securityConfig"
          :violations="securityViolations"
          :audit="securityAudit"
          @run-audit="runSecurityAudit"
          @update-config="updateSecurityConfig"
        />
      </v-window-item>

      <!-- Cache Tab -->
      <v-window-item value="cache">
        <CacheSection
          :stats="cacheStats"
          :strategies="cacheStrategies"
          :health="cacheHealth"
          @clear-cache="clearCache"
          @optimize-cache="optimizeCache"
        />
      </v-window-item>

      <!-- RUM Tab -->
      <v-window-item value="monitoring">
        <MonitoringSection
          :session="currentSession"
          :metrics="userMetrics"
          :errors="userErrors"
          @start-session="startMonitoring"
          @export-data="exportMonitoringData"
        />
      </v-window-item>

      <!-- Code Quality Tab -->
      <v-window-item value="quality">
        <CodeQualitySection
          :metrics="codeMetrics"
          :quality-gates="qualityGates"
          :recommendations="qualityRecommendations"
          @analyze="analyzeCodeQuality"
          @fix-issues="fixCodeIssues"
        />
      </v-window-item>
    </v-window>

    <!-- Alertas y Notificaciones -->
    <AlertsPanel
      v-if="criticalAlerts.length > 0"
      :alerts="criticalAlerts"
      @dismiss="dismissAlert"
      @resolve="resolveAlert"
    />

    <!-- Panel de Acciones Rápidas -->
    <v-speed-dial
      v-model="speedDialOpen"
      location="bottom end"
      transition="slide-y-reverse-transition"
    >
      <template #activator="{props}">
        <v-btn
          v-bind="props"
          color="primary"
          icon="mdi-plus"
          size="large"
          class="speed-dial-activator"
        />
      </template>

      <v-btn color="green" icon="mdi-refresh" @click="refreshAllMetrics">
        <v-icon>mdi-refresh</v-icon>
        <v-tooltip activator="parent" location="start"> Actualizar todas las métricas </v-tooltip>
      </v-btn>

      <v-btn color="blue" icon="mdi-download" @click="exportReport">
        <v-icon>mdi-download</v-icon>
        <v-tooltip activator="parent" location="start"> Exportar reporte </v-tooltip>
      </v-btn>

      <v-btn color="orange" icon="mdi-auto-fix" @click="runAutoOptimizations">
        <v-icon>mdi-auto-fix</v-icon>
        <v-tooltip activator="parent" location="start"> Optimizaciones automáticas </v-tooltip>
      </v-btn>

      <v-btn color="red" icon="mdi-alert" @click="runEmergencyCheck">
        <v-icon>mdi-alert</v-icon>
        <v-tooltip activator="parent" location="start"> Verificación de emergencia </v-tooltip>
      </v-btn>
    </v-speed-dial>

    <!-- Loading Overlay -->
    <v-overlay v-model="isLoading" class="loading-overlay" persistent>
      <div class="loading-content">
        <v-progress-circular indeterminate size="64" color="primary" />
        <p class="loading-text">{{ loadingMessage }}</p>
      </div>
    </v-overlay>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted, watch} from "vue"
import {usePerformanceMonitor} from "@/composables/performance/usePerformanceMonitor"
import {useSecurity} from "@/composables/security/useSecurity"
import {useCache} from "@/composables/cache/useAdvancedCache"
import {useMonitoring} from "@/composables/monitoring/useRealUserMonitoring"
import {useCodeQuality} from "@/composables/quality/useCodeQuality"

// Componentes
import MetricCard from "@/components/dashboard/MetricCard.vue"
import PerformanceSection from "@/components/dashboard/PerformanceSection.vue"
import SecuritySection from "@/components/dashboard/SecuritySection.vue"
import CacheSection from "@/components/dashboard/CacheSection.vue"
import MonitoringSection from "@/components/dashboard/MonitoringSection.vue"
import CodeQualitySection from "@/components/dashboard/CodeQualitySection.vue"
import AlertsPanel from "@/components/dashboard/AlertsPanel.vue"

// Composables
const performanceStore = usePerformanceMonitor()
const securityStore = useSecurity()
const cacheStore = useCache()
const monitoringStore = useMonitoring()
const codeQualityStore = useCodeQuality()

// Estado local
const activeTab = ref("performance")
const speedDialOpen = ref(false)
const isLoading = ref(false)
const loadingMessage = ref("")
const lastUpdate = ref(new Date())
const updateInterval = ref<number | null>(null)

// Métricas reactivas
const performanceMetrics = computed(() => ({
  overallScore: performanceStore.performanceScore,
  trend: performanceStore.trend,
  vitals: performanceStore.webVitals,
}))

const securityMetrics = computed(() => ({
  score: securityStore.securityScore,
  trend: "stable",
  violations: securityStore.criticalViolations.length,
}))

const cacheMetrics = computed(() => ({
  hitRate: cacheStore.stats.hitRate,
  trend: cacheStore.cacheHealth === "excellent" ? "improving" : "stable",
  totalSize: cacheStore.stats.totalSize,
}))

const codeQualityMetrics = computed(() => ({
  overallScore: codeQualityStore.overallScore,
  trend:
    codeQualityStore.reviews.length > 1
      ? codeQualityStore.reviews[codeQualityStore.reviews.length - 1].trend
      : "stable",
  issues: codeQualityStore.criticalIssues.length,
}))

const webVitals = computed(() => performanceStore.webVitals)
const resourceMetrics = computed(() => performanceStore.resourceTiming)
const securityConfig = computed(() => securityStore.config)
const securityViolations = computed(() => securityStore.recentViolations)
const securityAudit = computed(() => securityStore.lastAudit)
const cacheStats = computed(() => cacheStore.stats)
const cacheStrategies = computed(() => cacheStore.config.strategies)
const cacheHealth = computed(() => cacheStore.cacheHealth)
const currentSession = computed(() => monitoringStore.currentSession)
const userMetrics = computed(() => monitoringStore.getSessionSummary())
const userErrors = computed(() => monitoringStore.currentSession?.errors || [])
const codeMetrics = computed(() => codeQualityStore.metrics)
const qualityGates = computed(() => codeQualityStore.qualityGates)
const qualityRecommendations = computed(() => codeQualityStore.generateRecommendations())

// Alertas críticas
const criticalAlerts = computed(() => {
  const alerts: any[] = []

  if (performanceMetrics.value.overallScore < 50) {
    alerts.push({
      id: "perf-critical",
      type: "error",
      title: "Performance Crítico",
      message: "El rendimiento del sistema está por debajo del 50%",
      action: "analyzePerformance",
    })
  }

  if (securityMetrics.value.violations > 0) {
    alerts.push({
      id: "security-violations",
      type: "warning",
      title: "Violaciones de Seguridad",
      message: `${securityMetrics.value.violations} violaciones críticas detectadas`,
      action: "runSecurityAudit",
    })
  }

  if (cacheMetrics.value.hitRate < 60) {
    alerts.push({
      id: "cache-poor",
      type: "info",
      title: "Cache Performance Bajo",
      message: "La efectividad del caché está por debajo del 60%",
      action: "optimizeCache",
    })
  }

  return alerts
})

// Métodos de utilidad
function getOverallStatusColor() {
  const scores = [
    performanceMetrics.value.overallScore,
    securityMetrics.value.score,
    cacheMetrics.value.hitRate,
    codeQualityMetrics.value.overallScore,
  ]

  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

  if (avgScore >= 80) return "success"
  if (avgScore >= 60) return "warning"
  return "error"
}

function getOverallStatusIcon() {
  const color = getOverallStatusColor()
  switch (color) {
    case "success":
      return "mdi-check-circle"
    case "warning":
      return "mdi-alert-circle"
    case "error":
      return "mdi-close-circle"
    default:
      return "mdi-help-circle"
  }
}

function getOverallStatusText() {
  const color = getOverallStatusColor()
  switch (color) {
    case "success":
      return "Sistema Óptimo"
    case "warning":
      return "Requiere Atención"
    case "error":
      return "Estado Crítico"
    default:
      return "Evaluando..."
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return "success"
  if (score >= 60) return "warning"
  return "error"
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

// Métodos de acción
async function analyzePerformance() {
  isLoading.value = true
  loadingMessage.value = "Analizando rendimiento..."

  try {
    await performanceStore.analyzePerformance()
    lastUpdate.value = new Date()
  } catch (error) {
    console.error("Error analizando performance:", error)
  } finally {
    isLoading.value = false
  }
}

async function optimizePerformance() {
  isLoading.value = true
  loadingMessage.value = "Optimizando rendimiento..."

  try {
    await performanceStore.optimizeResources()
    await analyzePerformance()
  } catch (error) {
    console.error("Error optimizando performance:", error)
  } finally {
    isLoading.value = false
  }
}

async function runSecurityAudit() {
  isLoading.value = true
  loadingMessage.value = "Ejecutando auditoría de seguridad..."

  try {
    await securityStore.performSecurityAudit()
    lastUpdate.value = new Date()
  } catch (error) {
    console.error("Error en auditoría de seguridad:", error)
  } finally {
    isLoading.value = false
  }
}

async function updateSecurityConfig(config: any) {
  securityStore.updateSecurityConfig(config)
  await runSecurityAudit()
}

async function clearCache(strategy?: string) {
  isLoading.value = true
  loadingMessage.value = "Limpiando caché..."

  try {
    await cacheStore.clear(strategy)
    lastUpdate.value = new Date()
  } catch (error) {
    console.error("Error limpiando caché:", error)
  } finally {
    isLoading.value = false
  }
}

async function optimizeCache() {
  isLoading.value = true
  loadingMessage.value = "Optimizando configuración de caché..."

  try {
    // Lógica de optimización automática
    const newConfig = {...cacheStore.config}

    // Ajustar TTL basado en hit rate
    if (cacheStore.stats.hitRate < 70) {
      Object.keys(newConfig.strategies).forEach((key) => {
        newConfig.strategies[key].ttl *= 1.5 // Aumentar TTL
      })
    }

    cacheStore.updateConfig(newConfig)
    lastUpdate.value = new Date()
  } catch (error) {
    console.error("Error optimizando caché:", error)
  } finally {
    isLoading.value = false
  }
}

function startMonitoring(userId?: string) {
  monitoringStore.initializeMonitoring(userId)
}

function exportMonitoringData() {
  const data = monitoringStore.getSessionSummary()
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `monitoring-data-${new Date().toISOString().split("T")[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function analyzeCodeQuality() {
  isLoading.value = true
  loadingMessage.value = "Analizando calidad de código..."

  try {
    await codeQualityStore.analyzeCodeQuality()
    lastUpdate.value = new Date()
  } catch (error) {
    console.error("Error analizando calidad:", error)
  } finally {
    isLoading.value = false
  }
}

async function fixCodeIssues() {
  isLoading.value = true
  loadingMessage.value = "Corrigiendo problemas automáticos..."

  try {
    await codeQualityStore.fixAutomaticIssues()
    await analyzeCodeQuality()
  } catch (error) {
    console.error("Error corrigiendo problemas:", error)
  } finally {
    isLoading.value = false
  }
}

// Métodos del speed dial
async function refreshAllMetrics() {
  isLoading.value = true
  loadingMessage.value = "Actualizando todas las métricas..."

  try {
    await Promise.allSettled([analyzePerformance(), runSecurityAudit(), analyzeCodeQuality()])
    lastUpdate.value = new Date()
  } catch (error) {
    console.error("Error actualizando métricas:", error)
  } finally {
    isLoading.value = false
  }
}

function exportReport() {
  const report = {
    timestamp: new Date().toISOString(),
    performance: performanceMetrics.value,
    security: {
      score: securityMetrics.value.score,
      violations: securityViolations.value.length,
      audit: securityAudit.value,
    },
    cache: {
      hitRate: cacheMetrics.value.hitRate,
      stats: cacheStats.value,
      health: cacheHealth.value,
    },
    monitoring: userMetrics.value,
    codeQuality: {
      score: codeQualityMetrics.value.overallScore,
      gates: qualityGates.value,
      recommendations: qualityRecommendations.value,
    },
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], {type: "application/json"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `fase2-report-${new Date().toISOString().split("T")[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function runAutoOptimizations() {
  isLoading.value = true
  loadingMessage.value = "Ejecutando optimizaciones automáticas..."

  try {
    // Optimizaciones automáticas
    await Promise.allSettled([optimizePerformance(), optimizeCache(), fixCodeIssues()])

    // Actualizar métricas después de optimizar
    await refreshAllMetrics()
  } catch (error) {
    console.error("Error en optimizaciones automáticas:", error)
  } finally {
    isLoading.value = false
  }
}

async function runEmergencyCheck() {
  isLoading.value = true
  loadingMessage.value = "Ejecutando verificación de emergencia..."

  try {
    // Verificar problemas críticos
    const criticalIssues = []

    if (performanceMetrics.value.overallScore < 30) {
      criticalIssues.push("Performance extremadamente bajo")
    }

    if (securityMetrics.value.violations > 5) {
      criticalIssues.push("Múltiples violaciones de seguridad")
    }

    if (criticalIssues.length > 0) {
      alert(`⚠️ PROBLEMAS CRÍTICOS DETECTADOS:\n\n${criticalIssues.join("\n")}`)
    } else {
      alert("✅ No se detectaron problemas críticos")
    }
  } catch (error) {
    console.error("Error en verificación de emergencia:", error)
  } finally {
    isLoading.value = false
  }
}

function dismissAlert(alertId: string) {
  // Lógica para descartar alerta
  console.log("Alert dismissed:", alertId)
}

function resolveAlert(alertId: string) {
  // Lógica para resolver alerta
  console.log("Alert resolved:", alertId)
}

// Lifecycle
onMounted(async () => {
  // Inicializar todos los sistemas
  await Promise.allSettled([
    performanceStore.initializePerformanceMonitoring(),
    securityStore.initializeSecurity(),
    cacheStore.initializeCache(),
    monitoringStore.initializeMonitoring(),
    codeQualityStore.analyzeCodeQuality(),
  ])

  // Configurar actualización automática cada 5 minutos
  updateInterval.value = window.setInterval(
    () => {
      refreshAllMetrics()
    },
    5 * 60 * 1000
  )

  lastUpdate.value = new Date()
})

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
  }
})

// Watchers
watch(activeTab, (newTab) => {
  // Actualizar métricas específicas cuando se cambia de tab
  switch (newTab) {
    case "performance":
      analyzePerformance()
      break
    case "security":
      runSecurityAudit()
      break
    case "quality":
      analyzeCodeQuality()
      break
  }
})
</script>

<style scoped>
.phase-2-dashboard {
  padding: 24px;
  background: rgb(var(--v-theme-background));
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 32px;
  padding: 24px;
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.dashboard-subtitle {
  margin: 8px 0 0 0;
  opacity: 0.7;
  font-size: 1.1rem;
}

.status-indicators {
  display: flex;
  gap: 12px;
  align-items: center;
}

.status-chip {
  font-weight: 600;
}

.main-metrics {
  margin-bottom: 32px;
}

.dashboard-tabs {
  margin-bottom: 24px;
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dashboard-content {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 600px;
}

.speed-dial-activator {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.loading-overlay {
  background: rgba(0, 0, 0, 0.8);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: white;
}

.loading-text {
  font-size: 1.1rem;
  margin: 0;
}

@media (max-width: 768px) {
  .phase-2-dashboard {
    padding: 16px;
  }

  .dashboard-header {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .dashboard-title {
    font-size: 1.5rem;
  }

  .status-indicators {
    flex-direction: column;
    width: 100%;
  }
}
</style>
