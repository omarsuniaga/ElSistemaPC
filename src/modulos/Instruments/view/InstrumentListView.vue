<template>
  <div>
    <h2 class="text-red-500 p-4">Inventario de Instrumentos</h2>
    <div class="flex gap-2 mb-4">
      <button class="px-3 py-1 bg-blue-600 text-white rounded" @click="showFilterModal = true">
        Filtrar
      </button>
      <button class="px-3 py-1 bg-green-600 text-white rounded" @click="showSearchModal = true">
        Buscar
      </button>
    </div>
    <div v-if="loading">Cargando instrumentos...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <div v-else>
      <DataTable :items="filteredInstruments" :columns="columns" />
    </div>

    <InstrumentFilterModal v-model:show="showFilterModal" @apply-filters="onApplyFilters" />
    <InstrumentSearchModal v-model:show="showSearchModal" @apply-search="onApplySearch" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { getInstruments } from '../service/instruments';
import type { InstrumentFirestore } from '../../../types/instrumento';
import DataTable from '../../../components/DataTable.vue';
import InstrumentFilterModal from '../components/InstrumentFilterModal.vue';
import InstrumentSearchModal from '../components/InstrumentSearchModal.vue';

// Definición local del tipo de columna para la tabla
interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

const loading = ref(false);
const error = ref<string | null>(null);
const instrumentos = ref<InstrumentFirestore[]>([]);

const showFilterModal = ref(false);
const showSearchModal = ref(false);

// Filtros activos (pueden ser familia, estado, etc.)
const activeFilters = ref<Record<string, any>>({});

// Instrumentos filtrados (por ahora igual a instrumentos, luego se filtrará)
const filteredInstruments = ref<InstrumentFirestore[]>([]);

const columns: TableColumn[] = [
  { key: 'nombre', label: 'Nombre', sortable: true },
  { key: 'serial', label: 'Serial', sortable: true },
  { key: 'marca', label: 'Marca', sortable: true },
  { key: 'model', label: 'Modelo', sortable: true },
  { key: 'state', label: 'Estado', sortable: true },
  { key: 'familia', label: 'Familia', sortable: true },
];

const fetchInstruments = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await getInstruments();
    // Adaptar los datos para asegurar que cumplen con InstrumentFirestore
    instrumentos.value = data.map((item: any) => ({
      model: item.model || '',
      size: item.size || '',
      state: item.state || '',
      ...item
    }));
  } catch (e: any) {
    error.value = e.message || 'Error al cargar instrumentos';
  } finally {
    loading.value = false;
  }
};

import { watch } from 'vue';
watch([instrumentos, activeFilters], applyFilters, { immediate: true });

// Actualiza la lista filtrada según los filtros activos
function applyFilters() {
  let result = [...instrumentos.value];
  // Ejemplo: filtrar por familia
  if (activeFilters.value.familia) {
    result = result.filter(inst => inst.familia === activeFilters.value.familia);
  }
  // Ejemplo: filtrar por estado
  if (activeFilters.value.state) {
    result = result.filter(inst => inst.state === activeFilters.value.state);
  }
  filteredInstruments.value = result;
}

// Recibe filtros desde el modal
function onApplyFilters(filters: Record<string, any>) {
  activeFilters.value = filters;
  showFilterModal.value = false;
}

// Recibe término de búsqueda desde el modal
function onApplySearch(searchTerm: string) {
  if (!searchTerm) {
    filteredInstruments.value = instrumentos.value;
    showSearchModal.value = false;
    return;
  }
  filteredInstruments.value = instrumentos.value.filter(inst =>
    inst.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.marca.toLowerCase().includes(searchTerm.toLowerCase())
  );
  showSearchModal.value = false;
}

onMounted(fetchInstruments);
</script>
