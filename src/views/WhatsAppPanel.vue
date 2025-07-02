<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
    <div class="max-w-7xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">📱 WhatsApp Business</h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ getStatusMessage() }}
        </p>
      </div>

      <!-- Estado de Conexión QR -->
      <div
        v-if="connectionStatus === 'disconnected' || connectionStatus === 'connecting'"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8"
      >
        <div class="text-center">
          <div class="mb-6">
            <div
              class="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"
                />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {{
                connectionStatus === "connecting"
                  ? "Conectando WhatsApp"
                  : "Conectar WhatsApp Business"
              }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              {{
                connectionStatus === "connecting"
                  ? "Escanea el código QR con tu aplicación de WhatsApp"
                  : "Para comenzar a enviar notificaciones automáticas, necesitas conectar tu cuenta de WhatsApp"
              }}
            </p>
          </div>

          <!-- QR Code -->
          <div v-if="connectionStatus === 'connecting'" class="mb-6">
            <div v-if="qrCode" class="flex justify-center mb-4">
              <div class="bg-white p-4 rounded-lg shadow-md">
                <img :src="qrCode" alt="QR Code WhatsApp" class="w-64 h-64" />
              </div>
            </div>
            <div v-else class="flex justify-center mb-4">
              <div class="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg">
                <div
                  class="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto"
                />
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-4">Generando código QR...</p>
              </div>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>1. Abre WhatsApp en tu teléfono</p>
              <p>2. Ve a Configuración > Dispositivos vinculados</p>
              <p>3. Toca "Vincular un dispositivo"</p>
              <p>4. Escanea este código QR</p>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="flex justify-center space-x-4">
            <button
              v-if="connectionStatus === 'disconnected'"
              :disabled="isConnecting"
              class="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              @click="initializeConnection"
            >
              {{ isConnecting ? "Conectando..." : "🔗 Conectar WhatsApp" }}
            </button>
            <button
              v-if="connectionStatus === 'connecting'"
              class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              @click="checkConnectionStatus"
            >
              🔄 Verificar Conexión
            </button>
          </div>
        </div>
      </div>

      <!-- Panel Principal de Negocio (cuando está conectado) -->
      <div v-if="connectionStatus === 'connected'" class="space-y-6">
        <!-- Header con estado conectado -->
        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-green-200 rounded-full mr-3 animate-pulse" />
              <div>
                <h2 class="text-xl font-semibold">✅ WhatsApp Conectado</h2>
                <p class="text-green-100">Sistema listo para enviar notificaciones automáticas</p>
              </div>
            </div>
            <button
              class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition-colors"
              @click="disconnectWhatsApp"
            >
              🔌 Desconectar
            </button>
          </div>
        </div>

        <!-- Navegación de Tabs Business -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                v-for="tab in businessTabs"
                :key="tab.id"
                :class="[
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
                  'group inline-flex items-center py-4 px-6 border-b-2 font-medium text-sm',
                ]"
                @click="activeTab = tab.id"
              >
                <component
                  :is="tab.icon"
                  :class="[
                    activeTab === tab.id
                      ? 'text-green-500 dark:text-green-400'
                      : 'text-gray-400 group-hover:text-gray-500',
                    '-ml-0.5 mr-2 h-5 w-5',
                  ]"
                />
                {{ tab.name }}
              </button>
            </nav>
          </div>

          <!-- Contenido de las Tabs -->
          <div class="p-6">
            <!-- Tab: Enviar Mensajes -->
            <div v-if="activeTab === 'messages'" class="space-y-6">
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Formulario de mensaje -->
                <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    📤 Enviar Mensaje
                  </h2>

                  <div class="space-y-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Número de teléfono
                      </label>
                      <input
                        v-model="messageForm.recipient"
                        type="tel"
                        placeholder="+1809-555-0123"
                        class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Plantilla
                      </label>
                      <select
                        v-model="selectedTemplate"
                        class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        @change="applyTemplate"
                      >
                        <option value="">Seleccionar plantilla...</option>
                        <option
                          v-for="template in messageTemplates"
                          :key="template.id"
                          :value="template.id"
                        >
                          {{ template.name }}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Mensaje
                      </label>
                      <textarea
                        v-model="messageForm.content"
                        rows="6"
                        placeholder="Escribe tu mensaje aquí..."
                        class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      />
                      <p class="mt-1 text-xs text-gray-500">
                        Caracteres: {{ messageForm.content.length }}
                      </p>
                    </div>

                    <div class="flex space-x-3">
                      <button
                        :disabled="!messageForm.recipient || !messageForm.content || sendingMessage"
                        class="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                        @click="sendMessage"
                      >
                        {{ sendingMessage ? "Enviando..." : "📤 Enviar Mensaje" }}
                      </button>
                      <button
                        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        @click="clearMessage"
                      >
                        🗑️ Limpiar
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Panel de plantillas rápidas -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    📋 Plantillas Rápidas
                  </h2>
                  <div class="space-y-3">
                    <button
                      v-for="template in messageTemplates.slice(0, 4)"
                      :key="template.id"
                      class="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      @click="selectTemplate(template)"
                    >
                      <div class="font-medium text-sm text-gray-900 dark:text-white">
                        {{ template.name }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {{ template.content.substring(0, 50) }}...
                      </div>
                    </button>
                  </div>
                  <button
                    class="w-full mt-3 text-center py-2 text-sm text-green-600 hover:text-green-700 font-medium"
                    @click="activeTab = 'templates'"
                  >
                    Ver todas las plantillas →
                  </button>
                </div>
              </div>
            </div>

            <!-- Tab: Envío Masivo -->
            <div v-if="activeTab === 'bulk'" class="space-y-6">
              <div
                class="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6"
              >
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Envío Responsable
                    </h3>
                    <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <p>• Máximo 50 destinatarios por lote para evitar bloqueos</p>
                      <p>• El sistema aplicará retrasos automáticos entre mensajes</p>
                      <p>• Límite diario: 1000 mensajes para proteger tu cuenta</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Formulario de envío masivo -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    📢 Envío Masivo
                  </h2>

                  <div class="space-y-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Lista de destinatarios
                      </label>
                      <textarea
                        v-model="bulkForm.recipients"
                        rows="6"
                        placeholder="Ingresa los números separados por comas o líneas:&#10;+1809-555-0001&#10;+1809-555-0002&#10;+1809-555-0003"
                        class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      />
                      <p class="mt-1 text-xs text-gray-500">
                        {{ getBulkRecipientCount() }} destinatarios encontrados
                      </p>
                    </div>

                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Plantilla para envío masivo
                      </label>
                      <select
                        v-model="bulkForm.selectedTemplate"
                        class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        @change="applyBulkTemplate"
                      >
                        <option value="">Seleccionar plantilla...</option>
                        <option
                          v-for="template in messageTemplates"
                          :key="template.id"
                          :value="template.id"
                        >
                          {{ template.name }}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Mensaje
                      </label>
                      <textarea
                        v-model="bulkForm.message"
                        rows="8"
                        placeholder="Escribe tu mensaje para envío masivo..."
                        class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      />
                      <p class="mt-1 text-xs text-gray-500">
                        Caracteres: {{ bulkForm.message.length }}
                      </p>
                    </div>

                    <div class="flex items-center">
                      <input
                        v-model="bulkForm.validateNumbers"
                        type="checkbox"
                        class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label class="ml-2 block text-sm text-gray-900 dark:text-white">
                        Validar números antes de enviar
                      </label>
                    </div>

                    <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                      <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Estimación de envío:
                      </h4>
                      <div class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <p>• Destinatarios: {{ getBulkRecipientCount() }}</p>
                        <p>• Tiempo estimado: {{ getEstimatedTime() }}</p>
                        <p>• Retrasos entre mensajes: 0.5-1.5 segundos</p>
                      </div>
                    </div>

                    <div class="flex space-x-3">
                      <button
                        :disabled="!canSendBulk() || sendingBulk"
                        class="flex-1 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium"
                        @click="sendBulkMessage"
                      >
                        {{ sendingBulk ? "Enviando..." : "📢 Enviar a Todos" }}
                      </button>
                      <button
                        class="px-4 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        @click="clearBulkForm"
                      >
                        🗑️ Limpiar
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Panel de estadísticas en vivo -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    📊 Estado del Envío
                  </h2>

                  <div v-if="!sendingBulk && !bulkResults" class="text-center py-8">
                    <div
                      class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <svg
                        class="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4"
                        />
                      </svg>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400">
                      Las estadísticas aparecerán aquí durante el envío
                    </p>
                  </div>

                  <div v-if="sendingBulk" class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >Progreso</span
                      >
                      <span class="text-sm text-gray-500 dark:text-gray-400">
                        {{ bulkProgress.current }}/{{ bulkProgress.total }}
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-green-600 h-2 rounded-full transition-all duration-300"
                        :style="`width: ${getBulkProgressPercent()}%`"
                      />
                    </div>

                    <div class="grid grid-cols-3 gap-4 mt-4">
                      <div class="text-center">
                        <div class="text-lg font-semibold text-green-600">
                          {{ bulkProgress.successful }}
                        </div>
                        <div class="text-xs text-gray-500">Exitosos</div>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-semibold text-red-600">
                          {{ bulkProgress.failed }}
                        </div>
                        <div class="text-xs text-gray-500">Fallidos</div>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-semibold text-gray-600">
                          {{ bulkProgress.remaining }}
                        </div>
                        <div class="text-xs text-gray-500">Restantes</div>
                      </div>
                    </div>

                    <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                      <p class="text-sm text-blue-700 dark:text-blue-300">
                        <span class="font-medium">Enviando:</span>
                        {{ bulkProgress.currentRecipient }}
                      </p>
                      <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Tiempo transcurrido: {{ formatTime(bulkProgress.elapsedTime) }}
                      </p>
                    </div>
                  </div>

                  <div v-if="bulkResults && !sendingBulk" class="space-y-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                      🎉 Envío Completado
                    </h3>

                    <div class="grid grid-cols-2 gap-4">
                      <div class="bg-green-50 dark:bg-green-900 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                          {{ bulkResults.successful }}
                        </div>
                        <div class="text-sm text-green-600 dark:text-green-400">Exitosos</div>
                      </div>
                      <div class="bg-red-50 dark:bg-red-900 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                          {{ bulkResults.failed }}
                        </div>
                        <div class="text-sm text-red-600 dark:text-red-400">Fallidos</div>
                      </div>
                    </div>

                    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span class="font-medium">Tasa de éxito:</span>
                          <span class="ml-2">{{ bulkResults.statistics?.successRate || 0 }}%</span>
                        </div>
                        <div>
                          <span class="font-medium">Duración:</span>
                          <span class="ml-2">{{ formatTime(bulkResults.duration) }}</span>
                        </div>
                      </div>
                    </div>

                    <div v-if="bulkResults.errors && bulkResults.errors.length > 0" class="mt-4">
                      <h4 class="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                        Errores encontrados:
                      </h4>
                      <div class="max-h-32 overflow-y-auto">
                        <div
                          v-for="error in bulkResults.errors"
                          :key="error.number"
                          class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 p-2 rounded mb-1"
                        >
                          <span class="font-medium">{{ error.number }}:</span> {{ error.error }}
                        </div>
                      </div>
                    </div>

                    <button
                      class="w-full mt-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                      @click="resetBulkResults"
                    >
                      🔄 Nuevo Envío
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab: Plantillas -->
            <div v-if="activeTab === 'templates'" class="space-y-6">
              <div class="flex justify-between items-center">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                  📄 Gestión de Plantillas
                </h2>
                <button
                  class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  @click="showCreateTemplate = true"
                >
                  ➕ Nueva Plantilla
                </button>
              </div>

              <!-- Filtros de categoría -->
              <div class="flex space-x-2 overflow-x-auto pb-2">
                <button
                  v-for="category in templateCategories"
                  :key="category"
                  :class="[
                    selectedCategory === category
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  ]"
                  @click="selectedCategory = category"
                >
                  {{ category }}
                </button>
              </div>

              <!-- Lista de plantillas -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="template in filteredTemplates"
                  :key="template.id"
                  class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h3 class="font-semibold text-gray-900 dark:text-white">
                        {{ template.name }}
                      </h3>
                      <span
                        class="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full mt-1"
                      >
                        {{ template.category }}
                      </span>
                    </div>
                    <div class="flex space-x-1">
                      <button
                        class="text-gray-400 hover:text-blue-600 transition-colors"
                        @click="editTemplate(template)"
                      >
                        ✏️
                      </button>
                      <button
                        class="text-gray-400 hover:text-red-600 transition-colors"
                        @click="deleteTemplate(template.id)"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                    {{ template.content.substring(0, 120) }}...
                  </p>
                  <button
                    class="w-full bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-400 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
                    @click="useTemplate(template)"
                  >
                    🚀 Usar Plantilla
                  </button>
                </div>
              </div>
            </div>

            <!-- Tab: Historial -->
            <div v-if="activeTab === 'history'" class="space-y-6">
              <div class="flex justify-between items-center">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                  📊 Historial de Mensajes
                </h2>
              </div>

              <!-- Estadísticas -->
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {{ messageStats.total }}
                  </div>
                  <div class="text-sm text-blue-600 dark:text-blue-400">Total</div>
                </div>
                <div class="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                    {{ messageStats.sent }}
                  </div>
                  <div class="text-sm text-green-600 dark:text-green-400">Enviados</div>
                </div>
                <div class="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
                  <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                    {{ messageStats.failed }}
                  </div>
                  <div class="text-sm text-red-600 dark:text-red-400">Fallidos</div>
                </div>
                <div class="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                  <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {{ messageStats.pending }}
                  </div>
                  <div class="text-sm text-yellow-600 dark:text-yellow-400">Pendientes</div>
                </div>
              </div>

              <!-- Filtros y búsqueda -->
              <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div class="flex-1">
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Buscar por número o contenido..."
                    class="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <select
                  v-model="historyFilter"
                  class="border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">Todos los estados</option>
                  <option value="sent">Enviados</option>
                  <option value="failed">Fallidos</option>
                  <option value="pending">Pendientes</option>
                </select>
              </div>

              <!-- Lista de mensajes -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Destinatario
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Mensaje
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Estado
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Fecha
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                    >
                      <tr v-for="message in paginatedMessages" :key="message.id">
                        <td
                          class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                        >
                          {{ message.recipient }}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div class="max-w-xs truncate">{{ message.content }}</div>
                          <div
                            v-if="message.template"
                            class="text-xs text-gray-500 dark:text-gray-400"
                          >
                            Plantilla: {{ message.template }}
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span
                            :class="[
                              message.status === 'sent'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : message.status === 'failed'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                              'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                            ]"
                          >
                            {{ getStatusText(message.status) }}
                          </span>
                          <div v-if="message.error" class="text-xs text-red-500 mt-1">
                            {{ message.error }}
                          </div>
                        </td>
                        <td
                          class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                        >
                          {{ formatDate(message.timestamp) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            v-if="message.status === 'failed'"
                            class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            @click="retryMessage(message)"
                          >
                            🔄 Reintentar
                          </button>
                          <button
                            class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            @click="duplicateMessage(message)"
                          >
                            📋 Duplicar
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Paginación -->
                <div
                  v-if="totalPages > 1"
                  class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1 flex justify-between sm:hidden">
                      <button
                        :disabled="currentPage === 1"
                        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        @click="currentPage = Math.max(1, currentPage - 1)"
                      >
                        Anterior
                      </button>
                      <button
                        :disabled="currentPage === totalPages"
                        class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        @click="currentPage = Math.min(totalPages, currentPage + 1)"
                      >
                        Siguiente
                      </button>
                    </div>
                    <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                          Mostrando
                          <span class="font-medium">{{
                            (currentPage - 1) * itemsPerPage + 1
                          }}</span>
                          a
                          <span class="font-medium">{{
                            Math.min(currentPage * itemsPerPage, filteredMessages.length)
                          }}</span>
                          de
                          <span class="font-medium">{{ filteredMessages.length }}</span>
                          resultados
                        </p>
                      </div>
                      <div>
                        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            v-for="page in totalPages"
                            :key="page"
                            :class="[
                              page === currentPage
                                ? 'z-10 bg-green-50 border-green-500 text-green-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                              'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                            ]"
                            @click="currentPage = page"
                          >
                            {{ page }}
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab: Configuración -->
            <div v-if="activeTab === 'config'" class="space-y-6">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                ⚙️ Configuración Avanzada
              </h2>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Notificaciones automáticas -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    🔔 Notificaciones Automáticas
                  </h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          Nuevos estudiantes
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          Mensaje de bienvenida automático
                        </div>
                      </div>
                      <input
                        v-model="notifications.newStudent"
                        type="checkbox"
                        class="form-checkbox h-4 w-4 text-green-600"
                      />
                    </div>
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          Recordatorios de clase
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          24 horas antes de la clase
                        </div>
                      </div>
                      <input
                        v-model="notifications.classReminder"
                        type="checkbox"
                        class="form-checkbox h-4 w-4 text-green-600"
                      />
                    </div>
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          Recordatorios de pago
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          3 días antes del vencimiento
                        </div>
                      </div>
                      <input
                        v-model="notifications.payment"
                        type="checkbox"
                        class="form-checkbox h-4 w-4 text-green-600"
                      />
                    </div>
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          Clases de emergencia
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          Disponibilidad inmediata
                        </div>
                      </div>
                      <input
                        v-model="notifications.emergencyClass"
                        type="checkbox"
                        class="form-checkbox h-4 w-4 text-green-600"
                      />
                    </div>
                  </div>
                </div>

                <!-- Horarios programados -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    ⏰ Horarios Programados
                  </h3>
                  <div class="space-y-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Recordatorios de clase
                      </label>
                      <input
                        v-model="schedules.classReminder"
                        type="time"
                        class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Recordatorios de pago
                      </label>
                      <input
                        v-model="schedules.paymentReminder"
                        type="time"
                        class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Límite nocturno (no enviar después de)
                      </label>
                      <input
                        v-model="schedules.nightLimit"
                        type="time"
                        class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Inicio matutino (enviar después de)
                      </label>
                      <input
                        v-model="schedules.morningStart"
                        type="time"
                        class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <!-- Configuración avanzada -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    🔧 Configuración Avanzada
                  </h3>
                  <div class="space-y-4">
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Reintentos automáticos
                      </label>
                      <select
                        v-model="config.retryAttempts"
                        class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option :value="0">Sin reintentos</option>
                        <option :value="1">1 reintento</option>
                        <option :value="2">2 reintentos</option>
                        <option :value="3">3 reintentos</option>
                      </select>
                    </div>
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Retraso entre mensajes (segundos)
                      </label>
                      <input
                        v-model.number="config.messageDelay"
                        type="number"
                        min="1"
                        max="60"
                        class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      />
                      <p class="mt-1 text-xs text-gray-500">
                        Recomendado: 5-10 segundos para evitar spam
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Estado del sistema -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    📊 Estado del Sistema
                  </h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600 dark:text-gray-400"
                        >Conexión WhatsApp</span
                      >
                      <span class="text-sm font-medium text-green-600">✅ Conectado</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600 dark:text-gray-400"
                        >Mensajes enviados hoy</span
                      >
                      <span class="text-sm font-medium text-gray-900 dark:text-white">{{
                        messageStats.sent
                      }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-gray-600 dark:text-gray-400"
                        >Última verificación</span
                      >
                      <span class="text-sm text-gray-600 dark:text-gray-400">{{
                        formatDate(new Date())
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Botón guardar -->
              <div class="flex justify-end">
                <button
                  :disabled="saving"
                  class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                  @click="saveConfig"
                >
                  {{ saving ? "Guardando..." : "💾 Guardar Configuración" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed} from "vue"
import {PaperAirplaneIcon, CogIcon, ClockIcon, DocumentTextIcon} from "@heroicons/vue/24/outline"

// Estado de conexión
const connectionStatus = ref("checking")
const isConnecting = ref(false)
const qrCode = ref("")

// Estado de tabs - Solo para usuarios conectados
const activeTab = ref("messages")
const businessTabs = [
  {id: "messages", name: "Enviar Mensajes", icon: PaperAirplaneIcon},
  {id: "bulk", name: "Envío Masivo", icon: DocumentTextIcon},
  {id: "templates", name: "Plantillas", icon: DocumentTextIcon},
  {id: "history", name: "Historial", icon: ClockIcon},
  {id: "config", name: "Configuración", icon: CogIcon},
]

// Estado del formulario de mensajes
const messageForm = reactive({
  recipient: "",
  content: "",
})

const selectedTemplate = ref("")
const sendingMessage = ref(false)

// Estado del formulario de envío masivo
const bulkForm = reactive({
  recipients: "",
  message: "",
  selectedTemplate: "",
  validateNumbers: true,
})

const sendingBulk = ref(false)
const bulkResults = ref(null)
const bulkProgress = reactive({
  current: 0,
  total: 0,
  successful: 0,
  failed: 0,
  remaining: 0,
  currentRecipient: "",
  elapsedTime: 0,
  startTime: 0,
})

// Plantillas de mensajes
const messageTemplates = ref([
  {
    id: "welcome",
    name: "Bienvenida a nuevo estudiante",
    category: "Bienvenida",
    content: `🎵 ¡Bienvenido/a a Music Academy!

Nos alegra tenerte como parte de nuestra familia musical. 

📅 Tu primera clase está programada para el [FECHA] a las [HORA]
📍 Ubicación: [DIRECCIÓN]
👨‍🏫 Profesor: [PROFESOR]

Si tienes alguna pregunta, no dudes en contactarnos.

¡Esperamos verte pronto! 🎸🎹`,
  },
  {
    id: "class_reminder",
    name: "Recordatorio de clase",
    category: "Recordatorios",
    content: `🎼 Recordatorio de clase - Music Academy

Hola [NOMBRE], te recordamos que tienes clase mañana:

📅 Fecha: [FECHA]
🕐 Hora: [HORA]
🎵 Instrumento: [INSTRUMENTO]
👨‍🏫 Profesor: [PROFESOR]

Por favor, no olvides traer tu material de estudio.

¡Te esperamos! 🎶`,
  },
  {
    id: "payment_reminder",
    name: "Recordatorio de pago",
    category: "Pagos",
    content: `💳 Recordatorio de Pago - Music Academy

Estimado/a [NOMBRE],

Te recordamos que tu mensualidad vence el [FECHA_VENCIMIENTO].

💰 Monto: $[MONTO]
📅 Vencimiento: [FECHA_VENCIMIENTO]

Puedes realizar el pago mediante:
🏦 Transferencia bancaria
💳 Tarjeta de crédito/débito
💵 Efectivo en academia

¡Gracias por confiar en nosotros! 🎵`,
  },
  {
    id: "emergency_class",
    name: "Clase de emergencia",
    category: "Emergencia",
    content: `🚨 Clase de Emergencia Disponible

Hola [NOMBRE],

Tenemos una clase de emergencia disponible:

📅 Fecha: [FECHA]
🕐 Hora: [HORA]
🎵 Instrumento: [INSTRUMENTO]
⏰ Duración: [DURACION] minutos

¿Te interesa tomarla? Responde SÍ para confirmar.

Music Academy 🎶`,
  },
])

// Configuración
const notifications = reactive({
  newStudent: true,
  classReminder: true,
  payment: true,
  emergencyClass: true,
})

const schedules = reactive({
  classReminder: "09:00",
  paymentReminder: "18:00",
  nightLimit: "21:00",
  morningStart: "08:00",
})

const config = reactive({
  retryAttempts: 2,
  messageDelay: 5,
})

const saving = ref(false)

// Estado del historial
const messages = ref([
  {
    id: 1,
    recipient: "+1809-555-0001",
    content: "Recordatorio: Tienes clase de piano mañana a las 3:00 PM",
    status: "sent",
    template: "Recordatorio",
    timestamp: new Date(Date.now() - 86400000),
  },
  {
    id: 2,
    recipient: "+1809-555-0002",
    content: "Bienvenido a la Academia Musical! Tu primera clase será el lunes.",
    status: "sent",
    template: "Bienvenida",
    timestamp: new Date(Date.now() - 172800000),
  },
  {
    id: 3,
    recipient: "+1809-555-0003",
    content: "Recordatorio de pago: Tu mensualidad vence el 15 de este mes.",
    status: "failed",
    template: "Pagos",
    error: "Número no válido",
    timestamp: new Date(Date.now() - 259200000),
  },
])

const historyFilter = ref("all")
const searchQuery = ref("")
const currentPage = ref(1)
const itemsPerPage = 10

// Gestión de plantillas
const showCreateTemplate = ref(false)
const selectedCategory = ref("Todas")
const templateCategories = ["Todas", "Bienvenida", "Recordatorios", "Pagos", "Emergencia"]

// Computed properties
const messageStats = computed(() => {
  return {
    total: messages.value.length,
    sent: messages.value.filter((m) => m.status === "sent").length,
    failed: messages.value.filter((m) => m.status === "failed").length,
    pending: messages.value.filter((m) => m.status === "pending").length,
  }
})

const filteredMessages = computed(() => {
  let filtered = messages.value

  // Filtrar por estado
  if (historyFilter.value !== "all") {
    filtered = filtered.filter((m) => m.status === historyFilter.value)
  }

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (m) => m.recipient.toLowerCase().includes(query) || m.content.toLowerCase().includes(query)
    )
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredMessages.value.length / itemsPerPage))

const paginatedMessages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredMessages.value.slice(start, end)
})

const filteredTemplates = computed(() => {
  if (selectedCategory.value === "Todas") {
    return messageTemplates.value
  }
  return messageTemplates.value.filter((t) => t.category === selectedCategory.value)
})

// Métodos de conexión
const checkConnectionStatus = async () => {
  try {
    const response = await fetch("https://whatsappapi-4ffilcsmva-uc.a.run.app/status")
    if (response.ok) {
      const data = await response.json()
      console.log("📊 Estado WhatsApp:", data)

      if (data.status === "connected" && data.isReady) {
        connectionStatus.value = "connected"
      } else if (data.status === "qr_ready" || data.status === "connecting") {
        connectionStatus.value = "connecting"
        if (data.hasQR) {
          await loadQRCode()
        }
      } else {
        connectionStatus.value = "disconnected"
      }
    } else {
      connectionStatus.value = "disconnected"
    }
  } catch (error) {
    console.error("❌ Error verificando estado:", error)
    connectionStatus.value = "disconnected"
  }
}

const initializeConnection = async () => {
  isConnecting.value = true

  try {
    const response = await fetch("https://whatsappapi-4ffilcsmva-uc.a.run.app/init", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        connectionStatus.value = "connecting"
        // Esperar un poco y luego cargar el QR
        setTimeout(async () => {
          await loadQRCode()
          // Verificar estado periódicamente
          const interval = setInterval(async () => {
            await checkConnectionStatus()
            if (connectionStatus.value === "connected") {
              clearInterval(interval)
              isConnecting.value = false
            }
          }, 3000)
        }, 2000)
      }
    }
  } catch (error) {
    console.error("❌ Error inicializando:", error)
    connectionStatus.value = "disconnected"
  }
}

const loadQRCode = async () => {
  try {
    const response = await fetch(`https://whatsappapi-4ffilcsmva-uc.a.run.app/qr?t=${Date.now()}`)

    if (response.ok) {
      const contentType = response.headers.get("content-type")

      if (contentType?.includes("image/png")) {
        const blob = await response.blob()
        qrCode.value = URL.createObjectURL(blob)
      } else {
        // Si no es PNG, intentar nuevamente en unos segundos
        setTimeout(loadQRCode, 3000)
      }
    }
  } catch (error) {
    console.error("❌ Error cargando QR:", error)
  }
}

const disconnectWhatsApp = async () => {
  if (!confirm("¿Estás seguro de que quieres desconectar WhatsApp?")) {
    return
  }

  try {
    const response = await fetch("https://whatsappapi-4ffilcsmva-uc.a.run.app/disconnect", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
    })

    if (response.ok) {
      connectionStatus.value = "disconnected"
      qrCode.value = ""
      alert("✅ WhatsApp desconectado correctamente")
    }
  } catch (error) {
    console.error("❌ Error desconectando:", error)
    alert("❌ Error al desconectar WhatsApp")
  }
}

