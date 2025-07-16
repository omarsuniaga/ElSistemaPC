<template>
  <div class="smart-observation-form bg-white rounded-lg border border-gray-200">
    <!-- Header del formulario -->
    <div class="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <h3 class="text-lg font-medium text-gray-900 flex items-center">
        <span class="text-2xl mr-2">📝</span>
        Nueva Observación Inteligente
      </h3>
      <p class="text-sm text-gray-600 mt-1">
        Usa <span class="font-mono bg-gray-200 px-1 rounded">@</span> para etiquetar estudiantes,
        <span class="font-mono bg-gray-200 px-1 rounded">#</span> para obras/métodos,
        <span class="font-mono bg-gray-200 px-1 rounded">::</span> + Enter para viñetas
      </p>
    </div>

    <!-- Contenido del formulario -->
    <div class="p-4 space-y-4">
      <!-- Configuración básica -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"> Tipo de observación </label>
          <select
            v-model="observationForm.type"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="general">📋 General</option>
            <option value="comportamiento">😊 Comportamiento</option>
            <option value="academico">🎓 Académico</option>
            <option value="asistencia">📅 Asistencia</option>
            <option value="evaluacion">⭐ Evaluación</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"> Prioridad </label>
          <select
            v-model="observationForm.priority"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="baja">🟢 Baja</option>
            <option value="media">🟡 Media</option>
            <option value="alta">🟠 Alta</option>
            <option value="critica">🔴 Crítica</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"> Seguimiento </label>
          <label class="flex items-center">
            <input
              v-model="observationForm.requiresFollowUp"
              type="checkbox"
              class="mr-2 rounded border-gray-300 focus:ring-blue-500"
            />
            <span class="text-sm">Requiere seguimiento</span>
          </label>
        </div>
      </div>

      <!-- Editor de texto inteligente -->
      <div class="relative">
        <label class="block text-sm font-medium text-gray-700 mb-2"> Observación </label>

        <!-- Área de texto principal -->
        <div class="relative">
          <textarea
            ref="textareaRef"
            v-model="observationText"
            placeholder="Escribe tu observación aquí...

