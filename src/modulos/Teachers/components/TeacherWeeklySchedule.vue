<template>
  <div class="teacher-weekly-schedule">
    <!-- Calendario semanal -->
    <div class="weekly-grid overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="w-24 p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Hora
            </th>
            <th 
              v-for="day in weekDays" 
              :key="day" 
              class="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {{ day }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="hour in timeSlots" :key="hour">
            <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              {{ formatTime(hour) }}
            </td>
            <td 
              v-for="day in weekDays" 
              :key="`${day}-${hour}`"
              class="px-1 py-1 relative h-16 border-r border-gray-100 dark:border-gray-800 last:border-r-0"
            >
              <div
                v-for="class_ in getClassesForDayAndHour(day, hour)"
                :key="class_.id"
                :class="[
                  'absolute rounded-md p-2 shadow-sm overflow-hidden cursor-pointer transform transition-all hover:-translate-y-0.5 hover:shadow-md',
                  getClassBackgroundColor(class_)
                ]"
                :style="getClassPositionStyle(class_, hour)"
                @click="selectClass(class_)"
              >
                <div class="font-medium text-sm truncate">{{ class_.name }}</div>
                <div class="text-xs truncate">{{ formatClassTime(class_) }}</div>
                <div v-if="class_.classroom" class="text-xs truncate">{{ class_.classroom }}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detalle de clase seleccionada -->
    <div v-if="selectedClass" class="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-primary-500">
      <div class="flex justify-between items-start">
        <h3 class="text-lg font-bold">{{ selectedClass.name }}</h3>
        <button @click="selectedClass = null" class="text-gray-500 hover:text-gray-700">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div class="text-sm text-gray-500">Horario</div>
          <div class="font-medium">{{ formatClassSchedule(selectedClass) }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">Aula</div>
          <div class="font-medium">{{ selectedClass.classroom || 'Sin asignar' }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">Instrumento</div>
          <div class="font-medium">{{ selectedClass.instrument || 'No especificado' }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">Estudiantes</div>
          <div class="font-medium">{{ selectedClass.studentIds?.length || 0 }} estudiantes</div>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <router-link
          :to="`/teacher/attendance/${getCurrentDate()}/${selectedClass.id}`"
          class="btn btn-primary text-sm"
        >
          Tomar asistencia
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useClassesStore } from '../../Classes/store/classes'
import { format } from 'date-fns'
import { XMarkIcon } from '@heroicons/vue/24/outline'

// Estado reactivo
const selectedClass = ref(null)

// Días de la semana para mostrar en el calendario
const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Slots de tiempo para el calendario (de 7 a 19 horas)
const timeSlots = Array.from({ length: 13 }, (_, i) => i + 7)

const props = defineProps<{
  teacherId: string
  classes?: any[]
}>()

const classesStore = useClassesStore()

// Clases del profesor (ahora puede ser pasado como prop o consultado al store)
const teacherClasses = computed(() => {
  if (props.classes && props.classes.length > 0) {
    return props.classes
  }
  
  if (!props.teacherId) return []
  return classesStore.classes.filter(c => c.teacherId === props.teacherId)
})

// Cargar clases si aún no están cargadas
onMounted(async () => {
  console.log("Aqui")
  if (classesStore.classes.length === 0) {
    await classesStore.fetchClasses()
  }
})

// Observar cambios en el teacherId
watch(() => props.teacherId, async (newVal) => {
  if (newVal && classesStore.classes.length === 0) {
    await classesStore.fetchClasses()
  }
})

// Obtener clases para un día y hora específicos
const getClassesForDayAndHour = (day, hour) => {
  return teacherClasses.value.filter(class_ => {
    if (!class_.schedule) return false
    
    // Normalizar el formato de horario
    const schedule = normalizeSchedule(class_.schedule)
    
    return schedule.some(s => {
      if (s.day !== day) return false
      
      const startHour = parseInt(s.startTime.split(':')[0])
      const endHour = parseInt(s.endTime.split(':')[0])
      const startMinutes = parseInt(s.startTime.split(':')[1])
      const endMinutes = parseInt(s.endTime.split(':')[1])
      
      // Si la clase comienza en esta hora o está en curso durante esta hora
      return (startHour === hour) || 
             (startHour < hour && endHour > hour) ||
             (startHour < hour && endHour === hour && endMinutes > 0)
    })
  })
}

// Calcular la posición y altura de una clase en la cuadrícula
const getClassPositionStyle = (class_, slotHour) => {
  const schedule = normalizeSchedule(class_.schedule)[0] // Tomar el primer horario
  if (!schedule) return {}
  
  const startHour = parseInt(schedule.startTime.split(':')[0])
  const startMinute = parseInt(schedule.startTime.split(':')[1])
  const endHour = parseInt(schedule.endTime.split(':')[0])
  const endMinute = parseInt(schedule.endTime.split(':')[1])
  
  // Calcular la posición superior (top) basada en minutos después de la hora
  let top = '0%'
  if (startHour === slotHour) {
    top = `${(startMinute / 60) * 100}%`
  }
  
  // Calcular la altura basada en la duración
  let height = '100%'
  if (startHour === slotHour) {
    const durationInMinutes = (endHour - startHour) * 60 + (endMinute - startMinute)
    const slotDurationInMinutes = 60 - startMinute
    
    if (durationInMinutes < slotDurationInMinutes) {
      height = `${(durationInMinutes / 60) * 100}%`
    } else {
      height = `${(slotDurationInMinutes / 60) * 100}%`
    }
  }
  
  return {
    top,
    height,
    left: '2px',
    right: '2px'
  }
}

// Obtener color de fondo para la clase basado en algún criterio (ej: instrumento)
const getClassBackgroundColor = (class_) => {
  const instrument = class_.instrument?.toLowerCase() || ''
  
  if (instrument.includes('piano')) {
    return 'bg-blue-100 border border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200'
  }
  if (instrument.includes('violin') || instrument.includes('viola') || instrument.includes('cello')) {
    return 'bg-purple-100 border border-purple-300 text-purple-800 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-200'
  }
  if (instrument.includes('flauta') || instrument.includes('clarinete') || instrument.includes('saxo')) {
    return 'bg-green-100 border border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-200'
  }
  if (instrument.includes('percusión') || instrument.includes('batería')) {
    return 'bg-yellow-100 border border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200'
  }
  
  // Valor predeterminado
  return 'bg-gray-100 border border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
}

// Formatear la hora (de 24h a 12h con AM/PM)
const formatTime = (hour) => {
  return `${hour}:00`
}

// Formatear la hora de la clase
const formatClassTime = (class_) => {
  const schedule = normalizeSchedule(class_.schedule)[0]
  if (!schedule) return ''
  return `${schedule.startTime} - ${schedule.endTime}`
}

// Formatear el horario completo de la clase
const formatClassSchedule = (class_) => {
  const schedule = normalizeSchedule(class_.schedule)[0]
  if (!schedule) return 'Sin horario asignado'
  return `${schedule.day} ${schedule.startTime} - ${schedule.endTime}`
}

// Función para normalizar diferentes formatos de horario
const normalizeSchedule = (schedule) => {
  if (!schedule) return []
  
  // Si es array, se asume estructura correcta
  if (Array.isArray(schedule)) {
    return schedule.map(s => ({
      day: s.day || 'Lunes',
      startTime: s.startTime || '08:00',
      endTime: s.endTime || '09:30'
    }))
  }
  
  // Si es objeto con days como array
  if (typeof schedule === 'object' && schedule.days) {
    const days = Array.isArray(schedule.days) ? schedule.days : [schedule.days]
    return days.map(day => ({
      day: day,
      startTime: schedule.startTime || '08:00',
      endTime: schedule.endTime || '09:30'
    }))
  }
  
  // Si es string (formato antiguo: "Lunes 14:30 - 16:00")
  if (typeof schedule === 'string') {
    const parts = schedule.split(' ')
    if (parts.length >= 4) {
      return [{
        day: parts[0],
        startTime: parts[1],
        endTime: parts[3]
      }]
    }
  }
  
  return []
}

// Seleccionar una clase para mostrar sus detalles
const selectClass = (class_) => {
  selectedClass.value = class_
}

// Fecha actual para la URL de asistencia
const getCurrentDate = () => {
  return format(new Date(), 'yyyyMMdd')
}
</script>

<style scoped>
.weekly-grid {
  background: #ffffff;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.dark .weekly-grid {
  background: #1f2937;
}

.btn {
  @apply px-3 py-2 rounded-md font-medium text-sm transition-colors;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700;
}
</style>
