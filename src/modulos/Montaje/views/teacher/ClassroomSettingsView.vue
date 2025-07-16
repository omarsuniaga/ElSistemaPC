<template>
  <div class="classroom-settings-container min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        ⚙️ Configuración del Aula
      </h1>

      <p class="text-gray-600 dark:text-gray-300 mb-8">
        Aquí puedes personalizar los ajustes de tu aula virtual, incluyendo preferencias de notificación,
        configuración de instrumentos predeterminados y otras opciones relevantes para tu enseñanza.
      </p>

      <div v-if="isLoading" class="text-center py-8">
        <p class="text-blue-600 dark:text-blue-400">Cargando configuración...</p>
      </div>

      <div v-else-if="error" class="text-center py-8 text-red-600 dark:text-red-400">
        <p>{{ error }}</p>
      </div>

      <form v-else @submit.prevent="saveSettings" class="space-y-6">
        <!-- Sección de Notificaciones -->
        <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Notificaciones
          </h2>
          <div class="flex items-center justify-between">
            <label for="emailNotifications" class="text-gray-700 dark:text-gray-300 cursor-pointer">
              Recibir notificaciones por correo electrónico
            </label>
            <input
              type="checkbox"
              id="emailNotifications"
              v-model="settings.emailNotifications"
              class="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Recibe alertas importantes sobre el progreso de tus alumnos y nuevas asignaciones.
          </p>
        </div>

        <!-- Sección de Instrumentos Predeterminados -->
        <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Instrumentos Predeterminados
          </h2>
          <div class="space-y-4">
            <div>
              <label for="defaultInstrument" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Instrumento principal para nuevas obras:
              </label>
              <select
                id="defaultInstrument"
                v-model="settings.defaultInstrument"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Selecciona un instrumento</option>
                <option value="piano">Piano</option>
                <option value="violin">Violín</option>
                <option value="guitarra">Guitarra</option>
                <option value="flauta">Flauta</option>
                <option value="canto">Canto</option>
              </select>
            </div>
            <div>
              <label for="maxStudentsPerClass" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número máximo de alumnos por clase:
              </label>
              <input
                type="number"
                id="maxStudentsPerClass"
                v-model.number="settings.maxStudentsPerClass"
                min="1"
                class="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        <!-- Sección de Integraciones -->
        <div>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Integraciones
          </h2>
          <div class="flex items-center justify-between">
            <label for="googleCalendarSync" class="text-gray-700 dark:text-gray-300 cursor-pointer">
              Sincronizar con Google Calendar
            </label>
            <input
              type="checkbox"
              id="googleCalendarSync"
              v-model="settings.googleCalendarSync"
              class="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Permite que tus clases y eventos se sincronicen automáticamente con tu calendario de Google.
          </p>
        </div>

        <!-- Botón de Guardar -->
        <div class="pt-6">
          <button
            type="submit"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClassroomSettings } from '../../composables/useClassroomSettings';

const { settings, isLoading, error, saveSettings } = useClassroomSettings();
</script>

<style scoped>
/* Puedes añadir estilos específicos aquí si es necesario */
</style>
