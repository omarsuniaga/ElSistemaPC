<!-- Componente de test para verificar comunicación RBAC con Firestore -->
<template>
  <div class="rbac-test-component bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
    <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-t-lg -m-6 mb-6">
      <h2 class="text-xl font-bold">🧪 Test de Comunicación RBAC - Firestore</h2>
      <p class="text-green-100 text-sm">Verificar que el sistema RBAC se comunique correctamente con Firestore</p>
    </div>

    <!-- Botones de acción -->
    <div class="flex space-x-4 mb-6">
      <button 
        @click="runFullTest" 
        :disabled="loading"
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {{ loading ? '🔄 Ejecutando...' : '🚀 Ejecutar Test Completo' }}
      </button>
      
      <button 
        @click="showStatus" 
        :disabled="loading"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        📊 Mostrar Estado Actual
      </button>
      
      <button 
        @click="initializeData" 
        :disabled="loading"
        class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
      >
        🔄 Inicializar Datos por Defecto
      </button>
      
      <button 
        @click="clearResults" 
        class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        🧹 Limpiar Resultados
      </button>
    </div>

    <!-- Resultados del test -->
    <div class="space-y-4">
      <!-- Estado actual -->
      <div v-if="status" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-semibold text-blue-800 mb-2">📊 Estado Actual del Sistema</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ status.rolesCount }}</div>
            <div class="text-sm text-gray-600">Roles</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ status.permissionsCount }}</div>
            <div class="text-sm text-gray-600">Permisos</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ status.navigationCount }}</div>
            <div class="text-sm text-gray-600">Navegación</div>
          </div>
        </div>
      </div>

      <!-- Resultados de tests -->
      <div v-if="testResults.length > 0" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 class="font-semibold text-gray-800 mb-3">📝 Resultados de Tests</h3>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div 
            v-for="(result, index) in testResults" 
            :key="index"
            :class="[
              'p-2 rounded text-sm',
              result.type === 'success' ? 'bg-green-100 text-green-800' :
              result.type === 'error' ? 'bg-red-100 text-red-800' :
              result.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            ]"
          >
            <span class="font-mono text-xs text-gray-500">{{ result.timestamp }}</span>
            <span class="ml-2">{{ result.message }}</span>
          </div>
        </div>
      </div>

      <!-- Detalles de datos -->
      <div v-if="dataDetails" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Roles -->
        <div v-if="dataDetails.roles" class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 class="font-semibold text-purple-800 mb-2">🎭 Roles ({{ dataDetails.roles.length }})</h4>
          <div class="space-y-1 max-h-32 overflow-y-auto">
            <div 
              v-for="role in dataDetails.roles" 
              :key="role.id"
              class="text-sm flex justify-between"
            >
              <span>{{ role.name }}</span>
              <span class="text-purple-600">{{ role.permissions?.length || 0 }} permisos</span>
            </div>
          </div>
        </div>

        <!-- Permisos por módulo -->
        <div v-if="dataDetails.permissionsByModule" class="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 class="font-semibold text-green-800 mb-2">🔑 Permisos por Módulo</h4>
          <div class="space-y-1 max-h-32 overflow-y-auto">
            <div 
              v-for="(count, module) in dataDetails.permissionsByModule" 
              :key="module"
              class="text-sm flex justify-between"
            >
              <span>{{ module }}</span>
              <span class="text-green-600">{{ count }} permisos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RBACPersistenceService } from '../services/rbac/rbacPersistenceService'

const loading = ref(false)
const testResults = ref<Array<{message: string, type: string, timestamp: string}>>([])
const status = ref<{rolesCount: number, permissionsCount: number, navigationCount: number} | null>(null)
const dataDetails = ref<any>(null)

const addResult = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  testResults.value.push({
    message,
    type,
    timestamp: new Date().toLocaleTimeString()
  })
}

