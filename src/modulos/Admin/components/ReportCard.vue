<template>
  <div
    v-if="hasPermission"
    class="report-card group relative overflow-hidden bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer"
    :class="cardClasses"
    @click="navigateToRoute"
  >
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-5" :class="patternClass" />

    <!-- Content -->
    <div class="relative p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="p-2 rounded-lg transition-colors duration-300" :class="iconBgClass">
          <component
            :is="iconComponent"
            class="w-5 h-5 transition-colors duration-300"
            :class="iconClass"
          />
        </div>

        <!-- Trend Indicator -->
        <div v-if="trend" class="flex items-center space-x-1">
          <component
            :is="trendIcon"
            class="w-3 h-3 transition-colors duration-300"
            :class="trendClass"
          />
          <span class="text-xs font-medium transition-colors duration-300" :class="trendClass">
            {{ trend }}
          </span>
        </div>
      </div>

      <!-- Title and Description -->
      <div class="mb-4">
        <h4
          class="font-medium text-gray-900 dark:text-white group-hover:text-opacity-90 transition-colors duration-300 mb-1"
        >
          {{ title }}
        </h4>
        <p
          class="text-xs text-gray-600 dark:text-gray-400 group-hover:text-opacity-80 transition-colors duration-300"
        >
          {{ description }}
        </p>
      </div>

      <!-- Main Value -->
      <div class="flex items-baseline justify-between mb-3">
        <div class="flex items-baseline space-x-2">
          <span class="text-2xl font-bold transition-colors duration-300" :class="valueClass">
            {{ value }}
          </span>
          <span v-if="unit" class="text-sm text-gray-500 dark:text-gray-400">
            {{ unit }}
          </span>
        </div>

        <!-- Quick Action -->
        <button
          v-if="quickAction"
          class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 opacity-0 group-hover:opacity-100"
          :title="quickAction.tooltip"
          @click.stop="handleQuickAction"
        >
          <component :is="quickAction.icon" class="w-4 h-4" />
        </button>
      </div>

      <!-- Progress Bar (if applicable) -->
      <div v-if="progress !== undefined" class="mb-3">
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            class="h-1.5 rounded-full transition-all duration-500"
            :class="progressBarClass"
            :style="{width: `${progress}%`}"
          />
        </div>
      </div>

      <!-- Additional Metrics -->
      <div v-if="metrics && metrics.length > 0" class="flex items-center justify-between text-xs">
        <div v-for="metric in metrics" :key="metric.label" class="text-center">
          <div class="font-medium text-gray-900 dark:text-white">{{ metric.value }}</div>
          <div class="text-gray-500 dark:text-gray-400">{{ metric.label }}</div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="lastUpdate" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Última actualización</span>
          <span>{{ formatDate(lastUpdate) }}</span>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="loading"
      class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-80 flex items-center justify-center"
    >
      <div
        class="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-current"
        :class="iconClass"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useRBACStore } from '@/stores/rbacStore';
import {
  ClipboardDocumentCheckIcon,
  TrophyIcon,
  CubeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline';

interface QuickAction {
  icon: any
  tooltip: string
  action: string
}

interface Metric {
  label: string
  value: string | number
}

interface Props {
  title: string
  description: string
  icon: string
  route: string
  value: string | number
  unit?: string
  trend?: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo'
  permission?: {module: string; action: string}
  loading?: boolean
  progress?: number
  metrics?: Metric[]
  quickAction?: QuickAction
  lastUpdate?: Date
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  loading: false,
});

const emit = defineEmits<{
  quickAction: [action: string]
}>();

const router = useRouter();
const rbacStore = useRBACStore();

// Icon mapping
const iconComponents = {
  ClipboardDocumentCheckIcon,
  TrophyIcon,
  CubeIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
};

// Computed properties
const hasPermission = computed(() => {
  if (!props.permission) return true;
  return rbacStore.hasPermission(props.permission.module, props.permission.action);
});

