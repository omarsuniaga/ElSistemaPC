<template>
  <TransitionRoot appear show as="template">
    <Dialog as="div" class="relative z-50" @close="emit('cancel')">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/30" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full">
              <!-- Header -->
              <div class="p-6 border-b dark:border-gray-700">
                <div class="flex justify-between items-center">
                  <h2 class="text-lg font-semibold">
                    {{ props.initialData ? "Editar Contenido" : "Nuevo Contenido" }}
                  </h2>
                  <button
                    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="emit('cancel')"
                  >
                    <XMarkIcon class="w-5 h-5" />
                  </button>
                </div>

                <!-- Steps -->
                <div class="mt-4">
                  <div class="flex justify-between">
                    <div
                      v-for="(step, index) in steps"
                      :key="index"
                      class="flex flex-col items-center flex-1"
                    >
                      <div
                        :class="[
                          'w-8 h-8 rounded-full flex items-center justify-center mb-2',
                          index === currentStep
                            ? 'bg-primary-600 text-white'
                            : index < currentStep
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                        ]"
                      >
                        <component :is="step.icon" class="w-5 h-5" />
                      </div>
                      <span class="text-sm font-medium text-center">{{ step.title }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Content -->
              <div class="p-6">
                <!-- Step 1: Basic Information -->
                <div v-if="currentStep === 0" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Título</label>
                    <input v-model="formData.title" type="text" class="input" required />
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-1">Descripción</label>
                    <textarea v-model="formData.description" class="input" rows="3" required />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-1">Nivel</label>
                      <select v-model="formData.level" class="input" required>
                        <option value="">Seleccionar nivel</option>
                        <option v-for="level in levels" :key="level" :value="level">
                          {{ level }}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium mb-1">Clase</label>
                      <select v-model="formData.class" class="input" required>
                        <option value="">Seleccionar clase</option>
                        <option v-for="class_ in classes" :key="class_" :value="class_">
                          {{ class_ }}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium mb-1">Duración</label>
                      <input
                        v-model="formData.duration"
                        type="text"
                        class="input"
                        placeholder="Ej: 2 horas"
                        required
                      />
                    </div>
                  </div>
                </div>

                <!-- Step 2: Objectives and Prerequisites -->
                <div v-if="currentStep === 1" class="space-y-6">
                  <!-- Objectives -->
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <label class="block text-sm font-medium">Objetivos</label>
                      <button
                        type="button"
                        class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                        @click="addObjective"
                      >
                        <PlusCircleIcon class="w-5 h-5" />
                        Añadir
                      </button>
                    </div>
                    <div class="space-y-2">
                      <div
                        v-for="(objective, index) in formData.objectives"
                        :key="index"
                        class="flex gap-2"
                      >
                        <input
                          v-model="formData.objectives[index]"
                          type="text"
                          class="input flex-1"
                          placeholder="Describe un objetivo"
                          required
                        />
                        <button
                          type="button"
                          class="btn bg-red-600 text-white hover:bg-red-700"
                          @click="removeObjective(index)"
                        >
                          <XCircleIcon class="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Prerequisites -->
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <label class="block text-sm font-medium">Prerequisitos</label>
                      <button
                        type="button"
                        class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                        @click="addPrerequisite"
                      >
                        <PlusCircleIcon class="w-5 h-5" />
                        Añadir
                      </button>
                    </div>
                    <div class="space-y-2">
                      <div
                        v-for="(prerequisite, index) in formData.prerequisites"
                        :key="index"
                        class="flex gap-2"
                      >
                        <input
                          v-model="formData.prerequisites[index]"
                          type="text"
                          class="input flex-1"
                          placeholder="Describe un prerequisito"
                          required
                        />
                        <button
                          type="button"
                          class="btn bg-red-600 text-white hover:bg-red-700"
                          @click="removePrerequisite(index)"
                        >
                          <XCircleIcon class="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Step 3: Indicators -->
                <div v-if="currentStep === 2">
                  <div class="flex justify-between items-center mb-4">
                    <div>
                      <h3 class="text-lg font-medium">Indicadores y Ponderaciones</h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        La suma de los pesos debe ser 100%
                      </p>
                    </div>
                    <button
                      type="button"
                      class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                      @click="addIndicator"
                    >
                      <PlusCircleIcon class="w-5 h-5" />
                      Añadir
                    </button>
                  </div>

                  <div class="space-y-4">
                    <div
                      v-for="(indicator, index) in formData.indicators"
                      :key="indicator.id"
                      class="p-4 border dark:border-gray-700 rounded-lg"
                    >
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium mb-1">Nombre del Indicador</label>
                          <input v-model="indicator.name" type="text" class="input" required />
                        </div>
                        <div>
                          <label class="block text-sm font-medium mb-1">Peso (%)</label>
                          <input
                            v-model.number="indicator.weight"
                            type="number"
                            min="0"
                            max="100"
                            class="input"
                            required
                          />
                        </div>
                        <div class="md:col-span-2">
                          <label class="block text-sm font-medium mb-1">Descripción</label>
                          <textarea
                            v-model="indicator.description"
                            class="input"
                            rows="2"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        class="mt-2 btn bg-red-600 text-white hover:bg-red-700"
                        @click="removeIndicator(index)"
                      >
                        Eliminar Indicador
                      </button>
                    </div>
                  </div>

                  <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <p class="text-sm font-medium">
                      Total: {{ formData.indicators.reduce((sum, ind) => sum + ind.weight, 0) }}%
                    </p>
                  </div>
                </div>

                <!-- Step 4: Materials -->
                <div v-if="currentStep === 3">
                  <div class="flex justify-between items-center mb-4">
                    <div>
                      <h3 class="text-lg font-medium">Materiales de Estudio</h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Agrega documentos, videos o audios relacionados
                      </p>
                    </div>
                    <button
                      type="button"
                      class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                      @click="addMaterial"
                    >
                      <PlusCircleIcon class="w-5 h-5" />
                      Añadir
                    </button>
                  </div>

                  <div class="space-y-4">
                    <div
                      v-for="(material, index) in formData.materials"
                      :key="index"
                      class="p-4 border dark:border-gray-700 rounded-lg"
                    >
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium mb-1">Tipo</label>
                          <select v-model="material.type" class="input" required>
                            <option value="document">Documento</option>
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-sm font-medium mb-1">Título</label>
                          <input v-model="material.title" type="text" class="input" required />
                        </div>
                        <div>
                          <label class="block text-sm font-medium mb-1">URL</label>
                          <input v-model="material.url" type="url" class="input" required />
                        </div>
                        <div>
                          <label class="block text-sm font-medium mb-1">Descripción</label>
                          <input v-model="material.description" type="text" class="input" />
                        </div>
                      </div>
                      <button
                        type="button"
                        class="mt-2 btn bg-red-600 text-white hover:bg-red-700"
                        @click="removeMaterial(index)"
                      >
                        Eliminar Material
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Step 5: Evaluation -->
                <div v-if="currentStep === 4">
                  <div class="flex justify-between items-center mb-4">
                    <div>
                      <h3 class="text-lg font-medium">Criterios de Evaluación</h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Define cómo se evaluará el progreso
                      </p>
                    </div>
                    <button
                      type="button"
                      class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                      @click="addEvaluationCriteria"
                    >
                      <PlusCircleIcon class="w-5 h-5" />
                      Añadir
                    </button>
                  </div>

                  <div class="space-y-2">
                    <div
                      v-for="(criteria, index) in formData.evaluationCriteria"
                      :key="index"
                      class="flex gap-2"
                    >
                      <input
                        v-model="formData.evaluationCriteria[index]"
                        type="text"
                        class="input flex-1"
                        placeholder="Describe un criterio de evaluación"
                        required
                      />
                      <button
                        type="button"
                        class="btn bg-red-600 text-white hover:bg-red-700"
                        @click="removeEvaluationCriteria(index)"
                      >
                        <XCircleIcon class="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="p-6 border-t dark:border-gray-700 flex justify-between">
                <button
                  type="button"
                  class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
                  :disabled="currentStep === 0"
                  @click="goBack"
                >
                  <ChevronLeftIcon class="w-5 h-5" />
                  Anterior
                </button>

                <div class="flex gap-3">
                  <button
                    type="button"
                    class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    @click="emit('cancel')"
                  >
                    Cancelar
                  </button>

                  <button
                    v-if="currentStep < steps.length - 1"
                    type="button"
                    class="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                    :disabled="!canGoNext"
                    @click="goNext"
                  >
                    Siguiente
                    <ChevronRightIcon class="w-5 h-5" />
                  </button>

                  <button
                    v-else
                    type="button"
                    class="btn btn-primary"
                    :disabled="!canGoNext"
                    @click="handleSubmit"
                  >
                    {{ props.initialData ? "Guardar Cambios" : "Crear Contenido" }}
                  </button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Dialog, DialogPanel, TransitionRoot, TransitionChild } from '@headlessui/vue';
