<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    @click="$emit('close')"
  >
    <div class="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full" @click.stop>
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Gestionar Permisos</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configura los permisos de acceso para {{ teacher?.name }}
            </p>
          </div>
          <button
            class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            @click="$emit('close')"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Class Info -->
        <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Clase: {{ classData?.name }}
          </h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ classData?.instrument }} • {{ getProgramName(classData?.level) }}
          </p>
        </div>

        <!-- Permission Options -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Nivel de Acceso
          </label>
          <div class="space-y-3">
            <!-- Read Only -->
            <label class="flex items-start cursor-pointer">
              <input
                v-model="selectedPermissionLevel"
                type="radio"
                value="read"
                class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <div class="ml-3">
                <div class="text-sm font-medium text-gray-900 dark:text-white">Solo Lectura</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Puede ver la clase, estudiantes y horarios, pero no realizar cambios.
                </div>
              </div>
            </label>

            <!-- Write Access -->
            <label class="flex items-start cursor-pointer">
              <input
                v-model="selectedPermissionLevel"
                type="radio"
                value="write"
                class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <div class="ml-3">
                <div class="text-sm font-medium text-gray-900 dark:text-white">Editor</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Puede editar información de la clase y gestionar estudiantes.
                </div>
              </div>
            </label>

            <!-- Manage Access -->
            <label class="flex items-start cursor-pointer">
              <input
                v-model="selectedPermissionLevel"
                type="radio"
                value="manage"
                class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <div class="ml-3">
                <div class="text-sm font-medium text-gray-900 dark:text-white">Administrador</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Acceso completo incluyendo gestión de otros maestros y configuración avanzada.
                </div>
              </div>
            </label>
          </div>
        </div>
        <!-- Custom Permissions (when write or manage is selected) -->
        <div
          v-if="selectedPermissionLevel !== 'read'"
          class="border-t border-gray-200 dark:border-gray-700 pt-6"
        >
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Permisos Específicos
          </label>
          <div class="space-y-3">
            <!-- Permisos básicos (siempre disponibles) -->
            <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
              <h5 class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                Permisos Básicos
              </h5>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="canTakeAttendance"
                    type="checkbox"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Tomar asistencia
                  </span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="canAddObservations"
                    type="checkbox"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Agregar observaciones
                  </span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="canViewAttendanceHistory"
                    type="checkbox"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Ver historial de asistencia
                  </span>
                </label>
              </div>
            </div>

            <!-- Permisos de edición (solo para write y manage) -->
            <div
              v-if="selectedPermissionLevel === 'write' || selectedPermissionLevel === 'manage'"
              class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg"
            >
              <h5 class="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
                Permisos de Edición
              </h5>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="canEditClass"
                    type="checkbox"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Editar información de la clase
                  </span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="canManageStudents"
                    type="checkbox"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Gestionar estudiantes
                  </span>
                </label>
              </div>
            </div>

            <!-- Permisos administrativos (solo para manage) -->
            <div
              v-if="selectedPermissionLevel === 'manage'"
              class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg"
            >
              <h5 class="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                Permisos Administrativos
              </h5>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="canManageTeachers"
                    type="checkbox"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Gestionar otros maestros
                  </span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="canManageSchedule"
                    type="checkbox"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Modificar horarios
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Warning for removing access -->
        <div
          v-if="isRemovingAccess"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Eliminar Acceso</h3>
              <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                Esta acción eliminará completamente el acceso de {{ teacher?.name }} a esta clase.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <button
          v-if="teacher?.id"
          class="px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          @click="removeAccess"
        >
          Eliminar Acceso
        </button>

        <div class="flex space-x-3">
          <button
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            @click="$emit('close')"
          >
            Cancelar
          </button>
          <button
            :disabled="!hasChanges"
            class="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            @click="savePermissions"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ClassData, ClassTeacher } from '../types/class';

interface Props {
  open: boolean
  classData: ClassData | null
  teacher: {id: string; name: string} | null
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: []
  save: [
    data: {
      classId: string
      teacherId: string
      permissions: {
        canAddObservations: boolean
        canEditClass: boolean
        canManageTeachers: boolean
        canTakeAttendance: boolean
        canViewAttendanceHistory: boolean
        canManageStudents: boolean
        canManageSchedule: boolean
      }
      role: string
    },
  ]
  remove: [
    data: {
      classId: string
      teacherId: string
    },
  ]
}>();

// Reactive data
const selectedPermissionLevel = ref<'read' | 'write' | 'manage'>('read');
const canAddObservations = ref(true);
const canEditClass = ref(false);
const canManageTeachers = ref(false);
const canTakeAttendance = ref(true);
const canViewAttendanceHistory = ref(true);
const canManageStudents = ref(false);
const canManageSchedule = ref(false);
const isRemovingAccess = ref(false);

// Initial permissions from the class data
const initialPermissions = computed(() => {
  if (!props.classData || !props.teacher) return [];
  return props.classData.permissions?.[props.teacher.id] || [];
});

// Get teacher permissions object from classData.teachers array
const teacherPermissions = computed(() => {
  if (!props.classData || !props.teacher || !props.classData.teachers) return null;

  const teacher = props.classData.teachers.find(
    (t) =>
      (typeof t === 'string' && t === props.teacher?.id) ||
      (typeof t === 'object' && t.teacherId === props.teacher?.id),
  );

  if (teacher && typeof teacher === 'object') {
    return teacher.permissions;
  }

  return null;
});

