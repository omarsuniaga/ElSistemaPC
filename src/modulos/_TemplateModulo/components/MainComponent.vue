<!-- 
  📦 COMPONENTE PRINCIPAL DEL MÓDULO TEMPLATE
  Este es un ejemplo de cómo estructurar componentes en el módulo
-->
<template>
  <div class="template-main">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <!-- Header del componente -->
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ title }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          {{ description }}
        </p>
      </div>

      <!-- Contenido principal -->
      <div class="space-y-4">
        <!-- Lista de elementos -->
        <div v-if="items.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ListComponent
            v-for="item in items"
            :key="item.id"
            :item="item"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>

        <!-- Estado vacío -->
        <div v-else class="text-center py-12">
          <div class="text-gray-400 text-6xl mb-4">📦</div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay elementos
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            Agrega tu primer elemento para comenzar
          </p>
          <button
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            @click="handleAdd"
          >
            Agregar elemento
          </button>
        </div>
      </div>

      <!-- Acciones -->
      <div class="mt-6 flex justify-between items-center">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Total: {{ items.length }} elementos
        </div>
        
        <div class="space-x-2">
          <button
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            @click="handleRefresh"
          >
            Actualizar
          </button>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            @click="handleAdd"
          >
            Nuevo elemento
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import ListComponent from './ListComponent.vue';
import { useTemplateStore } from '../store/templateStore';
import { useTemplate } from '../composables/useTemplate';
import type { TemplateItem } from '../types/template.types';

// Props
interface Props {
  title?: string
  description?: string
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Template Module',
  description: 'Ejemplo de componente principal del módulo',
  showActions: true,
});

// Emits
const emit = defineEmits<{
  'item-added': [item: TemplateItem]
  'item-edited': [item: TemplateItem]
  'item-deleted': [id: string]
}>();

// Store y composables
const templateStore = useTemplateStore();
const { loading, error, refreshItems } = useTemplate();

// Estado local
const items = computed(() => templateStore.items);

// Métodos
const handleAdd = () => {
  // Lógica para agregar nuevo elemento
  console.log('Agregar nuevo elemento');
  emit('item-added', {
    id: Date.now().toString(),
    name: 'Nuevo elemento',
    description: 'Descripción del elemento',
    createdAt: new Date(),
  } as TemplateItem);
};

const handleEdit = (item: TemplateItem) => {
  console.log('Editar elemento:', item);
  emit('item-edited', item);
};

const handleDelete = (item: TemplateItem) => {
  console.log('Eliminar elemento:', item);
  emit('item-deleted', item.id);
};

const handleRefresh = async () => {
  await refreshItems();
};

// Lifecycle
onMounted(() => {
  templateStore.fetchItems();
});
</script>

<style scoped>
.template-main {
  /* Estilos específicos del componente */
}

/* Animaciones suaves */
.transition-colors {
  transition: all 0.2s ease-in-out;
}

/* Responsive */
@media (max-width: 640px) {
  .grid-cols-1 {
    grid-template-columns: 1fr;
  }
}
</style>
