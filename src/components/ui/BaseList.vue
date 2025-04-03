<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  items: any[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  keyField?: string;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
  error: null,
  emptyMessage: 'No hay elementos para mostrar',
  keyField: 'id'
})

const emit = defineEmits<{
  (e: 'item-click', item: any): void;
}>()

const hasItems = computed(() => props.items.length > 0)
</script>

<template>
  <div class="list-container">
    <!-- Estado de carga -->
    <div v-if="loading" class="list-loading">
      <slot name="loading">
        <div class="loading-indicator">
          <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Cargando...</span>
        </div>
      </slot>
    </div>
    
    <!-- Estado de error -->
    <div v-else-if="error" class="list-error">
      <slot name="error" :error="error">
        <div class="error-message">
          <span class="error-icon">⚠️</span>
          <p>Error al cargar los datos: {{ error }}</p>
        </div>
      </slot>
    </div>
    
    <!-- Lista vacía -->
    <div v-else-if="!hasItems" class="list-empty">
      <slot name="empty">
        <p class="empty-message">{{ emptyMessage }}</p>
      </slot>
    </div>
    
    <!-- Lista con elementos -->
    <ul v-else class="list">
      <li 
        v-for="(item, index) in items" 
        :key="item[keyField] || index" 
        class="list-item"
        @click="emit('item-click', item)"
      >
        <slot name="item" :item="item" :index="index">
          {{ item.name || item.title || JSON.stringify(item) }}
        </slot>
      </li>
    </ul>
    
    <!-- Paginación o carga adicional si es necesario -->
    <div v-if="hasItems" class="list-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
.list-container {
  width: 100%;
}

.list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.list-item {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.list-item:last-child {
  border-bottom: none;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #4a5568;
}

.error-message {
  background-color: #fff5f5;
  color: #c53030;
  padding: 1rem;
  border-radius: 0.375rem;
  border-left: 4px solid #c53030;
  margin: 1rem 0;
}

.error-icon {
  margin-right: 0.5rem;
}

.empty-message {
  text-align: center;
  color: #718096;
  padding: 2rem 0;
}

.list-footer {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}
</style>