import {
  PlusCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  ChartBarIcon,
} from '@heroicons/vue/24/outline';
import type { Content, ContentIndicator } from '../types';

const props = defineProps<{
  initialData?: Partial<Content>
}>();

const emit = defineEmits<{
  (e: 'submit', data: Partial<Content>): void
  (e: 'cancel'): void
}>();

const formData = ref({
  title: '',
  description: '',
  level: '',
  class: '',
  objectives: [''],
  prerequisites: [''],
  duration: '',
  indicators: [{ id: 1, name: '', weight: 0, description: '' }] as ContentIndicator[],
  materials: [{ type: 'document', url: '', title: '', description: '' }],
  evaluationCriteria: [''],
  ...props.initialData,
});

const currentStep = ref(0);
const steps = [
  {
    title: 'Información Básica',
    icon: DocumentTextIcon,
    description: 'Detalles generales del contenido',
  },
  {
    title: 'Objetivos y Prerequisitos',
    icon: AcademicCapIcon,
    description: 'Define los objetivos y requisitos previos',
  },
  {
    title: 'Indicadores',
    icon: ChartBarIcon,
    description: 'Establece los indicadores y sus ponderaciones',
  },
  {
    title: 'Materiales',
    icon: BookOpenIcon,
    description: 'Agrega los materiales de estudio',
  },
  {
    title: 'Evaluación',
    icon: ClipboardDocumentListIcon,
    description: 'Define los criterios de evaluación',
  },
];