Ejemplos:
• @Juan está progresando bien en #ScalesMajor
• @María necesita practicar más #ArpeggioC 
• Clase muy participativa hoy
• :: Ejercicios realizados
• :: Obras revisadas"
            class="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            :class="{'border-blue-400 ring-1 ring-blue-400': showAutocomplete}"
            rows="8"
            :style="{minHeight: textareaHeight}"
            @input="handleTextInput"
            @keydown="handleKeyDown"
            @click="handleTextClick"
          />

          <!-- Overlay para resaltar menciones y hashtags -->
          <div
            v-if="highlightedText"
            class="absolute inset-0 px-3 py-3 pointer-events-none whitespace-pre-wrap text-transparent border border-transparent rounded-md"
            :style="{
              minHeight: textareaHeight,
              fontSize: '14px',
              lineHeight: '1.5',
              fontFamily: 'inherit',
            }"
            v-html="highlightedText"
          />
        </div>

        <!-- Panel de autocompletado -->
        <div
          v-if="showAutocomplete && (filteredStudents.length > 0 || filteredTags.length > 0)"
          class="absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          :style="autocompletePosition"
        >
          <!-- Sugerencias de estudiantes (@) -->
          <div v-if="currentAutocompleteType === 'student' && filteredStudents.length > 0">
            <div class="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
              👥 Estudiantes
            </div>
            <button
              v-for="(student, index) in filteredStudents"
              :key="student.id"
              :class="[
                'w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none',
                {'bg-blue-100': index === autocompleteSelectedIndex},
              ]"
              @click="insertStudentMention(student)"
            >
              <div class="flex items-center space-x-2">
                <div
                  class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm"
                >
                  {{ student.nombre.charAt(0) }}{{ student.apellido.charAt(0) }}
                </div>
                <div>
                  <div class="font-medium text-gray-900">
                    {{ student.nombre }} {{ student.apellido }}
                  </div>
                  <div class="text-xs text-gray-500">Estudiante</div>
                </div>
              </div>
            </button>
          </div>

          <!-- Sugerencias de contenido (#) -->
          <div v-if="currentAutocompleteType === 'tag' && filteredTags.length > 0">
            <div class="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
              🏷️ Contenido
            </div>
            <button
              v-for="(tag, index) in filteredTags"
              :key="tag.id"
              :class="[
                'w-full px-3 py-2 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none',
                {'bg-green-100': index === autocompleteSelectedIndex},
              ]"
              @click="insertTagMention(tag)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-gray-900">{{ tag.name }}</div>
                  <div class="text-xs text-gray-500">
                    {{ getTagTypeLabel(tag.type) }} • Usado {{ tag.frequency }} veces
                  </div>
                </div>
                <span class="text-lg">{{ getTagTypeEmoji(tag.type) }}</span>
              </div>
            </button>

            <!-- Opción para crear nuevo tag -->
            <button
              v-if="currentAutocompleteQuery.length > 2"
              class="w-full px-3 py-2 text-left hover:bg-gray-50 border-t border-gray-100"
              @click="createNewTag"
            >
              <div class="flex items-center space-x-2 text-blue-600">
                <span class="text-sm">➕</span>
                <span class="font-medium">Crear "{{ currentAutocompleteQuery }}"</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Estudiantes etiquetados -->
      <div v-if="taggedStudents.length > 0" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          👥 Estudiantes etiquetados ({{ taggedStudents.length }})
        </label>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="student in taggedStudents"
            :key="student.id"
            class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
          >
            {{ student.nombre }} {{ student.apellido }}
            <button
              class="ml-1 text-blue-600 hover:text-blue-800"
              @click="removeStudentTag(student.id)"
            >
              ×
            </button>
          </span>
        </div>
      </div>

      <!-- Contenido etiquetado -->
      <div v-if="taggedContent.length > 0" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          🏷️ Contenido referenciado ({{ taggedContent.length }})
        </label>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="tag in taggedContent"
            :key="tag.id"
            class="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full"
          >
            {{ getTagTypeEmoji(tag.type) }} {{ tag.name }}
            <button
              class="ml-1 text-green-600 hover:text-green-800"
              @click="removeContentTag(tag.id)"
            >
              ×
            </button>
          </span>
        </div>
      </div>

      <!-- Vista previa del contenido -->
      <div v-if="processedContent" class="space-y-2">
        <label class="block text-sm font-medium text-gray-700"> 👁️ Vista previa </label>
        <div
          class="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm"
          v-html="processedContent"
        />
      </div>
    </div>

    <!-- Footer con acciones -->
    <div
      class="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-between items-center"
    >
      <div class="text-sm text-gray-500">
        <span v-if="observationText.length > 0">{{ observationText.length }} caracteres</span>
        <span v-if="taggedStudents.length > 0"> • {{ taggedStudents.length }} estudiantes</span>
        <span v-if="taggedContent.length > 0"> • {{ taggedContent.length }} referencias</span>
      </div>

      <div class="flex space-x-2">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="clearForm"
        >
          Limpiar
        </button>
        <button
          type="button"
          :disabled="!canSave || saving"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="saveObservation"
        >
          <span v-if="saving">Guardando...</span>
          <span v-else>💾 Guardar Observación</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useStudentsStore } from '../../modulos/Students/store/students';
import { useCalificacionesStore } from '../../stores/calificaciones';
import { useAuthStore } from '../../stores/auth';
import type { Student } from '../../modulos/Students/types/student';
import type { TaggedContent } from '../../stores/calificaciones';

// Props
const props = defineProps<{
  classId: string
  className: string
  selectedDate: string
  initialText?: string
  initialType?: string
  initialPriority?: string
}>();

// Emits
const emit = defineEmits<{
  (e: 'observation-saved', data: any): void
  (e: 'form-updated', data: any): void
  (e: 'cancel'): void
}>();

// Stores
const studentsStore = useStudentsStore();
const calificacionesStore = useCalificacionesStore();
const authStore = useAuthStore();

// Referencias del DOM
const textareaRef = ref<HTMLTextAreaElement>();

// Estado del formulario
const observationForm = ref({
  type: props.initialType || 'general',
  priority: props.initialPriority || 'media',
  requiresFollowUp: false,
});

const observationText = ref(props.initialText || '');
const saving = ref(false);

// Estado del autocompletado
const showAutocomplete = ref(false);
const currentAutocompleteType = ref<'student' | 'tag' | null>(null);
const currentAutocompleteQuery = ref('');
const autocompletePosition = ref({ top: '0px', left: '0px', width: '200px' });
const autocompleteSelectedIndex = ref(0);
const cursorPosition = ref(0);

