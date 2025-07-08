// src/modulos/Montaje/service/permissionsService.ts

import { MontajeUser, MontajePermission, RolePermissions } from '../types';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '@/stores/auth';

/**
 * Servicio para gestión de permisos basados en roles (RBAC)
 * Permite verificar si un usuario tiene determinados permisos
 * en base a su rol, proyecto y asignaciones
 */
export const permissionsService = {
  /**
   * Verifica si el usuario actual tiene un permiso específico
   * @param permission El permiso a verificar
   * @returns Promise<boolean> True si el usuario tiene el permiso, false en caso contrario
   */
  async hasPermission(permission: MontajePermission): Promise<boolean> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return false;
      }
      
      // Si el usuario está en el store, usamos esa información
      const authStore = useAuthStore();
      const user = authStore.user;
      
      if (user) {
        const role = user.role || '';
        
        // Si el usuario es admin, tiene todos los permisos
        if (role.toLowerCase() === 'admin') {
          return true;
        }
        
        // Verificamos si el rol tiene el permiso específico
        const rolePerms = RolePermissions[role];
        if (rolePerms && rolePerms.includes(permission)) {
          return true;
        }
        
        // Verificamos permisos específicos del usuario en userRoles si existe
        const userPerms = user.userRoles || [];
        if (Array.isArray(userPerms)) {
          return userPerms.includes(permission.toString());
        }
      }
      
      // Si no está en el store, buscamos en Firestore
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (!userDoc.exists()) {
        return false;
      }
      
      const userData = userDoc.data() as any;
      const role = userData.role || '';
      
      // Si el usuario es admin, tiene todos los permisos
      if (role.toLowerCase() === 'admin') {
        return true;
      }
      
      // Verificamos si el rol tiene el permiso específico
      const rolePerms = RolePermissions[role];
      if (rolePerms && rolePerms.includes(permission)) {
        return true;
      }
      
      // Verificamos permisos específicos del usuario
      const userPerms = userData.userRoles || [];
      if (Array.isArray(userPerms)) {
        return userPerms.includes(permission.toString());
      }
      
      return false;
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return false;
    }
  },
  
  /**
   * Verifica si un usuario tiene permisos para actualizar el estado de compases
   * para un instrumento específico
   * @param userId ID del usuario
   * @param instrumentId ID del instrumento
   * @returns Promise<boolean> True si el usuario tiene permiso, false en caso contrario
   */
  async canUpdateInstrumentState(userId: string, instrumentId: string): Promise<boolean> {
    try {
      // Verificamos si el usuario tiene el permiso general
      const hasGeneralPermission = await this.hasPermission(MontajePermission.UPDATE_INSTRUMENT_COMPASS_STATES);
      
      if (!hasGeneralPermission) {
        return false;
      }
      
      // Obtenemos el perfil de usuario y verificamos sus instrumentos asignados
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return false;
      }
      
      const userData = userDoc.data() as any;
      
      // Si es director o admin, puede actualizar cualquier instrumento
      if (['admin', 'director'].includes(userData.role)) {
        return true;
      }
      
      // Para maestros, verificamos si el instrumento está en su lista
      const userInstruments = userData.instruments || [];
      const teacherClasses = userData.teacherClasses || [];
      
      // Si el instrumento está en la lista directa del usuario
      if (userInstruments.includes(instrumentId)) {
        return true;
      }
      
      // Verificamos si el instrumento está asignado en alguna de sus clases
      for (const classId of teacherClasses) {
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (classDoc.exists()) {
          const classData = classDoc.data() as any;
          if (classData.instruments && classData.instruments.includes(instrumentId)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error al verificar permisos de instrumento:', error);
      return false;
    }
  },
  
  /**
   * Verifica si el usuario actual puede ver reportes agregados
   * (permisos de director o administrador)
   * @returns Promise<boolean>
   */
  async canViewAggregatedReports(): Promise<boolean> {
    return this.hasPermission(MontajePermission.VIEW_AGGREGATED_REPORTS);
  }
};

export default permissionsService;
