<!-- src/components/testing/BrandingTestDashboard.vue -->
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
      <div class="test-controls flex space-x-4 mb-6">
        <button
          :disabled="isRunning"
          class="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          @click="runQuickTest"
        >
          <BoltIcon class="h-4 w-4 mr-2" />
          Prueba Rápida
        </button>

        <button
          :disabled="isRunning"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          @click="runFullTest"
        >
          <CheckCircleIcon class="h-4 w-4 mr-2" />
          Suite Completa
        </button>

        <button
          :disabled="isRunning"
          class="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          @click="testBrandingComponents"
        >
          <WrenchScrewdriverIcon class="h-4 w-4 mr-2" />
          Test Componentes
        </button>

        <button
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          @click="clearResults"
        >
          <TrashIcon class="h-4 w-4 mr-2" />
          Limpiar
        </button>
      </div>

      <!-- Indicador de progreso -->
      <div v-if="isRunning" class="test-progress mb-6">
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{width: `${progress * 100}%`}"
          />
        </div>
        <p class="text-sm text-gray-600 mt-2">{{ currentTestMessage }}</p>
      </div>

      <!-- Estado actual del sistema -->
      <div class="system-status bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div class="status-title flex items-center gap-2 mb-4 text-lg font-semibold">
          <InformationCircleIcon class="h-5 w-5 text-blue-500" />
          Estado Actual del Sistema
        </div>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">Store Inicializado:</span>
            <span
              :class="
                storeStatus.store
                  ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                  : 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs'
              "
            >
              {{ storeStatus.store ? "SÍ" : "NO" }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">Configuración Cargada:</span>
            <span
              :class="
                storeStatus.config
                  ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                  : 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs'
              "
            >
              {{ storeStatus.config ? "SÍ" : "NO" }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">App Name:</span>
            <span class="status-value">{{ brandingStore.appTitle || "N/A" }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Color Primario:</span>
            <div class="color-preview">
              <div class="color-swatch" :style="{backgroundColor: brandingStore.primaryColor}" />
              <span>{{ brandingStore.primaryColor || "N/A" }}</span>
            </div>
          </div>
          <div class="status-item">
            <span class="status-label">Logo URL:</span>
            <span class="status-value">{{ brandingStore.logoUrl || "N/A" }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">CSS Variables:</span>
            <span
              :class="
                cssVariablesCount > 0
                  ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                  : 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs'
              "
            >
              {{ cssVariablesCount }} variables
            </span>
          </div>
        </div>
      </div>

      <!-- Resultados de las pruebas -->
      <div v-if="testResults.length > 0" class="test-results">
        <h3>📊 Resultados de Pruebas</h3>

        <!-- Resumen -->
        <div class="results-summary flex items-center gap-2 mb-4">
          <ChartBarIcon class="h-5 w-5 text-blue-500" />
          <span
            :class="
              summaryColor === 'success'
                ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                : summaryColor === 'warning'
                  ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs'
                  : 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs'
            "
          >
            {{ passedTests }}/{{ testResults.length }} Exitosas ({{ successRate }}%)
          </span>
        </div>
        <!-- Lista de resultados -->
        <ul class="results-list divide-y divide-gray-200">
          <li v-for="(result, index) in testResults" :key="index" class="flex items-center py-2">
            <span class="mr-2">
              <CheckCircleIcon v-if="result.status === 'PASS'" class="h-5 w-5 text-green-500" />
              <XCircleIcon v-else class="h-5 w-5 text-red-500" />
            </span>
            <div class="flex-1">
              <div class="font-semibold">{{ result.test }}</div>
              <div v-if="result.details" class="text-xs text-gray-500">{{ result.details }}</div>
            </div>
            <span
              :class="
                result.status === 'PASS'
                  ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs ml-2'
                  : 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs ml-2'
              "
            >
              {{ result.status }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Vista previa de componentes dinámicos -->
      <div class="component-preview">
        <h3>🎨 Vista Previa de Componentes</h3>

        <!-- Header dinámico -->
        <div class="preview-section">
          <h4>Header Dinámico</h4>
          <div class="mock-header" :style="headerStyles">
            <img
              v-if="brandingStore.logoUrl"
              :src="brandingStore.logoUrl"
              alt="Logo"
              class="mock-logo"
            />
            <div class="mock-title">
              <h2>{{ brandingStore.appTitle }}</h2>
              <p>{{ brandingStore.config.tagline }}</p>
            </div>
          </div>
        </div>

        <!-- Colores de marca -->
        <div class="preview-section">
          <h4>Paleta de Colores</h4>
          <div class="color-palette">
            <div
              v-for="(color, name) in brandingStore.config.colors"
              :key="name"
              class="color-item"
            >
              <div class="color-swatch" :style="{backgroundColor: color}" />
              <span class="color-name">{{ name }}</span>
              <span class="color-value">{{ color }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Herramientas de debug -->
      <div class="debug-tools">
        <h3>🔧 Herramientas de Debug</h3>
        <div class="debug-actions flex gap-2 flex-wrap">
          <button
            class="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            @click="openConsoleTools"
          >
            <CommandLineIcon class="h-4 w-4 mr-1" />
            Consola Dev
          </button>
          <button
            class="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            @click="exportTestResults"
          >
            <ArrowDownTrayIcon class="h-4 w-4 mr-1" />
            Exportar Resultados
          </button>
          <button
            class="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            @click="viewBrandingStore"
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
import {ref, computed, onMounted} from "vue"
import {
  BeakerIcon,
  BoltIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  TrashIcon,
  InformationCircleIcon,
  ChartBarIcon,
  XCircleIcon,
  CommandLineIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from "@heroicons/vue/24/outline"

import {useBrandingStore} from "@/stores/brandingStore"
import {brandingTests} from "@/utils/testing/brandingTests"
import {logger} from "@/utils/logging/logger"

// Store
const brandingStore = useBrandingStore()

// Estado local
const isRunning = ref(false)
const progress = ref(0)
const currentTestMessage = ref("")
const testResults = ref<Array<{test: string; status: "PASS" | "FAIL"; details?: string}>>([])

// Estado del sistema
const storeStatus = computed(() => ({
  store: !!brandingStore,
  config: !!brandingStore.config.appName,
}))

const cssVariablesCount = computed(() => Object.keys(brandingStore.cssVariables).length)

// Estadísticas de pruebas
const passedTests = computed(() => testResults.value.filter((r) => r.status === "PASS").length)

const successRate = computed(() =>
  testResults.value.length > 0
    ? Math.round((passedTests.value / testResults.value.length) * 100)
    : 0
)

const summaryColor = computed(() => {
  if (successRate.value >= 90) return "success"
  if (successRate.value >= 70) return "warning"
  return "danger"
})

// Estilos para preview
const headerStyles = computed(() => ({
  backgroundColor: brandingStore.primaryColor,
  color: "white",
  padding: "16px",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
}))

// Métodos
async function runQuickTest() {
  isRunning.value = true
  currentTestMessage.value = "Ejecutando prueba rápida..."
  progress.value = 0.3

  try {
    const result = await brandingTests.quickTest()

    testResults.value = [
      {
        test: "Prueba Rápida del Sistema",
        status: result ? "PASS" : "FAIL",
        details: result
          ? "Todos los componentes básicos funcionan"
          : "Fallos detectados en componentes básicos",
      },
    ]

    progress.value = 1
    currentTestMessage.value = "Prueba rápida completada"
  } catch (error) {
    logger.error("BRANDING_TEST_DASHBOARD", "Error en prueba rápida", error)
    testResults.value = [
      {
        test: "Prueba Rápida del Sistema",
        status: "FAIL",
        details: `Error: ${error}`,
      },
    ]
  } finally {
    setTimeout(() => {
      isRunning.value = false
      currentTestMessage.value = ""
      progress.value = 0
    }, 1000)
  }
}

async function runFullTest() {
  isRunning.value = true
  currentTestMessage.value = "Ejecutando suite completa de pruebas..."
  progress.value = 0.1

  try {
    // Capturar resultados de la suite completa
    await brandingTests.runAllTests()

    // Obtener resultados del window object
    const results = (window as any).brandingTestResults || []
    testResults.value = results

    progress.value = 1
    currentTestMessage.value = "Suite completa finalizada"
  } catch (error) {
    logger.error("BRANDING_TEST_DASHBOARD", "Error en suite completa", error)
    testResults.value = [
      {
        test: "Suite Completa",
        status: "FAIL",
        details: `Error ejecutando suite: ${error}`,
      },
    ]
  } finally {
    setTimeout(() => {
      isRunning.value = false
      currentTestMessage.value = ""
      progress.value = 0
    }, 1000)
  }
}

function testBrandingComponents() {
  isRunning.value = true
  currentTestMessage.value = "Probando componentes de branding..."
  progress.value = 0.5

  const componentTests = []

  // Test DynamicHeader
  if (document.querySelector(".dynamic-header") || document.querySelector('[class*="header"]')) {
    componentTests.push({
      test: "DynamicHeader Component",
      status: "PASS" as const,
      details: "Componente encontrado en DOM",
    })
  } else {
    componentTests.push({
      test: "DynamicHeader Component",
      status: "FAIL" as const,
      details: "Componente no encontrado en DOM",
    })
  }

  // Test variables CSS aplicadas
  const root = document.documentElement
  const primaryVar = getComputedStyle(root).getPropertyValue("--ion-color-primary")

  if (primaryVar) {
    componentTests.push({
      test: "CSS Variables Applied",
      status: "PASS" as const,
      details: `Primary color: ${primaryVar.trim()}`,
    })
  } else {
    componentTests.push({
      test: "CSS Variables Applied",
      status: "FAIL" as const,
      details: "Variables CSS no encontradas",
    })
  }

  // Test composable availability
  try {
    const {appTitle} = useBranding()
    componentTests.push({
      test: "Branding Composable",
      status: "PASS" as const,
      details: `Composable funcional, title: ${appTitle.value}`,
    })
  } catch (error) {
    componentTests.push({
      test: "Branding Composable",
      status: "FAIL" as const,
      details: "Error accediendo al composable",
    })
  }

  testResults.value = componentTests
  progress.value = 1

  setTimeout(() => {
    isRunning.value = false
    currentTestMessage.value = ""
    progress.value = 0
  }, 800)
}

function clearResults() {
  testResults.value = []
}

function openConsoleTools() {
  console.group("🎨 Branding Debug Tools - Activadas")
  console.log("Usa estas funciones en la consola:")
  console.log("• testBranding() - Suite completa")
  console.log("• quickTestBranding() - Prueba rápida")
  console.log("• window.brandingTestResults - Últimos resultados")
  console.log("• debugBranding() - Ver todas las herramientas")
  console.groupEnd()

  // Ejecutar debug automáticamente
  if ((window as any).debugBranding) {
    ;(window as any).debugBranding()
  }
}

function exportTestResults() {
  if (testResults.value.length === 0) {
    alert("No hay resultados para exportar")
    return
  }

  const data = {
    timestamp: new Date().toISOString(),
    systemStatus: storeStatus.value,
    cssVariablesCount: cssVariablesCount.value,
    testResults: testResults.value,
    summary: {
      total: testResults.value.length,
      passed: passedTests.value,
      failed: testResults.value.length - passedTests.value,
      successRate: successRate.value,
    },
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `branding-test-results-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function viewBrandingStore() {
  console.group("🎨 Branding Store State")
  console.log("Config:", brandingStore.config)
  console.log("CSS Variables:", brandingStore.cssVariables)
  console.log("App Title:", brandingStore.appTitle)
  console.log("Primary Color:", brandingStore.primaryColor)
  console.log("Is Loading:", brandingStore.isLoading)
  console.log("Has Changes:", brandingStore.hasChanges)
  console.groupEnd()
}

// Composable para uso en template
import {useBranding} from "@/composables/useBranding"

// Lifecycle
onMounted(() => {
  logger.info("BRANDING_TEST_DASHBOARD", "Dashboard de pruebas montado")
})
</script>

<style scoped>
.branding-test-dashboard {
  margin: 16px;
}

.test-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.test-progress {
  margin: 20px 0;
  padding: 16px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.progress-text {
  margin: 8px 0 0 0;
  text-align: center;
  font-style: italic;
  color: var(--ion-color-medium);
}

.system-status {
  margin: 20px 0;
}

.status-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--ion-color-light);
}

.status-label {
  font-weight: 600;
  color: var(--ion-color-medium);
}

.status-value {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--ion-color-dark);
}

.color-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--ion-color-light);
}

.test-results {
  margin: 20px 0;
}

.results-summary {
  margin-bottom: 16px;
}

.results-list {
  margin: 0;
}

.component-preview {
  margin: 20px 0;
}

.preview-section {
  margin-bottom: 20px;
}

.preview-section h4 {
  margin-bottom: 12px;
  color: var(--ion-color-primary);
}

.mock-header {
  border: 1px solid var(--ion-color-light);
}

.mock-logo {
  height: 32px;
  width: auto;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px;
  border-radius: 4px;
}

.mock-title h2 {
  margin: 0;
  font-size: 1.3rem;
}

.mock-title p {
  margin: 4px 0 0 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--ion-color-light);
  border-radius: 8px;
}

.color-item .color-swatch {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.color-name {
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.color-value {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

.debug-tools {
  margin: 20px 0;
  padding: 16px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.debug-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .test-controls {
    flex-direction: column;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .color-palette {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}
</style>
