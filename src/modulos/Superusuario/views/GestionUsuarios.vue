<!-- src/modulos/Superusuario/views/GestionUsuarios.vue -->
<template>
  <div class="gestion-usuarios">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
      <h1 class="text-2xl font-bold mb-2">👥 Gestión de Usuarios</h1>
      <p class="text-blue-100">Administra todos los usuarios del sistema</p>
    </div>

    <div class="bg-white rounded-b-lg shadow-lg">
      <!-- Quick Actions -->
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600">
            Total de usuarios: {{ filteredUsers.length }}
          </div>
          <div class="flex space-x-2">
            <button 
              @click="showCreateUserModal = true"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              ➕ Crear Usuario
            </button>
            <button 
              @click="loadUsers"
              :disabled="loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex space-x-4">
          <div class="flex-1">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar por email, nombre o rol..."
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>
          <select v-model="roleFilter" class="px-4 py-2 border border-gray-300 rounded-md">
            <option value="">Todos los roles</option>
            <option value="Superusuario">Superusuario</option>
            <option value="Director">Director</option>
            <option value="Admin">Administrador</option>
            <option value="Maestro">Maestro</option>
            <option value="Monitor">Monitor</option>
            <option value="Colaborador">Colaborador</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">Cargando usuarios...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 text-center text-red-600">
        ❌ {{ error }}
        <button @click="loadUsers" class="ml-2 text-blue-600 underline">Reintentar</button>
      </div>

      <!-- Users List -->
      <div v-else class="p-6">
        <div class="grid gap-4">
          <div 
            v-for="user in paginatedUsers" 
            :key="user.id"
            class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <!-- Avatar -->
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-lg font-semibold text-blue-600">
                    {{ user.email?.charAt(0).toUpperCase() || '?' }}
                  </span>
                </div>
                
                <!-- User Info -->
                <div>
                  <h3 class="font-medium text-gray-900">{{ user.displayName || user.email }}</h3>
                  <p class="text-sm text-gray-500">{{ user.email }}</p>
                  <div class="flex items-center space-x-2 mt-1">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="getRoleColor(user.role)">
                      {{ user.role }}
                    </span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                      {{ user.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="flex items-center space-x-2">
                <button 
                  @click="editUser(user)"
                  class="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
                  title="Editar usuario"
                >
                  ✏️
                </button>
                <button 
                  @click="toggleUserStatus(user)"
                  class="p-2 hover:bg-gray-100 rounded-md"
                  :class="user.isActive ? 'text-orange-600' : 'text-green-600'"
                  :title="user.isActive ? 'Desactivar usuario' : 'Activar usuario'"
                >
                  {{ user.isActive ? '🔒' : '🔓' }}
                </button>
                <button 
                  @click="changeUserRole(user)"
                  class="p-2 text-purple-600 hover:bg-purple-100 rounded-md"
                  title="Cambiar rol"
                >
                  🔄
                </button>
                <button 
                  @click="deleteUser(user)"
                  class="p-2 text-red-600 hover:bg-red-100 rounded-md"
                  title="Eliminar usuario"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <!-- Additional Info -->
            <div v-if="user.lastLogin" class="mt-3 text-xs text-gray-500">
              Último acceso: {{ formatDate(user.lastLogin) }}
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-6 flex justify-center">
          <nav class="flex space-x-2">
            <button 
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              ← Anterior
            </button>
            
            <span v-for="page in visiblePages" :key="page">
              <button 
                v-if="page !== '...'"
                @click="currentPage = page"
                :class="[
                  'px-3 py-2 text-sm rounded-md',
                  page === currentPage 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                ]"
              >
                {{ page }}
              </button>
              <span v-else class="px-3 py-2 text-sm text-gray-500">...</span>
            </span>
            
            <button 
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Siguiente →
            </button>
          </nav>
        </div>

        <!-- Empty State -->
        <div v-if="filteredUsers.length === 0" class="text-center py-8 text-gray-500">
          <span class="text-4xl">👤</span>
          <p class="text-lg font-medium mt-2">No se encontraron usuarios</p>
          <p class="text-sm">Intenta ajustar los filtros de búsqueda</p>
        </div>
      </div>
    </div>

    <!-- Create User Modal -->
    <div v-if="showCreateUserModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">Crear Nuevo Usuario</h3>
          
          <form @submit.prevent="createNewUser">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input 
                  v-model="newUser.email" 
                  type="email" 
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="usuario@ejemplo.com"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input 
                  v-model="newUser.displayName" 
                  type="text" 
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre Apellido"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select 
                  v-model="newUser.role" 
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña temporal *</label>
                <input 
                  v-model="newUser.password" 
                  type="password" 
                  required
                  minlength="6"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Mínimo 6 caracteres"
                >
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 mt-6">
              <button 
                type="button"
                @click="showCreateUserModal = false"
                class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                :disabled="creating"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {{ creating ? 'Creando...' : 'Crear Usuario' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSuperusuario } from '../composables/useSuperusuario'

// Composable
const { users, loading, error, loadUsers, createUser, toggleUserStatus } = useSuperusuario()

// State
const searchQuery = ref('')
const roleFilter = ref('')
const currentPage = ref(1)
const pageSize = 10
const showCreateUserModal = ref(false)
const creating = ref(false)

const newUser = ref({
  email: '',
  displayName: '',
  role: '',
  password: ''
})

// Computed
const filteredUsers = computed(() => {
  if (!users.value) return []
  
  return users.value.filter(user => {
    const matchesSearch = !searchQuery.value || 
      user.email?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesRole = !roleFilter.value || user.role === roleFilter.value
    
    return matchesSearch && matchesRole
  })
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredUsers.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

// Methods
const getRoleColor = (role: string) => {
  const colors = {
    'Superusuario': 'bg-purple-100 text-purple-800',
    'Director': 'bg-red-100 text-red-800',
    'Admin': 'bg-orange-100 text-orange-800',
    'Maestro': 'bg-blue-100 text-blue-800',
    'Monitor': 'bg-green-100 text-green-800',
    'Colaborador': 'bg-gray-100 text-gray-800'
  }
  return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

const createNewUser = async () => {
  if (!newUser.value.email || !newUser.value.displayName || !newUser.value.role || !newUser.value.password) {
    alert('Todos los campos son requeridos')
    return
  }
  
  creating.value = true
  try {
    await createUser(newUser.value)
    showCreateUserModal.value = false
    newUser.value = { email: '', displayName: '', role: '', password: '' }
    await loadUsers() // Refresh the list
  } catch (err) {
    console.error('Error creating user:', err)
    alert('Error al crear usuario: ' + (err as Error).message)
  } finally {
    creating.value = false
  }
}

const editUser = (user: any) => {
  console.log('Editando usuario:', user.id)
  // TODO: Implementar modal de edición
}

const changeUserRole = (user: any) => {
  const newRole = prompt(`Cambiar rol de ${user.email} (actual: ${user.role}):`, user.role)
  if (newRole && newRole !== user.role) {
    // TODO: Implementar cambio de rol
    console.log('Cambiando rol:', user.id, newRole)
  }
}

const deleteUser = (user: any) => {
  if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${user.email}?`)) {
    // TODO: Implementar eliminación
    console.log('Eliminando usuario:', user.id)
  }
}

// Lifecycle
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.gestion-usuarios {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}
</style>
