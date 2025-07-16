// src/composables/useBranding.ts

import { computed, nextTick } from 'vue';
import { useBrandingStore } from '@/stores/brandingStore';
import { logger } from '@/utils/logging/logger';

/**
 * Composable para aplicar la configuración de marca en toda la aplicación
 */
export function useBranding() {
  const brandingStore = useBrandingStore();
  const { config, cssVariables } = brandingStore;

  // Título dinámico de la aplicación
  const appTitle = computed(() => config.appName || 'Music Academy Manager');

  // Descripción dinámica
  const appDescription = computed(
    () => config.appDescription || 'Sistema de gestión de academia musical',
  );

  // Eslogan/tagline
  const appTagline = computed(() => config.tagline || 'Transformando la educación musical');

  // Logo dinámico
  const appLogo = computed(() => ({
    url: config.logo?.url || '/default-logo.png',
    alt: config.logo?.alt || appTitle.value,
  }));

  // Colores de marca
  const brandColors = computed(() => config.colors);

  // Información de contacto
  const contactInfo = computed(() => config.contact);

  // Configuración PWA
  const pwaConfig = computed(() => config.pwa);

  // Configuración avanzada
  const advancedConfig = computed(() => config.advanced);

  /**
   * Aplica los estilos CSS personalizados al documento
   */
  const applyCustomStyles = () => {
    if (brandingStore.isLoading) return;

    try {
      // Aplicar variables CSS
      const root = document.documentElement;

      Object.entries(cssVariables).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });

      // Aplicar CSS personalizado si existe
      if (config.advanced.customCSS) {
        let customStyleEl = document.getElementById('custom-branding-styles');

        if (!customStyleEl) {
          customStyleEl = document.createElement('style');
          customStyleEl.id = 'custom-branding-styles';
          document.head.appendChild(customStyleEl);
        }

        customStyleEl.textContent = config.advanced.customCSS;
      }

      logger.info('BRANDING', 'Estilos personalizados aplicados exitosamente');
    } catch (error) {
      logger.error('BRANDING', 'Error aplicando estilos personalizados', error);
    }
  };

  /**
   * Actualiza el título del documento
   */
  const updateDocumentTitle = (pageTitle?: string) => {
    const title = pageTitle ? `${pageTitle} - ${appTitle.value}` : appTitle.value;

    document.title = title;
  };

  /**
   * Actualiza las meta tags relacionadas con la marca
   */
  const updateMetaTags = () => {
    try {
      // Meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', appDescription.value);

      // Theme color
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', pwaConfig.value.themeColor);

      // Open Graph tags
      updateOpenGraphTags();

      logger.info('BRANDING', 'Meta tags actualizadas');
    } catch (error) {
      logger.error('BRANDING', 'Error actualizando meta tags', error);
    }
  };

  /**
   * Actualiza las etiquetas Open Graph para redes sociales
   */
  const updateOpenGraphTags = () => {
    const ogTags = [
      { property: 'og:title', content: appTitle.value },
      { property: 'og:description', content: appDescription.value },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: appLogo.value.url },
      { property: 'og:site_name', content: appTitle.value },
    ];

    ogTags.forEach(({ property, content }) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    });

    // Twitter Card tags
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: appTitle.value },
      { name: 'twitter:description', content: appDescription.value },
      { name: 'twitter:image', content: appLogo.value.url },
    ];

    twitterTags.forEach(({ name, content }) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    });
  };

  /**
   * Actualiza el favicon dinámicamente
   */
  const updateFavicon = () => {
    if (!config.logo?.url) return;

    try {
      // Buscar favicon existente
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;

      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }

      // Si el logo es una URL válida, usarlo como favicon
      if (config.logo.url.startsWith('http') || config.logo.url.startsWith('/')) {
        favicon.href = config.logo.url;
      }

      logger.info('BRANDING', 'Favicon actualizado');
    } catch (error) {
      logger.error('BRANDING', 'Error actualizando favicon', error);
    }
  };

  /**
   * Aplica toda la configuración de marca
   */
  const applyBranding = async (pageTitle?: string) => {
    if (brandingStore.isLoading) {
      // Intentar cargar la configuración si no está cargada
      await brandingStore.loadBrandingConfig();
    }

    await nextTick(); // Esperar a que Vue procese los cambios

    updateDocumentTitle(pageTitle);
    updateMetaTags();
    updateFavicon();
    applyCustomStyles();

    logger.info('BRANDING', 'Configuración de marca aplicada completamente');
  };

  /**
   * Genera CSS variables dinámicas para uso en componentes
   */
  const getCSSVariables = () => {
    return {
      '--brand-primary': brandColors.value.primary,
      '--brand-secondary': brandColors.value.secondary,
      '--brand-accent': brandColors.value.accent,
      '--brand-background': brandColors.value.background,
      '--brand-logo-url': `url(${appLogo.value.url})`,
    };
  };

  /**
   * Verifica si se debe mostrar "Powered by"
   */
  const shouldShowPoweredBy = computed(() => advancedConfig.value.showPoweredBy);

  /**
   * Obtiene el texto del footer
   */
  const footerText = computed(
    () =>
      advancedConfig.value.footerText ||
      `© ${new Date().getFullYear()} ${appTitle.value}. Todos los derechos reservados.`,
  );

  /**
   * Obtiene el mensaje de bienvenida
   */
  const welcomeMessage = computed(
    () => advancedConfig.value.welcomeMessage || `Bienvenido a ${appTitle.value}`,
  );

  return {
    // Datos computados
    appTitle,
    appDescription,
    appTagline,
    appLogo,
    brandColors,
    contactInfo,
    pwaConfig,
    advancedConfig,
    shouldShowPoweredBy,
    footerText,
    welcomeMessage,
    cssVariables,

    // Métodos
    applyBranding,
    applyCustomStyles,
    updateDocumentTitle,
    updateMetaTags,
    updateFavicon,
    getCSSVariables,
  };
}
