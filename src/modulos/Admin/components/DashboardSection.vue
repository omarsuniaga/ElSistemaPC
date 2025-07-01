<template>
  <section
    class="dashboard-section bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
  >
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <component :is="iconComponent" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
            <p v-if="subtitle" class="text-sm text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center space-x-2">
          <button
            v-if="refreshable"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            :disabled="loading"
            @click="$emit('refresh')"
          >
            <ArrowPathIcon class="w-4 h-4" :class="{'animate-spin': loading}" />
          </button>

          <button
            v-if="expandable"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            @click="toggleExpanded"
          >
            <ChevronUpIcon v-if="isExpanded" class="w-4 h-4" />
            <ChevronDownIcon v-else class="w-4 h-4" />
          </button>

          <slot name="actions" />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-show="!expandable || isExpanded" class="section-content">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex flex-col items-center space-y-3">
          <div
            class="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"
          />
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ loadingText || "Cargando..." }}</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex items-center justify-center py-12">
        <div class="flex flex-col items-center space-y-3 text-center">
          <ExclamationTriangleIcon class="w-12 h-12 text-red-500" />
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Error al cargar datos</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ error }}</p>
          </div>
          <button
            class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            @click="$emit('retry')"
          >
            Reintentar
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="empty" class="flex items-center justify-center py-12">
        <div class="flex flex-col items-center space-y-3 text-center">
          <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
            <component :is="emptyIcon || 'DocumentIcon'" class="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ emptyTitle || "No hay datos" }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ emptyDescription || "No se encontraron elementos para mostrar" }}
            </p>
          </div>
          <slot name="empty-action" />
        </div>
      </div>

      <!-- Content -->
      <div v-else class="section-body">
        <slot />
      </div>
    </div>

    <!-- Footer -->
    <div
      v-if="$slots.footer"
      class="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-700/50"
    >
      <slot name="footer" />
    </div>
  </section>
</template>

<script setup lang="ts">
import {ref, computed} from "vue"
import {
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  CogIcon,
  ChartBarIcon,
  UsersIcon,
  BellIcon,
  ServerIcon,
} from "@heroicons/vue/24/outline"

interface Props {
  title: string
  subtitle?: string
  icon: string
  loading?: boolean
  loadingText?: string
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: string
  refreshable?: boolean
  expandable?: boolean
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  empty: false,
  refreshable: false,
  expandable: false,
  defaultExpanded: true,
})

const emit = defineEmits<{
  refresh: []
  retry: []
}>()

// Icon mapping
const iconComponents = {
  CogIcon,
  ChartBarIcon,
  UsersIcon,
  BellIcon,
  ServerIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
}

// State
const isExpanded = ref(props.defaultExpanded)

// Computed
const iconComponent = computed(
  () => iconComponents[props.icon as keyof typeof iconComponents] || CogIcon
)

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.dashboard-section {
  transition: all 0.3s ease;
}

.section-content {
  transition: all 0.3s ease;
}

.section-body {
  padding: 1.5rem;
}

/* Animation for expand/collapse */
.section-content[v-show] {
  transition:
    height 0.3s ease,
    opacity 0.3s ease;
}

/* Hover effects */
.dashboard-section:hover {
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}

/* Responsive padding */
@media (max-width: 640px) {
  .section-body {
    padding: 1rem;
  }
}
</style>
