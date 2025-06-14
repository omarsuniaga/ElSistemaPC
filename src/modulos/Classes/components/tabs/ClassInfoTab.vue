<template>
  <div class="class-info-tab p-4">
    <h3 class="text-xl font-semibold mb-4 text-gray-800">Detalles de la Clase</h3>

    <div v-if="classData" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p class="text-sm text-gray-600 font-medium">Nombre:</p>
        <p class="text-gray-800">{{ classData.name }}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600 font-medium">Instrumento:</p>
        <p class="text-gray-800">{{ classData.instrument }}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600 font-medium">Nivel:</p>
        <p class="text-gray-800">{{ classData.level }}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600 font-medium">Profesor:</p>
        <p class="text-gray-800">{{ teacher ? teacher.name : 'No asignado' }}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600 font-medium">Día de la Semana:</p>
        <p class="text-gray-800">{{ classData.dayOfWeek || 'No especificado' }}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600 font-medium">Hora de Inicio:</p>
        <p class="text-gray-800">{{ classData.startTime || 'No especificada' }}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600 font-medium">Duración:</p>
        <p class="text-gray-800">{{ classData.durationMinutes ? classData.durationMinutes + ' minutos' : 'No especificada' }}</p>
      </div>
      <div>
        <p class="text-sm text-gray-600 font-medium">Cupo Máximo:</p>
        <p class="text-gray-800">{{ classData.maxStudents !== undefined ? classData.maxStudents : 'No especificado' }}</p>
      </div>
       <div>
        <p class="text-sm text-gray-600 font-medium">Estudiantes Inscritos:</p>
        <p class="text-gray-800">{{ students ? students.length : 0 }}</p>
      </div>
    </div>
    <div v-else>
      <p class="text-gray-500">No hay información disponible para esta clase.</p>
    </div>

    <div v-if="classData && classData.description" class="mt-6">
        <h4 class="text-md font-semibold mb-2 text-gray-700">Descripción:</h4>
        <p class="text-gray-800 whitespace-pre-line">{{ classData.description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import type { ClassData } from '../../types/class'; // Adjust path as necessary

// Define a basic Teacher type, replace with actual type from your store/types
interface Teacher {
  id: string;
  name: string;
  // Add other teacher properties as needed
}

// Define a basic Student type, replace with actual type from your store/types
interface Student {
  id: string;
  nombre: string;
  apellido: string;
  // Add other student properties as needed
}

const props = defineProps({
  classData: {
    type: Object as PropType<ClassData | null>,
    default: null
  },
  teacher: {
    type: Object as PropType<Teacher | null>,
    default: null
  },
  students: {
    type: Array as PropType<Student[]>,
    default: () => []
  }
});

</script>

<style scoped>
.class-info-tab {
  /* Add any specific styling for this tab */
}
.whitespace-pre-line {
  white-space: pre-line;
}
</style>
