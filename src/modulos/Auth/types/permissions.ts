// src/modulos/Auth/types/permissions.ts// Sistema de permisos granular basado en la matriz de permisos documentada

export enum UserRole {
  MAESTRO = 'Maestro',
  DIRECTOR = 'Director',
  ADMINISTRADOR = 'Administrador',
  SUPERUSUARIO = 'Superusuario',
  COLABORADOR = 'Colaborador',
  MONITOR = 'Monitor',
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  ASSIGN = 'assign',
  APPROVE = 'approve',
  SUPERVISE = 'supervise',
  EXPORT = 'export',
  GENERATE_REPORTS = 'generate_reports',
}

export enum ResourceType {
  // ========== ASISTENCIA Y OBSERVACIONES ==========
  DAILY_ATTENDANCE = 'daily_attendance',
  OBSERVATIONS = 'observations',

  // ========== MONTAJE Y OBRAS ==========
  MONTAJE_ASSIGNED = 'montaje_assigned',
  COMPASES_STATUS = 'compases_status',
  OBRAS_ASSIGNED = 'obras_assigned',
  REPERTORIOS = 'repertorios',

  // ========== EVALUACIONES ==========
  STUDENT_EVALUATIONS = 'student_evaluations',

  // ========== GESTIÓN DE USUARIOS ==========
  OWN_PROFILE = 'own_profile',
  CLASS_STUDENTS = 'class_students',
  ALL_STUDENTS = 'all_students',
  ALL_TEACHERS = 'all_teachers',
  TIME_AVAILABILITY = 'time_availability',

  // ========== SUPERVISIÓN (Solo Director) ==========
  SUPERVISE_MAESTRO_ATTENDANCE = 'supervise_maestro_attendance',
  SUPERVISE_MAESTRO_OBSERVATIONS = 'supervise_maestro_observations',
  SUPERVISE_MONTAJE = 'supervise_montaje',
  SUPERVISE_STUDENT_EVALUATIONS = 'supervise_student_evaluations',

  // ========== REPORTES (Solo Director) ==========
  ATTENDANCE_REPORTS = 'attendance_reports',
  GENERAL_REPORTS = 'general_reports',
  EXPORT_FUNCTIONALITY = 'export_functionality',

  // ========== INFORMACIÓN CONFIDENCIAL (Solo Director) ==========
  CONFIDENTIAL_INFO = 'confidential_info',
  // ========== GESTIÓN ACADÉMICA (Solo Director) ==========
  MANAGE_CLASSES = 'manage_classes',
  ASSIGN_OBRAS = 'assign_obras',
  EMERGENCY_CLASSES = 'emergency_classes',
  TEMP_COLLABORATORS = 'temp_collaborators',

  // ========== SUPERUSUARIO ESPECÍFICOS ==========
  SYSTEM_CONFIGURATION = 'system_configuration',
  USER_ROLES_MANAGEMENT = 'user_roles_management',
  PERMISSION_MANAGEMENT = 'permission_management',
  AUDIT_LOGS = 'audit_logs',
  BACKUP_RESTORE = 'backup_restore',
  SYSTEM_MONITORING = 'system_monitoring',
  GLOBAL_SETTINGS = 'global_settings',
  INSTITUTIONAL_DATA = 'institutional_data',
  ADVANCED_REPORTS = 'advanced_reports',
  MODULE_CONFIGURATION = 'module_configuration',
  COMPONENT_ACCESS_CONTROL = 'component_access_control',
  VIEW_ACCESS_CONTROL = 'view_access_control',
}

export interface Permission {
  resource: ResourceType
  action: PermissionAction
  scope?: 'own' | 'class' | 'all'
  conditions?: Record<string, any>
}

// ========== MATRIZ DE PERMISOS POR ROL ==========
// Basada en la documentación oficial de permisos granulares

