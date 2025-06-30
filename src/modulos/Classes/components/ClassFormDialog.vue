<template>
  <Dialog :open="open" @close="$emit('close')" class="relative z-50">
    <div class="fixed inset-0 bg-black/30 dark:bg-black/50" aria-hidden="true" />
    
    <div class="fixed inset-0 flex w-screen items-start justify-center p-4 pb-20 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center">
        <DialogPanel class="mx-auto max-w-3xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[calc(100vh-8rem)] flex flex-col my-8">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg">
          <div>
            <DialogTitle as="h3" class="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
              {{ isEditing ? 'Editar Clase' : 'Nueva Clase' }}
            </DialogTitle>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ isEditing ? 'Modifica los detalles de la clase' : 'Configura una nueva clase con maestros y estudiantes' }}
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Form -->
        <div class="flex-1 overflow-y-auto">
          <form id="class-form" @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Class Name -->
            <div class="md:col-span-2">
              <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de la Clase *
              </label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: Piano Intermedio A"
              />
            </div>

            <!-- Instrument -->
            <div>
              <label for="instrument" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Instrumento *
              </label>
              <input
                id="instrument"
                v-model="form.instrument"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ej: Piano, Guitarra, Violín, Flauta, etc."
              />
            </div>

            <!-- Programs -->
            <div>
              <label for="level" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Programas *
              </label>
              <select
                id="level"
                v-model="form.level"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Seleccionar programa</option>
                <option value="preparatoria">Preparatoria</option>
                <option value="teoria-musical">Teoría Musical</option>
                <option value="coro">Coro</option>
                <option value="orquesta">Orquesta</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <!-- Status -->
            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado *
              </label>
              <select
                id="status"
                v-model="form.status"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
                <option value="suspended">Suspendida</option>
              </select>
            </div>

            <!-- Capacidad ilimitada (campo oculto) -->
            <input type="hidden" v-model="form.capacity" value="0" />
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Descripción de la clase, objetivos, metodología..."
            />
          </div>

          <!-- Teachers Section -->
          <div class="space-y-4">
            <h4 class="text-md font-medium text-gray-900 dark:text-white">Maestros</h4>
            
            <!-- Main Teacher -->
            <div>
              <label for="teacherId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maestro Principal *
              </label>
              <select
                id="teacherId"
                v-model="form.teacherId"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Seleccionar maestro principal</option>
                <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.name }}
                </option>
              </select>
            </div>

            <!-- Shared Teachers -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maestros Colaboradores
              </label>
              <div class="max-h-40 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-700">
                <div v-for="teacher in availableSharedTeachers" :key="teacher.id" class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
                  <div class="flex items-center">
                    <input
                      :id="`teacher-${teacher.id}`"
                      v-model="form.sharedWith"
                      type="checkbox"
                      :value="teacher.id"
                      class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label :for="`teacher-${teacher.id}`" class="ml-3 text-sm text-gray-700 dark:text-gray-200">
                      {{ teacher.name }}
                    </label>
                  </div>
                  
                  <select
                    v-if="form.sharedWith.includes(teacher.id)"
                    :value="getTeacherPermissionLevel(teacher.id)"
                    @change="updateTeacherPermission(teacher.id, ($event.target as HTMLSelectElement)?.value || 'read')"
                    class="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <option value="read">Solo lectura</option>
                    <option value="write">Editor</option>
                    <option value="manage">Administrador</option>
                  </select>
                </div>
                <!-- Empty state -->
                <div v-if="availableSharedTeachers.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No hay maestros disponibles para colaborar
                </div>
              </div>
            </div>
          </div>

          <!-- Students Section -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estudiantes
            </label>
            
            <!-- Search Input -->
            <div class="mb-3">
              <input
                v-model="studentSearchTerm"
                type="text"
                placeholder="Buscar por nombre, apellido o instrumento..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div class="relative h-60 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
              <VirtualizedList
                v-if="filteredStudents.length > 0"
                :items="filteredStudents"
                :item-size="60"
                class="h-full"
              >
                <template #item="{ item: student }">
                  <div 
                    class="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700"
                    @click="toggleStudent(student.id)"
                    v-memo="[form.studentIds.includes(student.id), student]"
                  >
                    <input 
                      type="checkbox" 
                      :checked="form.studentIds.includes(student.id)"
                      class="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      @click.stop
                    >
                    <div class="ml-3 flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {{ student.nombre }} {{ student.apellido }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {{ student.instrumento }}
                      </p>
                    </div>
                  </div>
                </template>
              </VirtualizedList>
              <div v-else class="h-full flex items-center justify-center text-gray-500">
                No se encontraron estudiantes
              </div>
              <!-- Empty state -->
              <div v-if="filteredStudents.length === 0 && studentSearchTerm.trim() !== ''" class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No se encontraron estudiantes que coincidan con "{{ studentSearchTerm }}"
              </div>
              <div v-else-if="students.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No hay estudiantes disponibles
              </div>
            </div>
          </div>

          <!-- Schedule Section -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-md font-medium text-gray-900 dark:text-white">Horarios</h4>
              <button
                type="button"
                @click="addScheduleSlot"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Agregar Horario
              </button>
            </div>
            
            <!-- Multiple Schedule Slots -->
            <div class="space-y-3">
              <div
                v-for="(slot, index) in form.schedules"
                :key="index"
                class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
              >
                <div class="flex items-start justify-between mb-3">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Horario {{ index + 1 }}
                  </span>
                  <button
                    v-if="form.schedules.length > 1"
                    type="button"
                    @click="removeScheduleSlot(index)"
                    class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label :for="`day-${index}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Día de la Semana
                    </label>
                    <select
                      :id="`day-${index}`"
                      v-model="slot.day"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleccionar día</option>
                      <option value="monday">Lunes</option>
                      <option value="tuesday">Martes</option>
                      <option value="wednesday">Miércoles</option>
                      <option value="thursday">Jueves</option>
                      <option value="friday">Viernes</option>
                      <option value="saturday">Sábado</option>
                    </select>
                  </div>

                  <div>
                    <label :for="`startTime-${index}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hora de Inicio
                    </label>
                    <input
                      :id="`startTime-${index}`"
                      v-model="slot.startTime"
                      type="time"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label :for="`endTime-${index}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hora de Fin
                    </label>
                    <input
                      :id="`endTime-${index}`"
                      v-model="slot.endTime"
                      type="time"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <!-- Schedule Summary -->
                <div v-if="slot.day && slot.startTime && slot.endTime" class="mt-3 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                  <p class="text-sm text-indigo-700 dark:text-indigo-300">
                    <span class="font-medium">{{ getDayName(slot.day) }}</span>
                    de {{ formatTime(slot.startTime) }} a {{ formatTime(slot.endTime) }}
                  </p>
                </div>
              </div>
              
              <!-- Empty state -->
              <div v-if="form.schedules.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="mt-2 text-sm">No hay horarios configurados</p>
                <button
                  type="button"
                  @click="addScheduleSlot"
                  class="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
                >
                  Agregar primer horario
                </button>
              </div>
            </div>
          </div>
          </form>
        </div>
        
        <!-- Actions - Fixed at bottom -->
        <div class="flex items-center justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4 rounded-b-lg">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="class-form"
            :disabled="!isFormValid || saving"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="saving" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </span>
            <span v-else>
              {{ isEditing ? 'Guardar Cambios' : 'Crear Clase' }}
            </span>
          </button>
        </div>
        </DialogPanel>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, shallowRef, nextTick, defineAsyncComponent } from 'vue';
