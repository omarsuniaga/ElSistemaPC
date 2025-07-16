import { ref, onMounted, onUnmounted } from 'vue';

export interface NetworkStatus {
  isOnline: boolean
  connectionQuality: 'fast' | 'slow' | 'offline'
  lastChecked: Date | null
}

export function useNetworkStatus() {
  const isOnline = ref(navigator.onLine);
  const connectionQuality = ref<'fast' | 'slow' | 'offline'>('fast');
  const lastChecked = ref<Date | null>(null);
  const isChecking = ref(false);

  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine;
    lastChecked.value = new Date();

    console.log(
      `🌐 Estado de conexión: ${isOnline.value ? 'ONLINE' : 'OFFLINE'} - ${lastChecked.value.toLocaleTimeString()}`,
    );

    // Emit custom event para otros componentes
    window.dispatchEvent(
      new CustomEvent('network-status-change', {
        detail: { isOnline: isOnline.value, timestamp: lastChecked.value },
      }),
    );
  };

  const testConnectionSpeed = async (): Promise<void> => {
    if (isChecking.value) return;

    isChecking.value = true;
    const startTime = Date.now();

    try {
      // Crear un endpoint de ping simple
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(`${window.location.origin}/favicon.ico?t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (duration < 1000) {
        connectionQuality.value = 'fast';
        console.log(`⚡ Conexión rápida: ${duration}ms`);
      } else if (duration < 3000) {
        connectionQuality.value = 'slow';
        console.log(`🐌 Conexión lenta: ${duration}ms`);
      } else {
        connectionQuality.value = 'offline';
        console.log(`❌ Conexión muy lenta: ${duration}ms`);
      }

      lastChecked.value = new Date();
    } catch (error: any) {
      connectionQuality.value = 'offline';
      console.log('❌ Error de conexión:', error.message);
    } finally {
      isChecking.value = false;
    }
  };

  const forceCheck = async () => {
    console.log('🔄 Verificando estado de conexión...');
    updateOnlineStatus();
    if (isOnline.value) {
      await testConnectionSpeed();
    }
  };

  onMounted(() => {
    console.log('🔌 Inicializando monitor de red...');

    // Event listeners para cambios de conexión
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Test inicial
    updateOnlineStatus();
    if (isOnline.value) {
      testConnectionSpeed();
    }

    // Test periódico cada 30 segundos
    const intervalId = setInterval(() => {
      if (isOnline.value) {
        testConnectionSpeed();
      }
    }, 30000);

    // Cleanup en unmount
    onUnmounted(() => {
      clearInterval(intervalId);
    });
  });

  onUnmounted(() => {
    console.log('🔌 Desconectando monitor de red...');
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  });

  return {
    isOnline,
    connectionQuality,
    lastChecked,
    isChecking,
    forceCheck,
    testConnectionSpeed,
  };
}