export const MAESTRO_PERMISSIONS: Permission[] = [
  // ========== ASISTENCIA DIARIA ==========
  { resource: ResourceType.DAILY_ATTENDANCE, action: PermissionAction.CREATE, scope: 'class' },
  { resource: ResourceType.DAILY_ATTENDANCE, action: PermissionAction.UPDATE, scope: 'class' },
  { resource: ResourceType.DAILY_ATTENDANCE, action: PermissionAction.READ, scope: 'class' },

  // ========== OBSERVACIONES DEL DÍA ==========
  { resource: ResourceType.OBSERVATIONS, action: PermissionAction.CREATE, scope: 'class' },
  { resource: ResourceType.OBSERVATIONS, action: PermissionAction.UPDATE, scope: 'class' },
  { resource: ResourceType.OBSERVATIONS, action: PermissionAction.READ, scope: 'class' },

  // ========== MONTAJE DE OBRAS ASIGNADAS ==========
  { resource: ResourceType.MONTAJE_ASSIGNED, action: PermissionAction.CREATE, scope: 'class' },
  { resource: ResourceType.MONTAJE_ASSIGNED, action: PermissionAction.UPDATE, scope: 'class' },
  { resource: ResourceType.MONTAJE_ASSIGNED, action: PermissionAction.READ, scope: 'class' },

  // ========== ESTADO DE COMPASES TRABAJADOS ==========
  { resource: ResourceType.COMPASES_STATUS, action: PermissionAction.CREATE, scope: 'class' },
  { resource: ResourceType.COMPASES_STATUS, action: PermissionAction.UPDATE, scope: 'class' },
  { resource: ResourceType.COMPASES_STATUS, action: PermissionAction.READ, scope: 'class' },

  // ========== PERFIL DE CUENTA ==========
  { resource: ResourceType.OWN_PROFILE, action: PermissionAction.CREATE, scope: 'own' },
  { resource: ResourceType.OWN_PROFILE, action: PermissionAction.UPDATE, scope: 'own' },
  { resource: ResourceType.OWN_PROFILE, action: PermissionAction.READ, scope: 'own' },

  // ========== DISPONIBILIDAD DE TIEMPO ==========
  { resource: ResourceType.TIME_AVAILABILITY, action: PermissionAction.CREATE, scope: 'own' },
  { resource: ResourceType.TIME_AVAILABILITY, action: PermissionAction.UPDATE, scope: 'own' },
  { resource: ResourceType.TIME_AVAILABILITY, action: PermissionAction.READ, scope: 'own' },

  // ========== ALUMNOS DE SU CLASE ==========
  { resource: ResourceType.CLASS_STUDENTS, action: PermissionAction.CREATE, scope: 'class' },
  { resource: ResourceType.CLASS_STUDENTS, action: PermissionAction.UPDATE, scope: 'class' },
  { resource: ResourceType.CLASS_STUDENTS, action: PermissionAction.READ, scope: 'class' },

  // ========== VALORACIÓN DE INDICADORES POR ALUMNO ==========
  { resource: ResourceType.STUDENT_EVALUATIONS, action: PermissionAction.CREATE, scope: 'class' },
  { resource: ResourceType.STUDENT_EVALUATIONS, action: PermissionAction.UPDATE, scope: 'class' },
  { resource: ResourceType.STUDENT_EVALUATIONS, action: PermissionAction.READ, scope: 'class' },

  // ========== VER OBRAS ASIGNADAS ==========
  { resource: ResourceType.OBRAS_ASSIGNED, action: PermissionAction.READ, scope: 'class' },
];

