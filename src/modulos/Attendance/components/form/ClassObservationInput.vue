<!--
🎯 CLASS OBSERVATION INPUT
Editor optimizado para observaciones de clase con funciones inteligentes
-->

<template>
  <div class="class-observation-input">
    <!-- Encabezado compacto cuando no está enfocado -->
    <div
      v-if="!isExpanded"
      class="cursor-text p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      @click="handleFocus"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-xl">{{ selectedCategoryInfo.icon }}</span>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ localValue || props.placeholder || "Agregar observación de clase..." }}
          </span>
        </div>
        <PencilIcon class="h-4 w-4 text-gray-400" />
      </div>
    </div>

    <!-- Editor expandido -->
    <div
      v-else
      class="border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all"
      :class="{'border-red-300 dark:border-red-600': isAtLimit}"
    >
      <!-- Barra de categorías -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
      >
        <div class="w-full mb-2 sm:mb-0">
          <div class="flex items-center mb-1 sm:mb-0">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-1">Categoría:</span>
          </div>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="categoryItem in categoryOptions"
              :key="categoryItem.key"
              type="button"
              class="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-md border transition-colors"
              :class="[
                localCategory === categoryItem.key
                  ? categoryItem.color
                  : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50',
                props.disabled && 'opacity-50 cursor-not-allowed',
              ]"
              :disabled="props.disabled"
              @click="updateCategory(categoryItem.key as any)"
            >
              <span class="mr-0.5">{{ categoryItem.icon }}</span>
              {{ categoryItem.label }}
            </button>
          </div>
        </div>

        <!-- Opciones adicionales -->
        <div class="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
          <!-- Privacidad -->
          <label class="inline-flex items-center text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
            <input
              v-model="localIsPrivate"
              type="checkbox"
              class="form-checkbox h-3 w-3 text-blue-600 rounded"
              :disabled="props.disabled"
              @change="updatePrivacy(localIsPrivate)"
            />
            <span class="ml-1 text-gray-600 dark:text-gray-400">Privada</span>
          </label>

          <!-- Plantillas -->
          <div v-if="props.showTemplates && filteredTemplates.length > 0" class="relative">
            <button
              type="button"
              class="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              :disabled="props.disabled"
              @click="showTemplateList = !showTemplateList"
            >
              <BookmarkIcon class="h-3 w-3 mr-0.5" />
              Plantillas
            </button>

            <!-- Lista de plantillas -->
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showTemplateList"
                class="absolute right-0 z-10 mt-1 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"
              >
                <div class="py-1 max-h-48 overflow-y-auto">
                  <button
                    v-for="template in filteredTemplates"
                    :key="template.id"
                    type="button"
                    class="group flex flex-col items-start w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="selectTemplate(template)"
                  >
                    <span class="font-medium">{{ template.title }}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {{ template.content }}
                    </span>
                  </button>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- Área de texto principal -->
      <div class="p-3">
        <textarea
          ref="textareaRef"
          v-model="localValue"
          :placeholder="props.placeholder || 'Escribe tu observación aquí...'"
          :maxlength="maxChars"
          :disabled="props.disabled"
          class="w-full min-h-24 max-h-40 resize-none border-0 focus:ring-0 text-sm text-gray-900 dark:text-white bg-transparent placeholder-gray-500 dark:placeholder-gray-400"
          @focus="handleFocus"
          @blur="handleBlur"
        />

        <!-- Acciones rápidas -->
        <div v-if="localValue" class="mt-2 flex items-center justify-between">
          <div class="flex space-x-2">
            <button
              type="button"
              class="text-xs text-blue-600 hover:text-blue-800 font-medium"
              @click="insertQuickText('Excelente participación. ')"
            >
              + Participación
            </button>
            <button
              type="button"
              class="text-xs text-blue-600 hover:text-blue-800 font-medium"
              @click="insertQuickText('Necesita mejorar atención. ')"
            >
              + Atención
            </button>
            <button
              type="button"
              class="text-xs text-blue-600 hover:text-blue-800 font-medium"
              @click="insertQuickText('Progreso notable. ')"
            >
              + Progreso
            </button>
          </div>

          <button
            type="button"
            class="text-xs text-red-600 hover:text-red-800 font-medium"
            @click="clearInput"
          >
            Limpiar
          </button>
        </div>
      </div>

      <!-- Pie con contador y acciones -->
      <div
        class="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
      >
        <!-- Contador de caracteres -->
        <div class="flex items-center space-x-2">
          <span
            class="text-xs"
            :class="[
              isNearLimit ? 'text-yellow-600' : 'text-gray-500',
              isAtLimit && 'text-red-600',
            ]"
          >
            {{ characterCount }}/{{ maxChars }}
          </span>
          <div
            v-if="isNearLimit"
            class="w-2 h-2 rounded-full"
            :class="isAtLimit ? 'bg-red-500' : 'bg-yellow-500'"
          />
        </div>

        <!-- Descripción de categoría -->
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ selectedCategoryInfo.description }}
        </span>
      </div>
    </div>

    <!-- Indicador de auto-guardado -->
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="transform translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-2 opacity-0"
    >
      <div
        v-if="props.autoSave && localValue.trim()"
        class="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center"
      >
        <div class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
        Guardado automáticamente
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es';
import { ref, computed, watch, nextTick } from 'vue';
import { PencilIcon, BookmarkIcon } from '@heroicons/vue/24/outline';