// Métodos de mensajes
const applyTemplate = () => {
  const template = messageTemplates.value.find((t) => t.id === selectedTemplate.value)
  if (template) {
    messageForm.content = template.content
  }
}

const selectTemplate = (template: any) => {
  selectedTemplate.value = template.id
  messageForm.content = template.content
  activeTab.value = "messages"
}

const useTemplate = (template: any) => {
  selectTemplate(template)
}

const sendMessage = async () => {
  if (!messageForm.recipient || !messageForm.content) return

  sendingMessage.value = true

  try {
    const response = await fetch("https://whatsappapi-4ffilcsmva-uc.a.run.app/send-message", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        number: messageForm.recipient,
        message: messageForm.content,
      }),
    })

    const result = await response.json()

    if (response.ok && result.success) {
      // Agregar al historial
      messages.value.unshift({
        id: Date.now(),
        recipient: messageForm.recipient,
        content: messageForm.content,
        status: "sent",
        template: selectedTemplate.value
          ? messageTemplates.value.find((t) => t.id === selectedTemplate.value)?.name
          : undefined,
        timestamp: new Date(),
      })

      alert("✅ Mensaje enviado correctamente!")
      clearMessage()
    } else {
      throw new Error(result.error || "Error al enviar mensaje")
    }
  } catch (error) {
    // Agregar al historial como fallido
    messages.value.unshift({
      id: Date.now(),
      recipient: messageForm.recipient,
      content: messageForm.content,
      status: "failed",
      error: error instanceof Error ? error.message : "Error desconocido",
      timestamp: new Date(),
    })

    alert(
      "❌ Error al enviar mensaje: " +
        (error instanceof Error ? error.message : "Error desconocido")
    )
  } finally {
    sendingMessage.value = false
  }
}

