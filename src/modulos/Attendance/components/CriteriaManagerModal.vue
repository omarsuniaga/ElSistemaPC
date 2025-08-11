<template>
  <div class="criteria-modal-overlay" @click.self="close">
    <div class="criteria-modal">
      <h2 class="text-lg font-bold mb-2">Gestor de Criterios</h2>
      <ul class="mb-4">
        <li v-for="(criterion, idx) in criteria" :key="idx" class="mb-2 flex items-center justify-between">
          <span>{{ criterion }}</span>
          <button class="text-red-600 text-xs ml-2" @click="removeCriterion(idx)">Eliminar</button>
        </li>
      </ul>
      <input v-model="newCriterion" placeholder="Nuevo criterio..." class="border rounded px-2 py-1 mb-2 w-full" />
      <button class="bg-blue-600 text-white px-4 py-1 rounded" @click="addCriterion">Agregar</button>
      <button class="mt-4 text-gray-600" @click="close">Cerrar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps<{ modelValue: boolean; criteria: string[] }>();
const emit = defineEmits(['update:modelValue', 'update:criteria']);
const newCriterion = ref('');
const criteria = ref([...props.criteria]);

const close = () => emit('update:modelValue', false);
const addCriterion = () => {
  if (newCriterion.value.trim()) {
    criteria.value.push(newCriterion.value.trim());
    emit('update:criteria', criteria.value);
    newCriterion.value = '';
  }
};
const removeCriterion = (idx: number) => {
  criteria.value.splice(idx, 1);
  emit('update:criteria', criteria.value);
};
</script>

<style scoped>
.criteria-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.criteria-modal {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  min-width: 320px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.15);
}
</style>
