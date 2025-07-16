<template>
  <div class="whatsapp-qr-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <PhoneIcon class="h-8 w-8 text-green-500" />
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp QR</h2>
      </div>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Sincroniza WhatsApp para enviar notificaciones a estudiantes y padres
      </p>
    </div>

    <!-- Status Badge -->
    <div class="status-container">
      <div
        :class="[
          'status-badge',
          {
            'status-connected': connectionStatus === 'connected',
            'status-waiting': connectionStatus === 'waiting_for_qr',
            'status-error': connectionStatus === 'logged_out' || connectionStatus === 'error',
            'status-loading': connectionStatus === 'reconnecting',
          },
        ]"
      >
        <component :is="statusIcon" class="h-5 w-5" />
        <span>{{ statusText }}</span>
        <div v-if="connectionStatus === 'reconnecting'" class="loader ml-2" />
      </div>
    </div>

    <!-- QR Code Container -->
    <div class="qr-container">
      <div v-if="loading" class="qr-loading">
        <div class="loader-large" />
        <p class="text-gray-600 dark:text-gray-400 mt-4">{{ loadingText }}</p>
      </div>

      <div v-else-if="qrImageUrl" class="qr-success">
        <img :src="qrImageUrl" alt="WhatsApp QR Code" class="qr-image" />
        <p class="qr-instruction">Escanea este código QR con WhatsApp en tu teléfono</p>

        <!-- Pasos después del escaneo -->
        <div class="post-scan-steps">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Después de escanear:
          </h4>
          <ol class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>1. Tu teléfono mostrará "Vinculando dispositivo..."</li>
            <li>2. Toca <strong>"Vincular dispositivo"</strong> para confirmar</li>
            <li>3. Espera a que aparezca "✅ Conectado" aquí</li>
          </ol>
        </div>

        <!-- Estado de escaneo -->
        <div class="scan-status mt-4">
          <div class="flex items-center justify-center space-x-2">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Esperando confirmación en tu teléfono...
            </span>
          </div>
        </div>
      </div>

      <div v-else-if="connectionStatus === 'connected'" class="qr-connected">
        <CheckCircleIcon class="h-20 w-20 text-green-500 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">
          ¡WhatsApp Conectado!
        </h3>
        <p class="text-gray-600 dark:text-gray-400">Ya puedes enviar notificaciones por WhatsApp</p>
      </div>

      <div v-else class="qr-message">
        <component :is="messageIcon" class="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <p class="text-gray-600 dark:text-gray-400">{{ messageText }}</p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button :disabled="loading" class="btn btn-primary" @click="refreshQR">
        <ArrowPathIcon class="h-4 w-4 mr-2" />
        {{ loading ? "Cargando..." : "Actualizar QR" }}
      </button>

      <button :disabled="loading" class="btn btn-success" @click="checkStatus">
        <SignalIcon class="h-4 w-4 mr-2" />
        ¿Ya se conectó?
      </button>

      <button :disabled="loading" class="btn btn-warning" @click="testDirectConnection">
        <BeakerIcon class="h-4 w-4 mr-2" />
        {{ testingConnection ? "Probando..." : "Probar Conexión Directa" }}
      </button>

      <button
        v-if="connectionStatus === 'connected'"
        :disabled="sendingTest"
        class="btn btn-success"
        @click="testMessage"
      >
        <ChatBubbleLeftIcon class="h-4 w-4 mr-2" />
        {{ sendingTest ? "Enviando..." : "Enviar Prueba" }}
      </button>
    </div>

    <!-- Instructions -->
    <div class="instructions">
      <h4 class="instructions-title">
        <InformationCircleIcon class="h-5 w-5" />
        Guía completa para vincular WhatsApp
      </h4>
      <ol class="instructions-list">
        <li>Abre WhatsApp en tu teléfono móvil</li>
        <li>Ve a <strong>Configuración</strong> → <strong>Dispositivos vinculados</strong></li>
        <li>Toca <strong>"Vincular un dispositivo"</strong></li>
        <li>Escanea el código QR que aparece arriba</li>
        <li>
          <strong>IMPORTANTE:</strong> Después del escaneo, tu teléfono mostrará "Vinculando
          dispositivo..."
        </li>
        <li><strong>Toca "Vincular dispositivo"</strong> para confirmar la conexión</li>
        <li>Espera a que aparezca "✅ Conectado" en esta pantalla</li>
      </ol>

      <!-- Troubleshooting -->
      <div class="troubleshooting mt-4">
        <h5 class="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">
          ⚠️ ¿No funciona? Prueba esto:
        </h5>
        <ul class="text-xs text-amber-600 dark:text-amber-400 space-y-1">
          <li>• Asegúrate de tener internet en tu teléfono</li>
          <li>• Usa WhatsApp actualizado (versión más reciente)</li>
          <li>• Si no pasa nada después del escaneo, toca "Actualizar QR"</li>
          <li>• Verifica que hayas confirmado en tu teléfono</li>
        </ul>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-container">
      <ExclamationTriangleIcon class="h-5 w-5" />
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  PhoneIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  SignalIcon,
  ChatBubbleLeftIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  BeakerIcon,
} from '@heroicons/vue/24/outline';

