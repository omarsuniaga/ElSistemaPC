// src/utils/performance/lazyLoader.ts
/**
 * Utilidad para carga perezosa optimizada de componentes
 */

import { defineAsyncComponent, AsyncComponentLoader } from 'vue'

interface LazyLoadOptions {
  loadingComponent?: any
  errorComponent?: any
  delay?: number
  timeout?: number
  retries?: number
}

/**
 * Crea un componente con carga perezosa optimizada
 */
export function createLazyComponent(
  loader: AsyncComponentLoader,
  options: LazyLoadOptions = {}
) {
  const {
    loadingComponent,
    errorComponent,
    delay = 200,
    timeout = 10000,
    retries = 3
  } = options

  return defineAsyncComponent({
    loader: async () => {
      let attempt = 0
      
      const tryLoad = async (): Promise<any> => {
        try {
          return await loader()
        } catch (error) {
          attempt++
          
          if (attempt < retries) {
            console.warn(`🔄 Reintentando carga de componente (intento ${attempt}/${retries})`)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            return tryLoad()
          }
          
          console.error('❌ Error al cargar componente después de', retries, 'intentos:', error)
          throw error
        }
      }
      
      return tryLoad()
    },
    loadingComponent,
    errorComponent,
    delay,
    timeout,
    onError: (error, retry, fail, attempts) => {
      console.error(`🚨 Error en carga de componente (intento ${attempts}):`, error)
      
      if (attempts <= retries) {
        console.log('🔄 Reintentando...')
        retry()
      } else {
        console.error('❌ Carga fallida definitivamente')
        fail()
      }
    }
  })
}

/**
 * Preloader para módulos críticos
 */
export class ModulePreloader {
  private static loadedModules = new Set<string>()
  
  static async preloadModule(moduleLoader: () => Promise<any>, moduleName: string) {
    if (this.loadedModules.has(moduleName)) {
      return
    }
    
    try {
      console.log(`📦 Precargando módulo: ${moduleName}`)
      await moduleLoader()
      this.loadedModules.add(moduleName)
      console.log(`✅ Módulo precargado: ${moduleName}`)
    } catch (error) {
      console.error(`❌ Error precargando módulo ${moduleName}:`, error)
    }
  }
  
  static preloadCriticalModules() {
    // Precargar módulos críticos en segundo plano
    if (import.meta.env.PROD) {
      setTimeout(() => {
        this.preloadModule(() => import('@/modulos/Students/store/students'), 'students-store')
        this.preloadModule(() => import('@/modulos/Teachers/store/teachers'), 'teachers-store')
        this.preloadModule(() => import('@/modulos/Attendance/store/attendance'), 'attendance-store')
      }, 2000)
    }
  }
}

/**
 * Loading component reutilizable
 */
export const LoadingComponent = {
  template: `
    <div class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span class="ml-2 text-gray-600 dark:text-gray-300">Cargando...</span>
    </div>
  `
}

/**
 * Error component reutilizable
 */
export const ErrorComponent = {
  template: `
    <div class="flex items-center justify-center p-8 text-red-500">
      <svg class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span>Error al cargar el componente</span>
    </div>
  `
}
