<!-- src/views/testing/BrandingTestView.vue -->
<template>
  <div class="branding-test-view min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <h1 class="text-2xl font-bold text-gray-900">🧪 Pruebas del Sistema de Branding</h1>
          <button
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            @click="goBack"
          >
            ← Volver
          </button>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Dashboard principal -->
      <BrandingTestDashboard />

      <!-- Información adicional -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mt-8">
        <h2 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
          ℹ️ Información del Sistema
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <dt class="text-sm font-medium text-gray-600">Versión del Store</dt>
            <dd class="text-lg font-semibold text-gray-900">
              {{ brandingStore.config.version || "N/A" }}
            </dd>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <dt class="text-sm font-medium text-gray-600">Estado</dt>
            <dd
              class="text-lg font-semibold"
              :class="brandingStore.isLoading ? 'text-yellow-600' : 'text-green-600'"
            >
              {{ brandingStore.isLoading ? "Cargando..." : "Listo" }}
            </dd>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <dt class="text-sm font-medium text-gray-600">Configuración Actual</dt>
            <dd class="text-lg font-semibold text-gray-900">
              {{ brandingStore.config.appName || "Sin configurar" }}
            </dd>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <dt class="text-sm font-medium text-gray-600">Última Actualización</dt>
            <dd class="text-lg font-semibold text-gray-900">{{ formatLastUpdate() }}</dd>
          </div>
        </div>
      </div>

      <!-- Controles adicionales -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mt-8">
        <h2 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
          🔧 Controles de Desarrollo
        </h2>
        <div class="flex flex-wrap gap-4">
          <button
            class="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="clearCache"
          >
            🧹 Limpiar Caché
          </button>
          <button
            class="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            @click="exportTestResults"
          >
            📊 Exportar Resultados
          </button>
          <button
            class="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            @click="resetToDefaults"
          >
            🔄 Reset Completo
          </button>
          <button
            class="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            @click="goToBrandingManager"
          >
            ⚙️ Panel de Configuración
          </button>
        </div>
      </div>

      <!-- Información técnica -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mt-8">
        <h2 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
          💻 Información Técnica
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <dt class="text-sm font-medium text-gray-600">Navegador</dt>
            <dd class="text-sm text-gray-900">{{ browserInfo }}</dd>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <dt class="text-sm font-medium text-gray-600">Viewport</dt>
            <dd class="text-sm text-gray-900">{{ viewportInfo }}</dd>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <dt class="text-sm font-medium text-gray-600">Store Status</dt>
            <dd
              class="text-sm"
              :class="brandingStore.isLoading ? 'text-yellow-600' : 'text-green-600'"
            >
              {{ brandingStore.isLoading ? "Cargando..." : "Listo" }}
            </dd>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBrandingStore } from '@/stores/brandingStore';
import BrandingTestDashboard from '@/components/testing/BrandingTestDashboard.vue';
import { logger } from '@/utils/logging/logger';

// Composables
const router = useRouter();
const brandingStore = useBrandingStore();

// Computed properties
const browserInfo = computed(() => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Desconocido';
});

const viewportInfo = computed(() => {
  return `${window.innerWidth}x${window.innerHeight}`;
});

// Métodos
function goBack() {
  router.back();
}

function goToBrandingManager() {
  router.push('/admin/branding');
}

function formatLastUpdate(): string {
  const now = new Date();
  return now.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function clearCache() {
  if (confirm('¿Estás seguro de que quieres limpiar toda la caché?')) {
    localStorage.clear();
    sessionStorage.clear();

    // Limpiar caché del service worker si existe
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }

    alert('✅ Caché limpiada. Se recomienda recargar la página.');
    logger.info('BRANDING_TEST', 'Caché limpiada desde testing dashboard');
  }
}

function exportTestResults() {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      brandingConfig: brandingStore.config,
      testEnvironment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      localStorageSize: JSON.stringify(localStorage).length,
      sessionStorageSize: JSON.stringify(sessionStorage).length,
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `branding-test-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);

    alert('✅ Resultados de testing exportados exitosamente');
    logger.info('BRANDING_TEST', 'Resultados exportados', results);
  } catch (error) {
    logger.error('BRANDING_TEST', 'Error exportando resultados', error);
    alert('❌ Error exportando resultados de testing');
  }
}

function resetToDefaults() {
  if (
    confirm(
      '¿Estás seguro de que quieres hacer un reset completo? Esto restaurará toda la configuración a valores por defecto.',
    )
  ) {
    try {
      brandingStore.resetToDefault();
      clearCache();

      setTimeout(() => {
        window.location.reload();
      }, 1000);

      alert('✅ Reset completo realizado. La página se recargará automáticamente.');
      logger.info('BRANDING_TEST', 'Reset completo ejecutado');
    } catch (error) {
      logger.error('BRANDING_TEST', 'Error durante reset completo', error);
      alert('❌ Error durante el reset completo');
    }
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await brandingStore.loadBrandingConfig();
    logger.info('BRANDING_TEST', 'Vista de testing cargada exitosamente');
  } catch (error) {
    logger.error('BRANDING_TEST', 'Error cargando vista de testing', error);
  }
});
</script>

<style scoped>
.branding-test-view {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

@media (max-width: 768px) {
  .flex.flex-wrap {
    flex-direction: column;
  }

  .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 {
    grid-template-columns: 1fr;
  }

  .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
    grid-template-columns: 1fr;
  }
}
</style>
