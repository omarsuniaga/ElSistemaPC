import {defineStore} from "pinia"
import {db} from "../firebase"
import {collection, getDocs, doc, setDoc, deleteDoc, updateDoc} from "firebase/firestore"
import {getEmergencyClassByIdFirebase} from "../modulos/Attendance/service/emergencyClass"

// Constante para el nombre de la colección
const COLLECTION_NAME = "CLASES"

interface Clase {
  id: string
  nombre: string
  teacherId: string // Maestro titular (mantenemos compatibilidad)
  maestros?: {
    titular: string
    colaboradores: string[]
  }
  horario: {
    dia: string
    horaInicio: string
    horaFin: string
  }
  alumnos: string[]
  contenido?: string
  temas?: Array<{
    id: string
    titulo: string
    descripcion?: string
  }>
}

export const useClassesStore = defineStore("classes", {
  state: () => ({
    classes: [] as Clase[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getClassById: (state) => (id: string) => {
      return state.classes.find((clase) => clase.id === id)
    },

    getClassesByTeacher: (state) => (teacherId: string) => {
      return state.classes.filter((clase) => clase.teacherId === teacherId)
    },
  },

  actions: {
    async fetchClasses() {
      this.loading = true
      this.error = null

      try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
        this.classes = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Clase[]

        return this.classes
      } catch (error: any) {
        console.error("Error fetching classes:", error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async addClass(classData: Omit<Clase, "id">) {
      this.loading = true
      this.error = null

      try {
        const newDocRef = doc(collection(db, COLLECTION_NAME))
        const newClass = {
          ...classData,
          id: newDocRef.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await setDoc(newDocRef, newClass)
        this.classes.push(newClass)

        return newClass
      } catch (error: any) {
        console.error("Error adding class:", error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateClass(id: string, updates: Partial<Clase>) {
      this.loading = true
      this.error = null

      try {
        const docRef = doc(db, COLLECTION_NAME, id)
        await updateDoc(docRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        })

        // Actualizar en el store
        const index = this.classes.findIndex((c) => c.id === id)
        if (index !== -1) {
          this.classes[index] = {
            ...this.classes[index],
            ...updates,
          }
        }
      } catch (error: any) {
        console.error("Error updating class:", error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteClass(id: string) {
      this.loading = true
      this.error = null

      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id))
        this.classes = this.classes.filter((c) => c.id !== id)
      } catch (error: any) {
        console.error("Error deleting class:", error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Métodos para manejar temas
    async addTopic(classId: string, topic: {titulo: string; descripcion?: string}) {
      const clase = this.getClassById(classId)
      if (!clase) throw new Error("Clase no encontrada")

      const newTopic = {
        id: Date.now().toString(),
        ...topic,
      }

      const temas = clase.temas || []
      await this.updateClass(classId, {
        temas: [...temas, newTopic],
      })

      return newTopic
    },

    async updateTopic(
      classId: string,
      topicId: string,
      updates: {titulo?: string; descripcion?: string}
    ) {
      const clase = this.getClassById(classId)
      if (!clase) throw new Error("Clase no encontrada")

      const temas = clase.temas || []
      const index = temas.findIndex((t) => t.id === topicId)
      if (index === -1) throw new Error("Tema no encontrado")

      temas[index] = {
        ...temas[index],
        ...updates,
      }

      await this.updateClass(classId, {temas})
    },

    async deleteTopic(classId: string, topicId: string) {
      const clase = this.getClassById(classId)
      if (!clase) throw new Error("Clase no encontrada")

      const temas = clase.temas || []
      await this.updateClass(classId, {
        temas: temas.filter((t) => t.id !== topicId),
      })
    },

    // Método para buscar una clase que incluye clases emergentes
    async findClassById(id: string) {
      // Primero buscar en clases regulares
      const regularClass = this.getClassById(id)
      if (regularClass) {
        return regularClass
      }

      // Si no se encuentra en clases regulares, buscar en clases emergentes
      try {
        const emergencyClass = await getEmergencyClassByIdFirebase(id)
        if (emergencyClass) {
          // Convertir la clase emergente al formato esperado por el store
          return {
            id: emergencyClass.id,
            nombre: emergencyClass.className || "Clase de Emergencia",
            teacherId: emergencyClass.teacherId,
            horario: {
              dia: "Emergencia",
              horaInicio: emergencyClass.startTime || "00:00",
              horaFin: emergencyClass.endTime || "23:59",
            },
            alumnos: emergencyClass.selectedStudents || [],
            contenido: `Clase emergente: ${emergencyClass.reason || "Sin razón especificada"}`,
            isEmergencyClass: true,
          } as Clase & {isEmergencyClass: boolean}
        }
      } catch (error) {
        console.error(`Error buscando clase emergente ${id}:`, error)
      }

      return null
    },
  },
})
