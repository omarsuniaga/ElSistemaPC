// src/router/guards/rbacGuard.ts

import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';

export async function rbacGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  // Lazy import to avoid early store initialization
  const { useAuthStore } = await import('@/stores/auth');
  const authStore = useAuthStore();
  const user = authStore.user;
  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    next('/login');
    return;
  }

  // Si la ruta no requiere verificación RBAC, continuar
  if (!to.meta.requiresRBAC) {
    next();
    return;
  }

  // Evitar bucle infinito: si ya estamos en una página de error, no redirigir de nuevo
  if (to.query.error || to.path === '/unauthorized') {
    console.warn('RBAC Guard: Usuario en página de error o acceso denegado, evitando redirección');
    next();
    return;
  }
  try {
    // Verificación simplificada basada en el rol del usuario
    const userRole = user.role; // Rol del usuario desde el store de autenticación
    console.log(
      `👤 RBAC Guard: Verificando acceso para usuario con rol '${userRole}' a ruta '${to.path}'`,
    ); // Verificación especial para maestros en rutas de teacher
    if (
      userRole?.toLowerCase() === 'maestro' &&
      (to.path.startsWith('/teacher') || to.path.startsWith('/attendance'))
    ) {
      console.log(`✅ RBAC Guard: Acceso maestro permitido para ruta: ${to.path}`);
      return next();
    }
    // Verificar si hay roles permitidos definidos directamente en la ruta
    if (to.meta.allowedRoles && Array.isArray(to.meta.allowedRoles)) {
      // Comparación case-insensitive para mayor robustez
      const normalizedUserRole = userRole?.toLowerCase();
      const allowedRoles = to.meta.allowedRoles.map((r: string) => r.toLowerCase());

      const hasAccess = normalizedUserRole ? allowedRoles.includes(normalizedUserRole) : false;
      console.log(
        `🔐 RBAC Guard: Roles permitidos: [${to.meta.allowedRoles.join(', ')}], Usuario tiene: ${userRole || 'N/A'}, Acceso: ${hasAccess}`,
      );

      if (hasAccess) {
        console.log(`✅ RBAC Guard: Acceso permitido por rol a ruta ${to.path}`);
        return next();
      }
    } // Verificación por módulo y permiso
    if (to.meta.moduleKey && to.meta.permission) {
      // Mapeo simplificado de roles a permisos
      const hasAccess = checkRolePermissionAccess(
        userRole,
        to.meta.moduleKey as string,
        to.meta.permission as string,
        to,
      );

      if (hasAccess) {
        console.log(`✅ RBAC Guard: Acceso permitido por permiso a ruta ${to.path}`);
        return next();
      }
    } // Si llegamos aquí, no se ha concedido acceso
    console.warn(
      `❌ RBAC Guard: Acceso denegado para usuario ${user.uid} con rol ${userRole} a la ruta ${to.path}`,
    );

    // Evitar redirección infinita: si ya estamos siendo redirigidos, no redirigir de nuevo
    if (to.query.redirected === 'true') {
      console.warn('RBAC Guard: Redirección detectada, evitando bucle infinito');
      next('/unauthorized');
      return;
    }

    // Redirigir según el rol del usuario
    const normalizedRole = userRole?.toLowerCase() || '';

    if (normalizedRole.includes('maestro') || normalizedRole.includes('teacher')) {
      // Nota: Los maestros ya tienen acceso permitido a rutas /attendance/ arriba
      // Solo redirigir para otras rutas denegadas
      if (!to.path.startsWith('/attendance/')) {
        next('/teacher?redirected=true');
      } else {
        // Esto no debería suceder ya que permitimos access arriba
        next('/attendance/calendar?redirected=true');
      }
    } else if (normalizedRole.includes('director') || normalizedRole.includes('admin')) {
      next('/attendance/calendar?redirected=true');
    } else if (normalizedRole.includes('superusuario')) {
      next('/superusuario/dashboard?redirected=true');
    } else {
      next('/unauthorized');
    }
  } catch (error) {
    console.error('❌ RBAC Guard: Error al verificar acceso:', error);
    next('/unauthorized?error=rbac_error');
  }
}

/**
 * Verifica si un rol tiene acceso a un módulo y permiso específico
 * Esta es una implementación simplificada mientras se establece el sistema RBAC completo
 */
function checkRolePermissionAccess(
  role: string | undefined,
  moduleKey: string,
  permission: string,
  to?: RouteLocationNormalized,
): boolean {
  if (!role) return false;

  // Normalizar el rol para comparaciones case-insensitive
  const normalizedRole = role.toLowerCase();

  // Permisos para el rol "maestro" - PERMISOS COMPLETOS PARA ASISTENCIA
  if (normalizedRole === 'maestro' || normalizedRole === 'teacher') {
    // ACCESO TOTAL a todas las rutas de teacher y attendance
    if (to?.path?.includes('/teacher/attendance') || to?.path?.includes('/attendance/')) {
      console.log('✅ Permiso explícito para maestro en ruta de asistencia:', to?.path);
      return true;
    }
    
    // Acceso completo a módulo attendance sin importar el permiso específico
    if (moduleKey === 'attendance') {
      console.log('✅ Permiso concedido para módulo attendance a maestro');
      return true;
    }
    
    // Acceso completo a funcionalidades de maestro
    if (moduleKey === 'teacher') return true;

    // Otros permisos de maestro
    if (moduleKey === 'schedule' && permission === 'teacher_view') return true;
    if (moduleKey === 'teacher_profile' && permission === 'view') return true;
    if (moduleKey === 'classes') return true;
    if (moduleKey === 'students') return true;
    
    // Permisos generales para rutas de teacher
    if (to?.path?.startsWith('/teacher')) return true;

    return false;
  }

  // Permisos para roles administrativos
  if (normalizedRole === 'admin' || normalizedRole === 'director') {
    // Acceso a todas las rutas administrativas
    return true;
  }

  // Superusuario tiene acceso a todo
  if (normalizedRole === 'superusuario' || normalizedRole === 'superuser') {
    return true;
  }

  // Por defecto, denegar acceso
  return false;
}
