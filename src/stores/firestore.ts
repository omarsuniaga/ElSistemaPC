import { defineStore } from 'pinia'
import { db } from '../firebase'
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import type { Student } from '../types'

// Nombre de la colección para las observaciones
const OBSERVATIONS_COLLECTION = 'OBSERVACIONES'

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
        let response

        switch (operation) {
          case 'getAll':
            const querySnapshot = await getDocs(collection(db, collectionName))
            response = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            break

          case 'get':
            if (!id) throw new Error('ID es requerido para obtener un documento')
            const docSnap = await getDoc(doc(db, collectionName, id))
            response = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
            break

          case 'add':
            const addedDoc = await addDoc(collection(db, collectionName), {
              ...data,
              createdBy: auth.currentUser.uid,
              createdAt: new Date().toISOString()
            })
            response = { id: addedDoc.id, ...data }
            break

          case 'update':
            if (!id) throw new Error('ID es requerido para actualizar')
            await updateDoc(doc(db, collectionName, id), {
              ...data,
              updatedBy: auth.currentUser.uid,
              updatedAt: new Date().toISOString()
            })
            response = { id, ...data }
            break

          case 'delete':
            if (!id) throw new Error('ID es requerido para eliminar')
            await deleteDoc(doc(db, collectionName, id))
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
        const q = query(
          collection(db, 'ALUMNOS'),
          where('grupo', 'array-contains', className)
        )
        const querySnapshot = await getDocs(q)
        const students = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        return students
      } catch (error) {
        console.error('Error getting students by class:', error)
        this.error = error instanceof Error ? error.message : 'Error getting students by class'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Nuevas funciones para manejar observaciones
    async getObservations(attendanceId: string) {
      this.isLoading = true
      this.error = null

      try {
        // Intenta primero con la consulta ordenada
        try {
          const q = query(
            collection(db, OBSERVATIONS_COLLECTION),
            where('asistenciaId', '==', attendanceId),
            orderBy('fecha', 'desc')
          )
          const querySnapshot = await getDocs(q)
          return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        } catch (indexError: any) {
          // Si el error es por falta de índice, usar consulta alternativa sin ordenamiento
          if (indexError?.message?.includes('requires an index')) {
            console.warn('Se requiere un índice para esta consulta. Usando consulta alternativa sin ordenamiento.')
            console.warn('Cree el índice en: https://console.firebase.google.com/v1/r/project/orquestapuntacana/firestore/indexes')
            
            // Consulta alternativa sin ordenamiento
            const q = query(
              collection(db, OBSERVATIONS_COLLECTION),
              where('asistenciaId', '==', attendanceId)
            )
            const querySnapshot = await getDocs(q)
            const results = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            
            // Ordenar manualmente los resultados
            return results.sort((a, b) => {
              const dateA = new Date(a.fecha).getTime()
              const dateB = new Date(b.fecha).getTime()
              return dateB - dateA // Orden descendente
            })
          } else {
            // Si es otro tipo de error, relanzarlo
            throw indexError
          }
        }
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
        const docRef = await addDoc(collection(db, OBSERVATIONS_COLLECTION), {
          ...observation,
          createdAt: new Date().toISOString()
        })
        return { id: docRef.id, ...observation }
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
        await deleteDoc(doc(db, OBSERVATIONS_COLLECTION, observationId))
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