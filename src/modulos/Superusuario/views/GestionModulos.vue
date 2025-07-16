<!-- src/modulos/Superusuario/views/GestionModulos.vue -->
<template>
  <div class="gestion-modulos">
    <!-- Header -->
    <div class="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-lg">
      <h1 class="text-2xl font-bold mb-2">📦 Gestión de Módulos</h1>
      <p class="text-green-100">Controla qué módulos están activos en el sistema</p>
    </div>

    <div class="bg-white rounded-b-lg shadow-lg">
      <!-- Quick Stats -->
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ activeModules }}</div>
            <div class="text-sm text-gray-600">Módulos Activos</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">{{ inactiveModules }}</div>
            <div class="text-sm text-gray-600">Módulos Inactivos</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ totalModules }}</div>
            <div class="text-sm text-gray-600">Total de Módulos</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <div class="flex space-x-4">
            <select v-model="statusFilter" class="px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Todos los estados</option>
              <option value="active">Solo activos</option>
              <option value="inactive">Solo inactivos</option>
            </select>
            <select v-model="categoryFilter" class="px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Todas las categorías</option>
              <option value="core">Core</option>
              <option value="admin">Administrativo</option>
              <option value="academic">Académico</option>
              <option value="tools">Herramientas</option>
            </select>
          </div>
          <div class="flex space-x-2">
            <button
              :disabled="loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              @click="refreshModules"
            >
              🔄 Actualizar
            </button>
            <button
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              @click="showCreateModuleModal = true"
            >
              ➕ Agregar Módulo
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        <span class="ml-2 text-gray-600">Cargando módulos...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6 text-center text-red-600">
        ❌ {{ error }}
        <button class="ml-2 text-blue-600 underline" @click="refreshModules">Reintentar</button>
      </div>

      <!-- Modules List -->
      <div v-else class="p-6">
        <div class="grid gap-6">
          <div
            v-for="module in filteredModules"
            :key="module.id"
            class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <!-- Module Header -->
                <div class="flex items-center space-x-3 mb-3">
                  <div class="text-2xl">{{ module.icon || "📦" }}</div>
                  <div>
                    <h3 class="font-semibold text-gray-900 text-lg">{{ module.name }}</h3>
                    <p class="text-sm text-gray-500">{{ module.description }}</p>
                  </div>
                </div>

                <!-- Module Status -->
                <div class="flex items-center space-x-4 mb-3">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    :class="
                      module.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    "
                  >
                    {{ module.enabled ? "✅ Activo" : "❌ Inactivo" }}
                  </span>
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {{ getCategoryLabel(module.category) }}
                  </span>
                  <span v-if="module.version" class="text-xs text-gray-500">
                    v{{ module.version }}
                  </span>
                </div>

                <!-- Module Info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Rutas disponibles:</h4>
                    <ul class="text-sm text-gray-600 space-y-1">
                      <li v-for="route in module.routes" :key="route" class="flex items-center">
                        <span class="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                        {{ route }}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Roles con acceso:</h4>
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="role in module.allowedRoles"
                        :key="role"
                        class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {{ role }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Dependencies -->
                <div v-if="module.dependencies && module.dependencies.length > 0" class="mb-4">
                  <h4 class="text-sm font-medium text-gray-700 mb-2">Dependencias:</h4>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="dep in module.dependencies"
                      :key="dep"
                      class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                    >
                      {{ dep }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-col space-y-2 ml-4">
                <button
                  :disabled="operationInProgress"
                  class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  :class="
                    module.enabled
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  "
                  @click="toggleModule(module)"
                >
                  {{ module.enabled ? "🔒 Desactivar" : "🔓 Activar" }}
                </button>

                <button
                  class="px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200"
                  @click="configureModule(module)"
                >
                  ⚙️ Configurar
                </button>

                <button
                  class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
                  @click="viewModuleDetails(module)"
                >
                  📋 Detalles
                </button>
              </div>
            </div>

            <!-- Last Modified -->
            <div v-if="module.lastModified" class="mt-4 pt-4 border-t border-gray-200">
              <p class="text-xs text-gray-500">
                Última modificación: {{ formatDate(module.lastModified) }}
                <span v-if="module.modifiedBy"> por {{ module.modifiedBy }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredModules.length === 0" class="text-center py-8 text-gray-500">
          <span class="text-4xl">📦</span>
          <p class="text-lg font-medium mt-2">No se encontraron módulos</p>
          <p class="text-sm">Intenta ajustar los filtros de búsqueda</p>
        </div>
      </div>
    </div>

    <!-- Create Module Modal -->
    <div
      v-if="showCreateModuleModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">Agregar Nuevo Módulo</h3>

          <form @submit.prevent="createNewModule">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Nombre del módulo *</label
                >
                <input
                  v-model="newModule.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: Gestión de Inventarios"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  v-model="newModule.description"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Descripción del módulo..."
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select
                  v-model="newModule.category"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar categoría...</option>
                  <option value="core">Core</option>
                  <option value="admin">Administrativo</option>
                  <option value="academic">Académico</option>
                  <option value="tools">Herramientas</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Icono</label>
                <input
                  v-model="newModule.icon"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder="📦"
                />
              </div>
            </div>

            <div class="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                @click="showCreateModuleModal = false"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="creatingModule"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {{ creatingModule ? "Creando..." : "Crear Módulo" }}
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
import { useSuperusuario } from '../composables/useSuperusuario';

// Composable
const { systemModules, loading, error, loadSystemModules, toggleModule } = useSuperusuario();

// State
const statusFilter = ref('');
const categoryFilter = ref('');
const showCreateModuleModal = ref(false);
const operationInProgress = ref(false);
const creatingModule = ref(false);

const newModule = ref({
  name: '',
  description: '',
  category: '',
  icon: '📦',
});

// Computed
const filteredModules = computed(() => {
  if (!systemModules.value) return [];

  return systemModules.value.filter((module) => {
    const matchesStatus =
      !statusFilter.value ||
      (statusFilter.value === 'active' && module.enabled) ||
      (statusFilter.value === 'inactive' && !module.enabled);

    const matchesCategory = !categoryFilter.value || module.category === categoryFilter.value;

    return matchesStatus && matchesCategory;
  });
});

const activeModules = computed(() => systemModules.value?.filter((m) => m.enabled).length || 0);

const inactiveModules = computed(() => systemModules.value?.filter((m) => !m.enabled).length || 0);

const totalModules = computed(() => systemModules.value?.length || 0);

// Methods
const getCategoryLabel = (category: string) => {
  const labels = {
    core: 'Core',
    admin: 'Administrativo',
    academic: 'Académico',
    tools: 'Herramientas',
  };
  return labels[category as keyof typeof labels] || category;
};

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

const refreshModules = async () => {
  await loadSystemModules();
};

const configureModule = (module: any) => {
  console.log('Configurando módulo:', module.id);
  // TODO: Implementar configuración específica del módulo
  alert(`Configurando módulo: ${module.name}`);
};

const viewModuleDetails = (module: any) => {
  console.log('Viendo detalles del módulo:', module.id);
  // TODO: Implementar modal de detalles
  alert(
    `Detalles del módulo: ${module.name}\n\nEstado: ${module.enabled ? 'Activo' : 'Inactivo'}\nCategoría: ${getCategoryLabel(module.category)}\nRutas: ${module.routes?.join(', ') || 'N/A'}`,
  );
};

const createNewModule = async () => {
  if (!newModule.value.name || !newModule.value.category) {
    alert('Nombre y categoría son requeridos');
    return;
  }

  creatingModule.value = true;
  try {
    // TODO: Implementar creación de módulo
    console.log('Creando módulo:', newModule.value);

    // Simular creación
    await new Promise((resolve) => setTimeout(resolve, 1000));

    showCreateModuleModal.value = false;
    newModule.value = { name: '', description: '', category: '', icon: '📦' };

    alert('Módulo creado exitosamente');
    await refreshModules();
  } catch (err) {
    console.error('Error creating module:', err);
    alert('Error al crear módulo: ' + (err as Error).message);
  } finally {
    creatingModule.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadSystemModules();
});
</script>

<style scoped>
.gestion-modulos {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}
</style>
