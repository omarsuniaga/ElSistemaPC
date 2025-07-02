<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Panel de WhatsApp</h1>
        <p class="text-gray-600 dark:text-gray-400">
          Gestión de comunicaciones WhatsApp - Academia Musical
        </p>
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

      <!-- Estado de Conexión -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Estado de Conexión</h2>
          <div class="flex items-center space-x-2">
            <div
              :class="[
                'w-3 h-3 rounded-full',
                statusDisplay.color === 'green'
                  ? 'bg-green-500'
                  : statusDisplay.color === 'red'
                    ? 'bg-red-500'
                    : statusDisplay.color === 'yellow'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-gray-400',
              ]"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ statusDisplay.icon }} {{ statusDisplay.message }}
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
              {{ formatTime(lastCheck) }}
            </p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Envío de mensajes
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ isConnected ? "Disponible" : "No disponible" }}
            </p>
          </div>
        </div>

        <!-- Botones de control -->
        <div class="flex flex-wrap gap-2">
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm disabled:opacity-50"
            :disabled="isLoading"
            @click="checkStatus"
          >
            {{ isLoading ? "🔄 Verificando..." : "🔍 Verificar Estado" }}
          </button>
          <button
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm disabled:opacity-50"
            :disabled="isLoading"
            @click="initialize"
          >
            {{ isLoading ? "🔄 Inicializando..." : "🚀 Inicializar" }}
          </button>
          <button
            class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm disabled:opacity-50"
            :disabled="isLoading"
            @click="restart"
          >
            🔄 Reiniciar
          </button>
          <button
            class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm disabled:opacity-50"
            :disabled="isLoading"
            @click="loadQR"
          >
            📱 Cargar QR
          </button>
        </div>
      </div>

      <!-- Código QR -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Código QR de Autenticación
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

      <!-- Prueba de Envío -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Envío de Mensaje de Prueba
        </h2>

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
                v-model="testPhone"
                type="tel"
                placeholder="18091234567"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                :disabled="!isConnected"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sin espacios ni símbolos (ej: 18091234567)
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
                v-model="testMessage"
                rows="3"
                placeholder="Mensaje de prueba..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                :disabled="!isConnected"
              />
            </div>
          </div>

          <button
            type="submit"
            class="w-full md:w-auto px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!isConnected || isLoading || !testPhone || !testMessage"
          >
            {{ isLoading ? "📤 Enviando..." : "📤 Enviar Mensaje de Prueba" }}
          </button>
        </form>

        <!-- Resultado del envío -->
        <div
          v-if="sendResult"
          class="mt-4 p-3 rounded-md"
          :class="sendResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'"
        >
          <p class="text-sm font-medium">
            {{
              sendResult.success ? "✅ Mensaje enviado exitosamente" : "❌ Error al enviar mensaje"
            }}
          </p>
          <p v-if="sendResult.message" class="text-xs mt-1">{{ sendResult.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue"
import {useWhatsApp} from "@/composables/useWhatsApp"

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
  restart,
  clearError,
  formatTime,
} = useWhatsApp()

// Estado local para prueba de envío
const testPhone = ref("")
const testMessage = ref(
  "🎵 Mensaje de prueba desde la Academia Musical!\n\nEste es un mensaje de prueba para verificar que WhatsApp está funcionando correctamente."
)
const sendResult = ref<{success: boolean; message?: string} | null>(null)

// Manejar envío de mensaje de prueba
const handleSendTest = async () => {
  if (!testPhone.value || !testMessage.value) return

  try {
    const success = await sendMessage({
      number: testPhone.value,
      message: testMessage.value,
    })

    sendResult.value = {
      success,
      message: success ? "Mensaje enviado correctamente" : "Error al enviar mensaje",
    }

    if (success) {
      // Limpiar formulario en caso de éxito
      testPhone.value = ""
      testMessage.value =
        "🎵 Mensaje de prueba desde la Academia Musical!\n\nEste es un mensaje de prueba para verificar que WhatsApp está funcionando correctamente."
    }

    // Limpiar resultado después de 5 segundos
    setTimeout(() => {
      sendResult.value = null
    }, 5000)
  } catch (err) {
    sendResult.value = {
      success: false,
      message: err instanceof Error ? err.message : "Error desconocido",
    }

    setTimeout(() => {
      sendResult.value = null
    }, 5000)
  }
}
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
