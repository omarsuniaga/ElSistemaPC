import { defineStore } from 'pinia'
import { useColorMode } from '@vueuse/core'
import type { UserProfile, UserSettings, Achievement, Notification, ActivityLog } from '../types'

// Demo profile with complete data structure
const demoProfile: UserProfile = {
  id: 'demo-user',
  email: 'demo@example.com',
  displayName: 'Demo User',
  role: 'director',
  photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  phoneNumber: '+1234567890',
  preferences: {
    theme: localStorage.getItem('vueuse-color-scheme') || 'system', // Get saved theme
    emailNotifications: true,
    language: 'es',
    timezone: 'America/Mexico_City',
    accessibility: {
      highContrast: false,
      fontSize: 'medium',
      reduceMotion: false
    },
    notifications: {
      email: true,
      push: true,
      inApp: true
    },
    privacy: {
      profileVisibility: 'public',
      activitySharing: true
    }
  },
  bio: 'Director de academia con más de 10 años de experiencia en educación musical.',
  location: 'Ciudad de México',
  socialLinks: {
    website: 'https://example.com',
    linkedin: 'https://linkedin.com/in/demo',
    twitter: 'https://twitter.com/demo'
  },
  achievements: [
    {
      id: 'first-class',
      title: 'Primera Clase',
      description: 'Completó su primera clase exitosamente',
      earnedAt: '2024-01-15T00:00:00Z'
    }
  ],
  stats: {
    totalClasses: 150,
    totalStudents: 45,
    averageRating: 4.8,
    completionRate: 95
  },
  lastLogin: new Date().toISOString(),
  createdAt: '2024-01-01T00:00:00Z'
}

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null as UserProfile | null,
    notifications: [] as Notification[],
    activityLogs: [] as ActivityLog[],
    isLoading: false,
    error: null as string | null,
    availableLanguages: [
      { code: 'es', name: 'Español' },
      { code: 'en', name: 'English' }
    ],
    availableTimezones: [
      'America/Mexico_City',
      'America/New_York',
      'America/Los_Angeles',
      'Europe/Madrid'
    ]
  }),

  getters: {
    isComplete: (state) => {
      if (!state.profile) return false
      return !!(
        state.profile.displayName &&
        state.profile.email &&
        state.profile.phoneNumber &&
        state.profile.bio
      )
    },
    currentTheme: (state) => {
      return state.profile?.preferences.theme || 'system'
    },
    unreadNotifications: (state) => {
      return state.notifications.filter(n => !n.read)
    },
    recentActivity: (state) => {
      return state.activityLogs.slice(0, 5)
    }
  },

  actions: {
    async fetchProfile() {
      if (this.isLoading) return
      
      this.isLoading = true
      this.error = null

      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // For demo, use static profile data
        this.profile = { ...demoProfile }
        
        // Apply saved theme
        const colorMode = useColorMode()
        colorMode.value = this.profile.preferences.theme === 'system' ? 'light' : this.profile.preferences.theme
        
        return this.profile
      } catch (error) {
        this.error = 'Error al cargar el perfil'
        console.error('Error fetching profile:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateProfile(data: Partial<UserProfile>) {
      if (this.isLoading) return
      
      this.isLoading = true
      this.error = null

      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (this.profile) {
          this.profile = {
            ...this.profile,
            ...data,
            updatedAt: new Date().toISOString()
          }
          
          // Log activity
          this.logActivity({
            type: 'profile_update',
            description: 'Perfil actualizado',
            metadata: data,
            userId: this.profile.id,
            createdAt: new Date().toISOString()
          })
        } else {
          throw new Error('Profile not initialized')
        }
      } catch (error) {
        this.error = 'Error al actualizar el perfil'
        console.error('Error updating profile:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateSettings(settings: UserSettings) {
      if (this.isLoading) return
      
      this.isLoading = true
      this.error = null

      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (this.profile) {
          this.profile.preferences = {
            ...this.profile.preferences,
            ...settings
          }
          this.profile.updatedAt = new Date().toISOString()

          // Update theme and save to localStorage
          const colorMode = useColorMode()
          colorMode.value = settings.theme === 'system' ? 'light' : settings.theme
          localStorage.setItem('vueuse-color-scheme', settings.theme)

          // Log activity
          this.logActivity({
            type: 'settings_update',
            description: 'Preferencias actualizadas',
            metadata: settings,
            userId: this.profile.id,
            createdAt: new Date().toISOString()
          })
        } else {
          throw new Error('Profile not initialized')
        }
      } catch (error) {
        this.error = 'Error al actualizar las preferencias'
        console.error('Error updating settings:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async uploadPhoto(file: File) {
      if (this.isLoading) return
      
      this.isLoading = true
      this.error = null

      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (!this.profile) {
          throw new Error('Profile not initialized')
        }

        const photoURL = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
        this.profile.photoURL = photoURL
        this.profile.updatedAt = new Date().toISOString()

        // Log activity
        this.logActivity({
          type: 'photo_update',
          description: 'Foto de perfil actualizada',
          metadata: { photoURL },
          userId: this.profile.id,
          createdAt: new Date().toISOString()
        })

        return photoURL
      } catch (error) {
        this.error = 'Error al subir la foto'
        console.error('Error uploading photo:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async markNotificationAsRead(notificationId: string) {
      const notification = this.notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    },

    logActivity(activity: ActivityLog) {
      this.activityLogs.unshift(activity)
      // Keep only last 100 activities
      if (this.activityLogs.length > 100) {
        this.activityLogs.pop()
      }
    },

    async checkAchievements() {
      if (!this.profile) return

      const stats = this.profile.stats
      if (!stats) return

      // Example achievement checks
      if (stats.totalClasses >= 100 && !this.hasAchievement('hundred-classes')) {
        await this.awardAchievement({
          id: 'hundred-classes',
          title: '¡100 Clases!',
          description: 'Ha completado 100 clases',
          icon: '🎓',
          criteria: 'Complete 100 clases',
          points: 100,
          category: 'teaching'
        })
      }

      if (stats.averageRating >= 4.8 && !this.hasAchievement('top-rated')) {
        await this.awardAchievement({
          id: 'top-rated',
          title: 'Altamente Valorado',
          description: 'Mantuvo un promedio de calificación superior a 4.8',
          icon: '⭐',
          criteria: 'Mantener un promedio de calificación superior a 4.8',
          points: 150,
          category: 'performance'
        })
      }
    },

    hasAchievement(achievementId: string) {
      return this.profile?.achievements?.some(a => a.id === achievementId)
    },

    async awardAchievement(achievement: Achievement) {
      if (!this.profile) return

      if (!this.profile.achievements) {
        this.profile.achievements = []
      }

      this.profile.achievements.push({
        ...achievement,
        earnedAt: new Date().toISOString()
      })

      // Add notification
      this.notifications.unshift({
        id: Date.now().toString(),
        type: 'success',
        title: '¡Nuevo Logro!',
        message: `Has desbloqueado "${achievement.title}"`,
        read: false,
        createdAt: new Date().toISOString()
      })

      // Log activity
      this.logActivity({
        type: 'achievement_earned',
        description: `Logro desbloqueado: ${achievement.title}`,
        metadata: achievement,
        userId: this.profile.id,
        createdAt: new Date().toISOString()
      })
    }
  }
})