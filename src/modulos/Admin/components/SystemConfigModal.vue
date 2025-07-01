<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
    >
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <CogIcon class="w-6 h-6 mr-2 text-orange-500" />
            Configuración del Sistema
          </h2>
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="$emit('close')"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Configuraciones avanzadas del sistema</p>
      </div>

      <div class="p-6">
        <div class="space-y-8">
          <!-- General Settings -->
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <ServerIcon class="w-5 h-5 mr-2 text-blue-500" />
              Configuración General
            </h3>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Sistema
                  </label>
                  <input
                    v-model="config.systemName"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zona Horaria
                  </label>
                  <select
                    v-model="config.timezone"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  >
                    <option value="America/Mexico_City">Ciudad de México</option>
                    <option value="America/Cancun">Cancún</option>
                    <option value="America/Mazatlan">Mazatlán</option>
                    <option value="America/Tijuana">Tijuana</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Idioma por Defecto
                  </label>
                  <select
                    v-model="config.defaultLanguage"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tema por Defecto
                  </label>
                  <select
                    v-model="config.defaultTheme"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                    <option value="system">Sistema</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Security Settings -->
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <ShieldCheckIcon class="w-5 h-5 mr-2 text-green-500" />
              Configuración de Seguridad
            </h3>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duración de Sesión (minutos)
                  </label>
                  <input
                    v-model="config.sessionDuration"
                    type="number"
                    min="30"
                    max="480"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Intentos de Login Máximos
                  </label>
                  <input
                    v-model="config.maxLoginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div class="space-y-3">
                <label class="flex items-center space-x-3">
                  <input
                    v-model="config.requireTwoFactor"
                    type="checkbox"
                    class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Requerir autenticación de dos factores
                  </span>
                </label>

                <label class="flex items-center space-x-3">
                  <input
                    v-model="config.logUserActivity"
                    type="checkbox"
                    class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Registrar actividad de usuarios
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- Notification Settings -->
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <BellIcon class="w-5 h-5 mr-2 text-purple-500" />
              Configuración de Notificaciones
            </h3>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
              <div class="space-y-3">
                <label class="flex items-center space-x-3">
                  <input
                    v-model="config.emailNotifications"
                    type="checkbox"
                    class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notificaciones por email
                  </span>
                </label>

                <label class="flex items-center space-x-3">
                  <input
                    v-model="config.smsNotifications"
                    type="checkbox"
                    class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notificaciones por SMS
                  </span>
                </label>

                <label class="flex items-center space-x-3">
                  <input
                    v-model="config.pushNotifications"
                    type="checkbox"
                    class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notificaciones push
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- Backup Settings -->
          <div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <CloudArrowUpIcon class="w-5 h-5 mr-2 text-indigo-500" />
              Configuración de Respaldos
            </h3>
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frecuencia de Respaldo
                  </label>
                  <select
                    v-model="config.backupFrequency"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Retención (días)
                  </label>
                  <input
                    v-model="config.backupRetention"
                    type="number"
                    min="7"
                    max="365"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div
          class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700 mt-8"
        >
          <button
            type="button"
            class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="$emit('close')"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
            @click="handleSave"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue"
import {
  XMarkIcon,
  CogIcon,
  ServerIcon,
  ShieldCheckIcon,
  BellIcon,
  CloudArrowUpIcon,
} from "@heroicons/vue/24/outline"

const emit = defineEmits<{
  close: []
  updated: [config: any]
}>()

const config = ref({
  systemName: "Music Academy Manager",
  timezone: "America/Mexico_City",
  defaultLanguage: "es",
  defaultTheme: "light",
  sessionDuration: 120,
  maxLoginAttempts: 5,
  requireTwoFactor: false,
  logUserActivity: true,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  backupFrequency: "daily",
  backupRetention: 30,
})

const handleSave = async () => {
  try {
    console.log("Saving system config:", config.value)

    // Here you would call your API to save the configuration
    // await updateSystemConfig(config.value)

    emit("updated", config.value)
    emit("close")
  } catch (error) {
    console.error("Error saving system config:", error)
  }
}
</script>
