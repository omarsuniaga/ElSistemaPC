<!-- src/modulos/Superusuario/components/PermissionModal.vue -->

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
      <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
        <h2 class="text-xl font-bold">
          {{ isEdit ? '✏️ Editar Permiso' : '➕ Crear Nuevo Permiso' }}
        </h2>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Permiso *
          </label>
          <input
            v-model="formData.name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Ej: Ver Asistencia"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            v-model="formData.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Descripción de qué permite hacer este permiso"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Módulo *
            </label>
            <select
              v-model="formData.module"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Seleccionar módulo</option>
              <option value="attendance">Asistencia</option>
              <option value="classes">Clases</option>
              <option value="students">Estudiantes</option>
              <option value="teachers">Maestros</option>
              <option value="dashboard">Dashboard</option>
              <option value="system">Sistema</option>
              <option value="reports">Reportes</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Acción *
            </label>
            <select
              v-model="formData.action"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Seleccionar acción</option>
              <option value="read">Leer/Ver</option>
              <option value="create">Crear</option>
              <option value="update">Actualizar</option>
              <option value="delete">Eliminar</option>
              <option value="write">Escribir</option>
              <option value="admin">Administrar</option>
              <option value="execute">Ejecutar</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Recurso *
          </label>
          <input
            v-model="formData.resource"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Ej: attendance_records, classes, students"
          >
        </div>

        <!-- Acciones -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {{ loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRBACManagement, type Permission } from '@/composables/useRBACManagement'

interface Props {
  isOpen: boolean
  permission?: Permission | null
}

interface Emits {
  (e: 'close'): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { createPermission, updatePermission, loading } = useRBACManagement()

const formData = ref({
  name: '',
  description: '',
  module: '',
  action: '',
  resource: ''
})

const isEdit = computed(() => !!props.permission)

// Resetear formulario cuando se abre/cierra el modal
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    console.log('🔄 PermissionModal - Modal abierto:', {
      isEdit: isEdit.value,
      permission: props.permission
    })
    
    if (props.permission) {
      // Modo edición
      console.log('🔄 PermissionModal - Inicializando en modo edición con permiso:', props.permission)
      formData.value = {
        name: props.permission.name,
        description: props.permission.description,
        module: props.permission.module,
        action: props.permission.action,
        resource: props.permission.resource
      }
    } else {
      // Modo creación
      console.log('🔄 PermissionModal - Inicializando en modo creación')
      formData.value = {
        name: '',
        description: '',
        module: '',
        action: '',
        resource: ''
      }
    }
    
    console.log('🔄 PermissionModal - FormData inicializado:', formData.value)
  }
})

const handleSubmit = async () => {
  try {
    console.log('🔄 PermissionModal - handleSubmit:', {
      isEdit: isEdit.value,
      permission: props.permission,
      formData: formData.value
    })
    
    if (isEdit.value && props.permission) {
      console.log('🔄 Modo edición - llamando updatePermission con ID:', props.permission.id)
      await updatePermission(props.permission.id, formData.value)
    } else {
      console.log('🔄 Modo creación - llamando createPermission')
      await createPermission(formData.value)
    }
    
    emit('saved')
    emit('close')
  } catch (error) {
    console.error('Error al guardar permiso:', error)
    alert('Error al guardar el permiso. Por favor, inténtalo de nuevo.')
  }
}
</script>
