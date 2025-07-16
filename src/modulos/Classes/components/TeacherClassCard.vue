<!-- src/modulos/Classes/components/TeacherClassCard.vue -->
<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
  >
    <!-- Header con rol del maestro -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {{ classData.name }}
        </h3>
        <span
          :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            teacherRole === 'lead'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
          ]"
        >
          <UserIcon v-if="teacherRole === 'lead'" class="w-3 h-3 mr-1" />
          <UsersIcon v-else class="w-3 h-3 mr-1" />
          {{ teacherRole === "lead" ? "Encargado" : "Asistente" }}
        </span>
      </div>

      <p
        v-if="classData.description"
        class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2"
      >
        {{ classData.description }}
      </p>
    </div>

    <!-- Content -->
    <div class="px-6 py-4">
      <!-- Información básica -->
      <div class="space-y-3">
        <!-- Nivel e Instrumento -->
        <div class="flex items-center justify-between">
          <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <AcademicCapIcon class="h-4 w-4 mr-2" />
            <span>{{ classData.level || "Sin nivel" }}</span>
          </div>
          <div
            v-if="classData.instrument"
            class="flex items-center text-sm text-gray-600 dark:text-gray-400"
          >
            <MusicalNoteIcon class="h-4 w-4 mr-2" />
            <span>{{ classData.instrument }}</span>
          </div>
        </div>

        <!-- Estudiantes -->
        <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <UserGroupIcon class="h-4 w-4 mr-2" />
          <span>{{ studentCount }} estudiante{{ studentCount !== 1 ? "s" : "" }}</span>
        </div>

        <!-- Horario -->
        <div v-if="scheduleText" class="flex items-start text-sm text-gray-600 dark:text-gray-400">
          <ClockIcon class="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <span class="line-clamp-2">{{ scheduleText }}</span>
        </div>

        <!-- Aula -->
        <div
          v-if="classData.classroom"
          class="flex items-center text-sm text-gray-600 dark:text-gray-400"
        >
          <BuildingOfficeIcon class="h-4 w-4 mr-2" />
          <span>{{ classData.classroom }}</span>
        </div>
      </div>

      <!-- Permisos del maestro -->
      <div
        v-if="classData.myPermissions"
        class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
      >
        <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Permisos:</h4>
        <div class="flex flex-wrap gap-1">
          <span
            v-if="classData.myPermissions.canTakeAttendance"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
          >
            <CheckCircleIcon class="w-3 h-3 mr-1" />
            Asistencia
          </span>
          <span
            v-if="classData.myPermissions.canAddObservations"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
          >
            <DocumentTextIcon class="w-3 h-3 mr-1" />
            Observaciones
          </span>
          <span
            v-if="classData.myPermissions.canViewAttendanceHistory"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
          >
            <ClockIcon class="w-3 h-3 mr-1" />
            Historial
          </span>
          <span
            v-if="classData.myPermissions.canEditClass"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
          >
            <PencilIcon class="w-3 h-3 mr-1" />
            Editar
          </span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div
      class="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600"
    >
      <div class="flex items-center justify-between">
        <button
          class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
          @click="$emit('view-details', classData)"
        >
          Ver detalles
        </button>

        <div class="flex space-x-2">
          <button
            v-if="classData.myPermissions?.canTakeAttendance"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="$emit('take-attendance', classData)"
          >
            <CheckCircleIcon class="w-3 h-3 mr-1" />
            Asistencia
          </button>

          <button
            v-if="classData.myPermissions?.canViewAttendanceHistory"
            class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="$emit('view-attendance', classData)"
          >
            <ClockIcon class="w-3 h-3 mr-1" />
            Historial
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TeacherClassView } from '../types/class';
import {
  UserIcon,
  UsersIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  PencilIcon,
  BuildingOfficeIcon,
} from '@heroicons/vue/24/outline';

interface Props {
  classData: TeacherClassView
  teacherRole: 'lead' | 'assistant'
}

interface Emits {
  (e: 'view-details', classData: TeacherClassView): void
  (e: 'take-attendance', classData: TeacherClassView): void
  (e: 'view-attendance', classData: TeacherClassView): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const studentCount = computed(() => {
  return props.classData.studentIds?.length || 0;
});

const scheduleText = computed(() => {
  if (!props.classData.schedule?.slots?.length) {
    return 'Horario no definido';
  }

  const slots = props.classData.schedule.slots;
  if (slots.length === 1) {
    const slot = slots[0];
    return `${slot.day} de ${slot.startTime} a ${slot.endTime}`;
  } else {
    return `${slots.length} sesiones programadas`;
  }
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
