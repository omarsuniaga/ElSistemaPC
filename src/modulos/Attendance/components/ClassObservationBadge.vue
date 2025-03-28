<template>
  <div 
    @click="handleClick"
    class="group relative inline-flex items-center px-3 py-1 rounded-full border cursor-pointer transition-all"
    :class="[hasObservations ? 
      'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40' : 
      'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700']"
  >
    <ChatBubbleLeftRightIcon class="h-4 w-4 mr-1.5" />
    <span class="text-xs font-medium">
      {{ hasObservations ? 'Ver observaciones' : 'Agregar observación' }}
    </span>
    
    <!-- Tooltip de vista previa -->
    <div v-if="hasObservations && observations" 
        class="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
      <div class="bg-gray-900 text-white text-xs p-2 rounded shadow">
        <div class="max-h-32 overflow-y-auto text-left">
          <div class="font-semibold mb-1">Observaciones:</div>
          {{ truncateObservation(observations) }}
        </div>
        <div class="mt-1 text-blue-300 text-center">Click para editar</div>
        <div class="arrow-down"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline';
import { computed } from 'vue';

const props = defineProps<{
  observations: string;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const hasObservations = computed(() => {
  return !!props.observations && props.observations.trim().length > 0;
});

const handleClick = () => {
  emit('click');
};

const truncateObservation = (text: string, maxLength = 150) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
</script>

<style scoped>
.arrow-down {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0; 
  height: 0; 
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #1f2937; /* bg-gray-900 */
}
</style>
