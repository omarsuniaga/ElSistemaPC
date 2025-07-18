<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div
              class="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4"
            >
              <span class="text-2xl">📱</span>
            </div>
            <div>
              <h2 class="text-2xl font-bold">Mensaje WhatsApp</h2>
              <p class="text-green-100">
                {{ studentData.studentName }} - {{ studentData.className }}
              </p>
            </div>
          </div>

          <button class="text-white hover:text-green-200 transition-colors p-2" @click="closeModal">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
        <!-- Preset Selector -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Seleccionar tipo de mensaje:
            </label>
            <button
              class="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              @click="openTemplateManager"
            >
              <CogIcon class="w-4 h-4 mr-1" />
              Gestionar Plantillas
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              v-for="preset in presets"
              :key="preset.id"
              :class="[
                'p-4 border-2 rounded-lg text-left transition-all duration-200',
                selectedPreset?.id === preset.id
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700',
              ]"
              @click="selectedPreset = preset"
            >
              <div class="flex items-center mb-2">
                <span class="text-xl mr-2">{{ getPresetIcon(preset.category) }}</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ preset.name }}</span>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400 capitalize">{{
                preset.category
              }}</span>
            </button>
          </div>
        </div>

        <!-- Message Preview -->
        <div v-if="selectedPreset" class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Vista previa del mensaje:
          </label>

          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border">
            <div class="flex items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-600">
              <div
                class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold"
              >
                {{ studentData.representanteName.charAt(0).toUpperCase() }}
              </div>
              <div class="ml-3">
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ studentData.representanteName }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ studentData.representantePhone }}
                </div>
              </div>
            </div>

            <div
              class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 leading-relaxed"
            >
              {{ processedMessage }}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div v-if="selectedPreset" class="flex flex-wrap gap-3 justify-end">
          <button
            :disabled="!!copying"
            class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            @click="copyPhone"
          >
            <PhoneIcon class="w-4 h-4 mr-2" />
            {{ copying === "phone" ? "Copiado!" : "Copiar Teléfono" }}
          </button>

          <button
            :disabled="!!copying"
            class="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            @click="copyMessage"
          >
            <DocumentDuplicateIcon class="w-4 h-4 mr-2" />
            {{ copying === "message" ? "Copiado!" : "Copiar Mensaje" }}
          </button>

          <button
            :disabled="!!copying"
            class="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
            @click="copyAll"
          >
            <ClipboardDocumentIcon class="w-4 h-4 mr-2" />
            {{ copying === "all" ? "Copiado!" : "Copiar Todo" }}
          </button>

          <button
            class="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            @click="openWhatsApp"
          >
            <span class="mr-2">📱</span>
            Abrir WhatsApp
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
          <span class="ml-3 text-gray-600 dark:text-gray-400">Cargando presets...</span>
        </div>

        <!-- Error State -->
        <div
          v-if="error"
          class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 p-4 rounded-lg mb-4"
        >
          {{ error }}
        </div>
      </div>
    </div>

    <!-- Modal de gestión de plantillas -->
    <WhatsAppTemplateManager
      :is-open="showTemplateManager"
      @close="closeTemplateManager"
      @template-created="handleTemplateCreated"
      @template-updated="handleTemplateUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  XMarkIcon,
  PhoneIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentIcon,
  CogIcon,
} from '@heroicons/vue/24/outline';
import {
  useWhatsAppPresets,
  type MessageData,
  type WhatsAppPreset,
} from '../composables/useWhatsAppPresets';
import { useAuthStore } from '../stores/auth';
import WhatsAppTemplateManager from './WhatsAppTemplateManager.vue';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';

interface Props {
  isOpen: boolean
  studentData: MessageData
}

