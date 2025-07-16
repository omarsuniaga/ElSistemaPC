import { ref, computed } from 'vue';

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  updateAvailable: boolean
}

const pwaState = ref<PWAState>({
  isInstallable: false,
  isInstalled: false,
  isOnline: navigator.onLine,
  updateAvailable: false,
});

let deferredPrompt: any = null;
let registration: ServiceWorkerRegistration | null = null;

export function usePWA() {
  // Check if app is installed
  const checkInstallation = () => {
    if (typeof window !== 'undefined') {
      // Check if running as PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      pwaState.value.isInstalled = isStandalone || isFullscreen || isMinimalUI ||
        // @ts-ignore - webkit specific
        (window.navigator as any).standalone === true;
    }
  };

  // Install app
  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      // Show install prompt
      deferredPrompt.prompt();
      
      // Wait for user choice
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        pwaState.value.isInstallable = false;
        pwaState.value.isInstalled = true;
        deferredPrompt = null;
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error during installation:', error);
      return false;
    }
  };

  // Update app
  const updateApp = async (): Promise<boolean> => {
    if (!registration || !registration.waiting) {
      console.warn('No update available');
      return false;
    }

    try {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to activate the new service worker
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Error during update:', error);
      return false;
    }
  };

  // Check for updates
  const checkForUpdates = async (): Promise<boolean> => {
    if (!registration) {
      console.warn('Service worker not registered');
      return false;
    }

    try {
      await registration.update();
      return true;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  };

  // Share content (Web Share API)
  const shareContent = async (data: {
    title?: string
    text?: string
    url?: string
  }): Promise<boolean> => {
    if (!navigator.share) {
      console.warn('Web Share API not supported');
      return false;
    }

    try {
      await navigator.share({
        title: data.title || 'Sistema de Gestión Musical',
        text: data.text || 'Descubre este increíble sistema de gestión musical',
        url: data.url || window.location.href,
      });
      return true;
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  };

  // Get connection info
  const getConnectionInfo = () => {
    // @ts-ignore - experimental API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
      return {
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
      };
    }

    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false,
    };
  };

  // Add to home screen (iOS Safari specific)
  const addToHomeScreen = () => {
    if (pwaState.value.isInstalled) {
      return false;
    }

    // For iOS Safari, show instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      alert('Para instalar esta aplicación:\n1. Toca el botón de compartir 📤\n2. Selecciona "Añadir a pantalla de inicio" 📱\n3. Toca "Añadir" en la parte superior derecha');
      return true;
    }

    return false;
  };

  // Register for push notifications
  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    // Request permission
    const permission = await Notification.requestPermission();
    return permission;
  };

  // Show local notification
  const showNotification = async (title: string, options?: NotificationOptions): Promise<boolean> => {
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      return false;
    }

    try {
      if (registration && registration.showNotification) {
        // Use service worker notification (better for PWA)
        await registration.showNotification(title, {
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
          vibrate: [100, 50, 100],
          ...options,
        });
      } else {
        // Fallback to regular notification
        new Notification(title, {
          icon: '/icon-192x192.png',
          ...options,
        });
      }
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  };

  // Initialize PWA features
  const initializePWA = () => {
    if (typeof window === 'undefined') return;

    // Check installation status
    checkInstallation();

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      pwaState.value.isInstallable = true;
    });

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      pwaState.value.isInstalled = true;
      pwaState.value.isInstallable = false;
      deferredPrompt = null;
    });

    // Listen for online/offline
    window.addEventListener('online', () => {
      pwaState.value.isOnline = true;
    });

    window.addEventListener('offline', () => {
      pwaState.value.isOnline = false;
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          registration = reg;
          console.log('Service Worker registered');

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  pwaState.value.updateAvailable = true;
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  };

  return {
    // State
    isInstallable: computed(() => pwaState.value.isInstallable),
    isInstalled: computed(() => pwaState.value.isInstalled),
    isOnline: computed(() => pwaState.value.isOnline),
    updateAvailable: computed(() => pwaState.value.updateAvailable),
    
    // Connection info
    connectionInfo: computed(() => getConnectionInfo()),
    
    // Methods
    installApp,
    updateApp,
    checkForUpdates,
    addToHomeScreen,
    shareContent,
    requestNotificationPermission,
    showNotification,
    initializePWA,
  };
}
