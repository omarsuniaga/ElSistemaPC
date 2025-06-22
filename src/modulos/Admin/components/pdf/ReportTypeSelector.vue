<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Tipo de Reporte
      </h3>
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ selectedReportType ? getReportTypeById(selectedReportType)?.name : 'Selecciona un tipo' }}
      </span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="type in reportTypes"
        :key="type.id"
        @click="$emit('update:modelValue', type.id)"
        class="relative cursor-pointer group"
      >
        <div
          :class="[
            'p-4 rounded-xl border-2 transition-all duration-200',
            'hover:shadow-lg hover:scale-105',
            selectedReportType === type.id
              ? `${iconColors[type.color].border} ${iconColors[type.color].bg} border-2`
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
          ]"
        >
          <!-- Icono -->
          <div class="flex items-center justify-between mb-3">
            <div
              :class="[
                'w-12 h-12 rounded-lg flex items-center justify-center',
                selectedReportType === type.id
                  ? iconColors[type.color].bg
                  : 'bg-gray-100 dark:bg-gray-700'
              ]"
            >
              <component
                :is="getIconComponent(type.icon)"
                :class="[
                  'w-6 h-6',
                  selectedReportType === type.id
                    ? iconColors[type.color].text
                    : 'text-gray-600 dark:text-gray-400'
                ]"
              />
            </div>
            
            <!-- Checkbox visual -->
            <div
              :class="[
                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                selectedReportType === type.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
              ]"
            >
              <CheckIcon
                v-if="selectedReportType === type.id"
                class="w-3 h-3 text-white"
              />
            </div>
          </div>

          <!-- Contenido -->
          <div class="space-y-2">
            <h4
              :class="[
                'font-semibold text-sm',
                selectedReportType === type.id
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300'
              ]"
            >
              {{ type.name }}
            </h4>
            <p
              :class="[
                'text-xs leading-relaxed',
                selectedReportType === type.id
                  ? 'text-gray-600 dark:text-gray-400'
                  : 'text-gray-500 dark:text-gray-500'
              ]"
            >
              {{ type.description }}
            </p>
          </div>

          <!-- Campos incluidos -->
          <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="field in type.fields.slice(0, 3)"
                :key="field"
                :class="[
                  'px-2 py-1 text-xs rounded-full',
                  selectedReportType === type.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                ]"
              >
                {{ getFieldLabel(field) }}
              </span>
              <span
                v-if="type.fields.length > 3"
                :class="[
                  'px-2 py-1 text-xs rounded-full',
                  selectedReportType === type.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                ]"
              >
                +{{ type.fields.length - 3 }}
              </span>
            </div>
          </div>
        </div>

        <!-- Efecto de selección -->
        <div
          v-if="selectedReportType === type.id"
          class="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"
        />
      </div>
    </div>

    <!-- Información adicional -->
    <div
      v-if="selectedReportType"
      class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
    >
      <div class="flex items-start space-x-3">
        <InformationCircleIcon class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div class="flex-1">
          <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">
            Información del reporte seleccionado
          </h4>
          <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
            {{ getReportTypeById(selectedReportType)?.description }}
          </p>
          <div class="mt-2">
            <span class="text-xs text-blue-600 dark:text-blue-400">
              Campos disponibles: {{ getReportTypeById(selectedReportType)?.fields.length }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  UserGroupIcon,
  AcademicCapIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  CheckIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import { usePDFReportTypes } from '../../composables/usePDFReportTypes'

// Props
interface Props {
  modelValue: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Composables
const { reportTypes, iconColors, getReportTypeById, getFieldLabel } = usePDFReportTypes()

// Computed
const selectedReportType = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Funciones
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    UserGroupIcon,
    AcademicCapIcon,
    UserIcon,
    ClipboardDocumentCheckIcon,
    ChartBarIcon
  }
  return iconMap[iconName] || UserGroupIcon
}
</script> 