const runFullTest = async () => {
  loading.value = true
  testResults.value = []
  dataDetails.value = null
  
  try {
    addResult('🚀 Iniciando test completo de comunicación RBAC...', 'info')
    
    // Test 1: Leer roles
    addResult('📖 Test 1: Leyendo roles desde Firestore...', 'info')
    const roles = await RBACPersistenceService.getRoles()
    addResult(`✅ Roles obtenidos: ${roles.length}`, 'success')
    
    // Test 2: Leer permisos
    addResult('📖 Test 2: Leyendo permisos desde Firestore...', 'info')
    const permissions = await RBACPersistenceService.getPermissions()
    addResult(`✅ Permisos obtenidos: ${permissions.length}`, 'success')
    
    // Test 3: Leer navegación
    addResult('📖 Test 3: Leyendo configuración de navegación...', 'info')
    const navigation = await RBACPersistenceService.getNavigationConfig()
    addResult(`✅ Elementos de navegación obtenidos: ${navigation.length}`, 'success')
    
    // Test 4: Verificar si necesita inicialización
    if (roles.length === 0 || permissions.length === 0) {
      addResult('⚠️ No hay datos, se requiere inicialización', 'warning')
    } else {
      addResult('✅ Datos RBAC ya están inicializados', 'success')
    }
    
    // Test 5: Probar escritura (crear rol temporal)
    addResult('💾 Test 5: Probando escritura con rol temporal...', 'info')
    const testRole = {
      id: `test-${Date.now()}`,
      name: 'Test Role',
      description: 'Rol temporal para test',
      permissions: ['Ver Asistencia'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const testRoles = [...roles, testRole]
    await RBACPersistenceService.saveRoles(testRoles, 'test-user')
    addResult('✅ Rol temporal creado exitosamente', 'success')
    
    // Verificar escritura
    const updatedRoles = await RBACPersistenceService.getRoles()
    const foundTestRole = updatedRoles.find(r => r.id === testRole.id)
    
    if (foundTestRole) {
      addResult('✅ Escritura verificada - rol encontrado en Firestore', 'success')
      
      // Limpiar rol temporal
      const cleanRoles = updatedRoles.filter(r => r.id !== testRole.id)
      await RBACPersistenceService.saveRoles(cleanRoles, 'test-user')
      addResult('🧹 Rol temporal eliminado', 'info')
    } else {
      addResult('❌ Error: No se pudo verificar la escritura', 'error')
    }
    
    // Actualizar status
    status.value = {
      rolesCount: roles.length,
      permissionsCount: permissions.length,
      navigationCount: navigation.length
    }
    
    // Actualizar detalles
    const permissionsByModule: Record<string, number> = {}
    permissions.forEach(p => {
      const module = p.module || 'sin-modulo'
      permissionsByModule[module] = (permissionsByModule[module] || 0) + 1
    })
    
    dataDetails.value = {
      roles,
      permissionsByModule
    }
    
    addResult('🎉 ¡Test completo finalizado exitosamente!', 'success')
    
  } catch (error: any) {
    addResult(`❌ Error en el test: ${error.message}`, 'error')
    console.error('Error en test RBAC:', error)
  } finally {
    loading.value = false
  }
}

const showStatus = async () => {
  loading.value = true
  
  try {
    addResult('📊 Obteniendo estado actual del sistema...', 'info')
    
    const roles = await RBACPersistenceService.getRoles()
    const permissions = await RBACPersistenceService.getPermissions()
    const navigation = await RBACPersistenceService.getNavigationConfig()
    
    status.value = {
      rolesCount: roles.length,
      permissionsCount: permissions.length,
      navigationCount: navigation.length
    }
    
    addResult(`📊 Estado: ${roles.length} roles, ${permissions.length} permisos, ${navigation.length} navegación`, 'info')
    
  } catch (error: any) {
    addResult(`❌ Error obteniendo estado: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const initializeData = async () => {
  loading.value = true
  
  try {
    addResult('🔄 Inicializando datos por defecto...', 'info')
    
    await RBACPersistenceService.initializeDefaultConfig('test-initialization')
    
    addResult('✅ Datos inicializados correctamente', 'success')
    
    // Actualizar estado después de inicialización
    await showStatus()
    
  } catch (error: any) {
    addResult(`❌ Error en inicialización: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const clearResults = () => {
  testResults.value = []
  status.value = null
  dataDetails.value = null
}
</script>

<style scoped>
.rbac-test-component {
  font-family: 'Inter', sans-serif;
}
</style>
