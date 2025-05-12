<!-- components/JustifiedAbsenceModal.vue -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useAttendanceStore } from '../modulos/Attendance/store/attendance';

const props = defineProps<{
  student: any;
  classId?: string;
  date?: string;
}>()

const emit = defineEmits(['close', 'save'])

const reason = ref('')
const file = ref<File | null>(null)
const isUploading = ref(false)
const documentUrl = ref('')
const errorMessage = ref('')
const attendanceStore = useAttendanceStore();

// Cargar la justificación existente cuando se abre el modal
const loadExistingJustification = async () => {
  if (!props.student || !props.student.id) return;
  
  try {
    // Verificar si hay una justificación existente para este estudiante
    const justification = attendanceStore.getJustification(props.student.id);
    
    if (justification && justification.reason) {
      // Si hay una justificación existente, mostrarla en el campo
      reason.value = justification.reason;
      
      // Si hay una URL de documento, también establecerla
      if (justification.documentURL) {
        documentUrl.value = justification.documentURL;
      }
    } else {
      // Si no hay justificación existente, limpiar los campos
      reason.value = '';
      documentUrl.value = '';
    }
  } catch (error) {
    console.error('Error al cargar la justificación existente:', error);
    errorMessage.value = 'Error al cargar la justificación existente.';
  }
}

// Ejecutar cuando se abre el modal o cambia el estudiante
watch(() => props.student, (newStudent) => {
  if (newStudent && newStudent.id) {
    loadExistingJustification();
  }
}, { immediate: true });

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    file.value = input.files[0];
  }
}

const save = () => {
  if (!reason.value.trim()) {
    errorMessage.value = 'Por favor ingrese una razón para la justificación';
    return;
  }
  
  // Enviar tanto la razón como el archivo si existe
  emit('save', { 
    studentId: props.student.id,  // Add studentId explicitly for clarity
    reason: reason.value,
    documentUrl: documentUrl.value,
    file: file.value
  });
  
  // Don't clear the reason immediately, so it persists for future editing
  errorMessage.value = '';
  emit('close');
}

const close = () => {
  // No limpiamos reason.value para mantener la justificación en caso de reapertura
  file.value = null;
  errorMessage.value = '';
  emit('close');
}

onMounted(() => {
  // Cargar la justificación existente cuando el componente se monta
  loadExistingJustification();
});
</script>

<template>
  <div v-if="$props.student" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
      <h2 class="text-lg font-semibold mb-4">Justificar Ausencia</h2>
      <p class="mb-4">Estudiante: {{ $props.student.nombre }} {{ $props.student.apellido }}</p>
      
      <div class="mb-4">
        <label for="reason" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razón:</label>
        <textarea 
          id="reason" 
          v-model="reason" 
          rows="3" 
          class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Explique la razón de la ausencia"
        ></textarea>
        <p v-if="errorMessage" class="mt-1 text-sm text-red-600">{{ errorMessage }}</p>
      </div>
      
      <div class="mb-4">
        <label for="document" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Documento de soporte (opcional):</label>
        <input 
          type="file" 
          id="document" 
          @change="handleFileChange"
          class="block w-full text-sm text-gray-500
                 file:mr-4 file:py-2 file:px-4
                 file:rounded-md file:border-0
                 file:text-sm file:font-semibold
                 file:bg-primary-50 file:text-primary-700
                 hover:file:bg-primary-100
                 dark:file:bg-primary-900 dark:file:text-primary-300"
        />
        <p class="mt-1 text-sm text-gray-500">Adjunte un documento que justifique la ausencia (PDF, imagen, etc.)</p>
        <div v-if="file" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Archivo seleccionado: {{ file.name }}
        </div>
      </div>
      
      <div class="mt-4 flex justify-end gap-2">
        <button @click="close" class="btn btn-secondary">Cancelar</button>
        <button 
          @click="save" 
          class="btn btn-primary"
          :disabled="isUploading"
        >
          <span v-if="isUploading">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Subiendo...
          </span>
          <span v-else>Guardar</span>
        </button>
      </div>
    </div>
  </div>
</template>