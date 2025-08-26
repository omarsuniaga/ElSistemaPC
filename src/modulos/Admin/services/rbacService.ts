import type { User } from '@/types/auth';

// Define permission types
export type Permission = 
  | 'students.view'
  | 'students.create'
  | 'students.edit'
  | 'students.delete'
  | 'classes.view'
  | 'classes.create'
  | 'classes.edit'
  | 'classes.delete'
  | 'teachers.view'
  | 'teachers.create'
  | 'teachers.edit'
  | 'teachers.delete'
  | 'attendance.view'
  | 'attendance.create'
  | 'attendance.edit'
  | 'attendance.delete'
  | 'reports.view'
  | 'reports.create'
  | 'reports.export'
  | 'settings.view'
  | 'settings.edit'
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'admin.dashboard'
  | 'admin.system'
  | 'notifications.view'
  | 'notifications.manage';

// Define role types
export type Role = 'student' | 'teacher' | 'admin' | 'super_admin' | 'director';

// Permission sets for each role
const rolePermissions: Record<Role, Permission[]> = {
  student: [
    'classes.view',
    'attendance.view'
  ],
  
  teacher: [
    'students.view',
    'students.create',
    'students.edit',
    'classes.view',
    'classes.create',
    'classes.edit',
    'attendance.view',
    'attendance.create',
    'attendance.edit',
    'reports.view',
    'notifications.view'
  ],
  
  admin: [
    'students.view',
    'students.create',
    'students.edit',
    'students.delete',
    'classes.view',
    'classes.create',
    'classes.edit',
    'classes.delete',
    'teachers.view',
    'teachers.create',
    'teachers.edit',
    'attendance.view',
    'attendance.create',
    'attendance.edit',
    'attendance.delete',
    'reports.view',
    'reports.create',
    'reports.export',
    'settings.view',
    'settings.edit',
    'admin.dashboard',
    'notifications.view',
    'notifications.manage'
  ],
  
  director: [
    'students.view',
    'students.create',
    'students.edit',
    'students.delete',
    'classes.view',
    'classes.create',
    'classes.edit',
    'classes.delete',
    'teachers.view',
    'teachers.create',
    'teachers.edit',
    'teachers.delete',
    'attendance.view',
    'attendance.create',
    'attendance.edit',
    'attendance.delete',
    'reports.view',
    'reports.create',
    'reports.export',
    'settings.view',
    'settings.edit',
    'users.view',
    'users.create',
    'users.edit',
    'admin.dashboard',
    'admin.system',
    'notifications.view',
    'notifications.manage'
  ],
  
  super_admin: [
    'students.view',
    'students.create',
    'students.edit',
    'students.delete',
    'classes.view',
    'classes.create',
    'classes.edit',
    'classes.delete',
    'teachers.view',
    'teachers.create',
    'teachers.edit',
    'teachers.delete',
    'attendance.view',
    'attendance.create',
    'attendance.edit',
    'attendance.delete',
    'reports.view',
    'reports.create',
    'reports.export',
    'settings.view',
    'settings.edit',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'admin.dashboard',
    'admin.system',
    'notifications.view',
    'notifications.manage'
  ]
};

// Resource-specific permissions
export interface ResourcePermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export class RBACService {
  private static instance: RBACService;
  private currentUser: User | null = null;

