// src/utils/cacheManager.ts
import { generateCacheKey } from './roleBasedAccess';

// Configuración
const DEFAULT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutos en milisegundos
const VERSION_KEY = 'app_data_version';

/**
 * Interfaz para el objeto de caché versionado
 */
interface VersionedCache<T> {
  data: T
  timestamp: number
  version: string
}

/**
 * Gestiona el caché versionado de la aplicación
 */
export class CacheManager {
  /**
   * Obtiene la versión actual de los datos desde localStorage
   */
  static getCurrentVersion(): string {
    const version = localStorage.getItem(VERSION_KEY);
    return version || this.generateNewVersion();
  }

  /**
   * Genera una nueva versión basada en timestamp y la guarda
   */
  static generateNewVersion(): string {
    const newVersion = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    localStorage.setItem(VERSION_KEY, newVersion);
    return newVersion;
  }

  /**
   * Guarda datos en caché con versionado
   */
  static saveToCache<T>(
    key: string,
    data: T,
    params: Record<string, any> = {},
    version: string = this.getCurrentVersion(),
  ): void {
    const cacheKey = generateCacheKey(key, params);
    const cacheObject: VersionedCache<T> = {
      data,
      timestamp: Date.now(),
      version,
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheObject));
    console.log(`[Caché] Datos guardados en caché: ${cacheKey} (v${version})`);
  }

  /**
   * Obtiene datos del caché
   * @returns Los datos en caché o null si no existen o están expirados
   */
  static getFromCache<T>(
    key: string,
    params: Record<string, any> = {},
    maxAge: number = DEFAULT_CACHE_DURATION,
    requiredVersion?: string,
  ): T | null {
    const cacheKey = generateCacheKey(key, params);
    const cachedJson = localStorage.getItem(cacheKey);

    if (!cachedJson) {
      console.log(`[Caché] No hay datos en caché para: ${cacheKey}`);
      return null;
    }

    try {
      const cached = JSON.parse(cachedJson) as VersionedCache<T>;
      const currentTime = Date.now();
      const isExpired = currentTime - cached.timestamp > maxAge;

      // Verificar versión si se proporciona
      const versionMismatch = requiredVersion && cached.version !== requiredVersion;

      if (isExpired) {
        console.log(`[Caché] Datos expirados para: ${cacheKey}`);
        return null;
      }

      if (versionMismatch) {
        console.log(
          `[Caché] Versión incorrecta para: ${cacheKey} (esperada: ${requiredVersion}, actual: ${cached.version})`,
        );
        return null;
      }

      console.log(`[Caché] Usando datos en caché para: ${cacheKey} (v${cached.version})`);
      return cached.data;
    } catch (error) {
      console.error(`[Caché] Error al parsear caché para ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Invalida toda la caché marcando una nueva versión global
   */
  static invalidateCache(): string {
    console.log('[Caché] Invalidando todo el caché...');
    return this.generateNewVersion();
  }

  /**
   * Invalida una clave específica del caché
   */
  static invalidateCacheKey(key: string, params: Record<string, any> = {}): void {
    const cacheKey = generateCacheKey(key, params);
    localStorage.removeItem(cacheKey);
    console.log(`[Caché] Caché invalidado para: ${cacheKey}`);
  }

  /**
   * Verifica si es necesario actualizar la caché comparando versiones
   */
  static needsUpdate(localVersion: string, remoteVersion: string): boolean {
    return localVersion !== remoteVersion;
  }
}
