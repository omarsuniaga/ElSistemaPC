import { defineStore } from 'pinia'
import { UserSession } from "../types/user"
import { doc, collection, addDoc, query, where, getDocs, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase'

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
    },

    // Obtener sesiones activas
    getActiveSessions: (state) => {
      return state.sessions.filter(session => !session.endTime)
    }
  },
  
  actions: {
    // Obtener sesiones de un usuario
    async getUserSessions(userId: string) {
      this.loading = true
      
      try {
        // Consultar sesiones del usuario en Firestore
        const sessionsRef = collection(db, 'USER_SESSIONS')
        const q = query(sessionsRef, where("userId", "==", userId))
        const snapshot = await getDocs(q)
        
        // Actualizar el estado con las sesiones obtenidas
        const userSessions: UserSession[] = []
        snapshot.forEach(doc => {
          const data = doc.data() as Omit<UserSession, 'id'>
          userSessions.push({
            id: doc.id,
            ...data,
          })
        })
        
        // Actualizar el estado local
        this.sessions = this.sessions
          .filter(session => session.userId !== userId) // Eliminar sesiones antiguas
          .concat(userSessions) // Agregar nuevas sesiones
          
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
        // Guardar la sesión en Firestore
        const sessionsRef = collection(db, 'USER_SESSIONS')
        const docRef = await addDoc(sessionsRef, {
          ...session,
          startTime: new Date(),
        })
        
        // Crear el objeto de sesión completo
        const newSession: UserSession = {
          id: docRef.id,
          ...session,
          startTime: new Date()
        }
        
        // Actualizar el estado local
        this.sessions.push(newSession)
        
        // Actualizar también la última conexión en el perfil del usuario
        const userDocRef = doc(db, 'USERS', session.userId)
        await updateDoc(userDocRef, {
          lastLogin: new Date()
        })
        
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
        // Actualizar la sesión en Firestore
        const sessionRef = doc(db, 'USER_SESSIONS', sessionId)
        await updateDoc(sessionRef, {
          endTime: new Date()
        })
        
        // Actualizar el estado local
        const sessionIndex = this.sessions.findIndex(s => s.id === sessionId)
        
        if (sessionIndex >= 0) {
          this.sessions[sessionIndex] = {
            ...this.sessions[sessionIndex],
            endTime: new Date()
          }
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
    },
    
    // Registrar una acción en una sesión activa
    async recordAction(sessionId: string, action: string) {
      try {
        // Buscar la sesión en Firestore
        const sessionRef = doc(db, 'USER_SESSIONS', sessionId)
        const sessionDoc = await getDoc(sessionRef)
        
        if (sessionDoc.exists()) {
          const sessionData = sessionDoc.data()
          const actions = sessionData.actions || []
          
          // Actualizar las acciones
          await updateDoc(sessionRef, {
            actions: [...actions, action]
          })
          
          // Actualizar el estado local
          const sessionIndex = this.sessions.findIndex(s => s.id === sessionId)
          if (sessionIndex >= 0) {
            const currentActions = this.sessions[sessionIndex].actions || []
            this.sessions[sessionIndex].actions = [...currentActions, action]
          }
          
          return true
        } else {
          throw new Error('Sesión no encontrada')
        }
      } catch (error: any) {
        console.error('Error al registrar acción:', error)
        this.error = error.message
        return false
      }
    },
    
    // Limpiar datos de sesiones
    clearSessions() {
      this.sessions = []
    }
  }
})
