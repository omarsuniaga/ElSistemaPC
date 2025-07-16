<!--
  👨‍🏫 BADGE DE ROL - COMPONENTE ATÓMICO
  Muestra el rol del maestro en la clase
-->
<template>
  <span 
    class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
    :class="roleClasses"
  >
    <svg :class="iconClasses" class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
      <path v-if="role === 'primary'" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path v-else d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
    </svg>
    {{ roleText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type RoleType = 'primary' | 'collaborator'

interface Props {
  role: RoleType
}

const props = defineProps<Props>();

const roleConfig = {
  primary: {
    text: 'Principal',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  collaborator: {
    text: 'Colaborador',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    iconClass: 'text-purple-600 dark:text-purple-400',
  },
};

const roleText = computed(() => roleConfig[props.role].text);
const roleClasses = computed(() => roleConfig[props.role].badgeClass);
const iconClasses = computed(() => roleConfig[props.role].iconClass);
</script>
