// src/services/usersService.ts
import {collection, getDocs, doc, getDoc} from "firebase/firestore"
import {db} from "@/firebase"
import type {UserProfile} from "@/modulos/Users/types/user"

export class UsersService {
  private readonly USERS_COLLECTION = "USERS"

  /**
   * Get all users from the USERS collection
   */
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, this.USERS_COLLECTION))
      return usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      })) as UserProfile[]
    } catch (error) {
      console.error("Error fetching users:", error)
      throw new Error("Error al cargar usuarios")
    }
  }

  /**
   * Get a specific user by ID
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, this.USERS_COLLECTION, userId))
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data(),
          createdAt: userDoc.data().createdAt?.toDate?.() || userDoc.data().createdAt,
          updatedAt: userDoc.data().updatedAt?.toDate?.() || userDoc.data().updatedAt,
        } as UserProfile
      }
      return null
    } catch (error) {
      console.error("Error fetching user:", error)
      throw new Error("Error al cargar usuario")
    }
  }

  /**
   * Get multiple users by their IDs
   */
  async getUsersByIds(userIds: string[]): Promise<UserProfile[]> {
    try {
      const users = await Promise.all(userIds.map((id) => this.getUserById(id)))
      return users.filter((user) => user !== null) as UserProfile[]
    } catch (error) {
      console.error("Error fetching users by IDs:", error)
      throw new Error("Error al cargar usuarios")
    }
  }

  /**
   * Get user display name with fallback
   */
  getUserDisplayName(user: UserProfile | null): string {
    if (!user) return "Usuario desconocido"
    return user.displayName || user.name || user.email || `Usuario ${user.id.substring(0, 8)}...`
  }
}

// Export singleton instance
export const usersService = new UsersService()
