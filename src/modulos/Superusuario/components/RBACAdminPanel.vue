<!-- Componente mejorado para gestión RBAC desde superusuario -->
<template>
  <div class="rbac-admin-panel">
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
      <h1 class="text-2xl font-bold mb-2">🔧 Panel de Administración RBAC</h1>
      <p class="text-purple-100">Gestión completa de roles, permisos y navegación</p>
    </div>

    <div class="bg-white rounded-b-lg shadow-lg">
      <!-- Estado del Sistema -->
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-semibold">📊 Estado del Sistema</h2>
          <button
            :disabled="loading"
            class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            @click="refreshStatus"
          >
            🔄 Actualizar
          </button>
        </div>

        <div v-if="systemStatus" class="grid grid-cols-3 gap-4">
          <div class="text-center p-3 bg-purple-100 rounded">
            <div class="text-2xl font-bold text-purple-600">{{ systemStatus.roles.count }}</div>
            <div class="text-sm text-gray-600">Roles</div>
            <div class="text-xs text-gray-500 mt-1">
              {{ systemStatus.roles.exists ? "✅ Conectado" : "❌ No conectado" }}
            </div>
          </div>
          <div class="text-center p-3 bg-green-100 rounded">
            <div class="text-2xl font-bold text-green-600">
              {{ systemStatus.permissions.count }}
            </div>
            <div class="text-sm text-gray-600">Permisos</div>
            <div class="text-xs text-gray-500 mt-1">
              {{ systemStatus.permissions.exists ? "✅ Conectado" : "❌ No conectado" }}
            </div>
          </div>
          <div class="text-center p-3 bg-blue-100 rounded">
            <div class="text-2xl font-bold text-blue-600">{{ systemStatus.navigation.count }}</div>
            <div class="text-sm text-gray-600">Navegación</div>
            <div class="text-xs text-gray-500 mt-1">
              {{ systemStatus.navigation.exists ? "✅ Conectado" : "❌ No conectado" }}
            </div>
          </div>
        </div>
      </div>

      <!-- Herramientas de Administración -->
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Gestión de Colecciones -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">🗄️ Gestión de Colecciones Firestore</h3>

            <div class="space-y-3">
              <button
                :disabled="loading"
                class="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-left"
                @click="initializeCollections"
              >
                <div class="font-semibold">🚀 Inicializar Colecciones</div>
                <div class="text-sm text-green-100">Crear colecciones RBAC si no existen</div>
              </button>

              <button
                :disabled="loading"
                class="w-full px-4 py-3 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 text-left"
                @click="forceReinitialize"
              >
                <div class="font-semibold">⚡ Forzar Reinicialización</div>
                <div class="text-sm text-orange-100">
                  Sobrescribir con configuración por defecto
                </div>
              </button>
              <button
                :disabled="loading"
                class="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-left"
                @click="testConnection"
              >
                <div class="font-semibold">🧪 Probar Conexión</div>
                <div class="text-sm text-blue-100">Verificar comunicación con Firestore</div>
              </button>

              <button
                :disabled="loading"
                class="w-full px-4 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-left"
                @click="runDiagnostics"
              >
                <div class="font-semibold">🔍 Ejecutar Diagnóstico</div>
                <div class="text-sm text-indigo-100">Mostrar información detallada del sistema</div>
              </button>
            </div>
          </div>

          <!-- Configuración de Maestros -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">👨‍🏫 Configuración de Maestros</h3>

            <div class="space-y-3">
              <div class="p-4 border border-gray-200 rounded-lg">
                <h4 class="font-semibold mb-2">Acceso a Estudiantes</h4>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input
                      v-model="teacherStudentAccess.allStudents"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      @change="updateTeacherStudentAccess"
                    />
                    <span class="ml-2 text-sm">Maestros pueden ver todos los estudiantes</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      v-model="teacherStudentAccess.studentMenu"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      @change="updateNavigationAccess"
                    />
                    <span class="ml-2 text-sm">Mostrar menú "Estudiantes" a maestros</span>
                  </label>
                </div>
              </div>

              <button
                :disabled="loading"
                class="w-full px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-left"
                @click="enableStudentAccessForTeachers"
              >
                <div class="font-semibold">🎓 Habilitar Acceso Total a Estudiantes</div>
                <div class="text-sm text-purple-100">
                  Configurar maestros para ver todos los estudiantes
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Logs de Actividad -->
        <div v-if="activityLogs.length > 0" class="mt-8">
          <h3 class="text-lg font-semibold mb-4">📝 Registro de Actividad</h3>
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="(log, index) in activityLogs"
                :key="index"
                :class="[
                  'p-2 rounded text-sm flex justify-between items-start',
                  log.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : log.type === 'error'
                      ? 'bg-red-100 text-red-800'
                      : log.type === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800',
                ]"
              >
                <div>
                  <div class="font-medium">{{ log.message }}</div>
                  <div v-if="log.details" class="text-xs mt-1 opacity-75">{{ log.details }}</div>
                </div>
                <span class="text-xs opacity-60">{{ log.timestamp }}</span>
              </div>
            </div>
            <button
              class="mt-3 px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              @click="clearLogs"
            >
              🧹 Limpiar Logs
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="loading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"
          />
          <div class="text-lg font-semibold">{{ loadingMessage }}</div>
          <div class="text-sm text-gray-600 mt-2">Por favor espere...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRBACManagement } from '../../../composables/useRBACManagement';
