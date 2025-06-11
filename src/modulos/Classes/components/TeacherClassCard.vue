<!-- src/modulos/Classes/components/TeacherClassCard.vue -->
<template>
  <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
    <!-- Header con rol del maestro -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 truncate">{{ classData.name }}</h3>
        <span 
          :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            teacherRole === 'lead' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-green-100 text-green-800'
          ]"
        >
          <UserIcon v-if="teacherRole === 'lead'" class="w-3 h-3 mr-1" />
          <UsersIcon v-else class="w-3 h-3 mr-1" />
          {{ teacherRole === 'lead' ? 'Encargado' : 'Asistente' }}
        </span>
      </div>
      
      <p v-if="classData.description" class="text-sm text-gray-600 mt-1 line-clamp-2">
        {{ classData.description }}
      </p>
    </div>

    <!-- Content -->
    <div class="px-6 py-4">
      <!-- Información básica -->
      <div class="space-y-3">
        <!-- Nivel e Instrumento -->
        <div class="flex items-center justify-between">
          <div class="flex items-center text-sm text-gray-600">
            <AcademicCapIcon class="h-4 w-4 mr-2" />
            <span>{{ classData.level || 'Sin nivel' }}</span>
          </div>
          <div v-if="classData.instrument" class="flex items-center text-sm text-gray-600">
            <MusicalNoteIcon class="h-4 w-4 mr-2" />
            <span>{{ classData.instrument }}</span>
          </div>
        </div>

        <!-- Estudiantes -->
        <div class="flex items-center text-sm text-gray-600">
          <UserGroupIcon class="h-4 w-4 mr-2" />
          <span>{{ studentCount }} estudiante{{ studentCount !== 1 ? 's' : '' }}</span>
        </div>

        <!-- Horario -->
        <div v-if="scheduleText" class="flex items-start text-sm text-gray-600">
          <ClockIcon class="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <span class="line-clamp-2">{{ scheduleText }}</span>
        </div>

        <!-- Aula -->
        <div v-if="classData.classroom" class="flex items-center text-sm text-gray-600">
          <BuildingOfficeIcon class="h-4 w-4 mr-2" />
          <span>{{ classData.classroom }}</span>
        </div>
      </div>

      <!-- Permisos del maestro -->
      <div v-if="classData.myPermissions" class="mt-4 pt-4 border-t border-gray-100">
        <h4 class="text-xs font-medium text-gray-700 mb-2">Permisos:</h4>
        <div class="flex flex-wrap gap-1">
          <span 
            v-if="classData.myPermissions.canTakeAttendance"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
          >
            <CheckCircleIcon class="w-3 h-3 mr-1" />
            Asistencia
          </span>
          <span 
            v-if="classData.myPermissions.canAddObservations"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50 text-green-700"
          >
            <DocumentTextIcon class="w-3 h-3 mr-1" />
            Observaciones
          </span>
          <span 
            v-if="classData.myPermissions.canViewAttendanceHistory"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700"
          >
            <ClockIcon class="w-3 h-3 mr-1" />
            Historial
          </span>
          <span 
            v-if="classData.myPermissions.canEditClass"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-50 text-orange-700"
          >
            <PencilIcon class="w-3 h-3 mr-1" />
            Editar
          </span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
      <div class="flex items-center justify-between">
        <button
          @click="$emit('view-details', classData)"
          class="text-sm text-blue-600 hover:text-blue-500 font-medium"
        >
          Ver detalles
        </button>
        
        <div class="flex space-x-2">
          <button
            v-if="classData.myPermissions?.canTakeAttendance"
            @click="$emit('take-attendance', classData)"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CheckCircleIcon class="w-3 h-3 mr-1" />
            Asistencia
          </button>
          
          <button
            v-if="classData.myPermissions?.canViewAttendanceHistory"
            @click="$emit('view-attendance', classData)"
            class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
  BuildingOfficeIcon
} from '@heroicons/vue/24/outline';

interface Props {
  classData: TeacherClassView;
  teacherRole: 'lead' | 'assistant';
}

interface Emits {
  (e: 'view-details', classData: TeacherClassView): void;
  (e: 'take-attendance', classData: TeacherClassView): void;
  (e: 'view-attendance', classData: TeacherClassView): void;
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
