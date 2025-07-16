/**
 * 📊 SISTEMA DE MONITOREO EN TIEMPO REAL (RUM)
 * Fase 2 - Iniciativa 4: Real User Monitoring
 */

import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';
import { useRoute, useRouter } from 'vue-router';

// ==================== TIPOS ====================

interface UserSession {
  id: string
  userId?: string
  startTime: Date
  lastActivity: Date
  pageViews: number
  actions: UserAction[]
  device: DeviceInfo
  performance: SessionPerformance
  errors: ErrorEvent[]
  location: GeolocationData | null
}

interface UserAction {
  id: string
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'api_call' | 'error'
  element?: string
  timestamp: Date
  duration?: number
  data?: Record<string, any>
}

interface DeviceInfo {
  userAgent: string
  screen: {
    width: number
    height: number
    pixelRatio: number
  }
  viewport: {
    width: number
    height: number
  }
  connection?: NetworkInformation
  memory?: number
  cores?: number
  platform: string
  browser: BrowserInfo
}

interface BrowserInfo {
  name: string
  version: string
  engine: string
}

interface SessionPerformance {
  metrics: PerformanceMetrics
  vitals: WebVitals
  resources: ResourceTiming[]
  navigation: NavigationTiming
  memory: MemoryUsage[]
}

interface PerformanceMetrics {
  firstPaint: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
  timeToInteractive: number
  totalBlockingTime: number
}

interface WebVitals {
  fcp: number
  lcp: number
  fid: number
  cls: number
  tti: number
  tbt: number
}

interface ResourceTiming {
  name: string
  type: string
  size: number
  duration: number
  startTime: number
  cached: boolean
}

interface NavigationTiming {
  domContentLoaded: number
  loadComplete: number
  redirectTime: number
  dnsLookup: number
  tcpConnect: number
  requestTime: number
  responseTime: number
  domProcessing: number
}

interface MemoryUsage {
  timestamp: Date
  used: number
  total: number
  limit: number
}

interface GeolocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: Date
}

interface ErrorEvent {
  id: string
  type: 'javascript' | 'network' | 'resource' | 'csp' | 'unhandled'
  message: string
  stack?: string
  filename?: string
  lineno?: number
  colno?: number
  timestamp: Date
  userAgent: string
  url: string
}

interface MonitoringConfig {
  enabled: boolean
  sessionTracking: boolean
  performanceTracking: boolean
  errorTracking: boolean
  userInteractionTracking: boolean
  geolocationTracking: boolean
  sampling: {
    rate: number // 0-1
    maxSessions: number
  }
  privacy: {
    anonymizeIPs: boolean
    excludePersonalData: boolean
    respectDNT: boolean
  }
  endpoints: {
    events: string
    errors: string
    performance: string
  }
}

// ==================== CONFIGURACIÓN PREDETERMINADA ====================

const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: true,
  sessionTracking: true,
  performanceTracking: true,
  errorTracking: true,
  userInteractionTracking: true,
  geolocationTracking: false,
  sampling: {
    rate: 1.0, // 100% en desarrollo
    maxSessions: 1000,
  },
  privacy: {
    anonymizeIPs: true,
    excludePersonalData: true,
    respectDNT: true,
  },
  endpoints: {
    events: '/api/monitoring/events',
    errors: '/api/monitoring/errors',
    performance: '/api/monitoring/performance',
  },
};

// ==================== STORE DE MONITOREO ====================

