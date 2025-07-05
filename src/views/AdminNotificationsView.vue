<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-2 sm:p-4 lg:p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div>
          <h1
            class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center"
          >
            <svg
              class="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 mr-2 sm:mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-5 5v-5zM21 7l-5-5v5h5zM7 7l5-5v5H7zM12 2v10M12 12v10"
              />
            </svg>
            <span class="hidden sm:inline">Gestión de Notificaciones</span>
            <span class="sm:hidden">Notificaciones</span>
          </h1>
          <p class="text-sm sm:text-lg text-gray-600 dark:text-gray-300 mt-1">
            Panel administrativo para gestionar todas las notificaciones del sistema
          </p>
        </div>

        <button
          :disabled="state.isLoading"
          class="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors w-full sm:w-auto justify-center"
          @click="refreshData"
        >
          <svg
            class="w-4 h-4 sm:w-5 sm:h-5"
            :class="{'animate-spin': state.isLoading}"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Actualizar</span>
        </button>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 text-center hover:shadow-md dark:hover:shadow-lg transition-shadow"
        >
          <svg
            class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600 dark:text-blue-400 mx-auto mb-2 sm:mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-5 5v-5zM21 7l-5-5v5h5z"
            />
          </svg>
          <h3 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            {{ state.stats.total }}
          </h3>
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total</p>
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 text-center hover:shadow-md dark:hover:shadow-lg transition-shadow"
        >
          <svg
            class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-red-600 dark:text-red-400 mx-auto mb-2 sm:mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            {{ state.stats.unread }}
          </h3>
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">No Leídas</p>
        </div>

        <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow"
        >
          <svg
            class="w-12 h-12 text-orange-600 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 class="text-3xl font-bold text-gray-900">{{ state.stats.byUrgency.high || 0 }}</h3>
          <p class="text-sm text-gray-600">Urgentes</p>
        </div>

        <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow"
        >
          <svg
            class="w-12 h-12 text-green-600 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 class="text-3xl font-bold text-gray-900">
            {{ state.stats.byType.teacher_login || 0 }}
          </h3>
          <p class="text-sm text-gray-600">Logins Hoy</p>
        </div>
      </div>

      <!-- Panel de notificaciones -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <AdminNotificationsPanel />
        </div>

        <!-- Panel lateral con controles -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-5">
            <div class="p-6 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                <svg
                  class="w-5 h-5 text-blue-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Controles de Administración
              </h3>
            </div>

            <div class="p-6">
              <!-- Filtros -->
              <div class="mb-6">
                <h4 class="text-sm font-medium text-gray-900 mb-3">Filtros</h4>

                <div class="space-y-3">
                  <div>
                    <label class="block text-sm text-gray-700 mb-1">Tipo de Notificación</label>
                    <select
                      v-model="selectedType"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos los tipos</option>
                      <option
                        v-for="type in notificationTypes"
                        :key="type.value"
                        :value="type.value"
                      >
                        {{ type.title }}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm text-gray-700 mb-1">Nivel de Urgencia</label>
                    <select
                      v-model="selectedUrgency"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos los niveles</option>
                      <option
                        v-for="level in urgencyLevels"
                        :key="level.value"
                        :value="level.value"
                      >
                        {{ level.title }}
                      </option>
                    </select>
                  </div>

                  <label class="flex items-center">
                    <input
                      v-model="onlyUnread"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="ml-2 text-sm text-gray-700">Solo no leídas</span>
                  </label>
                </div>
              </div>

              <div class="border-t border-gray-200 my-6" />

              <!-- Acciones masivas -->
              <div class="mb-6">
                <h4 class="text-sm font-medium text-gray-900 mb-3">Acciones Masivas</h4>

                <div class="space-y-2">
                  <button
                    :disabled="state.stats.unread === 0"
                    class="w-full bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed text-blue-700 border border-blue-200 px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-colors"
                    @click="markAllAsRead"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Marcar Todas como Leídas</span>
                  </button>

                  <button
                    class="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-colors"
                    @click="showCleanupDialog = true"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Limpiar Notificaciones Antiguas</span>
                  </button>

                  <button
                    :disabled="state.stats.total === 0"
                    class="w-full bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-red-700 border border-red-200 px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-colors"
                    @click="showClearAllDialog = true"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Eliminar Todas</span>
                  </button>
                </div>
              </div>

              <div class="border-t border-gray-200 my-6" />

              <!-- Información del sistema -->
              <div class="mb-6">
                <h4 class="text-sm font-medium text-gray-900 mb-3">Información</h4>

                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Última actualización</span>
                    <span class="text-sm text-gray-900">{{ lastUpdate }}</span>
                  </div>

                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Estado del sistema</span>
                    <span
                      :class="systemStatus.classes"
                      class="px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {{ systemStatus.text }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Gráfico de notificaciones por tipo -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
            <div class="p-6 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">Distribución por Tipo</h3>
            </div>
            <div class="p-6">
              <div class="space-y-3 max-h-48 overflow-y-auto">
                <div
                  v-for="(count, type) in state.stats.byType"
                  :key="type"
                  class="flex items-center justify-between"
                >
                  <span class="text-sm text-gray-600">{{ getTypeLabel(type) }}</span>
                  <span
                    class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ count }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog para limpiar notificaciones antiguas -->
    <div
      v-if="showCleanupDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 flex items-center">
            <svg
              class="w-5 h-5 text-yellow-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Limpiar Notificaciones Antiguas
          </h3>
        </div>

        <div class="p-6">
          <p class="text-gray-700 mb-4">
            Esta acción eliminará todas las notificaciones más antiguas que:
          </p>

          <div>
            <label class="block text-sm text-gray-700 mb-1">Período</label>
            <select
              v-model="cleanupPeriod"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option v-for="option in cleanupOptions" :key="option.value" :value="option.value">
                {{ option.title }}
              </option>
            </select>
          </div>

          <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div class="flex">
              <svg
                class="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p class="text-sm text-yellow-800">
                Esta acción no se puede deshacer. Se eliminarán permanentemente las notificaciones
                seleccionadas.
              </p>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            @click="showCleanupDialog = false"
          >
            Cancelar
          </button>
          <button
            :disabled="cleanupLoading"
            class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md flex items-center space-x-2 transition-colors"
            @click="cleanupOldNotifications"
          >
            <svg
              v-if="cleanupLoading"
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Limpiar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Dialog para confirmar eliminación total -->
    <div
      v-if="showClearAllDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 flex items-center">
            <svg
              class="w-5 h-5 text-red-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Eliminar Todas las Notificaciones
          </h3>
        </div>

        <div class="p-6">
          <div class="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
            <div class="flex">
              <svg
                class="w-5 h-5 text-red-600 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <p class="text-sm font-medium text-red-800">¡ATENCIÓN!</p>
                <p class="text-sm text-red-700">
                  Esta acción eliminará TODAS las notificaciones de forma permanente. Esta acción no
                  se puede deshacer.
                </p>
              </div>
            </div>
          </div>

          <p class="text-gray-700 mb-4">
            Se eliminarán <strong>{{ state.stats.total }}</strong> notificaciones.
          </p>

          <div>
            <label class="block text-sm text-gray-700 mb-1"
              >Escribe "ELIMINAR TODO" para confirmar</label
            >
            <input
              v-model="confirmationText"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="ELIMINAR TODO"
            />
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            @click="((showClearAllDialog = false), (confirmationText = ''))"
          >
            Cancelar
          </button>
          <button
            :disabled="confirmationText !== 'ELIMINAR TODO' || clearAllLoading"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md flex items-center space-x-2 transition-colors"
            @click="handleClearAll"
          >
            <svg
              v-if="clearAllLoading"
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Eliminar Todo</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useAdminNotifications} from "@/composables/useAdminNotifications"
import AdminNotificationsPanel from "@/components/AdminNotificationsPanel.vue"

