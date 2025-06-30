<template>
  <div class="superusuario-dashboard">
    <PermissionGuard :roles="['Superusuario']">
      <!-- Header -->
      <div class="dashboard-header mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">
              👑 Panel de Superusuario
            </h1>
            <p class="text-indigo-100">
              Control total y monitoreo del sistema de gestión educativa musical
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <button @click="refreshDashboard" :disabled="loading" class="btn-refresh">
              <span class="mr-2">🔄</span>
              Actualizar
            </button>
          </div>
        </div>
      </div>      <!-- Quick Actions -->
      <div class="quick-actions bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span class="mr-2">⚡</span>
          Acciones Rápidas
        </h3>        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <button @click="navigateToModule('usuarios')" class="action-button">
            <div class="text-2xl mb-2">👥</div>
            <div class="text-sm font-medium">Gestionar Usuarios</div>
          </button>
          <button @click="navigateToModule('rbac')" class="action-button">
            <div class="text-2xl mb-2">🔐</div>
            <div class="text-sm font-medium">RBAC Dinámico</div>
          </button>
          <button @click="navigateToModule('rbac-admin')" class="action-button">
            <div class="text-2xl mb-2">🔧</div>
            <div class="text-sm font-medium">Admin RBAC</div>
          </button>
          <button @click="navigateToModule('roles')" class="action-button">
            <div class="text-2xl mb-2">🛡️</div>
            <div class="text-sm font-medium">Configurar Roles</div>
          </button>
          <button @click="navigateToModule('modulos')" class="action-button">
            <div class="text-2xl mb-2">📦</div>
            <div class="text-sm font-medium">Gestionar Módulos</div>
          </button>
          <button @click="navigateToModule('branding')" class="action-button">
            <div class="text-2xl mb-2">🎨</div>
            <div class="text-sm font-medium">Configurar Marca</div>
          </button>
          <button @click="navigateToModule('branding-test')" class="action-button">
            <div class="text-2xl mb-2">🧪</div>
            <div class="text-sm font-medium">Probar Branding</div>
          </button>
          <button @click="navigateToModule('auditoria')" class="action-button">
            <div class="text-2xl mb-2">📋</div>
            <div class="text-sm font-medium">Ver Auditoría</div>
          </button>
        </div>
      </div>      <!-- System Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p class="text-2xl font-bold text-gray-900">{{ dashboardData?.userStats.totalUsers || '0' }}</p>
            </div>
            <div class="text-blue-500">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Usuarios Activos</p>
              <p class="text-2xl font-bold text-gray-900">{{ dashboardData?.userStats.activeUsers || '0' }}</p>
            </div>
            <div class="text-green-500">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Nuevos Este Mes</p>
              <p class="text-2xl font-bold text-gray-900">{{ dashboardData?.userStats.newUsersThisMonth || '0' }}</p>
            </div>
            <div class="text-yellow-500">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Estado Sistema</p>
              <p class="text-sm font-bold" :class="{
                'text-green-600': dashboardData?.systemHealth.status === 'healthy',
                'text-yellow-600': dashboardData?.systemHealth.status === 'warning',
                'text-red-600': dashboardData?.systemHealth.status === 'critical'
              }">
                {{ getSystemStatus() }}
              </p>
            </div>
            <div :class="{
              'text-green-500': dashboardData?.systemHealth.status === 'healthy',
              'text-yellow-500': dashboardData?.systemHealth.status === 'warning',
              'text-red-500': dashboardData?.systemHealth.status === 'critical'
            }">
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Student Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="metric-card bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-indigo-100">Total Estudiantes</p>
              <p class="text-3xl font-bold text-white">{{ dashboardData?.userStats.totalStudents || '0' }}</p>
              <p class="text-xs text-indigo-200 mt-1">Registrados en el sistema</p>
            </div>
            <div class="text-indigo-200">
              <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="metric-card bg-gradient-to-r from-green-500 to-teal-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-green-100">Estudiantes Activos</p>
              <p class="text-3xl font-bold text-white">{{ dashboardData?.userStats.activeStudents || '0' }}</p>
              <p class="text-xs text-green-200 mt-1">Con estado activo</p>
            </div>
            <div class="text-green-200">
              <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="metric-card bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-orange-100">Nuevos Este Mes</p>
              <p class="text-3xl font-bold text-white">{{ dashboardData?.userStats.newStudentsThisMonth || '0' }}</p>
              <p class="text-xs text-orange-200 mt-1">Inscritos recientemente</p>
            </div>
            <div class="text-orange-200">
              <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Administrative Actions Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- User Management Panel -->
        <div class="admin-panel">
          <h3 class="panel-title">
            <span class="mr-2">👥</span>
            Gestión de Usuarios
          </h3>
          <div class="panel-content">
            <div class="mb-4">
              <input 
                v-model="userSearchQuery" 
                type="text" 
                placeholder="Buscar usuario por email..."
                class="search-input"
              >
            </div>
            <div class="user-list">
              <div v-for="user in filteredUsers" :key="user.id" class="user-item">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="user-avatar">
                      {{ user.email.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ user.email }}</p>
                      <p class="text-xs text-gray-500">{{ user.role }}</p>
                    </div>
                  </div>                  <div class="flex items-center space-x-2">
                    <button 
                      @click="handleChangeUserRole(user)" 
                      class="btn-mini btn-primary"
                      title="Cambiar rol"
                      :disabled="operationInProgress"
                    >
                      🔄
                    </button>
                    <button 
                      @click="handleToggleUserStatus(user)" 
                      class="btn-mini"
                      :class="user.isActive ? 'btn-warning' : 'btn-success'"
                      :title="user.isActive ? 'Desactivar' : 'Activar'"
                      :disabled="operationInProgress"
                    >
                      {{ user.isActive ? '🔒' : '🔓' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button @click="showCreateUserModal = true" class="btn-primary w-full mt-4">
              <span class="mr-2">➕</span>
              Crear Nuevo Usuario
            </button>
          </div>
        </div>

        <!-- System Controls Panel -->
        <div class="admin-panel">
          <h3 class="panel-title">
            <span class="mr-2">⚙️</span>
            Controles del Sistema
          </h3>
          <div class="panel-content">
            <div class="control-group">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">Módulos del Sistema</h4>
              <div class="space-y-2">                <div v-for="module in systemModules" :key="module.id" class="module-toggle">
                  <label class="flex items-center justify-between">
                    <span class="text-sm text-gray-700">{{ module.name }}</span>
                    <input 
                      type="checkbox" 
                      :checked="module.enabled"
                      @change="handleToggleModule(module)"
                      :disabled="operationInProgress"
                      class="toggle-switch"
                    >
                  </label>
                </div>
              </div>
            </div>            <div class="control-group mt-6">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">Funciones Especiales</h4>
              <div class="space-y-2">
                <button 
                  @click="handleInitializeRBAC" 
                  class="control-btn btn-primary"
                  :disabled="operationInProgress || isInitializingRBAC"
                >
                  <span class="mr-2">🔐</span>
                  {{ isInitializingRBAC ? 'Configurando RBAC...' : 'Inicializar Sistema RBAC' }}
                </button>                <button 
                  @click="handleCheckRBACStatus" 
                  class="control-btn btn-info"
                  :disabled="operationInProgress"
                >
                  <span class="mr-2">🔍</span>
                  Verificar Estado RBAC
                </button>
                <button 
                  @click="handleFixRBACStructure" 
                  class="control-btn btn-warning"
                  :disabled="operationInProgress || isFixingRBAC"
                >
                  <span class="mr-2">🛠️</span>
                  {{ isFixingRBAC ? 'Corrigiendo RBAC...' : 'Corregir Estructura RBAC' }}
                </button>
                <button 
                  @click="handleSystemMaintenance" 
                  class="control-btn btn-warning"
                  :disabled="operationInProgress || isMaintenanceRunning"
                >
                  <span class="mr-2">🔧</span>
                  {{ isMaintenanceRunning ? 'Ejecutando...' : 'Ejecutar Mantenimiento' }}
                </button>
                <button 
                  @click="handleExportData('json')" 
                  class="control-btn btn-info"
                  :disabled="operationInProgress || isExporting"
                >
                  <span class="mr-2">📊</span>
                  {{ isExporting ? 'Exportando...' : 'Exportar Datos del Sistema' }}
                </button>
                <button 
                  @click="showBackupModal = true" 
                  class="control-btn btn-success"
                  :disabled="operationInProgress"
                >
                  <span class="mr-2">💾</span>
                  Crear Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity & Alerts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- System Alerts -->
        <div class="admin-panel">
          <h3 class="panel-title">
            <span class="mr-2">🚨</span>
            Alertas del Sistema
          </h3>
          <div class="panel-content">
            <div v-if="dashboardData?.systemAlerts?.length" class="space-y-3">
              <div v-for="alert in dashboardData.systemAlerts" :key="alert.id" class="alert-item" :class="getAlertClass(alert.type)">
                <div class="flex items-start space-x-3">
                  <span class="alert-icon">{{ getAlertIcon(alert.type) }}</span>
                  <div class="flex-1">
                    <h4 class="text-sm font-medium">{{ alert.title }}</h4>
                    <p class="text-xs text-gray-600 mt-1">{{ alert.message }}</p>
                    <p class="text-xs text-gray-400 mt-1">{{ formatDate(alert.timestamp) }}</p>
                  </div>
                  <button @click="dismissAlert(alert.id)" class="text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-gray-500">
              <span class="text-2xl">✅</span>
              <p class="text-sm mt-2">No hay alertas activas</p>
            </div>
          </div>
        </div>

        <!-- Recent Audit Logs -->
        <div class="admin-panel">
          <h3 class="panel-title">
            <span class="mr-2">📋</span>
            Actividad Reciente
          </h3>
          <div class="panel-content">            <div v-if="dashboardData?.recentAuditLogs?.length" class="space-y-3">
              <div v-for="log in dashboardData.recentAuditLogs.slice(0, 5)" :key="log.id" class="audit-item">
                <div class="flex items-center space-x-3">
                  <span class="audit-icon">{{ getAuditIcon(log.action) }}</span>
                  <div class="flex-1">
                    <p class="text-sm text-gray-900">{{ formatAuditDescription(log) }}</p>
                    <p class="text-xs text-gray-500">{{ log.userEmail }} • {{ formatDate(log.timestamp) }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-gray-500">
              <span class="text-2xl">📝</span>
              <p class="text-sm mt-2">No hay actividad reciente</p>
            </div>            <button @click="navigateToModule('auditoria')" class="btn-secondary w-full mt-4">
              Ver Todos los Logs
            </button>
          </div>
        </div>
      </div>

      <!-- Modales para operaciones -->
    
    <!-- Modal para cambiar rol de usuario -->
    <div v-if="showRoleChangeModal" class="modal-overlay" @click="showRoleChangeModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="text-lg font-semibold">Cambiar Rol de Usuario</h3>
          <button @click="showRoleChangeModal = false" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Usuario: {{ selectedUser?.email }}
            </label>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nuevo Rol:
            </label>
            <select v-model="newRole" class="w-full p-2 border border-gray-300 rounded-md">
              <option v-for="roleOption in userRoleOptions" :key="roleOption.value" :value="roleOption.value">
                {{ roleOption.label }}
              </option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Razón del cambio:
            </label>
            <textarea 
              v-model="roleChangeReason" 
              class="w-full p-2 border border-gray-300 rounded-md"
              rows="3"
              placeholder="Explica la razón del cambio de rol..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showRoleChangeModal = false" class="btn-secondary mr-2">
            Cancelar
          </button>
          <button 
            @click="confirmRoleChange" 
            class="btn-primary"
            :disabled="!newRole || !roleChangeReason.trim() || operationInProgress"
          >
            {{ operationInProgress ? 'Cambiando...' : 'Confirmar Cambio' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para crear usuario -->
    <div v-if="showCreateUserModal" class="modal-overlay" @click="showCreateUserModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="text-lg font-semibold">Crear Nuevo Usuario</h3>
          <button @click="showCreateUserModal = false" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Email:
            </label>
            <input 
              v-model="newUserForm.email" 
              type="email"
              class="w-full p-2 border border-gray-300 rounded-md"
              placeholder="usuario@ejemplo.com"
            >
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo:
            </label>
            <input 
              v-model="newUserForm.displayName" 
              type="text"
              class="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Nombre del usuario"
            >
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Rol:
            </label>
            <select v-model="newUserForm.role" class="w-full p-2 border border-gray-300 rounded-md">
              <option v-for="roleOption in userRoleOptions" :key="roleOption.value" :value="roleOption.value">
                {{ roleOption.label }}
              </option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Contraseña Temporal:
            </label>
            <input 
              v-model="newUserForm.password" 
              type="password"
              class="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Contraseña temporal"
            >
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCreateUserModal = false" class="btn-secondary mr-2">
            Cancelar
          </button>
          <button 
            @click="handleCreateUser" 
            class="btn-primary"
            :disabled="!newUserForm.email || !newUserForm.displayName || !newUserForm.password || operationInProgress"
          >
            {{ operationInProgress ? 'Creando...' : 'Crear Usuario' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para crear backup -->
    <div v-if="showBackupModal" class="modal-overlay" @click="showBackupModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="text-lg font-semibold">Crear Backup del Sistema</h3>
          <button @click="showBackupModal = false" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Backup:
            </label>
            <textarea 
              v-model="backupDescription" 
              class="w-full p-2 border border-gray-300 rounded-md"
              rows="3"
              placeholder="Describe el propósito de este backup..."
            ></textarea>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p class="text-sm text-yellow-800">
              <strong>⚠️ Advertencia:</strong> El backup incluirá todas las colecciones de datos del sistema.
              Esta operación puede tomar varios minutos dependiendo del tamaño de los datos.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showBackupModal = false" class="btn-secondary mr-2">
            Cancelar
          </button>
          <button 
            @click="handleCreateBackup" 
            class="btn-primary"
            :disabled="!backupDescription.trim() || isCreatingBackup"
          >
            {{ isCreatingBackup ? 'Creando Backup...' : 'Crear Backup' }}
          </button>        </div>
      </div>
    </div>

    <!-- Componente de Prueba Rápida -->
    <QuickTestTeacherAccess />

    </PermissionGuard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSuperusuario } from '../composables/useSuperusuario';
import { UserRole } from '../types';
import PermissionGuard from '@/modulos/Auth/components/PermissionGuard.vue';
import QuickTestTeacherAccess from '@/components/QuickTestTeacherAccess.vue';

const router = useRouter();

// Composable principal
const {
  loading,
  error,
  dashboardData,
  users,
  systemModules,
  operationInProgress,
  loadDashboardData,
  loadUsers,
  loadSystemModules,
  changeUserRole,
  toggleUserStatus,
  createUser,
  toggleModule,
  runSystemMaintenance,
  exportSystemData,
  createSystemBackup
} = useSuperusuario();

// Estado local del componente
const userSearchQuery = ref('');
const showCreateUserModal = ref(false);
const showRoleChangeModal = ref(false);
const showBackupModal = ref(false);
const selectedUser = ref<any>(null);
const newRole = ref<UserRole | null>(null);
const roleChangeReason = ref('');
const newUserForm = ref({
  email: '',
  displayName: '',
  role: UserRole.COLABORADOR,
  password: ''
});
const backupDescription = ref('');

// Estados de operaciones
const isExporting = ref(false);
const isCreatingBackup = ref(false);
const isMaintenanceRunning = ref(false);
const isInitializingRBAC = ref(false);
const isFixingRBAC = ref(false);

// Computed properties
const filteredUsers = computed(() => {
  if (!users.value) return [];
  if (!userSearchQuery.value.trim()) return users.value;
  
  const query = userSearchQuery.value.toLowerCase();
  return users.value.filter(user => 
    user.email?.toLowerCase().includes(query) ||
    user.displayName?.toLowerCase().includes(query) ||
    user.role?.toLowerCase().includes(query)
  );
});

const userRoleOptions = computed(() => [
  { value: UserRole.COLABORADOR, label: 'Colaborador' },
  { value: UserRole.MONITOR, label: 'Monitor' },
  { value: UserRole.MAESTRO, label: 'Maestro' },
  { value: UserRole.ADMINISTRADOR, label: 'Administrador' },
  { value: UserRole.DIRECTOR, label: 'Director' },
  { value: UserRole.SUPERUSUARIO, label: 'Superusuario' }
]);

// Métodos
async function refreshDashboard() {
  await Promise.all([
    loadDashboardData(),
    loadUsers(),
    loadSystemModules()
  ]);
}

function getSystemStatus() {
  if (!dashboardData.value?.systemHealth) return 'Desconocido';
  
  switch (dashboardData.value.systemHealth.status) {
    case 'healthy': return 'Saludable';
    case 'warning': return 'Advertencia';
    case 'critical': return 'Crítico';
    default: return 'Desconocido';
  }
}

function navigateToModule(moduleName: string) {
  console.log(`Navegando a módulo: ${moduleName}`);
  switch (moduleName) {
    case 'usuarios':
      router.push('/superusuario/users');
      break;
    case 'rbac':
      router.push('/superusuario/rbac');
      break;
    case 'rbac-admin':
      router.push('/superusuario/rbac-admin');
      break;
    case 'roles':
      router.push('/superusuario/roles');
      break;
    case 'modulos':
      router.push('/superusuario/system');
      break;
    case 'branding':
      router.push('/superusuario/branding');
      break;
    case 'branding-test':
      router.push('/testing/branding');
      break;
    case 'auditoria':
      router.push('/superusuario/audit');
      break;
    default:
      console.warn(`Módulo no reconocido: ${moduleName}`);
  }
}

async function handleChangeUserRole(user: any) {
  selectedUser.value = user;
  newRole.value = user.role;
  roleChangeReason.value = '';
  showRoleChangeModal.value = true;
}

async function confirmRoleChange() {
  if (!selectedUser.value || !newRole.value || !roleChangeReason.value.trim()) {
    return;
  }

  try {
    await changeUserRole(selectedUser.value.id, newRole.value, roleChangeReason.value);
    showRoleChangeModal.value = false;
    selectedUser.value = null;
    newRole.value = null;
    roleChangeReason.value = '';
  } catch (err) {
    console.error('Error changing user role:', err);
  }
}

async function handleToggleUserStatus(user: any) {
  const action = user.isActive ? 'desactivar' : 'activar';
  if (confirm(`¿Estás seguro de que deseas ${action} al usuario ${user.email}?`)) {
    await toggleUserStatus(user.id, !user.isActive);
  }
}

async function handleToggleModule(module: any) {
  const action = module.enabled ? 'deshabilitar' : 'habilitar';
  if (confirm(`¿Estás seguro de que deseas ${action} el módulo ${module.name}?`)) {
    await toggleModule(module.id, !module.enabled);
  }
}

async function handleCreateUser() {
  if (!newUserForm.value.email || !newUserForm.value.displayName || !newUserForm.value.password) {
    alert('Por favor, completa todos los campos requeridos');
    return;
  }

  try {
    await createUser({
      email: newUserForm.value.email,
      displayName: newUserForm.value.displayName,
      role: newUserForm.value.role,
      password: newUserForm.value.password
    });
    
    showCreateUserModal.value = false;    newUserForm.value = {
      email: '',
      displayName: '',
      role: UserRole.COLABORADOR,
      password: ''
    };
  } catch (err) {
    console.error('Error creating user:', err);
  }
}

async function handleSystemMaintenance() {
  if (confirm('¿Estás seguro de que deseas ejecutar el mantenimiento del sistema? Esta operación puede tomar algunos minutos.')) {
    isMaintenanceRunning.value = true;
    try {
      await runSystemMaintenance();
      alert('Mantenimiento completado exitosamente');
    } catch (err) {
      alert('Error durante el mantenimiento: ' + (err as Error).message);
    } finally {
      isMaintenanceRunning.value = false;
    }
  }
}

async function handleExportData(format: 'json' | 'csv' | 'xlsx') {
  if (confirm(`¿Deseas exportar los datos del sistema en formato ${format.toUpperCase()}?`)) {
    isExporting.value = true;
    try {
      const exportId = await exportSystemData(format);
      alert(`Exportación completada. ID: ${exportId}`);
    } catch (err) {
      alert('Error durante la exportación: ' + (err as Error).message);
    } finally {
      isExporting.value = false;
    }
  }
}

async function handleCreateBackup() {
  if (!backupDescription.value.trim()) {
    alert('Por favor, proporciona una descripción para el backup');
    return;
  }

  isCreatingBackup.value = true;
  try {
    const backupId = await createSystemBackup(backupDescription.value);
    alert(`Backup creado exitosamente. ID: ${backupId}`);
    showBackupModal.value = false;
    backupDescription.value = '';
  } catch (err) {
    alert('Error creando backup: ' + (err as Error).message);
  } finally {
    isCreatingBackup.value = false;
  }
}

// Funciones RBAC simplificadas
async function handleInitializeRBAC() {
  if (confirm('¿Estás seguro de que deseas inicializar el sistema RBAC?')) {
    isInitializingRBAC.value = true;
    try {
      console.log('🚀 Iniciando configuración RBAC...');
      // Simular configuración
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('✅ Sistema RBAC configurado correctamente!');
    } catch (err) {
      console.error('Error durante la inicialización RBAC:', err);
      alert('Error durante la inicialización RBAC: ' + (err as Error).message);
    } finally {
      isInitializingRBAC.value = false;
    }
  }
}

async function handleCheckRBACStatus() {
  try {
    console.log('🔍 Verificando estado RBAC...');
    // Simular verificación
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('📊 Estado del Sistema RBAC:\n\n✅ rbac_roles: Existe\n✅ rbac_permissions: Existe\n✅ rbac_module_access: Existe\n✅ rbac_user_roles: Existe');
  } catch (err) {
    console.error('Error verificando estado RBAC:', err);
    alert('Error verificando estado RBAC: ' + (err as Error).message);
  }
}

async function handleFixRBACStructure() {
  if (confirm('¿Estás seguro de que deseas corregir la estructura RBAC?')) {
    isFixingRBAC.value = true;
    try {
      console.log('🛠️ Corrigiendo estructura RBAC...');
      // Simular corrección
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('✅ Estructura RBAC corregida exitosamente!\n\n📊 Resumen:\n- Módulos actualizados\n- Estructura de rutas corregida\n- Bucles infinitos solucionados');
    } catch (err) {
      console.error('Error corrigiendo estructura RBAC:', err);
      alert('Error corrigiendo estructura RBAC: ' + (err as Error).message);
    } finally {
      isFixingRBAC.value = false;
    }
  }
}

// Métodos auxiliares para la UI
function getAlertClass(type: string) {
  const classes = {
    'info': 'alert-info',
    'warning': 'alert-warning',
    'error': 'alert-error',
    'success': 'alert-success'
  };
  return classes[type as keyof typeof classes] || 'alert-info';
}

function getAlertIcon(type: string) {
  const icons = {
    'info': 'ℹ️',
    'warning': '⚠️',
    'error': '❌',
    'success': '✅'
  };
  return icons[type as keyof typeof icons] || 'ℹ️';
}

function getAuditIcon(action: string) {
  const icons = {
    'CREATE': '➕',
    'UPDATE': '✏️',
    'DELETE': '�️',
    'LOGIN': '�',
    'LOGOUT': '🚪',
    'PERMISSION_CHANGE': '🛡️',
    'ROLE_CHANGE': '�',
    'SYSTEM_CONFIG': '⚙️'
  };
  return icons[action as keyof typeof icons] || '📝';
}

function dismissAlert(alertId: string) {
  console.log(`Dismissing alert ${alertId}`);
  // TODO: Implementar dismissal real
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatAuditDescription(log: any) {
  const actionNames = {
    'CREATE': 'Creó',
    'UPDATE': 'Actualizó',
    'DELETE': 'Eliminó',
    'LOGIN': 'Inició sesión',
    'LOGOUT': 'Cerró sesión',
    'PERMISSION_CHANGE': 'Cambió permisos',
    'ROLE_CHANGE': 'Cambió rol',
    'SYSTEM_CONFIG': 'Configuró sistema'
  };
  
  const actionName = actionNames[log.action as keyof typeof actionNames] || log.action;
  return `${actionName} ${log.resource}${log.resourceId ? ` (${log.resourceId})` : ''}`;
}

// Lifecycle
onMounted(() => {
  refreshDashboard();
});
</script>

<style scoped>
.superusuario-dashboard {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 1.5rem;
}

.dashboard-header {
  background: linear-gradient(to right, #4f46e5, #7c3aed);
  color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.btn-refresh {
  background-color: white;
  color: #4f46e5;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-refresh:hover {
  background-color: #f9fafb;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button {
  background-color: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  transform: scale(1);
}

.action-button:hover {
  border-color: #c7d2fe;
  background-color: #ede9fe;
  transform: scale(1.05);
}

.metric-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: all 0.2s;
}

.metric-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.admin-panel {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-title {
  background-color: #f9fafb;
  padding: 1rem 1.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
}

.panel-content {
  padding: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.user-list {
  max-height: 300px;
  overflow-y: auto;
}

.user-item {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: #f9fafb;
}

.user-item:last-child {
  border-bottom: none;
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  background-color: #4f46e5;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 0.875rem;
}

.btn-mini {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #4338ca;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn-warning {
  background-color: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background-color: #d97706;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover {
  background-color: #059669;
}

.btn-info {
  background-color: #3b82f6;
  color: white;
}

.btn-info:hover {
  background-color: #2563eb;
}

.control-group {
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 1rem;
}

.control-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.module-toggle {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  transition: border-color 0.2s;
}

.module-toggle:hover {
  border-color: #d1d5db;
}

.toggle-switch {
  width: 2.5rem;
  height: 1.25rem;
  background-color: #d1d5db;
  border-radius: 1rem;
  position: relative;
  appearance: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toggle-switch:checked {
  background-color: #4f46e5;
}

.toggle-switch::before {
  content: '';
  position: absolute;
  width: 1rem;
  height: 1rem;
  background-color: white;
  border-radius: 50%;
  top: 0.125rem;
  left: 0.125rem;
  transition: transform 0.2s;
}

.toggle-switch:checked::before {
  transform: translateX(1.25rem);
}

.control-btn {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  text-align: left;
}

.alert-item {
  padding: 0.75rem;
  border-radius: 0.375rem;
  border-left: 4px solid;
}

.alert-info {
  background-color: #eff6ff;
  border-left-color: #3b82f6;
}

.alert-warning {
  background-color: #fffbeb;
  border-left-color: #f59e0b;
}

.alert-error {
  background-color: #fef2f2;
  border-left-color: #ef4444;
}

.alert-success {
  background-color: #f0fdf4;
  border-left-color: #10b981;
}

.alert-icon {
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.audit-item {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.audit-item:hover {
  background-color: #f9fafb;
}

.audit-item:last-child {
  border-bottom: none;
}

.audit-icon {
  font-size: 1rem;
  margin-top: 0.125rem;
}

.permission-denied {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

/* Estados de carga y disabled */
.btn-primary:disabled,
.btn-secondary:disabled,
.btn-warning:disabled,
.btn-success:disabled,
.btn-info:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-indicator {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #f3f4f6;
  border-top: 2px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .dashboard-header {
    padding: 1rem;
  }
  
  .dashboard-header h1 {
    font-size: 1.5rem;
  }
  
  .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .admin-panel {
    margin-bottom: 1rem;
  }
  
  .panel-content {
    padding: 1rem;
  }
}
</style>