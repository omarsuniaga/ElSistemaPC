<!-- src/components/admin/OptimizationDashboard.vue -->
<template>
  <div class="optimization-dashboard">
    <ion-header>
      <ion-toolbar>
        <ion-title>Centro de Control de Optimización</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshMetrics" :disabled="loading">
            <ion-icon :icon="refresh" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="dashboard-container">
        
        <!-- Métricas de Rendimiento -->
        <ion-card class="metrics-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="speedometer" />
              Rendimiento en Tiempo Real
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="metrics-grid">
              <div class="metric-item">
                <div class="metric-value">{{ performanceReport?.summary.avgLoadTime.toFixed(0) }}ms</div>
                <div class="metric-label">Tiempo de Carga Promedio</div>
                <div class="metric-status" :class="getLoadTimeStatus(performanceReport?.summary.avgLoadTime)">
                  {{ getLoadTimeStatusText(performanceReport?.summary.avgLoadTime) }}
                </div>
              </div>
              
              <div class="metric-item">
                <div class="metric-value">{{ performanceReport?.summary.avgInteractionTime.toFixed(0) }}ms</div>
                <div class="metric-label">Tiempo de Interacción</div>
                <div class="metric-status" :class="getInteractionStatus(performanceReport?.summary.avgInteractionTime)">
                  {{ getInteractionStatusText(performanceReport?.summary.avgInteractionTime) }}
                </div>
              </div>
              
              <div class="metric-item">
                <div class="metric-value">{{ formatBytes(performanceReport?.summary.memoryUsage || 0) }}</div>
                <div class="metric-label">Uso de Memoria</div>
                <div class="metric-status" :class="getMemoryStatus(performanceReport?.summary.memoryUsage)">
                  {{ getMemoryStatusText(performanceReport?.summary.memoryUsage) }}
                </div>
              </div>
              
              <div class="metric-item">
                <div class="metric-value">{{ performanceReport?.summary.componentsTracked }}</div>
                <div class="metric-label">Componentes Monitoreados</div>
                <div class="metric-status good">Activo</div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Estado del Cache -->
        <ion-card class="cache-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="layersOutline" />
              Sistema de Cache
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="cache-stats">
              <div class="cache-metric">
                <span class="cache-label">Entradas en Cache:</span>
                <span class="cache-value">{{ cacheStats?.totalKeys }}</span>
              </div>
              <div class="cache-metric">
                <span class="cache-label">Tasa de Aciertos:</span>
                <span class="cache-value">{{ (cacheStats?.hitRate * 100).toFixed(1) }}%</span>
                <div class="cache-progress">
                  <div 
                    class="cache-progress-bar" 
                    :style="{ width: `${cacheStats?.hitRate * 100}%` }"
                  ></div>
                </div>
              </div>
              <div class="cache-metric">
                <span class="cache-label">Uso de Memoria:</span>
                <span class="cache-value">{{ formatBytes(cacheStats?.memoryUsage || 0) }}</span>
              </div>
              <div class="cache-actions">
                <ion-button size="small" @click="clearCache" color="warning">
                  <ion-icon :icon="trashOutline" slot="start" />
                  Limpiar Cache
                </ion-button>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Issues Críticos -->
        <ion-card v-if="criticalIssues.length > 0" class="issues-card critical">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="warningOutline" />
              Issues Críticos
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item v-for="issue in criticalIssues" :key="issue">
                <ion-icon :icon="alertCircleOutline" slot="start" color="danger" />
                <ion-label>{{ issue }}</ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Recomendaciones -->
        <ion-card v-if="recommendations.length > 0" class="recommendations-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="bulbOutline" />
              Recomendaciones de Optimización
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item v-for="recommendation in recommendations" :key="recommendation">
                <ion-icon :icon="checkmarkCircleOutline" slot="start" color="success" />
                <ion-label>{{ recommendation }}</ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Logs del Sistema -->
        <ion-card class="logs-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="documentTextOutline" />
              Logs del Sistema
            </ion-card-title>
            <div class="log-filters">
              <ion-select v-model="selectedLogLevel" placeholder="Filtrar por nivel">
                <ion-select-option value="">Todos</ion-select-option>
                <ion-select-option value="error">Errores</ion-select-option>
                <ion-select-option value="warn">Advertencias</ion-select-option>
                <ion-select-option value="info">Info</ion-select-option>
                <ion-select-option value="debug">Debug</ion-select-option>
              </ion-select>
            </div>
          </ion-card-header>
          <ion-card-content>
            <div class="logs-container">
              <div 
                v-for="log in filteredLogs" 
                :key="`${log.timestamp}-${log.module}-${log.message}`"
                :class="['log-entry', `log-${log.level}`]"
              >
                <div class="log-header">
                  <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                  <span class="log-level">{{ log.level.toUpperCase() }}</span>
                  <span class="log-module">{{ log.module }}</span>
                </div>
                <div class="log-message">{{ log.message }}</div>
                <div v-if="log.data" class="log-data">
                  <pre>{{ JSON.stringify(log.data, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Controles de Optimización -->
        <ion-card class="controls-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="settingsOutline" />
              Controles de Optimización
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="controls-grid">
              <ion-button 
                @click="preloadComponents" 
                :disabled="loading"
                color="primary"
                size="default"
              >
                <ion-icon :icon="cloudDownloadOutline" slot="start" />
                Precargar Componentes
              </ion-button>
              
              <ion-button 
                @click="optimizeImages" 
                :disabled="loading"
                color="secondary"
                size="default"
              >
                <ion-icon :icon="imageOutline" slot="start" />
                Optimizar Imágenes
              </ion-button>
              
              <ion-button 
                @click="analyzeBundle" 
                :disabled="loading"
                color="tertiary"
                size="default"
              >
                <ion-icon :icon="analyticsOutline" slot="start" />
                Analizar Bundle
              </ion-button>
              
              <ion-button 
                @click="exportReport" 
                :disabled="loading"
                color="success"
                size="default"
              >
                <ion-icon :icon="downloadOutline" slot="start" />
                Exportar Reporte
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

      </div>
    </ion-content>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonButton, IonButtons, IonIcon,
  IonList, IonItem, IonLabel, IonSelect, IonSelectOption
} from '@ionic/vue'
import {
  speedometer, refresh, layersOutline, warningOutline, alertCircleOutline,
  bulbOutline, checkmarkCircleOutline, documentTextOutline, settingsOutline,
  cloudDownloadOutline, imageOutline, analyticsOutline, downloadOutline,
  trashOutline
} from 'ionicons/icons'

import { performanceMonitor, type PerformanceReport } from '@/utils/performance/monitor'
import { smartCache, type CacheStats } from '@/utils/cache/smartCache'
import { logger } from '@/utils/logging/logger'
import { lazyLoader } from '@/utils/performance/lazyLoader'
import { imageOptimizer } from '@/utils/optimization/imageOptimizer'

// Estados reactivos
const loading = ref(false)
const performanceReport = ref<PerformanceReport | null>(null)
const cacheStats = ref<CacheStats | null>(null)
const selectedLogLevel = ref('')
const updateInterval = ref<number | null>(null)

// Datos computados
const criticalIssues = computed(() => performanceReport.value?.criticalIssues || [])
const recommendations = computed(() => performanceReport.value?.recommendations || [])

const filteredLogs = computed(() => {
  const logs = logger.getLogs(selectedLogLevel.value as any)
  return logs.slice(-50).reverse() // Últimos 50 logs, más recientes primero
})

// Funciones de utilidad
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

// Funciones de estado
function getLoadTimeStatus(time?: number): string {
  if (!time) return 'unknown'
  if (time < 1000) return 'excellent'
  if (time < 3000) return 'good'
  if (time < 5000) return 'warning'
  return 'critical'
}

function getLoadTimeStatusText(time?: number): string {
  if (!time) return 'Desconocido'
  if (time < 1000) return 'Excelente'
  if (time < 3000) return 'Bueno'
  if (time < 5000) return 'Regular'
  return 'Crítico'
}

function getInteractionStatus(time?: number): string {
  if (!time) return 'unknown'
  if (time < 100) return 'excellent'
  if (time < 300) return 'good'
  if (time < 500) return 'warning'
  return 'critical'
}

function getInteractionStatusText(time?: number): string {
  if (!time) return 'Desconocido'
  if (time < 100) return 'Excelente'
  if (time < 300) return 'Bueno'
  if (time < 500) return 'Regular'
  return 'Crítico'
}

function getMemoryStatus(memory?: number): string {
  if (!memory) return 'unknown'
  const mb = memory / (1024 * 1024)
  if (mb < 50) return 'excellent'
  if (mb < 100) return 'good'
  if (mb < 200) return 'warning'
  return 'critical'
}

function getMemoryStatusText(memory?: number): string {
  if (!memory) return 'Desconocido'
  const mb = memory / (1024 * 1024)
  if (mb < 50) return 'Óptimo'
  if (mb < 100) return 'Bueno'
  if (mb < 200) return 'Alto'
  return 'Crítico'
}

// Funciones principales
async function refreshMetrics() {
  loading.value = true
  try {
    performanceReport.value = performanceMonitor.generateReport()
    cacheStats.value = smartCache.getStats()
    logger.info('OPTIMIZATION_DASHBOARD', 'Métricas actualizadas')
  } catch (error) {
    logger.error('OPTIMIZATION_DASHBOARD', 'Error actualizando métricas', error)
  } finally {
    loading.value = false
  }
}

async function clearCache() {
  try {
    smartCache.clear()
    imageOptimizer.clearCache()
    await refreshMetrics()
    logger.info('OPTIMIZATION_DASHBOARD', 'Cache limpiado')
  } catch (error) {
    logger.error('OPTIMIZATION_DASHBOARD', 'Error limpiando cache', error)
  }
}

async function preloadComponents() {
  loading.value = true
  try {
    await lazyLoader.preloadCritical([
      () => import('@/views/StudentsView.vue'),
      () => import('@/views/TeachersView.vue'),
      () => import('@/views/HomeView.vue'),
      () => import('@/views/AttendanceView.vue')
    ])
    logger.info('OPTIMIZATION_DASHBOARD', 'Componentes precargados')
  } catch (error) {
    logger.error('OPTIMIZATION_DASHBOARD', 'Error precargando componentes', error)
  } finally {
    loading.value = false
  }
}

async function optimizeImages() {
  loading.value = true
  try {
    // Simular optimización de imágenes existentes
    const images = document.querySelectorAll('img')
    let optimizedCount = 0
    
    for (const img of Array.from(images)) {
      if (img.src && !img.src.startsWith('data:')) {
        try {
          await imageOptimizer.optimizeImage(img.src, {
            quality: 0.8,
            maxWidth: 1200,
            format: 'auto'
          })
          optimizedCount++
        } catch (error) {
          // Continuar con la siguiente imagen
        }
      }
    }
    
    logger.info('OPTIMIZATION_DASHBOARD', `${optimizedCount} imágenes optimizadas`)
  } catch (error) {
    logger.error('OPTIMIZATION_DASHBOARD', 'Error optimizando imágenes', error)
  } finally {
    loading.value = false
  }
}

async function analyzeBundle() {
  loading.value = true
  try {
    // Simular análisis de bundle
    const modules = performance.getEntriesByType('navigation')
    const resources = performance.getEntriesByType('resource')
    
    const analysis = {
      totalModules: resources.length,
      largestModules: resources
        .filter(r => r.transferSize && r.transferSize > 50000)
        .map(r => ({ name: r.name, size: r.transferSize }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 10)
    }
    
    logger.info('OPTIMIZATION_DASHBOARD', 'Análisis de bundle completado', analysis)
  } catch (error) {
    logger.error('OPTIMIZATION_DASHBOARD', 'Error analizando bundle', error)
  } finally {
    loading.value = false
  }
}

async function exportReport() {
  try {
    const report = {
      timestamp: new Date().toISOString(),
      performance: performanceReport.value,
      cache: cacheStats.value,
      logs: logger.getLogs().slice(-100) // Últimos 100 logs
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `optimization-report-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    logger.info('OPTIMIZATION_DASHBOARD', 'Reporte exportado')
  } catch (error) {
    logger.error('OPTIMIZATION_DASHBOARD', 'Error exportando reporte', error)
  }
}

// Lifecycle
onMounted(() => {
  refreshMetrics()
  
  // Actualizar métricas cada 30 segundos
  updateInterval.value = window.setInterval(refreshMetrics, 30000)
})

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
  }
})
</script>

<style scoped>
.optimization-dashboard {
  height: 100vh;
}

.dashboard-container {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.metrics-card {
  margin-bottom: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.metric-item {
  text-align: center;
  padding: 16px;
  border: 1px solid var(--ion-color-light);
  border-radius: 8px;
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--ion-color-primary);
}

.metric-label {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin: 8px 0;
}

.metric-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.metric-status.excellent {
  background: var(--ion-color-success-tint);
  color: var(--ion-color-success);
}

.metric-status.good {
  background: var(--ion-color-primary-tint);
  color: var(--ion-color-primary);
}

.metric-status.warning {
  background: var(--ion-color-warning-tint);
  color: var(--ion-color-warning);
}

.metric-status.critical {
  background: var(--ion-color-danger-tint);
  color: var(--ion-color-danger);
}

.cache-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cache-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cache-progress {
  width: 100px;
  height: 4px;
  background: var(--ion-color-light);
  border-radius: 2px;
  overflow: hidden;
}

.cache-progress-bar {
  height: 100%;
  background: var(--ion-color-success);
  transition: width 0.3s ease;
}

.cache-actions {
  margin-top: 16px;
}

.issues-card.critical {
  border-left: 4px solid var(--ion-color-danger);
}

.recommendations-card {
  border-left: 4px solid var(--ion-color-success);
}

.log-filters {
  margin-left: auto;
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--ion-color-light);
  border-radius: 4px;
  padding: 8px;
}

.log-entry {
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
}

.log-entry.log-error {
  background: var(--ion-color-danger-tint);
  border-left: 3px solid var(--ion-color-danger);
}

.log-entry.log-warn {
  background: var(--ion-color-warning-tint);
  border-left: 3px solid var(--ion-color-warning);
}

.log-entry.log-info {
  background: var(--ion-color-primary-tint);
  border-left: 3px solid var(--ion-color-primary);
}

.log-entry.log-debug {
  background: var(--ion-color-light);
  border-left: 3px solid var(--ion-color-medium);
}

.log-header {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.log-time {
  color: var(--ion-color-medium);
}

.log-level {
  font-weight: bold;
  min-width: 50px;
}

.log-module {
  color: var(--ion-color-primary);
  font-weight: bold;
}

.log-message {
  margin-bottom: 4px;
}

.log-data {
  background: rgba(0, 0, 0, 0.1);
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
}

.log-data pre {
  margin: 0;
  font-size: 0.8rem;
  white-space: pre-wrap;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 16px;
}
</style>
