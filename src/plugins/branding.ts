// src/plugins/branding.ts

import {App} from "vue"
import {logger} from "@/utils/logging/logger"

/**
 * Plugin de Vue para inicializar la configuración de marca globalmente
 */
export const brandingPlugin = {
  install(app: App) {
    // Defer store initialization until after Pinia is available
    app.config.globalProperties.$initBranding = () => {
      try {
        // Dynamic import to avoid early store initialization
        import("@/stores/brandingStore").then(({useBrandingStore}) => {
          import("@/composables/useBranding").then(({useBranding}) => {
            const brandingStore = useBrandingStore()
            const {applyBranding} = useBranding()

            // Cargar configuración al iniciar la aplicación
            brandingStore
              .loadBrandingConfig()
              .then(() => {
                logger.info("BRANDING_PLUGIN", "Configuración de marca cargada")
                applyBranding()
              })
              .catch((error) => {
                logger.warn("BRANDING_PLUGIN", "Error cargando configuración inicial de marca", error)
                // Aplicar configuración por defecto
                applyBranding()
              })

            // Hacer el store disponible globalmente
            app.config.globalProperties.$branding = brandingStore

            // Proporcionar el store para composables
            app.provide("brandingStore", brandingStore)
          })
        })
      } catch (error) {
        logger.error("BRANDING_PLUGIN", "Error inicializando branding", error)
      }
    }

    logger.info("BRANDING_PLUGIN", "Plugin de branding registrado (inicialización diferida)")
  },
}

export default brandingPlugin
