<script setup lang="ts">
import {computed, ref} from "vue"

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    required: true,
  },
  icon: {
    type: String,
    default: "calendar",
  },
  color: {
    type: String,
    default: "blue",
  },
  cardId: {
    type: String,
    default: () => `card-${Math.random().toString(36).substring(2, 9)}`,
  },
})

const isMinimized = ref(false)

// Map of icon SVG paths for different types
const iconPaths = {
  calendar:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  alert: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  users:
    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
}

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
  localStorage.setItem(`kpi-${props.cardId}-minimized`, isMinimized.value.toString())
}

// Restore minimized state from localStorage on mount
const initializeMinimizedState = () => {
  const savedState = localStorage.getItem(`kpi-${props.cardId}-minimized`)
  if (savedState) {
    isMinimized.value = savedState === "true"
  }
}

// Call this function immediately
initializeMinimizedState()
</script>

<template>
  <div
    class="kpi-card rounded-lg shadow-lg transition-all duration-300 dark:bg-gray-800 bg-white overflow-hidden"
    :class="[isMinimized ? 'minimized-card' : 'p-5']"
  >
    <!-- Make the entire header clickable -->
    <div
      class="flex justify-between items-center cursor-pointer hover:bg-opacity-80 transition-all duration-200"
      :class="[isMinimized ? 'p-4' : '']"
      @click="toggleMinimize"
    >
      <div class="flex items-center">
        <div
          :class="`text-${color}-600 dark:text-${color}-400 bg-${color}-100 dark:bg-${color}-900 rounded-full p-2 shadow-sm mr-3`"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              :d="iconPaths[icon]"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ title }}
          <span
            v-if="isMinimized"
            class="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400"
          >
            ({{ value }})
          </span>
        </h3>
      </div>

      <!-- Indicator for expandable state -->
      <div class="text-gray-400 dark:text-gray-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            v-if="!isMinimized"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
          <path
            v-else
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>

    <div v-if="!isMinimized" class="mt-4">
      <div class="flex items-baseline">
        <div class="text-3xl font-bold text-gray-800 dark:text-gray-200">{{ value }}</div>
      </div>

      <div class="mt-3">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.kpi-card {
  min-height: 60px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.minimized-card {
  min-height: auto;
}

.dark .kpi-card {
  border-color: rgba(255, 255, 255, 0.05);
}
</style>
