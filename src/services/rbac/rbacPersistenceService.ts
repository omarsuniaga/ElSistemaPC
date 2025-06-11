// src/services/rbac/rbacPersistenceService.ts

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { Role, Permission } from '@/composables/useRBACManagement'

// Interfaces para la configuración de navegación
export interface NavigationItem {
  id: string
  name: string
  path: string
  icon: string
  roles: string[]
  isActive: boolean
  order: number
}

export interface RBACConfiguration {
  roles: Role[]
  permissions: Permission[]
  navigationConfig: NavigationItem[]
  systemSettings: {
    defaultRole: string
    allowSelfRegistration: boolean
    sessionTimeout: number
  }
  lastUpdated: any
  updatedBy: string
}

const RBAC_COLLECTION = 'RBAC_CONFIG'
const NAVIGATION_COLLECTION = 'NAVIGATION_CONFIG'

export class RBACPersistenceService {
  
  // ===== ROLES =====
  
  /**
   * Guardar roles en Firestore
   */
  static async saveRoles(roles: Role[], updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, RBAC_COLLECTION, 'roles')
      await setDoc(docRef, {
        roles,
        lastUpdated: serverTimestamp(),
        updatedBy
      }, { merge: true })
      
      console.log('✅ Roles guardados en Firestore')
    } catch (error) {
      console.error('❌ Error guardando roles:', error)
      throw new Error('Error al guardar roles en la base de datos')
    }
  }

  /**
   * Obtener roles desde Firestore
   */
  static async getRoles(): Promise<Role[]> {
    try {
      const docRef = doc(db, RBAC_COLLECTION, 'roles')
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        console.log('✅ Roles obtenidos desde Firestore:', data.roles?.length || 0)
        return data.roles || []
      }
      
      console.log('⚠️  No se encontraron roles en Firestore')
      return []
    } catch (error) {
      console.error('❌ Error obteniendo roles:', error)
      return []
    }
  }

  // ===== PERMISOS =====

  /**
   * Guardar permisos en Firestore  
   */
  static async savePermissions(permissions: Permission[], updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, RBAC_COLLECTION, 'permissions')
      await setDoc(docRef, {
        permissions,
        lastUpdated: serverTimestamp(),
        updatedBy
      }, { merge: true })
      
      console.log('✅ Permisos guardados en Firestore')
    } catch (error) {
      console.error('❌ Error guardando permisos:', error)  
      throw new Error('Error al guardar permisos en la base de datos')
    }
  }

  /**
   * Obtener permisos desde Firestore
   */
  static async getPermissions(): Promise<Permission[]> {
    try {
      const docRef = doc(db, RBAC_COLLECTION, 'permissions')
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        console.log('✅ Permisos obtenidos desde Firestore:', data.permissions?.length || 0)
        return data.permissions || []
      }
      
      console.log('⚠️  No se encontraron permisos en Firestore')
      return []
    } catch (error) {
      console.error('❌ Error obteniendo permisos:', error)
      return []
    }
  }

  // ===== CONFIGURACIÓN DE NAVEGACIÓN =====

  /**
   * Guardar configuración de navegación
   */
  static async saveNavigationConfig(navigationItems: NavigationItem[], updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, NAVIGATION_COLLECTION, 'config')
      await setDoc(docRef, {
        navigationItems,
        lastUpdated: serverTimestamp(),
        updatedBy
      }, { merge: true })
      
      console.log('✅ Configuración de navegación guardada')
    } catch (error) {
      console.error('❌ Error guardando configuración de navegación:', error)
      throw new Error('Error al guardar configuración de navegación')
    }
  }

  /**
   * Obtener configuración de navegación
   */
  static async getNavigationConfig(): Promise<NavigationItem[]> {
    try {
      const docRef = doc(db, NAVIGATION_COLLECTION, 'config')
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        console.log('✅ Configuración de navegación obtenida:', data.navigationItems?.length || 0, 'items')
        return data.navigationItems || []
      }
      
      console.log('⚠️  No se encontró configuración de navegación, usando valores por defecto')
      return this.getDefaultNavigationConfig()
    } catch (error) {
      console.error('❌ Error obteniendo configuración de navegación:', error)
      return this.getDefaultNavigationConfig()
    }
  }

  /**
   * Configuración de navegación por defecto
   */
  static getDefaultNavigationConfig(): NavigationItem[] {
    return [
      // Navegación para Maestros
      {
        id: 'dashboard-maestro',
        name: 'Dashboard',
        path: '/dashboard',
        icon: '🏠',
        roles: ['Maestro', 'Maestro Avanzado'],
        isActive: true,
        order: 1
      },
      {
        id: 'clases-maestro',
        name: 'Mis Clases',
        path: '/clases',
        icon: '📚',
        roles: ['Maestro', 'Maestro Avanzado'],
        isActive: true,
        order: 2
      },
      {
        id: 'asistencia-maestro',
        name: 'Asistencia',
        path: '/asistencia',
        icon: '✅',
        roles: ['Maestro', 'Maestro Avanzado'],
        isActive: true,
        order: 3
      },
      {
        id: 'estudiantes-maestro',
        name: 'Estudiantes',
        path: '/estudiantes',
        icon: '🎓',
        roles: ['Maestro Avanzado'], // Solo maestros avanzados por defecto
        isActive: true,
        order: 4
      },
      
      // Navegación para Directores
      {
        id: 'dashboard-director',
        name: 'Dashboard',
        path: '/dashboard',
        icon: '🏠',
        roles: ['Director'],
        isActive: true,
        order: 1
      },
      {
        id: 'estudiantes-director',
        name: 'Estudiantes',
        path: '/estudiantes',
        icon: '🎓',
        roles: ['Director'],
        isActive: true,
        order: 2
      },
      {
        id: 'maestros-director',
        name: 'Maestros',
        path: '/maestros',
        icon: '👨‍🏫',
        roles: ['Director'],
        isActive: true,
        order: 3
      },
      {
        id: 'clases-director',
        name: 'Clases',
        path: '/clases',
        icon: '📚',
        roles: ['Director'],
        isActive: true,
        order: 4
      },
      {
        id: 'reportes-director',
        name: 'Reportes',
        path: '/reportes',
        icon: '📊',
        roles: ['Director'],
        isActive: true,
        order: 5
      },
      
      // Navegación para Administradores
      {
        id: 'dashboard-admin',
        name: 'Dashboard',
        path: '/dashboard',
        icon: '🏠',
        roles: ['Admin'],
        isActive: true,
        order: 1
      },
      {
        id: 'usuarios-admin',
        name: 'Usuarios',
        path: '/usuarios',
        icon: '👥',
        roles: ['Admin'],
        isActive: true,
        order: 2
      },
      {
        id: 'sistema-admin',
        name: 'Sistema',
        path: '/sistema',
        icon: '⚙️',
        roles: ['Admin'],
        isActive: true,
        order: 3
      },
      {
        id: 'configuracion-admin',
        name: 'Configuración',
        path: '/configuracion',
        icon: '🛠️',
        roles: ['Admin'],
        isActive: true,
        order: 4
      },
      
      // Navegación para Superusuario (acceso completo)
      {
        id: 'superusuario-dashboard',
        name: 'Super Dashboard',
        path: '/superusuario/dashboard',
        icon: '🚀',
        roles: ['Superusuario'],
        isActive: true,
        order: 1
      },
      {
        id: 'rbac-management',
        name: 'Gestión RBAC',
        path: '/superusuario/rbac',
        icon: '🔐',
        roles: ['Superusuario'],
        isActive: true,
        order: 2
      },
      {
        id: 'navigation-config',
        name: 'Config. Navegación',
        path: '/superusuario/navigation',
        icon: '🧭',
        roles: ['Superusuario'],
        isActive: true,
        order: 3
      }
    ]
  }

  // ===== CONFIGURACIÓN COMPLETA DEL SISTEMA =====

  /**
   * Guardar configuración completa del sistema RBAC
   */
  static async saveSystemConfig(config: Partial<RBACConfiguration>, updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, RBAC_COLLECTION, 'system')
      await setDoc(docRef, {
        ...config,
        lastUpdated: serverTimestamp(),
        updatedBy
      }, { merge: true })
      
      console.log('✅ Configuración del sistema guardada')
    } catch (error) {
      console.error('❌ Error guardando configuración del sistema:', error)
      throw new Error('Error al guardar configuración del sistema')
    }
  }

  /**
   * Obtener configuración completa del sistema
   */
  static async getSystemConfig(): Promise<RBACConfiguration | null> {
    try {
      const docRef = doc(db, RBAC_COLLECTION, 'system')
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        console.log('✅ Configuración del sistema obtenida')
        return data as RBACConfiguration
      }
      
      return null
    } catch (error) {
      console.error('❌ Error obteniendo configuración del sistema:', error)
      return null
    }
  }

  /**
   * Inicializar configuración por defecto en Firestore
   */
  static async initializeDefaultConfig(updatedBy: string): Promise<void> {
    try {
      console.log('🔄 Inicializando configuración RBAC por defecto...')
      
      // Importar configuración por defecto desde useRBACManagement
      const { useRBACManagement } = await import('@/composables/useRBACManagement')
      const rbacManagement = useRBACManagement()
      
      // Inicializar datos por defecto
      await rbacManagement.initializeDefaultData()
      
      // Guardar navegación por defecto
      const defaultNavigation = this.getDefaultNavigationConfig()
      await this.saveNavigationConfig(defaultNavigation, updatedBy)
      
      console.log('✅ Configuración RBAC inicializada correctamente')
    } catch (error) {
      console.error('❌ Error inicializando configuración RBAC:', error)
      throw new Error('Error al inicializar configuración RBAC')
    }
  }
}