// Estado reactivo
const loading = ref(true);
const connectionStatus = ref<string>('waiting_for_qr');
const qrImageUrl = ref<string | null>(null);
const error = ref<string | null>(null);
const sendingTest = ref(false);
const testingConnection = ref(false);
const loadingText = ref('Inicializando conexión...');
const isWaitingForScan = ref(false);

// Configuración de la API
const API_BASE_URL = 'https://whatsappapi-4ffilcsmva-uc.a.run.app';

// Intervalo para verificar estado
let statusInterval: NodeJS.Timeout | null = null;
let fastStatusInterval: NodeJS.Timeout | null = null;

// Computed properties
const statusText = computed(() => {
  switch (connectionStatus.value) {
  case 'connected':
    return 'Conectado';
  case 'waiting_for_qr':
    return 'Esperando escaneo';
  case 'logged_out':
    return 'Sesión cerrada';
  case 'reconnecting':
    return 'Reconectando...';
  case 'error':
    return 'Error de conexión';
  default:
    return 'Desconectado';
  }
});

const statusIcon = computed(() => {
  switch (connectionStatus.value) {
  case 'connected':
    return CheckCircleIcon;
  case 'waiting_for_qr':
    return ClockIcon;
  case 'logged_out':
    return XCircleIcon;
  case 'reconnecting':
    return ArrowPathIcon;
  case 'error':
    return ExclamationTriangleIcon;
  default:
    return QuestionMarkCircleIcon;
  }
});

const messageIcon = computed(() => {
  switch (connectionStatus.value) {
  case 'logged_out':
    return XCircleIcon;
  case 'error':
    return ExclamationTriangleIcon;
  default:
    return ClockIcon;
  }
});

const messageText = computed(() => {
  switch (connectionStatus.value) {
  case 'logged_out':
    return 'Sesión cerrada. Haz clic en "Actualizar QR" para generar un nuevo código';
  case 'error':
    return 'Error de conexión. Verifica que las funciones estén desplegadas';
  default:
    return 'Generando código QR...';
  }
});