export const DIRECTOR_PERMISSIONS: Permission[] = [
  // ========== TODOS LOS PERMISOS DE MAESTRO (CON ALCANCE GLOBAL) ==========
  ...MAESTRO_PERMISSIONS.map((p) => ({
    ...p,
    scope: p.scope === 'class' ? ('all' as const) : p.scope,
  })),

  // ========== SUPERVISIÓN ==========
  {
    resource: ResourceType.SUPERVISE_MAESTRO_ATTENDANCE,
    action: PermissionAction.SUPERVISE,
    scope: 'all',
  },
  {
    resource: ResourceType.SUPERVISE_MAESTRO_OBSERVATIONS,
    action: PermissionAction.SUPERVISE,
    scope: 'all',
  },
  { resource: ResourceType.SUPERVISE_MONTAJE, action: PermissionAction.SUPERVISE, scope: 'all' },
  {
    resource: ResourceType.SUPERVISE_STUDENT_EVALUATIONS,
    action: PermissionAction.SUPERVISE,
    scope: 'all',
  },

  // ========== REPORTES ==========
  {
    resource: ResourceType.ATTENDANCE_REPORTS,
    action: PermissionAction.GENERATE_REPORTS,
    scope: 'all',
  },
  { resource: ResourceType.GENERAL_REPORTS, action: PermissionAction.GENERATE_REPORTS, scope: 'all' },
  { resource: ResourceType.EXPORT_FUNCTIONALITY, action: PermissionAction.EXPORT, scope: 'all' },

  // ========== INFORMACIÓN CONFIDENCIAL ==========
  { resource: ResourceType.CONFIDENTIAL_INFO, action: PermissionAction.READ, scope: 'all' },
  { resource: ResourceType.CONFIDENTIAL_INFO, action: PermissionAction.UPDATE, scope: 'all' },

  // ========== GESTIÓN ACADÉMICA ==========
  { resource: ResourceType.MANAGE_CLASSES, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.MANAGE_CLASSES, action: PermissionAction.UPDATE, scope: 'all' },
  { resource: ResourceType.MANAGE_CLASSES, action: PermissionAction.DELETE, scope: 'all' },

  { resource: ResourceType.ASSIGN_OBRAS, action: PermissionAction.ASSIGN, scope: 'all' },
  { resource: ResourceType.EMERGENCY_CLASSES, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.TEMP_COLLABORATORS, action: PermissionAction.CREATE, scope: 'all' },

  // ========== GESTIÓN DE USUARIOS ==========
  { resource: ResourceType.ALL_STUDENTS, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.ALL_STUDENTS, action: PermissionAction.UPDATE, scope: 'all' },
  { resource: ResourceType.ALL_STUDENTS, action: PermissionAction.DELETE, scope: 'all' },
  { resource: ResourceType.ALL_STUDENTS, action: PermissionAction.READ, scope: 'all' },

  { resource: ResourceType.ALL_TEACHERS, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.ALL_TEACHERS, action: PermissionAction.UPDATE, scope: 'all' },
  { resource: ResourceType.ALL_TEACHERS, action: PermissionAction.DELETE, scope: 'all' },
  { resource: ResourceType.ALL_TEACHERS, action: PermissionAction.READ, scope: 'all' },
];

