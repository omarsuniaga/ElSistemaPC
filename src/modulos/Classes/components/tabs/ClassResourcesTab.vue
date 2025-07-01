<template>
  <div class="class-resources-tab p-4">
    <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
      Recursos de la Clase
    </h3>
    <div v-if="classData && classData.resources && classData.resources.length > 0">
      <ul class="space-y-3">
        <li
          v-for="(resource, index) in classData.resources"
          :key="index"
          class="p-3 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm"
        >
          <a
            :href="resource.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {{ resource.title }}
          </a>
          <p v-if="resource.description" class="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {{ resource.description }}
          </p>
        </li>
      </ul>
    </div>
    <div v-else-if="classData">
      <p class="text-gray-500 dark:text-gray-400">No hay recursos disponibles para esta clase.</p>
    </div>
    <div v-else>
      <p class="text-gray-500 dark:text-gray-400">No hay información de recursos disponible.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {PropType} from "vue"
import type {ClassData, ClassResource} from "../../types/class" // Adjust path as necessary

const props = defineProps({
  classData: {
    type: Object as PropType<ClassData | null>,
    default: null,
  },
})
</script>

<style scoped>
.class-resources-tab {
  /* Add any specific styling for this tab */
}
</style>
