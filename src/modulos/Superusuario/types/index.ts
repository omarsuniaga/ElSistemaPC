// src/modulos/Superusuario/types/index.ts
import type { Permission } from '../../Auth/types/permissions';
import { UserRole } from '../../Auth/types/permissions';

// Re-export from Auth types for convenience
export type { Permission };
export { UserRole };

// ========== CONFIGURACIÓN DEL SISTEMA ==========
export interface SystemConfiguration {
  id: string;
  name: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: 'general' | 'security' | 'performance' | 'ui' | 'notifications';
  description: string;
  editable: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

// ========== GESTIÓN DE ROLES ==========
export interface RoleConfiguration {
  role: UserRole;
  displayName: string;
  description: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface UserRoleAssignment {
  userId: string;
  userEmail: string;
  userName: string;
  currentRole: UserRole;
  newRole?: UserRole;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  reason: string;
  isActive: boolean;
}

// ========== CONFIGURACIÓN DE MÓDULOS ==========
export interface ModuleConfiguration {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isEnabled: boolean;
  requiredPermissions: Permission[];
  availableForRoles: UserRole[];
  icon?: string;
  order: number;
  category: 'core' | 'academic' | 'administrative' | 'reporting' | 'system';
  components: ComponentConfiguration[];
  views: ViewConfiguration[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ComponentConfiguration {
  id: string;
  name: string;
  displayName: string;
  moduleId: string;
  isEnabled: boolean;
  requiredPermissions: Permission[];
  availableForRoles: UserRole[];
  props?: Record<string, any>;
  conditions?: Record<string, any>;
}

export interface ViewConfiguration {
  id: string;
  name: string;
  displayName: string;
  path: string;
  moduleId: string;
  isEnabled: boolean;
  requiredPermissions: Permission[];
  availableForRoles: UserRole[];
  meta?: Record<string, any>;
  guards?: string[];
}

// ========== AUDITORÍA ==========
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PERMISSION_CHANGE' | 'ROLE_CHANGE' | 'SYSTEM_CONFIG';
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
  timestamp: Date;
}

// ========== MONITOREO DEL SISTEMA ==========
export interface SystemMetrics {
  timestamp: Date;
  activeUsers: number;
  totalSessions: number;
  performanceMetrics: {
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  databaseMetrics: {
    connectionCount: number;
    queryCount: number;
    averageQueryTime: number;
  };
  featureUsage: Record<string, number>;
}

// ========== RESPALDO Y RESTAURACIÓN ==========
export interface BackupConfiguration {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  includedCollections: string[];
  retentionDays: number;
  isActive: boolean;
  lastBackup?: Date;
  nextBackup?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface BackupRecord {
  id: string;
  configurationId: string;
  fileName: string;
  fileSize: number;
  collections: string[];
  documentCount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  downloadUrl?: string;
  expiresAt: Date;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}

// ========== CONFIGURACIÓN INSTITUCIONAL ==========
export interface InstitutionalData {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  director: string;
  foundedYear: number;
  description: string;
  academicYearStart: string; // MM-DD format
  academicYearEnd: string; // MM-DD format
  holidaySchedule: HolidaySchedule[];
  configuration: {
    maxStudentsPerClass: number;
    allowStudentSelfRegistration: boolean;
    requireParentApproval: boolean;
    enableNotifications: boolean;
    defaultLanguage: string;
    timezone: string;
  };
  updatedAt: Date;
  updatedBy: string;
}

export interface HolidaySchedule {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: 'national' | 'institutional' | 'break';
  isRecurring: boolean;
  description?: string;
}

// ========== DASHBOARD DATA ==========
export interface SuperusuarioDashboardData {
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastError?: Date;
    version: string;
  };
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    usersByRole: Record<UserRole, number>;
  };
  activityStats: {
    totalSessions: number;
    averageSessionDuration: number;
    mostUsedFeatures: Array<{ feature: string; usage: number }>;
  };
  recentAuditLogs: AuditLog[];
  systemAlerts: SystemAlert[];
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionRequired: boolean;
  relatedResource?: string;
  relatedResourceId?: string;
}

// ========== FILTROS Y BÚSQUEDA ==========
export interface SuperusuarioFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  userRoles?: UserRole[];
  modules?: string[];
  actions?: string[];
  searchTerm?: string;
}
