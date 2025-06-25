<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
        <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        Configuración del Sistema
      </h3>
      <div class="flex space-x-2">
        <button
          @click="resetToDefaults"
          class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
        >
          Restablecer
        </button>
        <button
          @click="saveConfiguration"
          class="px-3 py-1 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
          :disabled="saving"
        >
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>

    <!-- Navegación por pestañas -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
          :class="activeTab === tab.id 
            ? 'border-indigo-500 text-indigo-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
        >
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- Configuración General -->
    <div v-if="activeTab === 'general'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Nombre de la Academia</label>
          <input
            v-model="config.general.academyName"
            type="text"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
          <select
            v-model="config.general.timezone"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="America/Mexico_City">América/Ciudad de México</option>
            <option value="America/New_York">América/Nueva York</option>
            <option value="Europe/Madrid">Europa/Madrid</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Idioma por Defecto</label>
          <select
            v-model="config.general.defaultLanguage"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="fr">Francés</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
          <select
            v-model="config.general.currency"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="MXN">Peso Mexicano (MXN)</option>
            <option value="USD">Dólar Estadounidense (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>
      </div>

      <div class="flex items-center">
        <input
          id="maintenance-mode"
          v-model="config.general.maintenanceMode"
          type="checkbox"
          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        >
        <label for="maintenance-mode" class="ml-2 block text-sm text-gray-900">
          Modo de mantenimiento
        </label>
      </div>
    </div>

    <!-- Configuración de Seguridad -->
    <div v-if="activeTab === 'security'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Longitud mínima de contraseña</label>
          <input
            v-model.number="config.security.minPasswordLength"
            type="number"
            min="6"
            max="20"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tiempo de sesión (minutos)</label>
          <input
            v-model.number="config.security.sessionTimeout"
            type="number"
            min="15"
            max="480"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Intentos de login máximos</label>
          <input
            v-model.number="config.security.maxLoginAttempts"
            type="number"
            min="3"
            max="10"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Bloqueo temporal (minutos)</label>
          <input
            v-model.number="config.security.lockoutDuration"
            type="number"
            min="5"
            max="60"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center">
          <input
            id="require-strong-password"
            v-model="config.security.requireStrongPassword"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          >
          <label for="require-strong-password" class="ml-2 block text-sm text-gray-900">
            Requerir contraseñas fuertes
          </label>
        </div>

        <div class="flex items-center">
          <input
            id="enable-2fa"
            v-model="config.security.enable2FA"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          >
          <label for="enable-2fa" class="ml-2 block text-sm text-gray-900">
            Habilitar autenticación de dos factores
          </label>
        </div>

        <div class="flex items-center">
          <input
            id="log-security-events"
            v-model="config.security.logSecurityEvents"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          >
          <label for="log-security-events" class="ml-2 block text-sm text-gray-900">
            Registrar eventos de seguridad
          </label>
        </div>
      </div>
    </div>

    <!-- Configuración de Notificaciones -->
    <div v-if="activeTab === 'notifications'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Email de administrador</label>
          <input
            v-model="config.notifications.adminEmail"
            type="email"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Servidor SMTP</label>
          <input
            v-model="config.notifications.smtpHost"
            type="text"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Puerto SMTP</label>
          <input
            v-model.number="config.notifications.smtpPort"
            type="number"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Usuario SMTP</label>
          <input
            v-model="config.notifications.smtpUser"
            type="text"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center">
          <input
            id="email-notifications"
            v-model="config.notifications.enableEmail"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          >
          <label for="email-notifications" class="ml-2 block text-sm text-gray-900">
            Habilitar notificaciones por email
          </label>
        </div>

        <div class="flex items-center">
          <input
            id="sms-notifications"
            v-model="config.notifications.enableSMS"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          >
          <label for="sms-notifications" class="ml-2 block text-sm text-gray-900">
            Habilitar notificaciones por SMS
          </label>
        </div>

        <div class="flex items-center">
          <input
            id="push-notifications"
            v-model="config.notifications.enablePush"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          >
          <label for="push-notifications" class="ml-2 block text-sm text-gray-900">
            Habilitar notificaciones push
          </label>
        </div>
      </div>
    </div>

    <!-- Configuración de Backup -->
    <div v-if="activeTab === 'backup'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Frecuencia de backup</label>
          <select
            v-model="config.backup.frequency"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Hora de backup</label>
          <input
            v-model="config.backup.time"
            type="time"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Retención (días)</label>
          <input
            v-model.number="config.backup.retentionDays"
            type="number"
            min="7"
            max="365"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Ubicación de backup</label>
          <select
            v-model="config.backup.location"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="local">Local</option>
            <option value="cloud">Nube</option>
            <option value="both">Ambos</option>
          </select>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center">
          <input
            id="auto-backup"
            v-model="config.backup.autoBackup"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          >
          <label for="auto-backup" class="ml-2 block text-sm text-gray-900">
            Backup automático habilitado
          </label>
        </div>

        <div class="flex items-center">
          <input
            id="compress-backup"
            v-model="config.backup.compress"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          >
          <label for="compress-backup" class="ml-2 block text-sm text-gray-900">
            Comprimir archivos de backup
          </label>
        </div>

        <div class="flex items-center">
          <input
            id="encrypt-backup"
            v-model="config.backup.encrypt"
            type="checkbox"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          >
          <label for="encrypt-backup" class="ml-2 block text-sm text-gray-900">
            Encriptar archivos de backup
          </label>
        </div>
      </div>

      <!-- Acciones de backup -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-medium text-gray-900 mb-3">Acciones de Backup</h4>
        <div class="flex space-x-3">
          <button
            @click="createManualBackup"
            class="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            :disabled="creatingBackup"
          >
            {{ creatingBackup ? 'Creando...' : 'Crear Backup Manual' }}
          </button>
          <button
            @click="testBackupSystem"
            class="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md transition-colors"
          >
            Probar Sistema
          </button>
          <button
            @click="restoreFromBackup"
            class="px-4 py-2 text-sm text-green-600 hover:text-green-800 border border-green-300 rounded-md transition-colors"
          >
            Restaurar
          </button>
        </div>
      </div>
    </div>

    <!-- Estado de guardado -->
    <div v-if="showSaveMessage" class="mt-6 p-4 rounded-md" :class="saveMessageClass">
      <p class="text-sm">{{ saveMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface SystemConfig {
  general: {
    academyName: string
    timezone: string
    defaultLanguage: string
    currency: string
    maintenanceMode: boolean
  }
  security: {
    minPasswordLength: number
    sessionTimeout: number
    maxLoginAttempts: number
    lockoutDuration: number
    requireStrongPassword: boolean
    enable2FA: boolean
    logSecurityEvents: boolean
  }
  notifications: {
    adminEmail: string
    smtpHost: string
    smtpPort: number
    smtpUser: string
    enableEmail: boolean
    enableSMS: boolean
    enablePush: boolean
  }
  backup: {
    frequency: string
    time: string
    retentionDays: number
    location: string
    autoBackup: boolean
    compress: boolean
    encrypt: boolean
  }
}

const emit = defineEmits<{
  configurationSaved: [config: SystemConfig]
  backupCreated: []
  backupRestored: []
}>()

// State
const activeTab = ref('general')
const saving = ref(false)
const creatingBackup = ref(false)
const showSaveMessage = ref(false)
const saveMessage = ref('')
const saveMessageType = ref<'success' | 'error'>('success')

const tabs = [
  { id: 'general', name: 'General' },
  { id: 'security', name: 'Seguridad' },
  { id: 'notifications', name: 'Notificaciones' },
  { id: 'backup', name: 'Backup' }
]

const config = ref<SystemConfig>({
  general: {
    academyName: 'Academia de Música',
    timezone: 'America/Mexico_City',
    defaultLanguage: 'es',
    currency: 'MXN',
    maintenanceMode: false
  },
  security: {
    minPasswordLength: 8,
    sessionTimeout: 120,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    requireStrongPassword: true,
    enable2FA: false,
    logSecurityEvents: true
  },
  notifications: {
    adminEmail: 'admin@academia.com',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    enableEmail: true,
    enableSMS: false,
    enablePush: true
  },
  backup: {
    frequency: 'daily',
    time: '02:00',
    retentionDays: 30,
    location: 'cloud',
    autoBackup: true,
    compress: true,
    encrypt: true
  }
})

// Computed
const saveMessageClass = computed(() => {
  return saveMessageType.value === 'success' 
    ? 'bg-green-50 text-green-800' 
    : 'bg-red-50 text-red-800'
})

// Methods
const saveConfiguration = async () => {
  saving.value = true
  try {
    // Simular guardado de configuración
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    emit('configurationSaved', config.value)
    showSuccessMessage('Configuración guardada exitosamente')
  } catch (error) {
    showErrorMessage('Error al guardar la configuración')
  } finally {
    saving.value = false
  }
}

const resetToDefaults = () => {
  if (confirm('¿Está seguro de que desea restablecer la configuración a los valores por defecto?')) {
    loadDefaultConfig()
    showSuccessMessage('Configuración restablecida a valores por defecto')
  }
}

const createManualBackup = async () => {
  creatingBackup.value = true
  try {
    // Simular creación de backup
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    emit('backupCreated')
    showSuccessMessage('Backup creado exitosamente')
  } catch (error) {
    showErrorMessage('Error al crear el backup')
  } finally {
    creatingBackup.value = false
  }
}

const testBackupSystem = () => {
  // Simular prueba del sistema de backup
  showSuccessMessage('Sistema de backup funcionando correctamente')
}

const restoreFromBackup = () => {
  if (confirm('¿Está seguro de que desea restaurar desde un backup? Esta acción no se puede deshacer.')) {
    emit('backupRestored')
    showSuccessMessage('Restauración iniciada. El sistema se reiniciará.')
  }
}

const showSuccessMessage = (message: string) => {
  saveMessage.value = message
  saveMessageType.value = 'success'
  showSaveMessage.value = true
  setTimeout(() => {
    showSaveMessage.value = false
  }, 3000)
}

const showErrorMessage = (message: string) => {
  saveMessage.value = message
  saveMessageType.value = 'error'
  showSaveMessage.value = true
  setTimeout(() => {
    showSaveMessage.value = false
  }, 5000)
}

const loadDefaultConfig = () => {
  config.value = {
    general: {
      academyName: 'Academia de Música',
      timezone: 'America/Mexico_City',
      defaultLanguage: 'es',
      currency: 'MXN',
      maintenanceMode: false
    },
    security: {
      minPasswordLength: 8,
      sessionTimeout: 120,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      requireStrongPassword: true,
      enable2FA: false,
      logSecurityEvents: true
    },
    notifications: {
      adminEmail: 'admin@academia.com',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      enableEmail: true,
      enableSMS: false,
      enablePush: true
    },
    backup: {
      frequency: 'daily',
      time: '02:00',
      retentionDays: 30,
      location: 'cloud',
      autoBackup: true,
      compress: true,
      encrypt: true
    }
  }
}

const loadConfiguration = () => {
  // En una aplicación real, esto cargaría la configuración desde la API
  console.log('Loading system configuration...')
}

// Lifecycle
onMounted(() => {
  loadConfiguration()
})
</script>
