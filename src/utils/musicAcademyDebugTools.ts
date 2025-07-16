/**
 * musicAcademyDebugTools.ts
 *
 * Herramientas de depuración avanzadas para la aplicación Music Academy
 * Estas herramientas permiten diagnosticar problemas relacionados con:
 * - PWA y Service Worker
 * - Caché y almacenamiento
 * - Red y sincronización
 * - Rendimiento y errores
 */

// Tipos para las herramientas de diagnóstico
interface CacheStats {
  cacheName: string
  size: number
  urls: string[]
}

interface ServiceWorkerInfo {
  status: 'active' | 'installing' | 'waiting' | 'redundant' | 'not-found'
  version?: string
  scriptURL?: string
  updateTime?: Date
}

interface StorageUsage {
  quota: number
  usage: number
  usageDetails: {
    cacheAPI: number
    indexedDB: number
    serviceWorkerRegistrations: number
    localStorage: number
    sessionStorage: number
    other: number
  }
  remainingSpace: number
  percentUsed: number
}

interface NetworkRequestStats {
  totalRequests: number
  cachedResponses: number
  networkResponses: number
  failedRequests: number
  averageResponseTime: number
}

interface DebugTools {
  // Service Worker tools
  getServiceWorkerStatus(): Promise<ServiceWorkerInfo>
  forceServiceWorkerUpdate(): Promise<boolean>
  unregisterServiceWorker(): Promise<boolean>
  clearServiceWorkerState(): Promise<boolean>

  // Cache tools
  getCacheStats(): Promise<CacheStats[]>
  clearCache(cacheName?: string): Promise<boolean>
  inspectCachedResponse(url: string): Promise<Response | null>

  // Storage tools
  getStorageUsage(): Promise<StorageUsage>
  clearStorageData(type: 'cache' | 'indexedDB' | 'localStorage' | 'all'): Promise<boolean>
  inspectIndexedDB(): Promise<Record<string, unknown>>

  // Network tools
  inspectNetworkRequests(): Promise<NetworkRequestStats>
  simulateOffline(): void
  simulateOnline(): void
  simulateSlow2G(): void
  simulateFast3G(): void
  resetNetworkConditions(): void

  // Sync tools
  getBackgroundSyncQueue(): Promise<unknown[]>
  triggerBackgroundSync(tag?: string): Promise<boolean>
  clearSyncQueue(): Promise<boolean>

  // Logging tools
  enableVerboseLogging(): void
  disableVerboseLogging(): void
  exportDebugLogs(): Promise<Blob>
}

/**
 * Implementación de herramientas de diagnóstico
 */
class MusicAcademyDebugTools implements DebugTools {
  private verboseLogging = false;
  private logs: string[] = [];
  private requestInterceptor: any = null;

  constructor() {
    this.log('Debug tools initialized');

    // Añadir al objeto global para acceso desde la consola
    if (typeof window !== 'undefined') {
      ;(window as any).musicAcademyDebug = this;
    }
  }

  // Helper para logging
  private log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;

