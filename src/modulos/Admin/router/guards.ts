import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { rbacService } from '../services/rbacService';

export interface RoutePermissions {
  module?: string;
  action?: string;
  permissions?: string[];
  roles?: string[];
  requiresAuth?: boolean;
}

// Authentication guard
export const authGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore();
  
  // Check if route requires authentication
  const requiresAuth = to.meta.requiresAuth as boolean;
  
  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login with intended destination as query parameter
    next(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
    return;
  }
  
  next();
};

// RBAC permission guard
export const permissionGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore();
  const permissions = to.meta.permissions as RoutePermissions;
  
  // Skip if no permissions defined or user not authenticated
  if (!permissions || !authStore.isAuthenticated) {
    next();
    return;
  }
  
  // Update RBAC service with current user
  rbacService.setCurrentUser(authStore.user);
  
  // Check module access
  if (permissions.module && !rbacService.canAccessModule(permissions.module)) {
    console.warn(`Access denied: User cannot access module "${permissions.module}"`);
    next('/admin?error=insufficient_permissions');
    return;
  }
  
  // Check specific permissions
  if (permissions.permissions) {
    const hasPermission = rbacService.hasAnyPermission(permissions.permissions as any[]);
    if (!hasPermission) {
      console.warn(`Access denied: User lacks required permissions:`, permissions.permissions);
      next('/admin?error=insufficient_permissions');
      return;
    }
  }
  
  // Check role requirements
  if (permissions.roles) {
    const userRole = rbacService.getUserRole();
    const hasRequiredRole = permissions.roles.includes(userRole || '');
    if (!hasRequiredRole) {
      console.warn(`Access denied: User role "${userRole}" not in required roles:`, permissions.roles);
      next('/admin?error=insufficient_role');
      return;
    }
  }
  
  // Check route-specific access
  if (to.name && !rbacService.canAccessRoute(to.name as string)) {
    console.warn(`Access denied: User cannot access route "${to.name}"`);
    next('/admin?error=route_access_denied');
    return;
  }
  
  next();
};

// Role-based redirect guard
export const roleRedirectGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) {
    next();
    return;
  }
  
  rbacService.setCurrentUser(authStore.user);
  const userRole = rbacService.getUserRole();
  
  // Redirect based on user role when accessing admin root
  if (to.path === '/admin' && !to.query.error) {
    switch (userRole) {
      case 'student':
        // Students should be redirected to their dashboard
        next('/dashboard');
        return;
      case 'teacher':
        // Teachers can access admin but with limited view
        next();
        return;
      case 'admin':
      case 'director':
      case 'super_admin':
        // Admins can access admin dashboard
        next();
        return;
      default:
        // Unknown role, redirect to appropriate area
        next('/dashboard');
        return;
    }
  }
  
  next();
};

// Super admin guard for sensitive routes
export const superAdminGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) {
    next('/login');
    return;
  }
  
  rbacService.setCurrentUser(authStore.user);
  
  if (!rbacService.isSuperAdmin()) {
    console.warn('Access denied: Super admin privileges required');
    next('/admin?error=super_admin_required');
    return;
  }
  
  next();
};

// Director or higher guard
export const directorGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) {
    next('/login');
    return;
  }
  
  rbacService.setCurrentUser(authStore.user);
  
  if (!rbacService.isDirector() && !rbacService.isSuperAdmin()) {
    console.warn('Access denied: Director privileges required');
    next('/admin?error=director_required');
    return;
  }
  
  next();
};

// Admin or higher guard
export const adminGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) {
    next('/login');
    return;
  }
  
  rbacService.setCurrentUser(authStore.user);
  
  if (!rbacService.isAdmin()) {
    console.warn('Access denied: Admin privileges required');
    next('/admin?error=admin_required');
    return;
  }
  
  next();
};

// Teacher or higher guard
export const teacherGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) {
    next('/login');
    return;
  }
  
  rbacService.setCurrentUser(authStore.user);
  
  const role = rbacService.getUserRole();
  const allowedRoles = ['teacher', 'admin', 'director', 'super_admin'];
  
  if (!role || !allowedRoles.includes(role)) {
    console.warn('Access denied: Teacher privileges required');
    next('/admin?error=teacher_required');
    return;
  }
  
  next();
};

// Composite guard that runs all necessary checks
export const adminRouteGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  // Run guards in sequence
  authGuard(to, from, (result) => {
    if (typeof result === 'string' || typeof result === 'object') {
      next(result);
      return;
    }
    
    roleRedirectGuard(to, from, (result) => {
      if (typeof result === 'string' || typeof result === 'object') {
        next(result);
        return;
      }
      
      permissionGuard(to, from, next);
    });
  });
};

// Helper function to check if user can edit resource
export const canEditResource = (resourceId: string, ownerId?: string): boolean => {
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) return false;
  
  rbacService.setCurrentUser(authStore.user);
  
  // Super admins can edit everything
  if (rbacService.isSuperAdmin()) return true;
  
  // Directors can edit most things
  if (rbacService.isDirector()) return true;
  
  // Admins can edit within their scope
  if (rbacService.isAdmin()) return true;
  
  // Teachers can edit their own resources or assigned students/classes
  if (rbacService.isTeacher()) {
    return !ownerId || authStore.user?.id === ownerId;
  }
  
  // Students can only edit their own data
  if (rbacService.isStudent()) {
    return authStore.user?.id === ownerId;
  }
  
  return false;
};

// Helper function to get accessible menu items
export const getAccessibleMenuItems = (menuItems: any[]) => {
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) return [];
  
  rbacService.setCurrentUser(authStore.user);
  return rbacService.getFilteredNavigation(menuItems);
};

export default {
  authGuard,
  permissionGuard,
  roleRedirectGuard,
  superAdminGuard,
  directorGuard,
  adminGuard,
  teacherGuard,
  adminRouteGuard,
  canEditResource,
  getAccessibleMenuItems
};