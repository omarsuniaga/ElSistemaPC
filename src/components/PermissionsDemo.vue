<template>
  <div class="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🔐 Sistema de Permisos - Demo Completo
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          Demostración de controles de permisos granulares por rol
        </p>
      </div>

      <!-- Current User Info -->
      <div class="mb-8 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <h2 class="text-lg font-semibold mb-3">Usuario Actual</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Rol:</span>
            <span
              class="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
            >
              {{ userRole }}
            </span>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Email:</span>
            <span class="ml-2 text-gray-800 dark:text-gray-200">{{ userEmail }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Es Superusuario:</span>
            <span class="ml-2" :class="isSuperuser ? 'text-green-600' : 'text-gray-600'">
              {{ isSuperuser ? "✅ Sí" : "❌ No" }}
            </span>
          </div>
        </div>
      </div>

      <!-- Module Access Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Students Module -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <span class="mr-2">👥</span>
            Módulo de Estudiantes
          </h3>

          <div class="space-y-3">
            <PermissionGuard
              :required-resource="PermissionResource.STUDENTS"
              required-action="read"
            >
              <div class="flex items-center text-green-600 dark:text-green-400">
                <CheckIcon class="w-5 h-5 mr-2" />
                Puede ver estudiantes
              </div>
              <template #fallback>
                <div class="flex items-center text-red-600 dark:text-red-400">
                  <XMarkIcon class="w-5 h-5 mr-2" />
                  No puede ver estudiantes
                </div>
              </template>
            </PermissionGuard>

            <PermissionGuard
              :required-resource="PermissionResource.STUDENTS"
              required-action="create"
            >
              <div class="flex items-center text-green-600 dark:text-green-400">
                <CheckIcon class="w-5 h-5 mr-2" />
                Puede crear estudiantes
              </div>
              <template #fallback>
                <div class="flex items-center text-red-600 dark:text-red-400">
                  <XMarkIcon class="w-5 h-5 mr-2" />
                  No puede crear estudiantes
                </div>
              </template>
            </PermissionGuard>

            <PermissionGuard
              :required-resource="PermissionResource.STUDENTS"
              required-action="update"
            >
              <div class="flex items-center text-green-600 dark:text-green-400">
                <CheckIcon class="w-5 h-5 mr-2" />
                Puede editar estudiantes
              </div>
              <template #fallback>
                <div class="flex items-center text-red-600 dark:text-red-400">
                  <XMarkIcon class="w-5 h-5 mr-2" />
                  No puede editar estudiantes
                </div>
              </template>
            </PermissionGuard>

            <PermissionGuard
              :required-resource="PermissionResource.STUDENTS"
              required-action="delete"
            >
              <div class="flex items-center text-green-600 dark:text-green-400">
                <CheckIcon class="w-5 h-5 mr-2" />
                Puede eliminar estudiantes
              </div>
              <template #fallback>
                <div class="flex items-center text-red-600 dark:text-red-400">
                  <XMarkIcon class="w-5 h-5 mr-2" />
                  No puede eliminar estudiantes
                </div>
              </template>
            </PermissionGuard>
          </div>
        </div>

        <!-- Attendance Module -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <span class="mr-2">📋</span>
            Módulo de Asistencia
          </h3>

          <div class="space-y-3">
            <PermissionGuard
              :required-resource="PermissionResource.ATTENDANCE"
              required-action="read"
            >
              <div class="flex items-center text-green-600 dark:text-green-400">
                <CheckIcon class="w-5 h-5 mr-2" />
                Puede ver asistencia
              </div>
              <template #fallback>
                <div class="flex items-center text-red-600 dark:text-red-400">
                  <XMarkIcon class="w-5 h-5 mr-2" />
                  No puede ver asistencia
                </div>
              </template>
            </PermissionGuard>

            <PermissionGuard
              :required-resource="PermissionResource.ATTENDANCE"
              required-action="create"
            >
              <div class="flex items-center text-green-600 dark:text-green-400">
                <CheckIcon class="w-5 h-5 mr-2" />
                Puede tomar asistencia
              </div>
              <template #fallback>
                <div class="flex items-center text-red-600 dark:text-red-400">
                  <XMarkIcon class="w-5 h-5 mr-2" />
                  No puede tomar asistencia
                </div>
              </template>
            </PermissionGuard>

            <PermissionGuard
              :required-resource="PermissionResource.ATTENDANCE"
              required-action="update"
            >
              <div class="flex items-center text-green-600 dark:text-green-400">
                <CheckIcon class="w-5 h-5 mr-2" />
                Puede modificar asistencia
              </div>
              <template #fallback>
                <div class="flex items-center text-red-600 dark:text-red-400">
                  <XMarkIcon class="w-5 h-5 mr-2" />
                  No puede modificar asistencia
                </div>
              </template>
            </PermissionGuard>
          </div>
        </div>

        <!-- Classes Module -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <span class="mr-2">🏫</span>
            Módulo de Clases
          </h3>

          <div class="space-y-3">
            <PermissionGuard :required-resource="PermissionResource.CLASSES" required-action="read">
              <div class="flex items-center text-green-600 dark:text-green-400">
                <CheckIcon class="w-5 h-5 mr-2" />
                Puede ver clases
              </div>
              <template #fallback>
                <div class="flex items-center text-red-600 dark:text-red-400">
                  <XMarkIcon class="w-5 h-5 mr-2" />
                  No puede ver clases
                </div>
              </template>
            </PermissionGuard>

            <PermissionGuard
              :required-resource="PermissionResource.CLASSES"
              required-action="create"
            >
              <div class="flex items-center text-green-600 dark:text-green-400">
                <CheckIcon class="w-5 h-5 mr-2" />
                Puede crear clases
              </div>
              <template #fallback>
                <div class="flex items-center text-red-600 dark:text-red-400">
                  <XMarkIcon class="w-5 h-5 mr-2" />
                  No puede crear clases
                </div>
              </template>
            </PermissionGuard>

            <PermissionGuard
              :required-resource="PermissionResource.CLASSES"
              required-action="update"
            >
              <div class="flex items-center text-green-600 dark:text-green-400">
                <CheckIcon class="w-5 h-5 mr-2" />
                Puede editar clases
              </div>
              <template #fallback>
                <div class="flex items-center text-red-600 dark:text-red-400">
                  <XMarkIcon class="w-5 h-5 mr-2" />
                  No puede editar clases
                </div>
              </template>
            </PermissionGuard>
          </div>
        </div>

        <!-- Reports Module -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <span class="mr-2">📊</span>
            Módulo de Reportes
          </h3>

          <div class="space-y-3">
            <PermissionGuard :required-resource="PermissionResource.REPORTS" required-action="read">
              <div class="flex items-center text-green-600 dark:text-green-400">
                <CheckIcon class="w-5 h-5 mr-2" />
                Puede ver reportes
              </div>
              <template #fallback>
                <div class="flex items-center text-red-600 dark:text-red-400">
                  <XMarkIcon class="w-5 h-5 mr-2" />
                  No puede ver reportes
                </div>
              </template>
            </PermissionGuard>

            <PermissionGuard
              :required-resource="PermissionResource.REPORTS"
              required-action="create"
            >
              <div class="flex items-center text-green-600 dark:text-green-400">
                <CheckIcon class="w-5 h-5 mr-2" />
                Puede generar reportes
              </div>
              <template #fallback>
                <div class="flex items-center text-red-600 dark:text-red-400">
                  <XMarkIcon class="w-5 h-5 mr-2" />
                  No puede generar reportes
                </div>
              </template>
            </PermissionGuard>

            <PermissionGuard
              :required-resource="PermissionResource.CONFIDENTIAL_INFO"
              required-action="read"
            >
              <div class="flex items-center text-green-600 dark:text-green-400">
                <CheckIcon class="w-5 h-5 mr-2" />
                Puede ver información confidencial
              </div>
              <template #fallback>
                <div class="flex items-center text-red-600 dark:text-red-400">
                  <XMarkIcon class="w-5 h-5 mr-2" />
                  No puede ver información confidencial
                </div>
              </template>
            </PermissionGuard>
          </div>
        </div>
      </div>

      <!-- Action Buttons with Permission Guards -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-8">
        <h3 class="text-xl font-semibold mb-4">Acciones con Control de Permisos</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PermissionGuard
            :required-resource="PermissionResource.STUDENTS"
            required-action="create"
          >
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Estudiante
            </button>
            <template #fallback>
              <button
                disabled
                class="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
              >
                Crear Estudiante
              </button>
            </template>
          </PermissionGuard>

          <PermissionGuard
            :required-resource="PermissionResource.ATTENDANCE"
            required-action="create"
          >
            <button
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Tomar Asistencia
            </button>
            <template #fallback>
              <button
                disabled
                class="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
              >
                Tomar Asistencia
              </button>
            </template>
          </PermissionGuard>

          <PermissionGuard :required-resource="PermissionResource.CLASSES" required-action="create">
            <button
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Crear Clase
            </button>
            <template #fallback>
              <button
                disabled
                class="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
              >
                Crear Clase
              </button>
            </template>
          </PermissionGuard>

          <PermissionGuard :required-resource="PermissionResource.REPORTS" required-action="create">
            <button
              class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Generar Reporte
            </button>
            <template #fallback>
              <button
                disabled
                class="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
              >
                Generar Reporte
              </button>
            </template>
          </PermissionGuard>
        </div>
      </div>

      <!-- Superuser Section -->
      <PermissionGuard
        :required-resource="PermissionResource.SYSTEM_MONITORING"
        required-action="read"
      >
        <div
          class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-6 shadow"
        >
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <span class="mr-2">👑</span>
            Panel de Superusuario
          </h3>
          <p class="mb-4">Solo visible para usuarios con permisos de Superusuario</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white/20 rounded-lg p-4">
              <h4 class="font-medium mb-2">Gestión de Usuarios</h4>
              <p class="text-sm opacity-90">Control total sobre usuarios y roles</p>
            </div>
            <div class="bg-white/20 rounded-lg p-4">
              <h4 class="font-medium mb-2">Configuración del Sistema</h4>
              <p class="text-sm opacity-90">Ajustes avanzados de la plataforma</p>
            </div>
            <div class="bg-white/20 rounded-lg p-4">
              <h4 class="font-medium mb-2">Auditoría</h4>
              <p class="text-sm opacity-90">Logs y seguimiento de actividades</p>
            </div>
          </div>
        </div>
        <template #fallback>
          <div class="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 text-center">
            <div class="text-4xl mb-2">🚫</div>
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Acceso Restringido
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Esta sección solo está disponible para Superusuarios
            </p>
          </div>
        </template>
      </PermissionGuard>

      <!-- Permission Testing -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mt-8">
        <h3 class="text-xl font-semibold mb-4">Pruebas de Permisos Programáticas</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium mb-3">Verificaciones de Lectura</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Puede leer estudiantes:</span>
                <span :class="canReadStudents ? 'text-green-600' : 'text-red-600'">
                  {{ canReadStudents ? "✅" : "❌" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Puede leer asistencia:</span>
                <span :class="canReadAttendance ? 'text-green-600' : 'text-red-600'">
                  {{ canReadAttendance ? "✅" : "❌" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Puede leer clases:</span>
                <span :class="canReadClasses ? 'text-green-600' : 'text-red-600'">
                  {{ canReadClasses ? "✅" : "❌" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Puede leer reportes:</span>
                <span :class="canReadReports ? 'text-green-600' : 'text-red-600'">
                  {{ canReadReports ? "✅" : "❌" }}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-medium mb-3">Verificaciones de Escritura</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Puede crear estudiantes:</span>
                <span :class="canCreateStudents ? 'text-green-600' : 'text-red-600'">
                  {{ canCreateStudents ? "✅" : "❌" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Puede crear asistencia:</span>
                <span :class="canCreateAttendance ? 'text-green-600' : 'text-red-600'">
                  {{ canCreateAttendance ? "✅" : "❌" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Puede crear clases:</span>
                <span :class="canCreateClasses ? 'text-green-600' : 'text-red-600'">
                  {{ canCreateClasses ? "✅" : "❌" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Puede eliminar datos:</span>
                <span :class="canDeleteData ? 'text-green-600' : 'text-red-600'">
                  {{ canDeleteData ? "✅" : "❌" }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Usage Documentation -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mt-8">
        <h3 class="text-xl font-semibold mb-4">Cómo Usar el Sistema de Permisos</h3>
        <div class="prose dark:prose-invert max-w-none">
          <h4>1. En Componentes (con PermissionGuard)</h4>
          <pre
            class="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm"
          ><code>&lt;PermissionGuard :required-resource="PermissionResource.STUDENTS" required-action="create"&gt;
  &lt;button&gt;Crear Estudiante&lt;/button&gt;
  &lt;template #fallback&gt;
    &lt;p&gt;Sin permisos&lt;/p&gt;
  &lt;/template&gt;
&lt;/PermissionGuard&gt;</code></pre>

          <h4>2. En Lógica de Componentes (con composable)</h4>
          <pre
            class="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm"
          ><code>const { hasPermission, canCreate, canUpdate } = usePermissions()

// Verificación específica
if (hasPermission(PermissionResource.STUDENTS, PermissionAction.CREATE)) {
  // Lógica para crear estudiante
}

// Verificaciones con helpers
if (canCreate(PermissionResource.ATTENDANCE)) {
  // Lógica para tomar asistencia
}</code></pre>

          <h4>3. Roles y Recursos Disponibles</h4>
          <ul>
            <li><strong>Roles:</strong> Maestro, Director, Administrador, Superusuario</li>
            <li>
              <strong>Recursos:</strong> Estudiantes, Asistencia, Clases, Reportes, Info
              Confidencial, etc.
            </li>
            <li><strong>Acciones:</strong> create, read, update, delete</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import {CheckIcon, XMarkIcon} from "@heroicons/vue/24/outline"
import {useAuthStore} from "@/stores/auth"
import {usePermissions} from "@/modulos/Auth/composables/usePermissions"
import PermissionGuard from "@/modulos/Auth/components/PermissionGuard.vue"
import {PermissionResource, PermissionAction} from "@/modulos/Auth/types/permissions"

const authStore = useAuthStore()
const {hasPermission} = usePermissions()

// User info
const userRole = computed(() => authStore.user?.role || "No autenticado")
const userEmail = computed(() => authStore.user?.email || "No disponible")
const isSuperuser = computed(() => authStore.isSuperusuario)

// Permission checks
const canReadStudents = computed(() =>
  hasPermission(PermissionResource.STUDENTS, PermissionAction.READ)
)
const canReadAttendance = computed(() =>
  hasPermission(PermissionResource.ATTENDANCE, PermissionAction.READ)
)
const canReadClasses = computed(() =>
  hasPermission(PermissionResource.CLASSES, PermissionAction.READ)
)
const canReadReports = computed(() =>
  hasPermission(PermissionResource.REPORTS, PermissionAction.READ)
)

const canCreateStudents = computed(() =>
  hasPermission(PermissionResource.STUDENTS, PermissionAction.CREATE)
)
const canCreateAttendance = computed(() =>
  hasPermission(PermissionResource.ATTENDANCE, PermissionAction.CREATE)
)
const canCreateClasses = computed(() =>
  hasPermission(PermissionResource.CLASSES, PermissionAction.CREATE)
)
const canDeleteData = computed(
  () =>
    hasPermission(PermissionResource.STUDENTS, PermissionAction.DELETE) ||
    hasPermission(PermissionResource.ATTENDANCE, PermissionAction.DELETE) ||
    hasPermission(PermissionResource.CLASSES, PermissionAction.DELETE)
)
</script>