interface Emits {
  (e: 'close'): void
  (e: 'message-sent', data: {preset: WhatsAppPreset; message: string}): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const authStore = useAuthStore();
const { presets, loading, error, loadPresets, processTemplate, copyToClipboard } =
  useWhatsAppPresets();

const selectedPreset = ref<WhatsAppPreset | null>(null);
const copying = ref<'phone' | 'message' | 'all' | null>(null);
const showTemplateManager = ref(false);

// Asegurar que MessageData tenga studentId opcional
type MessageDataWithId = MessageData & {studentId?: string; id?: string}

// Mensaje procesado con los datos del estudiante
const processedMessage = computed(() => {
  if (!selectedPreset.value) return '';
  return processTemplate(selectedPreset.value.template, props.studentData);
});

// Obtener icono según la categoría
const getPresetIcon = (category: string) => {
  const icons = {
    disciplinary: '⚠️',
    administrative: '📋',
    reminder: '🔔',
    custom: '✏️',
  };
  return icons[category as keyof typeof icons] || '📝';
};

// Copiar teléfono
const copyPhone = async () => {
  copying.value = 'phone';
  try {
    const success = await copyToClipboard(props.studentData.representantePhone);
    if (success) {
      setTimeout(() => {
        copying.value = null;
      }, 2000);
    }
  } catch (err) {
    console.error('Error copying phone:', err);
    copying.value = null;
  }
};

// Copiar mensaje
const copyMessage = async () => {
  copying.value = 'message';
  try {
    const success = await copyToClipboard(processedMessage.value);
    if (success) {
      setTimeout(() => {
        copying.value = null;
      }, 2000);
    }
  } catch (err) {
    console.error('Error copying message:', err);
    copying.value = null;
  }
};

// Copiar todo (teléfono + mensaje)
const copyAll = async () => {
  copying.value = 'all';
  try {
    const fullText = `Teléfono: ${props.studentData.representantePhone}\n\nMensaje:\n${processedMessage.value}`;
    const success = await copyToClipboard(fullText);
    if (success) {
      setTimeout(() => {
        copying.value = null;
      }, 2000);
    }
  } catch (err) {
    console.error('Error copying all:', err);
    copying.value = null;
  }
};

// Abrir WhatsApp
enum WhatsAppLogType {
  INDIVIDUAL = 'individual',
  BULK = 'bulk',
}

const openWhatsApp = async () => {
  const phone = props.studentData.representantePhone.replace(/\D/g, '');
  const message = encodeURIComponent(processedMessage.value);
  const url = `https://wa.me/${phone}?text=${message}`;

  // Registrar el intento de envío en Firestore
  if (selectedPreset.value) {
    try {
      await addDoc(collection(db, 'whatsapp_logs'), {
        studentId:
          (props.studentData as MessageDataWithId).studentId ||
          (props.studentData as MessageDataWithId).id ||
          null,
        phone: props.studentData.representantePhone,
        message: processedMessage.value,
        presetId: selectedPreset.value.id,
        presetName: selectedPreset.value.name,
        sentAt: new Date(),
        status: 'pending',
        type: WhatsAppLogType.INDIVIDUAL,
      });
    } catch (err) {
      console.error('Error registrando log de WhatsApp:', err);
    }
  }

  window.open(url, '_blank');

  // Emitir evento de mensaje enviado
  if (selectedPreset.value) {
    emit('message-sent', {
      preset: selectedPreset.value,
      message: processedMessage.value,
    });
  }
};

// Cerrar modal
const closeModal = () => {
  selectedPreset.value = null;
  copying.value = null;
  emit('close');
};

// Gestión de plantillas
const openTemplateManager = () => {
  showTemplateManager.value = true;
};

const closeTemplateManager = () => {
  showTemplateManager.value = false;
};

const handleTemplateCreated = (template: WhatsAppPreset) => {
  // Recargar los presets para incluir la nueva plantilla
  loadPresets();
};

const handleTemplateUpdated = (template: WhatsAppPreset) => {
  // Recargar los presets para reflejar los cambios
  loadPresets();
  // Si la plantilla editada era la seleccionada, deseleccionarla para forzar recarga
  if (selectedPreset.value?.id === template.id) {
    selectedPreset.value = null;
  }
};

// Cargar presets al abrir el modal
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      loadPresets();
    }
  },
);

onMounted(() => {
  if (props.isOpen) {
    loadPresets();
  }
});
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
