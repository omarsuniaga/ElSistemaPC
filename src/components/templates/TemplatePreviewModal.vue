<!-- Modal Preview de Plantillas -->
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
    >
      <!-- Header -->
      <div
        class="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            👁️ Vista Previa - {{ template.name }}
          </h2>
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            @click="$emit('close')"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Contenido -->
      <div class="p-6 overflow-y-auto">
        <!-- Información de la plantilla -->
        <div class="mb-6">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-700 dark:text-gray-300">Categoría:</span>
              <span
                :class="getCategoryBadgeClass(template.category)"
                class="ml-2 px-2 py-1 text-xs font-medium rounded-full"
              >
                {{ getCategoryLabel(template.category) }}
              </span>
            </div>
            <div>
              <span class="font-medium text-gray-700 dark:text-gray-300">Estado:</span>
              <span
                :class="
                  template.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                "
                class="ml-2 px-2 py-1 text-xs font-medium rounded-full"
              >
                {{ template.isActive ? "Activa" : "Inactiva" }}
              </span>
            </div>
            <div v-if="template.escalationLevel">
              <span class="font-medium text-gray-700 dark:text-gray-300">Escalación:</span>
              <span class="ml-2 text-sm text-red-600 dark:text-red-400">
                Nivel {{ template.escalationLevel }}
              </span>
            </div>
            <div>
              <span class="font-medium text-gray-700 dark:text-gray-300">Variables:</span>
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {{ template.variables.length }}
              </span>
            </div>
          </div>
          <div v-if="template.description" class="mt-3">
            <span class="font-medium text-gray-700 dark:text-gray-300">Descripción:</span>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ template.description }}
            </p>
          </div>
        </div>

        <!-- Editor de variables -->
        <div v-if="template.variables.length > 0" class="mb-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            🎯 Variables Personalizables
          </h3>
          <div class="space-y-3">
            <div
              v-for="variable in template.variables"
              :key="variable.key"
              class="grid grid-cols-3 gap-3 items-center"
            >
              <div class="text-sm font-mono text-blue-600 dark:text-blue-400">
                {{ variable.key }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ variable.description }}
              </div>
              <input
                v-model="variableValues[variable.key]"
                type="text"
                :placeholder="variable.defaultValue"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>

        <!-- Simulador de teléfono -->
        <div class="mb-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            📱 Simulador de WhatsApp
          </h3>
          <div class="max-w-sm mx-auto">
            <!-- Header del chat -->
            <div class="bg-green-600 text-white p-3 rounded-t-lg flex items-center space-x-3">
              <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span class="text-green-600 font-bold text-sm">A</span>
              </div>
              <div>
                <div class="font-medium text-sm">Academia Musical</div>
                <div class="text-xs opacity-75">En línea</div>
              </div>
            </div>

            <!-- Mensaje -->
            <div class="bg-gray-100 dark:bg-gray-600 p-4 min-h-32">
              <div class="bg-green-500 text-white p-3 rounded-lg max-w-xs ml-auto">
                <div class="text-sm leading-relaxed whitespace-pre-wrap">
                  {{ renderedMessage }}
                </div>
                <div class="text-xs opacity-75 mt-2 text-right">
                  {{ currentTime }}
                  <span class="ml-1">✓✓</span>
                </div>
              </div>
            </div>

            <!-- Input del chat (disabled) -->
            <div
              class="bg-white dark:bg-gray-700 p-3 rounded-b-lg border-t border-gray-200 dark:border-gray-600"
            >
              <div class="flex items-center space-x-2 opacity-50 pointer-events-none">
                <div
                  class="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-full text-sm text-gray-500"
                >
                  Escribe un mensaje...
                </div>
                <button class="text-gray-400">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Estadísticas del mensaje -->
        <div class="mb-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            📊 Análisis del Mensaje
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ renderedMessage.length }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Caracteres</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ wordCount }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Palabras</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {{ lineCount }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Líneas</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {{ detectedVariables.length }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Variables</div>
            </div>
          </div>
        </div>

        <!-- Variables detectadas -->
        <div v-if="detectedVariables.length > 0" class="mb-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            🏷️ Variables Detectadas
          </h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="variable in detectedVariables"
              :key="variable"
              class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-mono"
            >
              {{ variable }}
            </span>
          </div>
        </div>
      </div>

      <!-- Footer con acciones -->
      <div
        class="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600"
      >
        <div class="flex space-x-3">
          <button
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            @click="copyToClipboard"
          >
            📋 Copiar Mensaje
          </button>
          <button
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            @click="$emit('close')"
          >
            ❌ Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { templateRenderer } from '../../services/templates/templateRenderer';
import type { MessageTemplate } from '../../services/templates/templateManager';

// Props
interface Props {
  template: MessageTemplate
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  close: []
}>();

// Estado reactivo
const variableValues = ref<Record<string, string>>({});

// Computed
const currentTime = computed(() => {
  return new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
});

const renderedMessage = computed(() => {
  try {
    return templateRenderer.renderTemplate(props.template, variableValues.value);
  } catch (error) {
    console.error('Error renderizando plantilla:', error);
    return props.template.content;
  }
});

const detectedVariables = computed(() => {
  const content = props.template.content || '';
  const matches = content.match(/\{[^}]+\}/g);
  return matches ? [...new Set(matches)] : [];
});

const wordCount = computed(() => {
  return renderedMessage.value.trim().split(/\s+/).length;
});

const lineCount = computed(() => {
  return renderedMessage.value.split('\n').length;
});

// Métodos
const getCategoryBadgeClass = (category: string): string => {
  switch (category) {
  case 'tardanza':
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  case 'ausencia_justificada':
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  case 'inasistencia':
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  case 'general':
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  default:
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getCategoryLabel = (category: string): string => {
  switch (category) {
  case 'tardanza':
    return 'Tardanza';
  case 'ausencia_justificada':
    return 'Justificada';
  case 'inasistencia':
    return 'Inasistencia';
  case 'general':
    return 'General';
  case 'custom':
    return 'Personalizada';
  default:
    return 'Otra';
  }
};

const copyToClipboard = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(renderedMessage.value);
    alert('✅ Mensaje copiado al portapapeles');
  } catch (error) {
    console.error('Error copiando al portapapeles:', error);
    alert('❌ Error copiando al portapapeles');
  }
};

// Inicializar valores de variables
const initializeVariableValues = (): void => {
  const values: Record<string, string> = {};

  // Variables personalizadas de la plantilla
  props.template.variables.forEach((variable) => {
    values[variable.key] = variable.defaultValue || '';
  });

  // Variables globales con valores de ejemplo
  values['{studentName}'] = 'María González';
  values['{className}'] = 'Violín Intermedio';
  values['{date}'] = new Date().toLocaleDateString('es-ES');
  values['{time}'] = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  values['{academyName}'] = 'Academia Musical El Sistema';
  values['{teacherName}'] = 'Prof. Carlos Rodríguez';
  values['{parentName}'] = 'Ana María González';
  values['{phoneNumber}'] = '+58 414-123-4567';

  variableValues.value = values;
};

// Inicializar al montar
initializeVariableValues();
</script>
