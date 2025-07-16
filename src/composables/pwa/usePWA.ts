/**
 * 🚀 INICIALIZADOR PRINCIPAL DE PWA
 * Integra y coordina todas las funcionalidades offline
 * Fase 1 - Iniciativa 5: Coordinación Central
 */

import { useOfflineStore } from '@/services/offlineService';
import { useSyncStore } from '@/composables/sync/useOfflineSync';
import { useNotificationStore } from '@/composables/ui/useNotifications';
import { storeToRefs } from 'pinia';

// ==================== COMPOSABLE PRINCIPAL PWA ====================

export function usePWA() {
  // Stores
  const offlineStore = useOfflineStore();
  const syncStore = useSyncStore();
  const notificationStore = useNotificationStore();

  // Estados reactivos
  const { isOnline, syncStats, storageInfo } = storeToRefs(offlineStore);
  const { syncStatus, pendingOperations, lastSyncTime } = storeToRefs(syncStore);
  const { hasActiveNotifications, unreadCount } = storeToRefs(notificationStore);

  // ==================== INICIALIZACIÓN ====================

  async function initializePWA() {
    try {
      console.log('🚀 Inicializando PWA...');

      // Inicializar notificaciones
      notificationStore.initialize();

      // Solicitar permisos de notificación
      await notificationStore.requestPermission();

      // Inicializar sistema offline
      await offlineStore.autoInitialize();

      // Inicializar sincronización
      await syncStore.initializePWA();

      console.log('✅ PWA inicializada exitosamente');

      // Mostrar notificación de bienvenida si es la primera vez
      const isFirstTime = localStorage.getItem('pwa-initialized') === null;
      if (isFirstTime) {
        notificationStore.showSuccess(
          '¡Bienvenido!',
          'La aplicación ya funciona offline. Podrás usar todas las funciones sin conexión.',
        );
        localStorage.setItem('pwa-initialized', 'true');
      }
    } catch (error) {
      console.error('❌ Error inicializando PWA:', error);
      notificationStore.showError(
        'Error de Inicialización',
        'Hubo un problema iniciando las funciones offline. Algunas características pueden no estar disponibles.',
      );
    }
  }

  // ==================== EVENTOS DE CONEXIÓN ====================

  function handleConnectionChange() {
    // Este manejador se configurará en onMounted
    if (navigator.onLine) {
      handleOnline();
    } else {
      handleOffline();
    }
  }

  async function handleOnline() {
    console.log('🌐 Conexión restaurada');
    notificationStore.notifyOnlineMode();
    await offlineStore.handleAppOnline();
  }

  function handleOffline() {
    console.log('📱 Conexión perdida');
    notificationStore.notifyOfflineMode();
    offlineStore.handleAppOffline();
  }

  // ==================== EVENTOS DE VISIBILIDAD ====================

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // App visible - verificar sincronización
      syncStore.handleAppVisibilityChange();
    }
  }

  // ==================== INSTALACIÓN PWA ====================

  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  function handleBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
    // Prevenir que se muestre automáticamente
    event.preventDefault();
    deferredPrompt = event;

    // Mostrar notificación personalizada
    notificationStore.showToast('Instalación Disponible', {
      message: 'Puedes instalar esta aplicación en tu dispositivo',
      type: 'info',
      persistent: true,
      actions: [
        {
          label: 'Instalar',
          action: promptInstall,
          color: 'primary',
        },
        {
          label: 'Más tarde',
          action: () => {
            // Solo cerrar
          },
        },
      ],
    });
  }

  async function promptInstall() {
    if (!deferredPrompt) {
      notificationStore.showWarning(
        'Instalación no disponible',
        'La aplicación no puede ser instalada en este momento.',
      );
      return;
    }

    try {
      // Mostrar el prompt de instalación
      deferredPrompt.prompt();

      // Esperar respuesta del usuario
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        notificationStore.showSuccess(
          '¡Aplicación Instalada!',
          'La aplicación se ha instalado correctamente en tu dispositivo.',
        );
      }

      deferredPrompt = null;
    } catch (error) {
      console.error('Error durante la instalación:', error);
      notificationStore.showError(
        'Error de Instalación',
        'Hubo un problema instalando la aplicación.',
      );
    }
  }

  // ==================== ACTUALIZACIONES ====================

  function handleAppInstalled() {
    notificationStore.showSuccess(
      '¡Aplicación Instalada!',
      'Ahora puedes usar la aplicación desde tu pantalla de inicio.',
    );
  }

  // ==================== UTILIDADES PWA ====================

  function isPWAInstalled(): boolean {
    // Verificar si la app está corriendo como PWA instalada
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    return standalone || fullscreen || (window.navigator as any).standalone === true;
  }

  function getPWADisplayMode(): string {
    if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
    if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
    return 'browser';
  }

  async function sharePWA() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Music Academy App',
          text: 'Aplicación para gestión de academia musical',
          url: window.location.origin,
        });

        notificationStore.showSuccess('Compartido exitosamente');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error compartiendo:', error);
        }
      }
    } else {
      // Fallback: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(window.location.origin);
        notificationStore.showSuccess('Enlace copiado al portapapeles');
      } catch (error) {
        console.error('Error copiando al portapapeles:', error);
        notificationStore.showError('No se pudo compartir la aplicación');
      }
    }
  }

  // ==================== ESTADÍSTICAS PWA ====================

  function getPWAStats() {
    return {
      isOnline: isOnline.value,
      isInstalled: isPWAInstalled(),
      displayMode: getPWADisplayMode(),
      syncStats: syncStats.value,
      storageInfo: storageInfo.value,
      pendingOperations: pendingOperations.value,
      lastSync: lastSyncTime.value,
      notificationsEnabled: notificationStore.permission === 'granted',
      hasActiveNotifications: hasActiveNotifications.value,
      unreadCount: unreadCount.value,
    };
  }

  // ==================== DIAGNÓSTICO ====================

  async function runPWADiagnostic() {
    const diagnostics = {
      serviceWorker: 'serviceWorker' in navigator,
      notifications: 'Notification' in window,
      backgroundSync:
        'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      indexedDB: 'indexedDB' in window,
      cacheAPI: 'caches' in window,
      webShare: 'share' in navigator,
      installPrompt: deferredPrompt !== null,
      pushManager: 'serviceWorker' in navigator && 'PushManager' in window,
      isOnline: navigator.onLine,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
    };

    console.log('🔍 Diagnóstico PWA:', diagnostics);
    return diagnostics;
  }

  // ==================== CICLO DE VIDA ====================

  function setupEventListeners() {
    // Registrar event listeners
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Verificar estado inicial de conexión
    handleConnectionChange();
  }

  function cleanupEventListeners() {
    // Limpiar event listeners
    window.removeEventListener('online', handleConnectionChange);
    window.removeEventListener('offline', handleConnectionChange);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.removeEventListener('appinstalled', handleAppInstalled);
  }

  // ==================== RETURN ====================

  return {
    // Estados
    isOnline,
    syncStats,
    storageInfo,
    syncStatus,
    pendingOperations,
    lastSyncTime,
    hasActiveNotifications,
    unreadCount,

    // Inicialización
    initializePWA,
    setupEventListeners,
    cleanupEventListeners,

    // Eventos
    handleConnectionChange,
    handleOnline,
    handleOffline,
    handleVisibilityChange,

    // Instalación
    promptInstall,
    isPWAInstalled,
    getPWADisplayMode,

    // Utilidades
    sharePWA,
    getPWAStats,
    runPWADiagnostic,

    // Acceso a stores
    offlineStore,
    syncStore,
    notificationStore,
  };
}

// ==================== TIPO PARA BEFOREINSTALLPROMPT ====================

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>
}