const clearMessage = () => {
  messageForm.recipient = ""
  messageForm.content = ""
  selectedTemplate.value = ""
}

// Métodos de envío masivo
const getBulkRecipientCount = () => {
  if (!bulkForm.recipients.trim()) return 0
  const numbers = bulkForm.recipients
    .split(/[,\n]/)
    .map((num) => num.trim())
    .filter((num) => num.length > 0)
  return numbers.length
}

const getEstimatedTime = () => {
  const count = getBulkRecipientCount()
  if (count === 0) return "0 segundos"

  const avgDelay = 1000 // 1 segundo promedio entre mensajes
  const totalMs = count * avgDelay
  const minutes = Math.floor(totalMs / 60000)
  const seconds = Math.floor((totalMs % 60000) / 1000)

  if (minutes > 0) {
    return `${minutes}m ${seconds}s aproximadamente`
  }
  return `${seconds}s aproximadamente`
}

const canSendBulk = () => {
  return (
    bulkForm.recipients.trim() &&
    bulkForm.message.trim() &&
    getBulkRecipientCount() > 0 &&
    getBulkRecipientCount() <= 50 // Límite de seguridad
  )
}

const applyBulkTemplate = () => {
  const template = messageTemplates.value.find((t) => t.id === bulkForm.selectedTemplate)
  if (template) {
    bulkForm.message = template.content
  }
}

