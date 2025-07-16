// src/services/rbac/rbacService.ts

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';

export interface Permission {
  id: string
  name: string
  description: string
  module: string
  component?: string
  action: string // 'read' | 'write' | 'delete' | 'execute'
  resource: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[] // IDs de permisos
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ModuleAccess {
  moduleId: string
  moduleName: string
  isEnabled: boolean
  allowedRoles: string[]
  components: ComponentAccess[]
  routes: RouteAccess[]
}

export interface ComponentAccess {
  componentId: string
  componentName: string
  isVisible: boolean
  allowedRoles: string[]
  permissions: string[]
}

export interface RouteAccess {
  routePath: string
  routeName: string
  isAccessible: boolean
  allowedRoles: string[]
  permissions: string[]
}

export interface UserRoleAssignment {
  userId: string
  roleId: string
  assignedAt: Date
  assignedBy: string
  isActive: boolean
}

class RBACService {
  // Colección existente
  private usersCollection = 'USERS';

  // Colecciones RBAC opcionales (se crean solo si es necesario para funcionalidades avanzadas)
  private rolesCollection = 'rbac_roles';
  private permissionsCollection = 'rbac_permissions';
  private moduleAccessCollection = 'rbac_module_access';
  private userRolesCollection = 'rbac_user_roles';

  // Cache para mejorar rendimiento
  private rolesCache: Map<string, Role> = new Map();
  private permissionsCache: Map<string, Permission> = new Map();
  private moduleAccessCache: Map<string, ModuleAccess> = new Map();
  private userRolesCache: Map<string, string[]> = new Map(); // Roles base definidos en código (basados en la estructura existente USERS.role)
  private baseRoles = {
    Maestro: {
      name: 'Maestro',
      permissions: [
        'teacher_dashboard_view',
        'classes_teacher_view',
        'attendance_teacher_view',
        'attendance_calendar',
        'schedule_teacher_view',
        'students_view_own_classes', // Permiso por defecto: solo estudiantes de sus clases
        'students_view_detail',
        'profile_view',
        'profile_edit',
        'montaje_maestro_view',
        'montaje_obras_read',
        'montaje_compases_manage',
        'montaje_observaciones_create',
        'montaje_evaluaciones_create',
      ],
    },
    Director: {
      name: 'Director',
      permissions: [
        'dashboard_view',
        'teachers_view_all',
        'students_view_all',
        'classes_view_all',
        'attendance_view',
        'reports_view',
        'admin_functions',
        'montaje_director_view',
        'montaje_repertorio_manage',
        'montaje_obras_manage',
        'montaje_planes_manage',
        'montaje_maestros_supervise',
        'montaje_instrumentacion_manage',
      ],
    },
    Admin: {
      name: 'Admin',
      permissions: [
        'dashboard_view',
        'teachers_view_all',
        'students_view_all',
        'classes_view_all',
        'attendance_view',
        'reports_view',
        'admin_functions',
        'user_management',
      ],
    },
    Superusuario: {
      name: 'Superusuario',
      permissions: ['rbac_manage', 'system_admin', 'all_permissions'],
    },
  };
  // Configuración de módulos base
  private baseModules = [
    {
      moduleName: 'Teacher',
      isEnabled: true,
      allowedRoles: ['Maestro'],
      routes: [
        {
          routePath: '/teacher',
          routeName: 'TeacherDashboard',
          isAccessible: true,
          allowedRoles: ['Maestro'],
          permissions: ['teacher_dashboard_view'],
        },
        {
          routePath: '/teacher/attendance',
          routeName: 'TeacherAttendance',
          isAccessible: true,
          allowedRoles: ['Maestro'],
          permissions: ['attendance_teacher_view'],
        },
      ],
    },
    {
      moduleName: 'Dashboard',
      isEnabled: true,
      allowedRoles: ['Director', 'Admin', 'Superusuario'],
      routes: [
        {
          routePath: '/dashboard',
          routeName: 'AdminHomeView',
          isAccessible: true,
          allowedRoles: ['Director', 'Admin', 'Superusuario'],
          permissions: ['dashboard_view'],
        },
      ],
    },
    {
      moduleName: 'Superusuario',
      isEnabled: true,
      allowedRoles: ['Superusuario'],
      routes: [
        {
          routePath: '/superusuario/dashboard',
          routeName: 'SuperusuarioDashboard',
          isAccessible: true,
          allowedRoles: ['Superusuario'],
          permissions: ['rbac_manage'],
        },
        {
          routePath: '/superusuario/rbac',
          routeName: 'RBACManagement',
          isAccessible: true,
          allowedRoles: ['Superusuario'],
          permissions: ['rbac_manage'],
        },
      ],
    },
    {
      moduleName: 'Students',
      isEnabled: true,
      allowedRoles: ['Director', 'Admin', 'Maestro', 'Superusuario'],
      routes: [
        {
          routePath: '/students',
          routeName: 'Students',
          isAccessible: true,
          allowedRoles: ['Director', 'Admin', 'Maestro', 'Superusuario'],
          permissions: ['students_view_all'],
        },
      ],
    },
    {
      moduleName: 'Montaje',
      isEnabled: true,
      allowedRoles: ['Director', 'Admin', 'Maestro', 'Superusuario'],
      routes: [
        {
          routePath: '/montaje/maestro',
          routeName: 'MaestroMontaje',
          isAccessible: true,
          allowedRoles: ['Maestro'],
          permissions: ['montaje_maestro_view'],
        },
        {
          routePath: '/montaje/director',
          routeName: 'DirectorMontaje',
          isAccessible: true,
          allowedRoles: ['Director', 'Admin'],
          permissions: ['montaje_director_view'],
        },
        {
          routePath: '/montaje',
          routeName: 'Montaje',
          isAccessible: true,
          allowedRoles: ['Director', 'Admin', 'Maestro', 'Superusuario'],
          permissions: ['montaje_obras_read'],
        },
      ],
    },
  ];