import { useAuthStore } from '../../../stores/auth';

// Importar funciones de inicialización
import {
  initializeRBACCollections,
  checkRBACCollections,
  forceReinitializeRBACCollections,
} from '../../../scripts/initialize-rbac-firestore';

const rbacManagement = useRBACManagement();
const authStore = useAuthStore();

// State
const loading = ref(false);
const loadingMessage = ref('');
const systemStatus = ref(null);
const activityLogs = ref([]);

// Teacher configuration
const teacherStudentAccess = ref({
  allStudents: false,
  studentMenu: true,
});

// Methods
const addLog = (
  message: string,
  type: 'info' | 'success' | 'error' | 'warning' = 'info',
  details?: string,
) => {
  activityLogs.value.unshift({
    message,
    type,
    details,
    timestamp: new Date().toLocaleTimeString(),
  });

  // Limit logs to 50 entries
  if (activityLogs.value.length > 50) {
    activityLogs.value = activityLogs.value.slice(0, 50);
  }
};

const clearLogs = () => {
  activityLogs.value = [];
};

const refreshStatus = async () => {
  try {
    loading.value = true;
    loadingMessage.value = 'Verificando estado del sistema...';

    const status = await checkRBACCollections();
    systemStatus.value = status;

    addLog('Estado del sistema actualizado', 'success');
  } catch (error) {
    console.error('Error refreshing status:', error);
    addLog('Error al actualizar estado del sistema', 'error', error.message);
  } finally {
    loading.value = false;
  }
};

const initializeCollections = async () => {
  try {
    loading.value = true;
    loadingMessage.value = 'Inicializando colecciones RBAC...';

    await initializeRBACCollections();
    await refreshStatus();

    addLog('Colecciones RBAC inicializadas correctamente', 'success');
  } catch (error) {
    console.error('Error initializing collections:', error);
    addLog('Error al inicializar colecciones', 'error', error.message);
  } finally {
    loading.value = false;
  }
};

const forceReinitialize = async () => {
  if (!confirm('⚠️ Esto sobrescribirá toda la configuración RBAC existente. ¿Continuar?')) {
    return;
  }

  try {
    loading.value = true;
    loadingMessage.value = 'Forzando reinicialización...';

    await forceReinitializeRBACCollections();
    await refreshStatus();

    addLog(
      'Reinicialización forzada completada',
      'warning',
      'Toda la configuración anterior fue sobrescrita',
    );
  } catch (error) {
    console.error('Error force reinitializing:', error);
    addLog('Error en reinicialización forzada', 'error', error.message);
  } finally {
    loading.value = false;
  }
};

