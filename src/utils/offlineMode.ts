// src/utils/offlineMode.ts
import { BackgroundSync } from './backgroundSync';
import { CacheManager } from './cacheManager';

/**
 * Estado de la conexión
 */
type ConnectionState = 'online' | 'offline' | 'reconnecting';

/**
 * Estado actual de la aplicación
 */
interface OfflineState {
  isOnline: boolean;
  lastSync: number | null;
  pendingChanges: number;
  connectionState: ConnectionState;
}

// Evento personalizado para cambios en el estado offline
export const OFFLINE_STATE_CHANGE = 'offlineStateChange';

/**
 * Servicio para gestionar el modo offline
 */
export class OfflineMode {
  private static state: OfflineState = {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingChanges: 0,
    connectionState: navigator.onLine ? 'online' : 'offline'
  };

  /**
   * Inicializar el servicio de modo offline
   */
  static init(): void {
    this.setupListeners();
    this.updatePendingChanges();
    
    // Publicar estado inicial
    this.notifyStateChanged();
    
    console.log(`[Offline] Modo offline inicializado (estado: ${this.state.connectionState})`);
  }

  /**
   * Obtener el estado actual
   */
  static getState(): OfflineState {
    return { ...this.state };
  }

  /**
   * Configurar escuchas para eventos de conexión
   */
  private static setupListeners(): void {
    window.addEventListener('online', () => {
      this.state.isOnline = true;
      this.state.connectionState = 'reconnecting';
      this.notifyStateChanged();
      
      // Intentar sincronizar y actualizar estado
      setTimeout(async () => {
        try {
          await BackgroundSync.attemptSync();
          this.state.connectionState = 'online';
          this.state.lastSync = Date.now();
          this.updatePendingChanges();
        } catch (error) {
          console.error('[Offline] Error al sincronizar:', error);
        } finally {
          this.notifyStateChanged();
        }
      }, 1000); // Pequeño retraso para permitir que la conexión se estabilice
    });
    
    window.addEventListener('offline', () => {
      this.state.isOnline = false;
      this.state.connectionState = 'offline';
      this.notifyStateChanged();
    });
    
    // Escuchar cambios en las operaciones pendientes
    window.addEventListener('storage', (event) => {
      if (event.key === 'pending_operations') {
        this.updatePendingChanges();
      }
    });
  }

  /**
   * Actualizar contador de cambios pendientes
   */
  private static updatePendingChanges(): void {
    const pendingOps = BackgroundSync.getPendingOperations();
    this.state.pendingChanges = pendingOps.length;
    this.notifyStateChanged();
  }

  /**
   * Notificar cambios en el estado
   */
  private static notifyStateChanged(): void {
    const event = new CustomEvent(OFFLINE_STATE_CHANGE, { 
      detail: this.getState() 
    });
    window.dispatchEvent(event);
  }

  /**
   * Forzar sincronización manual
   */
  static async forceSyncAll(): Promise<boolean> {
    if (!navigator.onLine) {
      console.warn('[Offline] No se puede sincronizar: sin conexión');
      return false;
    }
    
    try {
      this.state.connectionState = 'reconnecting';
      this.notifyStateChanged();
      
      await BackgroundSync.attemptSync();
      
      this.state.connectionState = 'online';
      this.state.lastSync = Date.now();
      this.updatePendingChanges();
      
      return true;
    } catch (error) {
      console.error('[Offline] Error en sincronización manual:', error);
      return false;
    } finally {
      this.notifyStateChanged();
    }
  }

  /**
   * Guardar operación para sincronización posterior
   */
  static saveForLater(
    type: 'create' | 'update' | 'delete',
    collection: string,
    data: any
  ): string {
    const opId = BackgroundSync.addPendingOperation(type, collection, data);
    this.updatePendingChanges();
    return opId;
  }

  /**
   * Verificar si la aplicación está en modo offline
   */
  static isOfflineMode(): boolean {
    return !this.state.isOnline;
  }

  /**
   * Verificar si hay una colección con cambios pendientes
   */
  static hasCollectionPendingChanges(collection: string): boolean {
    return BackgroundSync.hasCollectionPendingChanges(collection);
  }
}

/**
 * Hook composable para Vue que permite usar el estado offline en componentes
 */
export function useOfflineMode() {
  // Estado reactivo (si estuviéramos usando Vue directamente)
  const state = { ...OfflineMode.getState() };
  
  // En una implementación real con Vue, usaríamos ref() y onMounted()
  
  /**
   * Forzar sincronización
   */
  const syncNow = async () => {
    return OfflineMode.forceSyncAll();
  };
  
  /**
   * Guardar operación para sincronización posterior
   */
  const saveOperation = (type: 'create' | 'update' | 'delete', collection: string, data: any) => {
    return OfflineMode.saveForLater(type, collection, data);
  };
  
  return {
    state,
    syncNow,
    saveOperation,
    isOffline: OfflineMode.isOfflineMode(),
    hasPendingChanges: (collection: string) => OfflineMode.hasCollectionPendingChanges(collection)
  };
}
