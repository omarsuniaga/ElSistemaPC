import { defineStore } from 'pinia'
import { fetchContents, fetchContentById, createContent, updateContent, deleteContent } from '../services/contents'
import type { Content } from '../types/content'

export const useContentsStore = defineStore('contents', {
  state: () => ({
    contents: [] as Content[],
    loading: false,
    error: null as string | null,
    lastSync: null as Date | null
  }),
  
  getters: {
    getContentById: (state) => (id: string) => {
      return state.contents.find(content => content.id === id)
    },
    
    getContentsByCategory: (state) => (category: string) => {
      return state.contents.filter(content => content.category === category)
    },
    
    sortedContents: (state) => {
      return [...state.contents].sort((a, b) => {
        // Sort by createdAt date if available
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        
        // Fallback to title sorting
        return a.title.localeCompare(b.title)
      })
    }
  },
  
  actions: {
    async fetchContents() {
      this.loading = true
      this.error = null
      
      try {
        console.log('🔄 Consultando contenidos en Firestore...')
        const contents = await fetchContents()
        console.log(`✅ Contenidos recuperados: ${contents.length}`)
        
        this.contents = contents
        this.lastSync = new Date()
        return this.contents
      } catch (error: any) {
        console.error('❌ Error al obtener contenidos:', error)
        this.error = error.message
        return []
      } finally {
        this.loading = false
      }
    },
    
    async getContentDetail(id: string) {
      if (!id) return null
      
      try {
        // Check if the content is already in the store
        const existingContent = this.getContentById(id)
        if (existingContent) return existingContent
        
        // Otherwise fetch it from the service
        return await fetchContentById(id)
      } catch (error: any) {
        console.error(`❌ Error al obtener contenido ${id}:`, error)
        this.error = error.message
        return null
      }
    },
    
    async addContent(content: Omit<Content, 'id'>) {
      this.loading = true
      
      try {
        const newContent = await createContent(content)
        this.contents.push(newContent)
        return newContent
      } catch (error: any) {
        console.error('❌ Error al crear contenido:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async updateContent(id: string, updates: Partial<Content>) {
      this.loading = true
      
      try {
        await updateContent(id, updates)
        
        // Update in the local state
        const index = this.contents.findIndex(c => c.id === id)
        if (index !== -1) {
          this.contents[index] = { ...this.contents[index], ...updates }
        }
        
        return this.contents[index]
      } catch (error: any) {
        console.error(`❌ Error al actualizar contenido ${id}:`, error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async deleteContent(id: string) {
      this.loading = true
      
      try {
        await deleteContent(id)
        this.contents = this.contents.filter(c => c.id !== id)
      } catch (error: any) {
        console.error(`❌ Error al eliminar contenido ${id}:`, error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})