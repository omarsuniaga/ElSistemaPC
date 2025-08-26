<template>
  <button
    @click="$emit('click')"
    class="quick-action-btn w-full flex items-center space-x-3 p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
  >
    <!-- Icon -->
    <div class="flex-shrink-0">
      <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 rounded-lg flex items-center justify-center transition-colors duration-200">
        <component :is="iconComponent" class="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" />
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-200">
        {{ title }}
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
        {{ description }}
      </p>
    </div>

    <!-- Arrow -->
    <div class="flex-shrink-0">
      <ChevronRightIcon class="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200" />
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  PlusIcon,
  UserPlusIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  CogIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline';

interface Props {
  icon: 'plus' | 'user-plus' | 'user-group' | 'calendar' | 'document' | 'cog';
  title: string;
  description: string;
}

const props = defineProps<Props>();

defineEmits<{
  click: [];
}>();

// Icon mapping
const iconComponent = computed(() => {
  const icons = {
    plus: PlusIcon,
    'user-plus': UserPlusIcon,
    'user-group': UserGroupIcon,
    calendar: CalendarIcon,
    document: DocumentTextIcon,
    cog: CogIcon,
  };
  return icons[props.icon];
});
</script>

<style scoped>
.quick-action-btn {
  position: relative;
  overflow: hidden;
}

.quick-action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  transition: left 0.5s;
}

.quick-action-btn:hover::before {
  left: 100%;
}

.quick-action-btn:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

/* Focus styles for accessibility */
.quick-action-btn:focus {
  outline: none;
  ring: 2px solid #3b82f6;
  ring-offset: 2px;
}

.dark .quick-action-btn:focus {
  ring-offset-color: #1f2937;
}
</style>