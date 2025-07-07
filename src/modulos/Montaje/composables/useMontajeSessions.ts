import { ref, computed } from 'vue'
import type { MontajeSession, SessionEvaluation } from '../types/montaje'

const sessions = ref<MontajeSession[]>([])
const loading = ref(false)

export function useMontajeSessions() {
  const createSession = async (sessionData: Omit<MontajeSession, 'id' | 'createdAt'>): Promise<string> => {
    loading.value = true
    
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const newSession: MontajeSession = {
        ...sessionData,
        id: sessionId,
        createdAt: new Date().toISOString()
      }
      
      sessions.value.push(newSession)
      
      // Save to storage
      await saveSession(newSession)
      
      return sessionId
    } finally {
      loading.value = false
    }
  }

  const loadSessions = async (projectId: string) => {
    loading.value = true
    
    try {
      // Load from localStorage or API
      const savedSessions = localStorage.getItem(`montaje_sessions_${projectId}`)
      if (savedSessions) {
        sessions.value = JSON.parse(savedSessions)
      }
    } finally {
      loading.value = false
    }
  }

  const updateSession = async (sessionId: string, updates: Partial<MontajeSession>) => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return

    Object.assign(session, updates)
    await saveSession(session)
  }

  const addSessionEvaluation = async (sessionId: string, evaluation: SessionEvaluation) => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return

    session.evaluations.push(evaluation)
    await saveSession(session)
  }

  const getSessionsByWork = (workId: string) => {
    return sessions.value.filter(s => s.workId === workId)
  }

  const getUpcomingSessions = (days: number = 7) => {
    const now = new Date()
    const future = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000))
    
    return sessions.value.filter(s => {
      const sessionDate = new Date(s.date)
      return sessionDate >= now && sessionDate <= future
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const saveSession = async (session: MontajeSession) => {
    try {
      // Update in memory
      const index = sessions.value.findIndex(s => s.id === session.id)
      if (index !== -1) {
        sessions.value[index] = session
      }
      
      // Save to localStorage
      const projectSessions = sessions.value.filter(s => s.projectId === session.projectId)
      localStorage.setItem(`montaje_sessions_${session.projectId}`, JSON.stringify(projectSessions))
      
      // TODO: Save to backend/Firebase
      console.log('Session saved:', session.id)
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  return {
    sessions: computed(() => sessions.value),
    loading: computed(() => loading.value),
    createSession,
    loadSessions,
    updateSession,
    addSessionEvaluation,
    getSessionsByWork,
    getUpcomingSessions
  }
}