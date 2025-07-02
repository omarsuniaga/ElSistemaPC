<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Panel de WhatsApp Business
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Sistema de notificaciones y comunicación automática para Music Academy
        </p>
      </div>

      <!-- Estado de Conexión -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div
              :class="[
                'w-4 h-4 rounded-full mr-4',
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500',
              ]"
            />
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{
                  connectionStatus === "connected"
                    ? "✅ WhatsApp Conectado"
                    : "❌ WhatsApp Desconectado"
                }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ getStatusMessage() }}
              </p>
            </div>
          </div>
          <div class="flex space-x-3">
            <button
              v-if="connectionStatus !== 'connected'"
              :disabled="isConnecting"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              @click="initializeConnection"
            >
              {{ isConnecting ? "Conectando..." : "� Conectar" }}
            </button>
            <button
              v-if="connectionStatus === 'connected'"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              @click="disconnectWhatsApp"
            >
              🔌 Desconectar
            </button>
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              @click="checkConnectionStatus"
            >
              🔄 Verificar
            </button>
          </div>
        </div>
      </div>

      <!-- Contenido condicional según el estado -->
      <div v-if="connectionStatus !== 'connected'">
        <!-- Sección de Conexión QR -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <div class="text-center">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Conectar WhatsApp Business
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mb-8">
              Escanea el código QR con WhatsApp para vincular tu cuenta
            </p>

            <!-- Contenedor del QR -->
            <div
              class="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-8 mb-6"
            >
              <div v-if="qrCode" class="mb-4">
                <img
                  :src="qrCode"
                  alt="QR Code"
                  class="w-64 h-64 border-4 border-green-500 rounded-lg bg-white p-4"
                />
              </div>
              <div
                v-else
                class="w-64 h-64 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
              >
                <div class="text-center">
                  <div
                    v-if="isConnecting"
                    class="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
                  />
                  <p class="text-gray-500 dark:text-gray-400">
                    {{
                      isConnecting
                        ? "Generando código QR..."
                        : 'Haz clic en "Conectar" para generar el QR'
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Instrucciones -->
            <div
              class="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6"
            >
              <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
                📱 Instrucciones para conectar
              </h3>
              <ol class="text-left text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <li><strong>1.</strong> Abre WhatsApp en tu teléfono</li>
                <li>
                  <strong>2.</strong> Ve a <strong>Configuración → Dispositivos vinculados</strong>
                </li>
                <li><strong>3.</strong> Toca <strong>"Vincular un dispositivo"</strong></li>
                <li><strong>4.</strong> Escanea el código QR de arriba</li>
                <li><strong>5.</strong> Confirma la vinculación en tu teléfono</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <!-- Panel Principal - Solo cuando está conectado -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="flex" aria-label="Tabs">
              <button
                v-for="tab in businessTabs"
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

        <!-- Contenido de tabs para usuarios conectados -->
        <div class="space-y-6">
          <!-- Tab: Enviar Mensajes -->
          <div v-if="activeTab === 'messages'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Panel de envío -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📤 Enviar Mensaje
              </h2>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Destinatario
                  </label>
                  <input
                    v-model="messageForm.recipient"
                    type="tel"
                    placeholder="+1 (809) 123-4567"
                    class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plantilla de mensaje
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
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <div
                  v-for="template in messageTemplates"
                  :key="template.id"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  @click="selectTemplate(template)"
                >
                  <h3 class="font-medium text-gray-900 dark:text-white">{{ template.name }}</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {{ template.content }}
                  </p>
                  <span
                    class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2"
                  >
                    {{ template.category }}
                  </span>
                </div>
              </div>

              <button
                class="w-full mt-4 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                @click="showCreateTemplate = true"
              >
                ➕ Crear nueva plantilla
              </button>
            </div>
          </div>

          <!-- Tab: Configuración -->
          <div
            v-if="activeTab === 'config'"
            class="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              ⚙️ Configuración del Sistema
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Configuración de Notificaciones -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  📢 Notificaciones Automáticas
                </h3>
                <div class="space-y-4">
                  <label class="flex items-center">
                    <input
                      v-model="notifications.newStudent"
                      type="checkbox"
                      class="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <span class="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      <strong>Nuevos estudiantes</strong>
                      <div class="text-xs text-gray-500">Mensaje de bienvenida automático</div>
                    </span>
                  </label>

                  <label class="flex items-center">
                    <input
                      v-model="notifications.classReminder"
                      type="checkbox"
                      class="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <span class="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      <strong>Recordatorios de clase</strong>
                      <div class="text-xs text-gray-500">24 horas antes de la clase</div>
                    </span>
                  </label>

                  <label class="flex items-center">
                    <input
                      v-model="notifications.payment"
                      type="checkbox"
                      class="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <span class="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      <strong>Recordatorios de pago</strong>
                      <div class="text-xs text-gray-500">3 días antes del vencimiento</div>
                    </span>
                  </label>

                  <label class="flex items-center">
                    <input
                      v-model="notifications.emergencyClass"
                      type="checkbox"
                      class="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <span class="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      <strong>Clases de emergencia</strong>
                      <div class="text-xs text-gray-500">Notificación inmediata</div>
                    </span>
                  </label>
                </div>
              </div>

              <!-- Horarios de Envío -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  🕐 Horarios de Envío
                </h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recordatorios de clase
                    </label>
                    <input
                      v-model="schedules.classReminder"
                      type="time"
                      class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recordatorios de pago
                    </label>
                    <input
                      v-model="schedules.paymentReminder"
                      type="time"
                      class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Límite nocturno (no enviar después de)
                    </label>
                    <input
                      v-model="schedules.nightLimit"
                      type="time"
                      class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Inicio matutino (no enviar antes de)
                    </label>
                    <input
                      v-model="schedules.morningStart"
                      type="time"
                      class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Configuraciones adicionales -->
            <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                🔧 Configuraciones Avanzadas
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reintentos por mensaje fallido
                  </label>
                  <select
                    v-model="config.retryAttempts"
                    class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="1">1 intento</option>
                    <option value="2">2 intentos</option>
                    <option value="3">3 intentos</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Delay entre mensajes (segundos)
                  </label>
                  <input
                    v-model.number="config.messageDelay"
                    type="number"
                    min="1"
                    max="60"
                    class="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <!-- Botón guardar -->
            <div class="mt-8">
              <button
                :disabled="saving"
                class="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                @click="saveConfig"
              >
                {{ saving ? "Guardando..." : "💾 Guardar Configuración" }}
              </button>
            </div>
          </div>

          <!-- Tab: Historial -->
          <div
            v-if="activeTab === 'history'"
            class="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                📊 Historial de Mensajes
              </h2>

              <!-- Filtros -->
              <div class="flex space-x-3">
                <select
                  v-model="historyFilter"
                  class="border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">Todos</option>
                  <option value="sent">Enviados</option>
                  <option value="failed">Fallidos</option>
                  <option value="pending">Pendientes</option>
                </select>

                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Buscar por número o mensaje..."
                  class="border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <!-- Estadísticas rápidas -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                <h3 class="text-lg font-bold text-green-800 dark:text-green-200">
                  {{ messageStats.sent }}
                </h3>
                <p class="text-sm text-green-600 dark:text-green-300">Enviados</p>
              </div>
              <div class="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
                <h3 class="text-lg font-bold text-red-800 dark:text-red-200">
                  {{ messageStats.failed }}
                </h3>
                <p class="text-sm text-red-600 dark:text-red-300">Fallidos</p>
              </div>
              <div class="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                <h3 class="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                  {{ messageStats.pending }}
                </h3>
                <p class="text-sm text-yellow-600 dark:text-yellow-300">Pendientes</p>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <h3 class="text-lg font-bold text-blue-800 dark:text-blue-200">
                  {{ messageStats.total }}
                </h3>
                <p class="text-sm text-blue-600 dark:text-blue-300">Total</p>
              </div>
            </div>

            <!-- Lista de mensajes -->
            <div class="space-y-4">
              <div
                v-if="filteredMessages.length === 0"
                class="text-center py-12 text-gray-500 dark:text-gray-400"
              >
                <div class="text-4xl mb-4">📭</div>
                <p>No hay mensajes que coincidan con los filtros</p>
              </div>

              <div
                v-for="message in paginatedMessages"
                :key="message.id"
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="flex justify-between items-start mb-3">
                  <div class="flex items-center space-x-3">
                    <span class="font-medium text-gray-900 dark:text-white">{{
                      message.recipient
                    }}</span>
                    <span
                      :class="[
                        'px-3 py-1 text-xs rounded-full font-medium',
                        message.status === 'sent'
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                          : message.status === 'failed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
                      ]"
                    >
                      {{ getStatusText(message.status) }}
                    </span>
                    <span
                      v-if="message.template"
                      class="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 rounded"
                    >
                      {{ message.template }}
                    </span>
                  </div>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{
                    formatDate(message.timestamp)
                  }}</span>
                </div>

                <p class="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                  {{ message.content }}
                </p>

                <div
                  v-if="message.error"
                  class="text-xs text-red-600 dark:text-red-400 mt-2 p-2 bg-red-50 dark:bg-red-900 rounded"
                >
                  Error: {{ message.error }}
                </div>

                <div class="flex justify-between items-center mt-3 text-xs text-gray-500">
                  <span>ID: {{ message.id }}</span>
                  <div class="flex space-x-2">
                    <button
                      v-if="message.status === 'failed'"
                      class="text-blue-600 hover:text-blue-800"
                      @click="retryMessage(message)"
                    >
                      🔄 Reintentar
                    </button>
                    <button
                      class="text-green-600 hover:text-green-800"
                      @click="duplicateMessage(message)"
                    >
                      📋 Duplicar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Paginación -->
            <div v-if="totalPages > 1" class="mt-6 flex justify-center">
              <nav class="flex space-x-2">
                <button
                  :disabled="currentPage === 1"
                  class="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                  @click="currentPage--"
                >
                  Anterior
                </button>

                <span class="px-3 py-2 text-sm text-gray-700">
                  Página {{ currentPage }} de {{ totalPages }}
                </span>

                <button
                  :disabled="currentPage === totalPages"
                  class="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                  @click="currentPage++"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>

          <!-- Tab: Plantillas -->
          <div
            v-if="activeTab === 'templates'"
            class="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                📝 Gestión de Plantillas
              </h2>
              <button
                class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                @click="showCreateTemplate = true"
              >
                ➕ Nueva Plantilla
              </button>
            </div>

            <!-- Categorías de plantillas -->
            <div class="mb-6">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="category in templateCategories"
                  :key="category"
                  :class="[
                    'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                    selectedCategory === category
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                  ]"
                  @click="selectedCategory = category"
                >
                  {{ category }}
                </button>
              </div>
            </div>

            <!-- Grid de plantillas -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="template in filteredTemplates"
                :key="template.id"
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div class="flex justify-between items-start mb-3">
                  <h3 class="font-medium text-gray-900 dark:text-white">{{ template.name }}</h3>
                  <div class="flex space-x-1">
                    <button
                      class="text-blue-600 hover:text-blue-800 text-sm"
                      @click="editTemplate(template)"
                    >
                      ✏️
                    </button>
                    <button
                      class="text-red-600 hover:text-red-800 text-sm"
                      @click="deleteTemplate(template.id)"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <p class="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                  {{ template.content }}
                </p>

                <div class="flex justify-between items-center">
                  <span
                    class="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 rounded"
                  >
                    {{ template.category }}
                  </span>
                  <button
                    class="text-sm text-green-600 hover:text-green-800 font-medium"
                    @click="useTemplate(template)"
                  >
                    Usar →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from "vue"
