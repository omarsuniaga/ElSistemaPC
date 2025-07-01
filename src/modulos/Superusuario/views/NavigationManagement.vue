<!-- src/modulos/Superusuario/views/NavigationManagement.vue -->

<template>
  <div class="navigation-management">
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
      <h1 class="text-2xl font-bold mb-2">🧭 Gestión de Navegación</h1>
      <p class="text-blue-100">Configura qué páginas pueden ver cada rol de usuario</p>
    </div>

    <div class="bg-white rounded-b-lg shadow-lg">
      <!-- Quick Actions -->
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600">
            Elementos configurados: {{ navigationConfig.length }}
          </div>
          <div class="flex space-x-2">
            <button
              :disabled="loading"
              class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              @click="loadData"
            >
              🔄 Recargar
            </button>
            <button
              :disabled="loading || !hasChanges"
              class="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              @click="saveChanges"
            >
              💾 Guardar Cambios
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span class="ml-2 text-gray-600">Cargando configuración...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 text-center text-red-600">
        ❌ {{ error }}
        <button class="ml-2 text-blue-600 underline" @click="loadData">Reintentar</button>
      </div>

      <!-- Navigation Configuration -->
      <div v-else class="p-6">
        <!-- Roles Tabs -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="flex space-x-8" aria-label="Tabs">
            <button
              v-for="role in availableRoles"
              :key="role"
              :class="[
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
                selectedRole === role
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ]"
              @click="selectedRole = role"
            >
              {{ getRoleIcon(role) }} {{ role }}
            </button>
          </nav>
        </div>

        <!-- Navigation Items for Selected Role -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Configuración de navegación para: {{ selectedRole }}
          </h3>

          <div class="grid gap-4">
            <div
              v-for="item in getNavigationForRole(selectedRole)"
              :key="item.id"
              class="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <span class="text-2xl">{{ item.icon }}</span>
                  <div>
                    <h4 class="font-medium text-gray-900">{{ item.name }}</h4>
                    <p class="text-sm text-gray-500">{{ item.path }}</p>
                  </div>
                </div>

                <div class="flex items-center space-x-4">
                  <!-- Order -->
                  <div class="flex items-center space-x-2">
                    <label class="text-xs text-gray-500">Orden:</label>
                    <input
                      v-model.number="item.order"
                      type="number"
                      min="1"
                      class="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                      @input="markAsChanged"
                    />
                  </div>

                  <!-- Active Toggle -->
                  <div class="flex items-center space-x-2">
                    <label class="text-xs text-gray-500">Activo:</label>
                    <input
                      v-model="item.isActive"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      @change="markAsChanged"
                    />
                  </div>

                  <!-- Role Toggle for this item -->
                  <div class="flex items-center space-x-2">
                    <label class="text-xs text-gray-500">Visible:</label>
                    <input
                      :checked="item.roles.includes(selectedRole)"
                      type="checkbox"
                      class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      @change="toggleRoleForItem(item, selectedRole, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Add New Navigation Item -->
          <div class="mt-8 border-t border-gray-200 pt-6">
            <h4 class="text-md font-semibold mb-4">Agregar Nuevo Elemento de Navegación</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  v-model="newItem.name"
                  type="text"
                  placeholder="Ej: Reportes"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Ruta</label>
                <select
                  v-model="newItem.path"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar ruta...</option>
                  <option v-for="route in availableRoutes" :key="route.path" :value="route.path">
                    {{ route.path }} - {{ route.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Ícono</label>
                <input
                  v-model="newItem.icon"
                  type="text"
                  placeholder="🔧"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Orden</label>
                <input
                  v-model.number="newItem.order"
                  type="number"
                  min="1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <button
              :disabled="!canAddNewItem"
              class="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="addNewItem"
            >
              ➕ Agregar Elemento
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Changes Indicator -->
    <div
      v-if="hasChanges"
      class="fixed bottom-4 right-4 bg-orange-100 border border-orange-400 text-orange-700 px-4 py-2 rounded-lg shadow-lg"
    >
      ⚠️ Hay cambios sin guardar
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRBACManagement} from "@/composables/useRBACManagement"
import {NavigationService} from "@/services/navigation/navigationService"
import type {NavigationItem} from "@/services/rbac/rbacPersistenceService"
import {useAuthStore} from "@/stores/auth"

const rbacManagement = useRBACManagement()
const navigationService = NavigationService.getInstance()
const authStore = useAuthStore()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const selectedRole = ref("Maestro")
const hasChanges = ref(false)

// Available roles
const availableRoles = ["Maestro", "Maestro Avanzado", "Director", "Admin", "Superusuario"]

// Navigation configuration
const navigationConfig = computed(() => rbacManagement.navigationConfig.value)

// Available routes
const availableRoutes = navigationService.getAllAvailableRoutes()

// New item form
const newItem = ref({
  name: "",
  path: "",
  icon: "🔧",
  order: 1,
})

// Methods
const loadData = async () => {
  try {
    loading.value = true
    error.value = null
    await rbacManagement.initialize()
    await rbacManagement.loadNavigationConfig()
  } catch (err) {
    error.value = "Error cargando configuración de navegación"
    console.error("Error loading navigation config:", err)
  } finally {
    loading.value = false
  }
}

const getNavigationForRole = (role: string): NavigationItem[] => {
  return navigationConfig.value
    .filter((item) => item.roles.includes(role))
    .sort((a, b) => a.order - b.order)
}

const getRoleIcon = (role: string): string => {
  const icons: Record<string, string> = {
    Maestro: "👨‍🏫",
    "Maestro Avanzado": "🎓",
    Director: "👨‍💼",
    Admin: "⚙️",
    Superusuario: "🚀",
  }
  return icons[role] || "👤"
}

const toggleRoleForItem = (item: NavigationItem, role: string, event: Event) => {
  const isChecked = (event.target as HTMLInputElement).checked

  if (isChecked) {
    if (!item.roles.includes(role)) {
      item.roles.push(role)
    }
  } else {
    const index = item.roles.indexOf(role)
    if (index > -1) {
      item.roles.splice(index, 1)
    }
  }

  markAsChanged()
}

const markAsChanged = () => {
  hasChanges.value = true
}

const canAddNewItem = computed(() => {
  return newItem.value.name && newItem.value.path && newItem.value.icon
})

const addNewItem = () => {
  if (!canAddNewItem.value) return

  const newNavItem: NavigationItem = {
    id: `custom-${Date.now()}`,
    name: newItem.value.name,
    path: newItem.value.path,
    icon: newItem.value.icon,
    roles: [selectedRole.value],
    isActive: true,
    order: newItem.value.order,
  }

  navigationConfig.value.push(newNavItem)

  // Reset form
  newItem.value = {
    name: "",
    path: "",
    icon: "🔧",
    order: 1,
  }

  markAsChanged()
}

const saveChanges = async () => {
  try {
    loading.value = true
    error.value = null

    const currentUser = authStore.user
    if (!currentUser) {
      throw new Error("No hay usuario autenticado")
    }

    await rbacManagement.saveNavigationConfig(currentUser.uid)
    hasChanges.value = false

    console.log("✅ Configuración de navegación guardada")
  } catch (err) {
    error.value = "Error guardando configuración de navegación"
    console.error("Error saving navigation config:", err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.navigation-management {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
