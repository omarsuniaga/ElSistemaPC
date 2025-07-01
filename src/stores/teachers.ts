import {defineStore} from "pinia"
import {db} from "../firebase"
import {collection, doc, getDoc, getDocs, query, where} from "firebase/firestore"
import type {TeacherScheduleSummary} from "../modulos/Teachers/types/teachers"

export const useTeachersStore = defineStore("teachers", {
  state: () => ({
    teachers: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    /**
     * Obtiene todos los profesores de Firestore
     */
    async fetchTeachers() {
      try {
        this.loading = true
        this.error = null
        const teachersCollection = collection(db, "TEACHERS")
        const querySnapshot = await getDocs(teachersCollection)

        this.teachers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        return this.teachers
      } catch (error: any) {
        console.error("Error al obtener profesores:", error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async getTeacherSchedule(teacherId: string): Promise<TeacherScheduleSummary> {
      try {
        const teacherDoc = await getDoc(doc(db, "teachers", teacherId))
        if (!teacherDoc.exists()) {
          throw new Error("Profesor no encontrado")
        }

        const classesQuery = query(collection(db, "CLASES"), where("teacherId", "==", teacherId))
        const classesSnapshot = await getDocs(classesQuery)

        const schedule = classesSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            className: data.name,
            dayOfWeek: data.schedule?.day || "No programado",
            startTime: data.schedule?.startTime || "",
            endTime: data.schedule?.endTime || "",
            room: data.classroom || "Sin asignar",
            studentCount: (data.studentIds || []).length,
            students: data.students || [],
          }
        })

        return {
          totalClasses: schedule.length,
          weeklyHours: this.calculateWeeklyHours(schedule),
          schedule,
        }
      } catch (error: any) {
        throw new Error("Error al cargar el horario: " + error.message)
      }
    },

    calculateWeeklyHours(schedule: any[]): number {
      return schedule.reduce((total, item) => {
        if (!item.startTime || !item.endTime) return total

        const [startHour, startMinute] = item.startTime.split(":").map(Number)
        const [endHour, endMinute] = item.endTime.split(":").map(Number)

        const duration = endHour - startHour + (endMinute - startMinute) / 60
        return total + (duration > 0 ? duration : 0)
      }, 0)
    },
  },
})
