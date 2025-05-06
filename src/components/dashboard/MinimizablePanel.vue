<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  panelId: {
    type: String,
    default: () => `panel-${Math.random().toString(36).substring(2, 9)}`
  },
  iconClass: {
    type: String,
    default: 'text-blue-500 bg-blue-100'
  },
  iconPath: {
    type: String,
    default: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
  }
});

const isMinimized = ref(false);

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value;
  localStorage.setItem(`panel-${props.panelId}-minimized`, isMinimized.value.toString());
};

onMounted(() => {
  // Restore state from localStorage
  const savedState = localStorage.getItem(`panel-${props.panelId}-minimized`);
  if (savedState) {
    isMinimized.value = savedState === 'true';
  }
});
</script>

<template>
  <div class="panel-card bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
    <!-- Header - clickable for minimize/maximize -->
    <div 
      @click="toggleMinimize" 
      class="flex justify-between items-center p-4 cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center">
        <div :class="`rounded-full p-2 shadow-sm mr-3 ${iconClass} dark:bg-opacity-20`">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconPath" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
      </div>
      
      <!-- Indicator for expandable state -->
      <div class="text-gray-400 dark:text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path v-if="!isMinimized" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
    
    <!-- Panel content - can be minimized -->
    <div v-if="!isMinimized" class="panel-content bg-white dark:bg-gray-800">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.panel-card {
  transition: all 0.3s ease;
}
</style>
