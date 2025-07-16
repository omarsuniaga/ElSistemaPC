/**
 * 🚀 SISTEMA DE CACHÉ AVANZADO
 * Fase 2 - Iniciativa 3: Advanced Caching
 */

import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';

// ==================== TIPOS ====================

interface CacheConfig {
  enabled: boolean
  strategies: {
    api: CacheStrategy
    assets: CacheStrategy
    pages: CacheStrategy
    data: CacheStrategy
  }
  storage: {
    quota: number // MB
    maxAge: number // milliseconds
    cleanupInterval: number // milliseconds
  }
  compression: {
    enabled: boolean
    threshold: number // bytes
    algorithm: 'gzip' | 'deflate'
  }
}

interface CacheStrategy {
  enabled: boolean
  method: 'memory' | 'localStorage' | 'indexedDB' | 'serviceWorker'
  ttl: number // time to live in milliseconds
  maxSize: number // max number of entries
  priority: 'low' | 'normal' | 'high'
}

interface CacheEntry {
  key: string
  data: any
  timestamp: number
  ttl: number
  size: number
  hits: number
  compressed: boolean
  strategy: string
}

interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  missRate: number
  memoryUsage: number
  diskUsage: number
  compressionRatio: number
}

interface CacheMetrics {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
  compressions: number
  decompressions: number
}

// ==================== CONFIGURACIÓN PREDETERMINADA ====================

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  strategies: {
    api: {
      enabled: true,
      method: 'indexedDB',
      ttl: 5 * 60 * 1000, // 5 minutos
      maxSize: 1000,
      priority: 'high',
    },
    assets: {
      enabled: true,
      method: 'serviceWorker',
      ttl: 24 * 60 * 60 * 1000, // 24 horas
      maxSize: 500,
      priority: 'normal',
    },
    pages: {
      enabled: true,
      method: 'memory',
      ttl: 10 * 60 * 1000, // 10 minutos
      maxSize: 50,
      priority: 'normal',
    },
    data: {
      enabled: true,
      method: 'localStorage',
      ttl: 30 * 60 * 1000, // 30 minutos
      maxSize: 200,
      priority: 'high',
    },
  },
  storage: {
    quota: 50, // 50 MB
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    cleanupInterval: 60 * 60 * 1000, // 1 hora
  },
  compression: {
    enabled: true,
    threshold: 1024, // 1KB
    algorithm: 'gzip',
  },
};

// ==================== STORE DE CACHÉ ====================