  private constructor() {}

  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  setCurrentUser(user: User | null) {
    this.currentUser = user;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getUserRole(): Role | null {
    if (!this.currentUser) return null;
    return this.currentUser.role as Role;
  }

  hasPermission(permission: Permission): boolean {
    const role = this.getUserRole();
    if (!role) return false;

    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  getResourcePermissions(resource: string): ResourcePermissions {
    return {
      canView: this.hasPermission(`${resource}.view` as Permission),
      canCreate: this.hasPermission(`${resource}.create` as Permission),
      canEdit: this.hasPermission(`${resource}.edit` as Permission),
      canDelete: this.hasPermission(`${resource}.delete` as Permission),
    };
  }

  canAccessRoute(routeName: string): boolean {
    const routePermissions: Record<string, Permission[]> = {
      'admin-dashboard': ['admin.dashboard'],
      'admin-students': ['students.view'],
      'admin-students-create': ['students.create'],
      'admin-students-edit': ['students.edit'],
      'admin-classes': ['classes.view'],
      'admin-classes-create': ['classes.create'],
      'admin-classes-edit': ['classes.edit'],
      'admin-teachers': ['teachers.view'],
      'admin-teachers-create': ['teachers.create'],
      'admin-teachers-edit': ['teachers.edit'],
      'admin-attendance': ['attendance.view'],
      'admin-reports': ['reports.view'],
      'admin-settings': ['settings.view'],
      'admin-users': ['users.view'],
      'admin-notifications': ['notifications.view'],
    };

    const requiredPermissions = routePermissions[routeName];
    if (!requiredPermissions) return true; // Allow access if no specific permissions defined

    return this.hasAnyPermission(requiredPermissions);
  }

  canAccessModule(moduleName: string): boolean {
    const modulePermissions: Record<string, Permission[]> = {
      'students': ['students.view'],
      'classes': ['classes.view'],
      'teachers': ['teachers.view'],
      'attendance': ['attendance.view'],
      'reports': ['reports.view'],
      'settings': ['settings.view'],
      'users': ['users.view'],
      'notifications': ['notifications.view'],
    };

    const requiredPermissions = modulePermissions[moduleName];
    if (!requiredPermissions) return false;

    return this.hasAnyPermission(requiredPermissions);
  }

  isAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'admin' || role === 'director' || role === 'super_admin';
  }

  isSuperAdmin(): boolean {
    return this.getUserRole() === 'super_admin';
  }

  isDirector(): boolean {
    return this.getUserRole() === 'director';
  }

  isTeacher(): boolean {
    return this.getUserRole() === 'teacher';
  }

  isStudent(): boolean {
    return this.getUserRole() === 'student';
  }

  // Get filtered navigation items based on permissions
  getFilteredNavigation(navigationItems: any[]): any[] {
    return navigationItems.filter(item => {
      if (item.permission) {
        return this.hasPermission(item.permission);
      }
      if (item.permissions) {
        return this.hasAnyPermission(item.permissions);
      }
      if (item.module) {
        return this.canAccessModule(item.module);
      }
      return true; // Allow items without permission requirements
    }).map(item => ({
      ...item,
      children: item.children ? this.getFilteredNavigation(item.children) : undefined
    }));
  }

  // Get role display name
  getRoleDisplayName(role?: Role): string {
    const roleNames: Record<Role, string> = {
      student: 'Estudiante',
      teacher: 'Profesor',
      admin: 'Administrador',
      director: 'Director',
      super_admin: 'Super Administrador'
    };

    return roleNames[role || this.getUserRole() || 'student'];
  }

  // Get all permissions for current user
  getUserPermissions(): Permission[] {
    const role = this.getUserRole();
    if (!role) return [];
    return rolePermissions[role] || [];
  }

  // Check if user can perform specific action on specific resource with ID
  canPerformAction(
    resource: string, 
    action: 'view' | 'create' | 'edit' | 'delete',
    resourceId?: string | number,
    ownerId?: string
  ): boolean {
    const basePermission = this.hasPermission(`${resource}.${action}` as Permission);
    
    // If user doesn't have base permission, deny
    if (!basePermission) return false;

    // For create actions, base permission is sufficient
    if (action === 'create') return true;

    // For other actions, check if user is accessing their own resource
    if (resourceId && ownerId && this.currentUser) {
      // Students can only access their own data
      if (this.isStudent()) {
        return this.currentUser.id === ownerId;
      }
      // Teachers can access their own data and their students' data
      if (this.isTeacher()) {
        return this.currentUser.id === ownerId || this.isTeacherOfResource(resourceId);
      }
    }

    // Admins and higher roles can access all resources
    return this.isAdmin();
  }

  // Helper method to check if teacher owns/teaches a resource
  private isTeacherOfResource(resourceId: string | number): boolean {
    // This would need to be implemented based on your data relationships
    // For example, checking if teacher is assigned to a class or student
    // Implementation depends on your data structure
    return true; // Placeholder - implement based on your needs
  }

  // Utility method to check multiple conditions
  satisfiesConditions(conditions: {
    permissions?: Permission[];
    roles?: Role[];
    requireAll?: boolean;
  }): boolean {
    const { permissions = [], roles = [], requireAll = false } = conditions;
    
    // Check role conditions
    const roleMatch = roles.length === 0 || roles.includes(this.getUserRole() as Role);
    
    // Check permission conditions
    const permissionMatch = permissions.length === 0 || 
      (requireAll ? this.hasAllPermissions(permissions) : this.hasAnyPermission(permissions));
    
    return roleMatch && permissionMatch;
  }
}

// Export singleton instance
export const rbacService = RBACService.getInstance();

// Export utility functions
export const useRBAC = () => {
  return {
    rbac: rbacService,
    hasPermission: (permission: Permission) => rbacService.hasPermission(permission),
    hasAnyPermission: (permissions: Permission[]) => rbacService.hasAnyPermission(permissions),
    hasAllPermissions: (permissions: Permission[]) => rbacService.hasAllPermissions(permissions),
    getResourcePermissions: (resource: string) => rbacService.getResourcePermissions(resource),
    canAccessRoute: (routeName: string) => rbacService.canAccessRoute(routeName),
    canAccessModule: (moduleName: string) => rbacService.canAccessModule(moduleName),
    isAdmin: () => rbacService.isAdmin(),
    isSuperAdmin: () => rbacService.isSuperAdmin(),
    isDirector: () => rbacService.isDirector(),
    isTeacher: () => rbacService.isTeacher(),
    isStudent: () => rbacService.isStudent(),
    canPerformAction: (resource: string, action: 'view' | 'create' | 'edit' | 'delete', resourceId?: string | number, ownerId?: string) => 
      rbacService.canPerformAction(resource, action, resourceId, ownerId),
    getUserRole: () => rbacService.getUserRole(),
    getRoleDisplayName: (role?: Role) => rbacService.getRoleDisplayName(role),
    getUserPermissions: () => rbacService.getUserPermissions(),
  };
};

export default rbacService;