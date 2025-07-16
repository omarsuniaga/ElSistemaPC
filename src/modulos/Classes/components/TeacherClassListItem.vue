<!-- src/modulos/Classes/components/TeacherClassListItem.vue -->
<template>
  <li class="hover:bg-gray-50 transition-colors duration-150">
    <div class="px-4 py-4 sm:px-6">
      <div class="flex items-center justify-between">
        <!-- Información principal -->
        <div class="flex items-center min-w-0 flex-1">
          <!-- Rol badge -->
          <span
            :class="[
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-3 flex-shrink-0',
              teacherRole === 'lead' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800',
            ]"
          >
            <UserIcon v-if="teacherRole === 'lead'" class="w-3 h-3 mr-1" />
            <UsersIcon v-else class="w-3 h-3 mr-1" />
            {{ teacherRole === "lead" ? "Encargado" : "Asistente" }}
          </span>

          <!-- Información de la clase -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ classData.name }}
              </p>
              <div class="ml-2 flex-shrink-0 flex space-x-1">
                <span
                  v-if="classData.level"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {{ classData.level }}
                </span>
                <span
                  v-if="classData.instrument"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                >
                  {{ classData.instrument }}
                </span>
              </div>
            </div>

            <div class="mt-1 flex items-center text-sm text-gray-500 space-x-4">
              <!-- Estudiantes -->
              <div class="flex items-center">
                <UserGroupIcon class="flex-shrink-0 mr-1.5 h-4 w-4" />
                <span>{{ studentCount }} estudiante{{ studentCount !== 1 ? "s" : "" }}</span>
              </div>

              <!-- Horario -->
              <div v-if="scheduleText" class="flex items-center">
                <ClockIcon class="flex-shrink-0 mr-1.5 h-4 w-4" />
                <span class="truncate">{{ scheduleText }}</span>
              </div>

              <!-- Aula -->
              <div v-if="classData.classroom" class="flex items-center">
                <BuildingOfficeIcon class="flex-shrink-0 mr-1.5 h-4 w-4" />
                <span>{{ classData.classroom }}</span>
              </div>
            </div>

            <!-- Permisos (solo si es asistente) -->
            <div
              v-if="teacherRole === 'assistant' && classData.myPermissions"
              class="mt-2 flex flex-wrap gap-1"
            >
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
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="ml-4 flex-shrink-0 flex items-center space-x-2">
          <button
            class="text-blue-600 hover:text-blue-500 text-sm font-medium"
            @click="$emit('view-details', classData)"
          >
            Ver detalles
          </button>

          <button
            v-if="classData.myPermissions?.canTakeAttendance"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="$emit('take-attendance', classData)"
          >
            <CheckCircleIcon class="w-3 h-3 mr-1" />
            Asistencia
          </button>

          <button
            v-if="classData.myPermissions?.canViewAttendanceHistory"
            class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="$emit('view-attendance', classData)"
          >
            <ClockIcon class="w-3 h-3 mr-1" />
            Historial
          </button>

          <!-- Dropdown menu for more actions -->
          <div v-if="hasMoreActions" class="relative">
            <button
              class="p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
              @click="showDropdown = !showDropdown"
            >
              <EllipsisVerticalIcon class="h-5 w-5" />
            </button>

            <div
              v-if="showDropdown"
              class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
            >
              <div class="py-1">
                <button
                  v-if="classData.myPermissions?.canAddObservations"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  @click="handleAddObservation"
                >
                  <DocumentTextIcon class="w-4 h-4 inline mr-2" />
                  Agregar observación
                </button>
                <button
                  v-if="classData.myPermissions?.canEditClass"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  @click="handleEditClass"
                >
                  <PencilIcon class="w-4 h-4 inline mr-2" />
                  Editar clase
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TeacherClassView } from '../types/class';
import {
  UserIcon,
  UsersIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  PencilIcon,
  BuildingOfficeIcon,
  EllipsisVerticalIcon,
} from '@heroicons/vue/24/outline';

interface Props {
  classData: TeacherClassView
  teacherRole: 'lead' | 'assistant'
}

interface Emits {
  (e: 'view-details', classData: TeacherClassView): void
  (e: 'take-attendance', classData: TeacherClassView): void
  (e: 'view-attendance', classData: TeacherClassView): void
  (e: 'add-observation', classData: TeacherClassView): void
  (e: 'edit-class', classData: TeacherClassView): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Estado local
const showDropdown = ref(false);

// Computed properties
const studentCount = computed(() => {
  return props.classData.studentIds?.length || 0;
});

const scheduleText = computed(() => {
  if (!props.classData.schedule?.slots?.length) {
    return null;
  }

  const slots = props.classData.schedule.slots;
  if (slots.length === 1) {
    const slot = slots[0];
    return `${slot.day} ${slot.startTime}-${slot.endTime}`;
  } else {
    return `${slots.length} sesiones`;
  }
});

const hasMoreActions = computed(() => {
  return (
    props.classData.myPermissions?.canAddObservations || props.classData.myPermissions?.canEditClass
  );
});

// Methods
const handleAddObservation = () => {
  showDropdown.value = false;
  emit('add-observation', props.classData);
};

const handleEditClass = () => {
  showDropdown.value = false;
  emit('edit-class', props.classData);
};

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
  const dropdown = event.target?.closest('.relative');
  if (!dropdown) {
    showDropdown.value = false;
  }
});
</script>
