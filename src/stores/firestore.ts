import { defineStore } from 'pinia'
import { getAuth } from 'firebase/auth'
import { 
  getCollection, 
  getDocument, 
  createDocument, 
  updateDocument, 
  deleteDocument,
} from '../services/firestore'
import { getStudentsByClass } from '../services/firestore/studentsByClass'
import { 
  getObservations, 
  addObservation, 
  deleteObservation 
} from '../services/firestore/observations'

export const useFirestoreStore = defineStore('firestore', {
  state: () => ({
    lastResponse: null as any,
    error: null as string | null,
    isLoading: false
  }),

  actions: {
    async executeQuery(collectionName: string, operation: 'get' | 'getAll' | 'add' | 'update' | 'delete', data?: any, id?: string) {
      const auth = getAuth()
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado')
      }

      this.isLoading = true
      this.error = null

      try {
        let response;

        switch (operation) {
          case 'getAll':
            response = await getCollection(collectionName)
            break

          case 'get':
            if (!id) throw new Error('ID es requerido para obtener un documento')
            response = await getDocument(collectionName, id)
            break

          case 'add':
            await createDocument(collectionName, {
              ...data,
              createdBy: auth.currentUser.uid,
              createdAt: new Date().toISOString()
            })
            response = { id: data.id, ...data }
            break

          case 'update':
            if (!id) throw new Error('ID es requerido para actualizar')
            await updateDocument(collectionName, id, {
              ...data,
              updatedBy: auth.currentUser.uid,
              updatedAt: new Date().toISOString()
            })
            response = { id, ...data }
            break

          case 'delete':
            if (!id) throw new Error('ID es requerido para eliminar')
            await deleteDocument(collectionName, id)
            response = { id }
            break
        }

        this.lastResponse = response
        console.log(`Firestore ${operation} response:`, response)
        return response

      } catch (error) {
        console.error(`Firestore ${operation} error:`, error)
        this.error = error instanceof Error ? error.message : 'Error en operación de Firestore'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getStudentsByClass(className: string) {
      this.isLoading = true
      this.error = null

      try {
        // Usamos el servicio específico para estudiantes por clase
        const students = await getStudentsByClass(className)
        return students
      } catch (error) {
        console.error('Error getting students by class:', error)
        this.error = error instanceof Error ? error.message : 'Error getting students by class'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Funciones que usan el servicio de observaciones
    async getObservations(attendanceId: string) {
      this.isLoading = true
      this.error = null

      try {
        const observations = await getObservations(attendanceId)
        return observations
      } catch (error) {
        console.error('Error al obtener observaciones:', error)
        this.error = error instanceof Error ? error.message : 'Error al obtener observaciones'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async addObservation(observation: any) {
      this.isLoading = true
      this.error = null

      try {
        const result = await addObservation(observation)
        return result
      } catch (error) {
        console.error('Error al agregar observación:', error)
        this.error = error instanceof Error ? error.message : 'Error al agregar observación'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteObservation(observationId: string) {
      this.isLoading = true
      this.error = null

      try {
        await deleteObservation(observationId)
        return { success: true }
      } catch (error) {
        console.error('Error al eliminar observación:', error)
        this.error = error instanceof Error ? error.message : 'Error al eliminar observación'
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})