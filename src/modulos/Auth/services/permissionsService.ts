import {db} from "@/firebase"
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore"
import {
  UserRole,
  Permission,
  PermissionAction,
  ResourceType,
  FirestorePermissionConfig,
  FirestoreRoleConfig,
  defaultPermissionConfigs,
  ROLE_PERMISSIONS,
} from "../types/permissions"

// Firestore collections
const PERMISSIONS_COLLECTION = "permissions"
const ROLES_COLLECTION = "roles"
const USER_PERMISSIONS_COLLECTION = "userPermissions"

export interface UserPermissionOverride {
  userId: string
  resource: ResourceType
  action: PermissionAction
  granted: boolean
  reason?: string
  grantedBy?: string
  grantedAt?: Date
}

export interface PermissionServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Service for managing permissions in Firestore
 */
export class PermissionsService {
  /**
   * Initialize default permissions in Firestore
   */
  async initializePermissions(): Promise<PermissionServiceResult> {
    try {
      // Set up default permission configurations
      for (const [resource, config] of Object.entries(defaultPermissionConfigs)) {
        const permissionDoc = doc(db, PERMISSIONS_COLLECTION, resource)
        await setDoc(permissionDoc, config, {merge: true})
      }

      // Set up default role configurations
      for (const role of Object.values(UserRole)) {
        const roleDoc = doc(db, ROLES_COLLECTION, role)
        const roleConfig: FirestoreRoleConfig = {
          name: role,
          displayName: this.getRoleDisplayName(role),
          permissions: ROLE_PERMISSIONS[role] || [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await setDoc(roleDoc, roleConfig, {merge: true})
      }

      return {success: true, data: "Permissions initialized successfully"}
    } catch (error) {
      console.error("Error initializing permissions:", error)
      return {success: false, error: error instanceof Error ? error.message : "Unknown error"}
    }
  }

  /**
   * Get permission configuration for a resource
   */
  async getPermissionConfig(
    resource: ResourceType
  ): Promise<PermissionServiceResult<FirestorePermissionConfig>> {
    try {
      const permissionDoc = doc(db, PERMISSIONS_COLLECTION, resource)
      const docSnap = await getDoc(permissionDoc)

      if (docSnap.exists()) {
        return {success: true, data: docSnap.data() as FirestorePermissionConfig}
      } else {
        // Return default config if not found
        const defaultConfig = defaultPermissionConfigs[resource]
        if (defaultConfig) {
          return {success: true, data: defaultConfig}
        }
        return {success: false, error: `Permission config not found for resource: ${resource}`}
      }
    } catch (error) {
      console.error("Error getting permission config:", error)
      return {success: false, error: error instanceof Error ? error.message : "Unknown error"}
    }
  }

  /**
   * Update permission configuration for a resource
   */ async updatePermissionConfig(
    resource: ResourceType,
    config: Partial<FirestorePermissionConfig>
  ): Promise<PermissionServiceResult> {
    try {
      const permissionDoc = doc(db, PERMISSIONS_COLLECTION, resource)
      await updateDoc(permissionDoc, {
        ...config,
        updatedAt: new Date(),
      })

      return {success: true, data: "Permission config updated successfully"}
    } catch (error) {
      console.error("Error updating permission config:", error)
      return {success: false, error: error instanceof Error ? error.message : "Unknown error"}
    }
  }

  /**
   * Get role configuration
   */
  async getRoleConfig(role: UserRole): Promise<PermissionServiceResult<FirestoreRoleConfig>> {
    try {
      const roleDoc = doc(db, ROLES_COLLECTION, role)
      const docSnap = await getDoc(roleDoc)

      if (docSnap.exists()) {
        return {success: true, data: docSnap.data() as FirestoreRoleConfig}
      } else {
        return {success: false, error: `Role config not found: ${role}`}
      }
    } catch (error) {
      console.error("Error getting role config:", error)
      return {success: false, error: error instanceof Error ? error.message : "Unknown error"}
    }
  }

  /**
   * Update role configuration
   */
  async updateRoleConfig(
    role: UserRole,
    config: Partial<FirestoreRoleConfig>
  ): Promise<PermissionServiceResult> {
    try {
      const roleDoc = doc(db, ROLES_COLLECTION, role)
      await updateDoc(roleDoc, {
        ...config,
        updatedAt: new Date(),
      })

      return {success: true, data: "Role config updated successfully"}
    } catch (error) {
      console.error("Error updating role config:", error)
      return {success: false, error: error instanceof Error ? error.message : "Unknown error"}
    }
  }

  /**
   * Grant permission override to a user
   */
  async grantUserPermission(
    userId: string,
    resource: ResourceType,
    action: PermissionAction,
    grantedBy: string,
    reason?: string
  ): Promise<PermissionServiceResult> {
    try {
      const permissionOverride: UserPermissionOverride = {
        userId,
        resource,
        action,
        granted: true,
        reason,
        grantedBy,
        grantedAt: new Date(),
      }

      const overrideDoc = doc(db, USER_PERMISSIONS_COLLECTION, `${userId}_${resource}_${action}`)
      await setDoc(overrideDoc, permissionOverride)

      return {success: true, data: "Permission granted successfully"}
    } catch (error) {
      console.error("Error granting user permission:", error)
      return {success: false, error: error instanceof Error ? error.message : "Unknown error"}
    }
  }

  /**
   * Revoke permission override from a user
   */ async revokeUserPermission(
    userId: string,
    resource: ResourceType,
    action: PermissionAction
  ): Promise<PermissionServiceResult> {
    try {
      const overrideDoc = doc(db, USER_PERMISSIONS_COLLECTION, `${userId}_${resource}_${action}`)
      await deleteDoc(overrideDoc)

      return {success: true, data: "Permission revoked successfully"}
    } catch (error) {
      console.error("Error revoking user permission:", error)
      return {success: false, error: error instanceof Error ? error.message : "Unknown error"}
    }
  }

  /**
   * Get user permission overrides
   */
  async getUserPermissionOverrides(
    userId: string
  ): Promise<PermissionServiceResult<UserPermissionOverride[]>> {
    try {
      const q = query(collection(db, USER_PERMISSIONS_COLLECTION), where("userId", "==", userId))

      const querySnapshot = await getDocs(q)
      const overrides: UserPermissionOverride[] = []

      querySnapshot.forEach((doc) => {
        overrides.push(doc.data() as UserPermissionOverride)
      })

      return {success: true, data: overrides}
    } catch (error) {
      console.error("Error getting user permission overrides:", error)
      return {success: false, error: error instanceof Error ? error.message : "Unknown error"}
    }
  }

  /**
   * Check if user has permission (including overrides)
   */ async checkUserPermission(
    userId: string,
    userRole: UserRole,
    resource: ResourceType,
    action: PermissionAction
  ): Promise<PermissionServiceResult<boolean>> {
    try {
      // First check for user-specific override
      const overrideDoc = doc(db, USER_PERMISSIONS_COLLECTION, `${userId}_${resource}_${action}`)
      const overrideSnap = await getDoc(overrideDoc)

      if (overrideSnap.exists()) {
        const override = overrideSnap.data() as UserPermissionOverride
        return {success: true, data: override.granted}
      }

      // Fall back to role-based permissions
      const rolePermissions = ROLE_PERMISSIONS[userRole] || []
      const hasPermission = rolePermissions.some(
        (permission) => permission.resource === resource && permission.action === action
      )

      return {success: true, data: hasPermission}
    } catch (error) {
      console.error("Error checking user permission:", error)
      return {success: false, error: error instanceof Error ? error.message : "Unknown error"}
    }
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<PermissionServiceResult<FirestoreRoleConfig[]>> {
    try {
      const q = query(collection(db, ROLES_COLLECTION))
      const querySnapshot = await getDocs(q)
      const roles: FirestoreRoleConfig[] = []

      querySnapshot.forEach((doc) => {
        roles.push(doc.data() as FirestoreRoleConfig)
      })

      return {success: true, data: roles}
    } catch (error) {
      console.error("Error getting all roles:", error)
      return {success: false, error: error instanceof Error ? error.message : "Unknown error"}
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<
    PermissionServiceResult<Record<string, FirestorePermissionConfig>>
  > {
    try {
      const q = query(collection(db, PERMISSIONS_COLLECTION))
      const querySnapshot = await getDocs(q)
      const permissions: Record<string, FirestorePermissionConfig> = {}

      querySnapshot.forEach((doc) => {
        permissions[doc.id] = doc.data() as FirestorePermissionConfig
      })

      return {success: true, data: permissions}
    } catch (error) {
      console.error("Error getting all permissions:", error)
      return {success: false, error: error instanceof Error ? error.message : "Unknown error"}
    }
  }

  /**
   * Validate permission structure
   */
  validatePermission(permission: Permission): boolean {
    return (
      Object.values(ResourceType).includes(permission.resource) &&
      Object.values(PermissionAction).includes(permission.action)
    )
  }

  /**
   * Get role display name
   */
  private getRoleDisplayName(role: UserRole): string {
    const displayNames: Record<UserRole, string> = {
      [UserRole.MAESTRO]: "Maestro",
      [UserRole.DIRECTOR]: "Director",
      [UserRole.ADMINISTRADOR]: "Administrador",
      [UserRole.SUPERUSUARIO]: "Superusuario",
      [UserRole.COLABORADOR]: "Colaborador",
      [UserRole.MONITOR]: "Monitor",
    }
    return displayNames[role] || role
  }
}

// Singleton instance
export const permissionsService = new PermissionsService()