const getBulkProgressPercent = () => {
  if (bulkProgress.total === 0) return 0
  return Math.round((bulkProgress.current / bulkProgress.total) * 100)
}

const formatTime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
}

const sendBulkMessage = async () => {
  if (!canSendBulk()) return

  // Parsear destinatarios
  const recipients = bulkForm.recipients
    .split(/[,\n]/)
    .map((num) => num.trim())
    .filter((num) => num.length > 0)

  if (recipients.length > 50) {
    alert(
      "⚠️ Máximo 50 destinatarios por lote para evitar bloqueos.\nDivide tu lista en lotes más pequeños."
    )
    return
  }

  if (
    !confirm(
      `¿Enviar mensaje a ${recipients.length} destinatarios?\n\nEsto puede tardar varios minutos.`
    )
  ) {
    return
  }

  sendingBulk.value = true
  bulkResults.value = null

  // Inicializar progreso
  bulkProgress.current = 0
  bulkProgress.total = recipients.length
  bulkProgress.successful = 0
  bulkProgress.failed = 0
  bulkProgress.remaining = recipients.length
  bulkProgress.startTime = Date.now()
  bulkProgress.elapsedTime = 0

  // Actualizar tiempo transcurrido cada segundo
  const timeInterval = setInterval(() => {
    bulkProgress.elapsedTime = Date.now() - bulkProgress.startTime
  }, 1000)

  try {
    console.log("📢 Iniciando envío masivo a", recipients.length, "destinatarios")

    // Enviar mensajes uno por uno con seguimiento en tiempo real
    const results = {
      successful: 0,
      failed: 0,
      details: [],
    }

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]
      bulkProgress.current = i + 1
      bulkProgress.currentRecipient = recipient
      bulkProgress.remaining = recipients.length - i - 1

      try {
        console.log(`📱 Enviando a ${recipient} (${i + 1}/${recipients.length})`)

        const response = await fetch("https://whatsappapi-4ffilcsmva-uc.a.run.app/send-message", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            recipient,
            message: bulkForm.message,
          }),
        })

        const result = await response.json()

        if (response.ok && result.success) {
          results.successful++
          bulkProgress.successful++
          results.details.push({
            recipient,
            status: "success",
            message: "Mensaje enviado correctamente",
          })

          // Agregar al historial
          messages.value.unshift({
            id: Date.now() + i,
            recipient,
            content: bulkForm.message,
            status: "sent",
            template: bulkForm.selectedTemplate
              ? messageTemplates.value.find((t) => t.id === bulkForm.selectedTemplate)?.name
              : "Envío Masivo",
            timestamp: new Date(),
          })
        } else {
          throw new Error(result.error || result.message || "Error desconocido")
        }
      } catch (error) {
        console.error(`❌ Error enviando a ${recipient}:`, error)
        results.failed++
        bulkProgress.failed++
        results.details.push({
          recipient,
          status: "error",
          message: error instanceof Error ? error.message : "Error desconocido",
        })

        // Agregar al historial como fallido
        messages.value.unshift({
          id: Date.now() + i,
          recipient,
          content: bulkForm.message,
          status: "failed",
          template: bulkForm.selectedTemplate
            ? messageTemplates.value.find((t) => t.id === bulkForm.selectedTemplate)?.name
            : "Envío Masivo",
          timestamp: new Date(),
        })
      }

      // Delay humanizado entre mensajes (500ms - 1.5s)
      if (i < recipients.length - 1) {
        const delay = 500 + Math.random() * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    bulkResults.value = results
    bulkProgress.currentRecipient = ""

    alert(
      `✅ Envío masivo completado!\n\n✅ Exitosos: ${results.successful}\n❌ Fallidos: ${results.failed}`
    )
  } catch (error) {
    console.error("❌ Error en envío masivo:", error)
    alert(
      "❌ Error en envío masivo: " + (error instanceof Error ? error.message : "Error desconocido")
    )
  } finally {
    clearInterval(timeInterval)
    sendingBulk.value = false
  }
}