    this.logs.push(logEntry);
    if (this.verboseLogging || message.includes('[ERROR]')) {
      console.log(logEntry);
      if (data) console.dir(data);
    }
  }

  // Service Worker tools
  async getServiceWorkerStatus(): Promise<ServiceWorkerInfo> {
    try {
      if (!('serviceWorker' in navigator)) {
        return { status: 'not-found' };
      }

      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        return { status: 'not-found' };
      }

      let status: ServiceWorkerInfo['status'] = 'not-found';
      let scriptURL;

      if (registration.active) {
        status = 'active';
        scriptURL = registration.active.scriptURL;
      } else if (registration.installing) {
        status = 'installing';
        scriptURL = registration.installing.scriptURL;
      } else if (registration.waiting) {
        status = 'waiting';
        scriptURL = registration.waiting.scriptURL;
      }

      // Intentar obtener la versión del Service Worker
      let version;
      if (scriptURL) {
        try {
          const swContent = await fetch(scriptURL).then((r) => r.text());
          const versionMatch = swContent.match(/APP_VERSION\s*=\s*['"](.+)['"]/);
          if (versionMatch && versionMatch[1]) {
            version = versionMatch[1];
          }
        } catch (err) {
          this.log('[ERROR] Error extracting SW version', err);
        }
      }

      return {
        status,
        version,
        scriptURL,
        updateTime: registration.updateViaCache ? new Date() : undefined,
      };
    } catch (error) {
      this.log('[ERROR] Failed to get Service Worker status', error);
      return { status: 'not-found' };
    }
  }

  async forceServiceWorkerUpdate(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) return false;

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;

      await registration.update();
      this.log('Service Worker update triggered');
      return true;
    } catch (error) {
      this.log('[ERROR] Failed to update Service Worker', error);
      return false;
    }
  }

  async unregisterServiceWorker(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) return false;

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;

      const result = await registration.unregister();
      if (result) {
        this.log('Service Worker unregistered successfully');
      } else {
        this.log('Service Worker unregistration failed');
      }
      return result;
    } catch (error) {
      this.log('[ERROR] Failed to unregister Service Worker', error);
      return false;
    }
  }

  async clearServiceWorkerState(): Promise<boolean> {
    try {
      // Unregister the service worker
      await this.unregisterServiceWorker();

      // Clear caches
      await this.clearCache();

      this.log('Service Worker state cleared');
      return true;
    } catch (error) {
      this.log('[ERROR] Failed to clear Service Worker state', error);
      return false;
    }
  }

  // Cache tools
  async getCacheStats(): Promise<CacheStats[]> {
    try {
      if (!('caches' in window)) {
        return [];
      }

      const cacheNames = await caches.keys();
      const stats: CacheStats[] = [];

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        const urls = requests.map((req) => req.url);

        stats.push({
          cacheName,
          size: urls.length,
          urls,
        });
      }

      this.log(`Retrieved stats for ${stats.length} caches`);
      return stats;
    } catch (error) {
      this.log('[ERROR] Failed to get cache stats', error);
      return [];
    }
  }

  async clearCache(cacheName?: string): Promise<boolean> {
    try {
      if (!('caches' in window)) {
        return false;
      }

      if (cacheName) {
        await caches.delete(cacheName);
        this.log(`Cache "${cacheName}" cleared`);
      } else {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
        this.log(`All ${cacheNames.length} caches cleared`);
      }

      return true;
    } catch (error) {
      this.log('[ERROR] Failed to clear cache', error);
      return false;
    }
  }

  async inspectCachedResponse(url: string): Promise<Response | null> {
    try {
      if (!('caches' in window)) {
        return null;
      }

      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const response = await cache.match(url);

        if (response) {
          this.log(`Found cached response for ${url} in cache "${cacheName}"`);
          return response;
        }
      }

      this.log(`No cached response found for ${url}`);
      return null;
    } catch (error) {
      this.log('[ERROR] Failed to inspect cached response', error);
      return null;
    }
  }

  // Storage tools
  async getStorageUsage(): Promise<StorageUsage> {
    try {
      if (!('storage' in navigator && 'estimate' in navigator.storage)) {
        throw new Error('Storage API not supported');
      }

      const { usage, quota } = await navigator.storage.estimate();
      const usageInMB = Math.round((usage || 0) / (1024 * 1024));
      const quotaInMB = Math.round((quota || 0) / (1024 * 1024));
      const percentUsed = quota ? ((usage || 0) / quota) * 100 : 0;

      this.log(`Storage usage: ${usageInMB}MB / ${quotaInMB}MB (${percentUsed.toFixed(1)}%)`);

      // Estimate breakdown (this is approximate)
      const cacheSize = await this.estimateCacheSize();
      const idbSize = await this.estimateIndexedDBSize();
      const lsSize = this.estimateLocalStorageSize();
      const ssSize = this.estimateSessionStorageSize();

      return {
        quota: quota || 0,
        usage: usage || 0,
        usageDetails: {
          cacheAPI: cacheSize,
          indexedDB: idbSize,
          serviceWorkerRegistrations: 0, // Cannot accurately measure
          localStorage: lsSize,
          sessionStorage: ssSize,
          other: (usage || 0) - (cacheSize + idbSize + lsSize + ssSize),
        },
        remainingSpace: (quota || 0) - (usage || 0),
        percentUsed,
      };
    } catch (error) {
      this.log('[ERROR] Failed to get storage usage', error);
      return {
        quota: 0,
        usage: 0,
        usageDetails: {
          cacheAPI: 0,
          indexedDB: 0,
          serviceWorkerRegistrations: 0,
          localStorage: 0,
          sessionStorage: 0,
          other: 0,
        },
        remainingSpace: 0,
        percentUsed: 0,
      };
    }
  }

  private async estimateCacheSize(): Promise<number> {
    try {
      if (!('caches' in window)) return 0;

      // This is a very rough estimate
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();

        // Estimate each response as 10KB on average (very rough)
        totalSize += requests.length * 10 * 1024;
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  private async estimateIndexedDBSize(): Promise<number> {
    return 0; // Cannot accurately measure without specific implementation
  }

  private estimateLocalStorageSize(): number {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        const value = localStorage.getItem(key) || '';
        total += key.length + value.length;
      }
      return total * 2; // UTF-16 uses 2 bytes per character
    } catch (error) {
      return 0;
    }
  }

  private estimateSessionStorageSize(): number {
    try {
      let total = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i) || '';
        const value = sessionStorage.getItem(key) || '';
        total += key.length + value.length;
      }
      return total * 2; // UTF-16 uses 2 bytes per character
    } catch (error) {
      return 0;
    }
  }

  async clearStorageData(type: 'cache' | 'indexedDB' | 'localStorage' | 'all'): Promise<boolean> {
    try {
      switch (type) {
      case 'cache':
        return await this.clearCache();

      case 'indexedDB':
        // Not implemented
        return false;

      case 'localStorage':
        localStorage.clear();
        this.log('localStorage cleared');
        return true;

      case 'all':
        const cacheCleared = await this.clearCache();
        localStorage.clear();
        sessionStorage.clear();
        this.log('All storage cleared');
        return cacheCleared;

      default:
        return false;
      }
    } catch (error) {
      this.log('[ERROR] Failed to clear storage data', error);
      return false;
    }
  }

  async inspectIndexedDB(): Promise<Record<string, unknown>> {
    this.log('IndexedDB inspection not fully implemented');
    return {};
  }

  // Network tools
  async inspectNetworkRequests(): Promise<NetworkRequestStats> {
    const stats: NetworkRequestStats = {
      totalRequests: 0,
      cachedResponses: 0,
      networkResponses: 0,
      failedRequests: 0,
      averageResponseTime: 0,
    };

    this.log('Network requests inspection started. Open DevTools Network tab for details.');
    return stats;
  }

  simulateOffline(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SIMULATE_OFFLINE',
        payload: true,
      });
      this.log('Simulating offline mode (via Service Worker)');
    } else {
      this.log('[ERROR] Cannot simulate offline mode - no active service worker');
    }
  }

  simulateOnline(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SIMULATE_OFFLINE',
        payload: false,
      });
      this.log('Simulating online mode (via Service Worker)');
    }
  }

  simulateSlow2G(): void {
    this.log('Network condition simulation requires Chrome DevTools');
  }

  simulateFast3G(): void {
    this.log('Network condition simulation requires Chrome DevTools');
  }

  resetNetworkConditions(): void {
    this.simulateOnline();
    this.log('Network conditions reset');
  }

  // Sync tools
  async getBackgroundSyncQueue(): Promise<unknown[]> {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        return new Promise((resolve) => {
          const messageChannel = new MessageChannel();

          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.type === 'SYNC_QUEUE_STATE') {
              resolve(event.data.payload || []);
            } else {
              resolve([]);
            }
          };

          navigator.serviceWorker.controller.postMessage({ type: 'GET_SYNC_QUEUE' }, [
            messageChannel.port2,
          ]);
        });
      }
      return [];
    } catch (error) {
      this.log('[ERROR] Failed to get background sync queue', error);
      return [];
    }
  }

  async triggerBackgroundSync(tag = 'music-academy-sync'): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
        this.log('[ERROR] Background Sync not supported');
        return false;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        this.log('[ERROR] No Service Worker registration found');
        return false;
      }

      await registration.sync.register(tag);
      this.log(`Background sync triggered with tag "${tag}"`);
      return true;
    } catch (error) {
      this.log('[ERROR] Failed to trigger background sync', error);
      return false;
    }
  }

  async clearSyncQueue(): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_SYNC_QUEUE',
        });
        this.log('Sync queue clear request sent to Service Worker');
        return true;
      }
      return false;
    } catch (error) {
      this.log('[ERROR] Failed to clear sync queue', error);
      return false;
    }
  }

  // Logging tools
  enableVerboseLogging(): void {
    this.verboseLogging = true;
    this.log('Verbose logging enabled');
  }

  disableVerboseLogging(): void {
    this.verboseLogging = false;
    this.log('Verbose logging disabled');
  }

  async exportDebugLogs(): Promise<Blob> {
    const logContent = this.logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    this.log('Debug logs exported');
    return blob;
  }
}

// Crear instancia singleton y exportarla
const musicAcademyDebug = new MusicAcademyDebugTools();

// Exponer la instancia en window para acceso desde la consola
if (typeof window !== 'undefined') {
  ;(window as any).musicAcademyDebug = musicAcademyDebug;
}

export default musicAcademyDebug;
