import { ref, computed } from 'vue'
import { firebaseService } from '../services/FirebaseService'
import type { MontajeUser, AuthSession, UserPreferences } from '../types/auth'

const authSession = ref<AuthSession>({
  user: null,
  token: null,
  isAuthenticated: false,
  permissions: [],
  currentProject: null
})

export function useMontajeAuth() {
  const login = async (email: string, password: string) => {
    try {
      // Usar Firebase Authentication del proyecto principal
      const firebaseUser = await firebaseService.signIn(email, password)
      
      if (!firebaseUser) {
        throw new Error('Error de autenticación')
      }

      // Obtener datos del usuario desde Firestore
      let userData = await firebaseService.getDocument('montaje_users', firebaseUser.uid)
      
      // Si no existe, crear perfil por defecto
      if (!userData) {
        const defaultUserData = {
          email: firebaseUser.email || email,
          name: firebaseUser.displayName || email.split('@')[0],
          role: 'musician',
          instruments: [],
          experience: 'intermediate',
          projects: [],
          preferences: getDefaultPreferences(),
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
        
        await firebaseService.setDocument('montaje_users', firebaseUser.uid, defaultUserData)
        userData = { id: firebaseUser.uid, ...defaultUserData }
      }
      
      const montajeUser: MontajeUser = {
        id: firebaseUser.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        instruments: userData.instruments || [],
        experience: userData.experience || 'intermediate',
        projects: userData.projects || [],
        preferences: userData.preferences || getDefaultPreferences(),
        createdAt: userData.createdAt,
        lastLogin: new Date().toISOString()
      }
      
      authSession.value = {
        user: montajeUser,
        token: await firebaseUser.getIdToken(),
        isAuthenticated: true,
        permissions: getPermissionsForRole(montajeUser.role),
        currentProject: montajeUser.projects[0] || null
      }
      
      // Actualizar último login
      await firebaseService.updateDocument('montaje_users', firebaseUser.uid, {
        lastLogin: firebaseService.serverTimestamp()
      })
      
      // Save to localStorage
      localStorage.setItem('montaje_auth', JSON.stringify({
        ...authSession.value,
        token: null // No guardar token en localStorage
      }))
      
      return montajeUser
    } catch (error) {
      console.error('Login error:', error)
      throw new Error('Error de autenticación: ' + (error as Error).message)
    }
  }

  const logout = async () => {
    try {
      await firebaseService.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    authSession.value = {
      user: null,
      token: null,
      isAuthenticated: false,
      permissions: [],
      currentProject: null
    }
    
    localStorage.removeItem('montaje_auth')
  }

  const restoreSession = async () => {
    try {
      // Verificar si hay un usuario autenticado en Firebase
      const firebaseUser = firebaseService.getCurrentUser()
      
      if (firebaseUser) {
        // Restaurar datos del usuario desde Firestore
        const userData = await firebaseService.getDocument('montaje_users', firebaseUser.uid)
        
        if (userData) {
          const montajeUser: MontajeUser = {
            id: firebaseUser.uid,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            instruments: userData.instruments || [],
            experience: userData.experience || 'intermediate',
            projects: userData.projects || [],
            preferences: userData.preferences || getDefaultPreferences(),
            createdAt: userData.createdAt,
            lastLogin: userData.lastLogin
          }
          
          authSession.value = {
            user: montajeUser,
            token: await firebaseUser.getIdToken(),
            isAuthenticated: true,
            permissions: getPermissionsForRole(montajeUser.role),
            currentProject: montajeUser.projects[0] || null
          }
          
          return
        }
      }
      
      // Si no hay usuario de Firebase, verificar localStorage como fallback
      const saved = localStorage.getItem('montaje_auth')
      if (saved) {
        const parsedSession = JSON.parse(saved)
        if (parsedSession.user) {
          authSession.value = {
            ...parsedSession,
            token: null // No restaurar token desde localStorage
          }
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error)
      logout()
    }
  }

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!authSession.value.user) return

    const updatedPreferences = {
      ...authSession.value.user.preferences,
      ...preferences
    }

    authSession.value.user.preferences = updatedPreferences
    
    // Actualizar en Firestore
    try {
      await firebaseService.updateDocument('montaje_users', authSession.value.user.id, {
        preferences: updatedPreferences
      })
      
      // Actualizar localStorage
      localStorage.setItem('montaje_auth', JSON.stringify({
        ...authSession.value,
        token: null
      }))
    } catch (error) {
      console.error('Error updating preferences:', error)
    }
  }

  const hasPermission = (resource: string, action: string): boolean => {
    return authSession.value.permissions.includes(`${resource}:${action}`) ||
           authSession.value.permissions.includes(`${resource}:*`) ||
           authSession.value.permissions.includes('*:*')
  }

  const getPermissionsForRole = (role: string): string[] => {
    const permissions: Record<string, string[]> = {
      admin: ['*:*'],
      director: [
        'works:*',
        'evaluations:*',
        'reports:*',
        'members:*',
        'settings:*',
        'analytics:*'
      ],
      assistant: [
        'works:read',
        'works:update',
        'evaluations:*',
        'reports:read',
        'members:read',
        'analytics:read'
      ],
      musician: [
        'works:read',
        'evaluations:read',
        'evaluations:create',
        'reports:read'
      ]
    }
    
    return permissions[role] || []
  }

  const getDefaultPreferences = (): UserPreferences => ({
    language: 'es',
    timezone: 'America/Mexico_City',
    notifications: {
      email: true,
      push: true,
      evaluationReminders: true,
      sessionReminders: true,
      progressAlerts: true,
      milestoneNotifications: true
    },
    display: {
      theme: 'light',
      compactMode: false,
      defaultView: 'grid',
      showAdvancedMetrics: false
    }
  })

  return {
    user: computed(() => authSession.value.user),
    isAuthenticated: computed(() => authSession.value.isAuthenticated),
    currentProject: computed(() => authSession.value.currentProject),
    login,
    logout,
    restoreSession,
    updatePreferences,
    hasPermission
  }
}