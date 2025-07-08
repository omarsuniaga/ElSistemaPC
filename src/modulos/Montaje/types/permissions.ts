// src/modulos/Montaje/types/permissions.ts

/**
 * Definición de permisos específicos para el módulo de Montaje
 * Estos permisos se utilizan para controlar el acceso a funcionalidades
 * según el rol del usuario (RBAC)
 */

export enum MontajePermission {
  // Permisos para obras
  READ_WORKS = 'montaje:read:works',
  CREATE_WORKS = 'montaje:create:works',
  UPDATE_WORKS = 'montaje:update:works',
  DELETE_WORKS = 'montaje:delete:works',
  
  // Permisos para estados de compases
  READ_COMPASS_STATES = 'montaje:read:compass_states',
  UPDATE_COMPASS_STATES = 'montaje:update:compass_states',
  
  // Permisos para estados de compases por instrumento
  READ_INSTRUMENT_COMPASS_STATES = 'montaje:read:instrument_compass_states',
  UPDATE_INSTRUMENT_COMPASS_STATES = 'montaje:update:instrument_compass_states',
  
  // Permisos para reportes y vistas agregadas
  VIEW_AGGREGATED_REPORTS = 'montaje:view:aggregated_reports',
  EXPORT_REPORTS = 'montaje:export:reports',
  
  // Permisos para gestión de usuarios y asignaciones
  MANAGE_PROJECT_MEMBERS = 'montaje:manage:project_members',
  ASSIGN_INSTRUMENTS = 'montaje:assign:instruments',
  
  // Permisos administrativos
  MANAGE_ALL = 'montaje:manage:all'
}

/**
 * Mapeo de roles a permisos por defecto
 * Define qué permisos tiene cada rol automáticamente
 */
export const RolePermissions: Record<string, MontajePermission[]> = {
  admin: [MontajePermission.MANAGE_ALL],
  
  director: [
    MontajePermission.READ_WORKS,
    MontajePermission.CREATE_WORKS,
    MontajePermission.UPDATE_WORKS,
    MontajePermission.DELETE_WORKS,
    MontajePermission.READ_COMPASS_STATES,
    MontajePermission.UPDATE_COMPASS_STATES,
    MontajePermission.READ_INSTRUMENT_COMPASS_STATES,
    MontajePermission.VIEW_AGGREGATED_REPORTS,
    MontajePermission.EXPORT_REPORTS,
    MontajePermission.MANAGE_PROJECT_MEMBERS,
    MontajePermission.ASSIGN_INSTRUMENTS
  ],
  
  assistant: [
    MontajePermission.READ_WORKS,
    MontajePermission.UPDATE_WORKS,
    MontajePermission.READ_COMPASS_STATES,
    MontajePermission.READ_INSTRUMENT_COMPASS_STATES,
    MontajePermission.VIEW_AGGREGATED_REPORTS
  ],
  
  maestro: [
    MontajePermission.READ_WORKS,
    MontajePermission.READ_COMPASS_STATES,
    MontajePermission.READ_INSTRUMENT_COMPASS_STATES,
    MontajePermission.UPDATE_INSTRUMENT_COMPASS_STATES
  ],
  
  musician: [
    MontajePermission.READ_WORKS,
    MontajePermission.READ_COMPASS_STATES
  ]
}
