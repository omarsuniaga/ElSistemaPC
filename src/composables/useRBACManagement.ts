// src/composables/useRBACManagement.ts

import { ref, computed, onMounted } from 'vue'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/firebase'

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  isActive: boolean
  createdAt?: any
  updatedAt?: any
}

export interface Permission {
  id: string
  name: string
  description: string
  module: string
  action: string
  resource: string
}

export function useRBACManagement() {
  const roles = ref<Role[]>([])
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Permisos predefinidos para el sistema
  const defaultPermissions: Omit<Permission, 'id'>[] = [
    // Permisos de Asistencia
    { name: 'Ver Asistencia', description: 'Puede ver registros de asistencia', module: 'attendance', action: 'read', resource: 'attendance_records' },
    { name: 'Crear Asistencia', description: 'Puede crear nuevos registros de asistencia', module: 'attendance', action: 'create', resource: 'attendance_records' },
    { name: 'Editar Asistencia', description: 'Puede modificar registros de asistencia', module: 'attendance', action: 'update', resource: 'attendance_records' },
    { name: 'Eliminar Asistencia', description: 'Puede eliminar registros de asistencia', module: 'attendance', action: 'delete', resource: 'attendance_records' },
    { name: 'Calendario Asistencia', description: 'Puede acceder al calendario de asistencia', module: 'attendance', action: 'read', resource: 'attendance_calendar' },
    
    // Permisos de Clases
    { name: 'Ver Clases', description: 'Puede ver información de clases', module: 'classes', action: 'read', resource: 'classes' },
    { name: 'Gestionar Clases', description: 'Puede crear y modificar clases', module: 'classes', action: 'write', resource: 'classes' },
    
    // Permisos de Estudiantes
    { name: 'Ver Estudiantes', description: 'Puede ver información de estudiantes', module: 'students', action: 'read', resource: 'students' },
    { name: 'Gestionar Estudiantes', description: 'Puede crear y modificar estudiantes', module: 'students', action: 'write', resource: 'students' },
    
    // Permisos de Maestros
    { name: 'Ver Maestros', description: 'Puede ver información de maestros', module: 'teachers', action: 'read', resource: 'teachers' },
    { name: 'Gestionar Maestros', description: 'Puede crear y modificar maestros', module: 'teachers', action: 'write', resource: 'teachers' },
    
    // Permisos de Dashboard
    { name: 'Dashboard Maestro', description: 'Acceso al dashboard de maestro', module: 'dashboard', action: 'read', resource: 'teacher_dashboard' },
    { name: 'Dashboard Admin', description: 'Acceso al dashboard administrativo', module: 'dashboard', action: 'read', resource: 'admin_dashboard' },
    
    // Permisos de Sistema
    { name: 'Gestión RBAC', description: 'Puede gestionar roles y permisos', module: 'system', action: 'admin', resource: 'rbac' },
    { name: 'Configuración Sistema', description: 'Puede configurar el sistema', module: 'system', action: 'admin', resource: 'configuration' }
  ]

  // Roles predefinidos
  const defaultRoles: Omit<Role, 'id'>[] = [
    {
      name: 'Maestro',
      description: 'Profesor con acceso a módulos de enseñanza',
      permissions: [
        'Ver Asistencia', 'Crear Asistencia', 'Editar Asistencia', 'Calendario Asistencia',
        'Ver Clases', 'Ver Estudiantes', 'Dashboard Maestro'
      ],
      isActive: true
    },
    {
      name: 'Director',
      description: 'Administrador general con acceso académico',
      permissions: [
        'Ver Asistencia', 'Crear Asistencia', 'Editar Asistencia', 'Eliminar Asistencia', 'Calendario Asistencia',
        'Ver Clases', 'Gestionar Clases',
        'Ver Estudiantes', 'Gestionar Estudiantes',
        'Ver Maestros', 'Gestionar Maestros',
        'Dashboard Admin'
      ],
      isActive: true
    },
    {
      name: 'Admin',
      description: 'Administrador con permisos limitados',
      permissions: [
        'Ver Asistencia', 'Crear Asistencia', 'Editar Asistencia', 'Calendario Asistencia',
        'Ver Clases', 'Gestionar Clases',
        'Ver Estudiantes', 'Gestionar Estudiantes',
        'Dashboard Admin'
      ],
      isActive: true
    },
    {
      name: 'Superusuario',
      description: 'Super administrador con acceso completo',
      permissions: [
        'Ver Asistencia', 'Crear Asistencia', 'Editar Asistencia', 'Eliminar Asistencia', 'Calendario Asistencia',
        'Ver Clases', 'Gestionar Clases',
        'Ver Estudiantes', 'Gestionar Estudiantes',
        'Ver Maestros', 'Gestionar Maestros',
        'Dashboard Admin', 'Gestión RBAC', 'Configuración Sistema'
      ],
      isActive: true
    }
  ]

  // Cargar roles desde Firestore
  const loadRoles = async () => {
    try {
      loading.value = true
      const rolesSnapshot = await getDocs(collection(db, 'rbac_roles'))
      roles.value = rolesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Role))
    } catch (err) {
      error.value = 'Error al cargar roles'
      console.error('Error loading roles:', err)
    } finally {
      loading.value = false
    }
  }

  // Cargar permisos desde Firestore
  const loadPermissions = async () => {
    try {
      loading.value = true
      const permissionsSnapshot = await getDocs(collection(db, 'rbac_permissions'))
      permissions.value = permissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Permission))
    } catch (err) {
      error.value = 'Error al cargar permisos'
      console.error('Error loading permissions:', err)
    } finally {
      loading.value = false
    }
  }
  // Función para forzar la inicialización de datos RBAC
  const forceInitializeRBAC = async () => {
    try {
      loading.value = true
      console.log('Inicializando datos RBAC por defecto...')
      
      // Forzar creación de permisos
      console.log('Creando permisos por defecto...')
      for (const permission of defaultPermissions) {
        await addDoc(collection(db, 'rbac_permissions'), {
          ...permission,
          createdAt: serverTimestamp()
        })
        console.log(`✓ Permiso creado: ${permission.name}`)
      }
      
      // Forzar creación de roles
      console.log('Creando roles por defecto...')
      for (const role of defaultRoles) {
        await addDoc(collection(db, 'rbac_roles'), {
          ...role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        console.log(`✓ Rol creado: ${role.name}`)
      }
      
      // Recargar datos
      await loadPermissions()
      await loadRoles()
      
      console.log('✅ Inicialización RBAC completada!')
    } catch (err) {
      error.value = 'Error al forzar inicialización RBAC'
      console.error('Error forcing RBAC initialization:', err)
    } finally {
      loading.value = false
    }
  }

  // Crear nuevo rol
  const createRole = async (roleData: Omit<Role, 'id'>) => {
    try {
      loading.value = true
      await addDoc(collection(db, 'rbac_roles'), {
        ...roleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      await loadRoles()
    } catch (err) {
      error.value = 'Error al crear rol'
      console.error('Error creating role:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Actualizar rol
  const updateRole = async (roleId: string, roleData: Partial<Role>) => {
    try {
      loading.value = true
      await updateDoc(doc(db, 'rbac_roles', roleId), {
        ...roleData,
        updatedAt: serverTimestamp()
      })
      await loadRoles()
    } catch (err) {
      error.value = 'Error al actualizar rol'
      console.error('Error updating role:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Eliminar rol
  const deleteRole = async (roleId: string) => {
    try {
      loading.value = true
      await deleteDoc(doc(db, 'rbac_roles', roleId))
      await loadRoles()
    } catch (err) {
      error.value = 'Error al eliminar rol'
      console.error('Error deleting role:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Crear nuevo permiso
  const createPermission = async (permissionData: Omit<Permission, 'id'>) => {
    try {
      loading.value = true
      await addDoc(collection(db, 'rbac_permissions'), {
        ...permissionData,
        createdAt: serverTimestamp()
      })
      await loadPermissions()
    } catch (err) {
      error.value = 'Error al crear permiso'
      console.error('Error creating permission:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Actualizar permiso
  const updatePermission = async (permissionId: string, permissionData: Partial<Permission>) => {
    try {
      loading.value = true
      await updateDoc(doc(db, 'rbac_permissions', permissionId), permissionData)
      await loadPermissions()
    } catch (err) {
      error.value = 'Error al actualizar permiso'
      console.error('Error updating permission:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Eliminar permiso
  const deletePermission = async (permissionId: string) => {
    try {
      loading.value = true
      await deleteDoc(doc(db, 'rbac_permissions', permissionId))
      await loadPermissions()
    } catch (err) {
      error.value = 'Error al eliminar permiso'
      console.error('Error deleting permission:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Verificar si un usuario tiene un permiso específico
  const hasPermission = (userRole: string, permissionName: string): boolean => {
    const role = roles.value.find(r => r.name.toLowerCase() === userRole.toLowerCase())
    return role ? role.permissions.includes(permissionName) : false
  }

  // Obtener permisos por módulo
  const getPermissionsByModule = computed(() => {
    const grouped: Record<string, Permission[]> = {}
    permissions.value.forEach(permission => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = []
      }
      grouped[permission.module].push(permission)
    })
    return grouped
  })
  onMounted(async () => {
    await loadRoles()
    await loadPermissions()
    
    // Si no hay datos, inicializar automáticamente
    if (roles.value.length === 0 || permissions.value.length === 0) {
      await forceInitializeRBAC()
    }
  })

  return {
    roles,
    permissions,
    loading,
    error,
    loadRoles,
    loadPermissions,
    forceInitializeRBAC,
    createRole,
    updateRole,
    deleteRole,
    createPermission,
    updatePermission,
    deletePermission,
    hasPermission,
    getPermissionsByModule
  }
}