// Métodos
const loadQR = async () => {
  loading.value = true;
  loadingText.value = 'Inicializando WhatsApp...';
  error.value = null;
  qrImageUrl.value = null;

  try {
    // Primero inicializar WhatsApp
    const initResponse = await fetch(`${API_BASE_URL}/init`, {
      method: 'POST',
    });

    if (initResponse.ok) {
      loadingText.value = 'Generando código QR...';

      // Intentar obtener el QR varias veces
      let attempts = 0;
      const maxAttempts = 15;

      while (attempts < maxAttempts) {
        try {
          const response = await fetch(`${API_BASE_URL}/qr`, {
            cache: 'no-cache',
          });

          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
          }

          const contentType = response.headers.get('content-type');

          if (contentType && contentType.includes('image/png')) {
            // Es una imagen QR
            const blob = await response.blob();
            qrImageUrl.value = URL.createObjectURL(blob);
            loadingText.value = '¡QR generado! Escanea con tu teléfono';
            break;
          } else {
            // Es JSON, verificar estado
            const data = await response.json();
            if (data.status === 'connected') {
              connectionStatus.value = 'connected';
              loadingText.value = '¡WhatsApp ya está conectado!';
              break;
            }
          }
        } catch (err) {
          console.log(`Intento ${attempts + 1}/${maxAttempts} fallido:`, err);
        }

        attempts++;
        if (attempts < maxAttempts) {
          loadingText.value = `Generando QR... (${attempts}/${maxAttempts})`;
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      if (attempts >= maxAttempts && !qrImageUrl.value) {
        throw new Error('No se pudo generar el código QR después de varios intentos');
      }
    } else {
      throw new Error('Error al inicializar WhatsApp');
    }
  } catch (err) {
    console.error('Error cargando QR:', err);
    error.value = err instanceof Error ? err.message : 'Error al cargar el código QR';
    connectionStatus.value = 'error';
  } finally {
    loading.value = false;
  }
};

const checkStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/status`);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    connectionStatus.value = data.status;

    // Si está conectado, limpiar QR y detener verificaciones
    if (data.status === 'connected') {
      qrImageUrl.value = null;
      if (statusInterval) {
        clearInterval(statusInterval);
        statusInterval = null;
      }
    }
  } catch (err) {
    console.error('Error verificando estado:', err);
    connectionStatus.value = 'disconnected';
    // Si hay error 404, mostrar mensaje específico
    if (err instanceof Error && err.message.includes('404')) {
      connectionStatus.value = 'function-not-available';
    }
  }
};

const refreshQR = async () => {
  console.log('🔄 Refrescando QR...');

  // Limpiar intervalos anteriores
  if (statusInterval) {
    clearInterval(statusInterval);
  }
  if (fastStatusInterval) {
    clearInterval(fastStatusInterval);
  }

  loading.value = true;
  loadingText.value = 'Obteniendo código QR...';
  error.value = null;
  qrImageUrl.value = null;

  try {
    console.log('📱 Solicitando QR directamente...');
    const response = await fetch(`${API_BASE_URL}/qr?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    console.log('📊 Response status:', response.status);

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      console.log('📄 Content-Type:', contentType);

      if (contentType && contentType.includes('image/png')) {
        console.log('🖼️ Recibiendo imagen PNG...');
        const blob = await response.blob();
        console.log('📦 Blob size:', blob.size);

        if (blob.size > 0) {
          const imageUrl = URL.createObjectURL(blob);
          qrImageUrl.value = imageUrl;
          console.log('✅ QR imagen URL creada:', imageUrl);
          loadingText.value = '¡QR listo! Escanea con tu teléfono';

          // Iniciar monitoreo frecuente después de mostrar el QR
          startFastMonitoring();
        } else {
          throw new Error('La imagen QR está vacía');
        }
      } else {
        const data = await response.json();
        console.log('📄 QR Response JSON:', data);

        if (data.status === 'connected') {
          connectionStatus.value = 'connected';
          qrImageUrl.value = null;
        } else {
          throw new Error(data.message || 'QR no disponible como imagen');
        }
      }
    } else {
      throw new Error(`Error HTTP: ${response.status}`);
    }
  } catch (err) {
    console.error('❌ Error refrescando QR:', err);
    error.value = err instanceof Error ? err.message : 'Error al refrescar el código QR';
  } finally {
    loading.value = false;
  }

  // Iniciar verificación de estado normal
  statusInterval = setInterval(checkStatus, 5000);
};

