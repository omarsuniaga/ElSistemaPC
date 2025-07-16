// src/utils/cache/smartCache.ts
/**
 * Sistema de cache inteligente con invalidación automática
 */

import { logger } from '@/utils/logging/logger';

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  key: string
  tags: string[]
  accessCount: number
  lastAccessed: number
}

interface CacheOptions {
  ttl?: number // Time to live en milisegundos
  tags?: string[] // Tags para invalidación grupal
  priority?: 'low' | 'medium' | 'high'
  serialize?: boolean // Si serializar para localStorage
}

interface CacheStats {
  totalKeys: number
  memoryUsage: number
  hitRate: number
  totalHits: number
  totalMisses: number
  oldestEntry: number
  newestEntry: number
}

class SmartCache {
  private static instance: SmartCache;
  private memoryCache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };
  private maxMemorySize = 50 * 1024 * 1024; // 50MB máximo
  private currentMemorySize = 0;
  private cleanupInterval: number | null = null;

  private constructor() {
    this.startCleanupProcess();
    this.loadFromPersistentCache();
  }

  static getInstance(): SmartCache {
    if (!SmartCache.instance) {
      SmartCache.instance = new SmartCache();
    }
    return SmartCache.instance;
  }

  private startCleanupProcess() {
    // Limpiar cada 5 minutos
    this.cleanupInterval = window.setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  private loadFromPersistentCache() {
    try {
      const stored = localStorage.getItem('music-academy-cache');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [key, entry] of Object.entries(data)) {
          if (this.isValidEntry(entry as CacheEntry)) {
            this.memoryCache.set(key, entry as CacheEntry);
          }
        }
        logger.debug('CACHE', `Cargadas ${this.memoryCache.size} entradas desde localStorage`);
      }
    } catch (error) {
      logger.warn('CACHE', 'Error cargando cache persistente', error);
    }
  }

  private saveToPersistentCache() {
    try {
      const serializableEntries = Array.from(this.memoryCache.entries())
        .filter(([_, entry]) => entry.tags.includes('persistent'))
        .reduce(
          (acc, [key, entry]) => {
            acc[key] = entry;
            return acc;
          },
          {} as Record<string, CacheEntry>,
        );

      localStorage.setItem('music-academy-cache', JSON.stringify(serializableEntries));
    } catch (error) {
      logger.warn('CACHE', 'Error guardando cache persistente', error);
    }
  }

  private isValidEntry(entry: any): boolean {
    return (
      entry &&
      typeof entry.timestamp === 'number' &&
      typeof entry.ttl === 'number' &&
      entry.data !== undefined &&
      Date.now() - entry.timestamp < entry.ttl
    );
  }

  private calculateMemorySize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Aproximación
    }
  }

  private evictLRU() {
    if (this.memoryCache.size === 0) return;

    // Encontrar entrada menos recientemente usada
    let oldestEntry: [string, CacheEntry] | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestEntry = [key, entry];
      }
    }

    if (oldestEntry) {
      this.delete(oldestEntry[0]);
      logger.debug('CACHE', `Evicted LRU entry: ${oldestEntry[0]}`);
    }
  }

  private cleanup() {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      // Remover entradas expiradas
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        removedCount++;
      }
    }

    // Si aún hay mucha memoria usada, aplicar LRU
    while (this.currentMemorySize > this.maxMemorySize * 0.8) {
      this.evictLRU();
    }

    if (removedCount > 0) {
      logger.debug('CACHE', `Cleanup: removed ${removedCount} expired entries`);
    }

    // Guardar cache persistente cada cleanup
    this.saveToPersistentCache();
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const {
      ttl = 30 * 60 * 1000, // 30 minutos por defecto
      tags = [],
      priority = 'medium',
      serialize = false,
    } = options;

    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      key,
      tags: serialize ? [...tags, 'persistent'] : tags,
      accessCount: 0,
      lastAccessed: now,
    };

    const size = this.calculateMemorySize(data);

    // Si la entrada es muy grande, no la guardamos
    if (size > this.maxMemorySize * 0.1) {
      logger.warn('CACHE', `Entry too large for cache: ${key} (${size} bytes)`);
      return;
    }

    // Si no hay espacio, hacer limpieza
    while (this.currentMemorySize + size > this.maxMemorySize) {
      this.evictLRU();
    }

    this.memoryCache.set(key, entry);
    this.currentMemorySize += size;
    this.stats.sets++;

    logger.debug('CACHE', `Set: ${key} (${size} bytes, TTL: ${ttl}ms)`);
  }

  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();

    // Verificar si ha expirado
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;

    return entry.data as T;
  }

  delete(key: string): boolean {
    const deleted = this.memoryCache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  invalidateByTag(tag: string): number {
    let count = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.includes(tag)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    logger.debug('CACHE', `Invalidated ${count} entries with tag: ${tag}`);
    return count;
  }

  has(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (!entry) return false;

    // Verificar si ha expirado
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.memoryCache.clear();
    this.currentMemorySize = 0;
    localStorage.removeItem('music-academy-cache');
    logger.info('CACHE', 'Cache cleared');
  }

  getStats(): CacheStats {
    const entries = Array.from(this.memoryCache.values());
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? this.stats.hits / (this.stats.hits + this.stats.misses)
        : 0;

    return {
      totalKeys: this.memoryCache.size,
      memoryUsage: this.currentMemorySize,
      hitRate,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map((e) => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map((e) => e.timestamp)) : 0,
    };
  }

  // Métodos de conveniencia para casos específicos
  cacheApiResponse<T>(url: string, data: T, ttl = 5 * 60 * 1000) {
    this.set(`api:${url}`, data, { ttl, tags: ['api'] });
  }

  cacheUserData<T>(userId: string, data: T, ttl = 15 * 60 * 1000) {
    this.set(`user:${userId}`, data, {
      ttl,
      tags: ['user', `user:${userId}`],
      serialize: true,
    });
  }

  cacheFirestoreQuery<T>(collection: string, query: string, data: T, ttl = 10 * 60 * 1000) {
    this.set(`firestore:${collection}:${query}`, data, {
      ttl,
      tags: ['firestore', collection],
    });
  }

  invalidateUser(userId: string) {
    return this.invalidateByTag(`user:${userId}`);
  }

  invalidateApi() {
    return this.invalidateByTag('api');
  }

  invalidateFirestore(collection?: string) {
    return this.invalidateByTag(collection ? collection : 'firestore');
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Decorador para cache automático
export function cached(options: CacheOptions & {keyGenerator?: (...args: any[]) => string} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = SmartCache.getInstance();

    descriptor.value = async function (...args: any[]) {
      const keyGen =
        options.keyGenerator ||
        ((...args) => `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`);
      const cacheKey = keyGen(...args);

      // Intentar obtener del cache
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        logger.debug('CACHE', `Cache hit: ${propertyKey}`);
        return cached;
      }

      // Ejecutar método original
      const result = await originalMethod.apply(this, args);

      // Guardar en cache
      cache.set(cacheKey, result, options);
      logger.debug('CACHE', `Cache set: ${propertyKey}`);

      return result;
    };

    return descriptor;
  };
}

// Plugin para Vue
export function createCachePlugin() {
  const cache = SmartCache.getInstance();

  return {
    install(app: any) {
      app.config.globalProperties.$cache = cache;

      // Limpiar cache al salir
      window.addEventListener('beforeunload', () => {
        cache.saveToPersistentCache();
      });
    },
  };
}

export const smartCache = SmartCache.getInstance();
export type { CacheOptions, CacheEntry, CacheStats };
