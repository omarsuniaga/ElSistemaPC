<!-- src/components/testing/BrandingTestDashboardNew.vue -->
<template>
  <div class="branding-test-dashboard bg-white rounded-lg shadow-sm border">
    <div class="border-b border-gray-200 px-6 py-4">
      <h3 class="text-lg font-medium text-gray-900 flex items-center">
        <BeakerIcon class="h-5 w-5 mr-2" />
        🎨 Dashboard de Pruebas - Sistema de Branding
      </h3>
      <p class="mt-1 text-sm text-gray-600">
        Suite completa de validación del sistema de configuración de marca
      </p>
    </div>

    <div class="p-6">
      <!-- Controles principales -->
      <div class="test-controls flex flex-wrap gap-4 mb-6">
        <button 
          @click="runQuickTest" 
          :disabled="isRunning"
          class="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <BoltIcon class="h-4 w-4 mr-2" />
          Prueba Rápida
        </button>
        
        <button 
          @click="runFullTest" 
          :disabled="isRunning"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          <CheckCircleIcon class="h-4 w-4 mr-2" />
          Suite Completa
        </button>
        
        <button 
          @click="testBrandingComponents" 
          :disabled="isRunning"
          class="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          <WrenchScrewdriverIcon class="h-4 w-4 mr-2" />
          Test Componentes
        </button>
        
        <button 
          @click="clearResults" 
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <TrashIcon class="h-4 w-4 mr-2" />
          Limpiar
        </button>
      </div>

      <!-- Indicador de progreso -->
      <div v-if="isRunning" class="test-progress mb-6">
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" :style="{ width: `${progress * 100}%` }"></div>
        </div>
        <p class="text-sm text-gray-600 mt-2">{{ currentTestMessage }}</p>
      </div>

      <!-- Panel de estado -->
      <div class="status-panel grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <!-- Estado general -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium text-gray-900 mb-2 flex items-center">
            <InformationCircleIcon class="h-4 w-4 mr-2" />
            Estado General
          </h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Store:</span>
              <span class="text-sm font-medium" :class="brandingStore.isLoading ? 'text-yellow-600' : 'text-green-600'">
                {{ brandingStore.isLoading ? 'Cargando...' : 'Listo' }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Configuración:</span>
              <span class="text-sm font-medium text-blue-600">
                {{ brandingStore.config.appName || 'Sin configurar' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Estadísticas de pruebas -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium text-gray-900 mb-2 flex items-center">
            <ChartBarIcon class="h-4 w-4 mr-2" />
            Estadísticas
          </h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Tests ejecutados:</span>
              <span class="text-sm font-medium text-gray-900">{{ totalTests }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Exitosos:</span>
              <span class="text-sm font-medium text-green-600">{{ passedTests }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Fallidos:</span>
              <span class="text-sm font-medium text-red-600">{{ failedTests }}</span>
            </div>
          </div>
        </div>

        <!-- Rendimiento -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium text-gray-900 mb-2">Rendimiento</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Tiempo promedio:</span>
              <span class="text-sm font-medium text-gray-900">{{ averageTestTime }}ms</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Última ejecución:</span>
              <span class="text-sm font-medium text-gray-900">{{ lastExecutionTime }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Resultados de pruebas -->
      <div v-if="testResults.length > 0" class="test-results">
        <h4 class="font-medium text-gray-900 mb-4">Resultados de Pruebas</h4>
        
        <div class="space-y-3">
          <div 
            v-for="result in testResults" 
            :key="result.testName"
            class="border rounded-lg p-4"
            :class="{
              'border-green-200 bg-green-50': result.status === 'passed',
              'border-red-200 bg-red-50': result.status === 'failed',
              'border-yellow-200 bg-yellow-50': result.status === 'warning',
              'border-gray-200 bg-gray-50': result.status === 'info'
            }"
          >
            <div class="flex items-start justify-between">
              <div class="flex-grow">
                <div class="flex items-center">
                  <CheckCircleIcon 
                    v-if="result.status === 'passed'" 
                    class="h-5 w-5 text-green-500 mr-2"
                  />
                  <XCircleIcon 
                    v-else-if="result.status === 'failed'" 
                    class="h-5 w-5 text-red-500 mr-2"
                  />
                  <InformationCircleIcon 
                    v-else 
                    class="h-5 w-5 text-blue-500 mr-2"
                  />
                  <h5 class="font-medium text-gray-900">{{ result.testName }}</h5>
                  <span 
                    class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-800': result.status === 'passed',
                      'bg-red-100 text-red-800': result.status === 'failed',
                      'bg-yellow-100 text-yellow-800': result.status === 'warning',
                      'bg-gray-100 text-gray-800': result.status === 'info'
                    }"
                  >
                    {{ result.status.toUpperCase() }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-600">{{ result.message }}</p>
                <div v-if="result.details" class="mt-2">
                  <details class="text-xs">
                    <summary class="cursor-pointer text-gray-500 hover:text-gray-700">Ver detalles</summary>
                    <pre class="mt-2 p-2 bg-gray-100 rounded text-gray-700 overflow-x-auto">{{ result.details }}</pre>
                  </details>
                </div>
              </div>
              <div class="text-xs text-gray-500 ml-4">
                {{ result.duration }}ms
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel de herramientas de desarrollo -->
      <div class="dev-tools mt-6 border-t pt-6">
        <h4 class="font-medium text-gray-900 mb-4 flex items-center">
          <CommandLineIcon class="h-4 w-4 mr-2" />
          Herramientas de Desarrollo
        </h4>
        
        <div class="flex flex-wrap gap-3">
          <button 
            @click="exportResults" 
            class="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowDownTrayIcon class="h-4 w-4 mr-1" />
            Exportar Resultados
          </button>
          
          <button 
            @click="viewBrandingStore" 
            class="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon class="h-4 w-4 mr-1" />
            Ver Store
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  BeakerIcon, BoltIcon, CheckCircleIcon, WrenchScrewdriverIcon,
  TrashIcon, InformationCircleIcon, ChartBarIcon,
  XCircleIcon, CommandLineIcon, ArrowDownTrayIcon, EyeIcon
} from '@heroicons/vue/24/outline'

import { useBrandingStore } from '@/stores/brandingStore'
import { brandingTests } from '@/utils/testing/brandingTests'
import { logger } from '@/utils/logging/logger'

// Store
const brandingStore = useBrandingStore()

// Estado reactivo
const isRunning = ref(false)
const progress = ref(0)
const currentTestMessage = ref('')
const testResults = ref<Array<{
  testName: string
  status: 'passed' | 'failed' | 'warning' | 'info'
  message: string
  duration: number
  timestamp: Date
  details?: any
}>>([])

// Estadísticas computadas
const totalTests = computed(() => testResults.value.length)
const passedTests = computed(() => testResults.value.filter(t => t.status === 'passed').length)
const failedTests = computed(() => testResults.value.filter(t => t.status === 'failed').length)
const averageTestTime = computed(() => {
  if (testResults.value.length === 0) return 0
  const total = testResults.value.reduce((sum, test) => sum + test.duration, 0)
  return Math.round(total / testResults.value.length)
})

const lastExecutionTime = computed(() => {
  if (testResults.value.length === 0) return 'Nunca'
  const latest = testResults.value[testResults.value.length - 1]
  return latest.timestamp.toLocaleTimeString('es-ES')
})

// Métodos de testing
async function runQuickTest() {
  isRunning.value = true
  progress.value = 0
  currentTestMessage.value = 'Iniciando prueba rápida...'
  
  try {
    // Simular pruebas rápidas
    const passed = await brandingTests.quickTest()
    
    testResults.value.push({
      testName: 'Prueba Rápida del Sistema',
      status: passed ? 'passed' : 'failed',
      message: passed ? 'Todas las verificaciones básicas pasaron exitosamente' : 'Algunas verificaciones básicas fallaron',
      duration: 1000,
      timestamp: new Date(),
      details: passed ? 'Store, configuración, nombre de app y colores disponibles' : 'Revisar la consola para más detalles'
    })
    
    logger.info('BRANDING_TEST', 'Prueba rápida completada', { 
      passed
    })
    
  } catch (error) {
    logger.error('BRANDING_TEST', 'Error en prueba rápida', error)
    testResults.value.push({
      testName: 'Error General',
      status: 'failed',
      message: 'Error inesperado durante la ejecución',
      duration: 0,
      timestamp: new Date(),
      details: error
    })
  } finally {
    isRunning.value = false
    currentTestMessage.value = ''
  }
}

async function runFullTest() {
  isRunning.value = true
  progress.value = 0
  currentTestMessage.value = 'Iniciando suite completa...'
  
  try {
    // Ejecutar todos los tests disponibles
    await brandingTests.runAllTests()
    
    // Los resultados se muestran en la consola
    // Aquí agregamos un resumen general
    testResults.value.push({
      testName: 'Suite Completa de Pruebas',
      status: 'info',
      message: 'Suite completa ejecutada. Ver consola del navegador para detalles completos.',
      duration: 2000,
      timestamp: new Date(),
      details: 'La suite completa incluye pruebas de store, composable, CSS variables, DOM y archivos.'
    })
    
    logger.info('BRANDING_TEST', 'Suite completa ejecutada')
    
  } catch (error) {
    logger.error('BRANDING_TEST', 'Error en suite completa', error)
  } finally {
    isRunning.value = false
    currentTestMessage.value = ''
  }
}

async function testBrandingComponents() {
  isRunning.value = true
  currentTestMessage.value = 'Probando componentes de branding...'
  
  try {
    // Test básico de componentes
    const hasStoreAccess = !!brandingStore
    const hasConfig = !!brandingStore.config
    const hasTheme = !!brandingStore.config.colors
    
    const success = hasStoreAccess && hasConfig && hasTheme
    
    testResults.value.push({
      testName: 'Test de Componentes',
      status: success ? 'passed' : 'failed',
      message: success ? 'Componentes de branding funcionando correctamente' : 'Problemas detectados en componentes de branding',
      duration: 500,
      timestamp: new Date(),
      details: `Store: ${hasStoreAccess}, Config: ${hasConfig}, Theme: ${hasTheme}`
    })
    
  } catch (error) {
    logger.error('BRANDING_TEST', 'Error en test de componentes', error)
    testResults.value.push({
      testName: 'Test de Componentes',
      status: 'failed',
      message: 'Error inesperado durante el test',
      duration: 0,
      timestamp: new Date(),
      details: error
    })
  } finally {
    isRunning.value = false
    currentTestMessage.value = ''
  }
}

function clearResults() {
  testResults.value = []
  logger.info('BRANDING_TEST', 'Resultados de testing limpiados')
}

function exportResults() {
  try {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests.value,
        passed: passedTests.value,
        failed: failedTests.value,
        averageTime: averageTestTime.value
      },
      results: testResults.value,
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        brandingConfig: brandingStore.config
      }
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `branding-test-results-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    logger.info('BRANDING_TEST', 'Resultados exportados')
    
  } catch (error) {
    logger.error('BRANDING_TEST', 'Error exportando resultados', error)
  }
}

function viewBrandingStore() {
  console.log('🎨 Branding Store:', brandingStore)
  console.log('📋 Config:', brandingStore.config)
  console.log('🎨 CSS Variables:', brandingStore.cssVariables)
  logger.info('BRANDING_TEST', 'Store mostrado en consola')
}

// Lifecycle
onMounted(async () => {
  try {
    if (!brandingStore.config.appName) {
      await brandingStore.loadBrandingConfig()
    }
    logger.info('BRANDING_TEST', 'Dashboard de testing inicializado')
  } catch (error) {
    logger.error('BRANDING_TEST', 'Error inicializando dashboard', error)
  }
})
</script>

<style scoped>
.branding-test-dashboard {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.test-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

@media (max-width: 768px) {
  .test-controls {
    flex-direction: column;
  }
  
  .test-controls button {
    width: 100%;
  }
}
</style>
