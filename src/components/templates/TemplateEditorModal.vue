<!-- Modal Editor de Plantillas -->
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
    >
      <!-- Header -->
      <div
        class="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ isEditing ? "✏️ Editar Plantilla" : "➕ Nueva Plantilla" }}
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
      <div class="flex h-[calc(90vh-8rem)]">
        <!-- Panel izquierdo - Editor -->
        <div class="flex-1 p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-600">
          <form class="space-y-6" @submit.prevent="handleSave">
            <!-- Información básica -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                📝 Información Básica
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre
                  </label>
                  <input
                    v-model="formData.name"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Notificación de tardanza"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoría
                  </label>
                  <select
                    v-model="formData.category"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="tardanza">Tardanza</option>
                    <option value="ausencia_justificada">Ausencia Justificada</option>
                    <option value="inasistencia">Inasistencia</option>
                    <option value="general">General</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </div>
              </div>

              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  v-model="formData.description"
                  rows="2"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe el propósito de esta plantilla..."
                />
              </div>
            </div>

            <!-- Configuración -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                ⚙️ Configuración
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nivel de Escalación
                  </label>
                  <select
                    v-model="formData.escalationLevel"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option :value="null">Sin escalación</option>
                    <option :value="1">Nivel 1 - Informativo</option>
                    <option :value="2">Nivel 2 - Recordatorio</option>
                    <option :value="3">Nivel 3 - Urgente</option>
                    <option :value="4">Nivel 4 - Crítico</option>
                  </select>
                </div>
                <div class="flex items-center">
                  <input
                    id="isActive"
                    v-model="formData.isActive"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label for="isActive" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Plantilla activa
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    id="allowEditVariables"
                    v-model="formData.allowEditVariables"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    for="allowEditVariables"
                    class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    Variables editables
                  </label>
                </div>
              </div>
            </div>

            <!-- Editor de contenido -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                💬 Contenido del Mensaje
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    v-model="formData.content"
                    rows="6"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Escribe el contenido del mensaje aquí..."
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Usa variables como {studentName}, {className}, {date}, etc.
                  </p>
                </div>

                <!-- Variables disponibles -->
                <div>
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🏷️ Variables Disponibles
                  </h4>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      v-for="variable in availableVariables"
                      :key="variable.key"
                      type="button"
                      class="text-left p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      @click="insertVariable(variable.key)"
                    >
                      <div class="text-xs font-mono text-blue-600 dark:text-blue-400">
                        {{ variable.key }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ variable.description }}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Variables personalizadas -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                🎯 Variables Personalizadas
              </h3>
              <div class="space-y-3">
                <div
                  v-for="(variable, index) in formData.variables"
                  :key="index"
                  class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <input
                    v-model="variable.key"
                    type="text"
                    placeholder="nombreVariable"
                    class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    v-model="variable.description"
                    type="text"
                    placeholder="Descripción"
                    class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    v-model="variable.defaultValue"
                    type="text"
                    placeholder="Valor por defecto"
                    class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    type="button"
                    class="text-red-600 hover:text-red-800 p-1"
                    @click="removeVariable(index)"
                  >
                    🗑️
                  </button>
                </div>
                <button
                  type="button"
                  class="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  @click="addVariable"
                >
                  ➕ Agregar Variable
                </button>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {{ saving ? "💾 Guardando..." : isEditing ? "💾 Actualizar" : "💾 Crear" }}
              </button>
              <button
                type="button"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                @click="$emit('close')"
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>

        <!-- Panel derecho - Preview -->
        <div class="w-96 p-6 bg-gray-50 dark:bg-gray-700 overflow-y-auto">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">👁️ Vista Previa</h3>

          <!-- Simulador de teléfono -->
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-600"
          >
            <div class="bg-green-500 text-white p-3 rounded-lg">
              <div class="text-xs opacity-75 mb-1">WhatsApp Business</div>
              <div class="text-sm leading-relaxed">
                {{ previewContent }}
              </div>
              <div class="text-xs opacity-75 mt-2 text-right">
                {{ new Date().toLocaleTimeString("es-ES", {hour: "2-digit", minute: "2-digit"}) }}
              </div>
            </div>
          </div>

          <!-- Estadísticas del mensaje -->
          <div class="mt-6 space-y-3">
            <div
              class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
            >
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📊 Estadísticas
              </div>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Caracteres:</span>
                  <span class="font-medium">{{ formData.content.length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Variables:</span>
                  <span class="font-medium">{{ detectedVariables.length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Líneas:</span>
                  <span class="font-medium">{{ formData.content.split("\n").length }}</span>
                </div>
              </div>
            </div>

            <!-- Variables detectadas -->
            <div
              v-if="detectedVariables.length > 0"
              class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
            >
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🏷️ Variables Detectadas
              </div>
              <div class="space-y-1">
                <div
                  v-for="variable in detectedVariables"
                  :key="variable"
                  class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
                >
                  {{ variable }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  templateManager,
  type MessageTemplate,
  type TemplateVariable,
} from '../../services/templates/templateManager';

// Props
interface Props {
  template?: MessageTemplate | null
  isEditing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  template: null,
  isEditing: false,
});

// Emits
const emit = defineEmits<{
  close: []
  save: []
}>();

// Estado reactivo
const saving = ref(false);

// Datos del formulario
const formData = ref<Partial<MessageTemplate>>({
  name: '',
  description: '',
  content: '',
  category: 'general',
  escalationLevel: null,
  isActive: true,
  allowEditVariables: true,
  variables: [],
  usage: {
    totalSent: 0,
    successRate: 0,
    lastUsed: null,
  },
});

// Variables globales disponibles
const availableVariables = ref([
  { key: '{studentName}', description: 'Nombre del estudiante' },
  { key: '{className}', description: 'Nombre de la clase' },
  { key: '{date}', description: 'Fecha actual' },
  { key: '{time}', description: 'Hora actual' },
  { key: '{academyName}', description: 'Nombre de la academia' },
  { key: '{teacherName}', description: 'Nombre del profesor' },
  { key: '{parentName}', description: 'Nombre del representante' },
  { key: '{phoneNumber}', description: 'Número de teléfono' },
]);

// Computed
const detectedVariables = computed(() => {
  const content = formData.value.content || '';
  const matches = content.match(/\{[^}]+\}/g);
  return matches ? [...new Set(matches)] : [];
});

const previewContent = computed(() => {
  let content = formData.value.content || '';

  // Reemplazar variables con valores de ejemplo
  content = content.replace(/\{studentName\}/g, 'María González');
  content = content.replace(/\{className\}/g, 'Violín Intermedio');
  content = content.replace(/\{date\}/g, new Date().toLocaleDateString('es-ES'));
  content = content.replace(
    /\{time\}/g,
    new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  );
  content = content.replace(/\{academyName\}/g, 'Academia Musical El Sistema');
  content = content.replace(/\{teacherName\}/g, 'Prof. Carlos Rodríguez');
  content = content.replace(/\{parentName\}/g, 'Ana María González');
  content = content.replace(/\{phoneNumber\}/g, '+58 414-123-4567');

  // Reemplazar variables personalizadas con sus valores por defecto
  if (formData.value.variables) {
    formData.value.variables.forEach((variable: TemplateVariable) => {
      const regex = new RegExp(`\\{${variable.key}\\}`, 'g');
      content = content.replace(regex, variable.defaultValue || `[${variable.key}]`);
    });
  }

  return content || 'Escribe tu mensaje aquí...';
});

// Métodos
const insertVariable = (variableKey: string): void => {
  const textarea = document.querySelector(
    'textarea[v-model="formData.content"]',
  ) as HTMLTextAreaElement;
  if (textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = formData.value.content || '';

    formData.value.content = content.substring(0, start) + variableKey + content.substring(end);

    // Restaurar el foco y la posición del cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableKey.length, start + variableKey.length);
    }, 0);
  }
};

