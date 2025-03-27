import { defineStore } from 'pinia'
import {UserSession} from "../types/user"


export const useUserSessionsStore = defineStore('userSessions', {
  state: () => ({
    sessions: [] as UserSession[],
    loading: false,
    error: null as string | null
  }),
  
  getters: {
    // Obtener todas las sesiones
    getAllSessions: (state) => state.sessions,
    
    // Obtener sesiones de un usuario específico
    getUserSessionsById: (state) => (userId: string) => {
      return state.sessions.filter(session => session.userId === userId)
    }
  },
  
  actions: {
    // Obtener sesiones de un usuario
    async getUserSessions(userId: string) {
      this.loading = true
      
      try {
        // En una implementación real, aquí se haría la llamada a Firebase
        // Por ahora, simplemente devolvemos las sesiones filtradas del estado
        const userSessions = this.sessions.filter(session => session.userId === userId)
        
        // Si no hay sesiones en el estado, devolvemos un array vacío
        // En una implementación real, aquí se consultaría a Firebase
        return userSessions
      } catch (error: any) {
        console.error('Error al obtener sesiones de usuario:', error)
        this.error = error.message
        return []
      } finally {
        this.loading = false
      }
    },
    
    // Registrar una nueva sesión de usuario
    async recordSession(session: Omit<UserSession, 'id'>) {
      this.loading = true
      
      try {
        // Crear un ID único para la sesión
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Crear el objeto de sesión completo
        const newSession: UserSession = {
          id: sessionId,
          ...session,
          startTime: session.startTime || new Date()
        }
        
        // En una implementación real, aquí se guardaría en Firebase
        // Por ahora, solo lo añadimos al estado
        this.sessions.push(newSession)
        
        return newSession
      } catch (error: any) {
        console.error('Error al registrar sesión:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Finalizar una sesión activa
    async endSession(sessionId: string) {
      this.loading = true
      
      try {
        // Buscar la sesión en el estado
        const sessionIndex = this.sessions.findIndex(s => s.id === sessionId)
        
        if (sessionIndex >= 0) {
          // Actualizar el tiempo de finalización
          this.sessions[sessionIndex] = {
            ...this.sessions[sessionIndex],
            endTime: new Date()
          }
          
          // En una implementación real, aquí se actualizaría en Firebase
          return this.sessions[sessionIndex]
        } else {
          throw new Error('Sesión no encontrada')
        }
      } catch (error: any) {
        console.error('Error al finalizar sesión:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
