<!-- src/modulos/Superusuario/components/RoleModal.vue -->

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
        <h2 class="text-xl font-bold">
          {{ isEdit ? "✏️ Editar Rol" : "➕ Crear Nuevo Rol" }}
        </h2>
      </div>

      <form class="p-6 space-y-6" @submit.prevent="handleSubmit">
        <!-- Información básica del rol -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Nombre del Rol * </label>
            <input
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ej: Maestro"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Estado </label>
            <select
              v-model="formData.isActive"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option :value="true">Activo</option>
              <option :value="false">Inactivo</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Descripción </label>
          <textarea
            v-model="formData.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Descripción del rol y sus responsabilidades"
          />
        </div>
        <!-- Selección de permisos -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-4"> Permisos Asignados </label>

          <div v-if="permissions.length === 0" class="text-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto" />
            <p class="text-sm text-gray-500 mt-2">Cargando permisos...</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="(modulePermissions, moduleName) in groupedPermissions" :key="moduleName">
              <div class="bg-gray-50 px-4 py-2 rounded-md">
                <h4 class="font-medium text-gray-800 capitalize">{{ moduleName }}</h4>
              </div>

              <div class="pl-4 py-2 space-y-2">
                <label
                  v-for="permission in modulePermissions"
                  :key="permission.id"
                  class="flex items-center space-x-3 text-sm"
                >
                  <input
                    v-model="formData.permissions"
                    type="checkbox"
                    :value="permission.name"
                    class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span class="font-medium">{{ permission.name }}</span>
                  <span class="text-gray-500">- {{ permission.description }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            @click="$emit('close')"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {{ loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRBACManagement, type Role } from '../../../composables/useRBACManagement';

interface Props {
  isOpen: boolean
  role?: Role | null
}

interface Emits {
  (e: 'close'): void
  (e: 'saved'): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { permissions, createRole, updateRole, loading, getPermissionsByModule, initialize } =
  useRBACManagement();

const formData = ref({
  name: '',
  description: '',
  permissions: [] as string[],
  isActive: true,
});

const isEdit = computed(() => !!props.role);

const groupedPermissions = computed(() => getPermissionsByModule.value);

// Resetear formulario cuando se abre/cierra el modal
watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal) {
      // Asegurar que los permisos estén cargados
      if (permissions.value.length === 0) {
        await initialize();
      }

      if (props.role) {
        // Modo edición
        formData.value = {
          name: props.role.name,
          description: props.role.description,
          permissions: [...props.role.permissions],
          isActive: props.role.isActive,
        };
      } else {
        // Modo creación
        formData.value = {
          name: '',
          description: '',
          permissions: [],
          isActive: true,
        };
      }
    }
  },
);

const handleSubmit = async () => {
  try {
    if (isEdit.value && props.role) {
      await updateRole(props.role.id, formData.value);
    } else {
      await createRole(formData.value);
    }

    emit('saved');
    emit('close');
  } catch (error) {
    console.error('Error al guardar rol:', error);
    alert('Error al guardar el rol. Por favor, inténtalo de nuevo.');
  }
};
</script>
