<!-- src/modulos/Superusuario/views/RBACManagement.vue -->

<template>
  <div class="rbac-management">
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
      <h1 class="text-2xl font-bold mb-2">🔐 Gestión de Roles y Permisos (RBAC)</h1>
      <p class="text-purple-100">Control dinámico de acceso basado en roles</p>
    </div>

    <div class="bg-white rounded-b-lg shadow-lg">
      <!-- Quick Actions -->
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600">
            Roles: {{ roles.length }} | Permisos: {{ permissions.length }}
          </div>
          <button 
            @click="forceInitializeRBAC"
            :disabled="loading"
            class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            🔄 Inicializar Datos por Defecto
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8 px-6" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === tab.id
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ tab.icon }} {{ tab.name }}
          </button>
        </nav>
      </div>

      <div class="p-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span class="ml-2 text-gray-600">Cargando...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {{ error }}
        </div>

        <!-- Tab: Roles -->
        <div v-else-if="activeTab === 'roles'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold">Gestión de Roles</h2>
            <button @click="openRoleModal()" class="btn-primary">
              ➕ Crear Rol
            </button>
          </div>

          <!-- Lista de Roles -->
          <div class="grid gap-4">
            <div
              v-for="role in roles"
              :key="role.id"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <h3 class="font-medium text-gray-900">{{ role.name }}</h3>
                    <span
                      :class="[
                        'px-2 py-1 text-xs rounded-full',
                        role.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      ]"
                    >
                      {{ role.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mt-1">{{ role.description }}</p>
                  <div class="mt-2">
                    <span class="text-xs text-gray-500">{{ role.permissions.length }} permisos asignados</span>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <button @click="openRoleModal(role)" class="btn-secondary-sm">
                    ✏️
                  </button>
                  <button @click="toggleRoleStatus(role)" class="btn-warning-sm">
                    🔌
                  </button>
                  <button @click="confirmDeleteRole(role)" class="btn-danger-sm">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Permisos -->
        <div v-else-if="activeTab === 'permissions'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold">Gestión de Permisos</h2>
            <button @click="openPermissionModal()" class="btn-primary">
              ➕ Crear Permiso
            </button>
          </div>

          <!-- Filtros -->
          <div class="flex space-x-4">
            <select v-model="selectedModule" class="form-select">
              <option value="">Todos los módulos</option>
              <option v-for="module in availableModules" :key="`module-${module}`" :value="module">
                {{ module }}
              </option>
            </select>
          </div>

          <!-- Lista de Permisos agrupados por módulo -->
          <div v-for="(modulePermissions, module) in filteredGroupedPermissions" :key="module" class="space-y-4">
            <div class="bg-gray-50 px-4 py-2 rounded-md">
              <h3 class="font-medium text-gray-800 capitalize">📁 {{ module }}</h3>
            </div>
            
            <div class="grid gap-3">
              <div
                v-for="permission in modulePermissions"
                :key="permission.id"
                class="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900">{{ permission.name }}</h4>
                    <p class="text-sm text-gray-600 mt-1">{{ permission.description }}</p>
                    <div class="flex items-center space-x-4 mt-2">
                      <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Acción: {{ permission.action }}</span>
                      <span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Recurso: {{ permission.resource }}</span>
                    </div>
                  </div>
                  <div class="flex space-x-2">
                    <button @click="openPermissionModal(permission)" class="btn-secondary-sm">
                      ✏️
                    </button>
                    <button @click="confirmDeletePermission(permission)" class="btn-danger-sm">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <RoleModal
      :is-open="roleModalOpen"
      :role="selectedRole"
      @close="closeRoleModal"
      @saved="onRoleSaved"
    />

    <PermissionModal
      :is-open="permissionModalOpen"
      :permission="selectedPermission"
      @close="closePermissionModal"
      @saved="onPermissionSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRBACManagement, type Role, type Permission } from '../../../composables/useRBACManagement'
import RoleModal from '../components/RoleModal.vue'
import PermissionModal from '../components/PermissionModal.vue'

const {
  roles,
  permissions,
  loading,
  error,
  deleteRole,
  updateRole,
  deletePermission,
  getPermissionsByModule,
  forceInitializeRBAC
} = useRBACManagement()

const activeTab = ref('roles')
const selectedModule = ref('')
const roleModalOpen = ref(false)
const permissionModalOpen = ref(false)
const selectedRole = ref<Role | null>(null)
const selectedPermission = ref<Permission | null>(null)

const tabs = [
  { id: 'roles', name: 'Roles', icon: '��' },
  { id: 'permissions', name: 'Permisos', icon: '🔑' }
]

const availableModules = computed(() => {
  const modules = new Set(permissions.value.map(p => p.module))
  return Array.from(modules).sort()
})

const filteredGroupedPermissions = computed(() => {
  const grouped = getPermissionsByModule.value
  if (!selectedModule.value) {
    return grouped
  }
  
  return {
    [selectedModule.value]: grouped[selectedModule.value] || []
  }
})

// Funciones para roles
const openRoleModal = (role?: Role) => {
  selectedRole.value = role || null
  roleModalOpen.value = true
}

const closeRoleModal = () => {
  roleModalOpen.value = false
  selectedRole.value = null
}

const onRoleSaved = () => {
  // El composable se encarga de recargar los datos
  console.log('Rol guardado exitosamente')
}

const toggleRoleStatus = async (role: Role) => {
  try {
    await updateRole(role.id, { isActive: !role.isActive })
  } catch (error) {
    console.error('Error al cambiar estado del rol:', error)
    alert('Error al cambiar el estado del rol')
  }
}

const confirmDeleteRole = async (role: Role) => {
  if (confirm(`¿Estás seguro de que quieres eliminar el rol "${role.name}"?`)) {
    try {
      await deleteRole(role.id)
    } catch (error) {
      console.error('Error al eliminar rol:', error)
      alert('Error al eliminar el rol')
    }
  }
}

// Funciones para permisos
const openPermissionModal = (permission?: Permission) => {
  selectedPermission.value = permission || null
  permissionModalOpen.value = true
}

const closePermissionModal = () => {
  permissionModalOpen.value = false
  selectedPermission.value = null
}

const onPermissionSaved = () => {
  // El composable se encarga de recargar los datos
  console.log('Permiso guardado exitosamente')
}

const confirmDeletePermission = async (permission: Permission) => {
  if (confirm(`¿Estás seguro de que quieres eliminar el permiso "${permission.name}"?`)) {
    try {
      await deletePermission(permission.id)
    } catch (error) {
      console.error('Error al eliminar permiso:', error)
      alert('Error al eliminar el permiso')
    }
  }
}

// Inicialización
onMounted(() => {
  // Los datos se cargan automáticamente a través del composable
})
</script>

<style scoped>
.rbac-management {
  max-width: 1200px;
  margin: 0 auto;
}

.btn-primary {
  background-color: rgb(147 51 234);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: rgb(126 34 206);
}

.btn-secondary-sm {
  background-color: rgb(243 244 246);
  color: rgb(75 85 99);
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
  border: none;
  cursor: pointer;
}

.btn-secondary-sm:hover {
  background-color: rgb(229 231 235);
}

.btn-warning-sm {
  background-color: rgb(254 243 199);
  color: rgb(180 83 9);
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
  border: none;
  cursor: pointer;
}

.btn-warning-sm:hover {
  background-color: rgb(252 211 77);
}

.btn-danger-sm {
  background-color: rgb(254 226 226);
  color: rgb(220 38 38);
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
  border: none;
  cursor: pointer;
}

.btn-danger-sm:hover {
  background-color: rgb(252 165 165);
}

.form-select {
  border: 1px solid rgb(209 213 219);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
}

.form-select:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgb(147 51 234);
  border-color: rgb(147 51 234);
}
</style>
