<template>
  <div class="card hover:shadow-md transition-shadow duration-300">
    <h3 class="text-lg font-semibold mb-4 flex items-center">
      <component :is="icon" class="w-5 h-5 mr-2" />
      {{ title }}
    </h3>
    <div class="h-64">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type {FunctionalComponent, SVGAttributes} from "vue"

defineProps<{
  title: string
  icon: FunctionalComponent<SVGAttributes>
  iconClass?: string
}>()
</script>
