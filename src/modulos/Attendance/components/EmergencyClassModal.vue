<template>
  <div v-if="modelValue" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="absolute inset-0 bg-black/50" @click="cancelAndClose"></div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg z-10">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            Clase Fuera de Horario Detectada
          </h2>
          <button @click="cancelAndClose" type="button" class="text-gray-400 hover:text-gray-500">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <div class="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <ExclamationTriangleIcon class="h-5 w-5 text-amber-400" />
            </div>
            <div class="ml-3">
              <p class="text-sm text-amber-700 dark:text-amber-300">
                Has registrado asistencia en una fecha u horario que no coincide con el horario regular de esta clase.
                Esta será considerada una clase emergente.
              </p>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-base font-semibold mb-2 text-gray-700 dark:text-gray-300">Detalles de la clase</h3>
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Clase:</span>
              <span class="font-medium">{{ className }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Fecha:</span>
              <span class="font-medium">{{ formattedDate }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Profesor:</span>
              <span class="font-medium">{{ teacherName }}</span>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <label for="reason" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Motivo de la clase fuera de horario <span class="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            v-model="reason"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Por favor, explique brevemente el motivo de esta clase fuera de horario regular"
            required
          ></textarea>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Esta información será enviada a los administradores para su aprobación.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3">
          <button
            @click="cancelAndClose"
            type="button"
            class="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            @click="submitEmergencyClass"
            type="button"
            :disabled="!reason.trim() || isSubmitting"
            class="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Enviar para aprobación
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '../../../stores/auth';
import { useEmergencyClassStore } from '../store/emergencyClass';

const props = defineProps<{
  modelValue: boolean;
  classId: string;
  className: string;
  date: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submitted', success: boolean): void;
  (e: 'cancel'): void;
}>();

const authStore = useAuthStore();
const emergencyClassStore = useEmergencyClassStore();
const reason = ref('');
const isSubmitting = ref(false);

// Obtener el nombre del profesor del store de autenticación
const teacherName = computed(() => {
  return authStore.user?.displayName || 'Profesor';
});

// Formatear la fecha para mostrar
const formattedDate = computed(() => {
  try {
    return format(parseISO(props.date), 'PPP', { locale: es });
  } catch (error) {
    return props.date;
  }
});

// Cerrar el modal sin enviar
const cancelAndClose = () => {
  reason.value = '';
  emit('cancel');
  emit('update:modelValue', false);
};

// Enviar la información de clase emergente
const submitEmergencyClass = async () => {
  if (!reason.value.trim()) return;
  
  isSubmitting.value = true;
  try {
    await emergencyClassStore.registerEmergencyClass({
      classId: props.classId,
      className: props.className,
      date: props.date,
      reason: reason.value
    });
    
    emit('submitted', true);
    emit('update:modelValue', false);
  } catch (error) {
    console.error('Error al registrar clase emergente:', error);
    emit('submitted', false);
  } finally {
    isSubmitting.value = false;
    reason.value = '';
  }
};
</script>
