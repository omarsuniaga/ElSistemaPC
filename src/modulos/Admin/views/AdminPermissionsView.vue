<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
    >
      <div class="px-6 py-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Permisos</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Administra roles y permisos del sistema
        </p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Error</h3>
              <div class="mt-2 text-sm text-red-700">
                <p>{{ error }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Tabs -->
        <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="flex space-x-8 px-6" aria-label="Tabs">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                :class="[
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                ]"
                @click="activeTab = tab.id"
              >
                {{ tab.name }}
              </button>
            </nav>
          </div>

          <div class="p-6">
            <!-- Roles Tab -->
            <div v-if="activeTab === 'roles'">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white">Roles del Sistema</h2>
                <button
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  @click="openRoleModal()"
                >
                  <PlusIcon class="h-4 w-4 mr-2" />
                  Nuevo Rol
                </button>
              </div>

              <!-- Roles List -->
              <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                  <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Rol
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Descripción
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Permisos
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Estado
                      </th>
                      <th
                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                  >
                    <tr
                      v-for="role in roles"
                      :key="role.id"
                      class="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ role.name }}
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm text-gray-500 dark:text-gray-300">
                          {{ role.description }}
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm text-gray-500 dark:text-gray-300">
                          {{ role.permissions.length }} permisos
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          :class="[
                            role.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
                            'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                          ]"
                        >
                          {{ role.isActive ? "Activo" : "Inactivo" }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                          @click="openRoleModal(role)"
                        >
                          Editar
                        </button>
                        <button
                          :class="[
                            role.isActive
                              ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                              : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300',
                          ]"
                          @click="toggleRoleStatus(role)"
                        >
                          {{ role.isActive ? "Desactivar" : "Activar" }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Permissions Tab -->
            <div v-if="activeTab === 'permissions'">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                  Permisos del Sistema
                </h2>
                <button
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  @click="openPermissionModal()"
                >
                  <PlusIcon class="h-4 w-4 mr-2" />
                  Nuevo Permiso
                </button>
              </div>

              <!-- Permissions by Module -->
              <div class="space-y-6">
                <div
                  v-for="(modulePermissions, module) in permissionsByModule"
                  :key="module"
                  class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                >
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 capitalize">
                    Módulo: {{ module }}
                  </h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div
                      v-for="permission in modulePermissions"
                      :key="permission.id"
                      class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div class="flex justify-between items-start mb-2">
                        <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ permission.name }}
                        </h4>
                        <button
                          class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                          @click="openPermissionModal(permission)"
                        >
                          Editar
                        </button>
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {{ permission.description }}
                      </p>
                      <div class="flex flex-wrap gap-1">
                        <span
                          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                        >
                          {{ permission.action }}
                        </span>
                        <span
                          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                        >
                          {{ permission.resource }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Role Modal -->
    <div
      v-if="showRoleModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800"
      >
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ editingRole ? "Editar Rol" : "Nuevo Rol" }}
          </h3>
          <form class="space-y-4" @submit.prevent="saveRole">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Nombre</label
              >
              <input
                v-model="roleForm.name"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Descripción</label
              >
              <textarea
                v-model="roleForm.description"
                rows="3"
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Permisos</label
              >
              <div
                class="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3"
              >
                <div
                  v-for="permission in permissions"
                  :key="permission.id"
                  class="flex items-center mb-2"
                >
                  <input
                    :id="`permission-${permission.id}`"
                    v-model="roleForm.permissions"
                    :value="permission.id"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    :for="`permission-${permission.id}`"
                    class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {{ permission.name }} - {{ permission.description }}
                  </label>
                </div>
              </div>
            </div>
            <div class="flex items-center">
              <input
                id="role-active"
                v-model="roleForm.isActive"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="role-active" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Rol activo
              </label>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                @click="closeRoleModal"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Permission Modal -->
    <div
      v-if="showPermissionModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800"
      >
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ editingPermission ? "Editar Permiso" : "Nuevo Permiso" }}
          </h3>
          <form class="space-y-4" @submit.prevent="savePermission">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Nombre</label
              >
              <input
                v-model="permissionForm.name"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Descripción</label
              >
              <textarea
                v-model="permissionForm.description"
                rows="2"
                class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Módulo</label
                >
                <input
                  v-model="permissionForm.module"
                  type="text"
                  required
                  class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Acción</label
                >
                <input
                  v-model="permissionForm.action"
                  type="text"
                  required
                  class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Recurso</label
                >
                <input
                  v-model="permissionForm.resource"
                  type="text"
                  required
                  class="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                @click="closePermissionModal"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRBACManagement, type Role, type Permission } from '@/composables/useRBACManagement';
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';