const testConnection = async () => {
  try {
    loading.value = true;
    loadingMessage.value = 'Probando conexión con Firestore...';

    // Test read operations
    await rbacManagement.loadRoles();
    await rbacManagement.loadPermissions();
    await rbacManagement.loadNavigationConfig();

    addLog(
      'Conexión con Firestore exitosa',
      'success',
      'Lectura de roles, permisos y navegación completada',
    );
  } catch (error) {
    console.error('Error testing connection:', error);
    addLog('Error de conexión con Firestore', 'error', error.message);
  } finally {
    loading.value = false;
  }
};

const runDiagnostics = async () => {
  try {
    loading.value = true;
    loadingMessage.value = 'Ejecutando diagnóstico del sistema...';

    // Cargar datos si no están cargados
    await rbacManagement.loadRoles();
    await rbacManagement.loadPermissions();
    await rbacManagement.loadNavigationConfig();

    // Ejecutar diagnóstico de permisos
    const permissionsDiag = rbacManagement.debugPermissions();

    addLog(
      'Diagnóstico ejecutado',
      'info',
      `Roles: ${rbacManagement.roles.value.length}, ` +
        `Permisos: ${permissionsDiag.totalPermissions}, ` +
        `Navegación: ${rbacManagement.navigationConfig.value.length}`,
    );

    console.log('=== DIAGNÓSTICO COMPLETO RBAC ===');
    console.log('Roles:', rbacManagement.roles.value);
    console.log('Permisos:', rbacManagement.permissions.value);
    console.log('Navegación:', rbacManagement.navigationConfig.value);
    console.log('=== FIN DIAGNÓSTICO ===');
  } catch (error) {
    console.error('Error running diagnostics:', error);
    addLog('Error ejecutando diagnóstico', 'error', error.message);
  } finally {
    loading.value = false;
  }
};

const updateTeacherStudentAccess = async () => {
  try {
    loading.value = true;
    loadingMessage.value = 'Actualizando permisos de maestros...';

    // Update teacher permissions for student access
    await rbacManagement.updateTeacherStudentViewPermission(
      'maestro',
      teacherStudentAccess.value.allStudents,
    );

    addLog(
      `Acceso de maestros a estudiantes: ${teacherStudentAccess.value.allStudents ? 'Habilitado' : 'Limitado'}`,
      'success',
    );
  } catch (error) {
    console.error('Error updating teacher access:', error);
    addLog('Error al actualizar permisos de maestros', 'error', error.message);
  } finally {
    loading.value = false;
  }
};

const updateNavigationAccess = async () => {
  try {
    loading.value = true;
    loadingMessage.value = 'Actualizando navegación...';

    // Update navigation for student menu visibility
    const navigationUpdates = [
      {
        id: 'estudiantes-maestro',
        isActive: teacherStudentAccess.value.studentMenu,
        roles: teacherStudentAccess.value.studentMenu
          ? ['Maestro', 'Maestro Avanzado']
          : ['Maestro Avanzado'],
      },
    ];

    await rbacManagement.updateNavigationForRole(
      'Maestro',
      navigationUpdates,
      authStore.user?.uid || 'system',
    );

    addLog(
      `Menú estudiantes para maestros: ${teacherStudentAccess.value.studentMenu ? 'Visible' : 'Oculto'}`,
      'success',
    );
  } catch (error) {
    console.error('Error updating navigation:', error);
    addLog('Error al actualizar navegación', 'error', error.message);
  } finally {
    loading.value = false;
  }
};

const enableStudentAccessForTeachers = async () => {
  try {
    loading.value = true;
    loadingMessage.value = 'Configurando acceso total a estudiantes...';

    // Enable both student access and menu visibility
    teacherStudentAccess.value.allStudents = true;
    teacherStudentAccess.value.studentMenu = true;

    await updateTeacherStudentAccess();
    await updateNavigationAccess();

    addLog('Acceso total a estudiantes habilitado para maestros', 'success');
  } catch (error) {
    console.error('Error enabling student access:', error);
    addLog('Error al habilitar acceso a estudiantes', 'error', error.message);
  } finally {
    loading.value = false;
  }
};

// Initialize component
onMounted(async () => {
  await refreshStatus();
  addLog('Panel de administración RBAC cargado', 'info');
});
</script>

<style scoped>
.rbac-admin-panel {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
