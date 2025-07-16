<!-- src/modulos/Superusuario/components/EditUserModal.vue -->
<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold">✏️ Editar Usuario</h2>
            <p class="text-blue-100 text-sm">{{ user?.email }}</p>
          </div>
          <button class="text-white hover:text-gray-200 text-2xl" @click="$emit('close')">×</button>
        </div>
      </div>

      <form class="p-6 space-y-6" @submit.prevent="handleSubmit">
        <!-- Información básica -->
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📋 Información Básica
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                v-model="formData.email"
                type="email"
                readonly
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre completo *
              </label>
              <input
                v-model="formData.displayName"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                placeholder="Nombre Apellido"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rol *
              </label>
              <select
                v-model="formData.role"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                @change="onRoleChange"
              >
                <option value="">Seleccionar rol...</option>
                <option value="Colaborador">Colaborador</option>
                <option value="Monitor">Monitor</option>
                <option value="Maestro">Maestro</option>
                <option value="Admin">Administrador</option>
                <option value="Director">Director</option>
                <option value="Superusuario">Superusuario</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                v-model="formData.isActive"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              >
                <option :value="true">Activo</option>
                <option :value="false">Inactivo</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Permisos del rol -->
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            🔐 Permisos del Rol
            <span class="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
              ({{ formData.role || "Sin rol seleccionado" }})
            </span>
          </h3>

          <div v-if="!formData.role" class="text-center py-4 text-gray-500 dark:text-gray-400">
            Selecciona un rol para ver los permisos
          </div>

          <div
            v-else-if="rolePermissions.length === 0"
            class="text-center py-4 text-orange-600 dark:text-orange-400"
          >
            ⚠️ Este rol no tiene permisos configurados
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="permission in rolePermissions"
              :key="permission.id"
              class="bg-white dark:bg-gray-700 p-3 rounded-md border border-blue-200 dark:border-blue-700"
            >
              <div class="flex items-center">
                <span class="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ permission.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ permission.module }} → {{ permission.action }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Información del Sistema
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-700 dark:text-gray-300">Usuario creado:</span>
              <p class="text-gray-600 dark:text-gray-400">
                {{ user?.createdAt ? formatDate(user.createdAt) : "No disponible" }}
              </p>
            </div>

            <div>
              <span class="font-medium text-gray-700 dark:text-gray-300">Último acceso:</span>
              <p class="text-gray-600 dark:text-gray-400">
                {{ user?.lastLogin ? formatDate(user.lastLogin) : "Nunca" }}
              </p>
            </div>

            <div>
              <span class="font-medium text-gray-700 dark:text-gray-300">UID:</span>
              <p class="text-gray-600 dark:text-gray-400 font-mono text-xs">
                {{ user?.id || "N/A" }}
              </p>
            </div>

            <div>
              <span class="font-medium text-gray-700 dark:text-gray-300">Estado verificación:</span>
              <p class="text-gray-600 dark:text-gray-400">
                {{ user?.emailVerified ? "✅ Verificado" : "❌ No verificado" }}
              </p>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            class="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            @click="$emit('close')"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? "Guardando..." : "Guardar Cambios" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRBACManagement } from '@/composables/useRBACManagement';

interface User {
  id: string
  email: string
  displayName?: string
  role: string
  isActive: boolean
  createdAt?: any
  lastLogin?: any
  emailVerified?: boolean
}

interface Props {
  isOpen: boolean
  user?: User | null
}

interface Emits {
  (e: 'close'): void
  (e: 'saved', user: User): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { roles, permissions, loadRoles, loadPermissions } = useRBACManagement();
const loading = ref(false);

const formData = ref({
  email: '',
  displayName: '',
  role: '',
  isActive: true,
});

// Computed para obtener permisos del rol seleccionado
const rolePermissions = computed(() => {
  if (!formData.value.role || !roles.value.length || !permissions.value.length) {
    return [];
  }

  const role = roles.value.find((r) => r.name === formData.value.role);
  if (!role) return [];

  return permissions.value.filter((p) => role.permissions.includes(p.id));
});

// Resetear formulario cuando se abre/cierra el modal
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && props.user) {
      formData.value = {
        email: props.user.email,
        displayName: props.user.displayName || '',
        role: props.user.role,
        isActive: props.user.isActive,
      };

      // Cargar datos necesarios
      if (roles.value.length === 0) {
        loadRoles();
      }
      if (permissions.value.length === 0) {
        loadPermissions();
      }
    }
  },
);

const onRoleChange = () => {
  console.log('Rol cambiado a:', formData.value.role);
  // Aquí podrías mostrar una confirmación si el cambio de rol es significativo
};

const handleSubmit = async () => {
  if (!props.user) return;

  try {
    loading.value = true;

    // Aquí deberías implementar la lógica para actualizar el usuario
    // Por ahora, simularemos la actualización
    const updatedUser: User = {
      ...props.user,
      displayName: formData.value.displayName,
      role: formData.value.role,
      isActive: formData.value.isActive,
    };

    // TODO: Implementar la actualización real del usuario en Firestore
    console.log('Actualizando usuario:', updatedUser);

    // Simular un delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    emit('saved', updatedUser);
    emit('close');
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    alert('Error al actualizar el usuario. Por favor, inténtalo de nuevo.');
  } finally {
    loading.value = false;
  }
};

const formatDate = (date: any) => {
  if (!date) return 'No disponible';

  const d = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
