<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700"
  >
    <div class="p-5">
      <!-- Cabecera del grupo -->
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ classData.name }}</h3>
        <div class="flex space-x-2">
          <button
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            title="Editar grupo"
            @click="emit('edit', classData.id)"
          >
            <PencilIcon class="w-5 h-5" />
          </button>
          <button
            class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
            title="Eliminar grupo"
            @click="emit('delete', classData.id)"
          >
            <TrashIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Detalles del grupo -->
      <div class="space-y-3 text-sm text-gray-600 dark:text-gray-300">
        <div class="flex items-center">
          <UserIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span>{{ getTeacherName(classData.teacherId) }}</span>
        </div>
        <div class="flex items-center">
          <AcademicCapIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span>{{ classData.level }}</span>
        </div>
        <div class="flex items-center">
          <MusicalNoteIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span>{{ classData.instrument }}</span>
        </div>

        <!-- Lista de estudiantes -->
        <div>
          <div class="flex items-center mb-2">
            <UserGroupIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
            <span>{{ studentCount }}</span>
          </div>

          <div v-if="topStudents.length > 0" class="flex flex-wrap gap-1 mt-1 mb-2">
            <div
              v-for="student in topStudents"
              :key="student.id"
              class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs"
            >
              {{ student.nombre }} {{ student.apellido }}
            </div>
            <div
              v-if="studentCount > topStudents.length"
              class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs"
            >
              +{{ studentCount - topStudents.length }} más
            </div>
          </div>
        </div>

        <div class="flex items-center">
          <ClockIcon class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span>{{ formatSchedule(classData.schedule) }}</span>
        </div>
      </div>

      <!-- Botón de gestión de estudiantes -->
      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          class="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
          @click="emit('manage-students', classData.id)"
        >
          <UserGroupIcon class="w-4 h-4" />
          Gestionar Estudiantes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTeachersStore } from '../../../modulos/Teachers/store/teachers';
import type { ClassData } from '../types/class';
import {
  UserIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps<{
  classData: ClassData
  studentCount: number
  topStudents: Array<{id: string; nombre: string; apellido: string}>
}>();

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
  (e: 'manage-students', id: string): void
}>();

const teachersStore = useTeachersStore();

// Computed properties
const selectedGroupTeacher = computed(() => {
  return teachersStore.teachers.find((t) => t.id === props.classData.teacherId);
});

// Helper Functions
const getTeacherName = (teacherId?: string): string => {
  if (!teacherId) return 'Profesor no asignado';
  const teacher = teachersStore.teachers.find((t) => t.id === teacherId);
  return teacher ? `${teacher.name}` : 'Profesor no asignado';
};

// Tipo para los slots de horario
interface ScheduleSlot {
  day: string
  startTime: string
  endTime: string
}

type ScheduleType = {slots: ScheduleSlot[]} | ScheduleSlot | string | undefined

const formatSchedule = (schedule?: ScheduleType): string => {
  try {
    console.log('Horario recibido:', schedule); // Log para depuración

    // Si no hay horario definido
    if (!schedule) {
      console.log('No hay horario definido');
      return 'Horario no definido';
    }

    // Si es un string, devolverlo directamente (formato legado)
    if (typeof schedule === 'string') {
      return schedule;
    }

    // Si es un array (puede ser un array de slots)
    if (Array.isArray(schedule)) {
      console.log('Es un array de slots:', schedule);
      if (schedule.length === 0) return 'Sin horario';

      return (
        schedule
          .map((slot: any) => {
            if (!slot) return '';
            // Intentar diferentes formatos de slot
            if (slot.day && slot.startTime && slot.endTime) {
              return `${slot.day} ${slot.startTime}-${slot.endTime}`;
            }
            if (slot.start && slot.end) {
              return `${slot.start}-${slot.end}`;
            }
            return '';
          })
          .filter(Boolean)
          .join(', ') || 'Horario no válido'
      );
    }

    // Si es un objeto con slots
    if (schedule && typeof schedule === 'object' && 'slots' in schedule) {
      const slots = (schedule as any).slots;
      if (!Array.isArray(slots) || slots.length === 0) {
        return 'Sin horario';
      }

      return slots
        .map((slot: any) => {
          if (!slot) return '';
          // Manejar diferentes formatos de slot
          if (slot.day && slot.startTime && slot.endTime) {
            return `${slot.day} ${slot.startTime}-${slot.endTime}`;
          }
          if (slot.day && slot.start && slot.end) {
            return `${slot.day} ${slot.start}-${slot.end}`;
          }
          return '';
        })
        .filter(Boolean)
        .join(', ');
    }

    // Si es un objeto directo con day, startTime, endTime
    if (schedule && typeof schedule === 'object' && 'day' in schedule) {
      const s = schedule as any;
      if (s.day && s.startTime && s.endTime) {
        return `${s.day} ${s.startTime}-${s.endTime}`;
      }
      if (s.day && s.start && s.end) {
        return `${s.day} ${s.start}-${s.end}`;
      }
    }

    // Si es un objeto con start y end directos
    if (schedule && typeof schedule === 'object' && 'start' in schedule && 'end' in schedule) {
      const s = schedule as any;
      return `${s.start}-${s.end}`;
    }

    // Si no coincide con ningún formato conocido
    console.warn('Formato de horario no reconocido:', schedule);
    return 'Horario no definido';
  } catch (error) {
    console.error('Error al formatear el horario:', error, 'Horario:', schedule);
    return 'Error en horario';
  }
};
</script>
