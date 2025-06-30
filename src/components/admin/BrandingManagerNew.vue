<!-- src/components/admin/BrandingManager.vue -->
<template>
  <div class="branding-manager min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <h1 class="text-2xl font-bold text-gray-900">🎨 Configuración de Marca</h1>
          <div class="flex space-x-3">
            <button 
              @click="brandingStore.exportConfig" 
              :disabled="brandingStore.isLoading"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              📥 Exportar
            </button>
            <button 
              @click="saveChanges" 
              :disabled="!hasChanges || brandingStore.isLoading"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              💾 Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <!-- Vista Previa en Vivo -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
            👁️ Vista Previa en Tiempo Real
          </h2>
          <div class="preview-mockup border rounded-lg p-6" :style="brandingStore.cssVariables">
            <div class="mockup-header flex items-center space-x-4 mb-6">
              <img 
                v-if="tempConfig.logo?.url" 
                :src="tempConfig.logo.url" 
                :alt="tempConfig.logo?.alt"
                class="h-12 w-12 object-contain"
              />
              <div class="mockup-title">
                <h2 class="text-xl font-bold">{{ tempConfig.appName || 'Nombre de la App' }}</h2>
                <p class="text-gray-600">{{ tempConfig.tagline || 'Descripción de la aplicación' }}</p>
              </div>
            </div>
            <div class="mockup-content space-y-4">
              <button class="mockup-button bg-indigo-600 text-white px-4 py-2 rounded-md">
                Botón Principal
              </button>
              <div class="mockup-card bg-gray-100 p-4 rounded-lg">
                <h3 class="font-medium">Card de Ejemplo</h3>
                <p class="text-gray-600">{{ tempConfig.appDescription || 'Descripción...' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Configuración Básica -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
            ℹ️ Información Básica
          </h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Aplicación *
              </label>
              <input 
                v-model="tempConfig.appName"
                type="text"
                placeholder="Mi Academia Musical"
                @input="onConfigChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Eslogan/Tagline
              </label>
              <input 
                v-model="tempConfig.tagline"
                type="text"
                placeholder="Transformando la educación musical"
                @input="onConfigChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea 
                v-model="tempConfig.appDescription"
                placeholder="Descripción completa de tu academia musical..."
                rows="3"
                @input="onConfigChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Mensaje de Bienvenida
              </label>
              <input 
                v-model="tempConfig.advanced.welcomeMessage"
                type="text"
                placeholder="Bienvenido a tu academia musical"
                @input="onConfigChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Segunda fila de configuración -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        <!-- Logo y Favicon -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
            🖼️ Logo y Favicon
          </h2>
          <div class="logo-section space-y-4">
            <!-- Logo Actual -->
            <div class="current-logo">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Logo Actual</h4>
              <div class="logo-preview border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <img 
                  v-if="tempConfig.logo?.url" 
                  :src="tempConfig.logo.url" 
                  :alt="tempConfig.logo?.alt"
                  class="max-h-16 mx-auto object-contain"
                />
                <div v-else class="text-gray-400">
                  🖼️
                  <p class="mt-1 text-sm">Sin logo</p>
                </div>
              </div>
            </div>
            
            <!-- Subir Nuevo Logo -->
            <div class="upload-section">
              <input 
                ref="logoInput"
                type="file" 
                accept="image/*"
                @change="handleLogoUpload"
                style="display: none"
              />
              <button 
                @click="triggerLogoUpload"
                :disabled="uploadingLogo"
                class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                📤 {{ uploadingLogo ? 'Subiendo...' : 'Subir Nuevo Logo' }}
              </button>
              
              <div class="logo-config mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Texto Alternativo
                </label>
                <input 
                  v-model="tempConfig.logo.alt"
                  type="text"
                  placeholder="Descripción del logo"
                  @input="onConfigChange"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Colores de Marca -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
            🎨 Colores de Marca
          </h2>
          <div class="colors-grid space-y-4">
            <div class="color-item">
              <label class="block text-sm font-medium text-gray-700 mb-2">Color Primario</label>
              <div class="color-input-group flex space-x-2">
                <input 
                  type="color" 
                  v-model="tempConfig.colors.primary"
                  @change="onConfigChange"
                  class="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input 
                  v-model="tempConfig.colors.primary"
                  type="text"
                  placeholder="#1976d2"
                  @input="onConfigChange"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div class="color-item">
              <label class="block text-sm font-medium text-gray-700 mb-2">Color Secundario</label>
              <div class="color-input-group flex space-x-2">
                <input 
                  type="color" 
                  v-model="tempConfig.colors.secondary"
                  @change="onConfigChange"
                  class="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input 
                  v-model="tempConfig.colors.secondary"
                  type="text"
                  placeholder="#424242"
                  @input="onConfigChange"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div class="color-item">
              <label class="block text-sm font-medium text-gray-700 mb-2">Color de Acento</label>
              <div class="color-input-group flex space-x-2">
                <input 
                  type="color" 
                  v-model="tempConfig.colors.accent"
                  @change="onConfigChange"
                  class="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input 
                  v-model="tempConfig.colors.accent"
                  type="text"
                  placeholder="#82b1ff"
                  @input="onConfigChange"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div class="color-item">
              <label class="block text-sm font-medium text-gray-700 mb-2">Color de Fondo</label>
              <div class="color-input-group flex space-x-2">
                <input 
                  type="color" 
                  v-model="tempConfig.colors.background"
                  @change="onConfigChange"
                  class="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input 
                  v-model="tempConfig.colors.background"
                  type="text"
                  placeholder="#fafafa"
                  @input="onConfigChange"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuración Avanzada -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mt-8">
        <h2 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
          ⚙️ Configuración Avanzada
        </h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Información de Contacto -->
          <div class="space-y-4">
            <h3 class="text-md font-medium text-gray-900">📞 Información de Contacto</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input 
                v-model="tempConfig.contact.phone"
                type="tel"
                placeholder="+1 234 567 8900"
                @input="onConfigChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                v-model="tempConfig.contact.email"
                type="email"
                placeholder="info@miacademia.com"
                @input="onConfigChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <textarea 
                v-model="tempConfig.contact.address"
                placeholder="123 Calle Musical, Ciudad, País"
                rows="2"
                @input="onConfigChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <!-- Redes Sociales -->
          <div class="space-y-4">
            <h3 class="text-md font-medium text-gray-900">📱 Redes Sociales</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
              <input 
                v-model="tempConfig.socialMedia.facebook"
                type="url"
                placeholder="https://facebook.com/miacademia"
                @input="onConfigChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
              <input 
                v-model="tempConfig.socialMedia.instagram"
                type="url"
                placeholder="https://instagram.com/miacademia"
                @input="onConfigChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
              <input 
                v-model="tempConfig.socialMedia.youtube"
                type="url"
                placeholder="https://youtube.com/miacademia"
                @input="onConfigChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Acciones de Administración -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mt-8">
        <h2 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
          🔧 Acciones de Administración
        </h2>
        
        <div class="flex flex-wrap gap-4">
          <button 
            @click="resetToDefaults"
            class="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            🔄 Restaurar Configuración por Defecto
          </button>
          
          <button 
            @click="generatePreview"
            class="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            👁️ Generar Vista Previa Completa
          </button>
          
          <button 
            @click="validateConfiguration"
            class="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            ✅ Validar Configuración
          </button>
        </div>
        
        <!-- Estado de la configuración -->
        <div class="mt-4 p-4 bg-gray-50 rounded-md">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-700">Estado:</span>
            <span v-if="brandingStore.isLoading" class="text-sm text-blue-600">⏳ Cargando...</span>
            <span v-else-if="hasChanges" class="text-sm text-orange-600">⚠️ Cambios sin guardar</span>
            <span v-else class="text-sm text-green-600">✅ Todo guardado</span>
          </div>
          
          <div v-if="lastSaved" class="mt-1">
            <span class="text-xs text-gray-500">
              Último guardado: {{ formatDate(lastSaved) }}
            </span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// Native Vue imports only
import { ref, computed, reactive, watch, nextTick, onMounted } from 'vue'

import { useBrandingStore } from '@/stores/brandingStore'
import { logger } from '@/utils/logging/logger'

// Store
const brandingStore = useBrandingStore()

// Estado local
const tempConfig = ref({ ...brandingStore.config })
const uploadingLogo = ref(false)
const logoInput = ref<HTMLInputElement>()
const lastSaved = ref<Date | null>(null)

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(tempConfig.value) !== JSON.stringify(brandingStore.config)
})

