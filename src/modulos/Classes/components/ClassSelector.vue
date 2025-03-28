<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useClassesStore } from '../../../stores/classes';

const props = defineProps({
  modelValue: String,
  label: {
    type: String,
    default: 'Clase'
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change', 'student-ids-selected']);

// Inicializar el store de clases
const classesStore = useClassesStore();

// Computed property para obtener las clases disponibles
const availableClasses = computed(() => {
  return classesStore.classes || [];
});

// Función para obtener el conteo de estudiantes por nombre de clase
const getStudentCount = (className: string): number => {
  const selectedClass = classesStore.classes.find((cls) => cls.name === className);
  return selectedClass && selectedClass.studentIds ? selectedClass.studentIds.length : 0;
};

const handleClassChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const selectedClassName = target.value;
  emit('update:modelValue', selectedClassName);
  
  // Obtener los IDs de estudiantes y emitirlos al padre
  const selectedClass = classesStore.classes.find((cls) => cls.name === selectedClassName);
  const studentIds = selectedClass && selectedClass.studentIds ? selectedClass.studentIds : [];
  emit('student-ids-selected', studentIds);
  
  emit('change', selectedClassName);
};

// Cargar las clases si aún no están cargadas
onMounted(async () => {
  if (classesStore.classes.length === 0) {
    await classesStore.fetchClasses();
  }
});
</script>

<template>
  <div class="form-control">
    <label :for="'selectedClass'" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <select
        id="selectedClass"
        :value="modelValue"
        @change="handleClassChange"
        :disabled="disabled"
        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200 appearance-none"
      >
        <option value="" disabled>Selecciona una clase</option>
        <option v-for="class_ in availableClasses" :key="class_.id" :value="class_.name">
          {{ class_.name }} ({{ getStudentCount(class_.name) }} alumnos)
        </option>
      </select>
      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>
  </div>
</template>