import { debounce } from 'lodash-es';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useStudentsStore } from '../../Students/store/students';
import { useNotification } from '@/composables/useNotification';
import type { ClassData } from '../types/class';

const props = defineProps<{
  open: boolean;
  classData?: ClassData | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', data: Partial<ClassData>): void;
}>();

const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();
const { showNotification } = useNotification();

const saving = ref(false);
const studentSearchTerm = ref('');

const form = ref({
  name: '',
  instrument: '',
  level: '',
  status: 'active' as 'active' | 'inactive' | 'suspended',
  description: '',
  capacity: 8,
  teacherId: '',
  studentIds: [] as string[],
  sharedWith: [] as string[],
  permissions: {} as Record<string, string[]>,
  schedules: [{
    day: '',
    startTime: '',
    endTime: ''
  }] as { day: string; startTime: string; endTime: string }[]
});

const isEditing = computed(() => !!props.classData);

// Importar el componente de lista virtualizada
const VirtualizedList = defineAsyncComponent(() => 
  import('@/components/VirtualizedList.vue')
);

// Datos con carga perezosa
const teachers = shallowRef<any[]>([]);
const students = shallowRef<any[]>([]);
const loading = ref({
  teachers: false,
  students: false
});

// Función memoizada para normalizar texto
const normalizeText = ((cache = new Map()) => (text: string): string => {
  if (!text) return '';
  if (cache.has(text)) return cache.get(text);
  
  const normalized = String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  
  cache.set(text, normalized);
  if (cache.size > 1000) cache.delete(cache.keys().next().value);
  return normalized;
})();

