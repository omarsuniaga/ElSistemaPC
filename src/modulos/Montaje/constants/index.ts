// Constantes globales del sistema musical
export const APP_CONFIG = {
  NAME: 'Sistema de Gestión Musical - Montaje',
  VERSION: '1.0.0',
  DESCRIPTION: 'Sistema completo de gestión musical para orquestas, coros y conjuntos musicales',
};

// Configuración de evaluaciones
export const EVALUATION_CONFIG = {
  MAX_SCORE: 100,
  MIN_SCORE: 0,
  PASSING_SCORE: 70,
  DEFAULT_DURATION: 60, // minutos
};

// Roles y permisos
export const USER_ROLES = {
  DIRECTOR: 'director',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
  ADMIN: 'admin',
} as const;

export const PERMISSIONS = {
  MONTAJE: {
    ACCESS: 'montaje:access',
    READ: 'montaje:read',
    WRITE: 'montaje:write',
    DELETE: 'montaje:delete',
  },
  WORKS: {
    READ: 'works:read',
    CREATE: 'works:create',
    EDIT: 'works:edit',
    DELETE: 'works:delete',
    ALL: 'works:*',
  },
  EVALUATIONS: {
    READ: 'evaluations:read',
    CREATE: 'evaluations:create',
    EDIT: 'evaluations:edit',
    DELETE: 'evaluations:delete',
    ALL: 'evaluations:*',
  },
  USERS: {
    ACCESS: 'users:access',
    READ: 'users:read',
    MANAGE: 'users:manage',
    ALL: 'users:*',
  },
  REPORTS: {
    READ: 'reports:read',
    GENERATE: 'reports:generate',
    ALL: 'reports:*',
  },
} as const;

// Configuración de temas
export const THEME_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

// Breakpoints responsive
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Configuración de PWA
export const PWA_CONFIG = {
  CACHE_NAME: 'montaje-musical-v1',
  OFFLINE_FALLBACK: '/offline.html',
  UPDATE_CHECK_INTERVAL: 30000, // 30 segundos
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
export type Theme = typeof THEME_CONFIG[keyof typeof THEME_CONFIG]