// Estudiantes y contenido etiquetado
const taggedStudents = ref<Student[]>([]);
const taggedContent = ref<TaggedContent[]>([]);

// Computed properties
const studentsInClass = computed(() => {
  const classInfo = studentsStore.getStudentsByClass(props.classId);
  return classInfo || [];
});

const filteredStudents = computed(() => {
  if (currentAutocompleteType.value !== 'student') return [];

  const query = currentAutocompleteQuery.value.toLowerCase();
  return studentsInClass.value
    .filter((student) => {
      const fullName = `${student.nombre} ${student.apellido}`.toLowerCase();
      return fullName.includes(query) && !isStudentTagged(student.id);
    })
    .slice(0, 8);
});

const filteredTags = computed(() => {
  if (currentAutocompleteType.value !== 'tag') return [];

  const suggestions = calificacionesStore.getTagsSuggestions(currentAutocompleteQuery.value);
  return suggestions.filter((tag) => !isContentTagged(tag.id));
});

const textareaHeight = computed(() => {
  const lines = observationText.value.split('\n').length;
  return `${Math.max(200, lines * 24)}px`;
});

const highlightedText = computed(() => {
  if (!observationText.value) return '';

  let highlighted = observationText.value;

  // Destacar menciones de estudiantes (@)
  highlighted = highlighted.replace(
    /@(\w+)/g,
    '<span class="bg-blue-200 text-blue-800 px-1 rounded">@$1</span>',
  );

  // Destacar hashtags (#)
  highlighted = highlighted.replace(
    /#(\w+)/g,
    '<span class="bg-green-200 text-green-800 px-1 rounded">#$1</span>',
  );

  // Destacar viñetas (::)
  highlighted = highlighted.replace(
    /^:: (.+)$/gm,
    '<span class="bg-yellow-200 text-yellow-800 px-1 rounded">• $1</span>',
  );

  return highlighted;
});

const processedContent = computed(() => {
  if (!observationText.value) return '';

  let processed = observationText.value;

  // Convertir viñetas
  processed = processed.replace(/^:: (.+)$/gm, '• $1');

  // Procesar menciones de estudiantes
  taggedStudents.value.forEach((student) => {
    const mention = `@${student.nombre}${student.apellido}`;
    const replacement = `<strong class="text-blue-600">@${student.nombre} ${student.apellido}</strong>`;
    processed = processed.replace(new RegExp(mention, 'g'), replacement);
  });

  // Procesar hashtags
  taggedContent.value.forEach((tag) => {
    const hashtag = `#${tag.name}`;
    const replacement = `<strong class="text-green-600">#${tag.name}</strong>`;
    processed = processed.replace(new RegExp(hashtag, 'g'), replacement);
  });

  // Convertir saltos de línea
  processed = processed.replace(/\n/g, '<br>');

  return processed;
});

const canSave = computed(() => {
  return observationText.value.trim().length > 10 && !saving.value;
});

// Métodos de utilidad
const isStudentTagged = (studentId: string): boolean => {
  return taggedStudents.value.some((s) => s.id === studentId);
};

const isContentTagged = (tagId: string): boolean => {
  return taggedContent.value.some((t) => t.id === tagId);
};

const getTagTypeLabel = (type: string): string => {
  const labels = {
    obra: 'Obra',
    metodo: 'Método',
    leccion: 'Lección',
    ejercicio: 'Ejercicio',
    otro: 'Otro',
  };
  return labels[type] || 'Desconocido';
};

const getTagTypeEmoji = (type: string): string => {
  const emojis = {
    obra: '🎵',
    metodo: '📚',
    leccion: '📖',
    ejercicio: '🏋️',
    otro: '🏷️',
  };
  return emojis[type] || '🏷️';
};

// Manejo del texto y autocompletado
const handleTextInput = (event: Event): void => {
  const target = event.target as HTMLTextAreaElement;
  const text = target.value;
  const cursorPos = target.selectionStart;

  cursorPosition.value = cursorPos;
  checkForAutocomplete(text, cursorPos);
  extractTaggedContent(text);
};

