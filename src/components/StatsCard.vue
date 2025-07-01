<template>
  <div
    class="relative overflow-hidden rounded-lg p-6"
    :class="bgColorClass || 'bg-white dark:bg-gray-800'"
  >
    <dt>
      <div class="absolute rounded-md p-3" :class="iconColorClass || 'text-gray-500'">
        <component :is="icon" class="h-6 w-6" aria-hidden="true" />
      </div>
      <p class="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">{{ title }}</p>
    </dt>
    <dd class="ml-16 flex items-baseline">
      <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ value }}</p>
    </dd>
  </div>
</template>

<script setup lang="ts">
// Change the import to get the Component type correctly
import type {FunctionalComponent, SVGAttributes} from "vue"

defineProps<{
  icon: FunctionalComponent<SVGAttributes>
  title: string
  value: number
  bgColorClass?: string
  iconColorClass?: string
}>()
</script>
