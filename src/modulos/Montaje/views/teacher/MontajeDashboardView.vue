<!--
🎯 MONTAJE DASHBOARD VIEW - NUEVA ARQUITECTURA
Vista placeholder para funcionalidades de montaje del maestro
Componente placeholder con mensaje de "Próximamente"
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../../../stores/auth'

// Stores
const authStore = useAuthStore()

// Estado del componente
const isLoading = ref(true)
const features = ref([
  {
    id: 'config',
    title: 'Configuración de Aula',
    description: 'Personaliza la configuración de tu espacio de enseñanza',
    icon: 'cog',
    status: 'planned'
  },
  {
    id: 'instruments',
    title: 'Gestión de Instrumentos',
    description: 'Administra los instrumentos disponibles para tus clases',
    icon: 'music-note',
    status: 'planned'
  },
  {
    id: 'resources',
    title: 'Recursos Didácticos',
    description: 'Organiza y comparte materiales de estudio',
    icon: 'book-open',
    status: 'planned'
  },
  {
    id: 'backup',
    title: 'Respaldo y Sincronización',
    description: 'Configura copias de seguridad automáticas',
    icon: 'cloud',
    status: 'planned'
  }
])

// Computed properties
const currentTeacher = computed(() => ({
  name: authStore.user?.email || 'Maestro',
  id: authStore.user?.uid,
}))

// Métodos
const getFeatureIcon = (iconName: string) => {
  const icons = {
    cog: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`,
    'music-note': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />`,
    'book-open': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />`,
    cloud: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />`
  }
  return icons[iconName as keyof typeof icons] || icons.cog
}

const handleFeatureClick = (featureId: string) => {
  console.log('🔧 [MontajeDashboard] Feature clicked:', featureId)
  // TODO: Implementar navegación a funcionalidades específicas cuando estén listas
}

// Lifecycle
onMounted(() => {
  console.log('🚀 [MontajeDashboard] Component mounted')
  
  // Simular carga
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 🎯 HEADER -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Título y descripción -->
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              Centro de Montaje
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configuración y personalización del entorno de enseñanza
            </p>
          </div>

          <!-- Badge de estado -->
          <div class="flex items-center space-x-2">
            <span class="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
              En Desarrollo
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- 🏗️ CONTENIDO PRINCIPAL -->
    <main class="flex-1 p-6">
      <!-- Estado de carga -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="text-gray-600 dark:text-gray-400">Cargando centro de montaje...</span>
        </div>
      </div>

      <!-- Contenido principal -->
      <div v-else class="max-w-6xl mx-auto space-y-8">
        <!-- Mensaje principal -->
        <div class="text-center py-12">
          <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🔧 Centro de Montaje
          </h2>
          
          <p class="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Estamos trabajando en nuevas funcionalidades para mejorar tu experiencia
          </p>
          
          <p class="text-gray-500 dark:text-gray-500 max-w-2xl mx-auto">
            El Centro de Montaje te permitirá personalizar y configurar tu entorno de enseñanza, 
            gestionar instrumentos y recursos, y optimizar tu flujo de trabajo.
          </p>
        </div>

        <!-- Funcionalidades en desarrollo -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Funcionalidades en Desarrollo
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Estas son las funcionalidades que estarán disponibles próximamente
            </p>
          </div>

          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                v-for="feature in features"
                :key="feature.id"
                class="group relative p-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer"
                @click="handleFeatureClick(feature.id)"
              >
                <!-- Ícono de la funcionalidad -->
                <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <svg
                    class="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    v-html="getFeatureIcon(feature.icon)"
                  >
                  </svg>
                </div>

                <!-- Información -->
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {{ feature.title }}
                </h4>
                
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {{ feature.description }}
                </p>

                <!-- Estado -->
                <div class="flex items-center justify-between">
                  <span class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Próximamente
                  </span>

                  <!-- Flecha indicadora -->
                  <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <!-- Overlay hover -->
                <div class="absolute inset-0 bg-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <div class="flex items-start space-x-4">
            <!-- Ícono de información -->
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <!-- Contenido -->
            <div>
              <h4 class="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                ¿Necesitas ayuda con alguna configuración?
              </h4>
              <p class="text-blue-800 dark:text-blue-300 text-sm mb-4">
                Mientras desarrollamos estas funcionalidades, puedes contactar al equipo de soporte 
                para ayuda con configuraciones específicas de tu entorno de enseñanza.
              </p>
              <div class="flex items-center space-x-3">
                <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                  Contactar Soporte
                </button>
                <button class="px-4 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 text-sm font-medium border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  Ver Documentación
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline de desarrollo -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Cronograma de Desarrollo
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Mantente informado sobre el progreso de las nuevas funcionalidades
            </p>
          </div>

          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-center space-x-4">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                <div class="flex-1">
                  <div class="font-medium text-gray-900 dark:text-white">Fase 1: Arquitectura Base</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Completado - Nueva estructura de navegación</div>
                </div>
                <span class="text-xs text-green-600 dark:text-green-400 font-medium">✓ Completado</span>
              </div>

              <div class="flex items-center space-x-4">
                <div class="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div class="flex-1">
                  <div class="font-medium text-gray-900 dark:text-white">Fase 2: Funcionalidades Core</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">En progreso - Asistencia y gestión de clases</div>
                </div>
                <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">En progreso</span>
              </div>

              <div class="flex items-center space-x-4">
                <div class="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div class="flex-1">
                  <div class="font-medium text-gray-500 dark:text-gray-400">Fase 3: Centro de Montaje</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Planificado - Configuraciones avanzadas</div>
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Q1 2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Animaciones personalizadas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Efectos hover mejorados */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Animación del ícono principal */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.float-animation {
  animation: float 3s ease-in-out infinite;
}

/* Transiciones suaves para botones */
button {
  transition: all 0.2s ease;
}

/* Animación de pulso suave */
@keyframes gentle-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.pulse-gentle {
  animation: gentle-pulse 2s ease-in-out infinite;
}
</style>
