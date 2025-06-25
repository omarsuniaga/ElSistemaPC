<template>
  <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div 
            class="w-12 h-12 rounded-lg flex items-center justify-center text-white"
            :style="{ backgroundColor: tool.color }"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" v-html="tool.icon"/>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">{{ tool.name }}</h3>
            <p class="text-sm text-gray-500">{{ tool.category }}</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <span 
            v-if="tool.isNew"
            class="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full"
          >
            Nuevo
          </span>
          <span 
            v-if="tool.isPremium"
            class="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full"
          >
            Premium
          </span>
          <button
            @click="toggleFavorite"
            class="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg 
              class="w-5 h-5"
              :class="isFavorite ? 'text-yellow-400' : 'text-gray-400'"
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Description -->
      <p class="text-gray-600 text-sm mb-4 leading-relaxed">
        {{ tool.description }}
      </p>

      <!-- Features -->
      <div v-if="tool.features && tool.features.length > 0" class="mb-4">
        <h4 class="text-sm font-medium text-gray-900 mb-2">Características:</h4>
        <ul class="text-sm text-gray-600 space-y-1">
          <li 
            v-for="feature in tool.features.slice(0, 3)" 
            :key="feature"
            class="flex items-center"
          >
            <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            {{ feature }}
          </li>
        </ul>
        <p v-if="tool.features.length > 3" class="text-xs text-gray-500 mt-1">
          +{{ tool.features.length - 3 }} características más
        </p>
      </div>

      <!-- Stats -->
      <div v-if="tool.stats" class="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div v-for="stat in tool.stats" :key="stat.label" class="text-center">
          <p class="text-lg font-semibold" :class="getStatColor(stat.type)">{{ stat.value }}</p>
          <p class="text-xs text-gray-600">{{ stat.label }}</p>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="tool.tags && tool.tags.length > 0" class="flex flex-wrap gap-2 mb-4">
        <span 
          v-for="tag in tool.tags" 
          :key="tag"
          class="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded"
        >
          {{ tag }}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-4 border-t border-gray-200">
        <div class="flex items-center space-x-4">
          <div v-if="tool.lastUsed" class="text-xs text-gray-500">
            Usado: {{ formatDate(tool.lastUsed) }}
          </div>
          <div v-if="tool.usage" class="text-xs text-gray-500">
            Uso: {{ tool.usage }}%
          </div>
        </div>
        
        <div class="flex space-x-2">
          <button
            v-if="tool.hasSettings"
            @click="openSettings"
            class="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
          >
            Configurar
          </button>
          <button
            @click="useTool"
            class="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
            :style="{ backgroundColor: tool.color }"
            :disabled="tool.isDisabled"
            :class="{ 'opacity-50 cursor-not-allowed': tool.isDisabled }"
          >
            {{ tool.actionText || 'Usar' }}
          </button>
        </div>
      </div>

      <!-- Status indicator -->
      <div v-if="tool.status" class="absolute top-4 right-4">
        <div 
          class="w-3 h-3 rounded-full"
          :class="getStatusColor(tool.status)"
          :title="tool.status"
        />
      </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="isLoading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"/>
        <span class="text-sm text-gray-600">{{ loadingText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface ToolStat {
  label: string
  value: string | number
  type: 'success' | 'warning' | 'error' | 'info'
}

interface AdvancedTool {
  id: string
  name: string
  description: string
  category: string
  color: string
  icon: string
  isNew?: boolean
  isPremium?: boolean
  hasSettings?: boolean
  actionText?: string
  isDisabled?: boolean
  features?: string[]
  tags?: string[]
  stats?: ToolStat[]
  lastUsed?: Date
  usage?: number
  status?: 'online' | 'offline' | 'maintenance'
}

const props = defineProps<{
  tool: AdvancedTool
  favoriteTools?: string[]
}>()

const emit = defineEmits<{
  useTool: [toolId: string]
  openSettings: [toolId: string]
  toggleFavorite: [toolId: string, isFavorite: boolean]
}>()

// State
const isLoading = ref(false)
const loadingText = ref('Cargando...')

// Computed
const isFavorite = computed(() => {
  return props.favoriteTools?.includes(props.tool.id) || false
})

// Methods
const useTool = () => {
  if (props.tool.isDisabled) return
  
  isLoading.value = true
  loadingText.value = 'Iniciando herramienta...'
  
  // Simular delay de carga
  setTimeout(() => {
    isLoading.value = false
    emit('useTool', props.tool.id)
  }, 1000)
}

const openSettings = () => {
  emit('openSettings', props.tool.id)
}

const toggleFavorite = () => {
  emit('toggleFavorite', props.tool.id, !isFavorite.value)
}

const getStatColor = (type: string) => {
  const colors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600'
  }
  return colors[type as keyof typeof colors] || 'text-gray-600'
}

const getStatusColor = (status: string) => {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    maintenance: 'bg-yellow-500'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-500'
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short'
  }).format(date)
}
</script>

<style scoped>
.relative {
  position: relative;
}

.absolute {
  position: absolute;
}
</style>
