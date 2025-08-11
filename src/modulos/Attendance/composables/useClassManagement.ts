import { ref, watch } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface ClassForDay {
  id: string
  name: string
  teacherName: string
  time: string
  status: 'pending' | 'completed' | 'missed'
  studentsCount?: number
  attendanceCount?: number
}

export function useClassManagement(selectedDate: any) {
  // Estado
  const showDrawer = ref<boolean>(false)
  const loading = ref<boolean>(false)
  const classesForSelectedDate = ref<ClassForDay[]>([])

  // Métodos
  const closeDrawer = (): void => {
    showDrawer.value = false
  }

  const formatTime = (date: Date): string => {
    return format(date, 'HH:mm')
  }

  const loadClassesForSelectedDate = async (): Promise<void> => {
    if (!selectedDate.value) {
      showDrawer.value = false
      return
    }

    try {
      loading.value = true
      showDrawer.value = true
      
      // Simulación de carga de datos
      // En una implementación real, esto haría una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Datos de ejemplo
      classesForSelectedDate.value = [
        {
          id: '1',
          name: 'Clase de Guitarra Avanzada',
          teacherName: 'Prof. Carlos Martínez',
          time: '10:00 - 11:30',
          status: 'pending',
          studentsCount: 8,
          attendanceCount: 0
        },
        {
          id: '2',
          name: 'Taller de Composición',
          teacherName: 'Prof. Ana García',
          time: '16:00 - 18:00',
          status: 'completed',
          studentsCount: 12,
          attendanceCount: 10
        },
        {
          id: '3',
          name: 'Iniciación al Piano',
          teacherName: 'Prof. Luis Rodríguez',
          time: '18:30 - 20:00',
          status: 'missed',
          studentsCount: 6,
          attendanceCount: 0
        }
      ]
    } catch (error) {
      console.error('Error al cargar las clases:', error)
      // Mostrar notificación de error
    } finally {
      loading.value = false
    }
  }

  // Watchers
  watch(selectedDate, (newDate: Date | null) => {
    if (newDate) {
      loadClassesForSelectedDate()
    } else {
      showDrawer.value = false
    }
  })

  return {
    // Estado
    showDrawer,
    loading,
    classesForSelectedDate,
    
    // Métodos
    closeDrawer,
    loadClassesForSelectedDate
  }
}
