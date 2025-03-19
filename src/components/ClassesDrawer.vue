<template>
  <div
    class="fixed inset-0 overflow-hidden z-30"
    v-if="show"
    @click="closeDrawer"
  >
    <!-- Backdrop with blur -->
    <div class="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
    
    <!-- Drawer Panel -->
    <div class="absolute inset-y-0 right-0 max-w-full flex">
      <div 
        class="relative w-screen max-w-md"
        @click.stop
        ref="drawerPanel"
      >
        <div class="h-full bg-white dark:bg-gray-800 shadow-xl flex flex-col overflow-y-auto">
          <!-- Header -->
          <div class="px-4 py-6 bg-primary-600 dark:bg-primary-700 text-white flex justify-between items-start">
            <div class="pr-8">
              <h2 class="text-xl font-bold">{{ classItem?.name || 'Detalles de Clase' }}</h2>
              <p class="mt-1 text-sm text-white/80">{{ classItem?.instrument }} - {{ classItem?.level }}</p>
            </div>
            <button 
              @click="closeDrawer" 
              class="text-white hover:text-white/80"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Content -->
          <div class="px-4 py-5 sm:px-6 flex-grow">
            <!-- Loading -->
            <div v-if="isLoading" class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
            
            <!-- Class Details -->
            <div v-else-if="classItem" class="space-y-6">
              <!-- Basic Info -->
              <section>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Información General</h3>
                <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Instrumento</p>
                    <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ classItem.instrument || 'No especificado' }}</p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Nivel</p>
                    <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ classItem.level || 'No especificado' }}</p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Profesor</p>
                    <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ teacherName }}</p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Estudiantes</p>
                    <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ studentsCount }} inscritos</p>
                  </div>
                </div>
              </section>
              
              <!-- Descripción -->
              <section v-if="classItem.description">
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Descripción</h3>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{{ classItem.description }}</p>
              </section>
              
              <!-- Horario -->
              <section v-if="classItem.schedule">
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Horario</h3>
                <div class="mt-2 text-sm">
                  <div class="flex gap-2 flex-wrap mb-2">
                    <span 
                      v-for="day in classItem.schedule.days" 
                      :key="day"
                      class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md"
                    >
                      {{ formatDay(day) }}
                    </span>
                  </div>
                  <p v-if="classItem.schedule.startTime && classItem.schedule.endTime" class="text-gray-600 dark:text-gray-300">
                    {{ classItem.schedule.startTime }} - {{ classItem.schedule.endTime }}
                  </p>
                </div>
              </section>
              
              <!-- Estudiantes -->
              <section>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Estudiantes Inscritos</h3>
                <div class="mt-2">
                  <div v-if="students.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
                    No hay estudiantes inscritos en esta clase
                  </div>
                  <ul v-else class="divide-y divide-gray-200 dark:divide-gray-700">
                    <li v-for="student in students" :key="student.id" class="py-3 flex items-center">
                      <img
                        :src="student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.nombre}`"
                        :alt="`${student.nombre} ${student.apellido}`"
                        class="h-8 w-8 rounded-full mr-3"
                      />
                      <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ student.nombre }} {{ student.apellido }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ student.instrumento || 'Sin instrumento asignado' }}</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </section>
            </div>
            
            <!-- Error State -->
            <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">
              No se pudo cargar la información de la clase
            </div>
          </div>
          
          <!-- Footer with Actions -->
          <div class="border-t border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 flex justify-between">
            <button
              @click="$emit('edit', classItem?.id)"
              class="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Editar
            </button>
            <button
              @click="$emit('delete', classItem?.id)"
              class="btn bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useTeachersStore } from '../stores/teachers';
import { useStudentsStore } from '../stores/students';
import type { Class } from '../types/class';

const props = defineProps<{
  show: boolean;
  classItem?: Class;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
}>();

const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();
const isLoading = ref(false);
const drawerPanel = ref<HTMLElement | null>(null);

// Propiedades computadas para mostrar información
const teacherName = computed(() => {
  if (!props.classItem?.teacherId) return 'No asignado';
  return teachersStore.getTeacherNameById(props.classItem.teacherId) || 'No asignado';
});

const studentsCount = computed(() => {
  if (!props.classItem?.studentIds) return 0;
  return props.classItem.studentIds.length;
});

const students = computed(() => {
  if (!props.classItem?.studentIds || props.classItem.studentIds.length === 0) {
    return [];
  }
  
  return studentsStore.students.filter(student => 
    props.classItem?.studentIds?.includes(student.id)
  );
});

// Métodos
const closeDrawer = () => {
  emit('close');
};

const formatDay = (day: string): string => {
  const days: Record<string, string> = {
    'monday': 'Lunes',
    'tuesday': 'Martes',
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'sunday': 'Domingo',
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miércoles': 'Miércoles',
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sábado': 'Sábado',
    'sabado': 'Sábado',
    'domingo': 'Domingo'
  };
  
  return days[day.toLowerCase()] || day;
};

// Manejo de evento escape para cerrar el drawer
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    closeDrawer();
  }
};

// Event listeners
onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape);
});

// Prevent body scroll when drawer is open
watch(() => props.show, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>