<template>
  <div v-if="props.show" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded shadow-lg p-6 w-full max-w-md">
      <h2 class="text-lg font-bold mb-4">Filtrar Instrumentos</h2>
      <form @submit.prevent="apply">
        <div class="mb-4">
          <label class="block mb-1">Familia</label>
          <select v-model="filters.familia" class="w-full border rounded px-2 py-1">
            <option value="">Todas</option>
            <option v-for="fam in familias" :key="fam" :value="fam">{{ fam }}</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block mb-1">Estado</label>
          <select v-model="filters.state" class="w-full border rounded px-2 py-1">
            <option value="">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="asignado">Asignado</option>
            <option value="dañado">Dañado</option>
            <option value="en reparación">En reparación</option>
          </select>
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class="px-3 py-1 bg-gray-300 rounded" @click="emit('update:show', false)">Cancelar</button>
          <button type="submit" class="px-3 py-1 bg-blue-600 text-white rounded">Aplicar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
const props = defineProps<{ show: boolean }>();
const emit = defineEmits(['update:show', 'apply-filters']);

const familias = [
  'cuerdas',
  'maderas',
  'metales',
  'percusion',
  'coro',
  'accesorios',
];

const filters = ref({
  familia: '',
  state: '',
});

function apply() {
  emit('apply-filters', { ...filters.value });
}

watch(() => props.show, (val) => {
  if (!val) {
    filters.value = { familia: '', state: '' };
  }
});
</script>
