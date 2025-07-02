<template>
  <div class="max-w-4xl mx-auto p-6 space-y-6">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Panel de WhatsApp</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Configuración y gestión de comunicaciones WhatsApp de la academia
      </p>
    </div>

    <!-- Estado de Conexión -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Estado de Conexión</h2>
        <div class="flex items-center space-x-2">
          <div
            :class="[
              'w-3 h-3 rounded-full',
              connectionStatus === 'connected'
                ? 'bg-green-500'
                : connectionStatus === 'error'
                  ? 'bg-red-500'
                  : connectionStatus === 'checking'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-gray-400',
            ]"
          />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ statusMessage }}
          </span>
        </div>
      </div>

      <!-- Información detallada -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</p>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ connectionStatus }}</p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Última verificación
          </p>
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ lastHealthCheck ? formatTime(lastHealthCheck) : "Nunca" }}
          </p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mensajes</p>
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ canSendMessages ? "Disponible" : "No disponible" }}
          </p>
        </div>
      </div>

      <!-- Botones de control -->
      <div class="flex flex-wrap gap-2">
        <button
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          :disabled="isInitializing"
          @click="checkStatus"
        >
          🔍 Verificar Estado
        </button>
        <button
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
          :disabled="isInitializing"
          @click="initializeWhatsApp"
        >
          {{ isInitializing ? "🔄 Inicializando..." : "🚀 Inicializar" }}
        </button>
        <button
          class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm"
          :disabled="isInitializing"
          @click="restartWhatsApp"
        >
          🔄 Reiniciar
        </button>
        <button
          class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm"
          :disabled="isLoadingQR"
          @click="refreshQRCode"
        >
          {{ isLoadingQR ? "🔄 Cargando..." : "📱 Cargar QR" }}
        </button>
      </div>
    </div>

    <!-- Código QR -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Código QR de Autenticación
      </h2>

      <div class="flex flex-col items-center space-y-4">
        <div
          class="w-64 h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center"
          :class="{'bg-gray-50 dark:bg-gray-700': !qrCodeDataUrl}"
        >
          <img
            v-if="qrCodeDataUrl"
            :src="qrCodeDataUrl"
            alt="WhatsApp QR Code"
            class="max-w-full max-h-full rounded"
          />
          <div v-else-if="isLoadingQR" class="text-center">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"
            />
            <p class="text-sm text-gray-500 dark:text-gray-400">Cargando QR...</p>
          </div>
          <div v-else class="text-center">
            <p class="text-gray-400 dark:text-gray-500 text-sm">No hay QR disponible</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Haz clic en "Cargar QR" para generar
            </p>
          </div>
        </div>

        <div class="text-center max-w-md">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Escanea este código QR con tu WhatsApp para conectar la cuenta
          </p>
          <ol class="text-xs text-gray-500 dark:text-gray-400 text-left">
            <li>1. Abre WhatsApp en tu teléfono</li>
            <li>2. Ve a Configuración → Dispositivos vinculados</li>
            <li>3. Toca "Vincular un dispositivo"</li>
            <li>4. Escanea este código QR</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- Prueba de Envío -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Prueba de Envío</h2>

      <form class="space-y-4" @submit.prevent="handleSendTest">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              for="testPhone"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Número de teléfono
            </label>
            <input
              id="testPhone"
              v-model="testMessage.phone"
              type="tel"
              placeholder="18091234567"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              :disabled="!canSendMessages"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Formato: sin espacios ni símbolos (ej: 18091234567)
            </p>
          </div>
          <div>
            <label
              for="testMessage"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Mensaje
            </label>
            <textarea
              id="testMessage"
              v-model="testMessage.content"
              rows="3"
              placeholder="Mensaje de prueba..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              :disabled="!canSendMessages"
            />
          </div>
        </div>

        <button
          type="submit"
          class="w-full md:w-auto px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="
            !canSendMessages || isSendingMessage || !testMessage.phone || !testMessage.content
          "
        >
          {{ isSendingMessage ? "📤 Enviando..." : "📤 Enviar Mensaje de Prueba" }}
        </button>
      </form>
    </div>

    <!-- Notificaciones -->
    <div v-if="notifications.length > 0" class="space-y-2">
      <TransitionGroup name="notification" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'p-4 rounded-lg shadow-md border-l-4 flex items-center justify-between',
            notification.type === 'success'
              ? 'bg-green-50 border-green-400 text-green-800'
              : notification.type === 'error'
                ? 'bg-red-50 border-red-400 text-red-800'
                : 'bg-yellow-50 border-yellow-400 text-yellow-800',
          ]"
        >
          <div class="flex items-center">
            <span class="mr-2">
              {{
                notification.type === "success" ? "✅" : notification.type === "error" ? "❌" : "⚠️"
              }}
            </span>
            <span class="text-sm font-medium">{{ notification.message }}</span>
          </div>
          <button
            class="text-gray-400 hover:text-gray-600"
            @click="removeNotification(notification.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>

    <!-- Error Global -->
    <div v-if="lastError" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <span class="text-red-500 mr-2">⚠️</span>
          <div>
            <h3 class="text-sm font-medium text-red-800">Error detectado</h3>
            <p class="text-sm text-red-700 mt-1">{{ lastError }}</p>
          </div>
        </div>
        <button class="text-red-400 hover:text-red-600" @click="clearError">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive} from "vue"
import {useWhatsAppIntegration} from "@/composables/useWhatsAppIntegration"

// Usar el composable de integración
const {
  isInitializing,
  isLoadingQR,
  isSendingMessage,
  isConnected,
  connectionStatus,
  statusMessage,
  lastHealthCheck,
  canSendMessages,
  qrCodeDataUrl,
  lastError,
  notifications,
  checkStatus,
  initializeWhatsApp,
  loadQRCode,
  refreshQRCode,
  sendMessage,
  restartWhatsApp,
  removeNotification,
  clearError,
} = useWhatsAppIntegration()

// Estado local para el formulario de prueba
const testMessage = reactive({
  phone: "",
  content:
    "🎵 Mensaje de prueba desde la Academia Musical!\n\nEste es un mensaje de prueba para verificar que WhatsApp está funcionando correctamente.",
})

// Formatear tiempo para mostrar
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

// Manejar envío de mensaje de prueba
const handleSendTest = async () => {
  if (!testMessage.phone || !testMessage.content) return

  const success = await sendMessage({
    number: testMessage.phone,
    message: testMessage.content,
  })

  if (success) {
    // Limpiar formulario después del envío exitoso
    testMessage.phone = ""
    testMessage.content =
      "🎵 Mensaje de prueba desde la Academia Musical!\n\nEste es un mensaje de prueba para verificar que WhatsApp está funcionando correctamente."
  }
}
</script>

<style scoped>
/* Animaciones para notificaciones */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