const clearBulkForm = () => {
  bulkForm.recipients = ""
  bulkForm.message = ""
  bulkForm.selectedTemplate = ""
  bulkForm.validateNumbers = true
  bulkResults.value = null
  Object.assign(bulkProgress, {
    current: 0,
    total: 0,
    successful: 0,
    failed: 0,
    remaining: 0,
    currentRecipient: "",
    elapsedTime: 0,
    startTime: 0,
  })
}

const resetBulkResults = () => {
  bulkResults.value = null
}

// Métodos de historial
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    sent: "Enviado",
    failed: "Fallido",
    pending: "Pendiente",
  }
  return statusMap[status] || status
}

const retryMessage = async (message: any) => {
  messageForm.recipient = message.recipient
  messageForm.content = message.content
  activeTab.value = "messages"
}

const duplicateMessage = (message: any) => {
  messageForm.recipient = ""
  messageForm.content = message.content
  activeTab.value = "messages"
}

// Métodos de plantillas
const editTemplate = (template: any) => {
  // Implementar edición de plantilla
  console.log("Editar plantilla:", template)
}

const deleteTemplate = (templateId: string) => {
  if (confirm("¿Estás seguro de que quieres eliminar esta plantilla?")) {
    const index = messageTemplates.value.findIndex((t) => t.id === templateId)
    if (index > -1) {
      messageTemplates.value.splice(index, 1)
    }
  }
}

