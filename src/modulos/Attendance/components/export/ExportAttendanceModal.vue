<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Overlay/Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="$emit('update:modelValue', false)"></div>
    
    <!-- Modal Content -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 z-10 overflow-hidden transform transition-all">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <ShareIcon class="w-5 h-5 mr-2" />
          Compartir asistencia
        </h3>
        <button @click="$emit('update:modelValue', false)" class="text-gray-400 hover:text-gray-500">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Body: Export Options -->
      <div class="px-6 py-4">
        <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Selecciona el formato en el que deseas exportar la asistencia de la clase
          <strong>{{ dateFormatted }}</strong>
        </p>
        
        <div class="grid grid-cols-2 gap-3">
          <!-- PDF -->
          <button 
            @click="handleExport('pdf')" 
            class="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
          >
            <DocumentTextIcon class="w-8 h-8 text-red-500" />
            <span class="mt-2 text-sm font-medium">PDF</span>
          </button>
          
          <!-- Excel -->
          <button 
            @click="handleExport('excel')" 
            class="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
          >
            <TableCellsIcon class="w-8 h-8 text-green-500" />
            <span class="mt-2 text-sm font-medium">Excel</span>
          </button>
          
          <!-- HTML -->
          <button 
            @click="handleExport('html')" 
            class="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
          >
            <CodeBracketIcon class="w-8 h-8 text-blue-500" />
            <span class="mt-2 text-sm font-medium">HTML</span>
          </button>
          
          <!-- WhatsApp -->
          <button 
            @click="handleExport('whatsapp')" 
            class="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ChatBubbleOvalLeftIcon class="w-8 h-8 text-green-600" />
            <span class="mt-2 text-sm font-medium">WhatsApp</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="absolute inset-0 bg-white bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75 flex items-center justify-center">
        <div class="flex flex-col items-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">Generando {{ currentFormat }}...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ShareIcon, 
  XMarkIcon, 
  DocumentTextIcon, 
  TableCellsIcon,
  CodeBracketIcon,
  ChatBubbleOvalLeftIcon 
} from '@heroicons/vue/24/outline';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  date: {
    type: String,
    required: true
  },
  className: {
    type: String,
    required: true
  },
  attendanceData: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'export']);

const isLoading = ref(false);
const currentFormat = ref('');

// Formatear la fecha para mostrar
const dateFormatted = computed(() => {
  try {
    return format(new Date(props.date), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  } catch (e) {
    return props.date;
  }
});

const handleExport = async (format: 'pdf' | 'excel' | 'html' | 'whatsapp') => {
  isLoading.value = true;
  currentFormat.value = format;
  
  try {
    await emit('export', format);
    // Cerrar el modal solo si la exportación fue exitosa
    emit('update:modelValue', false);
  } catch (error) {
    console.error(`Error al exportar como ${format}:`, error);
  } finally {
    isLoading.value = false;
  }
};
</script>
