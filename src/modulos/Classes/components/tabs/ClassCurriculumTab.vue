<template>
  <div class="class-curriculum-tab p-4">
    <h3 class="text-xl font-semibold mb-4 text-gray-800">Currículo de la Clase</h3>
    <div v-if="classData && classData.curriculum && classData.curriculum.length > 0">
      <ul class="list-disc pl-5 space-y-2">
        <li v-for="(item, index) in classData.curriculum" :key="index" class="text-gray-700">
          {{ item }}
        </li>
      </ul>
    </div>
    <div v-else-if="classData">
      <p class="text-gray-500">El currículo para esta clase aún no ha sido definido.</p>
    </div>
    <div v-else>
      <p class="text-gray-500">No hay información de currículo disponible.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, PropType } from 'vue';
import type { ClassData } from '../../types/class'; // Adjust path as necessary

const props = defineProps({
  classData: {
    type: Object as PropType<ClassData | null>,
    default: null
  }
});
</script>

<style scoped>
.class-curriculum-tab {
  /* Add any specific styling for this tab */
}
</style>
