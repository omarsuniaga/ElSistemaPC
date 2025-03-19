import { defineStore } from 'pinia'
import type { Class } from '../types/class'
import { 
  fetchClassesFirebase,
  addClassFirebase,
  updateClassFirebase,
  deleteClassFirebase
} from '../services/firestore/classes'

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
      state.classes.find(c => String(c.id) === String(id)),
    // Nuevo getter para contar estudiantes por nombre de clase
    getStudentCountByClassName: (state) => (className: string): number => {
      const classItem = state.classes.find(c => c.name === className);
      return classItem && Array.isArray(classItem.studentIds) 
        ? classItem.studentIds.length 
        : 0;
    },
    // Nueva función: Obtener los IDs de estudiantes de una clase por nombre o ID
    getStudentIdsByClass: (state) => (classIdentifier: string): string[] => {
      // Buscar por ID primero
      let classItem = state.classes.find(c => String(c.id) === String(classIdentifier));
      
      // Si no encontramos por ID, buscar por nombre
      if (!classItem) {
        classItem = state.classes.find(c => c.name === classIdentifier);
      }
      
      // Devolver los IDs de estudiantes si encontramos la clase, o un array vacío
      return classItem && Array.isArray(classItem.studentIds) 
        ? classItem.studentIds 
        : [];
    }
  },

  actions: {
    async fetchClasses() {
      this.loading = true
      try {
        const data = await fetchClassesFirebase()
        console.log(`✅ Clases recuperadas: ${data.length}`)        
        
        // Transform the data to ensure schedule is in the correct format
        const transformedData = data.map(classItem => ({
          ...classItem,
          id: String(classItem.id), // Ensure ID is string
          schedule: typeof classItem.schedule === 'string' 
            ? { days: [], startTime: '', endTime: '' } 
            : {
                days: classItem.schedule?.days || [],
                startTime: classItem.schedule?.startTime || '',
                endTime: classItem.schedule?.endTime || ''
              },
          studentIds: classItem.studentIds || []
        }));

        this.classes = transformedData
        return transformedData
      } catch (error) {
        this.error = 'Error al cargar las clases'
        console.error('Error fetching classes:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createClass(classData: Class) {
      this.loading = true
      try {
        // Prepare class data with required fields
        const classToCreate = {
          ...classData,
          studentIds: classData.studentIds || [],
          schedule: classData.schedule || { days: [], startTime: '', endTime: '' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contentIds: [] // Ensure property exists
        }
        
        // Save to Firestore and get the new ID
        const newId = await addClassFirebase(classToCreate as Omit<Class, 'id'> & { createdAt: string })
        console.log('✅ Nueva clase creada con ID:', newId)
        
        // Create final class object with the assigned ID
        const finalClass: Class = {
          ...classToCreate,
          id: newId
        }
        
        // Add to local store
        this.classes.unshift(finalClass)
        return finalClass
      } catch (error) {
        this.error = 'Error al crear la clase'
        console.error('Error creating class:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateClass(classData: Class) {
      this.loading = true;
      try {
        // Validar el ID
        if (!classData.id) {
          throw new Error('ID de clase requerido para actualización');
        }
        
        const stringId = String(classData.id);
        console.log('🔄 Preparando actualización en store para clase:', stringId);
        
        // Verificar si la clase existe en el estado local
        const existsLocally = this.classes.some(c => String(c.id) === stringId);
        console.log(`¿La clase ${stringId} existe localmente?`, existsLocally);
        
        // Preparar datos normalizados
        const completeData = {
          ...classData,
          id: stringId,
          name: classData.name || '',
          teacherId: classData.teacherId || '',
          studentIds: Array.isArray(classData.studentIds) ? classData.studentIds : [],
          level: classData.level || 'Iniciación',
          instrument: classData.instrument || '',
          schedule: classData.schedule && typeof classData.schedule === 'object' 
            ? classData.schedule 
            : { days: [], startTime: '', endTime: '' },
          updatedAt: new Date().toISOString(),
          contentIds: Array.isArray(classData.contentIds) ? classData.contentIds : []
        };
        
        // Actualizar en Firebase primero
        console.log('📤 Enviando datos a Firebase:', completeData);
        await updateClassFirebase(stringId, completeData);
        
        // Actualizar el estado local después
        const index = this.classes.findIndex(c => String(c.id) === stringId);
        if (index !== -1) {
          console.log('✏️ Actualizando clase existente en el store local');
          this.classes[index] = completeData;
        } else {
          console.log('➕ Añadiendo nueva clase al store local');
          this.classes.push(completeData);
        }
        
        console.log('✅ Actualización completada con éxito');
        return completeData;
      } catch (error) {
        this.error = 'Error al actualizar la clase';
        console.error('❌ Error en updateClass:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteClass(id: string) {
      this.loading = true
      try {
        const stringId = String(id)
        console.log('🗑️ Eliminando clase:', stringId)
        
        // Delete from Firestore
        await deleteClassFirebase(stringId)
        
        // Update local store
        const index = this.classes.findIndex(c => String(c.id) === stringId)
        if (index !== -1) {
          this.classes.splice(index, 1)
          console.log('✅ Clase eliminada localmente');
        } else {
          console.log('⚠️ No se encontró la clase localmente para eliminar');
        }
        
        return true
      } catch (error) {
        this.error = 'Error al eliminar la clase'
        console.error('❌ Error al eliminar clase:', error);
        throw error
      } finally {
        this.loading = false
      }
    },

    async addStudentToClass(classId: string, studentId: string) {
      this.loading = true
      try {
        console.log(`Intentando agregar estudiante ${studentId} a la clase ${classId}`);
        
        // Buscar la clase usando la comparación de strings
        const index = this.classes.findIndex((c: Class) => String(c.id) === String(classId))
        
        if (index !== -1) {
          console.log(`Clase encontrada en índice ${index}:`, this.classes[index]);
          
          // Inicializar studentIds como array vacío si no existe
          if (!this.classes[index].studentIds) {
            this.classes[index].studentIds = [];
          }
          
          // Verificar si el estudiante ya está en la clase
          if (!this.classes[index].studentIds.includes(studentId)) {
            this.classes[index].studentIds.push(studentId);
            
            // Crear una copia del objeto para actualizar
            const classToUpdate = { ...this.classes[index] };
            
            console.log(`Actualizando clase con nuevos datos:`, classToUpdate);
            await this.updateClass(classToUpdate);
            return true;
          }
        } else {
          console.error(`No se encontró la clase con ID: ${classId}`);
          console.log(`Clases disponibles:`, this.classes.map(c => ({ id: c.id, name: c.name })));
          throw new Error(`Clase no encontrada con ID: ${classId}`);
        }
      } catch (error) {
        this.error = 'Error al agregar estudiante a la clase';
        console.error(error);
        throw error
      } finally {
        this.loading = false
      }
    },

    async removeStudentFromClass(classId: string, studentId: string) {
      this.loading = true
      try {
        const index = this.classes.findIndex((c: Class) => String(c.id) === String(classId))
        if (index !== -1) {
          // Asegurarnos de que studentIds es un array
          if (!this.classes[index].studentIds) {
            this.classes[index].studentIds = [];
          }
          
          this.classes[index].studentIds = this.classes[index].studentIds.filter(id => id !== studentId)
          
          // Crear una copia del objeto para actualizar
          const classToUpdate = { ...this.classes[index] };
          
          await this.updateClass(classToUpdate)
          return true
        }
        throw new Error(`Clase no encontrada con ID: ${classId}`)
      } catch (error) {
        this.error = 'Error al eliminar estudiante de la clase'
        console.error(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    updateClassStudents(classId: string, studentIds: string[]) {
      const classIndex = this.classes.findIndex(c => String(c.id) === String(classId))
      if (classIndex !== -1) {
        this.classes[classIndex] = { ...this.classes[classIndex], studentIds }
      }
    },
    
    // Nueva acción para obtener los IDs de estudiantes por clase
    getStudentToClass(classIdentifier: string): string[] {
      // Utilizamos el getter que creamos
      return this.getStudentIdsByClass(classIdentifier);
    }
  }
})