// Búsqueda con debounce
const updateStudentSearch = debounce((term: string) => {
  studentSearchTerm.value = term;
}, 300);

// Función de filtrado optimizada
const filterStudents = (items: any[], searchTerm: string) => {
  if (!searchTerm) return items;
  const normalizedSearch = normalizeText(searchTerm);
  if (!normalizedSearch) return items;
  
  return items.filter(item => {
    const nombre = normalizeText(item.nombre);
    const apellido = normalizeText(item.apellido);
    const instrumento = normalizeText(item.instrumento);
    
    return (
      nombre.includes(normalizedSearch) ||
      apellido.includes(normalizedSearch) ||
      `${nombre} ${apellido}`.includes(normalizedSearch) ||
      instrumento.includes(normalizedSearch) ||
      nombre.split(' ').some((part: string) => part.startsWith(normalizedSearch)) ||
      apellido.split(' ').some((part: string) => part.startsWith(normalizedSearch))
    );
  });
};

// Lista de estudiantes filtrada con memoización
const filteredStudents = computed(() => {
  return filterStudents(students.value, studentSearchTerm.value);
});

const availableSharedTeachers = computed(() => 
  teachers.value.filter(teacher => teacher.id !== form.value.teacherId)
);

const isFormValid = computed(() => {
  return form.value.name.trim() !== '' &&
         form.value.instrument !== '' &&
         form.value.level !== '' &&
         form.value.teacherId !== '';
});

// Helper functions for permissions
const getTeacherPermissionLevel = (teacherId: string): string => {
  const permissions = form.value.permissions[teacherId];
  if (!permissions || permissions.length === 0) return 'read';
  
  if (permissions.includes('manage')) return 'manage';
  if (permissions.includes('write')) return 'write';
  return 'read';
};

const updateTeacherPermission = (teacherId: string, level: string) => {
  switch (level) {
    case 'read':
      form.value.permissions[teacherId] = ['read'];
      break;
    case 'write':
      form.value.permissions[teacherId] = ['read', 'write'];
      break;
    case 'manage':
      form.value.permissions[teacherId] = ['read', 'write', 'manage'];
      break;
    default:
      form.value.permissions[teacherId] = ['read'];
  }
};

// Function to clear search when a student is selected
const onStudentSelected = () => {
  // Clear search term after selection to allow searching for more students
  studentSearchTerm.value = '';
};

// Functions for managing multiple schedules
const addScheduleSlot = () => {
  form.value.schedules.push({
    day: '',
    startTime: '',
    endTime: ''
  });
};

const removeScheduleSlot = (index: number) => {
  if (form.value.schedules.length > 1) {
    form.value.schedules.splice(index, 1);
  }
};

// Cache para días de la semana
const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const dayIndexMap = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6
};

// Helper functions for schedule display
const getDayName = (day: string): string => {
  if (!day) return '';
  const dayLower = day.toLowerCase();
  const index = dayIndexMap[dayLower as keyof typeof dayIndexMap];
  return index !== undefined ? dayNames[index] : day;
};

/**
 * Formatea un valor de tiempo a formato HH:mm con caché
 */
