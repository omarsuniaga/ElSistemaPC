import { defineStore } from 'pinia'
import { 
  addTeacherToFirebase, 
  updateTeacherInFirebase, 
  deleteTeacherFromFirebase, 
  fetchTeachersFromFirebase,
  fetchTeacherByIdFromFirebase,
} from '../services/teachers'
import type { Teacher, TeacherData } from '../types/teachers'
import { TeacherStatus } from '../types/teachers'
import { useClassesStore } from '../../Classes/store/classes'
import { useScheduleStore } from '../../Schedules/store/schedule'
import { useAuthStore } from '../../../stores/auth'
import { getFirestore, getDoc, doc, query, collection, where, getDocs } from 'firebase/firestore'
import type { WeeklySchedule, TeacherScheduleSummary } from '../types/teachers'
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
    photoURL: teacher.photoURL || teacher.photo || teacher.avatar || '',
    status: teacher.status === 'ACTIVE' || teacher.status === 'activo' ? 'activo' :
            teacher.status === 'INACTIVE' || teacher.status === 'inactivo' ? 'inactivo' : 'pendiente',
    biography: teacher.biography || teacher.bio || '',
    createdAt: teacher.createdAt ? new Date(teacher.createdAt) : new Date(),
    updatedAt: teacher.updatedAt ? new Date(teacher.updatedAt) : undefined,
    experiencia: teacher.experiencia || teacher.experience || '',
    address: teacher.address || '',
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
};

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
    activeTeachers: (state) => state.teachers.filter((teacher: TeacherData) => teacher.status === 'activo'),
    // Busca un maestro por su nombre (búsqueda parcial, case insensitive).
    getTeacherByName: (state) => (name: string) => {
      return state.teachers.find((teacher: TeacherData) => (teacher.name || '').toLowerCase().includes(name.toLowerCase()))
    },
    // Busca un maestro por ID.
    getTeacherById: (state) => (id: string) => state.teachers.find((teacher: TeacherData) => teacher.id === id),
    // Filtra maestros que tengan la especialidad indicada.
    getTeachersBySpecialty: (state) => (specialty: string) => {
      return state.teachers.filter((teacher: TeacherData) =>
        teacher.specialties?.some((s: string) => s.toLowerCase().includes(specialty.toLowerCase()))
      )
    },
    // Devuelve la lista de maestros ordenada alfabéticamente.
    sortedTeachers: (state) => [...state.teachers].sort((a, b) => a.name.localeCompare(b.name)),
    // Devuelve la Uid del maestro con la session activa
    getCurrentTeacherUid: (state) => {
      const authStore = useAuthStore()
      return authStore.user?.uid || null
    },
  },

  actions: {

    async currentTeacher() {
      const authStore = useAuthStore()
      const currentTeacherUid = authStore.user?.uid || null
      if (!currentTeacherUid) {
        console.error('No hay usuario autenticado')
        return null
      }
      const teacher = this.teachers.find((teacher: TeacherData) => teacher.uid === currentTeacherUid)
      if (teacher) {
        return teacher
      }
      const db = getFirestore()
      const teachersCollection = collection(db, 'MAESTROS')
      const q = query(teachersCollection, where("uid", "==", currentTeacherUid))
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        const teacherDoc = querySnapshot.docs[0]
        const teacherData = { id: teacherDoc.id, ...teacherDoc.data() }
        return normalizeTeacherData(teacherData)
      } else {
        console.warn('No se encontró maestro en Firebase')
        return null
      }
  },
    /* === CRUD BASICO === */

    /**
     * Obtiene todos los maestros desde Firebase y actualiza el store.
     */
    async fetchTeachers() {
      return await withLoading(this, async () => {
        const teachers = await fetchTeachersFromFirebase()
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
        // Convertir los datos al formato que espera el servicio.
        const teacherData: Omit<Teacher, 'id'> = {
          uid: teacher.uid || '',
          name: teacher.name,
          email: teacher.email || '',
          phone: teacher.phone,
          photoURL: teacher.photoURL,
          biography: teacher.biography,
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
        const teacherUpdates: Partial<Teacher> = {}
        if (updates.name !== undefined) teacherUpdates.name = updates.name
        if (updates.email !== undefined) teacherUpdates.email = updates.email
        if (updates.phone !== undefined) teacherUpdates.phone = updates.phone
        if (updates.photoURL !== undefined) teacherUpdates.photoURL = updates.photoURL
        if (updates.biography !== undefined) teacherUpdates.biography = updates.biography
        if (updates.specialties !== undefined) teacherUpdates.specialties = updates.specialties
        if (updates.experiencia !== undefined) teacherUpdates.experience = updates.experiencia
        if (updates.address !== undefined) teacherUpdates.address = updates.address
        if (updates.status !== undefined) {
          teacherUpdates.status = updates.status === 'activo' ? TeacherStatus.ACTIVE :
                                  updates.status === 'inactivo' ? TeacherStatus.INACTIVE : TeacherStatus.ON_LEAVE
        }
        // Actualizar en Firebase.
        await updateTeacherInFirebase(id, teacherUpdates)
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
        await deleteTeacherFromFirebase(id)
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
          return { weeklyHours: 0, totalClasses: 0, schedule: { dayOfWeek: '', startTime: '', endTime: '' }, hasConflicts: false }
        }
        const schedule: WeeklySchedule[] = []
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
        return { weeklyHours: totalHours, totalClasses: classes.length, schedule: sortedSchedule.length > 0 ? sortedSchedule[0] : { dayOfWeek: '', startTime: '', endTime: '' }, hasConflicts }
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
    },

    /**
     * Busca un maestro basado en su ID de autenticación (auth UID)
     */
    async fetchTeacherByAuthUid(authUid: string) {
      try {
        // Intentar primero buscar en la memoria caché
        const cachedTeacher = this.teachers.find(t => t.uid === authUid)
        if (cachedTeacher) {
          return cachedTeacher
        }
        
        // Si no está en caché, buscar en Firebase
        const db = getFirestore()
        const teachersCollection = collection(db, 'MAESTROS')
        const q = query(teachersCollection, where("uid", "==", authUid))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          const teacherDoc = querySnapshot.docs[0]
          const teacherData = { id: teacherDoc.id, ...teacherDoc.data() }
          return normalizeTeacherData(teacherData)
        }
        return null
      } catch (error) {
        console.error('Error al buscar maestro por auth UID:', error)
        return null
      }
    },

    /**
     * Obtiene las clases donde el maestro es asistente (clases compartidas)
     */
    async getSharedClasses(teacherId: string) {
      try {
        const db = getFirestore()
        const classesCollection = collection(db, 'CLASES')
        
        // Buscar clases donde el maestro aparece en el array de teachers como asistente
        const q = query(classesCollection, where("teachers", "array-contains-any", [
          { teacherId: teacherId }
        ]))
        
        const querySnapshot = await getDocs(q)
        const sharedClasses = []
        
        for (const doc of querySnapshot.docs) {
          const classData = { id: doc.id, ...doc.data() }
          
          // Verificar que el maestro esté en la lista de asistentes
          const isAssistant = classData.teachers?.some((teacher: any) => 
            teacher.teacherId === teacherId && teacher.role === 'assistant'
          )
          
          if (isAssistant) {
            // Obtener información del maestro principal
            const mainTeacher = await this.fetchTeacherById(classData.teacherId)
            
            sharedClasses.push({
              ...classData,
              isShared: true,
              mainTeacherName: mainTeacher?.name || 'Maestro Principal',
              teacherRole: 'assistant',
              sharedWith: classData.teacherId
            })
          }
        }
        
        return sharedClasses
      } catch (error) {
        console.error('Error al obtener clases compartidas:', error)
        return []
      }
    },
  }
})
