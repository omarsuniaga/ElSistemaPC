<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray"> 
    <div class="flex space-x-2">
            <button
              v-if="connectionStatus !== 'connected'"
              @click="initializeWhatsApp"
              class="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              :disabled="isInitializing"
            >
              {{ isInitializing ? "Inicializando..." : "Inicializar WhatsApp" }}
            </button>
            <button
              @click="testQRDirect"
              class="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              Test QR Directo
            </button>
            <button
              @click="checkFunctionStatus"
              class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Verificar
            </button>
          </div> 
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-gray-500 dark:text-gray-400">
    Panel de WhatsApp
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Configura y gestiona las notificaciones de WhatsApp para la academia
        </p>
      </div>

      <!-- Estado de Firebase Functions -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div :class="[
              'w-3 h-3 rounded-full mr-3',
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'function-not-available' ? 'bg-red-500' : 'bg-yellow-500'
            ]"></div>
            <div>
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                Estado de Firebase Functions
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ getStatusMessage() }}
              </p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button
              v-if="connectionStatus !== 'connected'"
              @click="initializeWhatsApp"
              class="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              :disabled="isInitializing"
            >
              {{ isInitializing ? 'Inicializando...' : 'Inicializar WhatsApp' }}
            </button>
            <button
              @click="checkFunctionStatus"
              class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Verificar
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
        <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">🔧 Diagnóstico del Sistema</h2>
        
        <!-- Estado de Firebase Functions -->
        <div class="mb-4">
          <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Estado de Firebase Functions</h3>
          <div class="flex items-center gap-3 mb-3">
            <div
              :class="[
                'w-3 h-3 rounded-full',
                functionStatus === 'active' ? 'bg-green-500' : 
                functionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              ]"
            />
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ getFunctionStatusMessage() }}
            </span>
          </div>
          
          <!-- Botones de diagnóstico -->
          <div class="flex gap-2 mb-4">
            <button
              @click="testFunctionDeployment"
              class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              :disabled="testingFunctions"
            >
              {{ testingFunctions ? 'Probando...' : 'Probar Functions' }}
            </button>
            
            <button
              @click="checkFirebaseProject"
              class="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              Verificar Proyecto Firebase
            </button>
            
            <button
              @click="deployFunctions"
              class="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
              :disabled="deployingFunctions"
            >
              {{ deployingFunctions ? 'Desplegando...' : 'Desplegar Functions' }}
            </button>
          </div>
          
          <!-- Resultados del diagnóstico -->
          <div v-if="diagnosticResults.length > 0" class="bg-gray-50 dark:bg-gray-700 rounded p-3">
            <h4 class="text-sm font-semibold mb-2">Resultados del diagnóstico:</h4>
            <ul class="text-xs space-y-1">
              <li v-for="(result, index) in diagnosticResults" :key="index" 
                  :class="result.type === 'success' ? 'text-green-600' : result.type === 'error' ? 'text-red-600' : 'text-yellow-600'">
                {{ result.message }}
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Enlaces útiles -->
        <div class="border-t pt-4">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Enlaces útiles:</h4>
          <div class="flex flex-wrap gap-2">
            <a href="https://console.firebase.google.com/project/orquestapuntacana/functions" 
               target="_blank" 
               class="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">
              Firebase Console - Functions
            </a>
            <a href="https://console.firebase.google.com/project/orquestapuntacana/logs" 
               target="_blank" 
               class="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">
              Firebase Logs
            </a>
          </div>
        </div>
      </div>
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
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
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
        <div v-if="activeTab === 'qr'">
          <WhatsAppQR />
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
                  <input type="checkbox" v-model="notifications.newStudent" class="form-checkbox h-4 w-4 text-green-600 transition duration-150 ease-in-out" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Nuevos estudiantes</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="checkbox" v-model="notifications.classReminder" class="form-checkbox h-4 w-4 text-green-600 transition duration-150 ease-in-out" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Recordatorios de clase</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="checkbox" v-model="notifications.payment" class="form-checkbox h-4 w-4 text-green-600 transition duration-150 ease-in-out" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Recordatorios de pago</span>
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
                  <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Recordatorios de clase</label>
                  <input type="time" v-model="schedules.classReminder" class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Recordatorios de pago</label>
                  <input type="time" v-model="schedules.paymentReminder" class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
            </div>

            <!-- Botón guardar -->
            <div>
              <button 
                @click="saveConfig"
                :disabled="saving"
                class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {{ saving ? 'Guardando...' : 'Guardar Configuración' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Tab: Historial -->
        <div v-if="activeTab === 'history'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Historial de Mensajes
          </h2>
          
          <div class="space-y-4">
            <div v-if="messages.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              No hay mensajes enviados aún
            </div>
            
            <div v-for="message in messages" :key="message.id" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div class="flex justify-between items-start mb-2">
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ message.recipient }}</span>
                  <span :class="[
                    'px-2 py-1 text-xs rounded-full',
                    message.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]">
                    {{ message.status === 'sent' ? 'Enviado' : 'Error' }}
                  </span>
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(message.timestamp) }}</span>
              </div>
              <p class="text-sm text-gray-700 dark:text-gray-300">{{ message.content }}</p>
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
                type="tel" 
                v-model="testMessage.phone"
                placeholder="+1234567890"
                class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              />
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
              ></textarea>
            </div>
            
            <div>
              <button 
                @click="sendTestMessage"
                :disabled="!testMessage.phone || !testMessage.content || sendingTest"
                class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {{ sendingTest ? 'Enviando...' : 'Enviar Mensaje' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { 
  QrCodeIcon, 
  CogIcon, 
  ClockIcon, 
  PaperAirplaneIcon 
} from '@heroicons/vue/24/outline'
import WhatsAppQR from '@/components/WhatsAppQR.vue'

// Estado de las tabs
const activeTab = ref('qr')
const isInitializing = ref(false)

const tabs = [
  { id: 'qr', name: 'Conexión QR', icon: QrCodeIcon },
  { id: 'config', name: 'Configuración', icon: CogIcon },
  { id: 'history', name: 'Historial', icon: ClockIcon },
  { id: 'test', name: 'Prueba', icon: PaperAirplaneIcon }
]

// Estado de configuración
const notifications = reactive({
  newStudent: true,
  classReminder: true,
  payment: true
})

const schedules = reactive({
  classReminder: '09:00',
  paymentReminder: '18:00'
})

const saving = ref(false)

// Estado de historial de mensajes
const messages = ref([
  {
    id: 1,
    recipient: '+1234567890',
    content: 'Recordatorio: Tienes clase de piano mañana a las 3:00 PM',
    status: 'sent',
    timestamp: new Date(Date.now() - 86400000) // Ayer
  },
  {
    id: 2,
    recipient: '+0987654321',
    content: 'Bienvenido a la Academia Musical! Tu primera clase será el lunes.',
    status: 'sent',
    timestamp: new Date(Date.now() - 172800000) // Hace 2 días
  }
])

// Estado de mensaje de prueba
const testMessage = reactive({
  phone: '',
  content: '🎵 Mensaje de prueba desde la Academia Musical!\n\nEste es un mensaje de prueba para verificar que WhatsApp está funcionando correctamente.'
})

const sendingTest = ref(false)

// Estado de conexión de Firebase Functions
const connectionStatus = ref('checking')
const functionStatus = ref('unknown')
const testingFunctions = ref(false)
const deployingFunctions = ref(false)
const diagnosticResults = ref<Array<{type: string, message: string}>>([])

// Métodos
const checkFunctionStatus = async () => {
  try {
    const response = await fetch('https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi/status')
    if (response.ok) {
      connectionStatus.value = 'connected'
    } else {
      connectionStatus.value = 'function-not-available'
    }
  } catch (error) {
    connectionStatus.value = 'function-not-available'
  }
}

const initializeWhatsApp = async () => {
  isInitializing.value = true
  
  try {
    console.log('🔄 Inicializando WhatsApp...')
    
    const response = await fetch('https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ WhatsApp inicializado:', result)
      
      // Verificar el estado después de la inicialización
      await checkFunctionStatus()
      
      alert('✅ WhatsApp inicializado correctamente')
    } else {
      throw new Error('Error al inicializar WhatsApp')
    }
  } catch (error) {
    console.error('❌ Error inicializando WhatsApp:', error)
    alert('❌ Error al inicializar WhatsApp: ' + (error instanceof Error ? error.message : 'Error desconocido'))
  } finally {
    isInitializing.value = false
  }
}

const testQRDirect = async () => {
  try {
    console.log('🧪 Probando QR directo...')
    
    // Probar init primero
    const initUrl = 'https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi/init'
    console.log('📞 Llamando init:', initUrl)
    
    const initResponse = await fetch(initUrl, { method: 'POST' })
    const initResult = await initResponse.json()
    console.log('📊 Init result:', initResult)
    
    if (initResult.success) {
      // Probar QR
      const qrUrl = 'https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi/qr'
      console.log('📞 Llamando QR:', qrUrl)
      
      const qrResponse = await fetch(qrUrl)
      console.log('📊 QR response status:', qrResponse.status)
      console.log('📊 QR response type:', qrResponse.headers.get('content-type'))
      
      if (qrResponse.ok) {
        const contentType = qrResponse.headers.get('content-type')
        if (contentType?.includes('image/png')) {
          console.log('✅ QR es imagen PNG!')
          // Abrir en nueva ventana
          window.open(qrUrl, '_blank')
        } else {
          const data = await qrResponse.json()
          console.log('📄 QR response JSON:', data)
        }
      }
    }
    
    alert('✅ Check completado - ver consola para detalles')
  } catch (error) {
    console.error('❌ Error en test:', error)
    alert('❌ Error: ' + (error instanceof Error ? error.message : 'Error desconocido'))
  }
}

const getStatusMessage = () => {
  switch (connectionStatus.value) {
    case 'connected':
      return 'Firebase Functions funcionando correctamente'
    case 'function-not-available':
      return 'Firebase Functions no disponible. Verifica el despliegue.'
    case 'checking':
      return 'Verificando estado...'
    default:
      return 'Estado desconocido'
  }
}

const getFunctionStatusMessage = () => {
  switch (functionStatus.value) {
    case 'active':
      return 'Firebase Functions desplegadas y funcionando correctamente'
    case 'error':
      return 'Error: Firebase Functions no están funcionando'
    case 'not-deployed':
      return 'Firebase Functions no están desplegadas'
    case 'unknown':
      return 'Estado desconocido - Hacer clic en "Probar Functions"'
    default:
      return 'Verificando...'
  }
}

const testFunctionDeployment = async () => {
  testingFunctions.value = true
  diagnosticResults.value = []
  
  try {
    console.log('🧪 Probando despliegue de Firebase Functions...')
    
    // Test 1: Verificar endpoint de status
    try {
      const statusResponse = await fetch('https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi/status', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      
      if (statusResponse.ok) {
        functionStatus.value = 'active'
        diagnosticResults.value.push({ 
          type: 'success', 
          message: '✅ Endpoint /status responde correctamente' 
        })
      } else {
        throw new Error(`Status HTTP: ${statusResponse.status}`)
      }
    } catch (error) {
      functionStatus.value = 'error'
      diagnosticResults.value.push({ 
        type: 'error', 
        message: `❌ Error en /status: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      })
    }
    
    // Test 2: Verificar endpoint de init
    try {
      const initResponse = await fetch('https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (initResponse.ok) {
        diagnosticResults.value.push({ 
          type: 'success', 
          message: '✅ Endpoint /init responde correctamente' 
        })
      } else {
        throw new Error(`Init HTTP: ${initResponse.status}`)
      }
    } catch (error) {
      diagnosticResults.value.push({ 
        type: 'error', 
        message: `❌ Error en /init: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      })
    }
    
    // Test 3: Verificar endpoint de QR
    try {
      const qrResponse = await fetch('https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi/qr', {
        method: 'GET'
      })
      
      if (qrResponse.ok) {
        const contentType = qrResponse.headers.get('content-type')
        if (contentType?.includes('image/png') || contentType?.includes('application/json')) {
          diagnosticResults.value.push({ 
            type: 'success', 
            message: '✅ Endpoint /qr responde correctamente' 
          })
        } else {
          diagnosticResults.value.push({ 
            type: 'warning', 
            message: `⚠️ /qr responde pero content-type inesperado: ${contentType}` 
          })
        }
      } else {
        throw new Error(`QR HTTP: ${qrResponse.status}`)
      }
    } catch (error) {
      diagnosticResults.value.push({ 
        type: 'error', 
        message: `❌ Error en /qr: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      })
    }
    
    console.log('🧪 Diagnóstico completado')
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error)
    functionStatus.value = 'error'
    diagnosticResults.value.push({ 
      type: 'error', 
      message: `❌ Error general: ${error instanceof Error ? error.message : 'Error desconocido'}` 
    })
  } finally {
    testingFunctions.value = false
  }
}

const checkFirebaseProject = () => {
  diagnosticResults.value = [
    { type: 'info', message: '📋 Proyecto Firebase: orquestapuntacana' },
    { type: 'info', message: '🌍 Región: us-central1' },
    { type: 'info', message: '📞 URL Base: https://us-central1-orquestapuntacana.cloudfunctions.net/' },
    { type: 'info', message: '📱 Function: whatsappApi' },
    { type: 'warning', message: '⚠️ Verificar que el proyecto esté activo en Firebase Console' }
  ]
}

const deployFunctions = () => {
  deployingFunctions.value = true
  
  // Simular despliegue (en realidad necesitarías hacer esto desde terminal)
  diagnosticResults.value = [
    { type: 'info', message: '📦 Para desplegar las functions, ejecuta en terminal:' },
    { type: 'info', message: '1. cd functions' },
    { type: 'info', message: '2. npm install' },
    { type: 'info', message: '3. firebase deploy --only functions' },
    { type: 'warning', message: '⚠️ Asegúrate de estar logueado en Firebase CLI' }
  ]
  
  setTimeout(() => {
    deployingFunctions.value = false
  }, 2000)
}

const saveConfig = async () => {
  saving.value = true
  
  try {
    // Simular guardado de configuración
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Aquí guardarías la configuración en Firestore o tu backend
    console.log('Configuración guardada:', { notifications, schedules })
    
    alert('✅ Configuración guardada correctamente')
  } catch (error) {
    console.error('Error guardando configuración:', error)
    alert('❌ Error al guardar la configuración')
  } finally {
    saving.value = false
  }
}

const sendTestMessage = async () => {
  if (!testMessage.phone || !testMessage.content) return
  
  sendingTest.value = true
  
  try {
    const response = await fetch('https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: testMessage.phone + '@s.whatsapp.net',
        message: testMessage.content
      })
    })
    
    if (response.ok) {
      alert('✅ Mensaje enviado correctamente!')
      
      // Agregar al historial
      messages.value.unshift({
        id: Date.now(),
        recipient: testMessage.phone,
        content: testMessage.content,
        status: 'sent',
        timestamp: new Date()
      })
      
      // Limpiar formulario
      testMessage.phone = ''
      testMessage.content = '🎵 Mensaje de prueba desde la Academia Musical!\n\nEste es un mensaje de prueba para verificar que WhatsApp está funcionando correctamente.'
    } else {
      throw new Error('Error al enviar mensaje')
    }
  } catch (error) {
    console.error('Error enviando mensaje:', error)
    alert('❌ Error al enviar mensaje. Verifica que WhatsApp esté conectado.')
  } finally {
    sendingTest.value = false
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Inicialización
onMounted(() => {
  checkFunctionStatus()
})
</script>

<style scoped>
.form-checkbox {
  @apply rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring focus:ring-green-500 focus:ring-opacity-50;
}
</style>
