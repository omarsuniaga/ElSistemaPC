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
              :disabled="brandingStore.isLoading"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              @click="brandingStore.exportConfig"
            >
              📥 Exportar
            </button>
            <button
              :disabled="!hasChanges || brandingStore.isLoading"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              @click="saveChanges"
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
                <h2 class="text-xl font-bold">{{ tempConfig.appName || "Nombre de la App" }}</h2>
                <p class="text-gray-600">
                  {{ tempConfig.tagline || "Descripción de la aplicación" }}
                </p>
              </div>
            </div>
            <div class="mockup-content space-y-4">
              <button class="mockup-button bg-indigo-600 text-white px-4 py-2 rounded-md">
                Botón Principal
              </button>
              <div class="mockup-card bg-gray-100 p-4 rounded-lg">
                <h3 class="font-medium">Card de Ejemplo</h3>
                <p class="text-gray-600">{{ tempConfig.appDescription || "Descripción..." }}</p>
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                @input="onConfigChange"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"> Eslogan/Tagline </label>
              <input
                v-model="tempConfig.tagline"
                type="text"
                placeholder="Transformando la educación musical"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                @input="onConfigChange"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"> Descripción </label>
              <textarea
                v-model="tempConfig.appDescription"
                placeholder="Descripción completa de tu academia musical..."
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                @input="onConfigChange"
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                @input="onConfigChange"
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
              <div
                class="logo-preview border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
              >
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
                style="display: none"
                @change="handleLogoUpload"
              />
              <button
                class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                :disabled="uploadingLogo"
                @click="triggerLogoUpload"
              >
                📤 {{ uploadingLogo ? "Subiendo..." : "Subir Nuevo Logo" }}
              </button>

              <div class="logo-config mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Texto Alternativo
                </label>
                <input
                  v-model="tempConfig.logo.alt"
                  type="text"
                  placeholder="Descripción del logo"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  @input="onConfigChange"
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
                  v-model="tempConfig.colors.primary"
                  type="color"
                  class="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                  @change="onConfigChange"
                />
                <input
                  v-model="tempConfig.colors.primary"
                  type="text"
                  placeholder="#1976d2"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  @input="onConfigChange"
                />
              </div>
            </div>

            <div class="color-item">
              <label class="block text-sm font-medium text-gray-700 mb-2">Color Secundario</label>
              <div class="color-input-group flex space-x-2">
                <input
                  v-model="tempConfig.colors.secondary"
                  type="color"
                  class="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                  @change="onConfigChange"
                />
                <input
                  v-model="tempConfig.colors.secondary"
                  type="text"
                  placeholder="#424242"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  @input="onConfigChange"
                />
              </div>
            </div>

            <div class="color-item">
              <label class="block text-sm font-medium text-gray-700 mb-2">Color de Acento</label>
              <div class="color-input-group flex space-x-2">
                <input
                  v-model="tempConfig.colors.accent"
                  type="color"
                  class="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                  @change="onConfigChange"
                />
                <input
                  v-model="tempConfig.colors.accent"
                  type="text"
                  placeholder="#82b1ff"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  @input="onConfigChange"
                />
              </div>
            </div>

            <div class="color-item">
              <label class="block text-sm font-medium text-gray-700 mb-2">Color de Fondo</label>
              <div class="color-input-group flex space-x-2">
                <input
                  v-model="tempConfig.colors.background"
                  type="color"
                  class="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                  @change="onConfigChange"
                />
                <input
                  v-model="tempConfig.colors.background"
                  type="text"
                  placeholder="#fafafa"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  @input="onConfigChange"
                />
              </div>
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
            class="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            @click="resetToDefaults"
          >
            🔄 Restaurar Configuración por Defecto
          </button>

          <button
            class="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="generatePreview"
          >
            👁️ Generar Vista Previa Completa
          </button>

          <button
            class="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            @click="validateConfiguration"
          >
            ✅ Validar Configuración
          </button>
        </div>

        <!-- Estado de la configuración -->
        <div class="mt-4 p-4 bg-gray-50 rounded-md">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-700">Estado:</span>
            <span v-if="brandingStore.isLoading" class="text-sm text-blue-600">⏳ Cargando...</span>
            <span v-else-if="hasChanges" class="text-sm text-orange-600"
              >⚠️ Cambios sin guardar</span
            >
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
import { ref, computed, onMounted, watch } from 'vue';
import { useBrandingStore } from '@/stores/brandingStore';
import { logger } from '@/utils/logging/logger';

// Store
const brandingStore = useBrandingStore();

// Estado local
const tempConfig = ref({ ...brandingStore.config });
const uploadingLogo = ref(false);
const logoInput = ref<HTMLInputElement>();
const importInput = ref<HTMLInputElement>();

// Computed properties
const hasChanges = computed(() => {
  return JSON.stringify(tempConfig.value) !== JSON.stringify(brandingStore.config);
});

// Paletas de colores predefinidas
const colorPalettes = [
  {
    name: 'Azul Profesional',
    colors: ['#1976d2', '#424242', '#82b1ff', '#fafafa'],
  },
  {
    name: 'Verde Natura',
    colors: ['#388e3c', '#2e7d32', '#81c784', '#f1f8e9'],
  },
  {
    name: 'Púrpura Elegante',
    colors: ['#7b1fa2', '#4a148c', '#ba68c8', '#f3e5f5'],
  },
  {
    name: 'Naranja Vibrante',
    colors: ['#f57c00', '#e65100', '#ffb74d', '#fff3e0'],
  },
  {
    name: 'Rojo Passion',
    colors: ['#d32f2f', '#b71c1c', '#e57373', '#ffebee'],
  },
];