export const useMonitoringStore = defineStore('monitoring', () => {
  // Estado
  const config = ref<MonitoringConfig>(DEFAULT_MONITORING_CONFIG);
  const currentSession = ref<UserSession | null>(null);
  const isInitialized = ref(false);
  const isTracking = ref(false);
  const performanceObserver = ref<PerformanceObserver | null>(null);
  const mutationObserver = ref<MutationObserver | null>(null);
  const intersectionObserver = ref<IntersectionObserver | null>(null);

  // Referencias de Vue Router
  const route = useRoute();
  const router = useRouter();

  // Computed
  const sessionDuration = computed(() => {
    if (!currentSession.value) return 0;
    return Date.now() - currentSession.value.startTime.getTime();
  });

  const averageResponseTime = computed(() => {
    if (!currentSession.value?.performance.resources.length) return 0;

    const apiCalls = currentSession.value.performance.resources.filter(
      (r) => r.type === 'xmlhttprequest' || r.type === 'fetch',
    );

    if (apiCalls.length === 0) return 0;

    return apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length;
  });

  const errorRate = computed(() => {
    if (!currentSession.value?.actions.length) return 0;

    const totalActions = currentSession.value.actions.length;
    const errorActions = currentSession.value.errors.length;

    return (errorActions / totalActions) * 100;
  });

  // ==================== INICIALIZACIÓN ====================

  function initializeMonitoring(userId?: string) {
    if (isInitialized.value) return;

    console.log('📊 Inicializando monitoreo en tiempo real...');

    try {
      // Verificar si el usuario permite tracking
      if (config.value.privacy.respectDNT && navigator.doNotTrack === '1') {
        console.log('🚫 Do Not Track detectado - monitoreo deshabilitado');
        return;
      }

      // Verificar sampling
      if (Math.random() > config.value.sampling.rate) {
        console.log('📊 Sesión no seleccionada para sampling');
        return;
      }

      // Crear sesión
      createSession(userId);

      // Configurar tracking
      setupSessionTracking();
      setupPerformanceTracking();
      setupErrorTracking();
      setupUserInteractionTracking();
      setupGeolocationTracking();

      // Iniciar tracking
      isTracking.value = true;
      isInitialized.value = true;

      console.log('✅ Monitoreo inicializado');
    } catch (error) {
      console.error('❌ Error inicializando monitoreo:', error);
    }
  }

  // ==================== GESTIÓN DE SESIÓN ====================

  function createSession(userId?: string) {
    const sessionId = generateSessionId();

    currentSession.value = {
      id: sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      pageViews: 1,
      actions: [],
      device: collectDeviceInfo(),
      performance: {
        metrics: {} as PerformanceMetrics,
        vitals: {} as WebVitals,
        resources: [],
        navigation: {} as NavigationTiming,
        memory: [],
      },
      errors: [],
      location: null,
    };

    // Enviar evento de inicio de sesión
    trackAction({
      type: 'navigation',
      element: route.path,
      data: {
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      },
    });
  }

  function updateLastActivity() {
    if (currentSession.value) {
      currentSession.value.lastActivity = new Date();
    }
  }

  function endSession() {
    if (!currentSession.value) return;

    try {
      // Calcular duración final
      const duration = sessionDuration.value;

      // Enviar datos finales de la sesión
      sendSessionData({
        ...currentSession.value,
        duration,
      });

      console.log(`📊 Sesión terminada. Duración: ${Math.round(duration / 1000)}s`);
    } catch (error) {
      console.error('Error terminando sesión:', error);
    }

    currentSession.value = null;
    isTracking.value = false;
  }

  // ==================== TRACKING DE SESIÓN ====================

  function setupSessionTracking() {
    if (!config.value.sessionTracking) return;

    // Trackear cambios de página
    watch(
      () => route.path,
      (newPath, oldPath) => {
        if (oldPath && newPath !== oldPath) {
          trackPageView(newPath);
        }
      },
    );

    // Trackear actividad del usuario
    const activityEvents = ['click', 'scroll', 'keypress', 'mousemove', 'touchstart'];

    activityEvents.forEach((eventType) => {
      document.addEventListener(eventType, updateLastActivity, { passive: true });
    });

    // Trackear cuando la ventana pierde/gana foco
    document.addEventListener('visibilitychange', () => {
      trackAction({
        type: 'navigation',
        data: {
          visibility: document.visibilityState,
        },
      });
    });

    // Trackear antes de cerrar la página
    window.addEventListener('beforeunload', endSession);
  }

  function trackPageView(path: string) {
    if (!currentSession.value) return;

    currentSession.value.pageViews++;

    trackAction({
      type: 'navigation',
      element: path,
      data: {
        timestamp: Date.now(),
        referrer: document.referrer,
      },
    });

    console.log(`📄 Page view tracked: ${path}`);
  }

  // ==================== TRACKING DE RENDIMIENTO ====================

  function setupPerformanceTracking() {
    if (!config.value.performanceTracking) return;

    try {
      // Performance Observer para métricas web vitals
      performanceObserver.value = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          processPerformanceEntry(entry);
        }
      });

      // Observar diferentes tipos de métricas
      const observeTypes = [
        'navigation',
        'resource',
        'paint',
        'largest-contentful-paint',
        'first-input',
        'layout-shift',
      ];

      observeTypes.forEach((type) => {
        try {
          performanceObserver.value?.observe({ entryTypes: [type] });
        } catch (error) {
          // Algunos tipos no están disponibles en todos los browsers
          console.warn(`Performance observer type ${type} not supported`);
        }
      });

      // Trackear memoria si está disponible
      if ('memory' in performance) {
        trackMemoryUsage();
        setInterval(trackMemoryUsage, 30000); // Cada 30 segundos
      }

      // Trackear métricas de navegación
      window.addEventListener('load', () => {
        setTimeout(collectNavigationMetrics, 0);
      });
    } catch (error) {
      console.warn('Error configurando performance tracking:', error);
    }
  }

  function processPerformanceEntry(entry: PerformanceEntry) {
    if (!currentSession.value) return;

    try {
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming;
        currentSession.value.performance.navigation = {
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
          redirectTime: navEntry.redirectEnd - navEntry.redirectStart,
          dnsLookup: navEntry.domainLookupEnd - navEntry.domainLookupStart,
          tcpConnect: navEntry.connectEnd - navEntry.connectStart,
          requestTime: navEntry.responseStart - navEntry.requestStart,
          responseTime: navEntry.responseEnd - navEntry.responseStart,
          domProcessing: navEntry.domComplete - navEntry.domLoading,
        };
      }

      if (entry.entryType === 'resource') {
        const resEntry = entry as PerformanceResourceTiming;
        currentSession.value.performance.resources.push({
          name: resEntry.name,
          type: getResourceType(resEntry),
          size: resEntry.transferSize || 0,
          duration: resEntry.duration,
          startTime: resEntry.startTime,
          cached: resEntry.transferSize === 0 && resEntry.decodedBodySize > 0,
        });
      }

      if (entry.entryType === 'paint') {
        const paintEntry = entry as PerformancePaintTiming;
        if (paintEntry.name === 'first-paint') {
          currentSession.value.performance.metrics.firstPaint = paintEntry.startTime;
          currentSession.value.performance.vitals.fcp = paintEntry.startTime;
        }
        if (paintEntry.name === 'first-contentful-paint') {
          currentSession.value.performance.metrics.firstContentfulPaint = paintEntry.startTime;
          currentSession.value.performance.vitals.fcp = paintEntry.startTime;
        }
      }

      if (entry.entryType === 'largest-contentful-paint') {
        currentSession.value.performance.metrics.largestContentfulPaint = entry.startTime;
        currentSession.value.performance.vitals.lcp = entry.startTime;
      }

      if (entry.entryType === 'first-input') {
        const fidEntry = entry as PerformanceEventTiming;
        currentSession.value.performance.metrics.firstInputDelay =
          fidEntry.processingStart - fidEntry.startTime;
        currentSession.value.performance.vitals.fid = fidEntry.processingStart - fidEntry.startTime;
      }

      if (entry.entryType === 'layout-shift') {
        const clsEntry = entry as any; // Layout shift no tiene tipo oficial
        if (!clsEntry.hadRecentInput) {
          currentSession.value.performance.metrics.cumulativeLayoutShift += clsEntry.value;
          currentSession.value.performance.vitals.cls =
            currentSession.value.performance.metrics.cumulativeLayoutShift;
        }
      }
    } catch (error) {
      console.warn('Error procesando performance entry:', error);
    }
  }

  function getResourceType(entry: PerformanceResourceTiming): string {
    const initiatorType = entry.initiatorType;
    if (initiatorType) return initiatorType;

    const url = new URL(entry.name);
    const extension = url.pathname.split('.').pop()?.toLowerCase();

    const typeMap: Record<string, string> = {
      js: 'script',
      css: 'css',
      png: 'img',
      jpg: 'img',
      jpeg: 'img',
      gif: 'img',
      svg: 'img',
      webp: 'img',
      woff: 'font',
      woff2: 'font',
      ttf: 'font',
      otf: 'font',
    };

    return typeMap[extension || ''] || 'other';
  }

  function trackMemoryUsage() {
    if (!currentSession.value || !('memory' in performance)) return;

    const memory = (performance as any).memory;

    currentSession.value.performance.memory.push({
      timestamp: new Date(),
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    });
  }

  function collectNavigationMetrics() {
    if (!currentSession.value) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      // Calcular TTI aproximado
      const tti = navigation.domContentLoadedEventEnd;
      currentSession.value.performance.metrics.timeToInteractive = tti;
      currentSession.value.performance.vitals.tti = tti;

      // Calcular TBT aproximado
      const tbt = Math.max(0, navigation.loadEventStart - navigation.domContentLoadedEventEnd - 50);
      currentSession.value.performance.metrics.totalBlockingTime = tbt;
      currentSession.value.performance.vitals.tbt = tbt;
    }
  }

  // ==================== TRACKING DE ERRORES ====================

  function setupErrorTracking() {
    if (!config.value.errorTracking) return;

    // JavaScript errors
    window.addEventListener('error', (event) => {
      trackError({
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    });

    // Unhandled Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      trackError({
        type: 'unhandled',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    });

    // Network errors
    window.addEventListener(
      'error',
      (event) => {
        const target = event.target as HTMLElement;
        if (
          target &&
          (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')
        ) {
          trackError({
            type: 'resource',
            message: `Failed to load resource: ${(target as any).src || (target as any).href}`,
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          });
        }
      },
      true,
    );

    // CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      trackError({
        type: 'csp',
        message: `CSP Violation: ${event.violatedDirective}`,
        filename: event.sourceFile,
        lineno: event.lineNumber,
        colno: event.columnNumber,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    });
  }

  function trackError(error: Omit<ErrorEvent, 'id'>) {
    if (!currentSession.value) return;

    const errorEvent: ErrorEvent = {
      id: generateErrorId(),
      ...error,
    };

    currentSession.value.errors.push(errorEvent);

    // Limitar número de errores guardados
    if (currentSession.value.errors.length > 100) {
      currentSession.value.errors = currentSession.value.errors.slice(-100);
    }

    console.error('🚨 Error tracked:', errorEvent);

    // Enviar error crítico inmediatamente
    if (error.type === 'javascript' || error.type === 'csp') {
      sendErrorData(errorEvent);
    }
  }

  // ==================== TRACKING DE INTERACCIONES ====================

  function setupUserInteractionTracking() {
    if (!config.value.userInteractionTracking) return;

    // Clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target) {
        trackAction({
          type: 'click',
          element: getElementSelector(target),
          data: {
            x: event.clientX,
            y: event.clientY,
            button: event.button,
          },
        });
      }
    });

    // Scrolling
    let scrollTimeout: number;
    document.addEventListener(
      'scroll',
      () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(() => {
          trackAction({
            type: 'scroll',
            data: {
              scrollY: window.scrollY,
              scrollX: window.scrollX,
              documentHeight: document.documentElement.scrollHeight,
              viewportHeight: window.innerHeight,
            },
          });
        }, 150);
      },
      { passive: true },
    );

    // Form inputs
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (target && target.tagName === 'INPUT') {
        trackAction({
          type: 'input',
          element: getElementSelector(target),
          data: {
            inputType: target.type,
            valueLength: target.value.length,
          },
        });
      }
    });
  }

  function trackAction(action: Omit<UserAction, 'id' | 'timestamp'>) {
    if (!currentSession.value) return;

    const userAction: UserAction = {
      id: generateActionId(),
      timestamp: new Date(),
      ...action,
    };

    currentSession.value.actions.push(userAction);
    updateLastActivity();

    // Limitar número de acciones guardadas
    if (currentSession.value.actions.length > 1000) {
      currentSession.value.actions = currentSession.value.actions.slice(-1000);
    }
  }

  function getElementSelector(element: HTMLElement): string {
    // Generar selector único pero sin información sensible
    let selector = element.tagName.toLowerCase();

    if (element.id) {
      selector += `#${element.id}`;
    } else if (element.className) {
      const classes = element.className.split(' ').filter((c) => c.length > 0);
      if (classes.length > 0) {
        selector += `.${classes[0]}`;
      }
    }

    return selector;
  }

  // ==================== GEOLOCALIZACIÓN ====================

  function setupGeolocationTracking() {
    if (!config.value.geolocationTracking) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (currentSession.value) {
            currentSession.value.location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(),
            };
          }
        },
        (error) => {
          console.warn('Error obteniendo geolocalización:', error);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutos
        },
      );
    }
  }

  // ==================== INFORMACIÓN DEL DISPOSITIVO ====================

  function collectDeviceInfo(): DeviceInfo {
    const screen = {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1,
    };

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    const memory = (navigator as any).deviceMemory;

    const cores = navigator.hardwareConcurrency;

    const browser = detectBrowser();

    return {
      userAgent: navigator.userAgent,
      screen,
      viewport,
      connection,
      memory,
      cores,
      platform: navigator.platform,
      browser,
    };
  }

  function detectBrowser(): BrowserInfo {
    const ua = navigator.userAgent;

    let name = 'Unknown';
    let version = 'Unknown';
    let engine = 'Unknown';

    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      name = 'Chrome';
      version = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
      engine = 'Blink';
    } else if (ua.includes('Firefox')) {
      name = 'Firefox';
      version = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
      engine = 'Gecko';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      name = 'Safari';
      version = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
      engine = 'WebKit';
    } else if (ua.includes('Edg')) {
      name = 'Edge';
      version = ua.match(/Edg\/([0-9.]+)/)?.[1] || 'Unknown';
      engine = 'Blink';
    }

    return { name, version, engine };
  }

  // ==================== ENVÍO DE DATOS ====================

  async function sendSessionData(sessionData: any) {
    if (!config.value.enabled) return;

    try {
      // En una aplicación real, esto enviaría los datos a un endpoint
      console.log('📤 Enviando datos de sesión:', {
        sessionId: sessionData.id,
        duration: sessionData.duration,
        pageViews: sessionData.pageViews,
        actionsCount: sessionData.actions.length,
        errorsCount: sessionData.errors.length,
        performanceScore: calculatePerformanceScore(sessionData.performance),
      });

      // Simular envío
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error enviando datos de sesión:', error);
    }
  }

  async function sendErrorData(errorData: ErrorEvent) {
    if (!config.value.enabled) return;

    try {
      console.log('📤 Enviando datos de error:', errorData);
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error enviando datos de error:', error);
    }
  }

  function calculatePerformanceScore(performance: SessionPerformance): number {
    let score = 100;

    // Deducir puntos basado en métricas
    if (performance.vitals.fcp > 2500) score -= 20;
    if (performance.vitals.lcp > 4000) score -= 25;
    if (performance.vitals.fid > 300) score -= 20;
    if (performance.vitals.cls > 0.25) score -= 15;

    return Math.max(0, score);
  }

  // ==================== UTILIDADES ====================

  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function getSessionSummary() {
    if (!currentSession.value) return null;

    return {
      sessionId: currentSession.value.id,
      duration: sessionDuration.value,
      pageViews: currentSession.value.pageViews,
      actions: currentSession.value.actions.length,
      errors: currentSession.value.errors.length,
      performanceScore: calculatePerformanceScore(currentSession.value.performance),
      averageResponseTime: averageResponseTime.value,
      errorRate: errorRate.value,
      device: currentSession.value.device.browser,
    };
  }

  function updateConfig(newConfig: Partial<MonitoringConfig>) {
    config.value = { ...config.value, ...newConfig };
  }

  function stopTracking() {
    isTracking.value = false;

    // Cleanup observers
    performanceObserver.value?.disconnect();
    mutationObserver.value?.disconnect();
    intersectionObserver.value?.disconnect();

    endSession();
  }

  // ==================== RETURN ====================

  return {
    // Estado
    config,
    currentSession,
    isInitialized,
    isTracking,

    // Computed
    sessionDuration,
    averageResponseTime,
    errorRate,

    // Métodos principales
    initializeMonitoring,
    trackAction,
    trackError,
    trackPageView,

    // Utilidades
    getSessionSummary,
    updateConfig,
    stopTracking,
    endSession,
  };
});

// ==================== COMPOSABLE ====================

export function useMonitoring() {
  const store = useMonitoringStore();

  return {
    ...store,

    // Métodos de conveniencia
    trackClick: (element: string, data?: Record<string, any>) =>
      store.trackAction({ type: 'click', element, data }),

    trackApiCall: (endpoint: string, duration: number, success: boolean) =>
      store.trackAction({
        type: 'api_call',
        element: endpoint,
        duration,
        data: { success },
      }),

    trackCustomEvent: (name: string, data?: Record<string, any>) =>
      store.trackAction({
        type: 'click', // Usar tipo existente
        element: name,
        data,
      }),
  };
}
