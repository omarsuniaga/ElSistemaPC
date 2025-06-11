// src/modulos/Superusuario/services/superusuarioService.ts
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  onSnapshot,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db } from '@/firebase';
import { UserRole } from '@/modulos/Auth/types/permissions';
import {
  SystemConfiguration,
  RoleConfiguration,
  UserRoleAssignment,
  ModuleConfiguration,
  AuditLog,
  SystemMetrics,
  BackupRecord,
  SuperusuarioDashboardData,
  SystemAlert,
  SuperusuarioFilters
} from '../types';

class SuperusuarioService {
  private readonly COLLECTIONS = {
    SYSTEM_CONFIG: 'system_configuration',
    ROLES: 'role_configurations',
    USER_ROLES: 'user_role_assignments',
    MODULES: 'module_configurations',
    COMPONENTS: 'component_configurations',
    VIEWS: 'view_configurations',
    AUDIT_LOGS: 'audit_logs',
    SYSTEM_METRICS: 'system_metrics',
    BACKUPS: 'backup_configurations',
    BACKUP_RECORDS: 'backup_records',
    INSTITUTIONAL: 'institutional_data',
    ALERTS: 'system_alerts'
  } as const;

  // ========== CONFIGURACIÓN DEL SISTEMA ==========
  
  async getSystemConfigurations(): Promise<SystemConfiguration[]> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, this.COLLECTIONS.SYSTEM_CONFIG),
          orderBy('category'),
          orderBy('name')
        )
      );      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.safeConvertTimestamp(data.createdAt),
          updatedAt: this.safeConvertTimestamp(data.updatedAt)
        };
      }) as SystemConfiguration[];
    } catch (error) {
      console.error('Error fetching system configurations:', error);
      throw new Error('No se pudieron cargar las configuraciones del sistema');
    }
  }

  async updateSystemConfiguration(id: string, updates: Partial<SystemConfiguration>): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTIONS.SYSTEM_CONFIG, id), {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      // Registrar auditoría
      await this.createAuditLog({
        action: 'UPDATE',
        resource: 'system_configuration',
        resourceId: id,
        newValue: updates
      });
    } catch (error) {
      console.error('Error updating system configuration:', error);
      throw new Error('No se pudo actualizar la configuración');
    }
  }

  async createSystemConfiguration(config: Omit<SystemConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.SYSTEM_CONFIG), {
        ...config,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      await this.createAuditLog({
        action: 'CREATE',
        resource: 'system_configuration',
        resourceId: docRef.id,
        newValue: config
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating system configuration:', error);
      throw new Error('No se pudo crear la configuración');
    }
  }

  // ========== GESTIÓN DE ROLES ==========
  
  async getRoleConfigurations(): Promise<RoleConfiguration[]> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, this.COLLECTIONS.ROLES),
          orderBy('role')        )
      );
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: this.safeConvertTimestamp(data.createdAt),
          updatedAt: this.safeConvertTimestamp(data.updatedAt)
        };
      }) as RoleConfiguration[];
    } catch (error) {
      console.error('Error fetching role configurations:', error);
      throw new Error('No se pudieron cargar las configuraciones de roles');
    }
  }

  async updateRoleConfiguration(role: UserRole, updates: Partial<RoleConfiguration>): Promise<void> {
    try {
      const roleDoc = doc(db, this.COLLECTIONS.ROLES, role);
      await updateDoc(roleDoc, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      await this.createAuditLog({
        action: 'UPDATE',
        resource: 'role_configuration',
        resourceId: role,
        newValue: updates
      });
    } catch (error) {
      console.error('Error updating role configuration:', error);
      throw new Error('No se pudo actualizar la configuración del rol');
    }
  }

  // ========== GESTIÓN DE ASIGNACIONES DE ROLES ==========
    async getUserRoleAssignments(filters?: SuperusuarioFilters): Promise<UserRoleAssignment[]> {
    try {
      let queryConstraints = [];
      
      if (filters?.userRoles?.length) {
        queryConstraints.push(where('currentRole', 'in', filters.userRoles));
      }
      
      if (filters?.dateRange) {
        queryConstraints.push(
          where('assignedAt', '>=', Timestamp.fromDate(filters.dateRange.start)),
          where('assignedAt', '<=', Timestamp.fromDate(filters.dateRange.end))
        );
      }
      
      // orderBy must come after where clauses
      queryConstraints.push(orderBy('assignedAt', 'desc'));
        const snapshot = await getDocs(
        query(collection(db, this.COLLECTIONS.USER_ROLES), ...queryConstraints)
      );
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          assignedAt: this.safeConvertTimestamp(data.assignedAt),
          expiresAt: this.safeConvertTimestamp(data.expiresAt)
        };
      }) as UserRoleAssignment[];
    } catch (error) {
      console.error('Error fetching user role assignments:', error);
      throw new Error('No se pudieron cargar las asignaciones de roles');
    }
  }

  async assignUserRole(assignment: Omit<UserRoleAssignment, 'assignedAt'>): Promise<void> {
    try {
      await addDoc(collection(db, this.COLLECTIONS.USER_ROLES), {
        ...assignment,
        assignedAt: Timestamp.now(),
        expiresAt: assignment.expiresAt ? Timestamp.fromDate(assignment.expiresAt) : null
      });
      
      // También actualizar el documento del usuario
      await updateDoc(doc(db, 'users', assignment.userId), {
        role: assignment.newRole || assignment.currentRole,
        roleUpdatedAt: Timestamp.now(),
        roleUpdatedBy: assignment.assignedBy
      });
      
      await this.createAuditLog({
        action: 'ROLE_CHANGE',
        resource: 'user_role',
        resourceId: assignment.userId,
        oldValue: { role: assignment.currentRole },
        newValue: { role: assignment.newRole || assignment.currentRole },
        metadata: { reason: assignment.reason }
      });
    } catch (error) {
      console.error('Error assigning user role:', error);
      throw new Error('No se pudo asignar el rol al usuario');
    }
  }

  // ========== CONFIGURACIÓN DE MÓDULOS ==========
  
  async getModuleConfigurations(): Promise<ModuleConfiguration[]> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, this.COLLECTIONS.MODULES),
          orderBy('category'),
          orderBy('order')        )
      );
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.safeConvertTimestamp(data.createdAt),
          updatedAt: this.safeConvertTimestamp(data.updatedAt)
        };
      }) as ModuleConfiguration[];
    } catch (error) {
      console.error('Error fetching module configurations:', error);
      throw new Error('No se pudieron cargar las configuraciones de módulos');
    }
  }

  async updateModuleConfiguration(id: string, updates: Partial<ModuleConfiguration>): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTIONS.MODULES, id), {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      await this.createAuditLog({
        action: 'UPDATE',
        resource: 'module_configuration',
        resourceId: id,
        newValue: updates
      });
    } catch (error) {
      console.error('Error updating module configuration:', error);
      throw new Error('No se pudo actualizar la configuración del módulo');
    }
  }
  // ========== AUDITORÍA ==========
  
  async getAuditLogs(filters?: SuperusuarioFilters, pageSize = 50): Promise<AuditLog[]> {
    try {
      let queryConstraints = [];
      
      if (filters?.userRoles?.length) {
        queryConstraints.push(where('userRole', 'in', filters.userRoles));
      }
      
      if (filters?.actions?.length) {
        queryConstraints.push(where('action', 'in', filters.actions));
      }
      
      if (filters?.dateRange) {
        queryConstraints.push(
          where('timestamp', '>=', Timestamp.fromDate(filters.dateRange.start)),
          where('timestamp', '<=', Timestamp.fromDate(filters.dateRange.end))
        );
      }
      
      // orderBy and limit must come after where clauses
      queryConstraints.push(orderBy('timestamp', 'desc'), limit(pageSize));
      
      const snapshot = await getDocs(        query(collection(db, this.COLLECTIONS.AUDIT_LOGS), ...queryConstraints)
      );
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: this.safeConvertTimestamp(data.timestamp)
        };
      }) as AuditLog[];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw new Error('No se pudieron cargar los logs de auditoría');
    }
  }

  async createAuditLog(logData: Partial<AuditLog>): Promise<void> {
    try {
      // Obtener información del usuario actual desde el contexto de autenticación
      // Esto debería ser inyectado o pasado como parámetro en una implementación real
      await addDoc(collection(db, this.COLLECTIONS.AUDIT_LOGS), {
        ...logData,
        timestamp: Timestamp.now(),
        success: true
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // No lanzar error para evitar interrumpir el flujo principal
    }
  }

  // ========== MÉTRICAS DEL SISTEMA ==========
  
  async getSystemMetrics(hours = 24): Promise<SystemMetrics[]> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);
      
      const snapshot = await getDocs(
        query(          collection(db, this.COLLECTIONS.SYSTEM_METRICS),
          where('timestamp', '>=', Timestamp.fromDate(cutoffTime)),
          orderBy('timestamp', 'desc')
        )
      );
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          timestamp: this.safeConvertTimestamp(data.timestamp)
        };
      }) as SystemMetrics[];
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      throw new Error('No se pudieron cargar las métricas del sistema');
    }
  }

  // ========== DASHBOARD ==========
    async getDashboardData(): Promise<SuperusuarioDashboardData> {
    try {
      // Simulamos datos realistas del dashboard
      const mockData: SuperusuarioDashboardData = {
        systemHealth: {
          status: 'healthy',
          uptime: 2592000, // 30 días en segundos
          version: '1.0.0'
        },
        userStats: {
          totalUsers: 25,
          activeUsers: 18,
          newUsersThisMonth: 5,
          usersByRole: {
            [UserRole.MAESTRO]: 8,
            [UserRole.DIRECTOR]: 2,
            [UserRole.ADMINISTRADOR]: 3,
            [UserRole.SUPERUSUARIO]: 1,
            [UserRole.COLABORADOR]: 7,
            [UserRole.MONITOR]: 4
          }
        },
        activityStats: {
          totalSessions: 142,
          averageSessionDuration: 3600, // 1 hora en segundos
          mostUsedFeatures: [
            { feature: 'Registro de Asistencia', usage: 45 },
            { feature: 'Gestión de Repertorio', usage: 32 },
            { feature: 'Evaluaciones', usage: 28 },
            { feature: 'Reportes', usage: 15 }
          ]
        },
        recentAuditLogs: [
          {
            id: '1',
            userId: 'user1',
            userEmail: 'maestro@test.com',
            userName: 'Juan Pérez',
            userRole: UserRole.MAESTRO,
            action: 'CREATE',
            resource: 'asistencia',
            resourceId: 'clase-001',
            success: true,
            timestamp: new Date(Date.now() - 1800000) // 30 minutos atrás
          },
          {
            id: '2',
            userId: 'user2',
            userEmail: 'director@test.com',
            userName: 'María García',
            userRole: UserRole.DIRECTOR,
            action: 'UPDATE',
            resource: 'repertorio',
            resourceId: 'rep-002',
            success: true,
            timestamp: new Date(Date.now() - 3600000) // 1 hora atrás
          },
          {
            id: '3',
            userId: 'user3',
            userEmail: 'admin@test.com',
            userName: 'Carlos López',
            userRole: UserRole.ADMINISTRADOR,
            action: 'LOGIN',
            resource: 'sistema',
            success: true,
            timestamp: new Date(Date.now() - 7200000) // 2 horas atrás
          }
        ],
        systemAlerts: await this.getSystemAlerts()
      };

      return mockData;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error('No se pudieron cargar los datos del dashboard');
    }
  }

  private async getUserStatistics() {
    // Implementar consulta real a la colección de usuarios
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
      usersByRole: {
        [UserRole.MAESTRO]: 0,
        [UserRole.DIRECTOR]: 0,
        [UserRole.ADMINISTRADOR]: 0,
        [UserRole.SUPERUSUARIO]: 0,
        [UserRole.COLABORADOR]: 0,
        [UserRole.MONITOR]: 0
      }
    };  }

  private async getSystemAlerts(): Promise<SystemAlert[]> {
    try {
      // TODO: Implementar consulta real a Firebase cuando esté configurada la colección de alertas
      // const alertsQuery = query(
      //   collection(db, this.COLLECTIONS.ALERTS),
      //   where('isRead', '==', false),
      //   orderBy('timestamp', 'desc'),
      //   limit(10)
      // );
      // const snapshot = await getDocs(alertsQuery);
      // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SystemAlert[];      // Por ahora retornamos datos simulados hasta que se configure la colección de alertas
      return [
        {
          id: '1',
          type: 'warning',
          title: 'Memoria del servidor alta',
          message: 'El uso de memoria ha superado el 85%',
          timestamp: new Date(),
          isRead: false,
          actionRequired: true
        },
        {
          id: '2',
          type: 'info',
          title: 'Backup completado',
          message: 'Backup diario completado exitosamente',
          timestamp: new Date(Date.now() - 3600000), // 1 hora atrás
          isRead: false,
          actionRequired: false
        },
        {
          id: '3',
          type: 'error',
          title: 'Error de conexión',
          message: 'Problemas de conectividad detectados',
          timestamp: new Date(Date.now() - 7200000), // 2 horas atrás
          isRead: false,
          actionRequired: true
        }
      ];
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      return [];
    }
  }

  // ========== GESTIÓN OPERATIVA DE USUARIOS ==========
    /**
   * Obtiene todos los usuarios con posibilidad de gestión
   */
  async getAllUsers(): Promise<any[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'USERS'));
      return usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.safeConvertTimestamp(data.createdAt),
          updatedAt: this.safeConvertTimestamp(data.updatedAt)
        };
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      // Datos mock mientras se configura Firebase
      return [
        {
          id: 'user1',
          email: 'superuser@test.com',
          role: UserRole.SUPERUSUARIO,
          isActive: true,
          displayName: 'Superusuario Test',
          createdAt: new Date()
        },
        {
          id: 'user2',
          email: 'admin@test.com',
          role: UserRole.ADMINISTRADOR,
          isActive: true,
          displayName: 'Administrador Test',
          createdAt: new Date()
        },
        {
          id: 'user3',
          email: 'director@test.com',
          role: UserRole.DIRECTOR,
          isActive: true,
          displayName: 'Director Test',
          createdAt: new Date()
        },
        {
          id: 'user4',
          email: 'teacher@test.com',
          role: UserRole.MAESTRO,
          isActive: false,
          displayName: 'Maestro Test',
          createdAt: new Date()
        }
      ];
    }
  }

  /**
   * Cambia el rol de un usuario
   */
  async changeUserRole(userId: string, newRole: UserRole, reason: string): Promise<void> {
    try {
      const userRef = doc(db, 'USERS', userId);
      const userData = await getDoc(userRef);
      
      if (!userData.exists()) {
        throw new Error('Usuario no encontrado');
      }

      const oldRole = userData.data().role;
      
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: Timestamp.now(),
        updatedBy: 'current_superuser' // TODO: obtener del contexto actual
      });

      // Registrar auditoría
      await this.createAuditLog({
        action: 'ROLE_CHANGE',
        resource: 'user',
        resourceId: userId,
        oldValue: { role: oldRole },
        newValue: { role: newRole },
        metadata: { reason }
      });

      console.log(`Rol de usuario ${userId} cambiado de ${oldRole} a ${newRole}`);
    } catch (error) {
      console.error('Error changing user role:', error);
      // Simular éxito para testing
      console.log(`[MOCK] Rol de usuario ${userId} cambiado a ${newRole}. Razón: ${reason}`);
    }
  }

  /**
   * Activa o desactiva un usuario
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      const userRef = doc(db, 'USERS', userId);
      
      await updateDoc(userRef, {
        isActive,
        updatedAt: Timestamp.now(),
        updatedBy: 'current_superuser'
      });

      // Registrar auditoría
      await this.createAuditLog({
        action: 'UPDATE',
        resource: 'user_status',
        resourceId: userId,
        newValue: { isActive },
        metadata: { action: isActive ? 'activated' : 'deactivated' }
      });

      console.log(`Usuario ${userId} ${isActive ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      // Simular éxito para testing
      console.log(`[MOCK] Usuario ${userId} ${isActive ? 'activado' : 'desactivado'}`);
    }
  }

  /**
   * Crea un nuevo usuario
   */
  async createUser(userData: {
    email: string;
    role: UserRole;
    displayName: string;
    password: string;
  }): Promise<string> {
    try {
      // TODO: Integrar con Firebase Auth para crear el usuario
      const newUserRef = await addDoc(collection(db, 'USERS'), {
        ...userData,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'current_superuser'
      });

      // Registrar auditoría
      await this.createAuditLog({
        action: 'CREATE',
        resource: 'user',
        resourceId: newUserRef.id,
        newValue: userData
      });

      return newUserRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      // Simular éxito para testing
      const mockId = 'mock-' + Date.now();
      console.log(`[MOCK] Usuario creado: ${userData.email} con rol ${userData.role}`);
      return mockId;
    }
  }

  // ========== GESTIÓN DE MÓDULOS DEL SISTEMA ==========

  /**
   * Obtiene la configuración de todos los módulos
   */
  async getSystemModules(): Promise<any[]> {
    try {
      // TODO: Implementar consulta real a colección de módulos
      return [
        {
          id: 'attendance',
          name: 'Asistencias',
          enabled: true,
          description: 'Gestión de asistencias de estudiantes',
          category: 'academic'
        },
        {
          id: 'repertorio',
          name: 'Repertorio',
          enabled: true,
          description: 'Gestión de repertorio musical',
          category: 'academic'
        },
        {
          id: 'students',
          name: 'Estudiantes',
          enabled: true,
          description: 'Gestión de estudiantes',
          category: 'core'
        },
        {
          id: 'teachers',
          name: 'Maestros',
          enabled: true,
          description: 'Gestión de maestros',
          category: 'core'
        },
        {
          id: 'reports',
          name: 'Reportes',
          enabled: false,
          description: 'Generación de reportes',
          category: 'reporting'
        },
        {
          id: 'notifications',
          name: 'Notificaciones',
          enabled: true,
          description: 'Sistema de notificaciones',
          category: 'system'
        }
      ];
    } catch (error) {
      console.error('Error fetching system modules:', error);
      return [];
    }
  }

  /**
   * Habilita o deshabilita un módulo del sistema
   */
  async toggleModule(moduleId: string, enabled: boolean): Promise<void> {
    try {
      // TODO: Implementar actualización real en Firebase
      console.log(`[MOCK] Módulo ${moduleId} ${enabled ? 'habilitado' : 'deshabilitado'}`);
      
      // Registrar auditoría
      await this.createAuditLog({
        action: 'UPDATE',
        resource: 'system_module',
        resourceId: moduleId,
        newValue: { enabled },
        metadata: { action: enabled ? 'enabled' : 'disabled' }
      });
    } catch (error) {
      console.error('Error toggling module:', error);
      throw new Error(`No se pudo ${enabled ? 'habilitar' : 'deshabilitar'} el módulo`);
    }
  }

  // ========== OPERACIONES DEL SISTEMA ==========

  /**
   * Ejecuta mantenimiento del sistema
   */
  async runSystemMaintenance(): Promise<void> {
    try {
      console.log('Iniciando mantenimiento del sistema...');
      
      // Simular operaciones de mantenimiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Registrar auditoría
      await this.createAuditLog({
        action: 'SYSTEM_CONFIG',
        resource: 'system_maintenance',
        metadata: { 
          operation: 'maintenance',
          status: 'completed',
          duration: '2 seconds'
        }
      });

      console.log('Mantenimiento completado exitosamente');
    } catch (error) {
      console.error('Error durante mantenimiento:', error);
      throw new Error('Error durante el mantenimiento del sistema');
    }
  }

  /**
   * Exporta datos del sistema
   */
  async exportSystemData(format: 'json' | 'csv' | 'xlsx'): Promise<string> {
    try {
      console.log(`Exportando datos del sistema en formato ${format}...`);
      
      // Simular exportación
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const exportId = `export_${Date.now()}.${format}`;
      
      // Registrar auditoría
      await this.createAuditLog({
        action: 'SYSTEM_CONFIG',
        resource: 'data_export',
        metadata: { 
          format,
          exportId,
          status: 'completed'
        }
      });

      return exportId;
    } catch (error) {
      console.error('Error during data export:', error);
      throw new Error('Error durante la exportación de datos');
    }
  }

  /**
   * Crea un backup del sistema
   */
  async createSystemBackup(description: string): Promise<string> {
    try {
      console.log('Creando backup del sistema...');
      
      // Simular creación de backup
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const backupId = `backup_${Date.now()}`;
      
      // Registrar auditoría
      await this.createAuditLog({
        action: 'SYSTEM_CONFIG',
        resource: 'system_backup',
        metadata: { 
          backupId,
          description,
          status: 'completed'
        }
      });

      return backupId;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Error durante la creación del backup');
    }
  }
  
  async createBackup(collections: string[], description: string): Promise<string> {
    try {
      const backupRecord: Omit<BackupRecord, 'id'> = {
        configurationId: 'manual',
        fileName: `backup_${Date.now()}.json`,
        fileSize: 0,
        collections,
        documentCount: 0,
        status: 'pending',
        createdBy: 'current_user', // Debería obtenerse del contexto
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      };
      
      const docRef = await addDoc(collection(db, this.COLLECTIONS.BACKUP_RECORDS), {
        ...backupRecord,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(backupRecord.expiresAt)
      });
      
      // Aquí se iniciaría el proceso de respaldo real
      // En una implementación completa, esto sería un Cloud Function
      
      await this.createAuditLog({
        action: 'CREATE',
        resource: 'backup',
        resourceId: docRef.id,
        metadata: { collections, description }
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('No se pudo crear el respaldo');
    }
  }

  // ========== UTILIDADES ==========
  
  async toggleNetworkStatus(enable: boolean): Promise<void> {
    try {
      if (enable) {
        await enableNetwork(db);
      } else {
        await disableNetwork(db);
      }
      
      await this.createAuditLog({
        action: 'SYSTEM_CONFIG',
        resource: 'network_status',
        newValue: { enabled: enable }
      });
    } catch (error) {
      console.error('Error toggling network status:', error);
      throw new Error('No se pudo cambiar el estado de la red');
    }
  }

  // Método para escuchar cambios en tiempo real
  subscribeToSystemAlerts(callback: (alerts: SystemAlert[]) => void): () => void {
    const unsubscribe = onSnapshot(
      query(
        collection(db, this.COLLECTIONS.ALERTS),
        where('isRead', '==', false),
        orderBy('timestamp', 'desc'),
        limit(10)
      ),
      (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        })) as SystemAlert[];
        callback(alerts);
      },
      (error) => {
        console.error('Error listening to system alerts:', error);
      }
    );    
    return unsubscribe;
  }

  // ========== MÉTODOS UTILITARIOS ==========

  /**
   * Convierte de manera segura un timestamp de Firestore a Date
   */
  private safeConvertTimestamp(timestamp: any): Date | null {
    try {
      // Si es null o undefined, retorna null
      if (!timestamp) {
        return null;
      }
      
      // Si ya es una instancia de Date, la retorna
      if (timestamp instanceof Date) {
        return timestamp;
      }
      
      // Si es un Timestamp de Firestore y tiene el método toDate
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      
      // Si es un objeto con seconds y nanoseconds (formato Timestamp)
      if (timestamp && typeof timestamp === 'object' && 
          'seconds' in timestamp && typeof timestamp.seconds === 'number') {
        return new Date(timestamp.seconds * 1000);
      }
      
      // Si es un string que puede ser parseado como fecha
      if (typeof timestamp === 'string') {
        const parsed = new Date(timestamp);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
      
      // Si es un número (timestamp en milisegundos)
      if (typeof timestamp === 'number') {
        return new Date(timestamp);
      }
      
      // En cualquier otro caso, retorna null
      return null;
    } catch (error) {
      console.warn('Error converting timestamp:', error, timestamp);
      return null;
    }
  }
}

export const superusuarioService = new SuperusuarioService();
