<!-- src/modulos/Montaje/components/PlanModal.vue -->
<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeModal" />

      <!-- Modal -->
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
      >
        <form @submit.prevent="handleSubmit">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="mb-4">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {{ plan ? "Editar Plan de Acción" : "Nuevo Plan de Acción" }}
              </h3>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Define los objetivos y fases para el montaje de la obra
              </p>
            </div>

            <!-- Nombre del Plan -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Plan *
              </label>
              <input
                v-model="planData.nombre"
                type="text"
                class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: Plan de montaje Sinfonía No. 5"
                required
              />
            </div>

            <!-- Descripción -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                v-model="planData.descripcion"
                rows="3"
                class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Describe los aspectos generales del plan..."
              />
            </div>

            <!-- Fechas -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  v-model="planData.fechaInicio"
                  type="date"
                  class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Finalización *
                </label>
                <input
                  v-model="planData.fechaFinalizacion"
                  type="date"
                  class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <!-- Responsable -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maestro Responsable *
              </label>
              <select
                v-model="planData.responsableId"
                class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Seleccionar maestro...</option>
                <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.name }}
                </option>
              </select>
            </div>

            <!-- Objetivos -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Objetivos del Plan
              </label>
              <div class="space-y-2">
                <div
                  v-for="(objetivo, index) in planData.objetivos"
                  :key="index"
                  class="flex items-center space-x-2"
                >
                  <input
                    v-model="objetivo.descripcion"
                    type="text"
                    class="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Descripción del objetivo..."
                  />
                  <button
                    type="button"
                    class="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    @click="removeObjetivo(index)"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  class="w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  @click="addObjetivo"
                >
                  + Agregar Objetivo
                </button>
              </div>
            </div>

            <!-- Fases -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fases del Plan
              </label>
              <div class="space-y-3">
                <div
                  v-for="(fase, index) in planData.fases"
                  :key="index"
                  class="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <input
                      v-model="fase.nombre"
                      type="text"
                      class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Nombre de la fase..."
                    />
                    <div class="flex items-center space-x-2">
                      <span class="text-sm text-gray-600 dark:text-gray-400">Orden:</span>
                      <input
                        v-model.number="fase.orden"
                        type="number"
                        min="1"
                        class="w-20 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        class="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        @click="removeFase(index)"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <textarea
                    v-model="fase.descripcion"
                    rows="2"
                    class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Descripción de la fase..."
                  />
                </div>
                <button
                  type="button"
                  class="w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  @click="addFase"
                >
                  + Agregar Fase
                </button>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              <span v-if="isSubmitting">Guardando...</span>
              <span v-else>{{ plan ? "Actualizar" : "Crear" }} Plan</span>
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
import { ref, watch } from 'vue';
import { Timestamp } from 'firebase/firestore';
import type { PlanAccion, ObjetivoPlan, FasePlan } from '../types';

interface Props {
  show: boolean
  workId?: string
  plan?: PlanAccion | null
  teachers?: Array<{id: string; name: string}>
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: Omit<PlanAccion, 'id' | 'auditoria'>): void
}

const props = withDefaults(defineProps<Props>(), {
  teachers: () => [],
});

const emit = defineEmits<Emits>();

const isSubmitting = ref(false);

const defaultPlanData = () => ({
  obraId: props.workId || '',
  nombre: '',
  descripcion: '',
  fechaInicio: new Date().toISOString().split('T')[0],
  fechaFinalizacion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  responsableId: '',
  estado: 'activo' as const,
  objetivos: [] as Omit<ObjetivoPlan, 'id' | 'completado' | 'progreso'>[],
  fases: [] as Omit<FasePlan, 'id' | 'completada' | 'progreso'>[],
  metadatos: {
    progresoPorcentaje: 0,
    fasesCompletadas: 0,
    totalFases: 0,
    horasEstimadas: 0,
    horasReales: 0,
  },
});

const planData = ref(defaultPlanData());

// Watch for plan prop changes to populate form
watch(
  () => props.plan,
  (newPlan) => {
    if (newPlan) {
      planData.value = {
        obraId: newPlan.obraId,
        nombre: newPlan.nombre,
        descripcion: newPlan.descripcion || '',
        fechaInicio: formatDateForInput(newPlan.fechaInicio),
        fechaFinalizacion: formatDateForInput(newPlan.fechaFinalizacion),
        responsableId: newPlan.responsableId,
        estado: newPlan.estado,
        objetivos: newPlan.objetivos.map((obj) => ({
          descripcion: obj.descripcion,
          criteriosExito: obj.criteriosExito,
          fechaLimite: obj.fechaLimite,
        })),
        fases: newPlan.fases.map((fase) => ({
          nombre: fase.nombre,
          descripcion: fase.descripcion || '',
          orden: fase.orden,
          fechaInicio: fase.fechaInicio,
          fechaFinalizacion: fase.fechaFinalizacion,
          tareas: fase.tareas,
          dependencias: fase.dependencias,
        })),
        metadatos: newPlan.metadatos,
      };
    } else {
      planData.value = defaultPlanData();
    }
  },
  { immediate: true },
);

function formatDateForInput(timestamp: Timestamp | Date | string): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString().split('T')[0];
  } else if (timestamp instanceof Date) {
    return timestamp.toISOString().split('T')[0];
  } else if (typeof timestamp === 'string') {
    return new Date(timestamp).toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

const addObjetivo = () => {
  planData.value.objetivos.push({
    descripcion: '',
    criteriosExito: [],
    fechaLimite: undefined,
  });
};

const removeObjetivo = (index: number) => {
  planData.value.objetivos.splice(index, 1);
};

const addFase = () => {
  planData.value.fases.push({
    nombre: '',
    descripcion: '',
    orden: planData.value.fases.length + 1,
    fechaInicio: Timestamp.now(),
    fechaFinalizacion: Timestamp.now(),
    tareas: [],
    dependencias: [],
  });
};

const removeFase = (index: number) => {
  planData.value.fases.splice(index, 1);
};

const closeModal = () => {
  planData.value = defaultPlanData();
  emit('close');
};

const handleSubmit = async () => {
  try {
    isSubmitting.value = true;

    // Convert dates to Timestamps
    const dataToSubmit = {
      ...planData.value,
      fechaInicio: Timestamp.fromDate(new Date(planData.value.fechaInicio)),
      fechaFinalizacion: Timestamp.fromDate(new Date(planData.value.fechaFinalizacion)),
      metadatos: {
        ...planData.value.metadatos,
        totalFases: planData.value.fases.length,
      },
    };

    emit('submit', dataToSubmit);
    closeModal();
  } catch (error) {
    console.error('Error submitting plan:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