const addVariable = (): void => {
  if (!formData.value.variables) {
    formData.value.variables = [];
  }
  formData.value.variables.push({
    key: '',
    description: '',
    defaultValue: '',
  });
};

const removeVariable = (index: number): void => {
  if (formData.value.variables) {
    formData.value.variables.splice(index, 1);
  }
};

const handleSave = async (): Promise<void> => {
  saving.value = true;

  try {
    // Validar campos requeridos
    if (!formData.value.name || !formData.value.content) {
      alert('❌ Por favor completa todos los campos requeridos');
      return;
    }

    // Preparar datos para guardar
    const templateData: MessageTemplate = {
      ...formData.value,
      id: props.isEditing ? props.template?.id : undefined,
      isSystem: false,
      createdAt: props.isEditing ? props.template?.createdAt : new Date(),
      updatedAt: new Date(),
    } as MessageTemplate;

    // Guardar plantilla
    let success = false;
    if (props.isEditing && templateData.id) {
      success = await templateManager.updateTemplate(templateData.id, templateData);
    } else {
      const newId = await templateManager.createTemplate(templateData);
      success = !!newId;
    }

    if (success) {
      alert('✅ Plantilla guardada exitosamente');
      emit('save');
    } else {
      alert('❌ Error guardando la plantilla');
    }
  } catch (error) {
    console.error('Error guardando plantilla:', error);
    alert('❌ Error guardando la plantilla');
  } finally {
    saving.value = false;
  }
};

// Watchers
watch(
  () => props.template,
  (newTemplate) => {
    if (newTemplate) {
      formData.value = { ...newTemplate };
    }
  },
  { immediate: true },
);
</script>
