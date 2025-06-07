<template>
  <transition name="modal-fade">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50" @click.self="closeModal">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        <div class="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">Justificación de ausencia</h2>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-500">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-4">
          <p class="mb-3 text-sm text-gray-600 dark:text-gray-300" v-if="student && student.nombre">
            Estudiante: <span class="font-medium">{{ student.nombre }} {{ student.apellido }}</span>
          </p>
          
          <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
            Fecha: <span class="font-medium">{{ formatDate(date) }}</span>
          </p>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo de la justificación</label>
            <textarea 
              v-model="justification" 
              rows="3" 
              class="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2"
              placeholder="Especifique el motivo de la ausencia..."
            ></textarea>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adjuntar documento (opcional)</label>
            <input 
              type="file" 
              @change="handleFileUpload" 
              class="block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          
          <div v-if="selectedFile" class="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center">
            <svg class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="text-sm text-blue-600 dark:text-blue-400">{{ selectedFile.name }}</span>
            <button @click="removeFile" class="ml-auto text-gray-400 hover:text-gray-500">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="isUploading" class="mb-4">
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-600" :style="{width: uploadProgress + '%'}"></div>
            </div>
            <p class="text-xs text-gray-500 mt-1 text-center">Subiendo archivo... {{ uploadProgress }}%</p>
          </div>
        </div>
        
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right rounded-b-lg">
          <button 
            type="button" 
            class="mr-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            @click="closeModal"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            @click="submitJustification"
            :disabled="!isValid || isUploading"
          >
            Guardar justificación
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
  props: {
    show: Boolean,
    student: Object,
    classId: String,  // Cambiado de 'class: Object' a 'classId: String'
    date: String,
    attendanceStatus: String,
    existingJustification: Object
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    // Estado local
    const justification = ref('');
    const selectedFile = ref(null);
    const isUploading = ref(false);
    const uploadProgress = ref(0);

    // Resetear el formulario cuando se abre el modal
    watch(() => props.show, (newVal) => {
      if (newVal) {
        // Si hay una justificación existente, cargarla
        if (props.existingJustification) {
          justification.value = props.existingJustification.reason || '';
        } else {
          justification.value = '';
        }
        selectedFile.value = null;
        isUploading.value = false;
        uploadProgress.value = 0;
      }
    });

    const isValid = computed(() => {
      return justification.value.trim().length > 0;
    });

    // Método para formatear la fecha
    const formatDate = (dateString) => {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-ES', { 
          day: '2-digit', 
          month: '2-digit',
          year: 'numeric' 
        }).format(date);
      } catch (e) {
        return dateString;
      }
    };

    // Método para manejar la subida de archivos
    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        // Validar tipo de archivo (solo PDF, DOC, DOCX, JPG, PNG)
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
        
        if (!validTypes.includes(file.type)) {
          alert('Tipo de archivo no válido. Por favor, sube un archivo PDF, DOC, DOCX, JPG o PNG.');
          event.target.value = null;
          return;
        }
        
        // Validar tamaño (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
          event.target.value = null;
          return;
        }
        
        selectedFile.value = file;
      }
    };

    // Método para eliminar el archivo seleccionado
    const removeFile = () => {
      selectedFile.value = null;
    };

    // Método para cerrar el modal
    const closeModal = () => {
      emit('close');
    };

    // Método para enviar la justificación
    const submitJustification = () => {
      if (!isValid.value) return;
      
      // Preparar datos para enviar
      const data = {
        studentId: props.student?.id,
        reason: justification.value.trim(),
        file: selectedFile.value
      };
      
      // Emitir evento con los datos
      emit('submit', data);
      
      // Cerrar el modal
      closeModal();
    };
    
    return {
      justification,
      selectedFile,
      isUploading,
      uploadProgress,
      isValid,
      formatDate,
      handleFileUpload,
      removeFile,
      closeModal,
      submitJustification
    };
  }
};
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
