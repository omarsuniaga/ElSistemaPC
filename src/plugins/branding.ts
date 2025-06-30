// src/plugins/branding.ts

import { App } from 'vue'
import { useBrandingStore } from '@/stores/brandingStore'
import { useBranding } from '@/composables/useBranding'
import { logger } from '@/utils/logging/logger'

/**
 * Plugin de Vue para inicializar la configuración de marca globalmente
 */
export const brandingPlugin = {
  install(app: App) {
    // Inicializar store de branding
    const brandingStore = useBrandingStore()
    const { applyBranding } = useBranding()

    // Cargar configuración al iniciar la aplicación
    brandingStore.loadBrandingConfig()
      .then(() => {
        logger.info('BRANDING_PLUGIN', 'Configuración de marca cargada')
        applyBranding()
      })
      .catch((error) => {
        logger.warn('BRANDING_PLUGIN', 'Error cargando configuración inicial de marca', error)
        // Aplicar configuración por defecto
        applyBranding()
      })

    // Hacer el store disponible globalmente
    app.config.globalProperties.$branding = brandingStore
    
    // Proporcionar el store para composables
    app.provide('brandingStore', brandingStore)

    logger.info('BRANDING_PLUGIN', 'Plugin de branding instalado')
  }
}

export default brandingPlugin
