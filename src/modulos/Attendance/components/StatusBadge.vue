<!--
  🏷️ BADGE DE ESTADO - COMPONENTE ATÓMICO
  Muestra el estado visual de una clase
-->
<template>
  <span 
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="badgeClasses"
  >
    <span :class="dotClasses" class="w-1.5 h-1.5 rounded-full mr-1.5" />
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type StatusType = 'completed' | 'pending' | 'readonly'

interface Props {
  status: StatusType
}

const props = defineProps<Props>();

const statusConfig = {
  completed: {
    text: 'Completada',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    dotClass: 'bg-green-500',
  },
  pending: {
    text: 'Pendiente',
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    dotClass: 'bg-yellow-500',
  },
  readonly: {
    text: 'Solo lectura',
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    dotClass: 'bg-gray-500',
  },
};

const statusText = computed(() => statusConfig[props.status].text);
const badgeClasses = computed(() => statusConfig[props.status].badgeClass);
const dotClasses = computed(() => statusConfig[props.status].dotClass);
</script>