// Available specific permissions based on level
const availablePermissions = computed(() => {
  const basePermissions = [
    { key: 'canTakeAttendance', label: 'Tomar asistencia', enabled: true },
    { key: 'canAddObservations', label: 'Agregar observaciones', enabled: true },
    { key: 'canViewAttendanceHistory', label: 'Ver historial de asistencia', enabled: true },
  ];

  if (selectedPermissionLevel.value === 'write') {
    return [
      ...basePermissions,
      { key: 'canEditClass', label: 'Editar información de la clase', enabled: true },
      { key: 'canManageStudents', label: 'Gestionar estudiantes', enabled: true },
    ];
  }

  if (selectedPermissionLevel.value === 'manage') {
    return [
      ...basePermissions,
      { key: 'canEditClass', label: 'Editar información de la clase', enabled: true },
      { key: 'canManageStudents', label: 'Gestionar estudiantes', enabled: true },
      { key: 'canManageTeachers', label: 'Gestionar otros maestros', enabled: true },
      { key: 'canManageSchedule', label: 'Modificar horarios', enabled: true },
    ];
  }

  return basePermissions;
});

// Check if there are changes from initial state
const hasChanges = computed(() => {
  const currentPermissions = teacherPermissions.value;

  // Compare current form values with teacher's existing permissions
  if (!currentPermissions) {
    // If teacher has no permissions, check if any are now enabled
    return (
      canAddObservations.value ||
      canEditClass.value ||
      canManageTeachers.value ||
      canTakeAttendance.value ||
      canViewAttendanceHistory.value ||
      canManageStudents.value ||
      canManageSchedule.value
    );
  }

  return (
    canAddObservations.value !== (currentPermissions.canAddObservations || false) ||
    canEditClass.value !== (currentPermissions.canEditClass || false) ||
    canManageTeachers.value !== (currentPermissions.canManageTeachers || false) ||
    canTakeAttendance.value !== (currentPermissions.canTakeAttendance || false) ||
    canViewAttendanceHistory.value !== (currentPermissions.canViewAttendanceHistory || false) ||
    canManageStudents.value !== (currentPermissions.canManageStudents || false) ||
    canManageSchedule.value !== (currentPermissions.canManageSchedule || false)
  );
});

// Helper methods
const getProgramName = (level?: string): string => {
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

const getPermissionsObject = () => {
  return {
    canAddObservations: canAddObservations.value,
    canEditClass: canEditClass.value,
    canManageTeachers: canManageTeachers.value,
    canTakeAttendance: canTakeAttendance.value,
    canViewAttendanceHistory: canViewAttendanceHistory.value,
    canManageStudents: canManageStudents.value,
    canManageSchedule: canManageSchedule.value,
  };
};

const savePermissions = () => {
  if (!props.classData || !props.teacher) return;

  const permissions = getPermissionsObject();

  emit('save', {
    classId: props.classData.id,
    teacherId: props.teacher.id,
    permissions,
    role: selectedPermissionLevel.value,
  });
};

const removeAccess = () => {
  if (!props.classData || !props.teacher) return;

  emit('remove', {
    classId: props.classData.id,
    teacherId: props.teacher.id,
  });
};

// Initialize form when dialog opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.classData && props.teacher) {
      const permissions = initialPermissions.value;

      // Determine the permission level
      if (permissions.includes('manage')) {
        selectedPermissionLevel.value = 'manage';
      } else if (permissions.includes('write')) {
        selectedPermissionLevel.value = 'write';
      } else {
        selectedPermissionLevel.value = 'read';
      }

      // Set specific permissions from teacher's current permissions
      const currentPermissions = teacherPermissions.value;
      if (currentPermissions) {
        canAddObservations.value = currentPermissions.canAddObservations || false;
        canEditClass.value = currentPermissions.canEditClass || false;
        canManageTeachers.value = currentPermissions.canManageTeachers || false;
        canTakeAttendance.value = currentPermissions.canTakeAttendance || false;
        canViewAttendanceHistory.value = currentPermissions.canViewAttendanceHistory || false;
        canManageStudents.value = currentPermissions.canManageStudents || false;
        canManageSchedule.value = currentPermissions.canManageSchedule || false;
      } else {
        // Initialize with default permissions based on level
        canAddObservations.value = false;
        canEditClass.value = false;
        canManageTeachers.value = false;
        canTakeAttendance.value = false;
        canViewAttendanceHistory.value = false;
        canManageStudents.value = false;
        canManageSchedule.value = false;
      }

      isRemovingAccess.value = false;
    }
  },
);

// Auto-select relevant permissions when level changes
watch(selectedPermissionLevel, (newLevel) => {
  if (newLevel === 'read') {
    // Reset all permissions for read-only access
    canAddObservations.value = false;
    canEditClass.value = false;
    canManageTeachers.value = false;
    canTakeAttendance.value = false;
    canViewAttendanceHistory.value = false;
    canManageStudents.value = false;
    canManageSchedule.value = false;
  } else if (newLevel === 'write') {
    // Set basic permissions for write access
    canTakeAttendance.value = true;
    canAddObservations.value = true;
    canViewAttendanceHistory.value = true;
    canEditClass.value = true;
    canManageStudents.value = true;
    // Keep management permissions false for write level
    canManageTeachers.value = false;
    canManageSchedule.value = false;
  } else if (newLevel === 'manage') {
    // Set all permissions for manage access
    canTakeAttendance.value = true;
    canAddObservations.value = true;
    canViewAttendanceHistory.value = true;
    canEditClass.value = true;
    canManageStudents.value = true;
    canManageTeachers.value = true;
    canManageSchedule.value = true;
  }
});
</script>

<style scoped>
/* Custom radio button styling */
input[type="radio"]:checked {
  background-color: #6366f1;
  border-color: #6366f1;
}

input[type="radio"]:focus {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
</style>