// ========== PERMISOS ESPECÍFICOS DEL SUPERUSUARIO ==========
export const SUPERUSUARIO_PERMISSIONS: Permission[] = [
  // ========== HEREDA TODOS LOS PERMISOS DEL DIRECTOR ==========
  ...DIRECTOR_PERMISSIONS,

  // ========== GESTIÓN COMPLETA DEL SISTEMA ==========
  { resource: ResourceType.SYSTEM_CONFIGURATION, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.SYSTEM_CONFIGURATION, action: PermissionAction.READ, scope: 'all' },
  { resource: ResourceType.SYSTEM_CONFIGURATION, action: PermissionAction.UPDATE, scope: 'all' },
  { resource: ResourceType.SYSTEM_CONFIGURATION, action: PermissionAction.DELETE, scope: 'all' },

  // ========== GESTIÓN DE ROLES Y USUARIOS ==========
  { resource: ResourceType.USER_ROLES_MANAGEMENT, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.USER_ROLES_MANAGEMENT, action: PermissionAction.READ, scope: 'all' },
  { resource: ResourceType.USER_ROLES_MANAGEMENT, action: PermissionAction.UPDATE, scope: 'all' },
  { resource: ResourceType.USER_ROLES_MANAGEMENT, action: PermissionAction.DELETE, scope: 'all' },
  { resource: ResourceType.USER_ROLES_MANAGEMENT, action: PermissionAction.ASSIGN, scope: 'all' },

  // ========== GESTIÓN DE PERMISOS DINÁMICOS ==========
  { resource: ResourceType.PERMISSION_MANAGEMENT, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.PERMISSION_MANAGEMENT, action: PermissionAction.READ, scope: 'all' },
  { resource: ResourceType.PERMISSION_MANAGEMENT, action: PermissionAction.UPDATE, scope: 'all' },
  { resource: ResourceType.PERMISSION_MANAGEMENT, action: PermissionAction.DELETE, scope: 'all' },

  // ========== AUDITORÍA Y LOGS ==========
  { resource: ResourceType.AUDIT_LOGS, action: PermissionAction.READ, scope: 'all' },
  { resource: ResourceType.AUDIT_LOGS, action: PermissionAction.EXPORT, scope: 'all' },

  // ========== RESPALDO Y RESTAURACIÓN ==========
  { resource: ResourceType.BACKUP_RESTORE, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.BACKUP_RESTORE, action: PermissionAction.READ, scope: 'all' },

  // ========== MONITOREO DEL SISTEMA ==========
  { resource: ResourceType.SYSTEM_MONITORING, action: PermissionAction.READ, scope: 'all' },

  // ========== CONFIGURACIÓN GLOBAL ==========
  { resource: ResourceType.GLOBAL_SETTINGS, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.GLOBAL_SETTINGS, action: PermissionAction.READ, scope: 'all' },
  { resource: ResourceType.GLOBAL_SETTINGS, action: PermissionAction.UPDATE, scope: 'all' },

  // ========== DATOS INSTITUCIONALES ==========
  { resource: ResourceType.INSTITUTIONAL_DATA, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.INSTITUTIONAL_DATA, action: PermissionAction.READ, scope: 'all' },
  { resource: ResourceType.INSTITUTIONAL_DATA, action: PermissionAction.UPDATE, scope: 'all' },
  { resource: ResourceType.INSTITUTIONAL_DATA, action: PermissionAction.DELETE, scope: 'all' },

  // ========== REPORTES AVANZADOS ==========
  { resource: ResourceType.ADVANCED_REPORTS, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.ADVANCED_REPORTS, action: PermissionAction.READ, scope: 'all' },
  { resource: ResourceType.ADVANCED_REPORTS, action: PermissionAction.EXPORT, scope: 'all' },

  // ========== CONFIGURACIÓN DE MÓDULOS ==========
  { resource: ResourceType.MODULE_CONFIGURATION, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.MODULE_CONFIGURATION, action: PermissionAction.READ, scope: 'all' },
  { resource: ResourceType.MODULE_CONFIGURATION, action: PermissionAction.UPDATE, scope: 'all' },
  { resource: ResourceType.MODULE_CONFIGURATION, action: PermissionAction.DELETE, scope: 'all' },

  // ========== CONTROL DE ACCESO A COMPONENTES ==========
  { resource: ResourceType.COMPONENT_ACCESS_CONTROL, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.COMPONENT_ACCESS_CONTROL, action: PermissionAction.READ, scope: 'all' },
  { resource: ResourceType.COMPONENT_ACCESS_CONTROL, action: PermissionAction.UPDATE, scope: 'all' },
  { resource: ResourceType.COMPONENT_ACCESS_CONTROL, action: PermissionAction.DELETE, scope: 'all' },

  // ========== CONTROL DE ACCESO A VISTAS ==========
  { resource: ResourceType.VIEW_ACCESS_CONTROL, action: PermissionAction.CREATE, scope: 'all' },
  { resource: ResourceType.VIEW_ACCESS_CONTROL, action: PermissionAction.READ, scope: 'all' },
  { resource: ResourceType.VIEW_ACCESS_CONTROL, action: PermissionAction.UPDATE, scope: 'all' },
  { resource: ResourceType.VIEW_ACCESS_CONTROL, action: PermissionAction.DELETE, scope: 'all' },
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.MAESTRO]: MAESTRO_PERMISSIONS,
  [UserRole.DIRECTOR]: DIRECTOR_PERMISSIONS,
  [UserRole.ADMINISTRADOR]: [
    // Administrador hereda todos los permisos del Director
    ...DIRECTOR_PERMISSIONS,
    // Permisos adicionales específicos del administrador pueden agregarse aquí
  ],
  [UserRole.SUPERUSUARIO]: SUPERUSUARIO_PERMISSIONS,
  [UserRole.COLABORADOR]: [
    // Colaborador tiene permisos limitados, específicos de su función
    { resource: ResourceType.DAILY_ATTENDANCE, action: PermissionAction.READ, scope: 'class' },
    { resource: ResourceType.OBSERVATIONS, action: PermissionAction.READ, scope: 'class' },
    { resource: ResourceType.MONTAJE_ASSIGNED, action: PermissionAction.READ, scope: 'class' },
    { resource: ResourceType.COMPASES_STATUS, action: PermissionAction.READ, scope: 'class' },
    { resource: ResourceType.STUDENT_EVALUATIONS, action: PermissionAction.READ, scope: 'class' },
  ],
  [UserRole.MONITOR]: [
    // Monitor tiene permisos específicos para su función
    { resource: ResourceType.DAILY_ATTENDANCE, action: PermissionAction.READ, scope: 'class' },
    { resource: ResourceType.OBSERVATIONS, action: PermissionAction.READ, scope: 'class' },
    { resource: ResourceType.STUDENT_EVALUATIONS, action: PermissionAction.READ, scope: 'class' },
  ],
};