const iconComponent = computed(
  () => iconComponents[props.icon as keyof typeof iconComponents] || ChartBarIcon,
);

const cardClasses = computed(() => ({
  'transform hover:scale-102 hover:shadow-lg': true,
  'cursor-not-allowed opacity-50': props.loading,
}));

const patternClass = computed(
  () => `bg-gradient-to-br from-${props.color}-500 to-${props.color}-600`,
);

const iconBgClass = computed(
  () =>
    `bg-${props.color}-50 dark:bg-${props.color}-900/20 group-hover:bg-${props.color}-100 dark:group-hover:bg-${props.color}-900/30`,
);

const iconClass = computed(() => `text-${props.color}-600 dark:text-${props.color}-400`);

const valueClass = computed(() => `text-${props.color}-600 dark:text-${props.color}-400`);

const progressBarClass = computed(() => `bg-${props.color}-500`);

const trendIcon = computed(() => {
  if (!props.trend) return null;
  const isPositive = props.trend.startsWith('+');
  return isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
});

const trendClass = computed(() => {
  if (!props.trend) return '';
  const isPositive = props.trend.startsWith('+');
  return isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
});

// Methods
const navigateToRoute = async () => {
  if (props.loading || !hasPermission.value) return;

  try {
    await router.push(props.route);
  } catch (error) {
    console.error('Navigation error:', error);
  }
};

const handleQuickAction = () => {
  if (props.quickAction) {
    emit('quickAction', props.quickAction.action);
  }
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
</script>

<style scoped>
.report-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.report-card:hover {
  transform: translateY(-2px) scale(1.02);
}

/* Usar utilidades de Tailwind con soporte para dark mode */
.text-blue-600 {
  @apply text-blue-600 dark:text-blue-400;
}
.text-green-600 {
  @apply text-green-600 dark:text-green-400;
}
.text-purple-600 {
  @apply text-purple-600 dark:text-purple-400;
}
.text-orange-600 {
  @apply text-orange-600 dark:text-orange-400;
}
.text-red-600 {
  @apply text-red-600 dark:text-red-400;
}
.text-yellow-600 {
  @apply text-yellow-600 dark:text-yellow-400;
}
.text-indigo-600 {
  @apply text-indigo-600 dark:text-indigo-400;
}

.bg-blue-50 {
  @apply bg-blue-50 dark:bg-blue-900/20;
}
.bg-green-50 {
  @apply bg-green-50 dark:bg-green-900/20;
}
.bg-purple-50 {
  @apply bg-purple-50 dark:bg-purple-900/20;
}
.bg-orange-50 {
  @apply bg-orange-50 dark:bg-orange-900/20;
}
.bg-red-50 {
  @apply bg-red-50 dark:bg-red-900/20;
}
.bg-yellow-50 {
  @apply bg-yellow-50 dark:bg-yellow-900/20;
}
.bg-indigo-50 {
  @apply bg-indigo-50 dark:bg-indigo-900/20;
}

.hover\:bg-blue-100:hover {
  @apply hover:bg-blue-100 dark:hover:bg-blue-900/30;
}
.hover\:bg-green-100:hover {
  @apply hover:bg-green-100 dark:hover:bg-green-900/30;
}
.hover\:bg-purple-100:hover {
  @apply hover:bg-purple-100 dark:hover:bg-purple-900/30;
}
.hover\:bg-orange-100:hover {
  @apply hover:bg-orange-100 dark:hover:bg-orange-900/30;
}
.hover\:bg-red-100:hover {
  @apply hover:bg-red-100 dark:hover:bg-red-900/30;
}
.hover\:bg-yellow-100:hover {
  @apply hover:bg-yellow-100 dark:hover:bg-yellow-900/30;
}
.hover\:bg-indigo-100:hover {
  @apply hover:bg-indigo-100 dark:hover:bg-indigo-900/30;
}
</style>