// Composables
const { roles, permissions, loading, error, loadRoles, loadPermissions, saveRoles, savePermissions } =
  useRBACManagement();

// Reactive data
const activeTab = ref('roles');
const showRoleModal = ref(false);
const showPermissionModal = ref(false);
const editingRole = ref<Role | null>(null);
const editingPermission = ref<Permission | null>(null);

// Form data
const roleForm = ref({
  id: '',
  name: '',
  description: '',
  permissions: [] as string[],
  isActive: true,
});

const permissionForm = ref({
  id: '',
  name: '',
  description: '',
  module: '',
  action: '',
  resource: '',
});

// Computed
const tabs = computed(() => [
  { id: 'roles', name: 'Roles' },
  { id: 'permissions', name: 'Permisos' },
]);

const permissionsByModule = computed(() => {
  const grouped: Record<string, Permission[]> = {};
  permissions.value.forEach((permission) => {
    if (!grouped[permission.module]) {
      grouped[permission.module] = [];
    }
    grouped[permission.module].push(permission);
  });
  return grouped;
});

// Methods
const openRoleModal = (role?: Role) => {
  if (role) {
    editingRole.value = role;
    roleForm.value = {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
      isActive: role.isActive,
    };
  } else {
    editingRole.value = null;
    roleForm.value = {
      id: '',
      name: '',
      description: '',
      permissions: [],
      isActive: true,
    };
  }
  showRoleModal.value = true;
};

const closeRoleModal = () => {
  showRoleModal.value = false;
  editingRole.value = null;
};

const openPermissionModal = (permission?: Permission) => {
  if (permission) {
    editingPermission.value = permission;
    permissionForm.value = {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      module: permission.module,
      action: permission.action,
      resource: permission.resource,
    };
  } else {
    editingPermission.value = null;
    permissionForm.value = {
      id: '',
      name: '',
      description: '',
      module: '',
      action: '',
      resource: '',
    };
  }
  showPermissionModal.value = true;
};

const closePermissionModal = () => {
  showPermissionModal.value = false;
  editingPermission.value = null;
};

const saveRole = async () => {
  try {
    const roleData = {
      ...roleForm.value,
      id: roleForm.value.id || generateId(),
      createdAt: editingRole.value?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (editingRole.value) {
      // Update existing role
      const index = roles.value.findIndex((r) => r.id === editingRole.value!.id);
      if (index !== -1) {
        roles.value[index] = roleData;
      }
    } else {
      // Add new role
      roles.value.push(roleData);
    }

    await saveRoles();
    closeRoleModal();
  } catch (err) {
    console.error('Error saving role:', err);
    error.value = 'Error al guardar el rol';
  }
};

const savePermission = async () => {
  try {
    const permissionData = {
      ...permissionForm.value,
      id: permissionForm.value.id || generateId(),
    };

    if (editingPermission.value) {
      // Update existing permission
      const index = permissions.value.findIndex((p) => p.id === editingPermission.value!.id);
      if (index !== -1) {
        permissions.value[index] = permissionData;
      }
    } else {
      // Add new permission
      permissions.value.push(permissionData);
    }

    await savePermissions();
    closePermissionModal();
  } catch (err) {
    console.error('Error saving permission:', err);
    error.value = 'Error al guardar el permiso';
  }
};

const toggleRoleStatus = async (role: Role) => {
  try {
    const index = roles.value.findIndex((r) => r.id === role.id);
    if (index !== -1) {
      roles.value[index].isActive = !roles.value[index].isActive;
      roles.value[index].updatedAt = new Date();
      await saveRoles();
    }
  } catch (err) {
    console.error('Error toggling role status:', err);
    error.value = 'Error al cambiar el estado del rol';
  }
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Lifecycle
onMounted(async () => {
  await Promise.all([loadRoles(), loadPermissions()]);
});
</script>
