import { defineStore } from 'pinia'
import type { Class } from '../types/class'
import { 
  fetchClasses as fetchClassesService,
  addClass as addClassService, 
  updateClass as updateClassService, 
  deleteClass as deleteClassService
} from '../services/classes'
import { getFromLocalStorage, saveToLocalStorage } from '../utils/localStorageUtils'

interface ClassState {
  classes: Class[]
  loading: boolean
  error: string | null
}

export const useClassesStore = defineStore('classes', {
  state: (): ClassState => ({
    classes: [],
    loading: false,
    error: null
  }),

  getters: {
    getClasses: (state): Class[] => state.classes,
    getClassById: (state) => (id: string): Class | undefined => 
      state.classes.find(c => c.id === id)
  },

  actions: {
    async fetchClasses() {
      this.loading = true
      try {
        // Try to get from localStorage first in development
        if (process.env.NODE_ENV === 'development') {
          const cachedClasses = getFromLocalStorage('classes')
          if (cachedClasses) {
            this.classes = cachedClasses
            return cachedClasses
          }
        }

        // If no cache or production, fetch from service
        const classes = await fetchClassesService()
        this.classes = classes

        // Cache in development
        if (process.env.NODE_ENV === 'development') {
          saveToLocalStorage('classes', classes)
        }

        return classes
      } catch (error) {
        this.error = 'Error al cargar las clases'
        console.error(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createClass(classData: Omit<Class, 'id'>) {
      this.loading = true
      try {
        const newClass: Class = {
          ...classData,
          id: String(Date.now()),
          studentIds: []
        }
        await addClassService(newClass) 
        this.classes.push(newClass)
        return newClass
      } catch (error) {
        this.error = 'Error al crear la clase'
        console.error(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateClass(classData: Class) {
      this.loading = true
      try {
        await updateClassService(classData)
        const index = this.classes.findIndex(c => c.id === classData.id)
        if (index !== -1) {
          this.classes[index] = classData
          return classData
        }
        throw new Error('Clase no encontrada')
      } catch (error) {
        this.error = 'Error al actualizar la clase'
        console.error(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteClass(id: string) {
      this.loading = true
      try {
        await deleteClassService(id)
        const index = this.classes.findIndex(c => c.id === id)
        if (index !== -1) {
          this.classes.splice(index, 1)
          return true
        }
        throw new Error('Clase no encontrada')
      } catch (error) {
        this.error = 'Error al eliminar la clase'
        console.error(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async addStudentToClass(classId: string, studentId: string) {
      this.loading = true
      try {
        const index = this.classes.findIndex((c: Class) => c.id === classId)
        if (index !== -1) {
          if (!this.classes[index].studentIds.includes(studentId)) {
            this.classes[index].studentIds.push(studentId)
            await this.updateClass(this.classes[index])
            return true
          }
        }
        throw new Error('Clase no encontrada')
      } catch (error) {
        this.error = 'Error al agregar estudiante a la clase'
        console.error(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async removeStudentFromClass(classId: string, studentId: string) {
      this.loading = true
      try {
        const index = this.classes.findIndex((c: Class) => c.id === classId)
        if (index !== -1) {
          this.classes[index].studentIds = this.classes[index].studentIds.filter(id => id !== studentId)
          await this.updateClass(this.classes[index])
          return true
        }
        throw new Error('Clase no encontrada')
      } catch (error) {
        this.error = 'Error al eliminar estudiante de la clase'
        console.error(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    updateClassStudents(classId: string, studentIds: string[]) {
      const classIndex = this.classes.findIndex(c => c.id === classId)
      if (classIndex !== -1) {
        this.classes[classIndex] = { ...this.classes[classIndex], studentIds }
      }
    }
  }
})