  // ===== GESTIÓN DE ROLES =====

  async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const roleId = doc(collection(db, this.rolesCollection)).id;
    const newRole: Role = {
      ...role,
      id: roleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, this.rolesCollection, roleId), newRole);
    this.rolesCache.set(roleId, newRole);
    return roleId;
  }

  async updateRole(roleId: string, updates: Partial<Role>): Promise<void> {
    const updatedRole = {
      ...updates,
      updatedAt: new Date(),
    };

    await updateDoc(doc(db, this.rolesCollection, roleId), updatedRole);

    // Actualizar cache
    if (this.rolesCache.has(roleId)) {
      this.rolesCache.set(roleId, { ...this.rolesCache.get(roleId)!, ...updatedRole });
    }
  }

  async deleteRole(roleId: string): Promise<void> {
    await deleteDoc(doc(db, this.rolesCollection, roleId));
    this.rolesCache.delete(roleId);
  }

  async getAllRoles(): Promise<Role[]> {
    const snapshot = await getDocs(collection(db, this.rolesCollection));
    const roles: Role[] = [];

    snapshot.forEach((doc) => {
      const role = { id: doc.id, ...doc.data() } as Role;
      roles.push(role);
      this.rolesCache.set(role.id, role);
    });

    return roles;
  }

  async getRole(roleId: string): Promise<Role | null> {
    if (this.rolesCache.has(roleId)) {
      return this.rolesCache.get(roleId)!;
    }

    const docRef = doc(db, this.rolesCollection, roleId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const role = { id: docSnap.id, ...docSnap.data() } as Role;
      this.rolesCache.set(roleId, role);
      return role;
    }

    return null;
  }

  // ===== GESTIÓN DE PERMISOS =====

  async createPermission(permission: Omit<Permission, 'id'>): Promise<string> {
    const permissionId = doc(collection(db, this.permissionsCollection)).id;
    const newPermission: Permission = {
      ...permission,
      id: permissionId,
    };

    await setDoc(doc(db, this.permissionsCollection, permissionId), newPermission);
    this.permissionsCache.set(permissionId, newPermission);
    return permissionId;
  }

  async getAllPermissions(): Promise<Permission[]> {
    const snapshot = await getDocs(collection(db, this.permissionsCollection));
    const permissions: Permission[] = [];

    snapshot.forEach((doc) => {
      const permission = { id: doc.id, ...doc.data() } as Permission;
      permissions.push(permission);
      this.permissionsCache.set(permission.id, permission);
    });

    return permissions;
  }

  async getPermissionsByModule(module: string): Promise<Permission[]> {
    const q = query(collection(db, this.permissionsCollection), where('module', '==', module));

    const snapshot = await getDocs(q);
    const permissions: Permission[] = [];

    snapshot.forEach((doc) => {
      const permission = { id: doc.id, ...doc.data() } as Permission;
      permissions.push(permission);
    });

    return permissions;
  }

  // ===== GESTIÓN DE ACCESO A MÓDULOS =====

  async setModuleAccess(moduleAccess: ModuleAccess): Promise<void> {
    await setDoc(doc(db, this.moduleAccessCollection, moduleAccess.moduleId), moduleAccess);
    this.moduleAccessCache.set(moduleAccess.moduleId, moduleAccess);
  }

  async getModuleAccess(moduleId: string): Promise<ModuleAccess | null> {
    if (this.moduleAccessCache.has(moduleId)) {
      return this.moduleAccessCache.get(moduleId)!;
    }

    const docRef = doc(db, this.moduleAccessCollection, moduleId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const moduleAccess = docSnap.data() as ModuleAccess;
      this.moduleAccessCache.set(moduleId, moduleAccess);
      return moduleAccess;
    }

    return null;
  }

  async getAllModuleAccess(): Promise<ModuleAccess[]> {
    const snapshot = await getDocs(collection(db, this.moduleAccessCollection));
    const moduleAccess: ModuleAccess[] = [];

    snapshot.forEach((doc) => {
      const access = doc.data() as ModuleAccess;
      moduleAccess.push(access);
      this.moduleAccessCache.set(access.moduleId, access);
    });

    return moduleAccess;
  }

  // ===== ASIGNACIÓN DE ROLES A USUARIOS =====

  async assignRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<void> {
    const assignmentId = `${userId}_${roleId}`;
    const assignment: UserRoleAssignment = {
      userId,
      roleId,
      assignedAt: new Date(),
      assignedBy,
      isActive: true,
    };

    await setDoc(doc(db, this.userRolesCollection, assignmentId), assignment);

    // Actualizar cache
    const userRoles = this.userRolesCache.get(userId) || [];
    if (!userRoles.includes(roleId)) {
      userRoles.push(roleId);
      this.userRolesCache.set(userId, userRoles);
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const assignmentId = `${userId}_${roleId}`;
    await deleteDoc(doc(db, this.userRolesCollection, assignmentId));

    // Actualizar cache
    const userRoles = this.userRolesCache.get(userId) || [];
    const updatedRoles = userRoles.filter((id) => id !== roleId);
    this.userRolesCache.set(userId, updatedRoles);
  }
  async getUserRoles(userId: string): Promise<string[]> {
    console.log(`🔍 RBAC: Getting roles for user ${userId}`);

    if (this.userRolesCache.has(userId)) {
      const cachedRoles = this.userRolesCache.get(userId)!;
      console.log(`📄 RBAC: Using cached roles for user ${userId}:`, cachedRoles);
      return cachedRoles;
    }

    try {
      // Obtener el usuario de la colección USERS
      const userDoc = await getDoc(doc(db, this.usersCollection, userId));

      if (!userDoc.exists()) {
        console.warn(`⚠️ RBAC: User ${userId} not found in USERS collection`);
        return [];
      }

      const userData = userDoc.data();
      const userRole = userData.role;

      if (!userRole) {
        console.warn(`⚠️ RBAC: User ${userId} has no role defined`);
        return [];
      }

      console.log(`👤 RBAC: User ${userId} has role: ${userRole}`);

      // Devolver el rol como array (adaptación de string único a array)
      const roles = [userRole];
      this.userRolesCache.set(userId, roles);
      return roles;
    } catch (error) {
      console.error(`❌ RBAC: Error getting roles for user ${userId}:`, error);
      return [];
    }
  }
  /**
   * Get all user role assignments in the system
   * Adaptado para usar la colección USERS
   */
  async getAllUserRoleAssignments(): Promise<UserRoleAssignment[]> {
    try {
      console.log('📋 RBAC: Getting all user role assignments from USERS collection');

      const snapshot = await getDocs(collection(db, this.usersCollection));
      const assignments: UserRoleAssignment[] = [];

      snapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.role && userData.uid) {
          assignments.push({
            userId: userData.uid,
            roleId: userData.role, // Usar el nombre del rol como ID
            assignedAt: userData.createdAt || new Date(),
            assignedBy: 'system',
            isActive: userData.status === 'aprobado',
          });
        }
      });

      console.log(`📋 RBAC: Found ${assignments.length} user role assignments`);
      return assignments;
    } catch (error) {
      console.error('❌ RBAC: Error getting user role assignments:', error);
      throw new Error('Error al cargar las asignaciones de roles');
    }
  }

  // ===== VERIFICACIÓN DE PERMISOS =====
  async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    console.log(`🔑 RBAC: Checking permission '${permission}' for user ${userId}`);

    const userRoles = await this.getUserRoles(userId);
    console.log('👤 RBAC: User roles:', userRoles);

    for (const roleName of userRoles) {
      // Buscar en la configuración base de roles
      const roleConfig = this.baseRoles[roleName as keyof typeof this.baseRoles];
      if (roleConfig) {
        console.log(`🎭 RBAC: Checking permissions for role ${roleName}:`, roleConfig.permissions);
        if (roleConfig.permissions.includes(permission)) {
          console.log(`✅ RBAC: Permission '${permission}' granted via role '${roleName}'`);
          return true;
        }
      }

      // También verificar si es Superusuario (acceso total)
      if (roleName === 'Superusuario') {
        console.log('👑 RBAC: Superusuario has all permissions');
        return true;
      }
    }

    console.log(`❌ RBAC: Permission '${permission}' denied for user ${userId}`);
    return false;
  }
  async checkUserModuleAccess(userId: string, moduleId: string): Promise<boolean> {
    console.log(`📦 RBAC: Checking module access '${moduleId}' for user ${userId}`);

    const userRoles = await this.getUserRoles(userId);
    console.log('👤 RBAC: User roles:', userRoles);

    // Buscar en la configuración base de módulos
    const moduleConfig = this.baseModules.find(
      (m) => m.moduleName.toLowerCase() === moduleId.toLowerCase(),
    );

    if (!moduleConfig) {
      console.warn(`⚠️ RBAC: Module '${moduleId}' not found in base configuration`);
      return false;
    }

    if (!moduleConfig.isEnabled) {
      console.warn(`⚠️ RBAC: Module '${moduleId}' is disabled`);
      return false;
    }

    // Verificar si algún rol del usuario está permitido en el módulo
    const hasRoleAccess = userRoles.some((role) => moduleConfig.allowedRoles.includes(role));
    console.log(
      `🔐 RBAC: Module access check - User roles: ${userRoles}, Module allowed roles: ${moduleConfig.allowedRoles}, Has access: ${hasRoleAccess}`,
    );

    return hasRoleAccess;
  }
  async checkUserRouteAccess(userId: string, routePath: string): Promise<boolean> {
    console.log(`🔍 RBAC: Checking access for user ${userId} to route ${routePath}`);

    const userRoles = await this.getUserRoles(userId);
    console.log('👤 RBAC: User roles:', userRoles);

    // Buscar la ruta en la configuración base de módulos
    for (const moduleConfig of this.baseModules) {
      console.log(
        `🔎 RBAC: Checking module ${moduleConfig.moduleName} with ${moduleConfig.routes.length} routes`,
      );

      const route = moduleConfig.routes.find((r) => r.routePath === routePath);
      if (route) {
        console.log('✅ RBAC: Found route config:', route);

        if (route.isAccessible) {
          // Verificar acceso por rol
          const hasRoleAccess = userRoles.some((role) => route.allowedRoles.includes(role));
          console.log(
            `🔑 RBAC: Role access check - User roles: ${userRoles}, Route allowed roles: ${route.allowedRoles}, Has access: ${hasRoleAccess}`,
          );

          if (hasRoleAccess) {
            // Verificar permisos específicos si los hay
            if (route.permissions.length > 0) {
              console.log('🎫 RBAC: Checking permissions:', route.permissions);
              for (const permission of route.permissions) {
                const hasPermission = await this.checkUserPermission(userId, permission);
                console.log(`🎫 RBAC: Permission ${permission}: ${hasPermission}`);
                if (hasPermission) {
                  console.log(`✅ RBAC: Access granted via permission ${permission}`);
                  return true;
                }
              }
              console.log('❌ RBAC: Access denied - no required permissions');
              return false;
            }
            console.log('✅ RBAC: Access granted via role');
            return true;
          }
        } else {
          console.log('❌ RBAC: Route is not accessible');
        }

        console.log(`❌ RBAC: Access denied for route ${routePath}`);
        return false;
      }
    }

    console.log(`❌ RBAC: No route configuration found for ${routePath}`);
    return false;
  }

  // ===== GESTIÓN DE USUARIOS =====

  async getUserById(userId: string): Promise<any | null> {
    try {
      const userDoc = await getDoc(doc(db, 'USERS', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      return null;
    }
  }

  // ===== GESTIÓN DE CACHE =====
  /**
   * Convert role names to role IDs for backward compatibility
   * En el nuevo enfoque, los nombres son los IDs
   */
  async getRoleIdsByNames(roleNames: string[]): Promise<string[]> {
    // En nuestro nuevo enfoque, los nombres de roles son los IDs
    return roleNames;
  }

  // ===== UTILITARIOS =====

  clearCache(): void {
    this.rolesCache.clear();
    this.permissionsCache.clear();
    this.moduleAccessCache.clear();
    this.userRolesCache.clear();
  }

  async refreshCache(): Promise<void> {
    this.clearCache();
    await Promise.all([this.getAllRoles(), this.getAllPermissions(), this.getAllModuleAccess()]);
  }
}

export const rbacService = new RBACService();
