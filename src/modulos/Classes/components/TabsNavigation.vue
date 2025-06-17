<template>
  <nav class="border-b border-gray-200 dark:border-gray-700">
    <ul class="flex -mb-px space-x-8" aria-label="Tabs">
      <li v-for="tab in tabs" :key="tab.id">
        <button
          @click="selectTab(tab.id)"
          :class="[
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
            tab.id === activeTab
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
          ]"
          :aria-current="tab.id === activeTab ? 'page' : undefined"
        >
          {{ tab.label }}
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  tabs: Tab[];
  activeTab: string;
}>();

const emit = defineEmits<{
  (e: 'select-tab', id: string): void;
}>();

const selectTab = (tabId: string) => {
  emit('select-tab', tabId);
};
</script>

<style scoped>
/* Add any additional styling if necessary */
</style>
