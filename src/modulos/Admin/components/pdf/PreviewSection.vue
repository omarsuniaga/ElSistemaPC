<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Vista Previa
      </h3>
      <button
        @click="generatePreview"
        :disabled="isLoading"
        class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:text-gray-400"
      >
        {{ isLoading ? 'Generando...' : 'Actualizar' }}
      </button>
    </div>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Generando vista previa...
      </p>
    </div>

    <!-- Estado vacío -->
    <div
      v-else-if="!previewData.length"
      class="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
      <DocumentIcon class="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
        No hay datos para mostrar
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-500">
        Configura los filtros y genera una vista previa
      </p>
    </div>

    <!-- Lista de datos -->
    <div v-else class="space-y-3">
      <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Mostrando {{ previewData.length }} registros</span>
        <span class="text-xs">Vista previa limitada</span>
      </div>

      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="(item, index) in previewData"
          :key="index"
          class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ item.name || `Registro ${index + 1}` }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-500">
              #{{ index + 1 }}
            </span>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div v-if="item.age" class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Edad:</span>
              <span class="text-gray-900 dark:text-white">{{ item.age }} años</span>
            </div>
            <div v-if="item.instrumentName" class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Instrumento:</span>
              <span class="text-gray-900 dark:text-white">{{ item.instrumentName }}</span>
            </div>
            <div v-if="item.teacherName" class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Maestro:</span>
              <span class="text-gray-900 dark:text-white">{{ item.teacherName }}</span>
            </div>
            <div v-if="item.className" class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Clase:</span>
              <span class="text-gray-900 dark:text-white">{{ item.className }}</span>
            </div>
            <div v-if="item.schedule" class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Horario:</span>
              <span class="text-gray-900 dark:text-white">{{ item.schedule }}</span>
            </div>
            <div v-if="item.status" class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Estado:</span>
              <span
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  item.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  item.status === 'inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                ]"
              >
                {{ getStatusText(item.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Información adicional -->
      <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div class="flex items-center space-x-2 mb-2">
          <InformationCircleIcon class="w-4 h-4 text-blue-600" />
          <span class="text-sm font-medium text-blue-900 dark:text-blue-100">
            Información de la vista previa
          </span>
        </div>
        <div class="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p>• Se muestran los primeros 10 registros filtrados</p>
          <p>• Los datos se actualizan automáticamente al cambiar filtros</p>
          <p>• El PDF final incluirá todos los registros que cumplan los criterios</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DocumentIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'

// Props
interface Props {
  selectedReportType: string
  previewData: any[]
  isLoading: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'generate-preview': []
}>()

// Funciones
const generatePreview = () => {
  emit('generate-preview')
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return 'Activo'
    case 'inactive':
      return 'Inactivo'
    case 'pending':
      return 'Pendiente'
    default:
      return status
  }
}
</script> 