import { ref, reactive, computed, markRaw } from 'vue'
import type { Component } from 'vue'

// Importar Firebase del proyecto principal - AJUSTADO para tu estructura
import { db, auth, storage } from '../../../firebase/config'

export interface ModuleDefinition {
  id: string
  name: string
  icon: string
  component: Component
  permissions?: string[]
  config?: Record<string, any>
  dependencies?: string[]
  routes?: ModuleRoute[]
  menuItems?: MenuItem[]
  widgets?: Widget[]
  hooks?: ModuleHooks
}

export interface ModuleRoute {
  path: string
  name: string
  component: Component
  meta?: Record<string, any>
}

export interface MenuItem {
  id: string
  label: string
  icon: string
  action: string | (() => void)
  permissions?: string[]
  children?: MenuItem[]
}

export interface Widget {
  id: string
  name: string
  component: Component
  size: 'small' | 'medium' | 'large'
  permissions?: string[]
}

export interface ModuleHooks {
  onInit?: () => void | Promise<void>
  onDestroy?: () => void | Promise<void>
  onUserChange?: (user: any) => void | Promise<void>
  onPermissionChange?: (permissions: string[]) => void | Promise<void>
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  preferences?: Record<string, any>
}

class ModuleManager {
  private modules = reactive<Map<string, ModuleDefinition>>(new Map())
  private activeModule = ref<string | null>(null)
  private currentUser = ref<User | null>(null)
  private globalConfig = reactive<Record<string, any>>({})

  // Registrar un módulo
  registerModule(module: ModuleDefinition) {
    // Verificar dependencias
    if (module.dependencies) {
      for (const dep of module.dependencies) {
        if (!this.modules.has(dep)) {
          throw new Error(`Módulo ${module.id} requiere dependencia ${dep} que no está registrada`)
        }
      }
    }

    // Marcar el componente como no reactivo para evitar problemas de performance
    const moduleWithRawComponent = {
      ...module,
      component: markRaw(module.component)
    }

    this.modules.set(module.id, moduleWithRawComponent)
    
    // Ejecutar hook de inicialización
    if (module.hooks?.onInit) {
      module.hooks.onInit()
    }

    console.log(`Módulo ${module.id} registrado exitosamente`)
  }

  // Desregistrar un módulo
  unregisterModule(moduleId: string) {
    const module = this.modules.get(moduleId)
    if (module?.hooks?.onDestroy) {
      module.hooks.onDestroy()
    }
    this.modules.delete(moduleId)
  }

  // Activar un módulo
  activateModule(moduleId: string) {
    const module = this.modules.get(moduleId)
    if (!module) {
      throw new Error(`Módulo ${moduleId} no encontrado`)
    }

    // Verificar permisos
    if (module.permissions && !this.hasPermissions(module.permissions)) {
      throw new Error(`Sin permisos para acceder al módulo ${moduleId}`)
    }

    this.activeModule.value = moduleId
  }

  // Verificar permisos
  hasPermissions(requiredPermissions: string[]): boolean {
    if (!this.currentUser.value) return false
    
    const userPermissions = this.currentUser.value.permissions
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission) ||
      userPermissions.includes('*:*') ||
      userPermissions.some(p => p.endsWith(':*') && permission.startsWith(p.split(':')[0]))
    )
  }

  // Establecer usuario actual
  setUser(user: User) {
    const previousUser = this.currentUser.value
    this.currentUser.value = user

    // Notificar a todos los módulos del cambio de usuario
    this.modules.forEach(module => {
      if (module.hooks?.onUserChange) {
        module.hooks.onUserChange(user)
      }
    })
  }

  // Obtener módulos disponibles para el usuario actual
  getAvailableModules() {
    return computed(() => {
      return Array.from(this.modules.values()).filter(module => {
        if (!module.permissions) return true
        return this.hasPermissions(module.permissions)
      })
    })
  }

  // Obtener módulo activo
  getActiveModule() {
    return computed(() => {
      if (!this.activeModule.value) return null
      return this.modules.get(this.activeModule.value) || null
    })
  }

  // Obtener widgets de dashboard
  getDashboardWidgets() {
    return computed(() => {
      const widgets: Widget[] = []
      this.modules.forEach(module => {
        if (module.widgets) {
          const availableWidgets = module.widgets.filter(widget => {
            if (!widget.permissions) return true
            return this.hasPermissions(widget.permissions)
          })
          widgets.push(...availableWidgets)
        }
      })
      return widgets
    })
  }

  // Obtener usuario actual
  getCurrentUser() {
    return this.currentUser.value
  }

  // Comunicación entre módulos
  emitEvent(eventName: string, data: any) {
    // Sistema de eventos para comunicación entre módulos
    window.dispatchEvent(new CustomEvent(`module:${eventName}`, { detail: data }))
  }

  listenToEvent(eventName: string, callback: (data: any) => void) {
    window.addEventListener(`module:${eventName}`, (event: any) => {
      callback(event.detail)
    })
  }

  // Configuración global
  setGlobalConfig(config: Record<string, any>) {
    Object.assign(this.globalConfig, config)
  }

  getGlobalConfig() {
    return this.globalConfig
  }

  // Estado del manager
  get state() {
    return {
      modules: this.modules,
      activeModule: this.activeModule.value,
      currentUser: this.currentUser.value,
      config: this.globalConfig
    }
  }
}

// Singleton del manager
export const moduleManager = new ModuleManager()
export default moduleManager