// Watchers
watch(
  () => brandingStore.config,
  (newConfig) => {
    tempConfig.value = { ...newConfig }
  },
  { deep: true }
)

// Methods
const onConfigChange = () => {
  logger.debug('🎨 Config changed:', tempConfig.value)
  brandingStore.setConfig(tempConfig.value)
}

const saveChanges = async () => {
  try {
    await brandingStore.saveConfig()
    lastSaved.value = new Date()
    logger.success('✅ Configuración guardada')
  } catch (error) {
    logger.error('❌ Error al guardar:', error)
  }
}

const triggerLogoUpload = () => {
  logoInput.value?.click()
}

const handleLogoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  uploadingLogo.value = true
  
  try {
    const logoUrl = await brandingStore.uploadLogo(file)
    tempConfig.value.logo = {
      url: logoUrl,
      alt: tempConfig.value.logo?.alt || 'Logo de la academia'
    }
    onConfigChange()
    logger.success('📷 Logo subido exitosamente')
  } catch (error) {
    logger.error('❌ Error subiendo logo:', error)
  } finally {
    uploadingLogo.value = false
  }
}

const resetToDefaults = async () => {
  if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto? Esto eliminará todos los cambios.')) {
    await brandingStore.resetToDefaults()
    tempConfig.value = { ...brandingStore.config }
    logger.info('🔄 Configuración restaurada por defecto')
  }
}

const generatePreview = () => {
  logger.info('👁️ Generando vista previa completa...')
  // Implementar lógica de vista previa
}

const validateConfiguration = () => {
  const validation = brandingStore.validateConfig()
  if (validation.isValid) {
    logger.success('✅ Configuración válida')
  } else {
    logger.warning('⚠️ Problemas encontrados:', validation.errors)
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleString()
}

// Lifecycle
onMounted(async () => {
  await brandingStore.loadConfig()
  tempConfig.value = { ...brandingStore.config }
})
</script>

<style scoped>
.branding-manager {
  @apply font-sans;
}

.preview-mockup {
  transition: all 0.3s ease;
}

.mockup-button {
  transition: background-color 0.2s ease;
}

.mockup-button:hover {
  @apply bg-indigo-700;
}

.color-input-group input[type="color"] {
  -webkit-appearance: none;
  border: none;
  cursor: pointer;
}

.color-input-group input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input-group input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}
</style>
