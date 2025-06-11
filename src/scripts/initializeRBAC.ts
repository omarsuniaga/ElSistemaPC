// src/scripts/initializeRBAC.ts
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  getDoc,
  query,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/firebase';

// Interfaces
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  resource: string;
}

interface ModuleAccess {
  moduleId: string;
  moduleName: string;
  isEnabled: boolean;
  allowedRoles: string[];
  components: any[];
  routes: {
    routePath: string;
    routeName: string;
    isAccessible: boolean;
    allowedRoles: string[];
    permissions: string[];
  }[];
}

interface UserRoleAssignment {
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
  isActive: boolean;
}

export class RBACInitializer {
  
  async initializeRBACSystem(): Promise<void> {
    console.log('🔄 Inicializando sistema RBAC...');
    
    try {
      // 1. Crear roles base
      await this.createBaseRoles();
      
      // 2. Crear permisos base
      await this.createBasePermissions();
      
      // 3. Crear configuración de módulos
      await this.createModuleAccess();
      
      // 4. Migrar usuarios existentes
      await this.migrateExistingUsers();
      
      console.log('✅ Sistema RBAC inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando RBAC:', error);
      throw error;
    }
  }

  private async createBaseRoles(): Promise<void> {
    console.log('📝 Creando roles base...');
    
    const roles: Omit<Role, 'id'>[] = [
      {
        name: 'Superusuario',
        description: 'Acceso completo al sistema y gestión RBAC',
        permissions: [], // Se asignarán después
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Director',
        description: 'Administrador general con acceso a módulos académicos',
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Admin',
        description: 'Administrador con permisos limitados',
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },      {
        name: 'Maestro',
        description: 'Profesor con acceso a módulos de enseñanza',
        permissions: [
          'teacher_dashboard_view',
          'classes_teacher_view',
          'attendance_teacher_view',
          'attendance_calendar',
          'schedule_teacher_view',
          'students_view_all',
          'students_view_detail',
          'profile_view',
          'profile_edit'
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const batch = writeBatch(db);
    
    for (const role of roles) {
      const roleRef = doc(collection(db, 'rbac_roles'));
      const roleWithId = { ...role, id: roleRef.id };
      batch.set(roleRef, roleWithId);
    }
    
    await batch.commit();
    console.log('✅ Roles base creados');
  }

  private async createBasePermissions(): Promise<void> {
    console.log('🔑 Creando permisos base...');
    
    const permissions: Omit<Permission, 'id'>[] = [
      // Permisos de RBAC
      { name: 'rbac_manage', description: 'Gestionar sistema RBAC', module: 'rbac', action: 'manage', resource: 'rbac' },
      { name: 'rbac_view', description: 'Ver configuración RBAC', module: 'rbac', action: 'view', resource: 'rbac' },
      
      // Permisos de Dashboard
      { name: 'dashboard_view', description: 'Ver dashboard', module: 'dashboard', action: 'view', resource: 'dashboard' },
      { name: 'dashboard_admin', description: 'Dashboard administrativo', module: 'dashboard', action: 'admin', resource: 'dashboard' },
      
      // Permisos de Maestros
      { name: 'teachers_view_all', description: 'Ver todos los maestros', module: 'teachers', action: 'view_all', resource: 'teachers' },
      { name: 'teachers_view_detail', description: 'Ver detalle de maestro', module: 'teachers', action: 'view_detail', resource: 'teachers' },
      { name: 'teachers_edit', description: 'Editar maestros', module: 'teachers', action: 'edit', resource: 'teachers' },
      { name: 'teachers_create', description: 'Crear maestros', module: 'teachers', action: 'create', resource: 'teachers' },
      { name: 'teachers_delete', description: 'Eliminar maestros', module: 'teachers', action: 'delete', resource: 'teachers' },
      
      // Permisos de Estudiantes
      { name: 'students_view_all', description: 'Ver todos los estudiantes', module: 'students', action: 'view_all', resource: 'students' },
      { name: 'students_view_detail', description: 'Ver detalle de estudiante', module: 'students', action: 'view_detail', resource: 'students' },
      { name: 'students_edit', description: 'Editar estudiantes', module: 'students', action: 'edit', resource: 'students' },
      { name: 'students_create', description: 'Crear estudiantes', module: 'students', action: 'create', resource: 'students' },
      { name: 'students_delete', description: 'Eliminar estudiantes', module: 'students', action: 'delete', resource: 'students' },
      
      // Permisos de Clases
      { name: 'classes_view_all', description: 'Ver todas las clases', module: 'classes', action: 'view_all', resource: 'classes' },
      { name: 'classes_view_detail', description: 'Ver detalle de clase', module: 'classes', action: 'view_detail', resource: 'classes' },
      { name: 'classes_edit', description: 'Editar clases', module: 'classes', action: 'edit', resource: 'classes' },
      { name: 'classes_create', description: 'Crear clases', module: 'classes', action: 'create', resource: 'classes' },
      { name: 'classes_teacher_view', description: 'Ver clases como maestro', module: 'classes', action: 'teacher_view', resource: 'classes' },
      
      // Permisos de Asistencia
      { name: 'attendance_view', description: 'Ver asistencias', module: 'attendance', action: 'view', resource: 'attendance' },
      { name: 'attendance_edit', description: 'Editar asistencias', module: 'attendance', action: 'edit', resource: 'attendance' },
      { name: 'attendance_teacher_view', description: 'Ver asistencias como maestro', module: 'attendance', action: 'teacher_view', resource: 'attendance' },
      { name: 'attendance_calendar', description: 'Ver calendario de asistencias', module: 'attendance', action: 'calendar', resource: 'attendance' },
      { name: 'attendance_report', description: 'Generar reportes de asistencia', module: 'attendance', action: 'report', resource: 'attendance' },
      
      // Permisos de Horarios
      { name: 'schedule_view', description: 'Ver horarios', module: 'schedule', action: 'view', resource: 'schedule' },
      { name: 'schedule_edit', description: 'Editar horarios', module: 'schedule', action: 'edit', resource: 'schedule' },
      { name: 'schedule_teacher_view', description: 'Ver horarios como maestro', module: 'schedule', action: 'teacher_view', resource: 'schedule' },
      
      // Permisos de Instrumentos
      { name: 'instruments_view', description: 'Ver instrumentos', module: 'instruments', action: 'view', resource: 'instruments' },
      { name: 'instruments_edit', description: 'Editar instrumentos', module: 'instruments', action: 'edit', resource: 'instruments' },
      { name: 'instruments_create', description: 'Crear instrumentos', module: 'instruments', action: 'create', resource: 'instruments' },
      
      // Permisos de Perfil
      { name: 'profile_view', description: 'Ver perfil propio', module: 'profile', action: 'view', resource: 'profile' },
      { name: 'profile_edit', description: 'Editar perfil propio', module: 'profile', action: 'edit', resource: 'profile' },
      
      // Permisos de Configuración
      { name: 'settings_view', description: 'Ver configuración', module: 'settings', action: 'view', resource: 'settings' },
      { name: 'settings_edit', description: 'Editar configuración', module: 'settings', action: 'edit', resource: 'settings' },
      
      // Permisos de Reportes
      { name: 'reports_view', description: 'Ver reportes', module: 'reports', action: 'view', resource: 'reports' },
      { name: 'reports_admin_view', description: 'Ver reportes administrativos', module: 'reports', action: 'admin_view', resource: 'reports' },
      
      // Permisos de Analytics
      { name: 'analytics_view', description: 'Ver analytics', module: 'analytics', action: 'view', resource: 'analytics' },
        // Permisos de Monitoreo
      { name: 'monitoring_view', description: 'Ver monitoreo diario', module: 'monitoring', action: 'view', resource: 'monitoring' },
      
      // Permisos específicos de Dashboard de maestros
      { name: 'teacher_dashboard_view', description: 'Ver dashboard de maestro', module: 'teacher', action: 'dashboard_view', resource: 'teacher' }
    ];

    const batch = writeBatch(db);
    
    for (const permission of permissions) {
      const permRef = doc(collection(db, 'rbac_permissions'));
      const permWithId = { ...permission, id: permRef.id };
      batch.set(permRef, permWithId);
    }
    
    await batch.commit();
    console.log('✅ Permisos base creados');
  }
  private async createModuleAccess(): Promise<void> {
    console.log('📁 Creando configuración de módulos...');
    
    const modules: Omit<ModuleAccess, 'moduleId'>[] = [      {
        moduleName: 'RBAC Management',
        isEnabled: true,
        allowedRoles: ['Superusuario'],
        components: [],
        routes: [
          {
            routePath: '/superusuario/rbac',
            routeName: 'RBACManagement',
            isAccessible: true,
            allowedRoles: ['Superusuario'],
            permissions: ['rbac_manage']
          }
        ]
      },
      {
        moduleName: 'Dashboard',
        isEnabled: true,
        allowedRoles: ['Director', 'Admin', 'Superusuario'],
        components: [],
        routes: [
          {
            routePath: '/dashboard',
            routeName: 'AdminHomeView',
            isAccessible: true,
            allowedRoles: ['Director', 'Admin', 'Superusuario'],
            permissions: ['dashboard_view']
          }
        ]
      },
      {
        moduleName: 'Teachers',
        isEnabled: true,
        allowedRoles: ['Director', 'Admin', 'Superusuario'],
        components: [],
        routes: [
          {
            routePath: '/teachers',
            routeName: 'Teachers',
            isAccessible: true,
            allowedRoles: ['Director', 'Admin', 'Superusuario'],
            permissions: ['teachers_view_all']
          }
        ]
      },
      {
        moduleName: 'Students',
        isEnabled: true,
        allowedRoles: ['Director', 'Admin', 'Maestro', 'Superusuario'],
        components: [],
        routes: [
          {
            routePath: '/students',
            routeName: 'Students',
            isAccessible: true,
            allowedRoles: ['Director', 'Admin', 'Maestro', 'Superusuario'],
            permissions: ['students_view_all']
          }
        ]
      },
      {
        moduleName: 'Classes',
        isEnabled: true,
        allowedRoles: ['Director', 'Admin', 'Maestro', 'Superusuario'],
        components: [],
        routes: [
          {
            routePath: '/classes',
            routeName: 'Classes',
            isAccessible: true,
            allowedRoles: ['Director', 'Admin', 'Maestro', 'Superusuario'],
            permissions: ['classes_view_all']
          }
        ]
      },
      {
        moduleName: 'Attendance',
        isEnabled: true,
        allowedRoles: ['Director', 'Admin', 'Maestro', 'Superusuario'],
        components: [],
        routes: [
          {
            routePath: '/attendance',
            routeName: 'Attendance',
            isAccessible: true,
            allowedRoles: ['Director', 'Admin', 'Maestro', 'Superusuario'],
            permissions: ['attendance_view']
          }
        ]
      },      {
        moduleName: 'Teacher',
        isEnabled: true,
        allowedRoles: ['Maestro'],
        components: [],
        routes: [
          {
            routePath: '/teacher',
            routeName: 'TeacherDashboard',
            isAccessible: true,
            allowedRoles: ['Maestro'],
            permissions: ['teacher_dashboard_view']
          }
        ]
      }
    ];

    const batch = writeBatch(db);
    
    for (const module of modules) {
      const moduleRef = doc(collection(db, 'rbac_module_access'));
      const moduleWithId = { ...module, moduleId: moduleRef.id };
      batch.set(moduleRef, moduleWithId);
    }
    
    await batch.commit();
    console.log('✅ Configuración de módulos creada');
  }

  private async migrateExistingUsers(): Promise<void> {
    console.log('👥 Migrando usuarios existentes...');
    
    try {
      // Obtener todos los usuarios de la colección USERS
      const usersQuery = query(collection(db, 'USERS'));
      const usersSnapshot = await getDocs(usersQuery);
      
      // Obtener todos los roles existentes
      const rolesQuery = query(collection(db, 'rbac_roles'));
      const rolesSnapshot = await getDocs(rolesQuery);
      
      const roleMap = new Map<string, string>();
      rolesSnapshot.forEach(doc => {
        const role = doc.data();
        roleMap.set(role.name, role.id);
      });
      
      const batch = writeBatch(db);
      let migratedCount = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userRole = userData.role;
        
        if (userRole && roleMap.has(userRole)) {
          const roleId = roleMap.get(userRole)!;
          
          // Crear asignación de rol para el usuario
          const assignmentRef = doc(collection(db, 'rbac_user_roles'));
          const assignment: UserRoleAssignment = {
            userId: userData.uid,
            roleId: roleId,
            assignedAt: new Date(),
            assignedBy: 'system_migration',
            isActive: userData.status === 'aprobado'
          };
          
          batch.set(assignmentRef, assignment);
          migratedCount++;
        }
      }
      
      await batch.commit();
      console.log(`✅ ${migratedCount} usuarios migrados al sistema RBAC`);
      
    } catch (error) {
      console.error('❌ Error migrando usuarios:', error);
      throw error;
    }
  }

  // Método para verificar el estado del sistema RBAC
  async checkRBACStatus(): Promise<void> {
    console.log('🔍 Verificando estado del sistema RBAC...');
    
    const collections = [
      { name: 'rbac_roles', label: 'Roles' },
      { name: 'rbac_permissions', label: 'Permisos' },
      { name: 'rbac_module_access', label: 'Acceso a módulos' },
      { name: 'rbac_user_roles', label: 'Asignaciones de usuario' }
    ];
    
    for (const col of collections) {
      const snapshot = await getDocs(collection(db, col.name));
      console.log(`📊 ${col.label}: ${snapshot.size} documentos`);
    }
    
    // Verificar usuarios en USERS
    const usersSnapshot = await getDocs(collection(db, 'USERS'));
    console.log(`👥 Usuarios en USERS: ${usersSnapshot.size} documentos`);
  }
}

// Función de conveniencia para inicializar desde el navegador
export const initializeRBAC = async () => {
  const initializer = new RBACInitializer();
  await initializer.initializeRBACSystem();
};

export const checkRBACStatus = async () => {
  const initializer = new RBACInitializer();
  await initializer.checkRBACStatus();
};
