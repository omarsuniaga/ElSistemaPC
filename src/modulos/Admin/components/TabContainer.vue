<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
  >
    <!-- Tab Navigation -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="flex space-x-8 px-6" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
          ]"
          @click="$emit('update:activeTab', tab.id)"
        >
          <component :is="tab.icon" class="w-5 h-5 inline mr-2" />
          {{ tab.name }}
          <span
            v-if="tab.count !== undefined && tab.count > 0"
            class="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs"
          >
            {{ tab.count }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="p-6">
      <slot :active-tab="activeTab" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Tab {
  id: string
  name: string
  icon: any
  count?: number
}

interface Props {
  tabs: Tab[]
  activeTab: string
}

defineProps<Props>()

defineEmits<{
  (e: "update:activeTab", value: string): void
}>()
</script>
