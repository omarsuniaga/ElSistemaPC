<template>
  <div class="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div :class="[`bg-${color}-100 dark:bg-${color}-900`, `text-${color}-600 dark:text-${color}-400`]" class="p-2 rounded-lg">
          <component :is="iconComponent" class="w-6 h-6" />
        </div>
        <div>
          <h3 class="font-bold text-lg text-gray-900 dark:text-white">{{ title }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ description }}</p>
        </div>
      </div>
      
      <div class="text-right">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ count }}</div>
        <div class="text-sm text-green-600 dark:text-green-400">+{{ recent }} esta semana</div>
      </div>
    </div>
    
    <div class="flex items-center justify-between">
      <RouterLink 
        :to="route"
        class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
      >
        Ver Todos
      </RouterLink>
      
      <div class="flex items-center space-x-2">
        <button
          @click="$emit('action', 'create')"
          class="bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-600 dark:text-green-400 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
        >
          Crear
        </button>
        <button
          @click="$emit('action', 'export')"
          class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
        >
          Exportar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as HeroIcons from '@heroicons/vue/24/outline'

interface Props {
  title: string
  description: string
  icon: string
  count: number
  recent: number
  color: string
  route: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  action: [action: string]
}>()

const iconComponent = computed(() => {
  return (HeroIcons as any)[props.icon] || HeroIcons.CogIcon
})
</script>
