import { defineStore } from 'pinia'
import { 
  addTeacherToFirebase, 
  updateTeacherInFirebase, 
  deleteTeacherFromFirebase, 
  fetchTeachersFromFirebase 
} from '../services/teachers'
import type { Teacher, TeacherData } from '../types/teachers'
import { TeacherStatus } from '../types/teachers'
import { useClassesStore } from '../../Classes/store/classes'
import { useScheduleStore } from '../../Schedules/store/schedule'
import { getFirestore, getDoc, doc, query, collection, where, getDocs } from 'firebase/firestore'

/**
 * Tipo para definir la estructura de un horario semanal.
 */
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

/**
 * Interfaz para resumir el horario de un profesor.
 */
interface TeacherScheduleSummary {
  weeklyHours: number;
  totalClasses: number;
  schedule: WeeklySchedule;
  hasConflicts: boolean;
}

/**
 * Función para normalizar los datos que vienen de Firebase
 * y convertirlos al formato TeacherData.
 */
function normalizeTeacherData(teacher: any): TeacherData {
  return {
    id: teacher.id,
    uid: teacher.uid,
    name: teacher.name,
    email: teacher.email,
    phone: teacher.phone,
    specialties: teacher.specialties || [],
    photoURL: teacher.photo || teacher.avatar,
    status: teacher.status === TeacherStatus.ACTIVE ? 'activo' : 
            teacher.status === TeacherStatus.INACTIVE ? 'inactivo' : 'pendiente',
    biography: teacher.bio,
    createdAt: new Date(teacher.createdAt),
    updatedAt: teacher.updatedAt ? new Date(teacher.updatedAt) : undefined,
    experiencia: teacher.experience,
    address: teacher.address,
  }
}

/**
 * Helper para manejar el estado "loading" y capturar errores de forma centralizada.
 * Se utiliza en cada acción asíncrona.
 */
async function withLoading<T>(store: any, action: () => Promise<T>): Promise<T> {
  store.loading = true
  store.error = null
  try {
    return await action()
  } catch (error: any) {
    store.error = error.message || 'Error inesperado'
    throw error
  } finally {
    store.loading = false
  }
}

