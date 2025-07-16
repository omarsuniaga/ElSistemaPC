<!--
  📋 PANEL LATERAL DINÁMICO
  Componente reutilizable para mostrar información contextual y acciones rápidas
-->
<template>
  <aside
    :class="[
      'fixed top-16 right-0 bottom-16 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transition-all duration-300 z-30 flex flex-col',
      'md:top-0 md:bottom-0 md:relative md:z-auto',
      'lg:relative lg:z-auto',
      expanded ? 'w-80 translate-x-0' : 'w-16 translate-x-0',
    ]"
  >
    <!-- Header del sidebar con mejor diseño -->
    <div class="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
      <div class="flex items-center justify-between">
        <!-- Título del panel -->
        <div v-show="expanded" class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ title }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ subtitle }}
            </p>
          </div>
        </div>

        <!-- Botón de colapsar/expandir mejorado -->
        <div class="flex items-center space-x-1">
          <!-- Indicadores rápidos cuando está colapsado -->
          <div v-show="!expanded" class="flex items-center space-x-1">
            <!-- Indicador de clases pendientes -->
            <div
              v-if="stats.pendingToday > 0"
              class="w-5 h-5 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
              :title="`${stats.pendingToday} clases pendientes`"
            >
              {{ stats.pendingToday }}
            </div>
            <!-- Indicador de clases completadas -->
            <div
              v-if="stats.completedToday > 0"
              class="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
              :title="`${stats.completedToday} clases completadas`"
            >
              {{ stats.completedToday }}
            </div>
          </div>

          <!-- Botón toggle mejorado -->
          <button
            :title="expanded ? 'Ocultar panel' : 'Mostrar panel'"
            class="toggle-button group p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
            @click="$emit('toggle')"
          >
            <svg
              class="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
              :class="{'rotate-180': !expanded}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Contenido del sidebar con scroll optimizado -->
    <div class="flex-1 overflow-hidden">
      <!-- Contenido expandido con scroll suave -->
      <div v-show="expanded" class="h-full overflow-y-auto custom-scrollbar mb-16">
        <div class="p-4 space-y-6">
          <!-- Estado del día mejorado -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
              <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Estado del Día
            </h3>
            <div
              :class="[
                'px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all duration-200 hover:shadow-md',
                dayStatus.color === 'green'
                  ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200 dark:from-green-900/20 dark:to-green-800/20 dark:text-green-400 dark:border-green-800'
                  : dayStatus.color === 'yellow'
                    ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border border-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20 dark:text-yellow-400 dark:border-yellow-800'
                    : dayStatus.color === 'blue'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-400 dark:border-blue-800'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border border-gray-200 dark:from-gray-800/20 dark:to-gray-700/20 dark:text-gray-400 dark:border-gray-700',
              ]"
            >
              <div class="flex items-center space-x-3">
                <div
                  :class="[
                    'w-3 h-3 rounded-full animate-pulse',
                    dayStatus.color === 'green'
                      ? 'bg-green-500'
                      : dayStatus.color === 'yellow'
                        ? 'bg-yellow-500'
                        : dayStatus.color === 'blue'
                          ? 'bg-blue-500'
                          : 'bg-gray-400',
                  ]"
                />
                <span>{{ dayStatus.text }}</span>
              </div>
              <!-- Progreso visual -->
              <div class="text-xs opacity-75">
                {{ stats.completedToday }}/{{ stats.totalClassesToday }}
              </div>
            </div>
          </div>

          <!-- Resumen rápido de estadísticas -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
              <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Resumen Rápido
            </h3>
            <div class="grid grid-cols-2 gap-3">
              <!-- Clases completadas -->
              <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-sm transition-shadow">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ stats.completedToday }}
                </div>
                <div class="text-xs text-green-700 dark:text-green-300 font-medium">
                  Completadas
                </div>
              </div>
              <!-- Clases pendientes -->
              <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 hover:shadow-sm transition-shadow">
                <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {{ stats.pendingToday }}
                </div>
                <div class="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                  Pendientes
                </div>
              </div>
            </div>
          </div>

          <!-- Slot para contenido personalizado -->
          <slot name="content" :expanded="expanded" />

          <!-- Slot para acciones rápidas -->
          <div v-if="showQuickActions && hasClasses" class="space-y-3">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
              <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Acciones Rápidas
            </h3>
            <slot name="quick-actions" :expanded="expanded" />
          </div>
        </div>
      </div>

      <!-- Contenido colapsado mejorado -->
      <div v-show="!expanded" class="h-full flex flex-col items-center justify-start pt-6 space-y-4">
        <!-- Indicadores compactos -->
        <div class="space-y-3">
          <!-- Indicador de clases pendientes -->
          <div
            v-if="stats.pendingToday > 0"
            class="collapse-indicator w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
            :title="`${stats.pendingToday} clases pendientes`"
            @click="$emit('toggle')"
          >
            <div class="text-center">
              <div class="text-lg font-bold">{{ stats.pendingToday }}</div>
              <div class="text-xs opacity-90">Pend</div>
            </div>
          </div>

          <!-- Indicador de clases completadas -->
          <div
            v-if="stats.completedToday > 0"
            class="collapse-indicator w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
            :title="`${stats.completedToday} clases completadas`"
            @click="$emit('toggle')"
          >
            <div class="text-center">
              <div class="text-lg font-bold">{{ stats.completedToday }}</div>
              <div class="text-xs opacity-90">Done</div>
            </div>
          </div>

          <!-- Indicador de total de estudiantes -->
          <div
            v-if="stats.totalStudentsToday > 0"
            class="collapse-indicator w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
            :title="`${stats.totalStudentsToday} estudiantes hoy`"
            @click="$emit('toggle')"
          >
            <div class="text-center">
              <div class="text-lg font-bold">{{ stats.totalStudentsToday }}</div>
              <div class="text-xs opacity-90">Est</div>
            </div>
          </div>
        </div>

        <!-- Botón de ayuda rápida -->
        <div class="mt-auto mb-4">
          <button
            class="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 pulse-hint"
            title="Expandir panel para más opciones"
            @click="$emit('toggle')"
          >
            <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
interface Props {
  expanded: boolean
  title: string
  subtitle: string
  stats: {
    totalClassesToday: number
    completedToday: number
    pendingToday: number
    totalStudentsToday: number
  }
  dayStatus: {
    type: string
    color: 'green' | 'yellow' | 'blue' | 'gray'
    text: string
  }
  showQuickActions?: boolean
  hasClasses?: boolean
}

defineProps<Props>();

defineEmits<{
  toggle: []
}>();
</script>

<style scoped>
/* Scroll personalizado para el sidebar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e0 100%);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #cbd5e0 0%, #a0aec0 100%);
}

/* Dark mode scrollbar */
.dark .custom-scrollbar {
  scrollbar-color: #4a5568 transparent;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #4a5568 0%, #2d3748 100%);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
}

/* Animaciones suaves para los indicadores del sidebar colapsado */
.collapse-indicator {
  transform: scale(0.9);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.collapse-indicator:hover {
  transform: scale(1.05);
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Mejoras para el botón de toggle */
.toggle-button {
  position: relative;
  overflow: hidden;
}

.toggle-button::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition:
    width 0.3s ease,
    height 0.3s ease;
}

.toggle-button:hover::before {
  width: 40px;
  height: 40px;
}

/* Indicador de pulsación para ayuda */
.pulse-hint {
  animation: gentle-pulse 3s ease-in-out infinite 2s;
}

@keyframes gentle-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}
</style>