// Nueva función para monitoreo frecuente después de mostrar QR
const startFastMonitoring = () => {
  console.log('🚀 Iniciando monitoreo frecuente para detectar escaneo...');

  // Verificar cada 2 segundos por 30 segundos
  let checks = 0;
  const maxChecks = 15; // 30 segundos

  fastStatusInterval = setInterval(async () => {
    checks++;
    console.log(`🔍 Verificación rápida ${checks}/${maxChecks}`);

    await checkStatus();

    // Si se conectó o llegamos al límite, parar el monitoreo frecuente
    if (connectionStatus.value === 'connected' || checks >= maxChecks) {
      console.log('⏹️ Deteniendo monitoreo frecuente');
      if (fastStatusInterval) {
        clearInterval(fastStatusInterval);
        fastStatusInterval = null;
      }

      if (connectionStatus.value === 'connected') {
        console.log('🎉 ¡WhatsApp conectado exitosamente!');
        // Mostrar notificación de éxito
        alert('🎉 ¡WhatsApp conectado exitosamente! Ya puedes enviar notificaciones.');
      }
    }
  }, 2000);
};

const testDirectConnection = async () => {
  testingConnection.value = true;

  try {
    console.log('🔍 Probando conexión directa...');

    // Verificar estado actual
    const statusResponse = await fetch(`${API_BASE_URL}/status`);

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('📊 Estado actual:', statusData);

      connectionStatus.value = statusData.status;

      if (statusData.status === 'connected') {
        console.log('🎉 ¡WhatsApp ya está conectado!');
        qrImageUrl.value = null;
        alert('🎉 ¡WhatsApp está conectado! Ya puedes enviar notificaciones.');
      } else if (statusData.status === 'qr_ready') {
        console.log('📱 QR disponible, obteniendo imagen...');
        await refreshQR();
      } else {
        console.log('⚠️ Estado:', statusData.status);
        alert(`Estado actual: ${statusData.status}\nMensaje: ${statusData.message}`);
      }
    } else {
      throw new Error(`Error HTTP: ${statusResponse.status}`);
    }
  } catch (error) {
    console.error('❌ Error en prueba directa:', error);
    alert(
      '❌ Error al probar conexión: ' +
        (error instanceof Error ? error.message : 'Error desconocido'),
    );
  } finally {
    testingConnection.value = false;
  }
};

