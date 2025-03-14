import { ref, computed } from 'vue'
import { useTeachersStore } from '../stores/teachers'
import { useClassesStore } from '../stores/classes'
import { useStudentsStore } from '../stores/students'
import { format, parseISO, setDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { dayNameToNumber, dayNumberToName, validateDateDayCoherence } from '../utils/dateUtils'

export function useSchedule() {
  const teachersStore = useTeachersStore()
  const classesStore = useClassesStore()
  const studentsStore = useStudentsStore()

  const conflicts = ref<{
    teacherId: string
    classId: number
    type: 'overlap' | 'capacity' | 'level'
    description: string
  }[]>([])

  const schedule = computed(() => {
    const allClasses = classesStore.classes
    const allTeachers = teachersStore.teachers
    
    return allClasses.map(class_ => {
      const teacher = allTeachers.find(t => t.id === class_.teacherId)
      return {
        ...class_,
        teacher: teacher?.name || 'Sin asignar',
        students: class_.studentIds.length,
        hasConflict: conflicts.value.some(c => c.classId === class_.id)
      }
    })
  })

  const checkTimeOverlap = (time1: string, time2: string) => {
    const [start1, end1] = time1.split('-').map(t => t.trim())
    const [start2, end2] = time2.split('-').map(t => t.trim())
    
    return (start1 <= end2 && end1 >= start2)
  }

  const checkConflicts = () => {
    conflicts.value = []

    // Check schedule overlaps
    schedule.value.forEach(class1 => {
      schedule.value.forEach(class2 => {
        if (class1.id !== class2.id && 
            class1.teacherId === class2.teacherId &&
            checkTimeOverlap(class1.schedule, class2.schedule)) {
          conflicts.value.push({
            teacherId: class1.teacherId.toString(),
            classId: class1.id,
            type: 'overlap',
            description: `Conflicto de horario con ${class2.name}`
          })
        }
      })
    })

    // Check classroom capacity
    schedule.value.forEach(class_ => {
      if (class_.students > 10) {
        conflicts.value.push({
          teacherId: class_.teacherId.toString(),
          classId: class_.id,
          type: 'capacity',
          description: 'Excede la capacidad maxima del aula'
        })
      }
    })

    // Check student level compatibility
    schedule.value.forEach(class_ => {
      const students = studentsStore.students.filter(s => 
        class_.studentIds.includes(s.id)
      )
      
      if (students.some(s => s.level !== class_.level)) {
        conflicts.value.push({
          teacherId: class_.teacherId.toString(),
          classId: class_.id,
          type: 'level',
          description: 'Niveles de estudiantes incompatibles'
        })
      }
    })

    return conflicts.value
  }

  const optimizeSchedule = () => {
    // Implement schedule optimization logic
    const optimizedSchedule = [...schedule.value]
    
    // Sort by priority and constraints
    optimizedSchedule.sort((a, b) => {
      // Consider factors like:
      // - Number of students
      // - Teacher availability
      // - Room availability
      // - Level requirements
      return 0 // Placeholder
    })

    return optimizedSchedule
  }

  const suggestChanges = () => {
    const suggestions = []
    
    // Analyze current schedule
    for (const conflict of conflicts.value) {
      switch (conflict.type) {
        case 'overlap':
          suggestions.push({
            type: 'reschedule',
            classId: conflict.classId,
            description: 'Sugerir horario alternativo'
          })
          break
        case 'capacity':
          suggestions.push({
            type: 'split',
            classId: conflict.classId,
            description: 'Dividir en dos grupos'
          })
          break
        case 'level':
          suggestions.push({
            type: 'regroup',
            classId: conflict.classId,
            description: 'Reagrupar estudiantes por nivel'
          })
          break
      }
    }

    return suggestions
  }

  // Usar TimeZone local
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  
  const getCurrentDayName = () => {
    const date = new Date()
    return format(date, 'EEEE', { locale: es }).toLowerCase()
  }

  const getNextDayForClass = (className: string, scheduleConfig: any) => {
    const today = new Date()
    let targetDay: number

    if (typeof scheduleConfig === 'string') {
      // Buscar el primer día mencionado en el string del horario
      for (const [name, number] of Object.entries(dayNameToNumber)) {
        if (scheduleConfig.toLowerCase().includes(name)) {
          targetDay = number
          break
        }
      }
    } else if (scheduleConfig?.days?.length > 0) {
      // Usar el primer día configurado
      targetDay = dayNameToNumber[scheduleConfig.days[0].toLowerCase()]
    }

    if (targetDay !== undefined) {
      // Obtener la próxima fecha para ese día
      const nextDate = setDay(today, targetDay, { weekStartsOn: 1 })
      if (nextDate < today) {
        // Si la fecha ya pasó, ir a la próxima semana
        nextDate.setDate(nextDate.getDate() + 7)
      }
      return format(nextDate, 'yyyy-MM-dd')
    }

    return null
  }

  const validateSchedule = (date: string, scheduleConfig: any) => {
    const dayName = format(parseISO(date), 'EEEE', { locale: es }).toLowerCase()
    
    if (typeof scheduleConfig === 'string') {
      return scheduleConfig.toLowerCase().includes(dayName)
    } else if (scheduleConfig?.days?.length > 0) {
      return scheduleConfig.days.some((day: string) => 
        day.toLowerCase() === dayName
      )
    }
    
    return false
  }

  return {
    schedule,
    conflicts,
    checkConflicts,
    optimizeSchedule,
    suggestChanges,
    getCurrentDayName,
    getNextDayForClass,
    validateSchedule,
    timeZone
  }
}