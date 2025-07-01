<!-- Componente de prueba rápida para verificar acceso de maestros -->
<template>
  <div
    class="quick-test-panel bg-white import { ref, computed, onMounted } from 'vue' import { useAuthStore } from '../stores/auth' import { useRBACManagement } from '../composables/useRBACManagement' import { NavigationService } from '../services/navigation/navigationService' import { checkRBACCollections } from '../scripts/initialize-rbac-firestore'ed-lg shadow-lg p-6 max-w-2xl mx-auto mt-8"
  >
    <div class="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 rounded-t-lg -m-6 mb-6">
      <h2 class="text-xl font-bold">🧪 Prueba Rápida: Acceso de Maestros a Estudiantes</h2>
      <p class="text-green-100 text-sm">
        Verificar que los maestros puedan acceder al módulo de estudiantes
      </p>
    </div>

    <!-- Estado del Usuario Actual -->
    <div class="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 class="font-semibold mb-2">👤 Usuario Actual</h3>
      <div v-if="currentUser" class="space-y-1 text-sm">
        <div><strong>Email:</strong> {{ currentUser.email }}</div>
        <div><strong>Rol:</strong> {{ userRole || "No definido" }}</div>
        <div><strong>UID:</strong> {{ currentUser.uid }}</div>
      </div>
      <div v-else class="text-red-600">No hay usuario autenticado</div>
    </div>

    <!-- Tests Automáticos -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">🔍 Pruebas Automáticas</h3>

      <div class="space-y-3">
        <!-- Test 1: Verificar conexión RBAC -->
        <div class="test-item">
          <div class="flex justify-between items-center">
            <span>1. Conexión a colecciones RBAC</span>
            <div class="flex items-center space-x-2">
              <div :class="rbacConnectionStatus.class">{{ rbacConnectionStatus.text }}</div>
              <button :disabled="loading" class="btn-test" @click="testRBACConnection">
                Probar
              </button>
            </div>
          </div>
        </div>

        <!-- Test 2: Verificar permisos de maestro -->
        <div class="test-item">
          <div class="flex justify-between items-center">
            <span>2. Permisos de maestro para estudiantes</span>
            <div class="flex items-center space-x-2">
              <div :class="teacherPermissionsStatus.class">{{ teacherPermissionsStatus.text }}</div>
              <button :disabled="loading" class="btn-test" @click="testTeacherPermissions">
                Probar
              </button>
            </div>
          </div>
        </div>

        <!-- Test 3: Verificar navegación -->
        <div class="test-item">
          <div class="flex justify-between items-center">
            <span>3. Menú de navegación para maestros</span>
            <div class="flex items-center space-x-2">
              <div :class="navigationStatus.class">{{ navigationStatus.text }}</div>
              <button :disabled="loading" class="btn-test" @click="testNavigation">Probar</button>
            </div>
          </div>
        </div>

        <!-- Test 4: Acceso a ruta de estudiantes -->
        <div class="test-item">
          <div class="flex justify-between items-center">
            <span>4. Acceso a ruta /students</span>
            <div class="flex items-center space-x-2">
              <div :class="routeAccessStatus.class">{{ routeAccessStatus.text }}</div>
              <button :disabled="loading" class="btn-test" @click="testRouteAccess">Probar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Botón de prueba completa -->
      <div class="pt-4 border-t border-gray-200">
        <button
          :disabled="loading"
          class="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          @click="runCompleteTest"
        >
          {{ loading ? "🔄 Ejecutando pruebas..." : "🚀 Ejecutar Todas las Pruebas" }}
        </button>
      </div>
    </div>

    <!-- Resultados detallados -->
    <div v-if="detailedResults.length > 0" class="mt-6">
      <h3 class="text-lg font-semibold mb-3">📋 Resultados Detallados</h3>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="(result, index) in detailedResults"
          :key="index"
          :class="[
            'p-3 rounded text-sm',
            result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
          ]"
        >
          <div class="font-medium">{{ result.test }}</div>
          <div class="text-xs mt-1">{{ result.message }}</div>
          <div v-if="result.data" class="text-xs mt-1 font-mono bg-white bg-opacity-50 p-1 rounded">
            {{ JSON.stringify(result.data, null, 2) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones de corrección -->
    <div
      v-if="showCorrectiveActions"
      class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
    >
      <h3 class="font-semibold text-yellow-800 mb-2">⚠️ Acciones Correctivas Recomendadas</h3>
      <div class="space-y-2 text-sm text-yellow-700">
        <div v-for="action in correctiveActions" :key="action" class="flex items-start">
          <span class="mr-2">•</span>
          <span>{{ action }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useAuthStore} from "../stores/auth"
import {useRBACManagement} from "../composables/useRBACManagement"
import {NavigationService} from "../services/navigation/navigationService"
import {checkRBACCollections} from "../scripts/initialize-rbac-firestore"

const authStore = useAuthStore()
const rbacManagement = useRBACManagement()
const navigationService = NavigationService.getInstance()

// State
const loading = ref(false)
const detailedResults = ref([])
const correctiveActions = ref([])

// Test statuses
const rbacConnectionStatus = ref({class: "text-gray-500", text: "No probado"})
const teacherPermissionsStatus = ref({class: "text-gray-500", text: "No probado"})
const navigationStatus = ref({class: "text-gray-500", text: "No probado"})
const routeAccessStatus = ref({class: "text-gray-500", text: "No probado"})

// User info
const currentUser = computed(() => authStore.user)
const userRole = computed(() => authStore.user?.role)

const showCorrectiveActions = computed(() => correctiveActions.value.length > 0)

// Helper function to update status
const updateStatus = (statusRef, success: boolean, message: string) => {
  statusRef.value = {
    class: success ? "text-green-600" : "text-red-600",
    text: success ? "✅ OK" : "❌ Error",
  }
}

// Test functions
const testRBACConnection = async () => {
  try {
    const status = await checkRBACCollections()
    const allConnected =
      status.roles.exists && status.permissions.exists && status.navigation.exists

    updateStatus(rbacConnectionStatus, allConnected, allConnected ? "Conectado" : "Desconectado")

    detailedResults.value.push({
      test: "Conexión RBAC",
      success: allConnected,
      message: allConnected ? "Todas las colecciones están disponibles" : "Faltan colecciones RBAC",
      data: status,
    })

    if (!allConnected) {
      correctiveActions.value.push(
        'Ejecutar "Inicializar Colecciones" desde el Panel de Administración RBAC'
      )
    }
  } catch (error) {
    updateStatus(rbacConnectionStatus, false, "Error de conexión")
    detailedResults.value.push({
      test: "Conexión RBAC",
      success: false,
      message: `Error: ${error.message}`,
      data: null,
    })
  }
}

const testTeacherPermissions = async () => {
  try {
    await rbacManagement.initialize()
    const roles = rbacManagement.roles.value
    const teacherRole = roles.find((role) => role.name === "Maestro")

    const hasStudentPermission =
      teacherRole?.permissions.includes("Ver Estudiantes") ||
      teacherRole?.permissions.includes("Ver Todos los Estudiantes")

    updateStatus(
      teacherPermissionsStatus,
      hasStudentPermission,
      hasStudentPermission ? "Configurado" : "Sin permisos"
    )

    detailedResults.value.push({
      test: "Permisos de Maestro",
      success: hasStudentPermission,
      message: hasStudentPermission
        ? "Maestros tienen permisos para estudiantes"
        : "Maestros no tienen permisos para estudiantes",
      data: teacherRole?.permissions,
    })

    if (!hasStudentPermission) {
      correctiveActions.value.push(
        "Habilitar permisos de estudiantes para maestros desde el Panel RBAC"
      )
    }
  } catch (error) {
    updateStatus(teacherPermissionsStatus, false, "Error al verificar")
    detailedResults.value.push({
      test: "Permisos de Maestro",
      success: false,
      message: `Error: ${error.message}`,
      data: null,
    })
  }
}

const testNavigation = async () => {
  try {
    await rbacManagement.loadNavigationConfig()
    const navigation = rbacManagement.navigationConfig.value
    const studentMenuItem = navigation.find(
      (item) => item.path === "/students" && item.roles.includes("Maestro") && item.isActive
    )

    const hasStudentMenu = !!studentMenuItem

    updateStatus(
      navigationStatus,
      hasStudentMenu,
      hasStudentMenu ? "Menú disponible" : "Menú no disponible"
    )

    detailedResults.value.push({
      test: "Navegación de Maestro",
      success: hasStudentMenu,
      message: hasStudentMenu
        ? 'Menú "Estudiantes" disponible para maestros'
        : 'Menú "Estudiantes" no disponible para maestros',
      data: studentMenuItem,
    })

    if (!hasStudentMenu) {
      correctiveActions.value.push(
        'Activar menú "Estudiantes" para maestros desde Gestión de Navegación'
      )
    }
  } catch (error) {
    updateStatus(navigationStatus, false, "Error al verificar")
    detailedResults.value.push({
      test: "Navegación de Maestro",
      success: false,
      message: `Error: ${error.message}`,
      data: null,
    })
  }
}

const testRouteAccess = async () => {
  try {
    // Simulate route access test
    const canAccess = rbacManagement.canAccessRoute("Maestro", "/students")

    updateStatus(routeAccessStatus, canAccess, canAccess ? "Acceso permitido" : "Acceso denegado")

    detailedResults.value.push({
      test: "Acceso a Ruta /students",
      success: canAccess,
      message: canAccess
        ? "Maestros pueden acceder a /students"
        : "Maestros no pueden acceder a /students",
      data: {route: "/students", role: "Maestro", access: canAccess},
    })

    if (!canAccess) {
      correctiveActions.value.push("Verificar guards de navegación y configuración de rutas")
    }
  } catch (error) {
    updateStatus(routeAccessStatus, false, "Error al verificar")
    detailedResults.value.push({
      test: "Acceso a Ruta /students",
      success: false,
      message: `Error: ${error.message}`,
      data: null,
    })
  }
}

const runCompleteTest = async () => {
  loading.value = true
  detailedResults.value = []
  correctiveActions.value = []

  try {
    await testRBACConnection()
    await testTeacherPermissions()
    await testNavigation()
    await testRouteAccess()
  } catch (error) {
    console.error("Error in complete test:", error)
  } finally {
    loading.value = false
  }
}

// Initialize component
onMounted(() => {
  console.log("Componente de prueba rápida cargado")
})
</script>

<style scoped>
.test-item {
  padding: 0.75rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
}

.btn-test {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  background-color: rgb(107 114 128);
  color: white;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
  border: none;
  cursor: pointer;
}

.btn-test:hover {
  background-color: rgb(75 85 99);
}

.btn-test:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