const handleKeyDown = (event: KeyboardEvent): void => {
  const target = event.target as HTMLTextAreaElement;

  // Manejar viñetas con ::
  if (
    event.key === 'Enter' &&
    target.value.slice(target.selectionStart - 2, target.selectionStart) === '::'
  ) {
    event.preventDefault();
    const before = target.value.slice(0, target.selectionStart - 2);
    const after = target.value.slice(target.selectionStart);
    observationText.value = before + ':: ' + after;

    nextTick(() => {
      target.setSelectionRange(before.length + 3, before.length + 3);
    });
    return;
  }

  // Navegación en autocompletado
  if (showAutocomplete.value) {
    const maxIndex = Math.max(filteredStudents.value.length, filteredTags.value.length) - 1;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      autocompleteSelectedIndex.value = Math.min(autocompleteSelectedIndex.value + 1, maxIndex);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      autocompleteSelectedIndex.value = Math.max(autocompleteSelectedIndex.value - 1, 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      selectAutocompleteItem();
    } else if (event.key === 'Escape') {
      hideAutocomplete();
    }
  }
};

const handleTextClick = (): void => {
  if (textareaRef.value) {
    cursorPosition.value = textareaRef.value.selectionStart;
    checkForAutocomplete(observationText.value, cursorPosition.value);
  }
};

const checkForAutocomplete = (text: string, cursorPos: number): void => {
  const beforeCursor = text.slice(0, cursorPos);

  // Buscar @ más reciente
  const lastAtIndex = beforeCursor.lastIndexOf('@');
  const lastHashIndex = beforeCursor.lastIndexOf('#');

  // Determinar cuál símbolo está más cerca del cursor
  const lastSymbolIndex = Math.max(lastAtIndex, lastHashIndex);

  if (lastSymbolIndex === -1) {
    hideAutocomplete();
    return;
  }

  const textAfterSymbol = beforeCursor.slice(lastSymbolIndex + 1);

  // Verificar que no hay espacios después del símbolo
  if (textAfterSymbol.includes(' ') || textAfterSymbol.includes('\n')) {
    hideAutocomplete();
    return;
  }

  if (lastSymbolIndex === lastAtIndex) {
    // Autocompletado de estudiantes
    currentAutocompleteType.value = 'student';
    currentAutocompleteQuery.value = textAfterSymbol;
    showAutocompleteDropdown();
  } else if (lastSymbolIndex === lastHashIndex) {
    // Autocompletado de contenido
    currentAutocompleteType.value = 'tag';
    currentAutocompleteQuery.value = textAfterSymbol;
    showAutocompleteDropdown();
  }
};

const showAutocompleteDropdown = (): void => {
  showAutocomplete.value = true;
  autocompleteSelectedIndex.value = 0;

  nextTick(() => {
    updateAutocompletePosition();
  });
};

const hideAutocomplete = (): void => {
  showAutocomplete.value = false;
  currentAutocompleteType.value = null;
  currentAutocompleteQuery.value = '';
};

const updateAutocompletePosition = (): void => {
  if (!textareaRef.value) return;

  const textarea = textareaRef.value;
  const rect = textarea.getBoundingClientRect();

  // Posición aproximada basada en el cursor
  autocompletePosition.value = {
    top: `${rect.bottom + 5}px`,
    left: `${rect.left}px`,
    width: `${Math.min(300, rect.width)}px`,
  };
};

const selectAutocompleteItem = (): void => {
  if (currentAutocompleteType.value === 'student' && filteredStudents.value.length > 0) {
    const student = filteredStudents.value[autocompleteSelectedIndex.value];
    if (student) insertStudentMention(student);
  } else if (currentAutocompleteType.value === 'tag' && filteredTags.value.length > 0) {
    const tag = filteredTags.value[autocompleteSelectedIndex.value];
    if (tag) insertTagMention(tag);
  }
};

const insertStudentMention = (student: Student): void => {
  const mention = `@${student.nombre}${student.apellido}`;
  replaceMentionInText('@', mention);

  if (!isStudentTagged(student.id)) {
    taggedStudents.value.push(student);
  }

  hideAutocomplete();
};

const insertTagMention = (tag: TaggedContent): void => {
  const hashtag = `#${tag.name}`;
  replaceMentionInText('#', hashtag);

  if (!isContentTagged(tag.id)) {
    taggedContent.value.push(tag);
  }

  hideAutocomplete();
};