export const useCacheStore = defineStore('cache', () => {
  // Estado
  const config = ref<CacheConfig>(DEFAULT_CACHE_CONFIG);
  const memoryCache = ref<Map<string, CacheEntry>>(new Map());
  const metrics = ref<CacheMetrics>({
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    compressions: 0,
    decompressions: 0,
  });
  const isInitialized = ref(false);
  const cleanupTimer = ref<number | null>(null);

  // IndexedDB reference
  let dbCache: IDBDatabase | null = null;

  // Computed
  const stats = computed<CacheStats>(() => {
    const totalEntries = memoryCache.value.size;
    const totalSize = Array.from(memoryCache.value.values()).reduce(
      (sum, entry) => sum + entry.size,
      0,
    );

    const totalOperations = metrics.value.hits + metrics.value.misses;
    const hitRate = totalOperations > 0 ? (metrics.value.hits / totalOperations) * 100 : 0;
    const missRate = 100 - hitRate;

    return {
      totalEntries,
      totalSize,
      hitRate,
      missRate,
      memoryUsage: totalSize,
      diskUsage: 0, // Se calculará con IndexedDB
      compressionRatio:
        metrics.value.compressions > 0
          ? (metrics.value.compressions /
              (metrics.value.compressions + metrics.value.decompressions)) *
            100
          : 0,
    };
  });

  const cacheHealth = computed(() => {
    const health = stats.value;
    if (health.hitRate >= 80) return 'excellent';
    if (health.hitRate >= 60) return 'good';
    if (health.hitRate >= 40) return 'needs-improvement';
    return 'poor';
  });

  // ==================== INICIALIZACIÓN ====================

  async function initializeCache() {
    if (isInitialized.value) return;

    console.log('🚀 Inicializando sistema de caché avanzado...');

    try {
      // Inicializar IndexedDB
      await initializeIndexedDB();

      // Configurar limpieza automática
      setupAutomaticCleanup();

      // Cargar caché existente
      await loadExistingCache();

      // Configurar listeners
      setupCacheListeners();

      isInitialized.value = true;
      console.log('✅ Sistema de caché inicializado');
    } catch (error) {
      console.error('❌ Error inicializando caché:', error);
      throw error;
    }
  }

  async function initializeIndexedDB() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('MusicAcademyCache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        dbCache = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Crear object store para caché
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('strategy', 'strategy');
        }
      };
    });
  }

  function setupAutomaticCleanup() {
    if (cleanupTimer.value) {
      clearInterval(cleanupTimer.value);
    }

    cleanupTimer.value = window.setInterval(() => {
      cleanupExpiredEntries();
    }, config.value.storage.cleanupInterval);
  }

  async function loadExistingCache() {
    // Cargar desde localStorage
    loadFromLocalStorage();

    // Cargar desde IndexedDB
    await loadFromIndexedDB();
  }

  function setupCacheListeners() {
    // Listener para storage events
    window.addEventListener('storage', handleStorageChange);

    // Listener para beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  // ==================== OPERACIONES PRINCIPALES ====================

  async function get<T = any>(
    key: string,
    strategy?: keyof typeof config.value.strategies,
  ): Promise<T | null> {
    try {
      const strategyConfig = strategy ? config.value.strategies[strategy] : detectStrategy(key);
      if (!strategyConfig.enabled) return null;

      let entry: CacheEntry | null = null;

      // Buscar en memoria primero
      entry = memoryCache.value.get(key) || null;

      // Si no está en memoria, buscar en storage persistente
      if (!entry) {
        if (strategyConfig.method === 'localStorage') {
          entry = getFromLocalStorage(key);
        } else if (strategyConfig.method === 'indexedDB') {
          entry = await getFromIndexedDB(key);
        }
      }

      if (!entry) {
        metrics.value.misses++;
        return null;
      }

      // Verificar TTL
      if (Date.now() - entry.timestamp > entry.ttl) {
        await del(key);
        metrics.value.misses++;
        return null;
      }

      // Actualizar hits y mover a memoria si no está
      entry.hits++;
      metrics.value.hits++;

      if (!memoryCache.value.has(key)) {
        memoryCache.value.set(key, entry);
      }

      // Descomprimir si es necesario
      let data = entry.data;
      if (entry.compressed) {
        data = await decompress(data);
        metrics.value.decompressions++;
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo del caché:', error);
      metrics.value.misses++;
      return null;
    }
  }

  async function set<T = any>(
    key: string,
    data: T,
    options?: {
      strategy?: keyof typeof config.value.strategies
      ttl?: number
      priority?: 'low' | 'normal' | 'high'
    },
  ): Promise<boolean> {
    try {
      const strategy = options?.strategy || detectStrategyFromKey(key);
      const strategyConfig = config.value.strategies[strategy];

      if (!strategyConfig.enabled) return false;

      // Serializar datos
      const serialized = JSON.stringify(data);
      const size = new Blob([serialized]).size;

      // Comprimir si es necesario
      let finalData = serialized;
      let compressed = false;

      if (config.value.compression.enabled && size > config.value.compression.threshold) {
        finalData = await compress(serialized);
        compressed = true;
        metrics.value.compressions++;
      }

      const entry: CacheEntry = {
        key,
        data: finalData,
        timestamp: Date.now(),
        ttl: options?.ttl || strategyConfig.ttl,
        size,
        hits: 0,
        compressed,
        strategy,
      };

      // Guardar en memoria
      memoryCache.value.set(key, entry);

      // Guardar en storage persistente
      if (strategyConfig.method === 'localStorage') {
        saveToLocalStorage(entry);
      } else if (strategyConfig.method === 'indexedDB') {
        await saveToIndexedDB(entry);
      }

      // Verificar límites y hacer cleanup si es necesario
      await enforceStorageLimits(strategy);

      metrics.value.sets++;
      return true;
    } catch (error) {
      console.error('Error guardando en caché:', error);
      return false;
    }
  }

  async function del(key: string): Promise<boolean> {
    try {
      // Eliminar de memoria
      const deleted = memoryCache.value.delete(key);

      // Eliminar de localStorage
      deleteFromLocalStorage(key);

      // Eliminar de IndexedDB
      await deleteFromIndexedDB(key);

      if (deleted) {
        metrics.value.deletes++;
      }

      return deleted;
    } catch (error) {
      console.error('Error eliminando del caché:', error);
      return false;
    }
  }

  async function clear(strategy?: keyof typeof config.value.strategies): Promise<void> {
    try {
      if (strategy) {
        // Limpiar estrategia específica
        const keysToDelete = Array.from(memoryCache.value.entries())
          .filter(([, entry]) => entry.strategy === strategy)
          .map(([key]) => key);

        for (const key of keysToDelete) {
          await del(key);
        }
      } else {
        // Limpiar todo
        memoryCache.value.clear();
        clearLocalStorage();
        await clearIndexedDB();
      }
    } catch (error) {
      console.error('Error limpiando caché:', error);
    }
  }

  // ==================== STORAGE METHODS ====================

  function getFromLocalStorage(key: string): CacheEntry | null {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  function saveToLocalStorage(entry: CacheEntry): void {
    try {
      localStorage.setItem(`cache_${entry.key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Error guardando en localStorage:', error);
    }
  }

  function deleteFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Error eliminando de localStorage:', error);
    }
  }

  function clearLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith('cache_'));
      keys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Error limpiando localStorage:', error);
    }
  }

  function loadFromLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith('cache_'));

      keys.forEach((key) => {
        try {
          const entry: CacheEntry = JSON.parse(localStorage.getItem(key) || '');
          if (Date.now() - entry.timestamp <= entry.ttl) {
            memoryCache.value.set(entry.key, entry);
          } else {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error cargando localStorage:', error);
    }
  }

  async function getFromIndexedDB(key: string): Promise<CacheEntry | null> {
    if (!dbCache) return null;

    return new Promise((resolve) => {
      const transaction = dbCache!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async function saveToIndexedDB(entry: CacheEntry): Promise<void> {
    if (!dbCache) return;

    return new Promise((resolve, reject) => {
      const transaction = dbCache!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function deleteFromIndexedDB(key: string): Promise<void> {
    if (!dbCache) return;

    return new Promise((resolve, reject) => {
      const transaction = dbCache!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function loadFromIndexedDB(): Promise<void> {
    if (!dbCache) return;

    return new Promise((resolve) => {
      const transaction = dbCache!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.getAll();

      request.onsuccess = () => {
        const entries: CacheEntry[] = request.result || [];

        entries.forEach((entry) => {
          if (Date.now() - entry.timestamp <= entry.ttl) {
            memoryCache.value.set(entry.key, entry);
          }
        });

        resolve();
      };

      request.onerror = () => resolve();
    });
  }

  async function clearIndexedDB(): Promise<void> {
    if (!dbCache) return;

    return new Promise((resolve, reject) => {
      const transaction = dbCache!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== COMPRESIÓN ====================

  async function compress(data: string): Promise<string> {
    if (!config.value.compression.enabled) return data;

    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const stream = new CompressionStream(config.value.compression.algorithm);
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(encoder.encode(data));
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;

      chunks.forEach((chunk) => {
        compressed.set(chunk, offset);
        offset += chunk.length;
      });

      return btoa(String.fromCharCode(...compressed));
    } catch (error) {
      console.warn('Error comprimiendo datos:', error);
      return data;
    }
  }

  async function decompress(compressedData: string): Promise<string> {
    if (!config.value.compression.enabled) return compressedData;

    try {
      const decoder = new TextDecoder();

      const compressed = Uint8Array.from(atob(compressedData), (c) => c.charCodeAt(0));

      const stream = new DecompressionStream(config.value.compression.algorithm);
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(compressed);
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;

      chunks.forEach((chunk) => {
        decompressed.set(chunk, offset);
        offset += chunk.length;
      });

      return decoder.decode(decompressed);
    } catch (error) {
      console.warn('Error descomprimiendo datos:', error);
      return compressedData;
    }
  }

  // ==================== UTILIDADES ====================

  function detectStrategy(key: string): CacheStrategy {
    if (key.startsWith('api_')) return config.value.strategies.api;
    if (key.startsWith('asset_')) return config.value.strategies.assets;
    if (key.startsWith('page_')) return config.value.strategies.pages;
    return config.value.strategies.data;
  }

  function detectStrategyFromKey(key: string): keyof typeof config.value.strategies {
    if (key.startsWith('api_')) return 'api';
    if (key.startsWith('asset_')) return 'assets';
    if (key.startsWith('page_')) return 'pages';
    return 'data';
  }

  async function enforceStorageLimits(
    strategy: keyof typeof config.value.strategies,
  ): Promise<void> {
    const strategyConfig = config.value.strategies[strategy];
    const entries = Array.from(memoryCache.value.entries()).filter(
      ([, entry]) => entry.strategy === strategy,
    );

    if (entries.length > strategyConfig.maxSize) {
      // Ordenar por hits y timestamp (LRU)
      entries.sort(([, a], [, b]) => {
        if (a.hits !== b.hits) return a.hits - b.hits;
        return a.timestamp - b.timestamp;
      });

      // Eliminar entradas más antiguas
      const toDelete = entries.slice(0, entries.length - strategyConfig.maxSize);
      for (const [key] of toDelete) {
        await del(key);
        metrics.value.evictions++;
      }
    }
  }

  async function cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of memoryCache.value.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await del(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`🧹 Limpieza automática: ${expiredKeys.length} entradas expiradas eliminadas`);
    }
  }

  function handleStorageChange(event: StorageEvent): void {
    if (event.key?.startsWith('cache_')) {
      const cacheKey = event.key.replace('cache_', '');

      if (event.newValue) {
        try {
          const entry: CacheEntry = JSON.parse(event.newValue);
          memoryCache.value.set(cacheKey, entry);
        } catch (error) {
          console.warn('Error sincronizando storage change:', error);
        }
      } else {
        memoryCache.value.delete(cacheKey);
      }
    }
  }

  function handleBeforeUnload(): void {
    // Guardar métricas importantes antes de cerrar
    try {
      localStorage.setItem('cache_metrics', JSON.stringify(metrics.value));
    } catch (error) {
      console.warn('Error guardando métricas:', error);
    }
  }

  // ==================== FUNCIONES AVANZADAS ====================

  async function preload(keys: string[]): Promise<void> {
    const promises = keys.map((key) => get(key));
    await Promise.allSettled(promises);
  }

  async function warmup(dataLoader: () => Promise<Record<string, any>>): Promise<void> {
    try {
      const data = await dataLoader();
      const promises = Object.entries(data).map(([key, value]) => set(key, value));
      await Promise.allSettled(promises);
      console.log(`🔥 Cache warmed up with ${Object.keys(data).length} entries`);
    } catch (error) {
      console.warn('Error warming up cache:', error);
    }
  }

  function getMetrics(): CacheMetrics & CacheStats {
    return {
      ...metrics.value,
      ...stats.value,
    };
  }

  function exportCache(): Record<string, any> {
    const exported: Record<string, any> = {};

    for (const [key, entry] of memoryCache.value.entries()) {
      try {
        exported[key] = entry.compressed
          ? JSON.parse(entry.data) // Nota: en export no descomprimimos
          : JSON.parse(entry.data);
      } catch (error) {
        console.warn(`Error exportando entrada ${key}:`, error);
      }
    }

    return exported;
  }

  async function importCache(data: Record<string, any>): Promise<void> {
    const promises = Object.entries(data).map(([key, value]) => set(key, value));
    await Promise.allSettled(promises);
    console.log(`📥 Cache imported with ${Object.keys(data).length} entries`);
  }

  function updateConfig(newConfig: Partial<CacheConfig>): void {
    config.value = { ...config.value, ...newConfig };

    // Re-configurar cleanup si cambió el intervalo
    if (newConfig.storage?.cleanupInterval) {
      setupAutomaticCleanup();
    }
  }

  // ==================== CLEANUP ====================

  function destroy(): void {
    if (cleanupTimer.value) {
      clearInterval(cleanupTimer.value);
      cleanupTimer.value = null;
    }

    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);

    if (dbCache) {
      dbCache.close();
      dbCache = null;
    }

    memoryCache.value.clear();
    isInitialized.value = false;
  }

  // ==================== RETURN ====================

  return {
    // Estado
    config,
    memoryCache,
    metrics,
    isInitialized,

    // Computed
    stats,
    cacheHealth,

    // Métodos principales
    initializeCache,
    get,
    set,
    del,
    clear,

    // Funciones avanzadas
    preload,
    warmup,
    getMetrics,
    exportCache,
    importCache,
    updateConfig,

    // Cleanup
    destroy,
  };
});

// ==================== COMPOSABLE ====================

export function useCache() {
  const store = useCacheStore();

  return {
    ...store,

    // Métodos de conveniencia
    cacheApi: <T>(key: string, data: T, ttl?: number) =>
      store.set(`api_${key}`, data, { strategy: 'api', ttl }),

    getApi: <T>(key: string) => store.get<T>(`api_${key}`, 'api'),

    cachePage: <T>(key: string, data: T) => store.set(`page_${key}`, data, { strategy: 'pages' }),

    getPage: <T>(key: string) => store.get<T>(`page_${key}`, 'pages'),

    cacheAsset: <T>(key: string, data: T) => store.set(`asset_${key}`, data, { strategy: 'assets' }),

    getAsset: <T>(key: string) => store.get<T>(`asset_${key}`, 'assets'),
  };
}
