<template>
  <div v-if="isVisible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <!-- Icon -->
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full" :class="iconBgClass">
          <component :is="iconComponent" class="h-6 w-6" :class="iconColorClass" />
        </div>
        
        <!-- Title -->
        <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">
          {{ title }}
        </h3>
        
        <!-- Message -->
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500">
            {{ message }}
          </p>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center justify-center space-x-3 px-4 py-3">
          <button
            @click="$emit('cancel')"
            class="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {{ cancelText }}
          </button>
          <button
            @click="$emit('confirm')"
            :disabled="loading"
            class="px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
            :class="confirmButtonClass"
          >
            {{ loading ? loadingText : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/vue/24/outline'

// Props
const props = withDefaults(defineProps<{
  isVisible: boolean
  title: string
  message: string
  type?: 'warning' | 'danger' | 'info' | 'success'
  confirmText?: string
  cancelText?: string
  loadingText?: string
  loading?: boolean
}>(), {
  type: 'warning',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  loadingText: 'Procesando...',
  loading: false
})

// Emits
defineEmits<{
  'confirm': []
  'cancel': []
}>()

// Computed styles based on type
const iconComponent = computed(() => {
  switch (props.type) {
    case 'danger':
      return ExclamationTriangleIcon
    case 'info':
      return InformationCircleIcon
    case 'success':
      return CheckCircleIcon
    case 'warning':
    default:
      return ExclamationTriangleIcon
  }
})

const iconBgClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-red-100'
    case 'info':
      return 'bg-blue-100'
    case 'success':
      return 'bg-green-100'
    case 'warning':
    default:
      return 'bg-yellow-100'
  }
})

const iconColorClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'text-red-600'
    case 'info':
      return 'text-blue-600'
    case 'success':
      return 'text-green-600'
    case 'warning':
    default:
      return 'text-yellow-600'
  }
})

const confirmButtonClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    case 'info':
      return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    case 'success':
      return 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    case 'warning':
    default:
      return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
  }
})
</script>
