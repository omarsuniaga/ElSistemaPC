<template>
  <div class="compas-toolbar bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      <!-- Sección de Selección de Instrumentos -->
      <div class="md:col-span-1">
        <InstrumentGroupSelector
          v-model="selectedInstruments"
          @selection-change="handleInstrumentSelection"
        />
      </div>
      <!-- Sección de Selección de Alumnos -->
      <div class="md:col-span-1">
        <AlumnosSelector
          v-model="selectedAlumnos"
          :clase-id="claseId"
          :instrumento-id="selectedInstruments.length === 1 ? selectedInstruments[0] : ''"
          :with-attendance-filter="true"
          :hide-counter="false"
          :fecha-sesion="new Date().toISOString().split('T')[0]"
          @selection-change="handleAlumnoSelection"
        />
      </div>

      <!-- Sección de Acciones -->
      <div class="md:col-span-1">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Acciones</h4>
        <div class="space-y-2">
          <button
            class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            @click="emit('bulk-select', 'all')"
          >
            Seleccionar Todos los Compases
          </button>
          <button
            class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            @click="emit('bulk-select', 'none')"
          >
            Limpiar Selección
          </button>
          <button
            :disabled="!hasSelection"
            class="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
            @click="openEstadoModal"
          >
            Asignar Estado a Selección
          </button>
        </div>
        <div v-if="selectionCount > 0" class="text-xs text-gray-600 mt-2">
          {{ selectionCount }} compases seleccionados.
        </div>
      </div>
    </div>

    <!-- Modal para asignar estado -->
    <EstadoSelectorModal
      :is-open="isEstadoModalOpen"
      :compases-seleccionados="compasesParaModal"
      :alumnos-disponibles="alumnosParaModal"
      :alumnos-preseleccionados="selectedAlumnos"
      :clase-id="claseId"
      @close="isEstadoModalOpen = false"
      @update="handleEstadoUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, PropType } from 'vue';
import InstrumentGroupSelector from './InstrumentGroupSelector.vue';
import AlumnosSelector from './AlumnosSelector.vue';
import EstadoSelectorModal from './EstadoSelectorModal.vue';
import { TipoInstrumento, EstadoCompass } from '../types';

// Props
const props = defineProps({
  claseId: {
    type: String,
    default: '',
  },
  selectionCount: {
    type: Number,
    default: 0,
  },
  selectedCompases: {
    type: Array as PropType<number[]>,
    default: () => [],
  },
});

// Emits
const emit = defineEmits(['filter-change', 'bulk-select', 'apply-state']);

// State
const selectedInstruments = ref<TipoInstrumento[]>([]);
const selectedAlumnos = ref<string[]>([]);
const isEstadoModalOpen = ref(false);

// Computed
const hasSelection = computed(() => props.selectionCount > 0);

const compasesParaModal = computed(() => {
  return props.selectedCompases.map((num) => ({ numero: num }));
});

const alumnosParaModal = computed(() => {
  // This should ideally be populated from the student store based on the class
  // For now, we'll pass an empty array and let the modal handle it if needed.
  return [];
});

// Methods
const handleInstrumentSelection = (selection: {instrumentos: TipoInstrumento[]}) => {
  emit('filter-change', { instruments: selection.instrumentos, students: selectedAlumnos.value });
};

const handleAlumnoSelection = (selection: {alumnos: string[]}) => {
  emit('filter-change', { instruments: selectedInstruments.value, students: selection.alumnos });
};

const openEstadoModal = () => {
  if (hasSelection.value) {
    isEstadoModalOpen.value = true;
  }
};

const handleEstadoUpdate = (update: {
  estado: EstadoCompass
  observacion: string
  alumnosIds: string[]
  compases: {numero: number}[]
}) => {
  emit('apply-state', {
    ...update,
    instrumentosIds: selectedInstruments.value, // Pass selected instruments
  });
  isEstadoModalOpen.value = false;
};
</script>