import {QrCodeIcon, CogIcon, ClockIcon, PaperAirplaneIcon} from "@heroicons/vue/24/outline"
import WhatsAppQR from "@/components/WhatsAppQR.vue"
import {useWhatsApp} from "@/composables/useWhatsApp"

// Estado de las tabs
const activeTab = ref("qr")
const isInitializing = ref(false)

const tabs = [
  {id: "qr", name: "Conexión QR", icon: QrCodeIcon},
  {id: "config", name: "Configuración", icon: CogIcon},
  {id: "history", name: "Historial", icon: ClockIcon},
  {id: "test", name: "Prueba", icon: PaperAirplaneIcon},
]

// Estado de configuración
const notifications = reactive({
  newStudent: true,
  classReminder: true,
  payment: true,
})

const schedules = reactive({
  classReminder: "09:00",
  paymentReminder: "18:00",
})

const saving = ref(false)

// Estado de historial de mensajes
const messages = ref([
  {
    id: 1,
    recipient: "+1234567890",
    content: "Recordatorio: Tienes clase de piano mañana a las 3:00 PM",
    status: "sent",
    timestamp: new Date(Date.now() - 86400000), // Ayer
  },
  {
    id: 2,
    recipient: "+0987654321",
    content: "Bienvenido a la Academia Musical! Tu primera clase será el lunes.",
    status: "sent",
    timestamp: new Date(Date.now() - 172800000), // Hace 2 días
  },
])