// Types
interface IObservationTemplate {
  id: string
  title: string
  content: string
  category: 'positive' | 'attention' | 'behavior' | 'academic' | 'general'
}

interface IClassObservation {
  id?: string
  content: string
  category: 'positive' | 'attention' | 'behavior' | 'academic' | 'general'
  isPrivate: boolean
}

// Props
const props = defineProps<{
  modelValue: string;
  category?: string;
  isPrivate?: boolean;
  placeholder?: string;
  maxChars?: number;
  autoSave?: boolean;
  autoSaveInterval?: number;
  disabled?: boolean;
  showTemplates?: boolean;
  templates?: IObservationTemplate[];
}>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:category': [category: 'positive' | 'attention' | 'behavior' | 'academic' | 'general']
  'update:isPrivate': [isPrivate: boolean]
  save: [observation: ClassObservation]
  'template-selected': [template: ObservationTemplate]
}>();

// Estado local
const textareaRef = ref<HTMLTextAreaElement>();
const localValue = ref(props.modelValue || '');
const localCategory = ref(props.category || 'general');
const localIsPrivate = ref(props.isPrivate || false);
const showTemplateList = ref(false);
const isFocused = ref(false);
const isExpanded = ref(false);

// Computed properties
const characterCount = computed(() => localValue.value.length);
const maxChars = computed(() => props.maxLength || 500);
const isNearLimit = computed(() => characterCount.value > maxChars.value * 0.8);
const isAtLimit = computed(() => characterCount.value >= maxChars.value);

const categoryOptions = computed(() => [
  {
    key: 'positive',
    label: 'Positiva',
    icon: '✅',
    color: 'text-green-600 bg-green-50 border-green-200',
    description: 'Reconocimientos y aspectos destacados',
  },
  {
    key: 'attention',
    label: 'Atención',
    icon: '🔔',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    description: 'Puntos que requieren seguimiento',
  },
  {
    key: 'behavior',
    label: 'Comportamiento',
    icon: '👥',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: 'Aspectos de conducta y participación',
  },
  {
    key: 'academic',
    label: 'Académico',
    icon: '📚',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    description: 'Progreso y rendimiento académico',
  },
  {
    key: 'general',
    label: 'General',
    icon: '📝',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    description: 'Observaciones generales de la clase',
  },
]);

const filteredTemplates = computed(() => {
  if (!props.templates) return [];
  return props.templates.filter((template) => template.category === localCategory.value);
});

const selectedCategoryInfo = computed(() => {
  return (
    categoryOptions.value.find((cat) => cat.key === localCategory.value) || categoryOptions.value[4]
  );
});

// Métodos
const updateValue = debounce(() => {
  emit('update:modelValue', localValue.value);
  if (props.autoSave && localValue.value.trim()) {
    handleAutoSave();
  }
}, props.autoSaveInterval || 1000);

const updateCategory = (
  category: 'positive' | 'attention' | 'behavior' | 'academic' | 'general',
) => {
  localCategory.value = category;
  emit('update:category', category);
};

const updatePrivacy = (isPrivate: boolean) => {
  localIsPrivate.value = isPrivate;
  emit('update:isPrivate', isPrivate);
};

const handleAutoSave = () => {
  const observation: IClassObservation = {
    content: localValue.value,
    category: localCategory.value,
    isPrivate: localIsPrivate.value,
    timestamp: new Date(),
  };
  emit('save', observation);
};

const selectTemplate = (template: IObservationTemplate) => {
  localValue.value = template.content;
  localCategory.value = template.category;
  emit('template-selected', template);
  updateValue();
  showTemplateList.value = false;
  focusTextarea();
};

const clearInput = () => {
  localValue.value = '';
  updateValue();
  focusTextarea();
};

const focusTextarea = async () => {
  await nextTick();
  textareaRef.value?.focus();
};

const handleFocus = () => {
  isFocused.value = true;
  isExpanded.value = true;
};

const handleBlur = () => {
  isFocused.value = false;
  // Mantener expandido si hay contenido
  if (!localValue.value.trim()) {
    isExpanded.value = false;
  }
};

const insertQuickText = (text: string) => {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = localValue.value.substring(0, start);
  const after = localValue.value.substring(end);

  localValue.value = before + text + after;
  updateValue();

  // Restaurar cursor después del texto insertado
  nextTick(() => {
    const newPosition = start + text.length;
    textarea.setSelectionRange(newPosition, newPosition);
    textarea.focus();
  });
};

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== localValue.value) {
      localValue.value = newValue || '';
    }
  },
);

watch(
  () => props.category,
  (newCategory) => {
    if (newCategory && newCategory !== localCategory.value) {
      localCategory.value = newCategory;
    }
  },
);

watch(
  () => props.isPrivate,
  (newIsPrivate) => {
    if (newIsPrivate !== undefined && newIsPrivate !== localIsPrivate.value) {
      localIsPrivate.value = newIsPrivate;
    }
  },
);

watch(localValue, updateValue);
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}

.form-checkbox {
  border-radius: 0.25rem;
  border-color: #d1d5db;
  color: #2563eb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.form-checkbox:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}
</style>
