<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
  >
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{{ title }}</h3>
    <div class="space-y-3">
      <button
        v-for="action in actions"
        :key="action.id"
        :disabled="action.disabled"
        :class="[
          'w-full px-4 py-2 rounded-lg flex items-center justify-center transition-colors font-medium text-white',
          action.disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-400'
            : `${getButtonColor(action.color)} hover:${getButtonHoverColor(action.color)}`,
        ]"
        @click="$emit('action-click', action.id)"
      >
        <component :is="action.icon" class="w-4 h-4 mr-2" />
        {{ action.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface QuickAction {
  id: string
  label: string
  icon: any
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo'
  disabled?: boolean
}

interface Props {
  title: string
  actions: QuickAction[]
}

defineProps<Props>();

defineEmits<{
  (e: 'action-click', actionId: string): void
}>();

const getButtonColor = (color: string): string => {
  const colorMap = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    indigo: 'bg-indigo-600',
  };
  return colorMap[color as keyof typeof colorMap] || 'bg-blue-600';
};

const getButtonHoverColor = (color: string): string => {
  const colorMap = {
    blue: 'bg-blue-700',
    green: 'bg-green-700',
    purple: 'bg-purple-700',
    yellow: 'bg-yellow-700',
    red: 'bg-red-700',
    indigo: 'bg-indigo-700',
  };
  return colorMap[color as keyof typeof colorMap] || 'bg-blue-700';
};
</script>
