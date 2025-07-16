<template>
  <div class="repertoire-view p-6">
    <div class="mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestión de Repertorio</h1>
          <p class="text-gray-600">Organiza y gestiona las colecciones de repertorio musical</p>
        </div>
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          @click="showCreateModal = true"
        >
          Nuevo Repertorio
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
          <select v-model="filters.tipo" class="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Todos los tipos</option>
            <option value="SINFONICA">Sinfónica</option>
            <option value="CAMARA">Cámara</option>
            <option value="CORAL">Coral</option>
            <option value="BANDA">Banda</option>
            <option value="SOLISTA">Solista</option>
            <option value="CONJUNTO">Conjunto</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <select
            v-model="filters.estado"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="EN_REVISION">En Revisión</option>
            <option value="APROBADO">Aprobado</option>
            <option value="EN_MONTAJE">En Montaje</option>
            <option value="SUSPENDIDO">Suspendido</option>
            <option value="COMPLETADO">Completado</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
          <select
            v-model="filters.nivel"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Todos los niveles</option>
            <option value="1">Nivel 1</option>
            <option value="2">Nivel 2</option>
            <option value="3">Nivel 3</option>
            <option value="4">Nivel 4</option>
            <option value="5">Nivel 5</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Búsqueda</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Buscar repertorio..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
    </div>

    <!-- Lista de Repertorios -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
      <p class="text-gray-500 mt-2">Cargando repertorios...</p>
    </div>

    <div v-else-if="filteredRepertoires.length === 0" class="text-center py-8">
      <p class="text-gray-500">No se encontraron repertorios</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RepertoireCard
        v-for="repertoire in filteredRepertoires"
        :key="repertoire.id"
        :repertoire="repertoire"
        @edit="editRepertoire"
        @delete="deleteRepertoire"
        @view="viewRepertoire"
      />
    </div>

    <!-- Paginación -->
    <div v-if="totalPages > 1" class="mt-6 flex justify-center">
      <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
        <button
          :disabled="currentPage === 1"
          class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          @click="currentPage = Math.max(1, currentPage - 1)"
        >
          Anterior
        </button>
        <span
          v-for="page in visiblePages"
          :key="page"
          class="relative inline-flex items-center px-4 py-2 border text-sm font-medium cursor-pointer"
          :class="
            page === currentPage
              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          "
          @click="currentPage = page"
        >
          {{ page }}
        </span>
        <button
          :disabled="currentPage === totalPages"
          class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
        >
          Siguiente
        </button>
      </nav>
    </div>

    <!-- Modal de Crear/Editar -->
    <RepertoireFormModal
      v-if="showCreateModal || showEditModal"
      :repertoire="selectedRepertoire"
      :is-edit="showEditModal"
      @close="closeModals"
      @save="saveRepertoire"
    />

    <!-- Modal de Confirmación de Eliminación -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showDeleteModal = false"
    >
      <div class="bg-white rounded-lg max-w-md w-full mx-4" @click.stop>
        <div class="p-6">
          <h3 class="text-lg font-medium mb-4">Confirmar Eliminación</h3>
          <p class="text-gray-600 mb-6">
            ¿Estás seguro de que quieres eliminar el repertorio "{{ selectedRepertoire?.nombre }}"?
            Esta acción no se puede deshacer.
          </p>
          <div class="flex justify-end space-x-3">
            <button
              class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              @click="showDeleteModal = false"
            >
              Cancelar
            </button>
            <button
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              @click="confirmDelete"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Repertorio } from '../types';
import { useRepertorio } from '../composables/useRepertorio';
import RepertoireCard from '../components/RepertoireCard.vue';
import RepertoireFormModal from '../components/RepertoireFormModal.vue';

const {
  repertorios,
  loading,
  loadRepertorios,
  createRepertorio,
  updateRepertorio,
  deleteRepertorio: deleteRepertoirioService,
} = useRepertorio();

const filters = ref({
  tipo: '',
  estado: '',
  nivel: '',
  search: '',
});

const currentPage = ref(1);
const itemsPerPage = ref(9);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedRepertoire = ref<Repertorio | null>(null);

const filteredRepertoires = computed(() => {
  let filtered = repertorios.value;

  if (filters.value.tipo) {
    filtered = filtered.filter((r) => r.tipo === filters.value.tipo);
  }

  if (filters.value.estado) {
    filtered = filtered.filter((r) => r.estado === filters.value.estado);
  }

  if (filters.value.nivel) {
    filtered = filtered.filter((r) => r.nivelDificultad === parseInt(filters.value.nivel));
  }

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.nombre.toLowerCase().includes(search) ||
        r.descripcion?.toLowerCase().includes(search) ||
        r.etiquetas?.some((tag) => tag.toLowerCase().includes(search)),
    );
  }

  // Paginación
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  return filtered.slice(startIndex, startIndex + itemsPerPage.value);
});

const totalPages = computed(() => {
  let filtered = repertorios.value;

  if (filters.value.tipo) {
    filtered = filtered.filter((r) => r.tipo === filters.value.tipo);
  }

  if (filters.value.estado) {
    filtered = filtered.filter((r) => r.estado === filters.value.estado);
  }

  if (filters.value.nivel) {
    filtered = filtered.filter((r) => r.nivelDificultad === parseInt(filters.value.nivel));
  }

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.nombre.toLowerCase().includes(search) ||
        r.descripcion?.toLowerCase().includes(search) ||
        r.etiquetas?.some((tag) => tag.toLowerCase().includes(search)),
    );
  }

  return Math.ceil(filtered.length / itemsPerPage.value);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  const start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages.value, start + maxVisible - 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

const editRepertoire = (repertoire: Repertorio) => {
  selectedRepertoire.value = repertoire;
  showEditModal.value = true;
};

const deleteRepertoire = (repertoire: Repertorio) => {
  selectedRepertoire.value = repertoire;
  showDeleteModal.value = true;
};

const viewRepertoire = (repertoire: Repertorio) => {
  // Navegar a vista de detalle
  console.log('View repertoire:', repertoire.id);
};

const saveRepertoire = async (repertoire: Repertorio) => {
  try {
    if (showEditModal.value && selectedRepertoire.value) {
      await updateRepertorio(selectedRepertoire.value.id, repertoire);
    } else {
      await createRepertorio(repertoire);
    }
    closeModals();
  } catch (error) {
    console.error('Error saving repertoire:', error);
  }
};

const confirmDelete = async () => {
  if (selectedRepertoire.value) {
    try {
      await deleteRepertoirioService(selectedRepertoire.value.id);
      showDeleteModal.value = false;
      selectedRepertoire.value = null;
    } catch (error) {
      console.error('Error deleting repertoire:', error);
    }
  }
};

const closeModals = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  selectedRepertoire.value = null;
};

onMounted(() => {
  loadRepertorios();
});
</script>
