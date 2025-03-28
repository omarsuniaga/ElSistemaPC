<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 flex items-center justify-center z-50"
  >
    <div class="absolute inset-0 bg-black/50" @click="close"></div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl z-10">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">
            {{ classObservationMode ? 'Observaciones de Clase' : 'Observaciones de Estudiante' }}
          </h2>
          <button @click="close" class="text-gray-500 hover:text-gray-700">
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Información de contexto -->
        <div class="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p v-if="!classObservationMode"><strong>Estudiante:</strong> {{ studentName }}</p>
          <p><strong>Clase:</strong> {{ className }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(attendanceDate) }}</p>
        </div>

        <!-- Formulario para nueva observación -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-3">
            {{ classObservationMode ? 'Observaciones generales de la clase' : 'Observación para el estudiante' }}
          </h3>
          <textarea
            v-model="newObservation"
            rows="6"
            class="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Escriba su observación aquí..."
          ></textarea>
          <div class="flex justify-between text-sm text-gray-500 mt-1">
            <span>{{ characterCount }}/1000 caracteres</span>
            <span :class="{'text-red-500': characterCount > 1000}">
              {{ characterCount > 1000 ? 'Límite excedido' : '' }}
            </span>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex justify-end gap-3">
          <button @click="close" class="btn btn-secondary">
            Cancelar
          </button>
          <button 
            @click="saveObservation"
            :disabled="!newObservation.trim() || isLoading || characterCount > 1000"
            class="btn btn-primary"
          >
            <span v-if="isLoading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </span>
            <span v-else>Guardar observación</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAttendanceStore } from '../store/attendance'
import { useAuthStore } from '../../../stores/auth'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  modelValue: boolean
  studentId?: string
  studentName?: string
  classId: string
  className: string
  attendanceId: string
  attendanceDate: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'observation', observation: string): void
}>()

const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()

const newObservation = ref('')
const isLoading = ref(false)

// Determinar si estamos en modo observación de clase (sin estudiante) o de estudiante específico
const classObservationMode = computed(() => !props.studentId)

// Cargar las observaciones existentes al abrir el modal
onMounted(() => {
  if (classObservationMode.value) {
    // Para observaciones de clase, cargar desde el store
    const observations = attendanceStore.getObservations;
    newObservation.value = observations || '';
  } else {
    // Para observaciones de estudiante, implementar la lógica específica
    // (asumiendo que hay un método para obtener observaciones de un estudiante)
    // Por ahora, dejamos vacío para que el profesor añada una nueva observación
    newObservation.value = '';
  }
})

// Formatear fecha
const formatDate = (date: string) => {
  try {
    return format(new Date(date), 'PPP', { locale: es });
  } catch (error) {
    return date;
  }
}

// Contador de caracteres
const characterCount = computed(() => newObservation.value.length)

// Cerrar el modal
const close = () => {
  emit('update:modelValue', false)
}

// Guardar la observación
const saveObservation = async () => {
  if (!newObservation.value.trim() || characterCount.value > 1000) return;
  
  isLoading.value = true;
  try {
    if (classObservationMode.value) {
      // Para observaciones de clase
      emit('observation', newObservation.value);
    } else {
      // Para observaciones de estudiante específico
      // Implementar lógica específica si es necesario
      emit('observation', newObservation.value);
    }
    close();
  } catch (error) {
    console.error('Error al guardar la observación:', error);
  } finally {
    isLoading.value = false;
  }
}
</script>