// Estado de mensaje de prueba
const testMessage = reactive({
  phone: "",
  content:
    "🎵 Mensaje de prueba desde la Academia Musical!\n\nEste es un mensaje de prueba para verificar que WhatsApp está funcionando correctamente.",
})

const sendingTest = ref(false)

// Estado de conexión de WhatsApp
const connectionStatus = ref("checking")

// Métodos
const checkFunctionStatus = async () => {
  try {
    const response = await fetch("https://whatsappapi-4ffilcsmva-uc.a.run.app/status")
    if (response.ok) {
      const data = await response.json()
      console.log("📊 Estado WhatsApp:", data)

      if (data.status === "connected" && data.isReady) {
        connectionStatus.value = "connected"
      } else if (data.status === "qr_ready" || data.status === "connecting") {
        connectionStatus.value = "connecting"
      } else {
        connectionStatus.value = "function-not-available"
      }
    } else {
      connectionStatus.value = "function-not-available"
    }
  } catch (error) {
    console.error("❌ Error verificando estado:", error)
    connectionStatus.value = "function-not-available"
  }
}

const openConnectionPage = () => {
  // Abrir la página de conexión simplificada
  window.open("/whatsapp-connection.html", "_blank", "width=600,height=800")
}

const disconnectWhatsApp = async () => {
  if (!confirm("¿Estás seguro de que quieres desconectar WhatsApp?")) {
    return
  }

  try {
    console.log("� Desconectando WhatsApp...")

    const response = await fetch("https://whatsappapi-4ffilcsmva-uc.a.run.app/disconnect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const result = await response.json()
      console.log("✅ WhatsApp desconectado:", result)
      connectionStatus.value = "function-not-available"
      alert("✅ WhatsApp desconectado correctamente")
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || errorData.message || "Error al desconectar")
    }
  } catch (error) {
    console.error("❌ Error desconectando WhatsApp:", error)
    alert(
      "❌ Error al desconectar: " + (error instanceof Error ? error.message : "Error desconocido")
    )
  }
}

