import { defineStore } from 'pinia'
import type { Class } from '../types/class'
// Importar directamente del services/classes.ts con nombres de funciones consistentes
import { 
  fetchClasses, 
  addClass, 
  updateClass, 
  deleteClass 
} from '../services/classes';

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

  actions: {
    async fetchClasses() {
      this.loading = true;
      try {
        this.classes = await fetchClasses(); // Llama a la función del servicio
      } catch (error) {
        this.error = 'Error al cargar las clases';
        console.error(error);
      } finally {
        this.loading = false;
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
        await addClass(newClass) 
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
        await updateClass(classData)
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
        await deleteClass(id)
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
        // Simulated API call
        await new Promise(resolve => setTimeout(resolve, 500))
        const index = this.classes.findIndex((c: Class) => c.id === classId)
        if (index !== -1) {
          if (!this.classes[index].studentIds.includes(studentId)) {
            this.classes[index].studentIds.push(studentId)
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
        // Simulated API call
        await new Promise(resolve => setTimeout(resolve, 500))
        const index = this.classes.findIndex((c: Class) => c.id === classId)
        if (index !== -1) {
          this.classes[index].studentIds = this.classes[index].studentIds.filter(id => id !== studentId)
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
