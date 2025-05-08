<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { useRouter } from 'vue-router'; // <-- Importamos useRouter
import { PlusIcon } from '@heroicons/vue/24/outline';
import TeacherClassesCard from './TeacherClassesCard.vue'; // Ajusta la ruta si es necesario

// Define types for class data
interface ClassData {
  id: string;
  name: string;
  // Incluye aquí las otras propiedades que TeacherClassesCard necesita
  level: string;
  instrument?: string;
  schedule?: {
      slots: { day: string | number; startTime: string; endTime: string; }[];
  };
  classroom?: string;
  studentIds?: string[];
}

const props = defineProps<{
  classes: ClassData[]; // Recibe las clases (probablemente ya ordenadas por el padre)
}>();

// Emits for actions from this component
const emit = defineEmits([
  'add-class',         // Emitido al hacer clic en "Nueva Clase"
  // 'view-class',     // Ya no necesitamos re-emitir 'view', navegamos directamente
  'edit-class',        // Re-emitido desde TeacherClassesCard
  'delete-class',      // Re-emitido desde TeacherClassesCard
  'manage-students'  // Re-emitido desde TeacherClassesCard
]);

const router = useRouter(); // <-- Inicializamos router

// Handler para el clic principal en la tarjeta (escucha el evento 'view' de TeacherClassesCard)
const handleCardView = (classId: string) => {
    router.push(`/classes/${classId}`);
};

// Handlers para las otras acciones emitidas por TeacherClassesCard (edit, delete, manage-students)
// Estas funciones simplemente re-emiten los eventos hacia el componente padre de TeachersClassesSection
const handleCardAction = (action: 'edit-class' | 'delete-class' | 'manage-students', classId: string) => {
    // El evento 'take-attendance' es manejado internamente por TeacherClassesCard
    // y realiza la navegación directamente, no necesita re-emitirse aquí.
    emit(action, classId);
};
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
    <h2 class="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4 flex justify-between items-center">
      <span>Mis Clases</span>
      <button
        @click="$emit('add-class')"
        class="flex items-center gap-1 text-xs md:text-sm bg-blue-600 text-white px-2 md:px-3 py-1 rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
      >
        <PlusIcon class="w-3 h-3 md:w-4 md:h-4" />
        Nueva Clase
      </button>
    </h2>

    <!-- Grid de Tarjetas de Clase -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      <template v-if="classes.length > 0">
        <TeacherClassesCard
          v-for="classItem in classes"
          :key="classItem.id"
          :class-data="classItem"
          @view="handleCardView" 
          @edit="(classId) => handleCardAction('edit-class', classId)"
          @delete="(classId) => handleCardAction('delete-class', classId)"
          @manage-students="(classId) => handleCardAction('manage-students', classId)"
          class="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
        />
      </template>

      <!-- Mensaje si no hay clases -->
      <div v-else class="col-span-full py-8 text-center text-gray-500 dark:text-gray-400">
        No tienes clases asignadas actualmente.
        <button @click="$emit('add-class')" class="ml-2 text-blue-500 hover:underline">
          Crear una nueva clase
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Añade aquí cualquier estilo específico para la sección de clases */
</style>