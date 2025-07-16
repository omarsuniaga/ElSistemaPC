<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
    <h2 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Filtros</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Filtro Instrumento -->
      <div class="flex flex-col">
        <label class="form-label">Instrumento</label>
        <div class="relative">
          <select v-model="localFilters.instrument" class="form-input appearance-none">
            <option value="">Todos los instrumentos</option>
            <template v-for="(instruments, family) in instrumentsByFamily" :key="family">
              <optgroup :label="family.charAt(0).toUpperCase() + family.slice(1)">
                <option v-for="instrument in instruments" :key="instrument" :value="instrument">
                  {{ instrument }}
                </option>
              </optgroup>
            </template>
          </select>
        </div>
      </div>
      <!-- Filtro Nivel -->
      <div class="flex flex-col">
        <label class="form-label">Nivel</label>
        <select v-model="localFilters.level" class="form-input">
          <option value="">Todos</option>
          <option v-for="opt in levelOptions" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
      </div>
      <!-- Filtro Profesor -->
      <div class="flex flex-col">
        <label class="form-label">Profesor</label>
        <select v-model="localFilters.teacherId" class="form-input">
          <option value="">Todos</option>
          <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
            {{ teacher.name }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

// Props para pasar datos desde el componente padre
interface TeacherData {
  id: string
  name: string
  [key: string]: any
}

defineProps<{
  teachers: TeacherData[]
  instrumentsByFamily: Record<string, string[]>
  levelOptions: string[]
}>();

// Filtros locales, que se comunicarán hacia el componente padre
const localFilters = ref({
  instrument: '',
  level: '',
  teacherId: '',
});

// Emitir cambios
const emit = defineEmits<{
  (e: 'update-filters', filters: typeof localFilters.value): void
}>();

watch(
  localFilters,
  (newFilters) => {
    emit('update-filters', newFilters);
  },
  { deep: true },
);
</script>