const replaceMentionInText = (symbol: string, replacement: string): void => {
  const text = observationText.value;
  const beforeCursor = text.slice(0, cursorPosition.value);
  const afterCursor = text.slice(cursorPosition.value);

  const lastSymbolIndex = beforeCursor.lastIndexOf(symbol);

  if (lastSymbolIndex !== -1) {
    const before = beforeCursor.slice(0, lastSymbolIndex);
    const newText = before + replacement + ' ' + afterCursor;
    observationText.value = newText;

    nextTick(() => {
      const newCursorPos = before.length + replacement.length + 1;
      if (textareaRef.value) {
        textareaRef.value.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.value.focus();
      }
    });
  }
};

const extractTaggedContent = (text: string): void => {
  // Esta función se puede expandir para extraer automáticamente
  // menciones que no fueron añadidas por autocompletado
};

const createNewTag = async (): Promise<void> => {
  if (!currentAutocompleteQuery.value.trim()) return;

  try {
    const newTag = await calificacionesStore.createOrUpdateTag(
      currentAutocompleteQuery.value,
      'otro', // Tipo por defecto
      authStore.user?.uid || 'unknown',
    );

    insertTagMention(newTag);
  } catch (error) {
    console.error('Error al crear nuevo tag:', error);
  }
};

const removeStudentTag = (studentId: string): void => {
  taggedStudents.value = taggedStudents.value.filter((s) => s.id !== studentId);
};

const removeContentTag = (tagId: string): void => {
  taggedContent.value = taggedContent.value.filter((t) => t.id !== tagId);
};

const clearForm = (): void => {
  observationText.value = '';
  taggedStudents.value = [];
  taggedContent.value = [];
  observationForm.value = {
    type: 'general',
    priority: 'media',
    requiresFollowUp: false,
  };
  hideAutocomplete();
};

const saveObservation = async (): Promise<void> => {
  if (!canSave.value) return;

  try {
    saving.value = true;

    // Preparar datos de la observación
    const observationData = {
      classId: props.classId,
      className: props.className,
      date: props.selectedDate,
      text: observationText.value,
      type: observationForm.value.type,
      priority: observationForm.value.priority,
      requiresFollowUp: observationForm.value.requiresFollowUp,
      taggedStudents: taggedStudents.value.map((s) => s.id),
      taggedContent: taggedContent.value.map((t) => t.name),
      author: authStore.user?.email || 'Usuario',
      authorId: authStore.user?.uid || 'unknown',
    };

    // Guardar comentarios para estudiantes etiquetados
    for (const student of taggedStudents.value) {
      await calificacionesStore.addStudentComment(
        student.id,
        `${student.nombre} ${student.apellido}`,
        props.classId,
        props.className,
        props.selectedDate,
        authStore.user?.uid || 'unknown',
        authStore.user?.email || 'Usuario',
        observationText.value,
        taggedContent.value.map((t) => t.name),
      );
    }

    emit('observation-saved', observationData);
    clearForm();
  } catch (error) {
    console.error('Error al guardar observación:', error);
  } finally {
    saving.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  await calificacionesStore.initialize();

  // Cargar estudiantes de la clase si no están disponibles
  if (studentsInClass.value.length === 0) {
    await studentsStore.fetchStudents();
  }
});

onUnmounted(() => {
  hideAutocomplete();
});

// Watchers
watch(
  () => props.initialText,
  (newText) => {
    if (newText) {
      observationText.value = newText;
    }
  },
);

watch(
  () => observationText.value,
  () => {
    emit('form-updated', {
      text: observationText.value,
      taggedStudents: taggedStudents.value.length,
      taggedContent: taggedContent.value.length,
    });
  },
);
</script>

<style scoped>
/* Estilos específicos para el autocompletado */
.autocomplete-dropdown {
  z-index: 9999;
}

/* Resaltado de menciones en textarea */
textarea {
  font-family: inherit;
  line-height: 1.5;
}

/* Animaciones suaves */
.transition-all {
  transition: all 0.2s ease;
}

/* Scroll suave en dropdown */
.max-h-60 {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.max-h-60::-webkit-scrollbar {
  width: 6px;
}

.max-h-60::-webkit-scrollbar-track {
  background: #f7fafc;
}

.max-h-60::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.max-h-60::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
</style>
