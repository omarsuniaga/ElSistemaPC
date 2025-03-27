import { defineStore } from 'pinia'
import { addTeacherToFirebase, updateTeacherInFirebase, deleteTeacherFromFirebase, fetchTeachersFromFirebase } from '../services/teachers'
import type { Teacher, TeacherData } from '../types/teachers'
import { TeacherStatus } from '../types/teachers'
import { useClassesStore } from '../../Classes/store/classes'
import { useScheduleStore } from '../../Schedules/store/schedule'
import { getFirestore, getDoc, doc, query, collection, where, getDocs } from 'firebase/firestore'

// Define the WeeklySchedule type locally since it's not exported from the schedule module
type WeeklySchedule = Array<{
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  className?: string;
  classId?: string;
  room?: string;
  studentCount?: number;
  students?: any[];
}>;

// Agregar la interfaz para tipar el resumen de horario
interface TeacherScheduleSummary {
  weeklyHours: number;
  totalClasses: number;
  schedule: WeeklySchedule;
  hasConflicts: boolean;
}

export const useTeachersStore = defineStore('teacher', {
  state: () => ({
    teachers: [] as TeacherData[],
    loading: false,
    error: null as string | null,
    lastSync: null as Date | null
  }),

  getters: {
    items: (state) => state.teachers,

    activeTeachers: (state) => {
      return state.teachers.filter(teacher =>
        teacher.status === 'activo' // Manteniendo en español según tu definición de TeacherData
      )
    },

    getTeacherByName: (state) => (name: string) => {
      return state.teachers.find(teacher => {
        const teacherName = teacher.name || ''
        return teacherName.toLowerCase().includes(name.toLowerCase())
      })
    },

    getTeacherById: (state) => (id: string) => {
      return state.teachers.find(teacher => teacher.id === id)
    },

    // Nuevo getter para filtrar profesores por especialidad
    getTeachersBySpecialty: (state) => (specialty: string) => {
      return state.teachers.filter(teacher =>
        teacher.specialties?.some(s =>
          s.toLowerCase().includes(specialty.toLowerCase())
        )
      )
    },

    // Nuevo getter para obtener todos los maestros ordenados por nombre
    sortedTeachers: (state) => {
      return [...state.teachers].sort((a, b) => a.name.localeCompare(b.name))
    }
  },

  actions: {
    async fetchTeachers() {
      this.loading = true
      this.error = null

      try {
        console.log('🔍 Consultando maestros desde el servicio...')
        const teachers = await fetchTeachersFromFirebase()
        console.log(`✅ Se encontraron ${teachers.length} maestros`)

        // Mapear los datos desde Teacher a TeacherData
        const formattedTeachers = teachers.map(teacher => {
          return {
            id: teacher.id,
            uid: teacher.uid,
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone,
            specialties: teacher.specialties || [],
            photoURL: teacher.photo,
            status: teacher.status === TeacherStatus.ACTIVE ? 'activo' : // Usando el enum para la comparación
                    teacher.status === TeacherStatus.INACTIVE ? 'inactivo' : 'pendiente', // Manteniendo el valor en español
            biography: teacher.bio,
            createdAt: new Date(teacher.createdAt),
            updatedAt: teacher.updatedAt ? new Date(teacher.updatedAt) : undefined,
            // Añadir campos adicionales
            avatar: teacher.photo || teacher.avatar,
            experiencia: teacher.experience,
            address: teacher.address
          } as TeacherData
        });

        // Actualizar el store
        this.teachers = formattedTeachers
        this.lastSync = new Date()

        return this.teachers
      } catch (error: any) {
        console.error('❌ Error al obtener maestros:', error)
        this.error = error.message || 'Error al cargar los maestros'
        return
      } finally {
        this.loading = false
      }
    },

    // Función de compatibilidad con el patrón BaseStore
    async fetchItems() {
      return this.fetchTeachers()
    },

    async addTeacher(teacher: Omit<TeacherData, 'id'>) {
      this.loading = true

      try {
        console.log('📝 Preparando datos para crear nuevo maestro...')

        // Convertir al formato esperado por el servicio
        const teacherData: Omit<Teacher, 'id'> = {
          uid: teacher.uid || '',
          name: teacher.name,
          email: teacher.email || '',
          phone: teacher.phone,
          photo: teacher.photoURL,
          bio: teacher.biography,
          specialties: teacher.specialties || [],
          status: teacher.status === 'activo' ? TeacherStatus.ACTIVE : // Usando el enum para el servicio
                  teacher.status === 'inactivo' ? TeacherStatus.INACTIVE : TeacherStatus.ON_LEAVE, // Usando el enum para el servicio
          hireDate: new Date(),
          hourlyRate: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        // Crear nuevo maestro usando el servicio
        const newTeacher = await addTeacherToFirebase(teacherData)
        console.log('✅ Maestro creado correctamente con ID:', newTeacher.id)

        // Convertir de nuevo al formato TeacherData para el store
        const newTeacherData: TeacherData = {
          id: newTeacher.id,
          uid: newTeacher.uid,
          name: newTeacher.name,
          email: newTeacher.email,
          phone: newTeacher.phone,
          specialties: Array.isArray(newTeacher.specialties) ? newTeacher.specialties : [],
          experiencia: newTeacher.experience,
          photoURL: newTeacher.photo,
          status: newTeacher.status === TeacherStatus.ACTIVE ? 'activo' : // Usando el enum para la comparación
                  newTeacher.status === TeacherStatus.INACTIVE ? 'inactivo' : 'pendiente', // Manteniendo el valor en español
          biography: newTeacher.bio,
          createdAt: newTeacher.createdAt,
          updatedAt: newTeacher.updatedAt,

          avatar: newTeacher.photo || newTeacher.avatar
        }

        // Actualizar el store
        this.teachers.push(newTeacherData)

        return newTeacherData
      } catch (error: any) {
        console.error('❌ Error adding teacher:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Función de compatibilidad
    async addItem(teacher: Omit<TeacherData, 'id'>) {
      return this.addTeacher(teacher)
    },

    async updateTeacher(id: string, updates: Partial<TeacherData>) {
      this.loading = true

      try {
        console.log(`📝 Actualizando maestro con ID: ${id}`)

        // Convertir al formato esperado por el servicio
        const teacherUpdates: Partial<Teacher> = {}

        if (updates.name) teacherUpdates.name = updates.name
        if (updates.email) teacherUpdates.email = updates.email
        if (updates.phone) teacherUpdates.phone = updates.phone
        if (updates.photoURL) teacherUpdates.photo = updates.photoURL
        if (updates.biography) teacherUpdates.bio = updates.biography
        if (updates.specialties) teacherUpdates.specialties = updates.specialties
        if (updates.avatar) teacherUpdates.avatar = updates.avatar
        if (updates.experiencia) teacherUpdates.experience = updates.experiencia
        if (updates.address) teacherUpdates.address = updates.address

        if (updates.status) {
          teacherUpdates.status = updates.status === 'activo' ? TeacherStatus.ACTIVE :
                                  updates.status === 'inactivo' ? TeacherStatus.INACTIVE : TeacherStatus.ON_LEAVE
        }

        // Actualizar en Firebase a través del servicio
        await updateTeacherInFirebase(id, teacherUpdates)
        console.log('✅ Maestro actualizado correctamente')

        // Actualizar en el store
        const index = this.teachers.findIndex(item => item.id === id)
        if (index !== -1) {
          this.teachers[index] = { ...this.teachers[index], ...updates }
        }

        return this.teachers[index]
      } catch (error: any) {
        console.error('❌ Error updating teacher:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Función de compatibilidad
    async updateItem(id: string, updates: Partial<TeacherData>) {
      return this.updateTeacher(id, updates)
    },

    async deleteTeacher(id: string) {
      this.loading = true

      try {
        console.log(`🗑️ Eliminando maestro con ID: ${id}`)

        // Eliminar de Firebase usando el servicio
        await deleteTeacherFromFirebase(id)
        console.log('✅ Maestro eliminado correctamente')

        // Eliminar del store
        this.teachers = this.teachers.filter(item => item.id !== id)
      } catch (error: any) {
        console.error('❌ Error deleting teacher:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Función de compatibilidad
    async deleteItem(id: string) {
      return this.deleteTeacher(id)
    },

    // FUNCIONES DE DATOS CRUZADOS (se mantiene getTeacherClasses y getTeacherSchedule)
    async getTeacherClasses(teacherId: string) {
      try {
        // Obtiene las clases desde el store de clases
        const classesStore = useClassesStore()
        await classesStore.fetchClasses()

        // Filtra las clases por el ID del profesor
        return classesStore.classes.filter((classItem) => 
          classItem.teacherId && classItem.teacherId === teacherId
        )
      } catch (error: any) {
        console.error('❌ Error al obtener clases del profesor:', error)
        this.error = error.message
        throw error
      }
    },

    async getTeacherSchedule(teacherId: string): Promise<TeacherScheduleSummary> {
      try {
        // Obtener las clases del profesor
        const classes = await this.getTeacherClasses(teacherId)
        if (!classes || classes.length === 0) {
          return {
            weeklyHours: 0,
            totalClasses: 0,
            schedule: [],
            hasConflicts: false
          }
        }

        // Procesar horarios de todas las clases
        const schedule: WeeklySchedule= []
        let totalHours = 0
        const timeSlots = new Map<string, string[]>()

        // Procesar cada clase y sus horarios
        for (const classData of classes) {
          if (classData.schedule && Array.isArray(classData.schedule)) {
            for (const slot of classData.schedule) {
              const daySchedule: WeeklySchedule = {
                dayOfWeek: slot.day || slot.dia, // Considerar estandarizar la propiedad en tus datos
                startTime: slot.startTime || slot.horaInicio, // Considerar estandarizar la propiedad en tus datos
                endTime: slot.endTime || slot.horaFin, // Considerar estandarizar la propiedad en tus datos
                className: classData.name,
                classId: classData.id,
                room: slot.room || slot.salon, // Considerar estandarizar la propiedad en tus datos
                studentCount: classData.studentIds?.length || 0,
                students: await this.getStudentsForClass(classData.id)
              }

              // Calcular horas por sesión
              const start = new Date(`2000-01-01 ${daySchedule.startTime}`)
              const end = new Date(`2000-01-01 ${daySchedule.endTime}`)
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
              totalHours += hours

              // Verificar conflictos
              const timeKey = `${daySchedule.dayOfWeek}-${daySchedule.startTime}`
              if (timeSlots.has(timeKey)) {
                const existing = timeSlots.get(timeKey) || []
                timeSlots.set(timeKey, [...existing, classData.id])
              } else {
                timeSlots.set(timeKey, [classData.id])
              }

              schedule.push(daySchedule)
            }
          }
        }

        // Detectar si hay conflictos de horario
        const hasConflicts = Array.from(timeSlots.values()).some(slots => slots.length > 1)

        // Ordenar horario por día y hora
        const sortedSchedule: WeeklySchedule = schedule.sort((a: { dayOfWeek: string; startTime: string }, b: { dayOfWeek: string; startTime: string }) => {
          const days: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
          const dayDiff: number = days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek);
          if (dayDiff !== 0) return dayDiff;
          return a.startTime.localeCompare(b.startTime);
        });

        return {
          weeklyHours: totalHours,
          totalClasses: classes.length,
          schedule: sortedSchedule,
          hasConflicts
        }
      } catch (error: any) {
        console.error('❌ Error al obtener horario del profesor:', error)
        throw error
      }
    },

    async forceSync() {
      return this.fetchTeachers()
    },

    // Nueva función auxiliar para obtener ALUMNOS de una clase
    async getStudentsForClass(classId: string) {
      try {
        const db = getFirestore()
        // Reemplaza llamadas al API de la vieja forma
        const classDocRef = doc(db, 'CLASES', classId)
        const classDocSnap = await getDoc(classDocRef)
        const classData = classDocSnap.data()

        if (!classData?.studentIds?.length) return

        // Usar getDocs y query de Firebase v9
        const q = query(collection(db, 'ALUMNOS'), where('id', 'in', classData.studentIds))
        const studentsSnapshot = await getDocs(q)

        return studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }))
      } catch (error) {
        console.error('Error al obtener ALUMNOS de la clase:', error)
        return
      }
    },

    async getTeacherMetrics(teacherId: string) {
      const scheduleStore = useScheduleStore()
      await scheduleStore.fetchAllSchedules()
      return scheduleStore.getTeacherMetrics(teacherId)
    }
  }
})