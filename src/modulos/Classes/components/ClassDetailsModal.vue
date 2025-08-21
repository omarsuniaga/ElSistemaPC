<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" @click="$emit('close')">
    <div class="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" @click.stop>
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-3">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white truncate">{{ classItem.name }}</h3>
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusBadgeClass(classItem.status)"
              >
                {{ getStatusText(classItem.status) }}
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ classItem.description || 'Sin descripción' }}</p>
          </div>
          <div class="flex items-center space-x-3 ml-4">
            <button
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              title="Editar clase"
              @click.stop="$emit('edit')"
            >
              ✏️ Editar
            </button>
            <button 
              class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200" 
              @click="$emit('close')"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <!-- Class Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-lg">🎵</span>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Instrumento</label>
              </div>
              <p class="text-base font-semibold text-gray-900 dark:text-white">{{ classItem.instrument || 'No especificado' }}</p>
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-lg">🎓</span>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Programa</label>
              </div>
              <p class="text-base font-semibold text-gray-900 dark:text-white">{{ getProgramName(classItem.level) }}</p>
            </div>
          </div>
          
          <div class="space-y-4">
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-lg">👨‍🏫</span>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Maestro</label>
              </div>
              <p class="text-base font-semibold text-gray-900 dark:text-white">{{ getTeacherName(classItem.teacherId) }}</p>
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-lg">👥</span>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Capacidad</label>
              </div>
              <p class="text-base font-semibold text-gray-900 dark:text-white">
                {{ (classItem.studentIds?.length || 0) }} / {{ classItem.capacity || '∞' }}
                <span class="text-sm text-gray-500 ml-1">estudiantes</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Schedule Section -->
        <div>
          <div class="flex items-center space-x-2 mb-4">
            <span class="text-lg">📅</span>
            <h4 class="text-lg font-medium text-gray-900 dark:text-white">Horarios</h4>
          </div>
          <div class="space-y-3" v-if="getClassSchedules(classItem).length > 0">
            <div 
              v-for="(schedule, index) in getClassSchedules(classItem)" 
              :key="index" 
              class="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors duration-200"
            >
              <div class="flex items-center space-x-3">
                <span class="text-lg">🗓️</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ getDayName(schedule.day) }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-lg">⏰</span>
                <span class="text-gray-700 dark:text-gray-300 font-mono">{{ formatTime(schedule.startTime) }} - {{ formatTime(schedule.endTime) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
            <span class="text-lg">📭</span>
            <p class="mt-2">No hay horarios programados</p>
          </div>
        </div>

        <!-- Students Section -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-2">
              <span class="text-lg">👨‍🎓</span>
              <h4 class="text-lg font-medium text-gray-900 dark:text-white">Estudiantes</h4>
              <span class="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {{ classItem.studentIds?.length || 0 }}
              </span>
            </div>
          </div>
          
          <div v-if="classItem.studentIds?.length > 0" class="max-h-40 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div 
              v-for="studentId in classItem.studentIds" 
              :key="studentId" 
              class="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <span class="text-sm">👤</span>
              <span class="text-sm text-gray-900 dark:text-white">{{ getStudentName(studentId) }}</span>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
            <span class="text-lg">📋</span>
            <p class="mt-2">No hay estudiantes inscritos</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import type { PropType } from 'vue';

import type { Student } from '../../Students/types/student';
import type { Teacher } from '../../Teachers/types/teacher';
import type { ClassData } from '../types/class';

// Declare allowed emits to satisfy template-level $emit checks
defineEmits<{ (e: 'close'): void; (e: 'edit'): void }>();

const props = defineProps({
  classItem: { type: Object as PropType<ClassData>, required: true },
  teachers: { type: Array as PropType<Teacher[]>, required: false, default: () => [] },
  students: { type: Array as PropType<Student[]>, required: false, default: () => [] },
});

const getProgramName = (level?: string) => {
  if (!level) return 'Sin programa';
  const programs: Record<string, string> = {
    preparatoria: 'Preparatoria',
    'teoria-musical': 'Teoría Musical',
    coro: 'Coro',
    orquesta: 'Orquesta',
    otros: 'Otros',
  };
  return programs[level] || level;
};

const getTeacherName = (teacherId?: string) => {
  if (!teacherId) return 'Sin asignar';
  const t = props.teachers.find((x) => x.id === teacherId);
  return t?.name || 'Sin asignar';
};

const getStudentName = (studentId: string) => {
  const s = props.students.find((x) => x.id === studentId);
  return s ? `${s.nombre} ${s.apellido}` : 'Estudiante no encontrado';
};

const formatTime = (time?: string) => {
  if (!time) return '';
  const [hours, minutes] = (time || '').split(':');
  const hour = parseInt(hours || '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes || '00'} ${ampm}`;
};

const getDayName = (day: string) => {
  const dayNames: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
  };
  return dayNames[day] || day;
};

type ScheduleSlot = { day: string; startTime: string; endTime: string };

const getStatusBadgeClass = (status?: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'inactive':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    case 'suspended':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getStatusText = (status?: string) => {
  switch (status) {
    case 'active':
      return 'Activa';
    case 'inactive':
      return 'Inactiva';
    case 'suspended':
      return 'Suspendida';
    default:
      return 'Sin estado';
  }
};

const getClassSchedules = (classItem: ClassData): ScheduleSlot[] => {
  const sched = classItem.schedule as unknown;
  if (!sched || typeof sched !== 'object') return [];
  const maybe = sched as { slots?: unknown; day?: unknown; startTime?: unknown; endTime?: unknown };
  if (Array.isArray(maybe.slots)) {
    return maybe.slots as ScheduleSlot[];
  }
  if (typeof maybe.day === 'string') {
    return [
      { day: String(maybe.day), startTime: String(maybe.startTime || ''), endTime: String(maybe.endTime || '') },
    ];
  }
  return [];
};
</script>

<style scoped>
/* keep modal styles lean; component uses utility classes */
</style>