const levels = ['Principiante', 'Intermedio', 'Avanzado'];
const classes = [
  'Piano - Nivel 1',
  'Piano - Nivel 2',
  'Violín - Nivel 1',
  'Violín - Nivel 2',
  'Guitarra - Nivel 1',
  'Guitarra - Nivel 2',
];

// Array manipulation methods
const addObjective = () => formData.value.objectives.push('');
const removeObjective = (index: number) => formData.value.objectives.splice(index, 1);

const addPrerequisite = () => formData.value.prerequisites.push('');
const removePrerequisite = (index: number) => formData.value.prerequisites.splice(index, 1);

const addIndicator = () => {
  const newId = Math.max(0, ...formData.value.indicators.map((i) => i.id)) + 1;
  formData.value.indicators.push({ id: newId, name: '', weight: 0, description: '' });
};

const removeIndicator = (index: number) => formData.value.indicators.splice(index, 1);

const addMaterial = () => {
  formData.value.materials.push({ type: 'document', url: '', title: '', description: '' });
};

const removeMaterial = (index: number) => formData.value.materials.splice(index, 1);

const addEvaluationCriteria = () => formData.value.evaluationCriteria.push('');
const removeEvaluationCriteria = (index: number) =>
  formData.value.evaluationCriteria.splice(index, 1);

// Navigation and validation
const canGoNext = computed(() => {
  switch (currentStep.value) {
  case 0:
    return (
      formData.value.title &&
        formData.value.description &&
        formData.value.level &&
        formData.value.class &&
        formData.value.duration
    );
  case 1:
    return (
      formData.value.objectives.every((o) => o) && formData.value.prerequisites.every((p) => p)
    );
  case 2:
    return (
      formData.value.indicators.every((i) => i.name && i.weight && i.description) &&
        Math.abs(formData.value.indicators.reduce((sum, ind) => sum + ind.weight, 0) - 100) < 0.01
    );
  case 3:
    return formData.value.materials.every((m) => m.type && m.url && m.title);
  case 4:
    return formData.value.evaluationCriteria.every((c) => c);
  default:
    return false;
  }
});

const goNext = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
};

const goBack = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const handleSubmit = () => {
  if (Math.abs(formData.value.indicators.reduce((sum, ind) => sum + ind.weight, 0) - 100) > 0.01) {
    alert('La suma de los pesos de los indicadores debe ser 100%');
    return;
  }
  emit('submit', formData.value);
};
</script>
