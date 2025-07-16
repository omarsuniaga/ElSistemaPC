<!-- src/modulos/Superusuario/views/SuperusuarioDashboardSimple.vue -->
<template>
  <div class="superusuario-dashboard">
    <!-- Header -->
    <div class="dashboard-header mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">👑 Panel de Superusuario</h1>
          <p class="text-gray-600">
            Control total y monitoreo del sistema de gestión educativa musical
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <button :disabled="loading" class="btn-refresh" @click="refreshDashboard">
            <span class="mr-2">🔄</span>
            Actualizar
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions bg-white rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <span class="mr-2">⚡</span>
        Acciones Rápidas
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button class="action-button" @click="navigateToModule('usuarios')">
          <div class="text-2xl mb-2">👥</div>
          <div class="text-sm font-medium">Gestionar Usuarios</div>
        </button>
        <button class="action-button" @click="navigateToModule('roles')">
          <div class="text-2xl mb-2">🛡️</div>
          <div class="text-sm font-medium">Configurar Roles</div>
        </button>
        <button class="action-button" @click="navigateToModule('modulos')">
          <div class="text-2xl mb-2">📦</div>
          <div class="text-sm font-medium">Gestionar Módulos</div>
        </button>
        <button class="action-button" @click="navigateToModule('auditoria')">
          <div class="text-2xl mb-2">📋</div>
          <div class="text-sm font-medium">Ver Auditoría</div>
        </button>
      </div>
    </div>

    <!-- System Status -->
    <div class="system-status bg-white rounded-lg shadow-lg p-6 mb-8">
      <h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <span class="mr-2">📊</span>
        Estado del Sistema
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="stat-card">
          <div class="text-sm text-gray-500">Total Usuarios</div>
          <div class="text-2xl font-bold text-blue-600">{{ stats.totalUsers }}</div>
        </div>
        <div class="stat-card">
          <div class="text-sm text-gray-500">Usuarios Activos</div>
          <div class="text-2xl font-bold text-green-600">{{ stats.activeUsers }}</div>
        </div>
        <div class="stat-card">
          <div class="text-sm text-gray-500">Módulos Activos</div>
          <div class="text-2xl font-bold text-purple-600">{{ stats.activeModules }}</div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="recent-activity bg-white rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <span class="mr-2">📈</span>
        Actividad Reciente
      </h3>
      <div class="space-y-3">
        <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
          <div class="flex items-center space-x-3">
            <div class="activity-icon">{{ activity.icon }}</div>
            <div class="flex-1">
              <div class="text-sm font-medium text-gray-900">{{ activity.description }}</div>
              <div class="text-xs text-gray-500">{{ activity.timestamp }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);

// Estados del dashboard
const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  activeModules: 8,
});

const recentActivities = ref([
  {
    icon: '👤',
    description: 'Nuevo usuario registrado',
    timestamp: 'Hace 5 minutos',
  },
  {
    icon: '🔧',
    description: 'Configuración de roles actualizada',
    timestamp: 'Hace 1 hora',
  },
  {
    icon: '🔄',
    description: 'Respaldo del sistema completado',
    timestamp: 'Hace 2 horas',
  },
]);

// Métodos
const refreshDashboard = async () => {
  loading.value = true;
  try {
    // Simular carga de datos
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Actualizar estadísticas (por ahora datos mock)
    stats.value = {
      totalUsers: Math.floor(Math.random() * 100) + 50,
      activeUsers: Math.floor(Math.random() * 50) + 20,
      activeModules: 8,
    };

    console.log('✅ Dashboard actualizado');
  } catch (error) {
    console.error('❌ Error al actualizar dashboard:', error);
  } finally {
    loading.value = false;
  }
};

const navigateToModule = (module: string) => {
  console.log(`Navegando a módulo: ${module}`);

  switch (module) {
  case 'usuarios':
    router.push('/superusuario/users');
    break;
  case 'roles':
    router.push('/superusuario/roles');
    break;
  case 'modulos':
    router.push('/superusuario/system');
    break;
  case 'auditoria':
    router.push('/superusuario/audit');
    break;
  default:
    console.warn(`Módulo no reconocido: ${module}`);
  }
};

// Inicialización
onMounted(() => {
  refreshDashboard();
});
</script>

<style scoped>
.superusuario-dashboard {
  @apply p-6 max-w-7xl mx-auto;
}

.btn-refresh {
  @apply flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.action-button {
  @apply flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200;
}

.stat-card {
  @apply p-4 bg-gray-50 rounded-lg border border-gray-200;
}

.activity-item {
  @apply p-3 bg-gray-50 rounded-lg border border-gray-200;
}

.activity-icon {
  @apply w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full text-sm;
}
</style>
