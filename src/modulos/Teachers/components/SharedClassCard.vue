<template>
  <div
    class="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border-t-4 transition-all duration-300 hover:shadow-xl group overflow-hidden"
    :class="[getDayColor.border, getDayColor.shadow, 'hover:scale-[1.02]']"
  >
    <!-- Indicador de clase compartida -->
    <div class="absolute top-3 right-3 z-10">
      <div class="flex items-center space-x-2">
        <!-- Badge de "Compartida" -->
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700"
        >
          <ShareIcon class="w-3 h-3 mr-1" />
          Compartida
        </span>
      </div>
    </div>

    <!-- Header con información principal -->
    <div :class="[getDayColor.bg, 'p-4 border-b border-gray-200 dark:border-gray-700']">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <h3
            class="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          >
            {{ classData.name }}
          </h3>

          <!-- Información del maestro principal -->
          <div class="flex items-center mt-2 space-x-2">
            <UserIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span class="text-sm text-gray-600 dark:text-gray-300">
              Maestro: <span class="font-medium">{{ classData.mainTeacherName }}</span>
            </span>
          </div>

          <!-- Rol del usuario actual -->
          <div class="flex items-center mt-1 space-x-2">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
            >
              <UserPlusIcon class="w-3 h-3 mr-1" />
              Maestro Asistente
            </span>
          </div>
        </div>

        <!-- Menú de acciones -->
        <Menu as="div" class="relative">
          <MenuButton
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <EllipsisVerticalIcon class="w-5 h-5" />
          </MenuButton>
          <MenuItems
            class="absolute right-0 z-20 mt-2 w-56 origin-top-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          >
            <div class="p-1">
              <MenuItem v-slot="{active}">
                <button
                  :class="[
                    active ? 'bg-gray-100 dark:bg-gray-700' : '',
                    'flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md',
                  ]"
                  @click="viewClass"
                >
                  <EyeIcon class="w-4 h-4 mr-2" />
                  Ver Detalles
                </button>
              </MenuItem>
              <MenuItem v-slot="{active}">
                <button
                  :class="[
                    active ? 'bg-gray-100 dark:bg-gray-700' : '',
                    'flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md',
                  ]"
                  @click="takeAttendance"
                >
                  <ClipboardDocumentCheckIcon class="w-4 h-4 mr-2" />
                  Tomar Asistencia
                </button>
              </MenuItem>
              <MenuItem v-slot="{active}">
                <button
                  :class="[
                    active ? 'bg-gray-100 dark:bg-gray-700' : '',
                    'flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md',
                  ]"
                  @click="viewHistory"
                >
                  <DocumentTextIcon class="w-4 h-4 mr-2" />
                  Ver Historial
                </button>
              </MenuItem>
            </div>
          </MenuItems>
        </Menu>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="p-4 space-y-4">
      <!-- Información básica -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Instrumento/Nivel -->
        <div v-if="classData.instrument || classData.level" class="flex items-center space-x-2">
          <MusicalNoteIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {{ formatInstrumentLevel }}
          </span>
        </div>

        <!-- Horario -->
        <div v-if="scheduleInfo" class="flex items-center space-x-2">
          <ClockIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span class="text-sm text-gray-600 dark:text-gray-300">{{ scheduleInfo }}</span>
        </div>

        <!-- Ubicación -->
        <div v-if="classData.location" class="flex items-center space-x-2">
          <MapPinIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span class="text-sm text-gray-600 dark:text-gray-300">{{ classData.location }}</span>
        </div>

        <!-- Número de estudiantes -->
        <div class="flex items-center space-x-2">
          <UserGroupIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {{ studentCount }} {{ studentCount === 1 ? "estudiante" : "estudiantes" }}
          </span>
        </div>
      </div>

      <!-- Descripción (si existe) -->
      <div v-if="classData.description" class="mt-3">
        <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {{ classData.description }}
        </p>
      </div>

      <!-- Permisos del asistente -->
      <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Mis Permisos:</h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div v-if="permissions?.canTakeAttendance" class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-green-500 rounded-full" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Tomar asistencia</span>
          </div>
          <div v-if="permissions?.canAddObservations" class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-green-500 rounded-full" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Añadir observaciones</span>
          </div>
          <div v-if="permissions?.canViewAttendanceHistory" class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-green-500 rounded-full" />
            <span class="text-xs text-gray-600 dark:text-gray-400">Ver historial</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer con acciones principales -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center justify-between">
        <button
          class="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          @click="viewClass"
        >
          <EyeIcon class="w-4 h-4" />
          <span>Ver Clase</span>
        </button>

        <div class="flex items-center space-x-2">
          <button
            v-if="permissions?.canTakeAttendance"
            class="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            @click="takeAttendance"
          >
            <ClipboardDocumentCheckIcon class="w-4 h-4" />
            <span>Asistencia</span>
          </button>

          <button
            class="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
            @click="viewHistory"
          >
            <DocumentTextIcon class="w-4 h-4" />
            <span>Historial</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  MusicalNoteIcon,
  EllipsisVerticalIcon,
  ShareIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  UserPlusIcon,
} from '@heroicons/vue/24/outline';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';

const props = defineProps({
  classData: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['view', 'take-attendance', 'view-history']);

const router = useRouter();

// Computadas
const studentCount = computed(() => {
  return Array.isArray(props.classData.studentIds) ? props.classData.studentIds.length : 0;
});

const formatInstrumentLevel = computed(() => {
  const parts = [];
  if (props.classData.instrument) parts.push(props.classData.instrument);
  if (props.classData.level) parts.push(props.classData.level);
  return parts.join(' - ');
});

const scheduleInfo = computed(() => {
  if (!props.classData.schedule?.slots?.[0]) return null;
  const slot = props.classData.schedule.slots[0];
  return `${slot.day} ${slot.startTime} - ${slot.endTime}`;
});

const permissions = computed(() => {
  // Buscar los permisos del maestro actual en la lista de teachers
  const currentTeacher = props.classData.teachers?.find((t: any) => t.role === 'assistant');
  return currentTeacher?.permissions || {};
});

// Función para obtener el color del día
const getDayColor = computed(() => {
  if (!props.classData.schedule?.slots?.[0]?.day) {
    return {
      border: 'border-t-purple-500', // Purple para clases compartidas
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-700 dark:text-purple-300',
      accent: 'accent-purple-500',
      shadow: 'shadow-purple-200',
    };
  }

  // Siempre usar purple para clases compartidas
  return {
    border: 'border-t-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    accent: 'accent-purple-500',
    shadow: 'shadow-purple-200',
  };
});

// Métodos
const viewClass = () => {
  router.push(`/teacher/classes/${props.classData.id}/shared`);
};

const takeAttendance = () => {
  if (permissions.value?.canTakeAttendance) {
    router.push(`/teacher/classes/${props.classData.id}/attendance`);
  }
};

const viewHistory = () => {
  router.push(`/teacher/classes/${props.classData.id}/history`);
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
