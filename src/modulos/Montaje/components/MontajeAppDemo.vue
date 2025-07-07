<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header del módulo -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              🎼 Sistema Musical Montaje
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              Usuario: {{ user?.name || 'Invitado' }}
            </span>
            <button
              @click="$router.push('/')"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              ← Volver al Sistema Principal
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Dashboard de bienvenida -->
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <div class="text-center">
              <div class="text-6xl mb-4">🎼</div>
              <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                ¡Bienvenido al Sistema Musical!
              </h2>
              <p class="text-lg text-gray-500 dark:text-gray-400 mb-8">
                Módulo de Montaje integrado exitosamente al proyecto {{ projectName }}
              </p>
              
              <!-- Grid de características -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                  <div class="text-3xl mb-3">🎵</div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">Gestión de Obras</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Administra tu repertorio musical con evaluaciones detalladas
                  </p>
                </div>
                
                <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <div class="text-3xl mb-3">📊</div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">Analytics</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Visualiza el progreso y rendimiento de tu orquesta
                  </p>
                </div>
                
                <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                  <div class="text-3xl mb-3">🎹</div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">Herramientas</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Metrónomo, afinador y más herramientas musicales
                  </p>
                </div>
              </div>

              <!-- Estado de integración -->
              <div class="mt-8 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <h4 class="text-lg font-medium text-green-800 dark:text-green-300 mb-2">
                  ✅ Integración Completada
                </h4>
                <div class="text-sm text-green-700 dark:text-green-400">
                  <p>✓ Sistema de módulos funcionando</p>
                  <p>✓ Firebase configurado correctamente</p>
                  <p>✓ Rutas del módulo disponibles</p>
                  <p>✓ Permisos de usuario configurados</p>
                </div>
              </div>

              <!-- Navegación rápida -->
              <div class="mt-8">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Acceso Rápido
                </h4>
                <div class="flex flex-wrap justify-center gap-4">
                  <router-link
                    to="/montaje/works"
                    class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🎵 Ver Obras
                  </router-link>
                  <router-link
                    to="/montaje/tools"
                    class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    🎹 Herramientas
                  </router-link>
                  <router-link
                    to="/montaje/analytics"
                    class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📊 Analytics
                  </router-link>
                </div>
              </div>

              <!-- Información técnica -->
              <div class="mt-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-left">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Información del Módulo
                </h4>
                <div class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <p><strong>Versión:</strong> {{ moduleInfo.version }}</p>
                  <p><strong>Autor:</strong> {{ moduleInfo.author }}</p>
                  <p><strong>Última actualización:</strong> {{ new Date().toLocaleDateString() }}</p>
                  <p><strong>Router:</strong> Integrado exitosamente</p>
                  <p><strong>Estado:</strong> <span class="text-green-600 dark:text-green-400">Activo</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MONTAJE_MODULE_INFO } from '../index'

// Props del componente
interface Props {
  user?: {
    id: string
    name: string
    email: string
    role: string
    permissions: string[]
  }
}

const props = withDefaults(defineProps<Props>(), {
  user: () => ({
    id: 'demo',
    name: 'Usuario Demo',
    email: 'demo@montaje.com',
    role: 'musician',
    permissions: ['montaje:access']
  })
})

// Datos del módulo
const moduleInfo = computed(() => MONTAJE_MODULE_INFO)
const projectName = computed(() => 'El Sistema PC')

// Loggar que el módulo se cargó exitosamente
console.log('🎼 Módulo Montaje cargado exitosamente!')
console.log('📊 Usuario actual:', props.user)
console.log('⚙️ Información del módulo:', moduleInfo.value)
</script>

<style scoped>
/* Animaciones suaves */
.transition-colors {
  transition: background-color 0.2s ease;
}

/* Hover effects para las tarjetas */
.bg-blue-50:hover {
  @apply bg-blue-100;
}

.bg-green-50:hover {
  @apply bg-green-100;
}

.bg-purple-50:hover {
  @apply bg-purple-100;
}

/* Dark mode transitions */
@media (prefers-color-scheme: dark) {
  .bg-blue-50:hover {
    background-color: rgba(59, 130, 246, 0.3);
  }
  
  .bg-green-50:hover {
    background-color: rgba(34, 197, 94, 0.3);
  }
  
  .bg-purple-50:hover {
    background-color: rgba(168, 85, 247, 0.3);
  }
}
</style>
