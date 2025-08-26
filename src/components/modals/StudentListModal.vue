<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" aria-modal="true" role="dialog">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        aria-hidden="true"
        @click="$emit('close')"
      />

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Estudiantes {{ getStatusText(status) }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(date) }} • {{ students.length }} estudiante{{ students.length !== 1 ? 's' : '' }}
              </p>
            </div>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="bg-white dark:bg-gray-800 px-6 py-4">
          <!-- Empty state -->
          <div v-if="students.length === 0" class="text-center py-8">
            <div class="text-gray-500 dark:text-gray-400">
              <UsersIcon class="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p class="text-sm">No hay estudiantes {{ getStatusText(status).toLowerCase() }} en esta fecha.</p>
            </div>
          </div>

          <!-- Students list -->
          <div v-else class="space-y-3 max-h-96 overflow-y-auto">
            <div
              v-for="student in students"
              :key="student.id"
              class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              @click="viewStudentProfile(student.id)"
            >
              <!-- Avatar -->
              <div class="flex-shrink-0">
                <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  <img
                    v-if="student.photoURL"
                    :src="student.photoURL"
                    :alt="student.name"
                    class="h-10 w-10 rounded-full object-cover"
                  />
                  <span v-else>{{ getInitials(student.name) }}</span>
                </div>
              </div>

              <!-- Student info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ student.name }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {{ student.classInfo || 'Sin clase asignada' }}
                </p>
                <div v-if="student.note" class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Nota: {{ student.note }}
                </div>
              </div>

              <!-- Status badge -->
              <div class="flex-shrink-0">
                <span 
                  :class="getStatusBadgeClass(status)"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ getStatusText(status) }}
                </span>
              </div>

              <!-- Arrow icon -->
              <div class="flex-shrink-0">
                <ChevronRightIcon class="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-between items-center">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Total: {{ students.length }} estudiante{{ students.length !== 1 ? 's' : '' }}
          </div>
          <div class="flex space-x-3">
            <button
              v-if="students.length > 0"
              @click="exportList"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Exportar Lista
            </button>
            <button
              @click="$emit('close')"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  XMarkIcon,
  UsersIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline';

interface Student {
  id: string;
  name: string;
  photoURL?: string;
  classInfo?: string;
  note?: string;
}

const props = defineProps<{
  show: boolean;
  date: Date | null;
  status: string;
  students: Student[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'P': 'Presentes',
    'A': 'Ausentes', 
    'T': 'Tardanzas',
    'J': 'Justificados',
    '-': 'Sin Registro',
    '': 'Sin Clase'
  };
  return statusMap[status] || 'Desconocido';
};

const getStatusBadgeClass = (status: string): string => {
  const statusClasses: Record<string, string> = {
    'P': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'A': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'T': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'J': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    '-': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    '': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  };
  return statusClasses[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
};

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return format(date, 'PPPP', { locale: es });
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const viewStudentProfile = (studentId: string) => {
  router.push(`/students/${studentId}`);
  emit('close');
};

const exportList = () => {
  if (!props.date) return;

  const csvContent = [
    ['Nombre', 'Estado', 'Clase', 'Fecha'].join(','),
    ...props.students.map(student => [
      `"${student.name}"`,
      `"${getStatusText(props.status)}"`,
      `"${student.classInfo || 'Sin clase'}"`,
      `"${formatDate(props.date)}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const filename = `estudiantes_${getStatusText(props.status).toLowerCase()}_${format(props.date, 'yyyy-MM-dd')}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>