<template>
  <div
    class="min-h-screen bg-gradient-to-br mb-16 from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6"
  >
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Panel de Administración Central
      </h1>

      <!-- Debug Section: Redirection Info -->
      <div v-if="isDev" class="bg-blue-900 text-white rounded-xl shadow-lg p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">🔧 Debug: Sistema de Redirecciones</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 class="font-medium mb-2">Estado del Usuario:</h3>
            <ul class="space-y-1">
              <li><strong>Rol:</strong> {{ userRole || "No definido" }}</li>
              <li><strong>Es Admin:</strong> {{ isAdminRole ? "Sí" : "No" }}</li>
              <li><strong>Ruta Actual:</strong> {{ currentRoute }}</li>
            </ul>
          </div>
          <div>
            <h3 class="font-medium mb-2">Rutas de Prueba:</h3>
            <div class="space-y-2">
              <router-link
                to="/classes"
                class="block bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded transition-colors"
              >
                Probar: /classes →
                {{ shouldRedirectToAdmin("/classes") ? "/admin/classes" : "Sin redirección" }}
              </router-link>
              <router-link
                to="/teachers"
                class="block bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded transition-colors"
              >
                Probar: /teachers →
                {{ shouldRedirectToAdmin("/teachers") ? "/admin/teachers" : "Sin redirección" }}
              </router-link>
              <router-link
                to="/students"
                class="block bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded transition-colors"
              >
                Probar: /students →
                {{ shouldRedirectToAdmin("/students") ? "/admin/students" : "Sin redirección" }}
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Sección: Gestión de Usuarios -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Gestión de Usuarios
          </h2>
          <div class="space-y-3">
            <router-link
              to="/admin/users"
              class="block bg-blue-100 dark:bg-blue-700/30 hover:bg-blue-200 dark:hover:bg-blue-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-blue-800 dark:text-blue-200">Gestión de Usuarios</h3>
              <p class="text-sm text-blue-600 dark:text-blue-400">
                Administra todos los usuarios del sistema.
              </p>
            </router-link>
            <router-link
              to="/admin/students"
              class="block bg-green-100 dark:bg-green-700/30 hover:bg-green-200 dark:hover:bg-green-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-green-800 dark:text-green-200">Gestión de Estudiantes</h3>
              <p class="text-sm text-green-600 dark:text-green-400">
                Administra la información de los estudiantes.
              </p>
            </router-link>
            <router-link
              to="/admin/teachers"
              class="block bg-purple-100 dark:bg-purple-700/30 hover:bg-purple-200 dark:hover:bg-purple-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-purple-800 dark:text-purple-200">Gestión de Maestros</h3>
              <p class="text-sm text-purple-600 dark:text-purple-400">
                Administra la información de los maestros.
              </p>
            </router-link>
            <router-link
              to="/admin/permissions"
              class="block bg-red-100 dark:bg-red-700/30 hover:bg-red-200 dark:hover:bg-red-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-red-800 dark:text-red-200">Gestión de Permisos</h3>
              <p class="text-sm text-red-600 dark:text-red-400">
                Configura roles y permisos de acceso.
              </p>
            </router-link>
          </div>
        </div>

        <!-- Sección: Clases y Horarios -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Clases y Horarios
          </h2>
          <div class="space-y-3">
            <router-link
              to="/admin/classes"
              class="block bg-yellow-100 dark:bg-yellow-700/30 hover:bg-yellow-200 dark:hover:bg-yellow-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-yellow-800 dark:text-yellow-200">Gestión de Clases</h3>
              <p class="text-sm text-yellow-600 dark:text-yellow-400">
                Administra las clases existentes y crea nuevas.
              </p>
            </router-link>
            <router-link
              to="/admin/schedules"
              class="block bg-teal-100 dark:bg-teal-700/30 hover:bg-teal-200 dark:hover:bg-teal-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-teal-800 dark:text-teal-200">Gestión de Horarios</h3>
              <p class="text-sm text-teal-600 dark:text-teal-400">
                Administra los horarios de clases y maestros.
              </p>
            </router-link>
            <router-link
              to="/admin/monitoring"
              class="block bg-orange-100 dark:bg-orange-700/30 hover:bg-orange-200 dark:hover:bg-orange-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-orange-800 dark:text-orange-200">Monitoreo de Clases</h3>
              <p class="text-sm text-orange-600 dark:text-orange-400">
                Supervisa la actividad diaria de las clases.
              </p>
            </router-link>
          </div>
        </div>

        <!-- Sección: Reportes y Análisis -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Reportes y Análisis
          </h2>
          <div class="space-y-3">
            <router-link
              to="/admin/reporteAsistenciaDiaria"
              class="block bg-indigo-100 dark:bg-indigo-700/30 hover:bg-indigo-200 dark:hover:bg-indigo-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-indigo-800 dark:text-indigo-200">Reporte Diario</h3>
              <p class="text-sm text-indigo-600 dark:text-indigo-400">
                Accede a todos los reportes del sistema.
              </p>
            </router-link>
            <router-link
              to="/admin/reporteSemanal"
              class="block bg-pink-100 dark:bg-pink-700/30 hover:bg-pink-200 dark:hover:bg-pink-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-pink-800 dark:text-pink-200">Reporte Semanal</h3>
              <p class="text-sm text-pink-600 dark:text-pink-400">
                Genera informes detallados de asistencia.
              </p>
            </router-link>
            <router-link
              to="/admin/analytics"
              class="block bg-cyan-100 dark:bg-cyan-700/30 hover:bg-cyan-200 dark:hover:bg-cyan-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-cyan-800 dark:text-cyan-200">Analytics Avanzado</h3>
              <p class="text-sm text-cyan-600 dark:text-cyan-400">
                Análisis inteligente con IA y métricas predictivas.
              </p>
            </router-link>
            <router-link
              to="/admin/reports"
              class="block bg-violet-100 dark:bg-violet-700/30 hover:bg-violet-200 dark:hover:bg-violet-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-violet-800 dark:text-violet-200">🚀 Centro de Reportes</h3>
              <p class="text-sm text-violet-600 dark:text-violet-400">
                Generación automática de reportes PDF y Excel profesionales.
              </p>
            </router-link>
            <router-link
              to="/admin/teachers/advanced"
              class="block bg-emerald-100 dark:bg-emerald-700/30 hover:bg-emerald-200 dark:hover:bg-emerald-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-emerald-800 dark:text-emerald-200">Gestión Avanzada de Maestros</h3>
              <p class="text-sm text-emerald-600 dark:text-emerald-400">
                Herramientas avanzadas para administración de profesores.
              </p>
            </router-link>
          </div>
        </div>

        <!-- Sección: Configuración y Herramientas -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Configuración y Herramientas
          </h2>
          <div class="space-y-3">
            <router-link
              to="/admin/system"
              class="block bg-gray-100 dark:bg-gray-700/30 hover:bg-gray-200 dark:hover:bg-gray-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-gray-800 dark:text-gray-200">
                Administración del Sistema
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Configuraciones generales del sistema.
              </p>
            </router-link>
            <router-link
              to="/admin/inventory"
              class="block bg-lime-100 dark:bg-lime-700/30 hover:bg-lime-200 dark:hover:bg-lime-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-lime-800 dark:text-lime-200">Gestión de Inventario</h3>
              <p class="text-sm text-lime-600 dark:text-lime-400">
                Administra el inventario de la academia.
              </p>
            </router-link>
            <router-link
              to="/admin/whatsapp"
              class="block bg-emerald-100 dark:bg-emerald-700/30 hover:bg-emerald-200 dark:hover:bg-emerald-700/50 rounded-lg p-4 transition-colors duration-200"
            >
              <h3 class="font-medium text-emerald-800 dark:text-emerald-200">
                Gestión de WhatsApp
              </h3>
              <p class="text-sm text-emerald-600 dark:text-emerald-400">
                Configura y gestiona las comunicaciones por WhatsApp.
              </p>
            </router-link>
            <!-- Puedes añadir más enlaces aquí según sea necesario -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import {useRoute} from "vue-router"
import {useAuthStore} from "@/stores/auth"
import {shouldUseAdminRoute} from "@/router/guards/roleBasedRedirect"

const route = useRoute()
const authStore = useAuthStore()

// Development flag
const isDev = import.meta.env.DEV

// Computed properties for debug info
const userRole = computed(() => authStore.user?.role)
const isAdminRole = computed(
  () => userRole.value && ["Admin", "Director", "Superusuario"].includes(userRole.value)
)
const currentRoute = computed(() => route.path)

// Helper function to check if a route should redirect
const shouldRedirectToAdmin = (routePath: string): boolean => {
  if (!userRole.value) return false
  return shouldUseAdminRoute(userRole.value, routePath)
}
</script>

<style scoped>
/* Puedes añadir estilos específicos si es necesario */
</style>