const testDirectQR = async () => {
  console.log('🧪 Probando QR directo desde componente...');

  try {
    // Llamar init primero
    console.log('📞 Llamando /init...');
    const initResponse = await fetch(`${API_BASE_URL}/init`, { method: 'POST' });
    const initResult = await initResponse.json();
    console.log('📊 Init result:', initResult);

    if (initResult.success) {
      console.log('✅ Init exitoso, obteniendo QR...');

      // Llamar QR
      const qrUrl = `${API_BASE_URL}/qr?t=${Date.now()}`;
      console.log('📞 Llamando /qr:', qrUrl);

      const qrResponse = await fetch(qrUrl);
      console.log('📊 QR response status:', qrResponse.status);
      console.log('📊 QR content-type:', qrResponse.headers.get('content-type'));

      if (qrResponse.ok) {
        const contentType = qrResponse.headers.get('content-type');

        if (contentType?.includes('image/png')) {
          console.log('🖼️ Respuesta es imagen PNG!');
          const blob = await qrResponse.blob();
          console.log('📦 Blob size:', blob.size);

          if (blob.size > 0) {
            // Crear URL del blob y actualizar la imagen
            const imageUrl = URL.createObjectURL(blob);
            qrImageUrl.value = imageUrl;
            connectionStatus.value = 'waiting_for_qr';
            console.log('✅ QR cargado exitosamente!');
            alert('✅ QR cargado! Ver imagen arriba.');
          } else {
            throw new Error('Imagen QR vacía');
          }
        } else {
          const data = await qrResponse.json();
          console.log('📄 QR response JSON:', data);
          alert('📄 Respuesta: ' + JSON.stringify(data, null, 2));
        }
      } else {
        throw new Error(`Error HTTP: ${qrResponse.status}`);
      }
    } else {
      throw new Error('Error en init: ' + initResult.message);
    }
  } catch (error) {
    console.error('❌ Error en test directo:', error);
    alert('❌ Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
  }
};

const testMessage = async () => {
  if (connectionStatus.value !== 'connected') return;

  sendingTest.value = true;

  try {
    const response = await fetch(`${API_BASE_URL}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: '120363025343298938@g.us', // Número de prueba
        message:
          '🎵 Mensaje de prueba desde la Academia Musical! WhatsApp está funcionando correctamente.',
      }),
    });

    if (response.ok) {
      alert('✅ Mensaje de prueba enviado correctamente!');
    } else {
      throw new Error('Error al enviar mensaje');
    }
  } catch (err) {
    console.error('Error enviando mensaje de prueba:', err);
    alert('❌ Error al enviar mensaje de prueba');
  } finally {
    sendingTest.value = false;
  }
};

const handleQRResponse = (data: any) => {
  connectionStatus.value = data.status;

  switch (data.status) {
  case 'connected':
    loadingText.value = 'WhatsApp conectado';
    break;
  case 'logged_out':
    loadingText.value = 'Sesión cerrada';
    break;
  case 'waiting_for_qr':
    loadingText.value = 'Generando nuevo código QR...';
    // Reintentar cargar QR en unos segundos
    setTimeout(() => {
      if (connectionStatus.value === 'waiting_for_qr') {
        loadQR();
      }
    }, 2000);
    break;
  }
};

// Lifecycle
onMounted(async () => {
  await checkStatus();
  await loadQR();

  // Verificar estado cada 3 segundos
  statusInterval = setInterval(checkStatus, 3000);
});

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval);
  }
  if (fastStatusInterval) {
    clearInterval(fastStatusInterval);
  }
});
</script>

<style scoped>
.whatsapp-qr-container {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto;
}

.header {
  @apply text-center mb-6;
}

.logo {
  @apply flex items-center justify-center gap-3 mb-2;
}

.status-container {
  @apply flex justify-center mb-6;
}

.status-badge {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium;
}

.status-connected {
  @apply bg-green-100 text-green-800 border border-green-200;
}

.status-waiting {
  @apply bg-yellow-100 text-yellow-800 border border-yellow-200;
}

.status-error {
  @apply bg-red-100 text-red-800 border border-red-200;
}

.status-loading {
  @apply bg-blue-100 text-blue-800 border border-blue-200;
}

.qr-container {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-8 mb-6 min-h-[320px] flex flex-col items-center justify-center;
}

.qr-loading {
  @apply text-center;
}

.qr-success {
  @apply text-center;
}

.qr-image {
  @apply max-w-64 w-full h-auto rounded-lg bg-white p-2 mb-4;
}

.qr-instruction {
  @apply text-gray-600 dark:text-gray-400 font-medium mb-4;
}

.post-scan-steps {
  @apply bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-4 text-left;
}

.scan-status {
  @apply bg-green-50 dark:bg-green-900/20 rounded-lg p-3;
}

.qr-connected {
  @apply text-center;
}

.qr-message {
  @apply text-center;
}

.action-buttons {
  @apply flex flex-wrap gap-3 justify-center mb-6;
}

.btn {
  @apply inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-primary {
  @apply bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2;
}

.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
}

.btn-success {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

.btn-warning {
  @apply bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2;
}

.instructions {
  @apply bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4;
}

.instructions-title {
  @apply flex items-center gap-2 text-blue-800 dark:text-blue-400 font-semibold mb-3;
}

.instructions-list {
  @apply list-decimal list-inside space-y-2 text-sm text-blue-700 dark:text-blue-300;
}

.troubleshooting {
  @apply bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800;
}

.error-container {
  @apply bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2 text-red-800 dark:text-red-400;
}

.loader {
  @apply inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin;
}

.loader-large {
  @apply w-8 h-8 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin mx-auto;
}
</style>
