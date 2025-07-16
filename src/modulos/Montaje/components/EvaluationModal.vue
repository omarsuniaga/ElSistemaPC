<!-- src/modulos/Montaje/components/EvaluationModal.vue -->
<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeModal" />

      <!-- Modal -->
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <form @submit.prevent="handleSubmit">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="mb-4">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Nueva Evaluación
              </h3>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Registra una evaluación para el estudiante seleccionado
              </p>
            </div>

            <!-- Estudiante -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estudiante
              </label>
              <select
                v-model="evaluationData.estudianteId"
                class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Seleccionar estudiante...</option>
                <option v-for="student in students" :key="student.id" :value="student.id">
                  {{ student.name }}
                </option>
              </select>
            </div>

            <!-- Puntuación -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Puntuación (0-100)
              </label>
              <input
                v-model.number="evaluationData.score"
                type="number"
                min="0"
                max="100"
                class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <!-- Comentarios -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comentarios
              </label>
              <textarea
                v-model="evaluationData.comments"
                rows="4"
                class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Observaciones y comentarios sobre el desempeño..."
              />
            </div>

            <!-- Tiempo de sesión -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiempo de sesión (minutos)
              </label>
              <input
                v-model.number="evaluationData.tiempoSesion"
                type="number"
                min="1"
                class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              <span v-if="isSubmitting">Guardando...</span>
              <span v-else>Guardar Evaluación</span>
            </button>
            <button
              type="button"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              @click="closeModal"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CreateEvaluationInput } from '../types';

interface Props {
  show: boolean
  workId?: string
  students?: Array<{id: string; name: string}>
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: CreateEvaluationInput): void
}

const props = withDefaults(defineProps<Props>(), {
  students: () => [],
});

const emit = defineEmits<Emits>();

const isSubmitting = ref(false);

const evaluationData = ref<CreateEvaluationInput>({
  estudianteId: '',
  obraId: props.workId || '',
  workId: props.workId || '',
  maestroEvaluadorId: 'current-user', // Se establecería con el usuario actual
  score: 0,
  comments: '',
  tiempoSesion: 30,
  fecha: new Date(),
  tipo: 'continua',
});

const closeModal = () => {
  emit('close');
};

const handleSubmit = async () => {
  try {
    isSubmitting.value = true;

    const dataToSubmit: CreateEvaluationInput = {
      ...evaluationData.value,
      obraId: props.workId || evaluationData.value.obraId,
      workId: props.workId || evaluationData.value.workId,
    };

    emit('submit', dataToSubmit);

    // Reset form
    evaluationData.value = {
      estudianteId: '',
      obraId: props.workId || '',
      workId: props.workId || '',
      maestroEvaluadorId: 'current-user',
      score: 0,
      comments: '',
      tiempoSesion: 30,
      fecha: new Date(),
      tipo: 'continua',
    };

    closeModal();
  } catch (error) {
    console.error('Error submitting evaluation:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
