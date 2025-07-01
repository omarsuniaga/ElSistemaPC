import {defineStore} from "pinia"
import {useColorMode} from "@vueuse/core"
import type {UserProfile, UserSettings, Achievement, Notification, ActivityLog} from "../types"
import {getFirestore, doc, getDoc, setDoc, updateDoc} from "firebase/firestore"
import {getAuth} from "firebase/auth"
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage"

/**
 * Default user preferences
 */
const DEFAULT_USER_PREFERENCES = {
  theme: "system",
  emailNotifications: true,
  language: "es",
  timezone: "America/Mexico_City",
}

/**
 * Profile store - manages user profile data and interactions with Firestore
 */
export const useProfileStore = defineStore("profile", {
  state: () => ({
    profile: null as UserProfile | null,
    notifications: [] as Notification[],
    activityLogs: [] as ActivityLog[],
    isLoading: false,
    error: null as string | null,
    availableLanguages: [
      {code: "es", name: "Español"},
      {code: "en", name: "English"},
    ],
    availableTimezones: [
      "America/Mexico_City",
      "America/New_York",
      "America/Los_Angeles",
      "Europe/Madrid",
      "Asia/Tokyo",
    ],
  }),

  getters: {
    isComplete: (state) => {
      if (!state.profile) return false
      return !!(
        state.profile.name &&
        state.profile.email &&
        state.profile.phone &&
        state.profile.address
      )
    },
    currentTheme: (state) => {
      return state.profile?.preferences?.theme || "system"
    },
    unreadNotifications: (state) => {
      return state.notifications.filter((n: Notification) => !n.read)
    },
    recentActivity: (state) => {
      return state.activityLogs.slice(0, 5)
    },
  },

  actions: {
    /**
     * Helper method to get the current user ID from Firebase Auth
     * @returns User ID or throws error if not authenticated
     */
    _getCurrentUserId(): string {
      const auth = getAuth()
      const userId = auth.currentUser?.uid

      if (!userId) {
        throw new Error("No authenticated user found")
      }

      return userId
    },

    /**
     * Helper to apply and save theme preference
     */
    _applyThemePreference(theme: string): void {
      const colorMode = useColorMode()
      colorMode.value =
        theme === "system"
          ? "auto"
          : theme === "light" || theme === "dark"
            ? (theme as "light" | "dark")
            : "auto"
      localStorage.setItem("vueuse-color-scheme", theme)
    },

    /**
     * Helper to ensure profile preferences exist
     */
    _ensurePreferences(): void {
      if (!this.profile) return

      if (!this.profile.preferences) {
        this.profile.preferences = {...DEFAULT_USER_PREFERENCES}
      }
    },

    /**
     * Wrapper for async actions to handle loading state and errors
     * @param action The async function to execute
     * @param errorMessage Default error message
     */
    async _executeAction<T>(action: () => Promise<T>, errorMessage: string): Promise<T> {
      if (this.isLoading) return Promise.reject(new Error("Action in progress"))

      this.isLoading = true
      this.error = null

      try {
        return await action()
      } catch (error) {
        this.error = errorMessage
        console.error(`${errorMessage}:`, error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch user profile from Firestore
     */
    async fetchProfile() {
      return this._executeAction(async () => {
        const userId = this._getCurrentUserId()
        const db = getFirestore()
        const userRef = doc(db, "USERS", userId)
        const userDoc = await getDoc(userRef)

        if (!userDoc.exists()) {
          // Create default profile
          const auth = getAuth()
          const defaultProfile: Partial<UserProfile> = {
            id: userId,
            email: auth.currentUser?.email || "",
            displayName: auth.currentUser?.displayName || "",
            photoURL:
              auth.currentUser?.photoURL ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            role: "student",
            preferences: {...DEFAULT_USER_PREFERENCES},
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          }

          await setDoc(userRef, defaultProfile)
          this.profile = defaultProfile as UserProfile
        } else {
          // Use existing profile data
          const userData = userDoc.data()

          // Ensure preferences exist
          userData.preferences = userData.preferences || {...DEFAULT_USER_PREFERENCES}

          // Update last login
          userData.lastLogin = new Date().toISOString()
          await updateDoc(userRef, {lastLogin: userData.lastLogin})

          this.profile = {id: userId, ...userData} as UserProfile
        }

        // Apply theme
        this._applyThemePreference(this.profile.preferences?.theme || "system")

        return this.profile
      }, "Error al cargar el perfil")
    },

    /**
     * Update user profile in Firestore
     */
    async updateProfile(data: Partial<UserProfile>) {
      return this._executeAction(async () => {
        const userId = this._getCurrentUserId()

        if (!this.profile) {
          throw new Error("Profile not initialized")
        }

        // Prepare update data with timestamp
        const updateData = {
          ...data,
          updatedAt: new Date().toISOString(),
        }

        // Update local state
        this.profile = {
          ...this.profile,
          ...updateData,
        }

        // Update in Firestore
        const db = getFirestore()
        const userRef = doc(db, "USERS", userId)
        await updateDoc(userRef, updateData)

        // Log activity
        this.logActivity({
          type: "profile_update",
          description: "Perfil actualizado",
          metadata: data,
          userId: this.profile.id,
          createdAt: new Date().toISOString(),
        })

        return this.profile
      }, "Error al actualizar el perfil")
    },

    /**
     * Update user settings in Firestore
     */
    async updateSettings(settings: UserSettings) {
      return this._executeAction(async () => {
        const userId = this._getCurrentUserId()

        if (!this.profile) {
          throw new Error("Profile not initialized")
        }

        this._ensurePreferences()

        // Update local state
        this.profile.preferences = {
          ...this.profile.preferences,
          ...settings,
        }
        this.profile.updatedAt = new Date().toISOString()

        // Update in Firestore
        const db = getFirestore()
        const userRef = doc(db, "USERS", userId)
        await updateDoc(userRef, {
          preferences: this.profile.preferences,
          updatedAt: this.profile.updatedAt,
        })

        // Apply theme changes
        const theme = settings.theme || this.profile.preferences.theme || "system"
        this._applyThemePreference(theme)

        // Log activity
        this.logActivity({
          type: "settings_update",
          description: "Preferencias actualizadas",
          metadata: settings,
          userId: this.profile.id,
          createdAt: new Date().toISOString(),
        })

        return this.profile.preferences
      }, "Error al actualizar las preferencias")
    },

    /**
     * Upload user photo to Firebase Storage with progress tracking
     */
    async uploadPhoto(file: File, progressCallback?: (progress: number) => void) {
      return this._executeAction(async () => {
        const userId = this._getCurrentUserId()

        if (!this.profile) {
          throw new Error("Profile not initialized")
        }

        // Validate file type and size
        if (!file.type.startsWith("image/")) {
          throw new Error("El archivo debe ser una imagen")
        }

        if (file.size > 5 * 1024 * 1024) {
          // 5MB limit
          throw new Error("La imagen no puede superar los 5MB")
        }

        // Delete previous profile photo if it exists and isn't a default avatar
        if (
          this.profile.photoURL &&
          this.profile.photoURL.includes("firebasestorage.googleapis.com") &&
          !this.profile.photoURL.includes("dicebear")
        ) {
          try {
            // Extract path from URL - this is a simplistic approach
            const storage = getStorage()
            const oldPhotoPath = this.profile.photoURL.split("?")[0].split("/o/")[1]
            if (oldPhotoPath) {
              const decodedPath = decodeURIComponent(oldPhotoPath)
              const oldPhotoRef = storageRef(storage, decodedPath)
              await deleteObject(oldPhotoRef)
              console.log("Previous profile photo deleted")
            }
          } catch (error) {
            console.warn("Failed to delete previous profile photo:", error)
            // Continue with upload even if delete fails
          }
        }

        // Create a storage reference with a unique name
        const storage = getStorage()
        const fileExtension = file.name.split(".").pop() || "jpg"
        const fileName = `profile_photos/${userId}/${Date.now()}_profile.${fileExtension}`
        const fileRef = storageRef(storage, fileName)

        // Start upload with progress tracking
        const uploadTask = uploadBytesResumable(fileRef, file)

        // Create a promise to track upload completion
        const uploadPromise = new Promise<string>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              if (progressCallback) {
                progressCallback(progress)
              }
            },
            (error) => {
              console.error("Upload failed:", error)
              reject(new Error("Error al subir la imagen. Intente nuevamente."))
            },
            async () => {
              try {
                // Get download URL and update profile
                const photoURL = await getDownloadURL(uploadTask.snapshot.ref)
                resolve(photoURL)
              } catch (error) {
                console.error("Failed to get download URL:", error)
                reject(new Error("Error al obtener la URL de la imagen."))
              }
            }
          )
        })

        // Wait for upload to complete
        const photoURL = await uploadPromise

        // Update local state
        this.profile.photoURL = photoURL
        this.profile.updatedAt = new Date().toISOString()

        // Update in Firestore
        const db = getFirestore()
        const userRef = doc(db, "USERS", userId)
        await updateDoc(userRef, {
          photoURL,
          updatedAt: this.profile.updatedAt,
        })

        // Log activity
        this.logActivity({
          type: "photo_update",
          description: "Foto de perfil actualizada",
          metadata: {
            photoURL,
            fileSize: file.size,
            fileType: file.type,
            timestamp: new Date().toISOString(),
          },
          userId: this.profile.id,
          createdAt: new Date().toISOString(),
        })

        return photoURL
      }, "Error al subir la foto")
    },

    /**
     * Mark a notification as read
     */
    markNotificationAsRead(notificationId: string) {
      const notification = this.notifications.find((n: Notification) => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    },

    /**
     * Log user activity
     */
    logActivity(activity: ActivityLog) {
      this.activityLogs.unshift(activity)

      // Limit to 100 entries
      if (this.activityLogs.length > 100) {
        this.activityLogs.pop()
      }
    },

    /**
     * Merge additional user data from Firebase into the profile
     * This function combines data from Firestore with the current profile data
     */
    async mergeFirebaseData(userData: any) {
      return this._executeAction(async () => {
        if (!this.profile) {
          throw new Error("Profile not initialized")
        }

        // Merge the user data with current profile
        this.profile = {
          ...this.profile,
          ...userData,
          // Ensure we keep existing preferences but merge with new ones if provided
          preferences: {
            ...(this.profile.preferences || DEFAULT_USER_PREFERENCES),
            ...(userData.preferences || {}),
          },
        }

        // Apply theme preference if it exists in the merged data
        if (userData.preferences?.theme) {
          this._applyThemePreference(userData.preferences.theme)
        }

        // Log activity for tracking purposes
        this.logActivity({
          type: "data_merge",
          description: "Datos adicionales sincronizados",
          userId: this.profile.id,
          createdAt: new Date().toISOString(),
        })

        return this.profile
      }, "Error al fusionar datos adicionales del usuario")
    },

    /**
     * Check and award achievements based on user stats
     */
    async checkAchievements() {
      if (!this.profile || !this.profile.stats) return

      const {stats} = this.profile

      // Check for 100 classes achievement
      if (stats.totalClasses >= 100 && !this.hasAchievement("hundred-classes")) {
        await this.awardAchievement({
          id: "hundred-classes",
          title: "¡100 Clases!",
          description: "Ha completado 100 clases",
          icon: "🎓",
          criteria: "Complete 100 clases",
          points: 100,
          category: "teaching",
        })
      }

      // Check for top rating achievement
      if (stats.averageRating >= 4.8 && !this.hasAchievement("top-rated")) {
        await this.awardAchievement({
          id: "top-rated",
          title: "Altamente Valorado",
          description: "Mantuvo un promedio de calificación superior a 4.8",
          icon: "⭐",
          criteria: "Mantener un promedio de calificación superior a 4.8",
          points: 150,
          category: "performance",
        })
      }
    },

    /**
     * Check if user has an achievement
     */
    hasAchievement(achievementId: string): boolean {
      return !!this.profile?.achievements?.some((a: Achievement) => a.id === achievementId)
    },

    /**
     * Award an achievement to the user
     */
    async awardAchievement(achievement: Achievement) {
      if (!this.profile) return

      // Initialize achievements array if needed
      if (!this.profile.achievements) {
        this.profile.achievements = []
      }

      // Add achievement with timestamp
      const achievementWithTimestamp = {
        ...achievement,
        earnedAt: new Date().toISOString(),
      }

      this.profile.achievements.push(achievementWithTimestamp)

      // Add notification
      this.notifications.unshift({
        id: Date.now().toString(),
        type: "success",
        title: "¡Nuevo Logro!",
        message: `Has desbloqueado "${achievement.title}"`,
        read: false,
        createdAt: new Date().toISOString(),
      })

      // Log activity
      this.logActivity({
        type: "achievement_earned",
        description: `Logro desbloqueado: ${achievement.title}`,
        metadata: achievement,
        userId: this.profile.id,
        createdAt: new Date().toISOString(),
      })

      // Save to Firestore
      try {
        const userId = this._getCurrentUserId()
        const db = getFirestore()
        const userRef = doc(db, "USERS", userId)
        await updateDoc(userRef, {
          achievements: this.profile.achievements,
        })
      } catch (error) {
        console.error("Error saving achievement to Firestore:", error)
      }
    },
  },
})
