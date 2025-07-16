<template>
  <div class="instrument-selector">
    <div class="mb-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Selección de instrumentos</h4>

      <!-- Selector de categoría de instrumento -->
      <div class="flex flex-wrap gap-2 mb-3">
        <button
          v-for="family in instrumentFamilies"
          :key="family.key"
          class="px-3 py-1 text-xs rounded-md transition-colors"
          :class="[
            selectedFamily === family.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
          ]"
          @click="selectFamily(family.key)"
        >
          {{ family.label }}
        </button>
      </div>

      <!-- Lista de instrumentos según categoría -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div
          v-for="instrument in filteredInstruments"
          :key="instrument.id"
          class="flex items-center space-x-2 px-3 py-2 rounded-md cursor-pointer transition-colors"
          :class="[
            selectedInstruments.includes(instrument.id)
              ? 'bg-blue-100 border border-blue-300'
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100',
          ]"
          @click="toggleInstrument(instrument.id)"
        >
          <input
            type="checkbox"
            :checked="selectedInstruments.includes(instrument.id)"
            class="form-checkbox h-4 w-4 text-blue-600"
            @click.stop
          />
          <span class="text-sm">{{ instrument.label }}</span>
        </div>
      </div>
    </div>

    <!-- Selector de filas (si aplica) -->
    <div v-if="showRows && currentClass" class="mt-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Filas de {{ currentClass.nombre }}</h4>
      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="row in currentClass.filas"
          :key="row.id"
          class="flex items-center space-x-2 px-3 py-2 rounded-md cursor-pointer transition-colors"
          :class="[
            selectedRows.includes(row.id)
              ? 'bg-blue-100 border border-blue-300'
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100',
          ]"
          @click="toggleRow(row.id)"
        >
          <input
            type="checkbox"
            :checked="selectedRows.includes(row.id)"
            class="form-checkbox h-4 w-4 text-blue-600"
            @click.stop
          />
          <span class="text-sm">{{ row.nombre }}</span>
        </div>
      </div>
    </div>

    <!-- Resumen de selección -->
    <div v-if="selectedInstruments.length > 0" class="mt-4 p-3 bg-blue-50 rounded-md">
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-blue-800">
          {{ selectedInstruments.length }}
          {{ selectedInstruments.length === 1 ? "instrumento" : "instrumentos" }} seleccionado(s)
        </span>
        <button class="text-xs text-blue-700 hover:text-blue-900" @click="clearSelection">
          Limpiar selección
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, PropType, watch } from 'vue';
import { TipoInstrumento, INSTRUMENT_FAMILIES, INSTRUMENT_DISPLAY_NAMES } from '../types';
import { useClassesStore } from '@/modulos/Classes/store/classes';

const props = defineProps({
  // Valores inicialmente seleccionados
  modelValue: {
    type: Array as PropType<TipoInstrumento[]>,
    default: () => [],
  },

  // Mostrar selector de filas
  showRows: {
    type: Boolean,
    default: false,
  },

  // ID de la clase actual (para integración con módulo Classes)
  classId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'selection-change']);

// Estado local
const selectedFamily = ref<string>('all');
const selectedInstruments = ref<TipoInstrumento[]>(props.modelValue);
const selectedRows = ref<string[]>([]);
const classStore = useClassesStore();

// Familias de instrumentos
const instrumentFamilies = [
  { key: 'all', label: 'Todos' },
  { key: 'STRINGS', label: 'Cuerdas' },
  { key: 'WOODWINDS', label: 'Vientos Madera' },
  { key: 'BRASS', label: 'Vientos Metal' },
  { key: 'PERCUSSION', label: 'Percusión' },
  { key: 'KEYBOARD', label: 'Teclados' },
  { key: 'OTHER', label: 'Otros' },
];

// Lista completa de instrumentos con etiquetas legibles
const allInstruments = computed(() => {
  const result = [];
  for (const [id, label] of Object.entries(INSTRUMENT_DISPLAY_NAMES)) {
    result.push({
      id: id as TipoInstrumento,
      label,
    });
  }
  return result;
});

// Instrumentos filtrados por familia seleccionada
const filteredInstruments = computed(() => {
  if (selectedFamily.value === 'all') {
    return allInstruments.value;
  }

  const familyKey = selectedFamily.value as keyof typeof INSTRUMENT_FAMILIES;
  const familyInstruments = INSTRUMENT_FAMILIES[familyKey] || [];

  return allInstruments.value.filter((instr) => familyInstruments.includes(instr.id));
});

// Clase actual (integración con módulo Classes)
const currentClass = computed(() => {
  if (!props.classId) return null;
  return classStore.getClassById(props.classId);
});

// Métodos
const selectFamily = (family: string) => {
  selectedFamily.value = family;
};

const toggleInstrument = (instrumentId: TipoInstrumento) => {
  const index = selectedInstruments.value.indexOf(instrumentId);
  if (index === -1) {
    selectedInstruments.value.push(instrumentId);
  } else {
    selectedInstruments.value.splice(index, 1);
  }

  emitUpdate();
};

const toggleRow = (rowId: string) => {
  const index = selectedRows.value.indexOf(rowId);
  if (index === -1) {
    selectedRows.value.push(rowId);

    // Añadir automáticamente los instrumentos de esta fila
    if (currentClass.value) {
      const row = currentClass.value.filas.find((f) => f.id === rowId);
      if (row?.instrumentos) {
        row.instrumentos.forEach((instr) => {
          if (!selectedInstruments.value.includes(instr)) {
            selectedInstruments.value.push(instr);
          }
        });
      }
    }
  } else {
    selectedRows.value.splice(index, 1);

    // Opcional: Quitar automáticamente los instrumentos de esta fila
    // (dependiendo del comportamiento deseado)
  }

  emitUpdate();
};

const clearSelection = () => {
  selectedInstruments.value = [];
  selectedRows.value = [];
  emitUpdate();
};

const emitUpdate = () => {
  emit('update:modelValue', selectedInstruments.value);
  emit('selection-change', {
    instrumentos: selectedInstruments.value,
    filas: selectedRows.value,
  });
};

// Cargar clase si se proporciona classId
watch(
  () => props.classId,
  async (newId) => {
    if (newId && !currentClass.value) {
      await classStore.fetchClassById(newId);
    }
  },
  { immediate: true },
);

// Sincronizar con prop modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(selectedInstruments.value)) {
      selectedInstruments.value = [...newVal];
    }
  },
);
</script>

<style scoped>
.instrument-selector {
  @apply w-full;
}
</style>
