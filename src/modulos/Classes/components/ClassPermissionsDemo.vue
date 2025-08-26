<template>
  <div class="class-permissions-demo p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Sistema de Permisos de Clase
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Demostración del sistema de permisos READ, WRITE, MANAGE
      </p>
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Información de permisos -->
    <div v-else class="space-y-6">
      <!-- Nivel de permiso actual -->
      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white">Nivel de Permiso</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400">Tu nivel de acceso actual</p>
        </div>
        <span :class="permissionColor" class="px-3 py-1 rounded-full text-sm font-medium">
          {{ permissionText }}
        </span>
      </div>

      <!-- Permisos específicos -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Permiso de ver asistencia -->
        <div class="p-4 border rounded-lg" :class="{
          'border-green-200 bg-green-50 dark:bg-green-900/20': permissions.canView,
          'border-red-200 bg-red-50 dark:bg-red-900/20': !permissions.canView
        }">
          <div class="flex items-center mb-2">
            <EyeIcon class="h-5 w-5 mr-2" :class="{
              'text-green-600': permissions.canView,
              'text-red-600': !permissions.canView
            }" />
            <h5 class="font-medium">Ver Asistencia</h5>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ permissions.canView ? 'Puedes ver el listado de asistencia' : 'No puedes ver asistencia' }}
          </p>
        </div>

        <!-- Permiso de pasar asistencia -->
        <div class="p-4 border rounded-lg" :class="{
          'border-green-200 bg-green-50 dark:bg-green-900/20': permissions.canTakeAttendance,
          'border-red-200 bg-red-50 dark:bg-red-900/20': !permissions.canTakeAttendance
        }">
          <div class="flex items-center mb-2">
            <CheckCircleIcon class="h-5 w-5 mr-2" :class="{
              'text-green-600': permissions.canTakeAttendance,
              'text-red-600': !permissions.canTakeAttendance
            }" />
            <h5 class="font-medium">Pasar Asistencia</h5>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ permissions.canTakeAttendance ? 'Puedes registrar asistencia' : 'No puedes pasar asistencia' }}
          </p>
        </div>

        <!-- Notificaciones -->
        <div class="p-4 border rounded-lg" :class="{
          'border-green-200 bg-green-50 dark:bg-green-900/20': permissions.shouldReceiveNotifications,
          'border-red-200 bg-red-50 dark:bg-red-900/20': !permissions.shouldReceiveNotifications
        }">
          <div class="flex items-center mb-2">
            <BellIcon class="h-5 w-5 mr-2" :class="{
              'text-green-600': permissions.shouldReceiveNotifications,
              'text-red-600': !permissions.shouldReceiveNotifications
            }" />
            <h5 class="font-medium">Notificaciones</h5>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ permissions.shouldReceiveNotifications ? 'Recibes notificaciones obligatorias' : 'No recibes notificaciones' }}
          </p>
        </div>

        <!-- Gestión de estudiantes -->
        <div class="p-4 border rounded-lg" :class="{
          'border-green-200 bg-green-50 dark:bg-green-900/20': permissions.canManageStudents,
          'border-red-200 bg-red-50 dark:bg-red-900/20': !permissions.canManageStudents
        }">
          <div class="flex items-center mb-2">
            <UserGroupIcon class="h-5 w-5 mr-2" :class="{
              'text-green-600': permissions.canManageStudents,
              'text-red-600': !permissions.canManageStudents
            }" />
            <h5 class="font-medium">Gestionar Estudiantes</h5>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ permissions.canManageStudents ? 'Puedes agregar/quitar estudiantes' : 'No puedes gestionar estudiantes' }}
          </p>
        </div>

        <!-- Modificar clase -->
        <div class="p-4 border rounded-lg" :class="{
          'border-green-200 bg-green-50 dark:bg-green-900/20': permissions.canModifyClass,
          'border-red-200 bg-red-50 dark:bg-red-900/20': !permissions.canModifyClass
        }">
          <div class="flex items-center mb-2">
            <PencilIcon class="h-5 w-5 mr-2" :class="{
              'text-green-600': permissions.canModifyClass,
              'text-red-600': !permissions.canModifyClass
            }" />
            <h5 class="font-medium">Modificar Clase</h5>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ permissions.canModifyClass ? 'Puedes editar detalles de la clase' : 'No puedes modificar la clase' }}
          </p>
        </div>

        <!-- Estados pendientes -->
        <div class="p-4 border rounded-lg" :class="{
          'border-green-200 bg-green-50 dark:bg-green-900/20': permissions.canViewPendingStates,
          'border-red-200 bg-red-50 dark:bg-red-900/20': !permissions.canViewPendingStates
        }">
          <div class="flex items-center mb-2">
            <ClockIcon class="h-5 w-5 mr-2" :class="{
              'text-green-600': permissions.canViewPendingStates,
              'text-red-600': !permissions.canViewPendingStates
            }" />
            <h5 class="font-medium">Estados Pendientes</h5>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ permissions.canViewPendingStates ? 'Ves asistencias pendientes' : 'No ves estados pendientes' }}
          </p>
        </div>
      </div>

      <!-- Explicación del sistema -->
      <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 class="font-medium text-blue-900 dark:text-blue-200 mb-2">
          Sistema de Permisos
        </h4>
        <div class="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <div><strong>READ:</strong> Solo puede ver el listado de asistencia</div>
          <div><strong>WRITE:</strong> Puede pasar asistencia, NO recibe notificaciones obligatorias</div>
          <div><strong>MANAGE:</strong> Todos los permisos + notificaciones + responsabilidad total</div>
          <div><strong>OWNER:</strong> Propietario de la clase, todos los permisos</div>
        </div>
      </div>

      <!-- Botones de prueba -->
      <div class="flex flex-wrap gap-2 mt-6">
        <button
          :disabled="!permissions.canView"
          :class="{
            'bg-blue-600 hover:bg-blue-700 text-white': permissions.canView,
            'bg-gray-300 text-gray-500 cursor-not-allowed': !permissions.canView
          }"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          @click="testViewAttendance"
        >
          Ver Asistencia
        </button>

        <button
          :disabled="!permissions.canTakeAttendance"
          :class="{
            'bg-green-600 hover:bg-green-700 text-white': permissions.canTakeAttendance,
            'bg-gray-300 text-gray-500 cursor-not-allowed': !permissions.canTakeAttendance
          }"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          @click="testTakeAttendance"
        >
          Pasar Asistencia
        </button>

        <button
          :disabled="!permissions.canManageStudents"
          :class="{
            'bg-purple-600 hover:bg-purple-700 text-white': permissions.canManageStudents,
            'bg-gray-300 text-gray-500 cursor-not-allowed': !permissions.canManageStudents
          }"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          @click="testManageStudents"
        >
          Gestionar Estudiantes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import {
  EyeIcon,
  CheckCircleIcon,
  BellIcon,
  UserGroupIcon,
  PencilIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';
import { useClassPermissions } from '../composables/useClassPermissions';

const props = defineProps<{
  classId: string
}>();

// Usar el composable de permisos
const {
  loading,
  permissions,
  permissionText,
  permissionColor,
  loadPermissions,
} = useClassPermissions(props.classId);

// Cargar permisos al montar
onMounted(() => {
  loadPermissions();
});

// Funciones de prueba
const testViewAttendance = () => {
  alert('✅ Puedes ver la asistencia de esta clase');
};

const testTakeAttendance = () => {
  alert('✅ Puedes pasar asistencia para esta clase');
};

const testManageStudents = () => {
  alert('✅ Puedes gestionar estudiantes de esta clase');
};
</script>