// Watchers
watch(
  () => brandingStore.config,
  (newConfig) => {
    tempConfig.value = { ...newConfig };
  },
  { deep: true },
);

// Métodos
function onConfigChange() {
  // Aplicar cambios inmediatamente para vista previa
  brandingStore.previewChanges(tempConfig.value);
}

function triggerLogoUpload() {
  logoInput.value?.click();
}

async function handleLogoUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  try {
    uploadingLogo.value = true;

    // Validar archivo
    if (file.size > 5 * 1024 * 1024) {
      // 5MB max
      throw new Error('El archivo es demasiado grande. Máximo 5MB.');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Solo se permiten archivos de imagen.');
    }

    // Subir logo
    const logoUrl = await brandingStore.uploadLogo(file);

    // Actualizar configuración temporal
    tempConfig.value.logo.url = logoUrl;
    tempConfig.value.logo.alt = tempConfig.value.logo.alt || file.name;

    onConfigChange();

    logger.info('BRANDING_MANAGER', 'Logo subido exitosamente');
  } catch (error) {
    logger.error('BRANDING_MANAGER', 'Error subiendo logo', error);
    alert(`Error subiendo logo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  } finally {
    uploadingLogo.value = false;
    target.value = ''; // Reset input
  }
}

function applyColorPalette(palette: (typeof colorPalettes)[0]) {
  tempConfig.value.colors.primary = palette.colors[0];
  tempConfig.value.colors.secondary = palette.colors[1];
  tempConfig.value.colors.accent = palette.colors[2];
  tempConfig.value.colors.background = palette.colors[3];

  onConfigChange();
}

async function saveChanges() {
  try {
    // Actualizar configuración en el store
    Object.assign(brandingStore.config, tempConfig.value);
    await brandingStore.saveBrandingConfig();

    alert('✅ Configuración guardada exitosamente');
    logger.info('BRANDING_MANAGER', 'Configuración guardada');
  } catch (error) {
    logger.error('BRANDING_MANAGER', 'Error guardando configuración', error);
    alert(`❌ Error guardando: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

function triggerConfigImport() {
  importInput.value?.click();
}

async function handleConfigImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  try {
    await brandingStore.importConfig(file);
    tempConfig.value = { ...brandingStore.config };

    alert('✅ Configuración importada exitosamente');
    logger.info('BRANDING_MANAGER', 'Configuración importada');
  } catch (error) {
    logger.error('BRANDING_MANAGER', 'Error importando configuración', error);
    alert(`❌ Error importando: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  } finally {
    target.value = ''; // Reset input
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await brandingStore.loadBrandingConfig();
    tempConfig.value = { ...brandingStore.config };
  } catch (error) {
    logger.error('BRANDING_MANAGER', 'Error cargando configuración inicial', error);
  }
});
</script>

<style scoped>
.branding-container {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.preview-card {
  margin-bottom: 24px;
  border: 2px solid var(--ion-color-primary);
}

.preview-mockup {
  border: 1px solid var(--ion-color-light);
  border-radius: 12px;
  overflow: hidden;
  background: var(--ion-color-light);
}

.mockup-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--ion-color-primary);
  color: white;
}

.mockup-logo {
  height: 40px;
  width: auto;
  background: white;
  padding: 8px;
  border-radius: 4px;
}

.mockup-title h2 {
  margin: 0 0 4px 0;
  font-size: 1.5em;
}

.mockup-title p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.9em;
}

.mockup-content {
  padding: 20px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.mockup-button {
  background: var(--ion-color-primary);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
}

.mockup-card {
  flex: 1;
  min-width: 200px;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mockup-card h3 {
  margin: 0 0 8px 0;
  color: var(--ion-color-primary);
}

.mockup-card p {
  margin: 0;
  color: var(--ion-color-medium);
}

.config-grid {
  display: grid;
  gap: 16px;
}

.logo-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.current-logo h4 {
  margin-bottom: 12px;
  color: var(--ion-color-primary);
}

.logo-preview {
  border: 2px dashed var(--ion-color-light);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-image {
  max-width: 100%;
  max-height: 80px;
  object-fit: contain;
}

.no-logo {
  color: var(--ion-color-medium);
}

.no-logo ion-icon {
  font-size: 2em;
  margin-bottom: 8px;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.logo-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.color-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--ion-color-primary);
}

.color-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-picker {
  width: 50px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
}

.preset-palettes h4 {
  margin-bottom: 16px;
  color: var(--ion-color-primary);
}

.palette-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.palette-option {
  padding: 12px;
  border: 1px solid var(--ion-color-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.palette-option:hover {
  border-color: var(--ion-color-primary);
  transform: translateY(-2px);
}

.palette-colors {
  display: flex;
  margin-bottom: 8px;
  border-radius: 4px;
  overflow: hidden;
  height: 30px;
}

.palette-color {
  flex: 1;
}

.contact-grid {
  display: grid;
  gap: 16px;
}

.social-media h4 {
  margin: 24px 0 16px 0;
  color: var(--ion-color-primary);
}

.social-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.pwa-grid {
  display: grid;
  gap: 16px;
}

.advanced-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .logo-section {
    grid-template-columns: 1fr;
  }

  .colors-grid {
    grid-template-columns: 1fr;
  }

  .social-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