const getStatusMessage = () => {
  switch (connectionStatus.value) {
    case "connected":
      return "WhatsApp conectado y listo para enviar mensajes"
    case "function-not-available":
      return 'WhatsApp desconectado. Haz clic en "Conectar WhatsApp"'
    case "checking":
      return "Verificando estado..."
    default:
      return "Estado desconocido"
  }
}

const saveConfig = async () => {
  saving.value = true

  try {
    // Simular guardado de configuración
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Aquí guardarías la configuración en Firestore o tu backend
    console.log("Configuración guardada:", {notifications, schedules})

    alert("✅ Configuración guardada correctamente")
  } catch (error) {
    console.error("Error guardando configuración:", error)
    alert("❌ Error al guardar la configuración")
  } finally {
    saving.value = false
  }
}

const sendTestMessage = async () => {
  if (!testMessage.phone || !testMessage.content) return

  sendingTest.value = true

  try {
    console.log("📱 Enviando mensaje de prueba...", {
      phone: testMessage.phone,
      message: testMessage.content,
    })

    // Usar la nueva URL correcta de Firebase Functions
    const response = await fetch("https://whatsappapi-4ffilcsmva-uc.a.run.app/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: testMessage.phone, // Cambio: usar 'number' en lugar de 'phoneNumber'
        message: testMessage.content,
      }),
    })

    const result = await response.json()
    console.log("📊 Respuesta del servidor:", result)

    if (response.ok && result.success) {
      alert("✅ Mensaje enviado correctamente!\n\nDetalles: " + (result.messageId || "Enviado"))

      // Agregar al historial
      messages.value.unshift({
        id: Date.now(),
        recipient: testMessage.phone,
        content: testMessage.content,
        status: "sent",
        timestamp: new Date(),
      })

      // Limpiar formulario
      testMessage.phone = ""
      testMessage.content =
        "🎵 Mensaje de prueba desde la Academia Musical!\n\nEste es un mensaje de prueba para verificar que WhatsApp está funcionando correctamente."
    } else {
      throw new Error(result.error || result.message || "Error desconocido al enviar mensaje")
    }
  } catch (error) {
    console.error("❌ Error enviando mensaje:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    alert(
      "❌ Error al enviar mensaje:\n\n" +
        errorMessage +
        "\n\nVerifica que WhatsApp esté conectado correctamente."
    )

    // Agregar al historial como error
    messages.value.unshift({
      id: Date.now(),
      recipient: testMessage.phone,
      content: testMessage.content,
      status: "error",
      timestamp: new Date(),
    })
  } finally {
    sendingTest.value = false
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

const goToQRConnection = () => {
  // Abrir la página de conexión en una nueva ventana
  window.open("/whatsapp-connection.html", "_blank", "width=800,height=600")
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
</style>