const formatTimeToHHMM = (time: string | Date | { hours: number; minutes: number }): string => {
  if (!time) return '';
  
  // Generar clave de caché
  const cacheKey = typeof time === 'object' 
    ? JSON.stringify(time)
    : String(time);
  
  // Verificar caché
  if (timeCache.has(cacheKey)) {
    return timeCache.get(cacheKey);
  }
  
  let result = '';
  
  try {
    // Si ya es un string en formato HH:mm, usarlo directamente
    if (typeof time === 'string' && /^\d{2}:\d{2}$/.test(time)) {
      result = time;
    } 
    // Si es un objeto con horas y minutos
    else if (typeof time === 'object' && 'hours' in time && 'minutes' in time) {
      const hours = String(time.hours).padStart(2, '0');
      const minutes = String(time.minutes).padStart(2, '0');
      result = `${hours}:${minutes}`;
    }
    // Si es un objeto Date
    else if (time instanceof Date) {
      result = time.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    }
    // Si es un string con formato de hora
    else if (typeof time === 'string') {
      const date = new Date(`2000-01-01T${time}`);
      if (!isNaN(date.getTime())) {
        result = date.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
      }
    }
    
    // Si no se pudo formatear, usar el valor original
    if (!result) {
      result = String(time);
    }
    
    // Guardar en caché
    timeCache.set(cacheKey, result);
    
    // Limpiar caché si es muy grande (prevenir memory leaks)
    if (timeCache.size > 1000) {
      const firstKey = timeCache.keys().next().value;
      timeCache.delete(firstKey);
    }
    
    return result;
  } catch (e) {
    console.warn('Error formateando hora:', time, e);
    return String(time);
  }
};

/**
 * Función de compatibilidad para formatear la hora (mantenida por compatibilidad)
 */
formatTime = (time: string | Date | { hours: number; minutes: number }): string => {
  return formatTimeToHHMM(time);
}

// Watch con debounce para cambios en sharedWith
watch(() => form.value.sharedWith, debounce((newSharedWith, oldSharedWith) => {
  // Remove permissions for teachers that are no longer shared
  if (oldSharedWith) {
    oldSharedWith.forEach(teacherId => {
      if (!newSharedWith.includes(teacherId)) {
        delete form.value.permissions[teacherId];
      }
    });
  }
  
  // Add default permissions for new shared teachers
  newSharedWith.forEach(teacherId => {
    if (!form.value.permissions[teacherId]) {
      form.value.permissions[teacherId] = ['read'];
    }
  });
}, 300), { deep: true });

// Watch for classData changes to populate form
watch(() => props.classData, (classData) => {
  if (classData) {
    // Handle schedule conversion from old format to new format
    let schedules: { day: string; startTime: string; endTime: string }[] = [];
    
    if (classData.schedule) {
      if ('slots' in classData.schedule && Array.isArray(classData.schedule.slots)) {
        // New format: multiple schedules
        schedules = classData.schedule.slots;
      } else if ('day' in classData.schedule) {
        // Old format: single schedule
        schedules = [{
          day: classData.schedule.day || '',
          startTime: classData.schedule.startTime || '',
          endTime: classData.schedule.endTime || ''
        }];
      }
    }
    
    // Ensure at least one empty schedule slot
    if (schedules.length === 0) {
      schedules = [{
        day: '',
        startTime: '',
        endTime: ''
      }];
    }
    
    form.value = {
      name: classData.name || '',
      instrument: classData.instrument || '',
      level: classData.level || '',
      status: classData.status || 'active',
      description: classData.description || '',
      capacity: classData.capacity || 8,
      teacherId: classData.teacherId || '',
      studentIds: classData.studentIds || [],
      sharedWith: classData.sharedWith || [],
      permissions: classData.permissions || {} as Record<string, string[]>,
      schedules: schedules
    };
  } else {
    resetForm();
  }
}, { immediate: true });

function resetForm() {
  form.value = {
    name: '',
    instrument: '',
    level: '',
    status: 'active',
    description: '',
    capacity: 8,
    teacherId: '',
    studentIds: [],
    sharedWith: [],
    permissions: {},
    schedules: [{
      day: '',
      startTime: '',
      endTime: ''
    }]
  };
  studentSearchTerm.value = '';
}

// Validación de horarios con memoización
const validSchedules = computed(() => {
  const cacheKey = JSON.stringify(form.value.schedules);
  if (validSchedulesCache.has(cacheKey)) {
    return validSchedulesCache.get(cacheKey);
  }
  
  const result = form.value.schedules
    .filter(schedule => schedule.day && schedule.startTime && schedule.endTime)
    .map(schedule => ({
      ...schedule,
      startTime: formatTimeToHHMM(schedule.startTime),
      endTime: formatTimeToHHMM(schedule.endTime)
    }));
  
  validSchedulesCache.set(cacheKey, result);
  if (validSchedulesCache.size > 50) {
    // Limitar el tamaño de la caché
    validSchedulesCache.delete(validSchedulesCache.keys().next().value);
  }
  
  return result;
});

