import { defineStore } from 'pinia'
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { cacheService } from '../services/cacheService'

export interface BaseState<T> {
  items: T[]
  loading: boolean
  error: string | null
  lastSync: Date | null
}

export function createBaseStore<T extends { id: string }>(
  storeName: string,
  collectionName: string
) {
  return defineStore(storeName, {
    state: (): BaseState<T> => ({
      items: [],
      loading: false,
      error: null,
      lastSync: null
    }),

    actions: {
      async fetchItems() {
        this.loading = true
        this.error = null
        
        try {
          // Primero intentar obtener del caché
          const cachedData = await cacheService.getAllItems(storeName as any)
          
          if (cachedData && cachedData.length > 0) {
            this.items = cachedData
            this.lastSync = new Date()
            
            // Cargar datos de Firebase en segundo plano para mantener caché actualizado
            this.syncWithFirebase()
          } else {
            // Si no hay caché, cargar de Firebase
            await this.syncWithFirebase()
          }
        } catch (error: any) {
          console.error(`Error fetching ${storeName}:`, error)
          this.error = error.message
        } finally {
          this.loading = false
        }
      },

      async syncWithFirebase() {
        try {
          const querySnapshot = await getDocs(collection(db, collectionName))
          const items = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[]

          // Actualizar el store
          this.items = items as unknown as typeof this.items
          this.lastSync = new Date()

          // Actualizar el caché
          await cacheService.syncWithFirebase(storeName as any, items)
        } catch (error: any) {
          console.error(`Error syncing ${storeName} with Firebase:`, error)
          throw error
        }
      },

      async addItem(item: Omit<T, 'id'>) {
        this.loading = true
        this.error = null

        try {
          // Crear nuevo documento en Firebase
          const newDocRef = doc(collection(db, collectionName))
          const newItem = { ...item, id: newDocRef.id } as T
          
          await setDoc(newDocRef, newItem)

          // Actualizar el store y el caché
          this.items.push(newItem)
          await cacheService.setItem(storeName as any, newItem.id, newItem)

          return newItem
        } catch (error: any) {
          console.error(`Error adding ${storeName}:`, error)
          this.error = error.message
          throw error
        } finally {
          this.loading = false
        }
      },

      async updateItem(id: string, updates: Partial<T>) {
        this.loading = true
        this.error = null

        try {
          // Actualizar en Firebase
          const docRef = doc(db, collectionName, id)
          await updateDoc(docRef, updates)

          // Actualizar en el store
          const index = this.items.findIndex(item => item.id === id)
          if (index !== -1) {
            const updatedItem = { ...this.items[index], ...updates }
            this.items[index] = updatedItem
            
            // Actualizar en caché
            await cacheService.setItem(storeName as any, id, updatedItem)
          }
        } catch (error: any) {
          console.error(`Error updating ${storeName}:`, error)
          this.error = error.message
          throw error
        } finally {
          this.loading = false
        }
      },

      async deleteItem(id: string) {
        this.loading = true
        this.error = null

        try {
          // Eliminar de Firebase
          await deleteDoc(doc(db, collectionName, id))

          // Eliminar del store
          this.items = this.items.filter(item => item.id !== id)
          
          // Eliminar del caché
          await cacheService.removeItem(storeName as any, id)
        } catch (error: any) {
          console.error(`Error deleting ${storeName}:`, error)
          this.error = error.message
          throw error
        } finally {
          this.loading = false
        }
      },

      // Método para forzar una sincronización con Firebase
      async forceSync() {
        await this.syncWithFirebase()
      }
    }
  })
}