export const useTeachersStore = defineStore('teacher', {
  state: () => ({
    teachers: [] as TeacherData[],
    loading: false,
    error: null as string | null,
    lastSync: null as Date | null
  }),

  getters: {
    // Devuelve la lista completa de maestros.
    items: (state) => state.teachers,
    // Filtra los maestros activos.
    activeTeachers: (state) => state.teachers.filter(teacher => teacher.status === 'activo'),
    // Busca un maestro por su nombre (búsqueda parcial, case insensitive).
    getTeacherByName: (state) => (name: string) => {
      return state.teachers.find(teacher => (teacher.name || '').toLowerCase().includes(name.toLowerCase()))
    },
    // Busca un maestro por ID.
    getTeacherById: (state) => (id: string) => state.teachers.find(teacher => teacher.id === id),
    // Filtra maestros que tengan la especialidad indicada.
    getTeachersBySpecialty: (state) => (specialty: string) => {
      return state.teachers.filter(teacher =>
        teacher.specialties?.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
      )
    },
    // Devuelve la lista de maestros ordenada alfabéticamente.
    sortedTeachers: (state) => [...state.teachers].sort((a, b) => a.name.localeCompare(b.name))
  },

  actions: {
    /* === CRUD BASICO === */

    /**
     * Obtiene todos los maestros desde Firebase y actualiza el store.
     */
    async fetchTeachers() {
      return await withLoading(this, async () => {
        console.log('🔍 Consultando maestros desde el servicio...')
        const teachers = await fetchTeachersFromFirebase()
        console.log(`✅ Se encontraron ${teachers.length} maestros`)
        const formattedTeachers = teachers.map(normalizeTeacherData)
        this.teachers = formattedTeachers
        this.lastSync = new Date()
        return this.teachers
      })
    },

    /**
     * Compatibilidad con el patrón BaseStore para obtener items.
     */
    async fetchItems() {
      return this.fetchTeachers()
    },

    /**
     * Agrega un nuevo maestro. Recibe un objeto sin el ID.
     */
    async addTeacher(teacher: Omit<TeacherData, 'id'>) {
      return await withLoading(this, async () => {
        console.log('📝 Preparando datos para crear nuevo maestro...')
        // Convertir los datos al formato que espera el servicio.
        const teacherData: Omit<Teacher, 'id'> = {
          uid: teacher.uid || '',
          name: teacher.name,
          email: teacher.email || '',
          phone: teacher.phone,
          photo: teacher.photoURL,
          bio: teacher.biography,
          specialties: teacher.specialties || [],
          status: teacher.status === 'activo' ? TeacherStatus.ACTIVE :
                  teacher.status === 'inactivo' ? TeacherStatus.INACTIVE : TeacherStatus.ON_LEAVE,
          hireDate: new Date(),
          hourlyRate: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        // Crear el maestro en Firebase.
        const newTeacher = await addTeacherToFirebase(teacherData)
        console.log('✅ Maestro creado correctamente con ID:', newTeacher.id)
        const newTeacherData = normalizeTeacherData(newTeacher)
        this.teachers.push(newTeacherData)
        return newTeacherData
      })
    },

    /**
     * Compatibilidad con BaseStore para agregar un item.
     */
    async addItem(teacher: Omit<TeacherData, 'id'>) {
      return this.addTeacher(teacher)
    },

    /**
     * Actualiza los datos de un maestro existente.
     * @param id - ID del maestro a actualizar.
     * @param updates - Objeto con las propiedades a actualizar.
     */
    async updateTeacher(id: string, updates: Partial<TeacherData>) {
      return await withLoading(this, async () => {
        console.log(`📝 Actualizando maestro con ID: ${id}`)
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
        // Actualizar en Firebase.
        await updateTeacherInFirebase(id, teacherUpdates)
        console.log('✅ Maestro actualizado correctamente')
        const index = this.teachers.findIndex(item => item.id === id)
        if (index !== -1) {
          this.teachers[index] = { ...this.teachers[index], ...updates }
        }
        return this.teachers[index]
      })
    },

    /**
     * Compatibilidad con BaseStore para actualizar un item.
     */
    async updateItem(id: string, updates: Partial<TeacherData>) {
      return this.updateTeacher(id, updates)
    },

    /**
     * Elimina un maestro por su ID.
     */
    async deleteTeacher(id: string) {
      return await withLoading(this, async () => {
        console.log(`🗑️ Eliminando maestro con ID: ${id}`)
        await deleteTeacherFromFirebase(id)
        console.log('✅ Maestro eliminado correctamente')
        this.teachers = this.teachers.filter(item => item.id !== id)
      })
    },

    /**
     * Compatibilidad con BaseStore para eliminar un item.
     */
    async deleteItem(id: string) {
      return this.deleteTeacher(id)
    },

    /* === FUNCIONES AUXILIARES Y DE DATOS CRUZADOS === */

    /**
     * Obtiene las clases asociadas a un maestro.
     * Se consulta el store de Clases y se filtra por el teacherId.
     */
    async getTeacherClasses(teacherId: string) {
      try {
        const classesStore = useClassesStore()
        await classesStore.fetchClasses()
        return classesStore.classes.filter(classItem => classItem.teacherId === teacherId)
      } catch (error: any) {
        console.error('❌ Error al obtener clases del profesor:', error)
        this.error = error.message
        throw error
      }
    },

    /**
     * Obtiene el horario consolidado de un maestro.
     * Calcula el total de horas, organiza el horario semanal y detecta conflictos.
     */
    async getTeacherSchedule(teacherId: string): Promise<TeacherScheduleSummary> {
      try {
        const classes = await this.getTeacherClasses(teacherId)
        if (!classes || classes.length === 0) {
          return { weeklyHours: 0, totalClasses: 0, schedule: [], hasConflicts: false }
        }
        const schedule: WeeklySchedule = []
        let totalHours = 0
        const timeSlots = new Map<string, string[]>()

        for (const classData of classes) {
          if (classData.schedule && Array.isArray(classData.schedule)) {
            for (const slot of classData.schedule) {
              const daySchedule = {
                dayOfWeek: slot.day || slot.dia,
                startTime: slot.startTime || slot.horaInicio,
                endTime: slot.endTime || slot.horaFin,
                className: classData.name,
                classId: classData.id,
                room: slot.room || slot.salon,
                studentCount: classData.studentIds?.length || 0,
                students: await this.getStudentsForClass(classData.id)
              }
              // Calcular duración de la sesión.
              const start = new Date(`2000-01-01 ${daySchedule.startTime}`)
              const end = new Date(`2000-01-01 ${daySchedule.endTime}`)
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
              totalHours += hours

              // Verificar posibles conflictos en horarios.
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
        const hasConflicts = Array.from(timeSlots.values()).some(slots => slots.length > 1)
        const daysOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        const sortedSchedule = schedule.sort((a, b) => {
          const dayDiff = daysOrder.indexOf(a.dayOfWeek) - daysOrder.indexOf(b.dayOfWeek)
          if (dayDiff !== 0) return dayDiff
          return a.startTime.localeCompare(b.startTime)
        })
        return { weeklyHours: totalHours, totalClasses: classes.length, schedule: sortedSchedule, hasConflicts }
      } catch (error: any) {
        console.error('❌ Error al obtener horario del profesor:', error)
        throw error
      }
    },

    /**
     * Obtiene los alumnos inscritos en una clase dada.
     */
    async getStudentsForClass(classId: string) {
      try {
        const db = getFirestore()
        const classDocRef = doc(db, 'CLASES', classId)
        const classDocSnap = await getDoc(classDocRef)
        const classData = classDocSnap.data()
        if (!classData?.studentIds?.length) return []
        const q = query(collection(db, 'ALUMNOS'), where('id', 'in', classData.studentIds))
        const studentsSnapshot = await getDocs(q)
        return studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }))
      } catch (error) {
        console.error('Error al obtener ALUMNOS de la clase:', error)
        return []
      }
    },

    /**
     * Obtiene métricas relacionadas con el horario del profesor.
     */
    async getTeacherMetrics(teacherId: string) {
      const scheduleStore = useScheduleStore()
      await scheduleStore.fetchAllSchedules()
      return scheduleStore.getTeacherMetrics(teacherId)
    },

    /**
     * Forzar sincronización de maestros.
     */
    async forceSync() {
      return this.fetchTeachers()
    }
  }
})
