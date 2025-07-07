<template>
  <div class="space-y-8">
    <h2 class="text-xl font-bold text-gray-900">📋 Plantillas de Evaluación</h2>
    
    <!-- Selector de Plantillas -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Seleccionar Plantilla</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          v-for="template in evaluationTemplates"
          :key="template.id"
          @click="selectTemplate(template)"
          :class="[
            'p-4 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md',
            selectedTemplate?.id === template.id
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-blue-300'
          ]"
        >
          <div class="flex items-center gap-2">
            <span class="text-2xl">{{ template.icon }}</span>
            <div>
              <div class="font-semibold text-gray-900">{{ template.name }}</div>
              <div class="text-sm text-gray-600">{{ template.description }}</div>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Plantilla Seleccionada -->
    <div v-if="selectedTemplate" class="bg-white rounded-lg shadow-sm p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">{{ selectedTemplate.name }}</h3>
        <button
          @click="useSelectedTemplate"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Usar esta plantilla
        </button>
      </div>

      <component :is="selectedTemplate.component" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GeneralRehearsalTemplate from './GeneralRehearsalTemplate.vue'
import SectionalRehearsalTemplate from './SectionalRehearsalTemplate.vue'
import RowRehearsalTemplate from './RowRehearsalTemplate.vue'

const evaluationTemplates = [
  {
    id: 'general',
    name: 'Ensayo General',
    description: 'Evaluación completa del ensayo con toda la orquesta o coro',
    icon: '🎼',
    component: GeneralRehearsalTemplate
  },
  {
    id: 'sectional',
    name: 'Ensayo Seccional',
    description: 'Evaluación por familias de instrumentos',
    icon: '🎵',
    component: SectionalRehearsalTemplate
  },
  {
    id: 'row',
    name: 'Ensayo por Filas',
    description: 'Evaluación por instrumentos específicos',
    icon: '🎻',
    component: RowRehearsalTemplate
  }
]

const selectedTemplate = ref(null)
const emit = defineEmits(['use-template'])

const selectTemplate = (template) => {
  selectedTemplate.value = template
}

const useSelectedTemplate = () => {
  if (selectedTemplate.value) {
    emit('use-template', selectedTemplate.value)
  }
}
</script>