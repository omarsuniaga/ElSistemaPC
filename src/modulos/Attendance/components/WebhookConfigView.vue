<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
    <h2 class="text-xl font-semibold mb-4">Configuración de Webhooks</h2>

    <div
      v-if="!configStore.attendanceWebhookUrl && !configStore.isLoading"
      class="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md"
    >
      <p>
        <i class="fas fa-exclamation-triangle mr-2" /> No hay una URL de webhook configurada para la
        asistencia.
      </p>
    </div>

    <div v-if="!hasPermission" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
      <p>
        <i class="fas fa-lock mr-2" /> No tienes permisos para modificar configuraciones. Contacta
        al administrador.
      </p>
    </div>

    <!-- Formulario de configuración -->
    <form class="space-y-4" @submit.prevent="saveConfig">
      <div class="form-group">
        <label for="webhook-url" class="block text-sm font-medium mb-1"
          >URL del Webhook para Asistencia:</label
        >
        <div class="flex">
          <input
            id="webhook-url"
            v-model="webhookUrl"
            type="text"
            class="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-900"
            placeholder="Ej: https://hook.us2.make.com/tu-webhook-id"
            :disabled="!hasPermission || configStore.isLoading"
          />
          <button
            type="button"
            class="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="!webhookUrl || configStore.isLoading"
            @click="testWebhook"
          >
            <i class="fas fa-sync mr-1" />
            Probar
          </button>
        </div>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Esta URL es donde se enviarán los datos de asistencia para procesamiento externo
          (Make.com).
        </p>
      </div>

      <!-- Estado de la última prueba -->
      <div
        v-if="lastTestResult"
        :class="`p-3 rounded-md ${lastTestResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`"
      >
        <p>
          <i
            :class="`mr-2 ${lastTestResult.success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}`"
          />
          {{ lastTestResult.message }}
        </p>
        <p v-if="lastTestResult.details" class="mt-1 text-xs">{{ lastTestResult.details }}</p>
      </div>

      <!-- Acciones -->
      <div class="flex justify-end">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!hasPermission || configStore.isLoading || !webhookUrl"
        >
          <i class="fas fa-save mr-2" />
          {{ configStore.isLoading ? "Guardando..." : "Guardar Configuración" }}
        </button>
      </div>
    </form>

    <!-- Historial de cambios -->
    <div v-if="configStore.configs.updates && configStore.configs.updates.length" class="mt-6">
      <h3 class="text-lg font-medium mb-2">Historial de cambios</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full table-auto">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-700">
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Fecha
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Usuario
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Cambio
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(update, index) in configStore.configs.updates"
              :key="index"
              class="border-b border-gray-200 dark:border-gray-700"
            >
              <td class="px-4 py-2 text-sm">{{ formatDate(update.timestamp) }}</td>
              <td class="px-4 py-2 text-sm">{{ update.user }}</td>
              <td class="px-4 py-2 text-sm">{{ update.change }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useConfigStore } from '../../../stores/config';
import { useAuthStore } from '../../../stores/auth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { sendToMake } from '../../../utils/webhook';

const configStore = useConfigStore();
const authStore = useAuthStore();

// Estado
const webhookUrl = ref('');
const lastTestResult = ref<{success: boolean; message: string; details?: string} | null>(null);

// Comprobar permisos
const hasPermission = computed(() => {
  if (!authStore.user || !Array.isArray(authStore.user.role)) {
    return false;
  }
  const requiredRoles = ['admin', 'director'];
  return authStore.user.role.some((rol) => requiredRoles.includes(rol));
});

// Formatear fecha para el historial
const formatDate = (timestamp: string): string => {
  if (!timestamp) return '-';
  try {
    // Assuming 'format' and 'es' are correctly imported and typed elsewhere
    return format(new Date(timestamp), 'd MMM yyyy, HH:mm', { locale: es });
  } catch (e) {
    // Return the original timestamp if formatting fails
    return timestamp;
  }
};

// Cargar configuración
onMounted(async () => {
  await configStore.fetchConfigs();
  webhookUrl.value = configStore.attendanceWebhookUrl || '';
});

// Guardar configuración
const saveConfig = async () => {
  if (!webhookUrl.value) return;

  try {
    await configStore.updateAttendanceWebhook(webhookUrl.value);
    lastTestResult.value = {
      success: true,
      message: 'Configuración guardada correctamente',
    };
  } catch (error: any) {
    lastTestResult.value = {
      success: false,
      message: 'Error al guardar la configuración',
      details: error.message,
    };
  }
};

// Probar webhook
const testWebhook = async () => {
  if (!webhookUrl.value) return;

  lastTestResult.value = {
    success: false,
    message: 'Probando conexión...',
  };

  try {
    const testPayload = {
      type: 'test',
      action: 'test_connection',
      data: {
        timestamp: new Date().toISOString(),
        user: authStore.user?.email || 'usuario_anónimo',
        message: 'Esta es una prueba de conexión desde El Sistema PC',
      },
    };

    await sendToMake(webhookUrl.value, testPayload);

    lastTestResult.value = {
      success: true,
      message: 'Conexión exitosa con el webhook',
      details: 'El servidor respondió correctamente a la petición de prueba',
    };
  } catch (error: any) {
    lastTestResult.value = {
      success: false,
      message: 'Error al probar la conexión',
      details: error.message,
    };
  }
};
</script>
