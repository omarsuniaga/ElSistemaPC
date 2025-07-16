// src/scripts/setupRBACClient.ts
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  writeBatch,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '@/firebase';

// Datos base para RBAC
const baseRoles = [
  {
    id: 'superusuario',
    name: 'Superusuario',
    description: 'Acceso completo al sistema y gestión RBAC',
    permissions: [
      'system_read',
      'system_admin',
      'users_read',
      'users_write',
      'students_read',
      'students_write',
      'attendance_read',
      'attendance_write',
      'classes_read',
      'classes_write',
      'schedules_read',
      'schedules_write',
      'teachers_read',
      'teachers_write',
      'reports_read',
      'rbac_read',
      'rbac_write',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'director',
    name: 'Director',
    description: 'Administrador general con acceso a módulos académicos',
    permissions: [
      'system_read',
      'users_read',
      'students_read',
      'students_write',
      'attendance_read',
      'attendance_write',
      'classes_read',
      'classes_write',
      'schedules_read',
      'schedules_write',
      'teachers_read',
      'teachers_write',
      'reports_read',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'maestro',
    name: 'Maestro',
    description: 'Profesor con acceso a funciones educativas',
    permissions: [
      'system_read',
      'students_read',
      'attendance_read',
      'attendance_write',
      'classes_read',
      'schedules_read',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administrador con permisos limitados',
    permissions: ['system_read', 'students_read', 'attendance_read', 'reports_read'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const basePermissions = [
  // Permisos del sistema
  {
    id: 'system_read',
    name: 'Leer Sistema',
    description: 'Acceso de lectura al sistema',
    module: 'system',
    action: 'read',
    resource: 'system',
  },
  {
    id: 'system_admin',
    name: 'Administrar Sistema',
    description: 'Administración completa del sistema',
    module: 'system',
    action: 'admin',
    resource: 'system',
  },

  // Permisos de usuarios
  {
    id: 'users_read',
    name: 'Ver Usuarios',
    description: 'Ver lista de usuarios',
    module: 'users',
    action: 'read',
    resource: 'users',
  },
  {
    id: 'users_write',
    name: 'Gestionar Usuarios',
    description: 'Crear y editar usuarios',
    module: 'users',
    action: 'write',
    resource: 'users',
  },

  // Permisos de estudiantes
  {
    id: 'students_read',
    name: 'Ver Estudiantes',
    description: 'Ver lista de estudiantes',
    module: 'students',
    action: 'read',
    resource: 'students',
  },
  {
    id: 'students_write',
    name: 'Gestionar Estudiantes',
    description: 'Crear y editar estudiantes',
    module: 'students',
    action: 'write',
    resource: 'students',
  },

  // Permisos de asistencia
  {
    id: 'attendance_read',
    name: 'Ver Asistencia',
    description: 'Ver registros de asistencia',
    module: 'attendance',
    action: 'read',
    resource: 'attendance',
  },
  {
    id: 'attendance_write',
    name: 'Gestionar Asistencia',
    description: 'Tomar y editar asistencia',
    module: 'attendance',
    action: 'write',
    resource: 'attendance',
  },

  // Permisos de clases
  {
    id: 'classes_read',
    name: 'Ver Clases',
    description: 'Ver información de clases',
    module: 'classes',
    action: 'read',
    resource: 'classes',
  },
  {
    id: 'classes_write',
    name: 'Gestionar Clases',
    description: 'Crear y editar clases',
    module: 'classes',
    action: 'write',
    resource: 'classes',
  },

  // Permisos de horarios
  {
    id: 'schedules_read',
    name: 'Ver Horarios',
    description: 'Ver horarios de clases',
    module: 'schedules',
    action: 'read',
    resource: 'schedules',
  },
  {
    id: 'schedules_write',
    name: 'Gestionar Horarios',
    description: 'Crear y editar horarios',
    module: 'schedules',
    action: 'write',
    resource: 'schedules',
  },

  // Permisos de profesores
  {
    id: 'teachers_read',
    name: 'Ver Profesores',
    description: 'Ver lista de profesores',
    module: 'teachers',
    action: 'read',
    resource: 'teachers',
  },
  {
    id: 'teachers_write',
    name: 'Gestionar Profesores',
    description: 'Crear y editar profesores',
    module: 'teachers',
    action: 'write',
    resource: 'teachers',
  },

  // Permisos de reportes
  {
    id: 'reports_read',
    name: 'Ver Reportes',
    description: 'Ver reportes del sistema',
    module: 'reports',
    action: 'read',
    resource: 'reports',
  },

  // Permisos RBAC
  {
    id: 'rbac_read',
    name: 'Ver RBAC',
    description: 'Ver configuración de roles y permisos',
    module: 'rbac',
    action: 'read',
    resource: 'rbac',
  },
  {
    id: 'rbac_write',
    name: 'Gestionar RBAC',
    description: 'Administrar roles, permisos y asignaciones',
    module: 'rbac',
    action: 'write',
    resource: 'rbac',
  },
];

const moduleAccess = [
  {
    moduleId: 'dashboard',
    moduleName: 'Dashboard',
    isEnabled: true,
    allowedRoles: ['superusuario', 'director', 'admin'],
    components: [],
    routes: [],
  },
  {
    moduleId: 'students',
    moduleName: 'Estudiantes',
    isEnabled: true,
    allowedRoles: ['superusuario', 'director', 'maestro'],
    components: [],
    routes: [],
  },
  {
    moduleId: 'attendance',
    moduleName: 'Asistencia',
    isEnabled: true,
    allowedRoles: ['superusuario', 'director', 'maestro'],
    components: [],
    routes: [],
  },
  {
    moduleId: 'classes',
    moduleName: 'Clases',
    isEnabled: true,
    allowedRoles: ['superusuario', 'director', 'maestro'],
    components: [],
    routes: [],
  },
  {
    moduleId: 'teachers',
    moduleName: 'Profesores',
    isEnabled: true,
    allowedRoles: ['superusuario', 'director'],
    components: [],
    routes: [],
  },
  {
    moduleId: 'superusuario',
    moduleName: 'Superusuario',
    isEnabled: true,
    allowedRoles: ['superusuario'],
    components: [],
    routes: [],
  },
];

async function checkAndCreateCollection(collectionName: string, data: any[], idField = 'id') {
  console.log(`📋 Verificando colección: ${collectionName}`);

  try {
    // Verificar si la colección existe y tiene documentos
    const q = query(collection(db, collectionName), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`➕ Creando documentos en ${collectionName}...`);

      const batch = writeBatch(db);
      data.forEach((item) => {
        const docRef = doc(db, collectionName, item[idField]);
        batch.set(docRef, item);
      });

      await batch.commit();
      console.log(`✅ ${data.length} documentos creados en ${collectionName}`);
    } else {
      console.log(`✅ La colección ${collectionName} ya existe con datos`);
    }
  } catch (error) {
    console.error(`❌ Error al verificar/crear ${collectionName}:`, error);
    throw error;
  }
}

async function migrateUsersToRBAC() {
  console.log('👥 Migrando usuarios a RBAC...');

  try {
    // Obtener todos los usuarios de la colección USERS
    const usersSnapshot = await getDocs(collection(db, 'USERS'));

    if (usersSnapshot.empty) {
      console.log('⚠️ No se encontraron usuarios en la colección USERS');
      return;
    }

    const userRoleAssignments: any[] = [];
    const batch = writeBatch(db);

    usersSnapshot.forEach((docSnapshot) => {
      const userData = docSnapshot.data();
      const userId = docSnapshot.id;

      // Mapear roles antiguos a nuevos IDs de roles
      let roleId = 'maestro'; // default
      if (userData.role === 'Superusuario') roleId = 'superusuario';
      else if (userData.role === 'Director') roleId = 'director';
      else if (userData.role === 'Admin') roleId = 'admin';
      else if (userData.role === 'Maestro') roleId = 'maestro';

      const assignment = {
        userId,
        roleId,
        assignedAt: new Date(),
        assignedBy: 'system',
        isActive: true,
      };

      userRoleAssignments.push(assignment);

      // Crear documento en rbac_user_roles
      const assignmentRef = doc(db, 'rbac_user_roles', `${userId}_${roleId}`);
      batch.set(assignmentRef, assignment);
    });

    await batch.commit();
    console.log(`✅ ${userRoleAssignments.length} asignaciones de roles creadas`);
  } catch (error) {
    console.error('❌ Error migrando usuarios:', error);
    throw error;
  }
}

export async function setupRBACSystem() {
  try {
    console.log('🚀 Iniciando configuración del sistema RBAC...');

    // 1. Crear roles base
    await checkAndCreateCollection('rbac_roles', baseRoles);

    // 2. Crear permisos base
    await checkAndCreateCollection('rbac_permissions', basePermissions);

    // 3. Crear configuración de módulos
    await checkAndCreateCollection('rbac_module_access', moduleAccess, 'moduleId');

    // 4. Migrar usuarios existentes
    await migrateUsersToRBAC();

    console.log('🎉 Sistema RBAC configurado correctamente!');
    console.log('');
    console.log('📊 Resumen:');
    console.log(`   - ${baseRoles.length} roles creados`);
    console.log(`   - ${basePermissions.length} permisos creados`);
    console.log(`   - ${moduleAccess.length} módulos configurados`);
    console.log('   - Usuarios migrados a RBAC');
    console.log('');
    console.log('🔗 Puedes acceder a la gestión RBAC en:');
    console.log('   /superusuario/rbac');

    return {
      success: true,
      message: 'Sistema RBAC configurado correctamente',
      stats: {
        roles: baseRoles.length,
        permissions: basePermissions.length,
        modules: moduleAccess.length,
      },
    };
  } catch (error) {
    console.error('💥 Error configurando RBAC:', error);
    return {
      success: false,
      message: 'Error configurando RBAC: ' + (error as Error).message,
      error,
    };
  }
}

export async function checkRBACStatus() {
  try {
    console.log('🔍 Verificando estado del sistema RBAC...');

    const collections = ['rbac_roles', 'rbac_permissions', 'rbac_module_access', 'rbac_user_roles'];
    const status: any = {};

    for (const collectionName of collections) {
      const q = query(collection(db, collectionName), limit(1));
      const snapshot = await getDocs(q);
      status[collectionName] = {
        exists: !snapshot.empty,
        docCount: snapshot.size,
      };
    }

    console.log('📊 Estado RBAC:', status);
    return status;
  } catch (error) {
    console.error('❌ Error verificando estado RBAC:', error);
    return null;
  }
}
