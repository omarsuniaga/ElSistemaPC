import { defineStore } from 'pinia'
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import type { AttendanceRecord, AttendanceStatus, AttendanceAnalytics, Attendance } from '../types'
import AttendanceStats from '../components/AttendanceStats.vue'
import { updateAttendance } from '../services/attendance';
import { getAttendances, addAttendance, updateAttendanceWithJustification } from '../services/attendance';


export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    records: [] as AttendanceRecord[],
    selectedDate: format(new Date(), 'yyyy-MM-dd'),
    selectedClass: '',
    isLoading: false,
    error: null as string | null,
    analytics: null as AttendanceAnalytics | null,
    attendanceRecords: {} as Record<string, AttendanceStatus>,
    levelOptions: ['Básico', 'Intermedio', 'Avanzado'],
    cachedJustifications: {} as Record<string, {
      reason: string,
      file: File | null,
      documentUrl?: string
    }>,
    statusChanges: [] as {
      studentId: number
      date: string
      clase: string
      oldStatus: AttendanceStatus | null
      newStatus: AttendanceStatus
      timestamp: string
    }[]
  }),
  
  getters: {
    getRecordsByDate: (state) => {
      return (date: string) => state.records.filter(record => record.Fecha === date)
    },

    getRecordsByDateAndClass: (state) => {
      return (date: string, className: string) => 
        state.records.filter(record => 
          record.Fecha === date && record.classId === className
        )
    },

    getDatesWithRecords: (state) => {
      return [...new Set(state.records.map(record => record.Fecha))]
    },

    getStudentStatus: (state) => {
      return (studentId: string, date: string, className: string) => {
        const record = state.records.find(r => 
          r.studentId === studentId && 
          r.Fecha === date && 
          r.classId === className
        )
        return record?.status || 'Ausente'
      }
    },

    getStudentAttendanceRate: (state) => {
      return (studentId: string, className: string) => {
        const studentRecords = state.records.filter(r => 
          r.studentId === studentId && r.classId === className
        )
        
        if (!studentRecords.length) return 0

        const presentCount = studentRecords.filter(r => 
          r.status === 'Presente' || r.status === 'Justificado'
        ).length

        return (presentCount / studentRecords.length) * 100
      }
    },

    getMostAbsentStudents: (state) => {
      return (limit: number = 5) => {
        const absences = state.records.reduce((acc, record) => {
          if (record.status === 'Ausente') {
            if (!acc[record.studentId]) {
              acc[record.studentId] = {
                absences: 0,
                lastAttendance: record.Fecha,
                attendanceRate: 0
              }
            }
            acc[record.studentId].absences++
            if (record.Fecha > acc[record.studentId].lastAttendance) {
              acc[record.studentId].lastAttendance = record.Fecha
            }
          }
          return acc
        }, {} as Record<string, { absences: number, lastAttendance: string, attendanceRate: number }>)

        // Calculate attendance rates
        Object.entries(absences).forEach(([studentId, data]) => {
          const totalRecords = state.records.filter(r => r.studentId === studentId).length
          data.attendanceRate = ((totalRecords - data.absences) / totalRecords) * 100
        })

        return Object.entries(absences)
          .sort(([, a], [, b]) => b.absences - a.absences)
          .slice(0, limit)
          .map(([studentId, data]) => ({
            studentId,
            ...data
          }))
      }
    },

    getClassScheduleDays: () => {
      return (className: string) => {
        const classesStore = useClassesStore()
        const class_ = classesStore.classes.find(c => c.name === className)
        
        if (!class_) return []

        // Parse schedule string to get days
        if (typeof class_.schedule === 'string') {
          // Example format: "Lunes y Miércoles 15:00-17:00"
          const schedule = class_.schedule.toLowerCase()
          const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
          return days.filter(day => schedule.toLowerCase().includes(day))
        } else if (class_.schedule && Array.isArray(class_.schedule.days)) {
          return class_.schedule.days
        }
        return []
      }
    },

    getScheduledDatesForClass: () => {
      return (className: string, startDate: string, endDate: string) => {
        const scheduledDays = useAttendanceStore().getClassScheduleDays(className)
        const dayNumbers = scheduledDays.map(day => {
          const dayMap = { 'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6, 'domingo': 0 }
          return dayMap[day as keyof typeof dayMap]
        })

        const dateRange = eachDayOfInterval({
          start: parseISO(startDate),
          end: parseISO(endDate)
        })

        return dateRange.filter(date => dayNumbers.includes(date.getDay()))
      }
    },

    getStatusChanges: (state) => {
      return (studentId: string, date: string, className?: string) => {
        let changes = state.statusChanges
          .filter(change => change.studentId.toString() === studentId && change.date === date)
        
        // Si se proporciona el nombre de la clase, filtramos por clase también
        if (className) {
          changes = changes.filter(change => change.clase === className)
        }
        
        return changes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }
    },
    
    // Nuevo getter para obtener todos los cambios de estado por clase
    getStatusChangesByClass: (state) => {
      return (className: string) => {
        return state.statusChanges
          .filter(change => change.clase === className)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }
    }
  },
  
  actions: {
    async fetchAttendance() {
      this.isLoading = true
      this.error = null
      try {
        // Consultar los registros de asistencia desde el servicio
        const attendances = await getAttendances();
        this.records = attendances;
        // Manejar el caso de no registros
        if (this.records.length === 0 && import.meta.env.DEV) {
          console.log('No hay registros de asistencia');
        }
      } catch (error) {
        this.error = 'Error al cargar las asistencias';
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },

    async saveAttendance(records: AttendanceRecord[]) {
      await addAttendance(records);
      this.fetchAttendance();
    },

    async updateAttendance(record: AttendanceRecord) {
      this.isLoading = true;
      this.error = null;

      try {
        await updateAttendance({
          studentId: record.studentId,
          classId: record.classId,
          Fecha: record.Fecha,
          status: record.status,
          justification: record.justification,
        } as Attendance);
        // Actualizar el estado global después de la actualización
        const updatedRecord = this.records.find(r => r.id === record.id);
        if (updatedRecord) {
          Object.assign(updatedRecord, record);
        }
      } catch (error) {
        this.error = 'Error al actualizar la asistencia';
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },
    
    // Método para almacenar justificaciones en caché antes de guardarlas
    cacheJustification(studentId: string, date: string, classId: string, reason: string, file: File | null) {
      const key = `${studentId}_${date}_${classId}`
      this.cachedJustifications[key] = {
        reason,
        file
      }
    },
    
    async updateAttendanceWithJustification(studentId: string, date: string, classId: string, reason: string, file: File | null) {
      this.isLoading = true;
      this.error = null;

      try {
        const result = await updateAttendanceWithJustification(studentId, date, classId, reason, file);
        // Almacenar la respuesta en el estado global si es necesario
        if (result) {
          console.log('Justificación actualizada con éxito');
        }
      } catch (error) {
        this.error = 'Error al actualizar la justificación';
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },
    
    async updateAnalytics() {
      const analytics: AttendanceAnalytics = {
        totalClasses: 0,
        totalStudents: 0,
        averageAttendance: 0,
        absentStudents: [],
        byClass: {}
      }

      // Group records by class
      this.records.forEach(record => {
        if (!analytics.byClass[record.classId]) {
          analytics.byClass[record.classId] = {
            present: 0,
            absent: 0,
            delayed: 0,
            justified: 0,
            total: 0
          }
        }

        analytics.byClass[record.classId].total++
        
        switch (record.status) {
          case 'Presente':
            analytics.byClass[record.classId].present++
            break
          case 'Ausente':
            analytics.byClass[record.classId].absent++
            break
          case 'Tardanza':
            analytics.byClass[record.classId].delayed++
            break
          case 'Justificado':
            analytics.byClass[record.classId].justified++
            break
        }
      })

      // Calculate totals
      analytics.totalClasses = Object.keys(analytics.byClass).length
      analytics.totalStudents = new Set(this.records.map(r => r.studentId)).size

      // Calculate average attendance
      const totalRecords = this.records.length
      const presentRecords = this.records.filter(r => 
        r.status === 'Presente' || r.status === 'Justificado'
      ).length
      analytics.averageAttendance = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0

      // Get absent students with attendance rates
      analytics.absentStudents = this.getMostAbsentStudents(10)

      this.analytics = analytics
    },
    
    async fetchAnalytics() {
      console.log('El método está en construcción: fetchAnalytics');
      // Lógica para obtener analytics
    },
    
    async fetchJustifications() {
      console.log('El método está en construcción: fetchJustifications');
      // Lógica para obtener justificaciones
    },
  }
})