// Caché para horarios válidos
const validSchedulesCache = new Map();

const hasValidSchedules = computed(() => validSchedules.value.length > 0);

const hasInvalidSchedules = computed(() => {
  return validSchedules.value.some(schedule => 
    schedule.startTime >= schedule.endTime
  );
});

const invalidScheduleMessage = computed(() => {
  const invalid = validSchedules.value.find(s => s.startTime >= s.endTime);
  return invalid 
    ? `El horario del ${getDayName(invalid.day)} tiene una hora de inicio posterior a la de finalización`
    : '';
});

async function handleSubmit() {
  // Validación inicial rápida
  if (!isFormValid.value || saving.value) {
    showNotification('Por favor complete todos los campos requeridos', 'warning');
    return;
  }
  
  // Dar tiempo al navegador para actualizar el estado de carga
  saving.value = true;
  await nextTick();
  
  try {
    // Validar horarios
    if (!hasValidSchedules.value) {
      showNotification('Debe agregar al menos un horario válido', 'error');
      saving.value = false;
      return;
    }

    // Validar que las horas de inicio sean menores a las de fin
    if (hasInvalidSchedules.value) {
      showNotification(invalidScheduleMessage.value, 'error');
      saving.value = false;
      return;
    }
    
    // Validar que se haya seleccionado un profesor
    if (!form.value.teacherId) {
      showNotification('Debe seleccionar un profesor para la clase', 'error');
      saving.value = false;
      return;
    }
    
    // Preparar datos para guardar (operación síncrona rápida)
    const now = new Date().toISOString();
    const classData: Partial<ClassData> = {
      name: form.value.name.trim(),
      instrument: form.value.instrument,
      level: form.value.level,
      status: form.value.status,
      description: form.value.description.trim(),
      capacity: 0, // Capacidad ilimitada
      teacherId: form.value.teacherId,
      studentIds: Array.isArray(form.value.studentIds) ? [...form.value.studentIds] : [],
      sharedWith: Array.isArray(form.value.sharedWith) ? [...form.value.sharedWith] : [],
      permissions: { ...(form.value.permissions || {}) },
      schedule: { slots: [...validSchedules.value] },
      updatedAt: now
    };
    
    // Si es edición, mantener el ID y fecha de creación
    if (isEditing.value && props.classData?.id) {
      classData.id = props.classData.id;
      classData.createdAt = props.classData.createdAt || now;
      
      // Mantener el historial de cambios si existe
      if (props.classData.changeHistory) {
        classData.changeHistory = [
          ...(props.classData.changeHistory || []),
          { timestamp: now, changes: 'Actualización de la clase' }
        ];
      }
    } else {
      // Para clases nuevas, establecer fechas de creación
      classData.createdAt = now;
      classData.changeHistory = [{ timestamp: now, changes: 'Creación de la clase' }];
    }
    
    // Emitir evento para guardar (operación asíncrona)
    emit('save', classData);
    
    // Mostrar notificación de éxito
    showNotification(
      `✅ Clase "${classData.name}" ${isEditing.value ? 'actualizada' : 'creada'} correctamente`, 
      'success'
    );
    
    // Cerrar el diálogo después de guardar
    emit('close');
    
  } catch (error) {
    console.error('Error al guardar la clase:', error);
    showNotification(
      `❌ Error al ${isEditing.value ? 'actualizar' : 'crear'} la clase: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      'error'
    );
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    const [teachersStore, studentsStore] = [useTeachersStore(), useStudentsStore()];
    await Promise.all([
      teachersStore.fetchTeachers(),
      studentsStore.fetchStudents()
    ]);
  } catch (error) {
    console.error('Error loading data:', error);
  }
});

</script>

<style scoped>
.bg-blue-50 {
  background-color: #eff6ff;
}

/* Component styles */
.fixed {
  position: fixed;
}

.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.z-50 {
  z-index: 50;
}

.overflow-y-auto {
  overflow-y: auto;
}

/* Custom scrollbar styles */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background-color: #f3f4f6;
  border-radius: 0.375rem;
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background-color: #374151;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 0.375rem;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #6b7280;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

/* Ensure proper spacing for mobile navigation */
@media (max-width: 768px) {
  .fixed.inset-0 {
    padding-bottom: 5rem; /* Space for mobile navigation */
  }
}

/* Smooth transitions */
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