// Métodos de configuración
const saveConfig = async () => {
  saving.value = true

  try {
    // Simular guardado
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Configuración guardada:", {notifications, schedules, config})
    alert("✅ Configuración guardada correctamente")
  } catch (error) {
    console.error("Error guardando configuración:", error)
    alert("❌ Error al guardar la configuración")
  } finally {
    saving.value = false
  }
}

// Métodos utilitarios
const getStatusMessage = () => {
  switch (connectionStatus.value) {
    case "connected":
      return "Sistema activo y listo para enviar notificaciones automáticas"
    case "connecting":
      return "Estableciendo conexión... Escanea el código QR"
    case "disconnected":
      return "Desconectado. Necesitas vincular tu cuenta de WhatsApp"
    case "checking":
      return "Verificando estado de conexión..."
    default:
      return "Estado desconocido"
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

// Inicialización
onMounted(() => {
  checkConnectionStatus()
  // Verificar estado cada 30 segundos
  setInterval(checkConnectionStatus, 30000)
})
</script>

<style scoped>
.form-checkbox {
  @apply rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring focus:ring-green-500 focus:ring-opacity-50;
}

/* Asegurar que el contenido tenga suficiente espacio para el menú inferior */
.min-h-screen {
  min-height: calc(100vh - 5rem);
  padding-bottom: 6rem; /* Espacio extra para el menú footer */
}

/* Asegurar que los botones sean visibles y tengan z-index apropiado */
button {
  position: relative;
  z-index: 10;
}

/* Mejorar la visibilidad de elementos interactivos */
.bg-white,
.dark .bg-gray-800 {
  position: relative;
  z-index: 5;
}

/* Espaciado adicional en dispositivos móviles */
@media (max-width: 768px) {
  .min-h-screen {
    padding-bottom: 8rem;
  }
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