// Composable
const {state, markAllAsRead, clearAllNotifications, loadNotifications} = useAdminNotifications()

// Estado local
const selectedType = ref("")
const selectedUrgency = ref("")
const onlyUnread = ref(false)
const showCleanupDialog = ref(false)
const showClearAllDialog = ref(false)
const cleanupPeriod = ref(30)
const cleanupLoading = ref(false)
const clearAllLoading = ref(false)
const confirmationText = ref("")
const lastUpdate = ref(new Date().toLocaleString())

// Opciones para filtros
const notificationTypes = [
  {value: "teacher_login", title: "Login de Profesor"},
  {value: "attendance_report", title: "Reporte de Asistencia"},
  {value: "student_observation", title: "Observación de Estudiante"},
  {value: "system_notification", title: "Notificación del Sistema"},
]

const urgencyLevels = [
  {value: "high", title: "Alta"},
  {value: "medium", title: "Media"},
  {value: "low", title: "Baja"},
]

const cleanupOptions = [
  {value: 7, title: "7 días"},
  {value: 30, title: "30 días"},
  {value: 60, title: "60 días"},
  {value: 90, title: "90 días"},
]

// Computed
const systemStatus = computed(() => {
  if (state.error) {
    return {
      text: "Error",
      classes: "bg-red-100 text-red-800",
    }
  } else if (state.isLoading) {
    return {
      text: "Cargando",
      classes: "bg-yellow-100 text-yellow-800",
    }
  } else {
    return {
      text: "Activo",
      classes: "bg-green-100 text-green-800",
    }
  }
})

// Métodos
const refreshData = async () => {
  await loadNotifications()
  lastUpdate.value = new Date().toLocaleString()
}

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    teacher_login: "Login Profesor",
    attendance_report: "Asistencia",
    student_observation: "Observación",
    system_notification: "Sistema",
  }
  return labels[type] || type
}

const cleanupOldNotifications = async () => {
  cleanupLoading.value = true
  try {
    // Aquí implementarías la lógica para limpiar notificaciones antiguas
    // Por ahora, simularemos la operación
    await new Promise((resolve) => setTimeout(resolve, 2000))

    showCleanupDialog.value = false
    await refreshData()

    console.log(`Notificaciones más antiguas que ${cleanupPeriod.value} días eliminadas`)
  } catch (error) {
    console.error("Error limpiando notificaciones antiguas:", error)
  } finally {
    cleanupLoading.value = false
  }
}

const handleClearAll = async () => {
  clearAllLoading.value = true
  try {
    await clearAllNotifications()
    showClearAllDialog.value = false
    confirmationText.value = ""
    await refreshData()
  } catch (error) {
    console.error("Error eliminando todas las notificaciones:", error)
  } finally {
    clearAllLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
/* Los estilos ahora están principalmente manejados por Tailwind CSS */
/* Solo mantenemos algunos estilos personalizados si es necesario */
</style>
