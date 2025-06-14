<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <UserPlusIcon class="w-6 h-6 mr-2 text-blue-500" />
            Crear Usuario con Superpoderes
          </h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Crear cualquier tipo de usuario con permisos personalizados
        </p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- User Type Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Tipo de Usuario
          </label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label
              v-for="type in userTypes"
              :key="type.value"
              class="relative flex cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-4 shadow-sm focus:outline-none"
              :class="{ 'ring-2 ring-blue-500 border-blue-500': form.userType === type.value }"
            >
              <input
                type="radio"
                :value="type.value"
                v-model="form.userType"
                class="sr-only"
              />
              <div class="flex items-center space-x-3">
                <component :is="type.icon" class="w-6 h-6 text-blue-500" />
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ type.label }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ type.description }}
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Basic Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              v-model="form.fullName"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Nombre completo del usuario"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              v-model="form.email"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="email@ejemplo.com"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              v-model="form.phone"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="(000) 000-0000"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              v-model="form.status"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="pending">Pendiente</option>
            </select>
          </div>
        </div>

        <!-- Permissions -->
        <div v-if="form.userType" class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Permisos Especiales
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label
              v-for="permission in availablePermissions"
              :key="permission.key"
              class="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <input
                type="checkbox"
                :value="permission.key"
                v-model="form.permissions"
                class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ permission.label }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ permission.description }}
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            @click="$emit('close')"
            class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="!form.fullName || !form.email || !form.userType"
            class="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Crear Usuario
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  XMarkIcon, 
  UserPlusIcon,
  UserIcon,
  AcademicCapIcon,
  CogIcon,
  ShieldCheckIcon
} from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  close: []
  success: [user: any]
}>()

const form = ref({
  userType: '',
  fullName: '',
  email: '',
  phone: '',
  status: 'active',
  permissions: [] as string[]
})

const userTypes = [
  {
    value: 'student',
    label: 'Estudiante',
    description: 'Usuario estudiante',
    icon: UserIcon
  },
  {
    value: 'teacher',
    label: 'Maestro',
    description: 'Usuario maestro',
    icon: AcademicCapIcon
  },
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Usuario administrador',
    icon: ShieldCheckIcon
  }
]

const availablePermissions = [
  {
    key: 'view_all_students',
    label: 'Ver todos los estudiantes',
    description: 'Acceso completo a la lista de estudiantes'
  },
  {
    key: 'manage_teachers',
    label: 'Gestionar maestros',
    description: 'Crear, editar y eliminar maestros'
  },
  {
    key: 'manage_classes',
    label: 'Gestionar clases',
    description: 'Crear, editar y eliminar clases'
  },
  {
    key: 'view_reports',
    label: 'Ver reportes',
    description: 'Acceso a todos los reportes'
  },
  {
    key: 'system_config',
    label: 'Configuración del sistema',
    description: 'Modificar configuraciones del sistema'
  },
  {
    key: 'backup_restore',
    label: 'Respaldos',
    description: 'Crear y restaurar respaldos'
  }
]

const handleSubmit = async () => {
  try {
    const userData = {
      ...form.value,
      createdAt: new Date(),
      createdBy: 'admin' // This should be the current admin user
    }
    
    console.log('Creating user:', userData)
    
    // Here you would call your API to create the user
    // await createUser(userData)
    
    emit('success', userData)
    emit('close')
  } catch (error) {
    console.error('Error creating user:', error)
  }
}
</script>
