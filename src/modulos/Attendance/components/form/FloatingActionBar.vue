<!--
🎯 FLOATING ACTION BAR
Barra de acciones flotante para gestión rápida de asistencias
-->

<template>
  <div
    class="floating-action-bar fixed left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300"
    :class="[
      props.position === 'top' ? 'top-4' : 'bottom-4',
      isExpanded ? 'w-auto' : 'w-auto min-w-80',
    ]"
  >
    <!-- Barra principal -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      :class="{'ring-2 ring-blue-500 ring-opacity-50': hasUnsavedChanges}"
    >
      <!-- Contenido principal -->
      <div class="px-4 py-3">
        <div class="flex items-center justify-between">
          <!-- Estado y progreso -->
          <div class="flex items-center space-x-4">
            <!-- Indicador de progreso circular -->
            <div class="relative">
              <svg class="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  stroke-width="2"
                  stroke-dasharray="100, 100"
                />
                <path
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  :stroke="isComplete ? '#10b981' : '#3b82f6'"
                  stroke-width="2"
                  :stroke-dasharray="`${completionPercentage}, 100`"
                  stroke-linecap="round"
                  class="transition-all duration-300"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-xs font-semibold" :class="statusColor">
                  {{ completionPercentage }}%
                </span>
              </div>
            </div>

            <!-- Estadísticas -->
            <div class="text-sm">
              <div class="font-medium text-gray-900 dark:text-white">
                {{ props.totalStudents || 0 }} estudiantes
              </div>
              <div class="flex space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span class="flex items-center">
                  <div class="w-2 h-2 bg-green-500 rounded-full mr-1" />
                  {{ presentCount || 0 }}
                </span>
                <span class="flex items-center">
                  <div class="w-2 h-2 bg-red-500 rounded-full mr-1" />
                  {{ absentCount || 0 }}
                </span>
                <span class="flex items-center">
                  <div class="w-2 h-2 bg-yellow-500 rounded-full mr-1" />
                  {{ lateCount || 0 }}
                </span>
                <span class="flex items-center">
                  <div class="w-2 h-2 bg-gray-400 rounded-full mr-1" />
                  {{ pendingCount }}
                </span>
              </div>
            </div>
          </div>

          <!-- Acciones principales -->
          <div class="flex items-center space-x-2">
            <!-- Botón de expandir/contraer -->
            <button
              type="button"
              class="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              @click="toggleExpand"
            >
              <ChevronUpIcon v-if="isExpanded" class="h-5 w-5" />
              <ChevronDownIcon v-else class="h-5 w-5" />
            </button>

            <!-- Botón de guardar -->
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors"
              :class="[
                props.canSave && !props.isLoading
                  ? hasUnsavedChanges
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-md'
                    : 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed',
              ]"
              :disabled="!props.canSave || props.isLoading"
              @click="handleSave"
            >
              <div
                v-if="props.isLoading"
                class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
              />
              <ArrowUpTrayIcon v-else class="h-4 w-4 mr-2" />
              {{
                props.isLoading
                  ? "Guardando..."
                  : hasUnsavedChanges
                    ? "Guardar cambios"
                    : isComplete
                      ? "Completado"
                      : "Guardar"
              }}
            </button>
          </div>
        </div>
      </div>

      <!-- Panel expandido -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-y-0 opacity-0"
        enter-to-class="transform scale-y-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-y-100 opacity-100"
        leave-to-class="transform scale-y-0 opacity-0"
        style="transform-origin: center bottom"
      >
        <div
          v-if="isExpanded"
          class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
        >
          <!-- Acciones rápidas -->
          <div class="px-4 py-3">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Acciones Rápidas</h4>
              <button
                type="button"
                class="text-xs text-blue-600 hover:text-blue-800 font-medium"
                @click="showQuickActions = !showQuickActions"
              >
                {{ showQuickActions ? "Ocultar" : "Mostrar" }}
              </button>
            </div>

            <!-- Grid de acciones rápidas -->
            <transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="transform scale-y-0 opacity-0"
              enter-to-class="transform scale-y-100 opacity-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="transform scale-y-100 opacity-100"
              leave-to-class="transform scale-y-0 opacity-0"
            >
              <div v-if="showQuickActions" class="grid grid-cols-2 gap-2 mb-3">
                <button
                  v-for="quickAction in quickActions"
                  :key="quickAction.key"
                  type="button"
                  class="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white rounded-md transition-colors"
                  :class="quickAction.color"
                  :disabled="props.isLoading"
                  @click="executeQuickAction(quickAction.action)"
                >
                  <component :is="quickAction.icon" class="h-4 w-4 mr-1" />
                  {{ quickAction.label }}
                </button>
              </div>
            </transition>

            <!-- Acciones secundarias -->
            <div class="flex items-center justify-center space-x-2">
              <button
                v-if="props.canExport"
                type="button"
                class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                :disabled="props.isLoading"
                @click="handleExport"
              >
                <ArrowUpTrayIcon class="h-3 w-3 mr-1" />
                Exportar
              </button>

              <button
                v-if="props.canPrint"
                type="button"
                class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                :disabled="props.isLoading"
                @click="handlePrint"
              >
                <PrinterIcon class="h-3 w-3 mr-1" />
                Imprimir
              </button>

              <button
                v-if="props.canShare"
                type="button"
                class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                :disabled="props.isLoading"
                @click="handleShare"
              >
                <ShareIcon class="h-3 w-3 mr-1" />
                Compartir
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Indicador de cambios no guardados -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-2 opacity-0"
    >
      <div v-if="hasUnsavedChanges" class="mt-2 text-center">
        <div
          class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
        >
          <div class="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse" />
          Cambios sin guardar
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  PrinterIcon,
  ShareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/outline';

