<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  showEditButton: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['edit']);

const initials = computed(() => {
  const first = props.firstName?.charAt(0) || '';
  const last = props.lastName?.charAt(0) || '';
  return `${first}${last}`.toUpperCase();
});

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-xl',
};

const backgroundColor = computed(() => {
  const name = `${props.firstName} ${props.lastName}`.toLowerCase();
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
    'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500',
    'bg-red-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
});
</script>

<template>
  <div class="relative">
    <!-- Avatar con iniciales -->
    <div 
      :class="[
        'rounded-full flex items-center justify-center text-white font-semibold transition-all duration-200 hover:scale-105',
        sizeClasses[size],
        backgroundColor
      ]"
    >
      {{ initials }}
    </div>
    
    <!-- Botón de edición opcional -->
    <button
      v-if="showEditButton"
      @click="$emit('edit')"
      class="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  </div>
</template>

export default {
  name: 'StudentAvatar'
}