// ========== MAPEO DE RECURSOS LEGACY ==========
// Para compatibilidad con el código existente
export const LEGACY_RESOURCE_MAPPING: Record<string, ResourceType> = {
  attendance: ResourceType.DAILY_ATTENDANCE,
  observations: ResourceType.OBSERVATIONS,
  montaje: ResourceType.MONTAJE_ASSIGNED,
  compases: ResourceType.COMPASES_STATUS,
  obras: ResourceType.OBRAS_ASSIGNED,
  students: ResourceType.CLASS_STUDENTS,
  all_students: ResourceType.ALL_STUDENTS,
  teachers: ResourceType.ALL_TEACHERS,
  classes: ResourceType.MANAGE_CLASSES,
  user_profile: ResourceType.OWN_PROFILE,
  schedule: ResourceType.TIME_AVAILABILITY,
  reports: ResourceType.GENERAL_REPORTS,
  confidential_info: ResourceType.CONFIDENTIAL_INFO,
};

// ========== CONFIGURACIÓN PARA FIRESTORE ==========
export interface FirestorePermissionConfig {
  roles: Record<UserRole, Permission[]>
  lastUpdated: Date
  version: string
}

export interface UserPermissionOverrides {
  userId: string
  additionalPermissions: Permission[]
  removedPermissions: Permission[]
  expiresAt?: Date
}

export const DEFAULT_FIRESTORE_CONFIG: FirestorePermissionConfig = {
  roles: ROLE_PERMISSIONS,
  lastUpdated: new Date(),
  version: '1.0.0',
};

// ========== HELPERS PARA VALIDACIÓN ==========
export function isValidPermission(permission: Permission): boolean {
  return (
    Object.values(ResourceType).includes(permission.resource) &&
    Object.values(PermissionAction).includes(permission.action)
  );
}

export function getPermissionKey(permission: Permission): string {
  return `${permission.resource}:${permission.action}:${permission.scope || 'none'}`;
}

export function hasPermission(
  userRole: UserRole,
  resource: ResourceType,
  action: PermissionAction,
  scope?: string,
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.some(
    (p) =>
      p.resource === resource &&
      p.action === action &&
      (scope ? p.scope === scope || p.scope === 'all' : true),
  );
}

// ========== CONSTANTES DE MÓDULOS ==========
export const MODULE_PERMISSIONS = {
  ATTENDANCE: [ResourceType.DAILY_ATTENDANCE, ResourceType.OBSERVATIONS],
  MONTAJE: [
    ResourceType.MONTAJE_ASSIGNED,
    ResourceType.COMPASES_STATUS,
    ResourceType.OBRAS_ASSIGNED,
  ],
  EVALUATIONS: [ResourceType.STUDENT_EVALUATIONS],
  REPORTS: [
    ResourceType.ATTENDANCE_REPORTS,
    ResourceType.GENERAL_REPORTS,
    ResourceType.EXPORT_FUNCTIONALITY,
  ],
  SUPERVISION: [
    ResourceType.SUPERVISE_MAESTRO_ATTENDANCE,
    ResourceType.SUPERVISE_MAESTRO_OBSERVATIONS,
    ResourceType.SUPERVISE_MONTAJE,
    ResourceType.SUPERVISE_STUDENT_EVALUATIONS,
  ],
} as const;
