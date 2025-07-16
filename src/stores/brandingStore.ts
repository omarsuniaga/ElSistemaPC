// src/stores/brandingStore.ts
/**
 * Store para configuración de marca y personalización de la aplicación
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/firebase/config';
import { logger } from '@/utils/logging/logger';

interface BrandingConfig {
  // Información básica
  appName: string
  appDescription: string
  tagline: string

  // Identidad visual
  logo: {
    url: string
    alt: string
    width?: number
    height?: number
  }
  favicon: {
    url: string
  }

  // Colores de marca
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
  }

  // Información de contacto
  contact: {
    phone: string
    email: string
    address: string
    website: string
    socialMedia: {
      facebook?: string
      instagram?: string
      twitter?: string
      youtube?: string
    }
  }

  // Configuración de PWA
  pwa: {
    name: string
    shortName: string
    description: string
    themeColor: string
    backgroundColor: string
  }

  // Configuración avanzada
  advanced: {
    showPoweredBy: boolean
    customCSS: string
    footerText: string
    welcomeMessage: string
  }

  // Metadatos
  lastUpdated: Date
  updatedBy: string
  version: number
}

const defaultBrandingConfig: BrandingConfig = {
  appName: 'Music Academy Manager',
  appDescription: 'Sistema completo de gestión para academias musicales',
  tagline: 'Transformando la educación musical',

  logo: {
    url: '/logo.svg',
    alt: 'Music Academy Logo',
    width: 120,
    height: 40,
  },

  favicon: {
    url: '/favicon.ico',
  },

  colors: {
    primary: '#1976d2',
    secondary: '#424242',
    accent: '#82b1ff',
    background: '#fafafa',
    surface: '#ffffff',
    text: '#212121',
  },

  contact: {
    phone: '',
    email: '',
    address: '',
    website: '',
    socialMedia: {},
  },

  pwa: {
    name: 'Music Academy Manager',
    shortName: 'MusicAcademy',
    description: 'Sistema de gestión musical',
    themeColor: '#1976d2',
    backgroundColor: '#ffffff',
  },

  advanced: {
    showPoweredBy: true,
    customCSS: '',
    footerText: '',
    welcomeMessage: 'Bienvenido a tu academia musical',
  },

  lastUpdated: new Date(),
  updatedBy: 'system',
  version: 1,
};

export const useBrandingStore = defineStore('branding', () => {
  // Estado
  const config = ref<BrandingConfig>(defaultBrandingConfig);
  const isLoading = ref(false);
  const hasChanges = ref(false);

  // Getters
  const appTitle = computed(() => config.value.appName);
  const appDescription = computed(() => config.value.appDescription);
  const logoUrl = computed(() => config.value.logo.url);
  const primaryColor = computed(() => config.value.colors.primary);
  const secondaryColor = computed(() => config.value.colors.secondary);

  const cssVariables = computed(() => ({
    '--ion-color-primary': config.value.colors.primary,
    '--ion-color-secondary': config.value.colors.secondary,
    '--ion-color-tertiary': config.value.colors.accent,
    '--ion-background-color': config.value.colors.background,
    '--ion-text-color': config.value.colors.text,
  }));

  // Cargar configuración desde Firestore
  async function loadBrandingConfig(): Promise<void> {
    isLoading.value = true;

    try {
      const configDoc = await getDoc(doc(db, 'system', 'branding'));

      if (configDoc.exists()) {
        const data = configDoc.data();
        config.value = {
          ...defaultBrandingConfig,
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        };

        logger.info('BRANDING', 'Configuración de marca cargada', config.value);
      } else {
        // Crear configuración por defecto
        await saveBrandingConfig();
        logger.info('BRANDING', 'Configuración por defecto creada');
      }

      // Aplicar configuración al DOM
      applyBrandingToDOM();
    } catch (error) {
      logger.error('BRANDING', 'Error cargando configuración de marca', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  // Guardar configuración en Firestore
  async function saveBrandingConfig(): Promise<void> {
    isLoading.value = true;

    try {
      const configToSave = {
        ...config.value,
        lastUpdated: new Date(),
        version: config.value.version + 1,
      };

      await setDoc(doc(db, 'system', 'branding'), configToSave);

      config.value = configToSave;
      hasChanges.value = false;

      // Aplicar cambios al DOM
      applyBrandingToDOM();

      logger.info('BRANDING', 'Configuración de marca guardada', configToSave);
    } catch (error) {
      logger.error('BRANDING', 'Error guardando configuración de marca', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  // Actualizar configuración parcial
  async function updateBrandingConfig(updates: Partial<BrandingConfig>): Promise<void> {
    try {
      const updatedConfig = {
        ...config.value,
        ...updates,
        lastUpdated: new Date(),
        version: config.value.version + 1,
      };

      await updateDoc(doc(db, 'system', 'branding'), updatedConfig);

      config.value = updatedConfig;
      hasChanges.value = false;

      applyBrandingToDOM();

      logger.info('BRANDING', 'Configuración actualizada', updates);
    } catch (error) {
      logger.error('BRANDING', 'Error actualizando configuración', error);
      throw error;
    }
  }

  // Subir logo personalizado
  async function uploadLogo(file: File): Promise<string> {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `logos/logo-${Date.now()}.${fileExtension}`;
      const logoRef = storageRef(storage, fileName);

      // Subir archivo
      const snapshot = await uploadBytes(logoRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      logger.info('BRANDING', 'Logo subido exitosamente', { fileName, url: downloadURL });

      return downloadURL;
    } catch (error) {
      logger.error('BRANDING', 'Error subiendo logo', error);
      throw error;
    }
  }

  // Eliminar logo anterior
  async function deletePreviousLogo(logoUrl: string): Promise<void> {
    try {
      if (logoUrl && logoUrl.includes('firebase')) {
        const logoRef = storageRef(storage, logoUrl);
        await deleteObject(logoRef);
        logger.info('BRANDING', 'Logo anterior eliminado', logoUrl);
      }
    } catch (error) {
      logger.warn('BRANDING', 'Error eliminando logo anterior', error);
      // No throw - no es crítico
    }
  }

  // Aplicar configuración al DOM
  function applyBrandingToDOM(): void {
    try {
      // Actualizar título de la página
      document.title = config.value.appName;

      // Actualizar meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', config.value.appDescription);
      }

      // Aplicar variables CSS
      const root = document.documentElement;
      Object.entries(cssVariables.value).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });

      // Actualizar favicon si es necesario
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon && config.value.favicon.url) {
        favicon.href = config.value.favicon.url;
      }

      // Aplicar CSS personalizado
      if (config.value.advanced.customCSS) {
        let customStyleElement = document.getElementById('custom-branding-css');

        if (!customStyleElement) {
          customStyleElement = document.createElement('style');
          customStyleElement.id = 'custom-branding-css';
          document.head.appendChild(customStyleElement);
        }

        customStyleElement.textContent = config.value.advanced.customCSS;
      }

      logger.debug('BRANDING', 'Configuración aplicada al DOM');
    } catch (error) {
      logger.error('BRANDING', 'Error aplicando configuración al DOM', error);
    }
  }

  // Resetear a configuración por defecto
  async function resetToDefault(): Promise<void> {
    const confirmed = confirm(
      '¿Estás seguro de que quieres resetear toda la configuración de marca a los valores por defecto?',
    );

    if (confirmed) {
      config.value = {
        ...defaultBrandingConfig,
        lastUpdated: new Date(),
        updatedBy: 'reset',
        version: config.value.version + 1,
      };

      await saveBrandingConfig();
      logger.info('BRANDING', 'Configuración reseteada a valores por defecto');
    }
  }

  // Exportar configuración
  function exportConfig(): void {
    const dataStr = JSON.stringify(config.value, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `branding-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('BRANDING', 'Configuración exportada');
  }

  // Importar configuración
  async function importConfig(file: File): Promise<void> {
    try {
      const text = await file.text();
      const importedConfig = JSON.parse(text) as BrandingConfig;

      // Validar configuración básica
      if (!importedConfig.appName || !importedConfig.colors) {
        throw new Error('Archivo de configuración inválido');
      }

      const mergedConfig = {
        ...defaultBrandingConfig,
        ...importedConfig,
        lastUpdated: new Date(),
        updatedBy: 'import',
        version: config.value.version + 1,
      };

      config.value = mergedConfig;
      await saveBrandingConfig();

      logger.info('BRANDING', 'Configuración importada exitosamente');
    } catch (error) {
      logger.error('BRANDING', 'Error importando configuración', error);
      throw error;
    }
  }

  // Preview de cambios sin guardar
  function previewChanges(tempConfig: Partial<BrandingConfig>): void {
    const previousConfig = { ...config.value };

    config.value = { ...config.value, ...tempConfig };
    applyBrandingToDOM();
    hasChanges.value = true

    // Función para revertir
    ;(window as any).revertBrandingPreview = () => {
      config.value = previousConfig;
      applyBrandingToDOM();
      hasChanges.value = false;
    };
  }

  return {
    // Estado
    config,
    isLoading,
    hasChanges,

    // Getters
    appTitle,
    appDescription,
    logoUrl,
    primaryColor,
    secondaryColor,
    cssVariables,

    // Acciones
    loadBrandingConfig,
    saveBrandingConfig,
    updateBrandingConfig,
    uploadLogo,
    deletePreviousLogo,
    applyBrandingToDOM,
    resetToDefault,
    exportConfig,
    importConfig,
    previewChanges,
  };
});
