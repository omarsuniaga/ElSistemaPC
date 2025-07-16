// Script para inicializar las colecciones RBAC en Firestore
// Ejecutar desde la consola del navegador cuando esté logueado como superusuario

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

// Configuración por defecto de roles
const defaultRoles = [
  {
    id: 'maestro',
    name: 'Maestro',
    description: 'Profesor con acceso a módulos de enseñanza',
    permissions: [
      'Ver Asistencia',
      'Crear Asistencia',
      'Editar Asistencia',
      'Calendario Asistencia',
      'Ver Clases',
      'Ver Estudiantes',
      'Dashboard Maestro',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'maestro-avanzado',
    name: 'Maestro Avanzado',
    description: 'Profesor con permisos extendidos',
    permissions: [
      'Ver Asistencia',
      'Crear Asistencia',
      'Editar Asistencia',
      'Calendario Asistencia',
      'Ver Clases',
      'Ver Estudiantes',
      'Dashboard Maestro',
      'Ver Todos los Estudiantes', // Permiso adicional para ver todos los estudiantes
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'director',
    name: 'Director',
    description: 'Administrador general con acceso académico',
    permissions: [
      'Ver Asistencia',
      'Crear Asistencia',
      'Editar Asistencia',
      'Eliminar Asistencia',
      'Calendario Asistencia',
      'Ver Clases',
      'Gestionar Clases',
      'Ver Estudiantes',
      'Gestionar Estudiantes',
      'Ver Maestros',
      'Gestionar Maestros',
      'Dashboard Admin',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administrador con permisos limitados',
    permissions: [
      'Ver Asistencia',
      'Crear Asistencia',
      'Editar Asistencia',
      'Calendario Asistencia',
      'Ver Clases',
      'Gestionar Clases',
      'Ver Estudiantes',
      'Gestionar Estudiantes',
      'Dashboard Admin',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'superusuario',
    name: 'Superusuario',
    description: 'Super administrador con acceso completo',
    permissions: [
      'Ver Asistencia',
      'Crear Asistencia',
      'Editar Asistencia',
      'Eliminar Asistencia',
      'Calendario Asistencia',
      'Ver Clases',
      'Gestionar Clases',
      'Ver Estudiantes',
      'Gestionar Estudiantes',
      'Ver Maestros',
      'Gestionar Maestros',
      'Dashboard Admin',
      'Gestión RBAC',
      'Configuración Sistema',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Configuración por defecto de permisos
const defaultPermissions = [
  // Permisos de Asistencia
  {
    id: 'ver-asistencia',
    name: 'Ver Asistencia',
    description: 'Puede ver registros de asistencia',
    module: 'attendance',
    action: 'read',
    resource: 'attendance_records',
  },
  {
    id: 'crear-asistencia',
    name: 'Crear Asistencia',
    description: 'Puede crear nuevos registros de asistencia',
    module: 'attendance',
    action: 'create',
    resource: 'attendance_records',
  },
  {
    id: 'editar-asistencia',
    name: 'Editar Asistencia',
    description: 'Puede modificar registros de asistencia',
    module: 'attendance',
    action: 'update',
    resource: 'attendance_records',
  },
  {
    id: 'eliminar-asistencia',
    name: 'Eliminar Asistencia',
    description: 'Puede eliminar registros de asistencia',
    module: 'attendance',
    action: 'delete',
    resource: 'attendance_records',
  },
  {
    id: 'calendario-asistencia',
    name: 'Calendario Asistencia',
    description: 'Puede acceder al calendario de asistencia',
    module: 'attendance',
    action: 'read',
    resource: 'attendance_calendar',
  },

  // Permisos de Clases
  {
    id: 'ver-clases',
    name: 'Ver Clases',
    description: 'Puede ver información de clases',
    module: 'classes',
    action: 'read',
    resource: 'classes',
  },
  {
    id: 'gestionar-clases',
    name: 'Gestionar Clases',
    description: 'Puede crear y modificar clases',
    module: 'classes',
    action: 'write',
    resource: 'classes',
  },

  // Permisos de Estudiantes
  {
    id: 'ver-estudiantes',
    name: 'Ver Estudiantes',
    description: 'Puede ver estudiantes de sus clases',
    module: 'students',
    action: 'read',
    resource: 'students',
  },
  {
    id: 'ver-todos-estudiantes',
    name: 'Ver Todos los Estudiantes',
    description: 'Puede ver todos los estudiantes de la academia',
    module: 'students',
    action: 'read',
    resource: 'all_students',
  },
  {
    id: 'gestionar-estudiantes',
    name: 'Gestionar Estudiantes',
    description: 'Puede crear y modificar estudiantes',
    module: 'students',
    action: 'write',
    resource: 'students',
  },

  // Permisos de Maestros
  {
    id: 'ver-maestros',
    name: 'Ver Maestros',
    description: 'Puede ver información de maestros',
    module: 'teachers',
    action: 'read',
    resource: 'teachers',
  },
  {
    id: 'gestionar-maestros',
    name: 'Gestionar Maestros',
    description: 'Puede crear y modificar maestros',
    module: 'teachers',
    action: 'write',
    resource: 'teachers',
  },

  // Permisos de Dashboard
  {
    id: 'dashboard-maestro',
    name: 'Dashboard Maestro',
    description: 'Acceso al dashboard de maestro',
    module: 'dashboard',
    action: 'read',
    resource: 'teacher_dashboard',
  },
  {
    id: 'dashboard-admin',
    name: 'Dashboard Admin',
    description: 'Acceso al dashboard administrativo',
    module: 'dashboard',
    action: 'read',
    resource: 'admin_dashboard',
  },

  // Permisos de Sistema
  {
    id: 'gestion-rbac',
    name: 'Gestión RBAC',
    description: 'Puede gestionar roles y permisos',
    module: 'system',
    action: 'admin',
    resource: 'rbac',
  },
  {
    id: 'configuracion-sistema',
    name: 'Configuración Sistema',
    description: 'Puede configurar el sistema',
    module: 'system',
    action: 'admin',
    resource: 'configuration',
  },
];

// Configuración por defecto de navegación
const defaultNavigation = [
  // Navegación para Maestros
  {
    id: 'dashboard-maestro',
    name: 'Dashboard',
    path: '/dashboard',
    icon: '🏠',
    roles: ['Maestro', 'Maestro Avanzado'],
    isActive: true,
    order: 1,
  },
  {
    id: 'teacher-dashboard-maestro',
    name: 'Dashboard Maestro',
    path: '/teacher',
    icon: '🏠',
    roles: ['Maestro', 'Maestro Avanzado'],
    isActive: true,
    order: 1,
  },
  {
    id: 'clases-maestro',
    name: 'Mis Clases',
    path: '/clases',
    icon: '📚',
    roles: ['Maestro', 'Maestro Avanzado'],
    isActive: true,
    order: 2,
  },
  {
    id: 'asistencia-maestro',
    name: 'Asistencia',
    path: '/asistencia',
    icon: '✅',
    roles: ['Maestro', 'Maestro Avanzado'],
    isActive: true,
    order: 3,
  },
  {
    id: 'teacher-attendance-maestro',
    name: 'Asistencia Maestro',
    path: '/teacher/attendance',
    icon: '✅',
    roles: ['Maestro', 'Maestro Avanzado'],
    isActive: true,
    order: 3,
  },
  {
    id: 'estudiantes-maestro',
    name: 'Estudiantes',
    path: '/students',
    icon: '🎓',
    roles: ['Maestro', 'Maestro Avanzado'], // Todos los maestros pueden acceder
    isActive: true,
    order: 4,
  },

  // Navegación para Directores
  {
    id: 'dashboard-director',
    name: 'Dashboard',
    path: '/dashboard',
    icon: '🏠',
    roles: ['Director'],
    isActive: true,
    order: 1,
  },
  {
    id: 'estudiantes-director',
    name: 'Estudiantes',
    path: '/students',
    icon: '🎓',
    roles: ['Director'],
    isActive: true,
    order: 2,
  },
  {
    id: 'maestros-director',
    name: 'Maestros',
    path: '/maestros',
    icon: '👨‍🏫',
    roles: ['Director'],
    isActive: true,
    order: 3,
  },
  {
    id: 'clases-director',
    name: 'Clases',
    path: '/clases',
    icon: '📚',
    roles: ['Director'],
    isActive: true,
    order: 4,
  },
  {
    id: 'reportes-director',
    name: 'Reportes',
    path: '/reportes',
    icon: '📊',
    roles: ['Director'],
    isActive: true,
    order: 5,
  },

  // Navegación para Administradores
  {
    id: 'dashboard-admin',
    name: 'Dashboard',
    path: '/dashboard',
    icon: '🏠',
    roles: ['Admin'],
    isActive: true,
    order: 1,
  },
  {
    id: 'usuarios-admin',
    name: 'Usuarios',
    path: '/usuarios',
    icon: '👥',
    roles: ['Admin'],
    isActive: true,
    order: 2,
  },
  {
    id: 'sistema-admin',
    name: 'Sistema',
    path: '/sistema',
    icon: '⚙️',
    roles: ['Admin'],
    isActive: true,
    order: 3,
  },
  {
    id: 'configuracion-admin',
    name: 'Configuración',
    path: '/configuracion',
    icon: '🛠️',
    roles: ['Admin'],
    isActive: true,
    order: 4,
  },

  // Navegación para Superusuario (acceso completo)
  {
    id: 'superusuario-dashboard',
    name: 'Super Dashboard',
    path: '/superusuario/dashboard',
    icon: '🚀',
    roles: ['Superusuario'],
    isActive: true,
    order: 1,
  },
  {
    id: 'rbac-management',
    name: 'Gestión RBAC',
    path: '/superusuario/rbac',
    icon: '🔐',
    roles: ['Superusuario'],
    isActive: true,
    order: 2,
  },
  {
    id: 'navigation-config',
    name: 'Config. Navegación',
    path: '/superusuario/navigation',
    icon: '🧭',
    roles: ['Superusuario'],
    isActive: true,
    order: 3,
  },
];

// Función para inicializar las colecciones RBAC
export async function initializeRBACCollections() {
  console.log('🚀 Iniciando configuración de colecciones RBAC en Firestore...');

  try {
    // 1. Inicializar colección de roles
    const rolesRef = doc(db, 'RBAC_CONFIG', 'roles');
    const rolesSnapshot = await getDoc(rolesRef);

    if (!rolesSnapshot.exists()) {
      console.log('📝 Creando colección de roles...');
      await setDoc(rolesRef, {
        roles: defaultRoles,
        lastUpdated: new Date(),
        updatedBy: 'system-initialization',
      });
      console.log('✅ Colección de roles creada');
    } else {
      console.log('ℹ️ Colección de roles ya existe');
    }

    // 2. Inicializar colección de permisos
    const permissionsRef = doc(db, 'RBAC_CONFIG', 'permissions');
    const permissionsSnapshot = await getDoc(permissionsRef);

    if (!permissionsSnapshot.exists()) {
      console.log('📝 Creando colección de permisos...');
      await setDoc(permissionsRef, {
        permissions: defaultPermissions,
        lastUpdated: new Date(),
        updatedBy: 'system-initialization',
      });
      console.log('✅ Colección de permisos creada');
    } else {
      console.log('ℹ️ Colección de permisos ya existe');
    }

    // 3. Inicializar colección de navegación
    const navigationRef = doc(db, 'NAVIGATION_CONFIG', 'config');
    const navigationSnapshot = await getDoc(navigationRef);

    if (!navigationSnapshot.exists()) {
      console.log('📝 Creando colección de navegación...');
      await setDoc(navigationRef, {
        navigationItems: defaultNavigation,
        lastUpdated: new Date(),
        updatedBy: 'system-initialization',
      });
      console.log('✅ Colección de navegación creada');
    } else {
      console.log('ℹ️ Colección de navegación ya existe');
    }

    console.log('🎉 Inicialización de colecciones RBAC completada!');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando colecciones RBAC:', error);
    throw error;
  }
}

// Función para verificar el estado de las colecciones
export async function checkRBACCollections() {
  console.log('🔍 Verificando estado de las colecciones RBAC...');

  try {
    // Verificar roles
    const rolesRef = doc(db, 'RBAC_CONFIG', 'roles');
    const rolesSnapshot = await getDoc(rolesRef);
    const rolesData = rolesSnapshot.exists() ? rolesSnapshot.data() : null;

    // Verificar permisos
    const permissionsRef = doc(db, 'RBAC_CONFIG', 'permissions');
    const permissionsSnapshot = await getDoc(permissionsRef);
    const permissionsData = permissionsSnapshot.exists() ? permissionsSnapshot.data() : null;

    // Verificar navegación
    const navigationRef = doc(db, 'NAVIGATION_CONFIG', 'config');
    const navigationSnapshot = await getDoc(navigationRef);
    const navigationData = navigationSnapshot.exists() ? navigationSnapshot.data() : null;

    const status = {
      roles: {
        exists: rolesSnapshot.exists(),
        count: rolesData?.roles?.length || 0,
        lastUpdated: rolesData?.lastUpdated?.toDate?.() || null,
      },
      permissions: {
        exists: permissionsSnapshot.exists(),
        count: permissionsData?.permissions?.length || 0,
        lastUpdated: permissionsData?.lastUpdated?.toDate?.() || null,
      },
      navigation: {
        exists: navigationSnapshot.exists(),
        count: navigationData?.navigationItems?.length || 0,
        lastUpdated: navigationData?.lastUpdated?.toDate?.() || null,
      },
    };

    console.log('📊 Estado de las colecciones RBAC:', status);
    return status;
  } catch (error) {
    console.error('❌ Error verificando colecciones RBAC:', error);
    throw error;
  }
}

// Función para forzar la reinicialización (sobrescribir)
export async function forceReinitializeRBACCollections() {
  console.log('⚠️ Forzando reinicialización de colecciones RBAC...');

  try {
    // Sobrescribir roles
    const rolesRef = doc(db, 'RBAC_CONFIG', 'roles');
    await setDoc(rolesRef, {
      roles: defaultRoles,
      lastUpdated: new Date(),
      updatedBy: 'system-force-reinitialization',
    });

    // Sobrescribir permisos
    const permissionsRef = doc(db, 'RBAC_CONFIG', 'permissions');
    await setDoc(permissionsRef, {
      permissions: defaultPermissions,
      lastUpdated: new Date(),
      updatedBy: 'system-force-reinitialization',
    });

    // Sobrescribir navegación
    const navigationRef = doc(db, 'NAVIGATION_CONFIG', 'config');
    await setDoc(navigationRef, {
      navigationItems: defaultNavigation,
      lastUpdated: new Date(),
      updatedBy: 'system-force-reinitialization',
    });

    console.log('🎉 Reinicialización forzada completada!');
    return true;
  } catch (error) {
    console.error('❌ Error en reinicialización forzada:', error);
    throw error;
  }
}

// Hacer las funciones globales para uso en consola
if (typeof window !== 'undefined') {
  window.initializeRBACCollections = initializeRBACCollections;
  window.checkRBACCollections = checkRBACCollections;
  window.forceReinitializeRBACCollections = forceReinitializeRBACCollections;
}
