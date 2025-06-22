<template>
  <div class="class-list space-y-6">
    <!-- Barra de búsqueda -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
      </div>
      <input
        v-model="search"
        type="text"
        placeholder="Buscar clases..."
        class="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600 dark:text-gray-400">Cargando clases...</span>
    </div>

    <!-- No data state -->
    <div v-else-if="filteredClasses.length === 0 && !loading" class="text-center py-12">
      <AcademicCapIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay clases disponibles</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ search ? 'No se encontraron clases con ese término de búsqueda' : 'Comienza creando una nueva clase' }}
      </p>
    </div>

    <!-- Desktop Table -->
    <div v-else class="hidden lg:block">
      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Clase
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Profesor
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Estudiantes
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Horario
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in filteredClasses" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <MusicalNoteIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ item.name }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ item.level }} • {{ item.instrument }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ getTeacherName(item.teacherId) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <UsersIcon class="h-4 w-4 text-gray-400 mr-1" />
                  <span class="text-sm text-gray-900 dark:text-white">{{ item.studentIds?.length || 0 }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ formatSchedule(item.schedule) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <!-- Tooltip wrapper for edit button -->
                  <div class="relative group">
                    <button
                      @click="$emit('edit', item)"
                      class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                      title="Editar clase"
                    >
                      <PencilIcon class="h-4 w-4" />
                    </button>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      Editar clase
                    </div>
                  </div>

                  <!-- Tooltip wrapper for schedule button -->
                  <div class="relative group">
                    <button
                      @click="$emit('view-schedule', item)"
                      class="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900 transition-colors"
                      title="Ver horario"
                    >
                      <CalendarDaysIcon class="h-4 w-4" />
                    </button>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      Ver horario
                    </div>
                  </div>

                  <!-- Tooltip wrapper for delete button -->
                  <div class="relative group">
                    <button
                      @click="$emit('delete', item)"
                      class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                      title="Eliminar clase"
                    >
                      <TrashIcon class="h-4 w-4" />
                    </button>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      Eliminar clase
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Cards -->
    <div class="lg:hidden space-y-4">
      <div
        v-for="item in filteredClasses"
        :key="item.id"
        class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center">
            <div class="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
              <MusicalNoteIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ item.name }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.level }} • {{ item.instrument }}</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-1">
            <button
              @click="$emit('edit', item)"
              class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
            <button
              @click="$emit('view-schedule', item)"
              class="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900 transition-colors"
            >
              <CalendarDaysIcon class="h-4 w-4" />
            </button>
            <button
              @click="$emit('delete', item)"
              class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex items-center">
            <UserIcon class="h-4 w-4 text-gray-400 mr-2" />
            <span class="text-gray-600 dark:text-gray-400">Profesor:</span>
            <span class="ml-1 text-gray-900 dark:text-white">{{ getTeacherName(item.teacherId) }}</span>
          </div>
          
          <div class="flex items-center">
            <UsersIcon class="h-4 w-4 text-gray-400 mr-2" />
            <span class="text-gray-600 dark:text-gray-400">Estudiantes:</span>
            <span class="ml-1 text-gray-900 dark:text-white">{{ item.studentIds?.length || 0 }}</span>
          </div>
          
          <div class="flex items-center">
            <ClockIcon class="h-4 w-4 text-gray-400 mr-2" />
            <span class="text-gray-600 dark:text-gray-400">Horario:</span>
            <span class="ml-1 text-gray-900 dark:text-white">{{ formatSchedule(item.schedule) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTeachersStore } from '../../Teachers/store/teachers';
import type { ClassData } from '../types/class';
import {
  MagnifyingGlassIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  UsersIcon,
  UserIcon,
  ClockIcon,
  CalendarDaysIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline';

const props = defineProps<{
  classes: ClassData[];
  loading?: boolean;
}>();

defineEmits<{
  (e: 'edit', classItem: ClassData): void;
  (e: 'delete', classItem: ClassData): void;
  (e: 'view-schedule', classItem: ClassData): void;
}>();

const search = ref('');
const teachersStore = useTeachersStore();

const filteredClasses = computed(() => {
  if (!search.value) {
    return props.classes;
  }
  
  const searchTerm = search.value.toLowerCase();
  return props.classes.filter(cls => 
    cls.name?.toLowerCase().includes(searchTerm) ||
    cls.level?.toLowerCase().includes(searchTerm) ||
    cls.instrument?.toLowerCase().includes(searchTerm) ||
    getTeacherName(cls.teacherId).toLowerCase().includes(searchTerm)
  );
});

function getTeacherName(teacherId?: string): string {
  if (!teacherId) return 'Sin asignar';
  const teacher = teachersStore.teachers.find(t => t.id === teacherId);
  return teacher ? teacher.name : 'Profesor no encontrado';
}

function formatSchedule(schedule: any): string {
  if (!schedule) return 'Sin horario';
  
  if (Array.isArray(schedule)) {
    return schedule.map(s => `${s.day}: ${s.startTime} - ${s.endTime}`).join(', ');
  }
  
  if (schedule.day && schedule.startTime && schedule.endTime) {
    return `${schedule.day}: ${schedule.startTime} - ${schedule.endTime}`;
  }
  
  return 'Horario no válido';
}
</script>

<style scoped>
/* Custom animations and styles */
.class-list {
  padding: 1.5rem;
}

/* Tooltip positioning */
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}

/* Table hover effects */
.table-row-hover {
  transition: all 0.2s;
}

.table-row-hover:hover {
  transform: scale(1.01);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Mobile card hover effects */
.mobile-card {
  transition: all 0.2s;
}

.mobile-card:hover {
  transform: translateY(-0.25rem);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Loading spinner */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Action button hover effects */
.action-btn {
  transition: all 0.2s;
  transform: scale(1);
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn:active {
  transform: scale(0.95);
}
</style>
