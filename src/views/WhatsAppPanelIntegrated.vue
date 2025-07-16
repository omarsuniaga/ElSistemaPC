<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Panel de WhatsApp</h1>
        <p class="text-gray-600 dark:text-gray-400">
          Configura y gestiona las notificaciones de WhatsApp para la academia
        </p>
      </div>

      <!-- Estado de conexión principal -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div
              :class="[
                'w-3 h-3 rounded-full mr-3',
                statusDisplay.color === 'green'
                  ? 'bg-green-500'
                  : statusDisplay.color === 'red'
                    ? 'bg-red-500'
                    : statusDisplay.color === 'yellow'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-gray-400',
              ]"
            />
            <div>
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                {{ statusDisplay.message }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ connectionStatus }} - {{ formatTime(lastCheck) }}
              </p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button
              class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              :disabled="isLoading"
              @click="checkStatus"
            >
              {{ isLoading ? "Verificando..." : "Verificar" }}
            </button>
            <button
              v-if="!isConnected"
              class="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
              :disabled="isLoading"
              @click="initialize"
            >
              {{ isLoading ? "Inicializando..." : "Inicializar" }}
            </button>
            <button
              class="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50"
              :disabled="isLoading"
              @click="loadQR"
            >
              Cargar QR
            </button>
          </div>
        </div>
      </div>

      <!-- Error Global -->
      <div v-if="error" class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-red-500 mr-2">⚠️</span>
            <div>
              <h3 class="text-sm font-medium text-red-800">Error</h3>
              <p class="text-sm text-red-700">{{ error }}</p>
            </div>
          </div>
          <button class="text-red-400 hover:text-red-600 text-lg" @click="clearError">✕</button>
        </div>
      </div>

      <!-- Tabs de navegación -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="flex" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                'py-4 px-6 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300',
              ]"
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" class="h-5 w-5 mr-2 inline" />
              {{ tab.name }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Contenido de tabs -->
      <div class="space-y-6">
        <!-- Tab: Conexión QR -->
        <div v-if="activeTab === 'qr'" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Código QR de WhatsApp
          </h2>

          <div class="flex flex-col items-center space-y-4">
            <div
              class="w-64 h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700"
            >
              <img
                v-if="qrCodeUrl"
                :src="qrCodeUrl"
                alt="WhatsApp QR Code"
                class="max-w-full max-h-full rounded"
              />
              <div v-else-if="isLoading" class="text-center">
                <div
                  class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"
                />
                <p class="text-sm text-gray-500 dark:text-gray-400">Cargando QR...</p>
              </div>
              <div v-else class="text-center">
                <p class="text-gray-400 dark:text-gray-500 text-sm mb-2">📱 QR no disponible</p>
                <button class="text-xs text-blue-500 hover:text-blue-600" @click="loadQR">
                  Hacer clic para cargar
                </button>
              </div>
            </div>

            <div class="text-center max-w-md">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Escanea este código QR con tu WhatsApp para conectar la cuenta
              </p>
              <ol class="text-xs text-gray-500 dark:text-gray-400 text-left space-y-1">
                <li>1. Abre WhatsApp en tu teléfono</li>
                <li>2. Ve a Configuración → Dispositivos vinculados</li>
                <li>3. Toca "Vincular un dispositivo"</li>
                <li>4. Escanea este código QR</li>
              </ol>
            </div>
          </div>
        </div>

        <!-- Tab: Configuración -->
        <div v-if="activeTab === 'config'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Configuración de WhatsApp
          </h2>

          <div class="space-y-6">
            <!-- Configuración de notificaciones -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipos de notificaciones
              </label>
              <div class="space-y-2">
                <label class="inline-flex items-center">
                  <input
                    v-model="notifications.newStudent"
                    type="checkbox"
                    class="form-checkbox h-4 w-4 text-green-600 transition duration-150 ease-in-out"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >Nuevos estudiantes</span
                  >
                </label>
                <label class="inline-flex items-center">
                  <input
                    v-model="notifications.classReminder"
                    type="checkbox"
                    class="form-checkbox h-4 w-4 text-green-600 transition duration-150 ease-in-out"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >Recordatorios de clase</span
                  >
                </label>
                <label class="inline-flex items-center">
                  <input
                    v-model="notifications.payment"
                    type="checkbox"
                    class="form-checkbox h-4 w-4 text-green-600 transition duration-150 ease-in-out"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >Recordatorios de pago</span
                  >
                </label>
              </div>
            </div>

            <!-- Horarios de envío -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Horarios de envío
              </label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1"
                    >Recordatorios de clase</label
                  >
                  <input
                    v-model="schedules.classReminder"
                    type="time"
                    class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1"
                    >Recordatorios de pago</label
                  >
                  <input
                    v-model="schedules.paymentReminder"
                    type="time"
                    class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <!-- Botón guardar -->
            <div>
              <button
                :disabled="saving"
                class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                @click="saveConfig"
              >
                {{ saving ? "Guardando..." : "Guardar Configuración" }}
              </button>
            </div>
          </div>
        </div>

        <!-- Tab: Prueba -->
        <div v-if="activeTab === 'test'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Enviar Mensaje de Prueba
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de teléfono (con código de país)
              </label>
              <input
                v-model="testMessage.phone"
                type="tel"
                placeholder="18091234567"
                class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                :disabled="!isConnected"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sin espacios ni símbolos (ej: 18091234567)
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mensaje
              </label>
              <textarea
                v-model="testMessage.content"
                rows="4"
                placeholder="Escribe tu mensaje de prueba aquí..."
                class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                :disabled="!isConnected"
              />
            </div>

            <div>
              <button
                :disabled="
                  !testMessage.phone || !testMessage.content || !isConnected || sendingTest
                "
                class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                @click="sendTestMessage"
              >
                {{ sendingTest ? "Enviando..." : "Enviar Mensaje" }}
              </button>
            </div>

            <!-- Resultado del envío -->
            <div
              v-if="sendResult"
              class="mt-4 p-3 rounded-md"
              :class="sendResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'"
            >
              <p class="text-sm font-medium">
                {{
                  sendResult.success
                    ? "✅ Mensaje enviado exitosamente"
                    : "❌ Error al enviar mensaje"
                }}
              </p>
              <p v-if="sendResult.message" class="text-xs mt-1">{{ sendResult.message }}</p>
            </div>
          </div>
        </div>

        <!-- Tab: Historial -->
        <div v-if="activeTab === 'history'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Historial de Mensajes
          </h2>

          <div class="space-y-4">
            <div
              v-if="messages.length === 0"
              class="text-center py-8 text-gray-500 dark:text-gray-400"
            >
              No hay mensajes enviados aún
            </div>

            <div
              v-for="message in messages"
              :key="message.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div class="flex justify-between items-start mb-2">
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{
                    message.recipient
                  }}</span>
                  <span
                    :class="[
                      'px-2 py-1 text-xs rounded-full',
                      message.status === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800',
                    ]"
                  >
                    {{ message.status === "sent" ? "Enviado" : "Error" }}
                  </span>
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{
                  formatDate(message.timestamp)
                }}</span>
              </div>
              <p class="text-sm text-gray-700 dark:text-gray-300">{{ message.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { QrCodeIcon, CogIcon, ClockIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline';
import { useWhatsApp } from '@/composables/useWhatsApp';

// Usar el composable de WhatsApp
const {
  isLoading,
  error,
  qrCodeUrl,
  isConnected,
  connectionStatus,
  statusDisplay,
  lastCheck,
  checkStatus,
  initialize,
  loadQR,
  sendMessage,
  clearError,
  formatTime,
} = useWhatsApp();

// Estado de las tabs
const activeTab = ref('qr');

const tabs = [
  { id: 'qr', name: 'Conexión QR', icon: QrCodeIcon },
  { id: 'config', name: 'Configuración', icon: CogIcon },
  { id: 'history', name: 'Historial', icon: ClockIcon },
  { id: 'test', name: 'Prueba', icon: PaperAirplaneIcon },
];

// Estado de configuración
const notifications = reactive({
  newStudent: true,
  classReminder: true,
  payment: true,
});

const schedules = reactive({
  classReminder: '09:00',
  paymentReminder: '18:00',
});

const saving = ref(false);

// Estado de historial de mensajes
const messages = ref([
  {
    id: 1,
    recipient: '18091234567',
    content: 'Recordatorio: Tienes clase de piano mañana a las 3:00 PM',
    status: 'sent',
    timestamp: new Date(Date.now() - 86400000), // Ayer
  },
  {
    id: 2,
    recipient: '18099876543',
    content: 'Bienvenido a la Academia Musical! Tu primera clase será el lunes.',
    status: 'sent',
    timestamp: new Date(Date.now() - 172800000), // Hace 2 días
  },
]);

// Estado de mensaje de prueba
const testMessage = reactive({
  phone: '',
  content:
    '🎵 Mensaje de prueba desde la Academia Musical!\n\nEste es un mensaje de prueba para verificar que WhatsApp está funcionando correctamente.',
});

const sendingTest = ref(false);
const sendResult = ref<{success: boolean; message?: string} | null>(null);

// Métodos
const saveConfig = async () => {
  saving.value = true;

  try {
    // Simular guardado de configuración
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Aquí guardarías la configuración en Firestore o tu backend
    console.log('Configuración guardada:', { notifications, schedules });

    alert('✅ Configuración guardada correctamente');
  } catch (error) {
    console.error('Error guardando configuración:', error);
    alert('❌ Error al guardar la configuración');
  } finally {
    saving.value = false;
  }
};

const sendTestMessage = async () => {
  if (!testMessage.phone || !testMessage.content || !isConnected.value) return;

  sendingTest.value = true;

  try {
    const success = await sendMessage({
      number: testMessage.phone,
      message: testMessage.content,
    });

    sendResult.value = {
      success,
      message: success ? 'Mensaje enviado correctamente' : 'Error al enviar mensaje',
    };

    if (success) {
      // Agregar al historial
      messages.value.unshift({
        id: Date.now(),
        recipient: testMessage.phone,
        content: testMessage.content,
        status: 'sent',
        timestamp: new Date(),
      });

      // Limpiar formulario
      testMessage.phone = '';
      testMessage.content =
        '🎵 Mensaje de prueba desde la Academia Musical!\n\nEste es un mensaje de prueba para verificar que WhatsApp está funcionando correctamente.';
    }

    // Limpiar resultado después de 5 segundos
    setTimeout(() => {
      sendResult.value = null;
    }, 5000);
  } catch (error) {
    sendResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };

    setTimeout(() => {
      sendResult.value = null;
    }, 5000);
  } finally {
    sendingTest.value = false;
  }
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Inicialización
onMounted(() => {
  checkStatus();
});
</script>

<style scoped>
.form-checkbox {
  @apply rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring focus:ring-green-500 focus:ring-opacity-50;
}
</style>