// Props
const props = defineProps<{
  hasUnsavedChanges?: boolean
  totalStudents?: number
  presentCount?: number
  absentCount?: number
  lateCount?: number
  justifiedCount?: number
  canSave?: boolean
  canExport?: boolean
  canPrint?: boolean
  canShare?: boolean
  isLoading?: boolean
  position?: 'bottom' | 'top'
  expanded?: boolean
}>();

// Emits
const emit = defineEmits<{
  save: []
  'mark-all-present': []
  'mark-all-absent': []
  'mark-all-late': []
  'mark-all-justified': []
  export: []
  print: []
  share: []
  'toggle-expand': []
  cancel: []
}>();

// Estado local
const isExpanded = ref(props.expanded || false);
const showQuickActions = ref(false);

// Computed properties
const pendingCount = computed(() => {
  if (props.totalStudents === undefined) return 0;
  return (
    props.totalStudents -
    (props.presentCount || 0) -
    (props.absentCount || 0) -
    (props.lateCount || 0) -
    (props.justifiedCount || 0)
  );
});

const completionPercentage = computed(() => {
  if (!props.totalStudents || props.totalStudents === 0) return 0;
  const completed =
    (props.presentCount || 0) +
    (props.absentCount || 0) +
    (props.lateCount || 0) +
    (props.justifiedCount || 0);
  return Math.round((completed / props.totalStudents) * 100);
});

const isComplete = computed(() => completionPercentage.value === 100);

const statusColor = computed(() => {
  if (isComplete.value) return 'text-green-600';
  if (completionPercentage.value > 50) return 'text-yellow-600';
  return 'text-red-600';
});

const quickActions = computed(() => [
  {
    key: 'present',
    label: 'Todos presentes',
    icon: CheckIcon,
    color: 'bg-green-500 hover:bg-green-600',
    action: () => emit('mark-all-present'),
  },
  {
    key: 'absent',
    label: 'Todos ausentes',
    icon: XMarkIcon,
    color: 'bg-red-500 hover:bg-red-600',
    action: () => emit('mark-all-absent'),
  },
  {
    key: 'late',
    label: 'Todos tarde',
    icon: ClockIcon,
    color: 'bg-yellow-500 hover:bg-yellow-600',
    action: () => emit('mark-all-late'),
  },
  {
    key: 'justified',
    label: 'Todos justificados',
    icon: ExclamationTriangleIcon,
    color: 'bg-blue-500 hover:bg-blue-600',
    action: () => emit('mark-all-justified'),
  },
]);

// Métodos
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
  emit('toggle-expand');
};

const handleSave = () => {
  if (props.canSave && !props.isLoading) {
    emit('save');
  }
};

const handleExport = () => {
  if (props.canExport && !props.isLoading) {
    emit('export');
  }
};

const handlePrint = () => {
  if (props.canPrint && !props.isLoading) {
    emit('print');
  }
};

const handleShare = () => {
  if (props.canShare && !props.isLoading) {
    emit('share');
  }
};

const executeQuickAction = (action: () => void) => {
  if (!props.isLoading) {
    action();
    showQuickActions.value = false;
  }
};
</script>

<style scoped>
.floating-action-bar {
  backdrop-filter: blur(10px);
}

@media (max-width: 640px) {
  .floating-action-bar {
    left: 1rem;
    right: 1rem;
    transform: none;
    width: auto;
  }
}
</style>
