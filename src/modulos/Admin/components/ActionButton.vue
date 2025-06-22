<template>
  <button 
    :class="[
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      sizeClasses,
      variantClasses,
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <component 
      v-if="icon" 
      :is="icon" 
      :class="[
        label ? 'mr-2' : '',
        iconSizeClasses
      ]" 
    />
    <span v-if="label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  icon?: any
  label?: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'md',
  disabled: false
})

defineEmits<{
  (e: 'click'): void
}>()

const sizeClasses = computed(() => {
  const sizeMap = {
    xs: 'px-2 py-1 text-xs rounded',
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg'
  }
  return sizeMap[props.size]
})

const iconSizeClasses = computed(() => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  return sizeMap[props.size]
})

const variantClasses = computed(() => {
  const variantMap = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 border border-blue-600',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 focus:ring-gray-500 border border-gray-300 dark:border-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 border border-green-600',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500 border border-yellow-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 border border-red-600',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-gray-500 border border-transparent'
  }
  return variantMap[props.variant]
})
</script>
